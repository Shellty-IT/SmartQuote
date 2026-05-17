// src/components/publicOffer/InteractiveOffer.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PublicOfferData, OfferComment, PublicOfferAcceptResponse } from '@/types';
import { publicOffersApi, ApiError } from '@/lib/api';

import {
    ItemState,
    getVisibleItems,
    calculateTotals,
    buildSelectedItemsSummary,
    initializeItemStates
} from './utils';
import { OfferAcceptedView, OfferRejectedView, OfferExpiredView } from './views';
import OfferHeader from './OfferHeader';
import OfferItemsSection from './OfferItemsSection';
import OfferCalculator from './OfferCalculator';
import VariantSelector from './VariantSelector';
import { ErrorAlert, AuditTrailInfoAlert } from './OfferAlerts';
import OfferTerms from './OfferTerms';
import OfferActions from './OfferActions';
import CommentSection from './CommentSection';
import AcceptDialog from './AcceptDialog';
import type { AcceptAuditData } from './AcceptDialog';
import RejectDialog from './RejectDialog';

interface InteractiveOfferProps {
    token: string;
    data: PublicOfferData;
}

export default function InteractiveOffer({ token, data }: InteractiveOfferProps) {
    const { offer, expired, decided, variants, requireAuditTrail, acceptanceLog } = data;
    const isFinalized = decided || expired;
    const hasVariants = variants.length > 0;
    const primaryColor = offer.seller.primaryColor || '#0891b2';

    const [selectedVariant, setSelectedVariant] = useState<string | null>(
        hasVariants ? variants[0] : null
    );
    const [itemStates, setItemStates] = useState<Record<string, ItemState>>(() =>
        initializeItemStates(offer.items)
    );
    const [comments, setComments] = useState<OfferComment[]>(offer.comments);
    const [isSendingComment, setIsSendingComment] = useState(false);
    const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [isAccepting, setIsAccepting] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [finalStatus, setFinalStatus] = useState<'ACCEPTED' | 'REJECTED' | null>(
        offer.status === 'ACCEPTED' ? 'ACCEPTED' : offer.status === 'REJECTED' ? 'REJECTED' : null
    );
    const [acceptResult, setAcceptResult] = useState<PublicOfferAcceptResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const trackingTimeout = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        document.documentElement.style.setProperty('--primary-color', primaryColor);
        return () => {
            document.documentElement.style.removeProperty('--primary-color');
        };
    }, [primaryColor]);

    useEffect(() => {
        publicOffersApi.registerView(token).catch(() => {});
    }, [token]);

    const trackSelectionDebounced = useCallback(
        (states: Record<string, ItemState>, variant: string | null) => {
            if (trackingTimeout.current) {
                clearTimeout(trackingTimeout.current);
            }
            trackingTimeout.current = setTimeout(() => {
                const items = Object.entries(states).map(([id, state]) => ({
                    id,
                    isSelected: state.isSelected,
                    quantity: state.quantity,
                }));
                publicOffersApi.trackSelection(token, items, variant || undefined).catch(() => {});
            }, 2000);
        },
        [token]
    );

    const handleToggle = useCallback(
        (id: string, selected: boolean) => {
            setItemStates((prev) => {
                const next = { ...prev, [id]: { ...prev[id], isSelected: selected } };
                trackSelectionDebounced(next, selectedVariant);
                return next;
            });
        },
        [trackSelectionDebounced, selectedVariant]
    );

    const handleQuantityChange = useCallback(
        (id: string, quantity: number) => {
            setItemStates((prev) => {
                const next = { ...prev, [id]: { ...prev[id], quantity } };
                trackSelectionDebounced(next, selectedVariant);
                return next;
            });
        },
        [trackSelectionDebounced, selectedVariant]
    );

    const handleVariantSwitch = useCallback(
        (variant: string) => {
            setSelectedVariant(variant);
            trackSelectionDebounced(itemStates, variant);
        },
        [trackSelectionDebounced, itemStates]
    );

    const handleAddComment = useCallback(
        async (content: string) => {
            setIsSendingComment(true);
            try {
                const response = await publicOffersApi.addComment(token, content);
                if (response.data) {
                    setComments((prev) => [...prev, response.data!]);
                }
            } catch (err) {
                setError(err instanceof ApiError ? err.message : 'Nie udało się wysłać komentarza');
            } finally {
                setIsSendingComment(false);
            }
        },
        [token]
    );

    const handleAccept = useCallback(
        async (auditData?: AcceptAuditData) => {
            setIsAccepting(true);
            setError(null);

            try {
                const selectedItems = Object.entries(itemStates).map(([id, state]) => ({
                    id,
                    isSelected: state.isSelected,
                    quantity: state.quantity,
                }));

                const response = await publicOffersApi.accept(token, {
                    confirmationChecked: true,
                    selectedVariant: selectedVariant || undefined,
                    clientName: auditData?.clientName,
                    clientEmail: auditData?.clientEmail,
                    selectedItems,
                });

                setAcceptResult(response.data as unknown as PublicOfferAcceptResponse ?? null);
                setFinalStatus('ACCEPTED');
                setAcceptDialogOpen(false);
            } catch (err) {
                setError(err instanceof ApiError ? err.message : 'Nie udało się zaakceptować oferty');
            } finally {
                setIsAccepting(false);
            }
        },
        [token, itemStates, selectedVariant]
    );

    const handleReject = useCallback(
        async (reason?: string) => {
            setIsRejecting(true);
            setError(null);

            try {
                await publicOffersApi.reject(token, { reason });
                setFinalStatus('REJECTED');
                setRejectDialogOpen(false);
            } catch (err) {
                setError(err instanceof ApiError ? err.message : 'Nie udało się odrzucić oferty');
            } finally {
                setIsRejecting(false);
            }
        },
        [token]
    );

    const visibleItems = getVisibleItems(offer.items, variants, selectedVariant);
    const totals = calculateTotals(offer.items, itemStates, variants, selectedVariant);
    const selectedItemsSummary = buildSelectedItemsSummary(visibleItems, itemStates);

    const auditTrailData = acceptResult?.auditTrail || (acceptanceLog ? {
        contentHash: acceptanceLog.contentHash,
        ipAddress: 'recorded',
        acceptedAt: acceptanceLog.acceptedAt,
    } : null);

    if (finalStatus === 'ACCEPTED') {
        return (
            <OfferAcceptedView
                offerNumber={offer.number}
                offerTitle={offer.title}
                selectedVariant={selectedVariant}
                totalGross={totals.totalGross}
                primaryColor={primaryColor}
                auditTrailData={auditTrailData}
            />
        );
    }

    if (finalStatus === 'REJECTED') {
        return <OfferRejectedView offerNumber={offer.number} />;
    }

    if (expired) {
        return (
            <OfferExpiredView
                offerNumber={offer.number}
                sellerEmail={offer.seller.email}
                primaryColor={primaryColor}
            />
        );
    }

    return (
        <div className="space-y-6">
            <OfferHeader
                seller={offer.seller}
                client={offer.client}
                offerNumber={offer.number}
                title={offer.title}
                description={offer.description}
                createdAt={offer.createdAt}
                validUntil={offer.validUntil}
                expired={expired}
                primaryColor={primaryColor}
            />

            {error && (
                <ErrorAlert
                    message={error}
                    onDismiss={() => setError(null)}
                />
            )}

            {requireAuditTrail && <AuditTrailInfoAlert />}

            {hasVariants && (
                <VariantSelector
                    variants={variants}
                    selectedVariant={selectedVariant}
                    onSelect={handleVariantSwitch}
                    disabled={isFinalized}
                    primaryColor={primaryColor}
                />
            )}

            <OfferItemsSection
                items={visibleItems}
                itemStates={itemStates}
                selectedVariant={selectedVariant}
                onToggle={handleToggle}
                onQuantityChange={handleQuantityChange}
                disabled={isFinalized}
                primaryColor={primaryColor}
            />

            <OfferCalculator
                totalNet={totals.totalNet}
                totalVat={totals.totalVat}
                totalGross={totals.totalGross}
                currency={offer.currency}
                selectedCount={totals.selectedCount}
                totalCount={totals.totalVisible}
                primaryColor={primaryColor}
            />

            <OfferTerms
                terms={offer.terms || ''}
                paymentDays={offer.paymentDays}
            />

            <CommentSection
                comments={comments}
                onAddComment={handleAddComment}
                disabled={isFinalized}
                isSending={isSendingComment}
                primaryColor={primaryColor}
            />

            {!isFinalized && (
                <OfferActions
                    onAccept={() => setAcceptDialogOpen(true)}
                    onReject={() => setRejectDialogOpen(true)}
                />
            )}

            <AcceptDialog
                isOpen={acceptDialogOpen}
                onClose={() => setAcceptDialogOpen(false)}
                onConfirm={handleAccept}
                offerNumber={offer.number}
                clientName={offer.client.name}
                clientCompany={offer.client.company}
                selectedItems={selectedItemsSummary}
                totalGross={totals.totalGross}
                isLoading={isAccepting}
                requireAuditTrail={requireAuditTrail}
                primaryColor={primaryColor}
            />

            <RejectDialog
                isOpen={rejectDialogOpen}
                onClose={() => setRejectDialogOpen(false)}
                onConfirm={handleReject}
                offerNumber={offer.number}
                isLoading={isRejecting}
            />
        </div>
    );
}
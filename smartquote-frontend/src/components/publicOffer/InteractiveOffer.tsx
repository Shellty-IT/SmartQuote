// SmartQuote-AI/src/components/publicOffer/InteractiveOffer.tsx

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PublicOfferData, PublicOfferItem, OfferComment } from '@/types';
import { publicOffersApi, ApiError } from '@/lib/api';
import OfferHeader from './OfferHeader';
import OfferItemRow from './OfferItemRow';
import OfferCalculator from './OfferCalculator';
import AcceptDialog from './AcceptDialog';
import RejectDialog from './RejectDialog';
import CommentSection from './CommentSection';

interface InteractiveOfferProps {
    token: string;
    data: PublicOfferData;
}

interface ItemState {
    isSelected: boolean;
    quantity: number;
}

function calculateTotals(
    items: PublicOfferItem[],
    itemStates: Record<string, ItemState>
) {
    let totalNet = 0;
    let totalVat = 0;
    let totalGross = 0;
    let selectedCount = 0;

    items.forEach((item) => {
        const state = itemStates[item.id];
        if (!state) return;

        const isSelected = item.isOptional ? state.isSelected : true;
        if (!isSelected) return;

        selectedCount++;

        const quantity = state.quantity;
        const unitPrice = Number(item.unitPrice);
        const vatRate = Number(item.vatRate);
        const discount = Number(item.discount) || 0;

        const discountMultiplier = 1 - discount / 100;
        const lineNet = quantity * unitPrice * discountMultiplier;
        const lineVat = lineNet * (vatRate / 100);

        totalNet += lineNet;
        totalVat += lineVat;
        totalGross += lineNet + lineVat;
    });

    return {
        totalNet: Math.round(totalNet * 100) / 100,
        totalVat: Math.round(totalVat * 100) / 100,
        totalGross: Math.round(totalGross * 100) / 100,
        selectedCount,
    };
}

export default function InteractiveOffer({ token, data }: InteractiveOfferProps) {
    const { offer, expired, decided } = data;
    const isFinalized = decided || expired;

    const [itemStates, setItemStates] = useState<Record<string, ItemState>>(() => {
        const states: Record<string, ItemState> = {};
        offer.items.forEach((item) => {
            states[item.id] = {
                isSelected: item.isSelected,
                quantity: Number(item.quantity),
            };
        });
        return states;
    });

    const [comments, setComments] = useState<OfferComment[]>(offer.comments);
    const [isSendingComment, setIsSendingComment] = useState(false);
    const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [isAccepting, setIsAccepting] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [finalStatus, setFinalStatus] = useState<'ACCEPTED' | 'REJECTED' | null>(
        offer.status === 'ACCEPTED' ? 'ACCEPTED' : offer.status === 'REJECTED' ? 'REJECTED' : null
    );
    const [error, setError] = useState<string | null>(null);

    const trackingTimeout = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        publicOffersApi.registerView(token).catch(() => {});
    }, [token]);

    const trackSelectionDebounced = useCallback(
        (states: Record<string, ItemState>) => {
            if (trackingTimeout.current) {
                clearTimeout(trackingTimeout.current);
            }
            trackingTimeout.current = setTimeout(() => {
                const items = Object.entries(states).map(([id, state]) => ({
                    id,
                    isSelected: state.isSelected,
                    quantity: state.quantity,
                }));
                publicOffersApi.trackSelection(token, items).catch(() => {});
            }, 2000);
        },
        [token]
    );

    const handleToggle = useCallback(
        (id: string, selected: boolean) => {
            setItemStates((prev) => {
                const next = { ...prev, [id]: { ...prev[id], isSelected: selected } };
                trackSelectionDebounced(next);
                return next;
            });
        },
        [trackSelectionDebounced]
    );

    const handleQuantityChange = useCallback(
        (id: string, quantity: number) => {
            setItemStates((prev) => {
                const next = { ...prev, [id]: { ...prev[id], quantity } };
                trackSelectionDebounced(next);
                return next;
            });
        },
        [trackSelectionDebounced]
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

    const handleAccept = useCallback(async () => {
        setIsAccepting(true);
        setError(null);

        try {
            const selectedItems = Object.entries(itemStates).map(([id, state]) => ({
                id,
                isSelected: state.isSelected,
                quantity: state.quantity,
            }));

            await publicOffersApi.accept(token, {
                confirmationChecked: true,
                selectedItems,
            });

            setFinalStatus('ACCEPTED');
            setAcceptDialogOpen(false);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Nie udało się zaakceptować oferty');
        } finally {
            setIsAccepting(false);
        }
    }, [token, itemStates]);

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

    const totals = calculateTotals(offer.items, itemStates);

    const selectedItemsSummary = offer.items
        .filter((item) => {
            const state = itemStates[item.id];
            return item.isOptional ? state?.isSelected : true;
        })
        .map((item) => {
            const state = itemStates[item.id];
            const quantity = state?.quantity || Number(item.quantity);
            const unitPrice = Number(item.unitPrice);
            const discount = Number(item.discount) || 0;
            const vatRate = Number(item.vatRate);
            const discountMultiplier = 1 - discount / 100;
            const lineNet = quantity * unitPrice * discountMultiplier;
            const lineGross = lineNet + lineNet * (vatRate / 100);

            return {
                name: item.name,
                quantity,
                unit: item.unit,
                brutto: Math.round(lineGross * 100) / 100,
            };
        });

    if (finalStatus === 'ACCEPTED') {
        return (
            <div className="max-w-2xl mx-auto text-center py-16 px-4">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center">
                    <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h1 className="text-3xl font-bold text-slate-900 mb-3">
                    Oferta zaakceptowana!
                </h1>
                <p className="text-lg text-slate-600 mb-2">
                    Dziękujemy za akceptację oferty <span className="font-semibold">{offer.number}</span>.
                </p>
                <p className="text-slate-500 mb-8">
                    Sprzedawca został powiadomiony i wkrótce się z Tobą skontaktuje.
                </p>
                <div className="bg-slate-900 rounded-xl p-6 inline-block">
                    <p className="text-slate-400 text-sm mb-1">Zaakceptowana kwota brutto</p>
                    <p className="text-3xl font-bold text-cyan-400">
                        {new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(totals.totalGross)}
                    </p>
                </div>
            </div>
        );
    }

    if (finalStatus === 'REJECTED') {
        return (
            <div className="max-w-2xl mx-auto text-center py-16 px-4">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
                    <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>
                <h1 className="text-3xl font-bold text-slate-900 mb-3">
                    Oferta odrzucona
                </h1>
                <p className="text-lg text-slate-600 mb-2">
                    Oferta <span className="font-semibold">{offer.number}</span> została odrzucona.
                </p>
                <p className="text-slate-500">
                    Sprzedawca został powiadomiony o Twojej decyzji.
                </p>
            </div>
        );
    }

    if (expired) {
        return (
            <div className="max-w-2xl mx-auto text-center py-16 px-4">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-100 flex items-center justify-center">
                    <svg className="w-10 h-10 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h1 className="text-3xl font-bold text-slate-900 mb-3">
                    Oferta wygasła
                </h1>
                <p className="text-lg text-slate-600 mb-2">
                    Termin ważności oferty <span className="font-semibold">{offer.number}</span> minął.
                </p>
                <p className="text-slate-500">
                    Skontaktuj się ze sprzedawcą, aby uzyskać aktualną ofertę.
                </p>
                {offer.seller.email && (
                    <a
                        href={`mailto:${offer.seller.email}`}
                        className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-cyan-500 text-white font-medium rounded-xl hover:bg-cyan-600 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Napisz do sprzedawcy
                    </a>
                )}
            </div>
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
            />

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        <p className="text-sm font-medium text-red-800">{error}</p>
                        <button
                            onClick={() => setError(null)}
                            className="text-xs text-red-600 hover:text-red-700 mt-1 underline"
                        >
                            Zamknij
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-slate-900">
                        Pozycje oferty
                    </h2>
                    {offer.items.some((i) => i.isOptional) && (
                        <p className="text-xs text-slate-400">
                            Pozycje opcjonalne możesz zaznaczyć lub odznaczyć
                        </p>
                    )}
                </div>
                <div className="space-y-3">
                    {offer.items.map((item) => (
                        <OfferItemRow
                            key={item.id}
                            item={item}
                            isSelected={
                                item.isOptional
                                    ? (itemStates[item.id]?.isSelected ?? item.isSelected)
                                    : true
                            }
                            quantity={itemStates[item.id]?.quantity ?? Number(item.quantity)}
                            onToggle={handleToggle}
                            onQuantityChange={handleQuantityChange}
                            disabled={isFinalized}
                        />
                    ))}
                </div>
            </div>

            <OfferCalculator
                totalNet={totals.totalNet}
                totalVat={totals.totalVat}
                totalGross={totals.totalGross}
                currency={offer.currency}
                selectedCount={totals.selectedCount}
                totalCount={offer.items.length}
            />

            {offer.terms && (
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">
                        Warunki
                    </h3>
                    <p className="text-slate-700 whitespace-pre-wrap text-sm leading-relaxed">
                        {offer.terms}
                    </p>
                    {offer.paymentDays > 0 && (
                        <p className="text-sm text-slate-500 mt-3">
                            Termin płatności: <span className="font-medium text-slate-700">{offer.paymentDays} dni</span>
                        </p>
                    )}
                </div>
            )}

            <CommentSection
                comments={comments}
                onAddComment={handleAddComment}
                disabled={isFinalized}
                isSending={isSendingComment}
            />

            {!isFinalized && (
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => setAcceptDialogOpen(true)}
                            className="flex-1 px-6 py-4 rounded-xl bg-emerald-600 text-white font-semibold text-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-3"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Akceptuję ofertę
                        </button>
                        <button
                            onClick={() => setRejectDialogOpen(true)}
                            className="flex-1 sm:flex-initial px-6 py-4 rounded-xl border-2 border-slate-200 text-slate-600 font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center justify-center gap-3"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Odrzucam
                        </button>
                    </div>
                </div>
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
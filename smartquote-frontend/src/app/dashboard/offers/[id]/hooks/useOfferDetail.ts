// src/app/dashboard/offers/[id]/hooks/useOfferDetail.ts

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useOffer, useOfferAnalytics, useOfferComments } from '@/hooks/useOffers';
import { offersApi, ai, ksefApi } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { useTranslations } from '@/i18n';

import { groupByVariant } from '../utils';
import { STATUS_TRANSITIONS } from '../constants';
import type { Tab } from '../constants';
import type { OfferStatus } from '@/types';
import type { ObserverInsight, ClosingStrategy } from '@/types/ai';
import type { KsefAvailability } from '@/types/ksef.types';

export function useOfferDetail(offerId: string) {
    const router = useRouter();
    const toast = useToast();
    const tr = useTranslations('offerDetail');
    const commonTr = useTranslations('common');
    const statusTr = useTranslations('statuses');
    const { data: session } = useSession();
    const { offer, isLoading, error, refresh } = useOffer(offerId);
    const { analytics, refresh: refreshAnalytics } = useOfferAnalytics(offerId);
    const { comments, isSending, addComment, refresh: refreshComments } = useOfferComments(offerId);

    const [activeTab, setActiveTab] = useState<Tab>('details');
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
    const [isPreviewingPDF, setIsPreviewingPDF] = useState(false);
    const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
    const [pdfPreviewError, setPdfPreviewError] = useState<string | null>(null);
    const [publishDialogOpen, setPublishDialogOpen] = useState(false);
    const [newComment, setNewComment] = useState('');

    const [observerInsight, setObserverInsight] = useState<ObserverInsight | null>(null);
    const [isLoadingObserver, setIsLoadingObserver] = useState(false);
    const [observerError, setObserverError] = useState<string | null>(null);

    const [closingStrategy, setClosingStrategy] = useState<ClosingStrategy | null>(null);
    const [isLoadingCloser, setIsLoadingCloser] = useState(false);
    const [closerError, setCloserError] = useState<string | null>(null);
    const [expandedStrategy, setExpandedStrategy] = useState<string | null>(null);

    const [ksefModalOpen, setKsefModalOpen] = useState(false);

    const variantData = useMemo(() => {
        if (!offer?.items) return { groups: [], variantNames: [] };
        return groupByVariant(offer.items);
    }, [offer]);

    const availableTransitions = offer
        ? STATUS_TRANSITIONS[offer.status as OfferStatus] || []
        : [];

    const isExpired: boolean = offer?.validUntil
        ? new Date(offer.validUntil) < new Date()
        : false;

    const offerReadyForInvoice = offer?.status === 'ACCEPTED' && !offer?.invoiceSentAt;
    const invoiceAlreadySent = offer?.status === 'ACCEPTED' && !!offer?.invoiceSentAt;

    const [ksefAvailability, setKsefAvailability] = useState<KsefAvailability | null>(null);
    const [isCheckingKsef, setIsCheckingKsef] = useState(false);

    useEffect(() => {
        if (!offerReadyForInvoice) return;
        let cancelled = false;
        setIsCheckingKsef(true);
        ksefApi
            .availability()
            .then((res) => {
                if (!cancelled) setKsefAvailability(res);
            })
            .catch(() => {
                if (!cancelled) setKsefAvailability({ available: false, reason: 'KSEF_UNREACHABLE' });
            })
            .finally(() => {
                if (!cancelled) setIsCheckingKsef(false);
            });
        return () => {
            cancelled = true;
        };
    }, [offerReadyForInvoice]);

    const canGenerateInvoice = offerReadyForInvoice && ksefAvailability?.available === true;

    const handleCopyHash = async (hash: string) => {
        try {
            await navigator.clipboard.writeText(hash);
            toast.info(tr.toasts.hashCopied, tr.toasts.hashCopiedDesc);
        } catch {
            toast.error(commonTr.errorTitle, tr.toasts.hashCopyError);
        }
    };

    const handleLoadObserver = async () => {
        setIsLoadingObserver(true);
        setObserverError(null);
        try {
            const data = await ai.observerInsight(offerId);
            setObserverInsight(data);
        } catch (err) {
            setObserverError(err instanceof Error ? err.message : tr.toasts.observerError);
        } finally {
            setIsLoadingObserver(false);
        }
    };

    const handleLoadCloser = async () => {
        setIsLoadingCloser(true);
        setCloserError(null);
        try {
            const data = await ai.closingStrategy(offerId);
            setClosingStrategy(data);
        } catch (err) {
            setCloserError(err instanceof Error ? err.message : tr.toasts.closerError);
        } finally {
            setIsLoadingCloser(false);
        }
    };

    const handleUseStrategy = (text: string) => {
        setNewComment(text);
        setExpandedStrategy(null);
    };

    const handleStatusChange = async (newStatus: OfferStatus) => {
        if (!offer) return;
        setIsUpdatingStatus(true);
        try {
            await offersApi.update(offer.id, { status: newStatus });
            await refresh();
            toast.success(tr.toasts.statusChanged, (statusTr as Record<string, string>)[newStatus] ?? newStatus);
        } catch {
            toast.error(commonTr.errorTitle, tr.toasts.statusError);
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleDelete = async () => {
        if (!offer) return;
        setIsDeleting(true);
        try {
            await offersApi.delete(offer.id);
            toast.success(tr.toasts.deleted, offer.number);
            router.push('/dashboard/offers');
        } catch {
            toast.error(commonTr.errorTitle, tr.toasts.deleteError);
            setIsDeleting(false);
        }
    };

    const handleDuplicate = async () => {
        if (!offer) return;
        try {
            const response = await offersApi.duplicate(offer.id);
            if (response.data?.id) {
                toast.success(tr.toasts.duplicated, tr.toasts.duplicatedDesc);
                router.push(`/dashboard/offers/${response.data.id}/edit`);
            }
        } catch {
            toast.error(commonTr.errorTitle, tr.toasts.duplicateError);
        }
    };

    const fetchOfferPdfBlob = useCallback(async () => {
        if (!offer) return;
        const token = session?.accessToken || localStorage.getItem('token');
        if (!token) {
            toast.error(tr.toasts.noAuth, tr.toasts.noAuthDesc);
            return;
        }

        const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
        const response = await fetch(`${apiUrl}/api/offers/${offer.id}/pdf`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error((errorData as { message?: string }).message || `Error ${response.status}`);
        }

        return response.blob();
    }, [offer, session?.accessToken, toast, tr.toasts.noAuth, tr.toasts.noAuthDesc]);

    const handleDownloadPDF = async () => {
        if (!offer) return;
        setIsDownloadingPDF(true);
        try {
            const blob = await fetchOfferPdfBlob();
            if (!blob) return;
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Offer_${offer.number.replace(/\//g, '-')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success(tr.toasts.pdfDownloaded, offer.number);
        } catch (err) {
            toast.error(tr.toasts.pdfError, err instanceof Error ? err.message : commonTr.errorTitle);
        } finally {
            setIsDownloadingPDF(false);
        }
    };

    const handlePreviewPDF = async () => {
        if (!offer) return;
        setIsPreviewingPDF(true);
        setPdfPreviewError(null);
        try {
            const blob = await fetchOfferPdfBlob();
            if (!blob) return;
            setPdfPreviewUrl((currentUrl) => {
                if (currentUrl) window.URL.revokeObjectURL(currentUrl);
                return window.URL.createObjectURL(blob);
            });
            setPdfPreviewOpen(true);
        } catch (err) {
            const message = err instanceof Error ? err.message : commonTr.errorTitle;
            setPdfPreviewError(message);
            setPdfPreviewOpen(true);
            toast.error(tr.toasts.pdfError, message);
        } finally {
            setIsPreviewingPDF(false);
        }
    };

    const handleClosePdfPreview = useCallback(() => {
        setPdfPreviewOpen(false);
        setPdfPreviewError(null);
        setPdfPreviewUrl((currentUrl) => {
            if (currentUrl) window.URL.revokeObjectURL(currentUrl);
            return null;
        });
    }, []);

    useEffect(() => {
        return () => {
            if (pdfPreviewUrl) {
                window.URL.revokeObjectURL(pdfPreviewUrl);
            }
        };
    }, [pdfPreviewUrl]);

    const handlePublished = () => {
        refresh();
        refreshAnalytics();
    };

    const handleAddSellerComment = async () => {
        const trimmed = newComment.trim();
        if (!trimmed || isSending) return;
        await addComment(trimmed);
        setNewComment('');
    };

    const handleKsefSent = () => {
        refresh();
    };

    return {
        offer,
        isLoading,
        error,
        refresh,
        analytics,
        refreshAnalytics,
        comments,
        isSending,
        refreshComments,

        activeTab,
        setActiveTab,
        isUpdatingStatus,
        deleteModal,
        setDeleteModal,
        isDeleting,
        isDownloadingPDF,
        isPreviewingPDF,
        pdfPreviewOpen,
        pdfPreviewUrl,
        pdfPreviewError,
        publishDialogOpen,
        setPublishDialogOpen,
        newComment,
        setNewComment,

        observerInsight,
        isLoadingObserver,
        observerError,
        closingStrategy,
        isLoadingCloser,
        closerError,
        expandedStrategy,
        setExpandedStrategy,

        ksefModalOpen,
        setKsefModalOpen,
        canGenerateInvoice,
        offerReadyForInvoice,
        invoiceAlreadySent,
        ksefAvailability,
        isCheckingKsef,
        handleKsefSent,

        variantData,
        availableTransitions,
        isExpired,

        handleCopyHash,
        handleLoadObserver,
        handleLoadCloser,
        handleUseStrategy,
        handleStatusChange,
        handleDelete,
        handleDuplicate,
        handlePreviewPDF,
        handleClosePdfPreview,
        handleDownloadPDF,
        handlePublished,
        handleAddSellerComment,

        router,
    };
}

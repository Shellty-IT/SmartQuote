// src/app/dashboard/offers/[id]/hooks/useOfferDetail.ts

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useOffer, useOfferAnalytics, useOfferComments } from '@/hooks/useOffers';
import { offersApi, ai } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { getStatusConfig } from '@/lib/utils';
import { groupByVariant } from '../utils';
import { STATUS_TRANSITIONS } from '../constants';
import type { Tab } from '../constants';
import type { OfferStatus } from '@/types';
import type { ObserverInsight, ClosingStrategy } from '@/types/ai';

export function useOfferDetail(offerId: string) {
    const router = useRouter();
    const toast = useToast();
    const { data: session } = useSession();
    const { offer, isLoading, error, refresh } = useOffer(offerId);
    const { analytics, refresh: refreshAnalytics } = useOfferAnalytics(offerId);
    const { comments, isSending, addComment, refresh: refreshComments } = useOfferComments(offerId);

    const [activeTab, setActiveTab] = useState<Tab>('details');
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
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
    }, [offer?.items]);

    const availableTransitions = offer
        ? STATUS_TRANSITIONS[offer.status as OfferStatus] || []
        : [];

    const isExpired: boolean = offer?.validUntil
        ? new Date(offer.validUntil) < new Date()
        : false;

    const canGenerateInvoice = offer?.status === 'ACCEPTED' && !offer?.invoiceSentAt;
    const invoiceAlreadySent = offer?.status === 'ACCEPTED' && !!offer?.invoiceSentAt;

    const handleCopyHash = async (hash: string) => {
        try {
            await navigator.clipboard.writeText(hash);
            toast.info('Skopiowano', 'Hash skopiowany do schowka');
        } catch {
            toast.error('Błąd', 'Nie udało się skopiować do schowka');
        }
    };

    const handleLoadObserver = async () => {
        setIsLoadingObserver(true);
        setObserverError(null);
        try {
            const data = await ai.observerInsight(offerId);
            setObserverInsight(data);
        } catch (err) {
            setObserverError(err instanceof Error ? err.message : 'Błąd analizy');
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
            setCloserError(err instanceof Error ? err.message : 'Błąd generowania strategii');
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
            const statusConfig = getStatusConfig(newStatus);
            toast.success('Status zmieniony', `Oferta: ${statusConfig.label}`);
        } catch {
            toast.error('Błąd', 'Nie udało się zmienić statusu oferty');
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleDelete = async () => {
        if (!offer) return;
        setIsDeleting(true);
        try {
            await offersApi.delete(offer.id);
            toast.success('Oferta usunięta', `${offer.number} została usunięta`);
            router.push('/dashboard/offers');
        } catch {
            toast.error('Błąd', 'Nie udało się usunąć oferty');
            setIsDeleting(false);
        }
    };

    const handleDuplicate = async () => {
        if (!offer) return;
        try {
            const response = await offersApi.duplicate(offer.id);
            if (response.data?.id) {
                toast.success('Oferta zduplikowana', 'Możesz teraz edytować kopię');
                router.push(`/dashboard/offers/${response.data.id}/edit`);
            }
        } catch {
            toast.error('Błąd', 'Nie udało się zduplikować oferty');
        }
    };

    const handleDownloadPDF = async () => {
        if (!offer) return;
        const token = session?.accessToken || localStorage.getItem('token');
        if (!token) {
            toast.error('Brak autoryzacji', 'Zaloguj się ponownie');
            return;
        }
        setIsDownloadingPDF(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
            const response = await fetch(`${apiUrl}/offers/${offer.id}/pdf`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Błąd ${response.status}`);
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Oferta_${offer.number.replace(/\//g, '-')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success('PDF pobrany', `Oferta ${offer.number}`);
        } catch (err) {
            toast.error('Błąd PDF', err instanceof Error ? err.message : 'Wystąpił błąd podczas pobierania');
        } finally {
            setIsDownloadingPDF(false);
        }
    };

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
        invoiceAlreadySent,
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
        handleDownloadPDF,
        handlePublished,
        handleAddSellerComment,

        router,
    };
}
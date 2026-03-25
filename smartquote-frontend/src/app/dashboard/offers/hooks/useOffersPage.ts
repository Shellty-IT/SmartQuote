// src/app/dashboard/offers/hooks/useOffersPage.ts

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOffers, useOffersStats } from '@/hooks/useOffers';
import { offersApi } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { Offer, OfferStatus } from '@/types';

export function useOffersPage() {
    const router = useRouter();
    const toast = useToast();

    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<OfferStatus | ''>('');
    const [sort, setSort] = useState('createdAt:desc');
    const [page, setPage] = useState(1);

    const [sortBy, sortOrder] = sort.split(':');

    const { offers, total, isLoading, error, refresh } = useOffers({
        search: search || undefined,
        status: status || undefined,
        sortBy,
        sortOrder: sortOrder as 'asc' | 'desc',
        page,
        limit: 10,
    });

    const { stats, isLoading: statsLoading } = useOffersStats();

    const [deleteModal, setDeleteModal] = useState<Offer | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!deleteModal) return;
        setIsDeleting(true);
        try {
            await offersApi.delete(deleteModal.id);
            toast.success('Oferta usunięta', `"${deleteModal.title}" została usunięta`);
            setDeleteModal(null);
            refresh();
        } catch {
            toast.error('Błąd', 'Nie udało się usunąć oferty');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDuplicate = async (offer: Offer) => {
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

    const handleCopyLink = async (offer: Offer) => {
        if (!offer.publicToken) return;
        const url = `${window.location.origin}/offer/view/${offer.publicToken}`;
        try {
            await navigator.clipboard.writeText(url);
            toast.info('Link skopiowany', 'Link do oferty został skopiowany do schowka');
        } catch {
            toast.error('Błąd', 'Nie udało się skopiować linku');
        }
    };

    const getStatusCount = (statusKey: OfferStatus): number => {
        if (!stats?.byStatus) return 0;
        const statusData = stats.byStatus[statusKey];
        if (typeof statusData === 'number') return statusData;
        if (typeof statusData === 'object' && statusData !== null) {
            return (statusData as { count: number }).count || 0;
        }
        return 0;
    };

    const pendingCount = getStatusCount('SENT') + getStatusCount('VIEWED') + getStatusCount('NEGOTIATION');
    const acceptedCount = getStatusCount('ACCEPTED');
    const totalPages = Math.ceil(total / 10);
    const hasFilters = !!(search || status);

    const handleSearch = (value: string) => {
        setSearch(value);
        setPage(1);
    };

    const handleStatusChange = (value: string) => {
        setStatus(value as OfferStatus | '');
        setPage(1);
    };

    const navigateToOffer = (id: string) => router.push(`/dashboard/offers/${id}`);
    const navigateToEdit = (id: string) => router.push(`/dashboard/offers/${id}/edit`);

    return {
        search,
        status,
        sort,
        setSort,
        page,
        setPage,
        offers,
        total,
        isLoading,
        error,
        refresh,
        stats,
        statsLoading,
        deleteModal,
        setDeleteModal,
        isDeleting,
        handleDelete,
        handleDuplicate,
        handleCopyLink,
        handleSearch,
        handleStatusChange,
        pendingCount,
        acceptedCount,
        totalPages,
        hasFilters,
        navigateToOffer,
        navigateToEdit,
    };
}
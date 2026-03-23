// src/app/dashboard/offers/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useOffers, useOffersStats } from '@/hooks/useOffers';
import { offersApi } from '@/lib/api';
import { Button, Card, Badge, Input, ConfirmDialog } from '@/components/ui';
import { SkeletonStatsCard, SkeletonTableRow, SkeletonMobileCard } from '@/components/ui/Skeleton';
import { formatDate, formatCurrency, getStatusConfig, getInitials } from '@/lib/utils';
import { Offer, OfferStatus } from '@/types';
import { useToast } from '@/contexts/ToastContext';

const STATUS_OPTIONS = [
    { value: '', label: 'Wszystkie statusy' },
    { value: 'DRAFT', label: 'Szkic' },
    { value: 'SENT', label: 'Wysłana' },
    { value: 'VIEWED', label: 'Wyświetlona' },
    { value: 'NEGOTIATION', label: 'Negocjacje' },
    { value: 'ACCEPTED', label: 'Zaakceptowana' },
    { value: 'REJECTED', label: 'Odrzucona' },
    { value: 'EXPIRED', label: 'Wygasła' },
];

const SORT_OPTIONS = [
    { value: 'createdAt:desc', label: 'Najnowsze' },
    { value: 'createdAt:asc', label: 'Najstarsze' },
    { value: 'totalGross:desc', label: 'Wartość malejąco' },
    { value: 'totalGross:asc', label: 'Wartość rosnąco' },
    { value: 'validUntil:asc', label: 'Termin ważności' },
];

function OfferMobileCard({
                             offer,
                             onView,
                             onEdit,
                             onDuplicate,
                             onDelete,
                             onCopyLink,
                         }: {
    offer: Offer;
    onView: () => void;
    onEdit: () => void;
    onDuplicate: () => void;
    onDelete: () => void;
    onCopyLink: () => void;
}) {
    const statusConfig = getStatusConfig(offer.status);
    const isExpired =
        offer.validUntil &&
        new Date(offer.validUntil) < new Date() &&
        offer.status !== 'EXPIRED' &&
        offer.status !== 'ACCEPTED' &&
        offer.status !== 'REJECTED';

    return (
        <Card className="p-4" onClick={onView}>
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                        {getInitials(offer.client?.name || '?')}
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-themed truncate">{offer.title}</p>
                        <p className="text-xs text-themed-muted">{offer.number}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    <Badge className={`${statusConfig.bgColor} ${statusConfig.color}`}>
                        {statusConfig.label}
                    </Badge>
                    {isExpired && <Badge variant="danger" size="sm">!</Badge>}
                </div>
            </div>

            <div className="flex items-center justify-between mb-3">
                <div>
                    <p className="text-xs text-themed-muted">{offer.client?.name || 'Nieznany'}</p>
                    <p className="text-xs text-themed-muted opacity-70">
                        {offer.validUntil ? `do ${formatDate(offer.validUntil)}` : 'Bez terminu'}
                    </p>
                </div>
                <div className="text-right">
                    <p className="font-bold text-themed">{formatCurrency(Number(offer.totalGross))}</p>
                    <p className="text-xs text-themed-muted">netto: {formatCurrency(Number(offer.totalNet))}</p>
                </div>
            </div>

            {offer.publicToken && (
                <div className="mb-3" onClick={(e) => e.stopPropagation()}>
                    <button
                        onClick={onCopyLink}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/25 hover:bg-cyan-500/25 transition-colors"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                        Link aktywny — kopiuj
                    </button>
                </div>
            )}

            <div
                className="flex items-center gap-2 pt-3 border-t divider-themed"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onView}
                    className="flex-1 py-2 text-xs font-medium text-themed-muted section-themed hover-themed rounded-lg transition-colors"
                >
                    Szczegóły
                </button>
                <button
                    onClick={onEdit}
                    className="flex-1 py-2 text-xs font-medium text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 rounded-lg transition-colors"
                >
                    Edytuj
                </button>
                <button
                    onClick={onDuplicate}
                    className="py-2 px-3 text-themed-muted hover:text-themed hover-themed rounded-lg transition-colors"
                    title="Duplikuj"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                </button>
                <button
                    onClick={onDelete}
                    className="py-2 px-3 text-themed-muted hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Usuń"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
        </Card>
    );
}

export default function OffersPage() {
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

    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-themed">Oferty</h1>
                    <p className="text-sm text-themed-muted mt-1">Zarządzaj swoimi ofertami handlowymi</p>
                </div>
                <Link href="/dashboard/offers/new">
                    <Button className="w-full sm:w-auto">
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Nowa oferta
                    </Button>
                </Link>
            </div>

            {statsLoading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <SkeletonStatsCard key={i} />
                    ))}
                </div>
            ) : stats ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
                    <Card className="p-3 md:p-4">
                        <p className="text-xs md:text-sm text-themed-muted">Wszystkie</p>
                        <p className="text-xl md:text-2xl font-bold text-themed">{stats.total || 0}</p>
                    </Card>
                    <Card className="p-3 md:p-4">
                        <p className="text-xs md:text-sm text-themed-muted">Zaakceptowane</p>
                        <p className="text-xl md:text-2xl font-bold text-emerald-600 dark:text-emerald-400">{acceptedCount}</p>
                    </Card>
                    <Card className="p-3 md:p-4">
                        <p className="text-xs md:text-sm text-themed-muted">Oczekujące</p>
                        <p className="text-xl md:text-2xl font-bold text-amber-600 dark:text-amber-400">{pendingCount}</p>
                    </Card>
                    <Card className="p-3 md:p-4">
                        <p className="text-xs md:text-sm text-themed-muted">Łączna wartość</p>
                        <p className="text-lg md:text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                            {formatCurrency(Number(stats.totalValue) || 0)}
                        </p>
                    </Card>
                </div>
            ) : null}

            <Card className="mb-6">
                <div className="p-3 md:p-4 flex flex-col gap-3 md:flex-row md:gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Szukaj po numerze, tytule lub kliencie..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            icon={
                                <svg className="w-5 h-5 text-themed-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            }
                        />
                    </div>
                    <div className="flex gap-3">
                        <select
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value as OfferStatus | '');
                                setPage(1);
                            }}
                            className="flex-1 md:w-48 px-3 py-2 text-sm border rounded-lg input-themed focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        >
                            {STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                            className="flex-1 md:w-48 px-3 py-2 text-sm border rounded-lg input-themed focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        >
                            {SORT_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </Card>

            {isLoading ? (
                <>
                    <div className="hidden lg:block">
                        <Card className="overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="section-themed border-b divider-themed">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-themed-muted uppercase tracking-wider">Oferta</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-themed-muted uppercase tracking-wider">Klient</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-themed-muted uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-themed-muted uppercase tracking-wider">Dystrybucja</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-themed-muted uppercase tracking-wider">Wartość</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-themed-muted uppercase tracking-wider">Ważna do</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-themed-muted uppercase tracking-wider">Akcje</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divider-themed">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <SkeletonTableRow key={i} columns={7} />
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                    <div className="lg:hidden space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <SkeletonMobileCard key={i} />
                        ))}
                    </div>
                </>
            ) : error ? (
                <Card>
                    <div className="text-center py-12">
                        <p className="text-red-600 dark:text-red-400">{error}</p>
                        <Button variant="outline" onClick={refresh} className="mt-4">
                            Spróbuj ponownie
                        </Button>
                    </div>
                </Card>
            ) : offers.length === 0 ? (
                <Card>
                    <div className="text-center py-12">
                        <div className="w-16 h-16 section-themed rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-themed-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-themed mb-2">
                            {search || status ? 'Brak wyników' : 'Brak ofert'}
                        </h3>
                        <p className="text-themed-muted mb-4">
                            {search || status
                                ? 'Spróbuj zmienić kryteria wyszukiwania'
                                : 'Stwórz swoją pierwszą ofertę handlową'}
                        </p>
                        {!search && !status && (
                            <Link href="/dashboard/offers/new">
                                <Button>Stwórz ofertę</Button>
                            </Link>
                        )}
                    </div>
                </Card>
            ) : (
                <>
                    <div className="hidden lg:block">
                        <Card className="overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="section-themed border-b divider-themed">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-themed-muted uppercase tracking-wider">
                                            Oferta
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-themed-muted uppercase tracking-wider">
                                            Klient
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-themed-muted uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-themed-muted uppercase tracking-wider">
                                            Dystrybucja
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-themed-muted uppercase tracking-wider">
                                            Wartość
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-themed-muted uppercase tracking-wider">
                                            Ważna do
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-themed-muted uppercase tracking-wider">
                                            Akcje
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divider-themed">
                                    {offers.map((offer) => {
                                        const statusConfig = getStatusConfig(offer.status);
                                        const isExpired =
                                            offer.validUntil &&
                                            new Date(offer.validUntil) < new Date() &&
                                            offer.status !== 'EXPIRED' &&
                                            offer.status !== 'ACCEPTED' &&
                                            offer.status !== 'REJECTED';

                                        return (
                                            <tr
                                                key={offer.id}
                                                className="hover-themed transition-colors cursor-pointer"
                                                onClick={() => router.push(`/dashboard/offers/${offer.id}`)}
                                            >
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="font-medium text-themed">{offer.title}</p>
                                                        <p className="text-sm text-themed-muted">{offer.number}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white text-xs font-semibold">
                                                            {getInitials(offer.client?.name || '?')}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-themed">
                                                                {offer.client?.name || 'Nieznany'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Badge className={`${statusConfig.bgColor} ${statusConfig.color}`}>
                                                            {statusConfig.label}
                                                        </Badge>
                                                        {isExpired && (
                                                            <Badge variant="danger" size="sm">Wygasła</Badge>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                                    {offer.publicToken ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/25">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                                                                Link aktywny
                                                            </span>
                                                            <button
                                                                onClick={() => handleCopyLink(offer)}
                                                                className="p-1 text-themed-muted hover:text-cyan-600 dark:hover:text-cyan-400 rounded transition-colors"
                                                                title="Kopiuj link"
                                                            >
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-themed-muted">—</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <p className="font-semibold text-themed">
                                                        {formatCurrency(Number(offer.totalGross))}
                                                    </p>
                                                    <p className="text-xs text-themed-muted">
                                                        netto: {formatCurrency(Number(offer.totalNet))}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={isExpired ? 'text-red-600 dark:text-red-400 font-medium' : 'text-themed-muted'}>
                                                        {offer.validUntil ? formatDate(offer.validUntil) : '-'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div
                                                        className="flex items-center justify-end gap-1"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <button
                                                            onClick={() => router.push(`/dashboard/offers/${offer.id}`)}
                                                            className="p-2 text-themed-muted hover:text-themed hover-themed rounded-lg transition-colors"
                                                            title="Szczegóły"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => router.push(`/dashboard/offers/${offer.id}/edit`)}
                                                            className="p-2 text-themed-muted hover:text-themed hover-themed rounded-lg transition-colors"
                                                            title="Edytuj"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDuplicate(offer)}
                                                            className="p-2 text-themed-muted hover:text-themed hover-themed rounded-lg transition-colors"
                                                            title="Duplikuj"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteModal(offer)}
                                                            className="p-2 text-themed-muted hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                            title="Usuń"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </div>

                            {totalPages > 1 && (
                                <div className="px-6 py-4 border-t divider-themed flex items-center justify-between">
                                    <p className="text-sm text-themed-muted">
                                        {((page - 1) * 10) + 1}–{Math.min(page * 10, total)} z {total}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </Button>
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                let pageNum: number;
                                                if (totalPages <= 5) pageNum = i + 1;
                                                else if (page <= 3) pageNum = i + 1;
                                                else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                                                else pageNum = page - 2 + i;

                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => setPage(pageNum)}
                                                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                                                            page === pageNum
                                                                ? 'bg-cyan-600 text-white'
                                                                : 'text-themed-muted hover-themed'
                                                        }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                            disabled={page === totalPages}
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>

                    <div className="lg:hidden space-y-3">
                        {offers.map((offer) => (
                            <OfferMobileCard
                                key={offer.id}
                                offer={offer}
                                onView={() => router.push(`/dashboard/offers/${offer.id}`)}
                                onEdit={() => router.push(`/dashboard/offers/${offer.id}/edit`)}
                                onDuplicate={() => handleDuplicate(offer)}
                                onDelete={() => setDeleteModal(offer)}
                                onCopyLink={() => handleCopyLink(offer)}
                            />
                        ))}

                        {totalPages > 1 && (
                            <div className="flex items-center justify-between pt-2">
                                <p className="text-xs text-themed-muted">
                                    {((page - 1) * 10) + 1}–{Math.min(page * 10, total)} z {total}
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="px-3 py-1.5 text-sm font-medium rounded-lg border card-themed disabled:opacity-40 hover-themed transition-colors"
                                    >
                                        ←
                                    </button>
                                    <span className="text-sm text-themed-muted font-medium">
                                        {page}/{totalPages}
                                    </span>
                                    <button
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className="px-3 py-1.5 text-sm font-medium rounded-lg border card-themed disabled:opacity-40 hover-themed transition-colors"
                                    >
                                        →
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            <ConfirmDialog
                isOpen={!!deleteModal}
                onClose={() => setDeleteModal(null)}
                onConfirm={handleDelete}
                title="Usuń ofertę"
                description={`Czy na pewno chcesz usunąć ofertę "${deleteModal?.title}" (${deleteModal?.number})? Ta operacja jest nieodwracalna.`}
                confirmLabel="Usuń"
                isLoading={isDeleting}
            />
        </div>
    );
}
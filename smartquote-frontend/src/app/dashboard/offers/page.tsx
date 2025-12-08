// src/app/dashboard/offers/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useOffers, useOffersStats } from '@/hooks/useOffers';
import { offersApi } from '@/lib/api';
import { Button, Card, Badge, Input, Select, ConfirmDialog } from '@/components/ui';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatDate, formatCurrency, getStatusConfig, getInitials } from '@/lib/utils';
import { Offer, OfferStatus } from '@/types';

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

export default function OffersPage() {
    const router = useRouter();

    // Filtry
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<OfferStatus | ''>('');
    const [sort, setSort] = useState('createdAt:desc');
    const [page, setPage] = useState(1);

    // Parsowanie sortowania
    const [sortBy, sortOrder] = sort.split(':');

    // Pobieranie danych
    const { offers, total, isLoading, error, refresh } = useOffers({
        search: search || undefined,
        status: status || undefined,
        sortBy,
        sortOrder: sortOrder as 'asc' | 'desc',
        page,
        limit: 10,
    });

    const { stats, isLoading: statsLoading } = useOffersStats();

    // Usuwanie
    const [deleteModal, setDeleteModal] = useState<Offer | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!deleteModal) return;

        setIsDeleting(true);
        try {
            await offersApi.delete(deleteModal.id);
            setDeleteModal(null);
            refresh();
        } catch (err) {
            console.error('Delete error:', err);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDuplicate = async (offer: Offer) => {
        try {
            const response = await offersApi.duplicate(offer.id);
            if (response.data?.id) {
                router.push(`/dashboard/offers/${response.data.id}/edit`);
            } else {
                throw new Error('Nie udało się zduplikować oferty');
            }
        } catch (err) {
            console.error('Duplicate error:', err);
        }
    };

    // Bezpieczne pobieranie wartości ze statystyk
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
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Oferty</h1>
                    <p className="text-slate-500 mt-1">Zarządzaj swoimi ofertami handlowymi</p>
                </div>
                <Link href="/dashboard/offers/new">
                    <Button>
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Nowa oferta
                    </Button>
                </Link>
            </div>

            {/* Statystyki */}
            {!statsLoading && stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <Card className="p-4">
                        <p className="text-sm text-slate-500">Wszystkie</p>
                        <p className="text-2xl font-bold text-slate-900">{stats.total || 0}</p>
                    </Card>
                    <Card className="p-4">
                        <p className="text-sm text-slate-500">Zaakceptowane</p>
                        <p className="text-2xl font-bold text-emerald-600">{acceptedCount}</p>
                    </Card>
                    <Card className="p-4">
                        <p className="text-sm text-slate-500">Oczekujące</p>
                        <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
                    </Card>
                    <Card className="p-4">
                        <p className="text-sm text-slate-500">Łączna wartość</p>
                        <p className="text-2xl font-bold text-cyan-600">
                            {formatCurrency(Number(stats.totalValue) || 0)}
                        </p>
                    </Card>
                </div>
            )}

            {/* Filtry */}
            <Card className="mb-6">
                <div className="p-4 flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Szukaj po numerze, tytule lub kliencie..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            icon={
                                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            }
                        />
                    </div>
                    <div className="w-full md:w-48">
                        <Select
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value as OfferStatus | '');
                                setPage(1);
                            }}
                            options={STATUS_OPTIONS}
                        />
                    </div>
                    <div className="w-full md:w-48">
                        <Select
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                            options={SORT_OPTIONS}
                        />
                    </div>
                </div>
            </Card>

            {/* Lista ofert */}
            {isLoading ? (
                <PageLoader />
            ) : error ? (
                <Card>
                    <div className="text-center py-12">
                        <p className="text-red-600">{error}</p>
                        <Button variant="outline" onClick={refresh} className="mt-4">
                            Spróbuj ponownie
                        </Button>
                    </div>
                </Card>
            ) : offers.length === 0 ? (
                <Card>
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                            {search || status ? 'Brak wyników' : 'Brak ofert'}
                        </h3>
                        <p className="text-slate-500 mb-4">
                            {search || status
                                ? 'Spróbuj zmienić kryteria wyszukiwania'
                                : 'Stwórz swoją pierwszą ofertę handlową'
                            }
                        </p>
                        {!search && !status && (
                            <Link href="/dashboard/offers/new">
                                <Button>
                                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Stwórz ofertę
                                </Button>
                            </Link>
                        )}
                    </div>
                </Card>
            ) : (
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Oferta
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Klient
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Wartość
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Ważna do
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Akcje
                                </th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                            {offers.map((offer) => {
                                const statusConfig = getStatusConfig(offer.status);
                                const isExpired = offer.validUntil && new Date(offer.validUntil) < new Date();

                                return (
                                    <tr
                                        key={offer.id}
                                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                                        onClick={() => router.push(`/dashboard/offers/${offer.id}`)}
                                    >
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-slate-900">{offer.title}</p>
                                                <p className="text-sm text-slate-500">{offer.number}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white text-xs font-semibold">
                                                    {getInitials(offer.client?.name || '?')}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900">
                                                        {offer.client?.name || 'Nieznany'}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {offer.client?.email || ''}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Badge className={`${statusConfig.bgColor} ${statusConfig.color}`}>
                                                    {statusConfig.label}
                                                </Badge>
                                                {isExpired && offer.status !== 'EXPIRED' && offer.status !== 'ACCEPTED' && offer.status !== 'REJECTED' && (
                                                    <Badge variant="danger" size="sm">Wygasła</Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <p className="font-semibold text-slate-900">
                                                {formatCurrency(Number(offer.totalGross))}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                netto: {formatCurrency(Number(offer.totalNet))}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                                <span className={isExpired ? 'text-red-600 font-medium' : 'text-slate-600'}>
                                                    {offer.validUntil ? formatDate(offer.validUntil) : '-'}
                                                </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={() => router.push(`/dashboard/offers/${offer.id}`)}
                                                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                                    title="Szczegóły"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => router.push(`/dashboard/offers/${offer.id}/edit`)}
                                                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                                    title="Edytuj"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDuplicate(offer)}
                                                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                                    title="Duplikuj"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => setDeleteModal(offer)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

                    {/* Paginacja */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                            <p className="text-sm text-slate-500">
                                Pokazuje {((page - 1) * 10) + 1} - {Math.min(page * 10, total)} z {total} ofert
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </Button>

                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (page <= 3) {
                                            pageNum = i + 1;
                                        } else if (page >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = page - 2 + i;
                                        }

                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setPage(pageNum)}
                                                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                                                    page === pageNum
                                                        ? 'bg-cyan-600 text-white'
                                                        : 'text-slate-600 hover:bg-slate-100'
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
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
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
            )}

            {/* Modal potwierdzenia usunięcia */}
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
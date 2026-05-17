// src/app/dashboard/offers/page.tsx
'use client';

import Link from 'next/link';
import { Button, Card, ConfirmDialog } from '@/components/ui';
import { SkeletonTableRow, SkeletonMobileCard } from '@/components/ui/Skeleton';
import { useOffersPage } from './hooks/useOffersPage';
import { TABLE_HEADERS } from './constants';
import { OffersStats } from './components/OffersStats';
import { OffersFilters } from './components/OffersFilters';
import { OfferTableRow } from './components/OfferTableRow';
import { OfferMobileCard } from './components/OfferMobileCard';
import { OffersDesktopPagination, OffersMobilePagination } from './components/OffersPagination';

export default function OffersPage() {
    const {
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
    } = useOffersPage();

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

            <OffersStats
                stats={stats}
                statsLoading={statsLoading}
                acceptedCount={acceptedCount}
                pendingCount={pendingCount}
            />

            <OffersFilters
                search={search}
                status={status}
                sort={sort}
                onSearchChange={handleSearch}
                onStatusChange={handleStatusChange}
                onSortChange={setSort}
            />

            {isLoading ? (
                <>
                    <div className="hidden lg:block">
                        <Card className="overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="section-themed border-b divider-themed">
                                    <tr>
                                        {TABLE_HEADERS.map((h) => (
                                            <th
                                                key={h.label}
                                                className={`px-6 py-4 text-xs font-semibold text-themed-muted uppercase tracking-wider ${
                                                    h.align === 'right' ? 'text-right' : 'text-left'
                                                }`}
                                            >
                                                {h.label}
                                            </th>
                                        ))}
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
                            {hasFilters ? 'Brak wyników' : 'Brak ofert'}
                        </h3>
                        <p className="text-themed-muted mb-4">
                            {hasFilters
                                ? 'Spróbuj zmienić kryteria wyszukiwania'
                                : 'Stwórz swoją pierwszą ofertę handlową'}
                        </p>
                        {!hasFilters && (
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
                                        {TABLE_HEADERS.map((h) => (
                                            <th
                                                key={h.label}
                                                className={`px-6 py-4 text-xs font-semibold text-themed-muted uppercase tracking-wider ${
                                                    h.align === 'right' ? 'text-right' : 'text-left'
                                                }`}
                                            >
                                                {h.label}
                                            </th>
                                        ))}
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divider-themed">
                                    {offers.map((offer) => (
                                        <OfferTableRow
                                            key={offer.id}
                                            offer={offer}
                                            onView={() => navigateToOffer(offer.id)}
                                            onEdit={() => navigateToEdit(offer.id)}
                                            onDuplicate={() => handleDuplicate(offer)}
                                            onDelete={() => setDeleteModal(offer)}
                                            onCopyLink={() => handleCopyLink(offer)}
                                        />
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                            <OffersDesktopPagination
                                page={page}
                                totalPages={totalPages}
                                total={total}
                                onPageChange={setPage}
                            />
                        </Card>
                    </div>

                    <div className="lg:hidden space-y-3">
                        {offers.map((offer) => (
                            <OfferMobileCard
                                key={offer.id}
                                offer={offer}
                                onView={() => navigateToOffer(offer.id)}
                                onEdit={() => navigateToEdit(offer.id)}
                                onDuplicate={() => handleDuplicate(offer)}
                                onDelete={() => setDeleteModal(offer)}
                                onCopyLink={() => handleCopyLink(offer)}
                            />
                        ))}
                        <OffersMobilePagination
                            page={page}
                            totalPages={totalPages}
                            total={total}
                            onPageChange={setPage}
                        />
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
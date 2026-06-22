// src/app/dashboard/offers/page.tsx
'use client';

import Link from 'next/link';
import { Plus, RefreshCw, FileText } from 'lucide-react';
import { Button, ConfirmDialog } from '@/components/ui';
import { SkeletonTableRow, SkeletonMobileCard } from '@/components/ui/Skeleton';
import { useOffersPage } from './hooks/useOffersPage';
import { OffersStats } from './components/OffersStats';
import { OffersFilters } from './components/OffersFilters';
import { OfferTableRow } from './components/OfferTableRow';
import { OfferMobileCard } from './components/OfferMobileCard';
import { OffersDesktopPagination, OffersMobilePagination } from './components/OffersPagination';
import { useTranslations } from '@/i18n';

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

    const tr = useTranslations('offers');
    const commonTr = useTranslations('common');

    const tableHeaders = [
        { label: tr.table.offer,        align: 'left' as const },
        { label: tr.table.client,       align: 'left' as const },
        { label: tr.table.status,       align: 'left' as const },
        { label: tr.table.distribution, align: 'left' as const },
        { label: tr.table.value,        align: 'right' as const },
        { label: tr.table.validUntil,   align: 'left' as const },
        { label: tr.table.actions,      align: 'right' as const },
    ];

    return (
        <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-8 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{tr.breadcrumb}</div>
                    <h1 className="mt-1 text-3xl font-bold tracking-tight">{tr.title}</h1>
                    <p className="mt-1 text-sm text-muted-foreground">{tr.subtitle}</p>
                </div>
                <Link href="/dashboard/offers/new">
                    <Button>
                        <Plus className="h-4 w-4" /> {tr.newOffer}
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
                        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-surface-subtle border-b border-border">
                                    <tr>
                                        {tableHeaders.map((h) => (
                                            <th
                                                key={h.label}
                                                className={`px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider ${
                                                    h.align === 'right' ? 'text-right' : 'text-left'
                                                }`}
                                            >
                                                {h.label}
                                            </th>
                                        ))}
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y border-border">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <SkeletonTableRow key={i} columns={7} />
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div className="lg:hidden space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <SkeletonMobileCard key={i} />
                        ))}
                    </div>
                </>
            ) : error ? (
                <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-card">
                    <p className="text-destructive">{error}</p>
                    <Button variant="outline" onClick={refresh} className="mt-4 gap-2">
                        <RefreshCw className="h-4 w-4" /> {commonTr.retry}
                    </Button>
                </div>
            ) : offers.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card py-16 text-center shadow-card">
                    <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" strokeWidth={1.5} />
                    <h3 className="text-lg font-semibold tracking-tight">
                        {hasFilters ? tr.noResults : tr.noOffers}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {hasFilters ? tr.changeFilters : tr.createFirst}
                    </p>
                    {!hasFilters && (
                        <Link href="/dashboard/offers/new" className="mt-4 inline-block">
                            <Button><Plus className="h-4 w-4" /> {tr.createOffer}</Button>
                        </Link>
                    )}
                </div>
            ) : (
                <>
                    <div className="hidden lg:block">
                        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="border-b border-border bg-surface-subtle">
                                        <tr>
                                            {tableHeaders.map((h) => (
                                                <th
                                                    key={h.label}
                                                    className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground ${
                                                        h.align === 'right' ? 'text-right' : 'text-left'
                                                    }`}
                                                >
                                                    {h.label}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {offers.map((offer) => (
                                            <OfferTableRow
                                                key={offer.id}
                                                offer={offer}
                                                onView={() => navigateToOffer(offer.id)}
                                                onEdit={() => navigateToEdit(offer)}
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
                        </div>
                    </div>

                    <div className="lg:hidden space-y-3">
                        {offers.map((offer) => (
                            <OfferMobileCard
                                key={offer.id}
                                offer={offer}
                                onView={() => navigateToOffer(offer.id)}
                                onEdit={() => navigateToEdit(offer)}
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
                title={tr.delete.title}
                description={tr.delete.description
                    .replace('{title}', deleteModal?.title || '')
                    .replace('{number}', deleteModal?.number || '')}
                confirmLabel={tr.delete.confirm}
                isLoading={isDeleting}
            />
        </div>
    );
}

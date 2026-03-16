// src/app/dashboard/contracts/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useContracts, useContractsStats } from '@/hooks/useContracts';
import { Button, Card, Badge, Input, Select, ConfirmDialog } from '@/components/ui';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatCurrency, formatDate, getContractStatusConfig, getInitials } from '@/lib/utils';
import type { ContractStatus, Contract } from '@/types';

const STATUS_OPTIONS = [
    { value: '', label: 'Wszystkie statusy' },
    { value: 'DRAFT', label: 'Szkic' },
    { value: 'PENDING_SIGNATURE', label: 'Do podpisu' },
    { value: 'ACTIVE', label: 'Aktywna' },
    { value: 'COMPLETED', label: 'Zakończona' },
    { value: 'TERMINATED', label: 'Rozwiązana' },
    { value: 'EXPIRED', label: 'Wygasła' },
];

const SORT_OPTIONS = [
    { value: 'createdAt:desc', label: 'Najnowsze' },
    { value: 'createdAt:asc', label: 'Najstarsze' },
    { value: 'totalGross:desc', label: 'Wartość malejąco' },
    { value: 'totalGross:asc', label: 'Wartość rosnąco' },
];

export default function ContractsPage() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<ContractStatus | ''>('');
    const [sort, setSort] = useState('createdAt:desc');
    const [page, setPage] = useState(1);
    const [deleteModal, setDeleteModal] = useState<Contract | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const [sortBy, sortOrder] = sort.split(':');

    const { contracts, pagination, loading, error, refetch, deleteContract } = useContracts({
        page,
        limit: 10,
        search: search || undefined,
        status: statusFilter || undefined,
    });

    const { stats, loading: statsLoading } = useContractsStats();

    const handleDelete = async () => {
        if (!deleteModal) return;
        setIsDeleting(true);
        try {
            await deleteContract(deleteModal.id);
            setDeleteModal(null);
        } catch (err: unknown) {
            console.error('Delete error:', err);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCopyLink = async (e: React.MouseEvent, contract: Contract) => {
        e.stopPropagation();
        if (!contract.publicToken) return;
        const frontendUrl = (process.env.NEXT_PUBLIC_FRONTEND_URL || window.location.origin).replace(/\/$/, '');
        const url = `${frontendUrl}/contract/view/${contract.publicToken}`;
        try {
            await navigator.clipboard.writeText(url);
            setCopiedId(contract.id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err: unknown) {
            console.error('Copy failed:', err);
        }
    };

    const totalPages = pagination.totalPages;

    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-themed">Umowy</h1>
                    <p className="text-themed-muted mt-1">Zarządzaj umowami z klientami</p>
                </div>
                <Link href="/dashboard/contracts/new">
                    <Button>
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Nowa umowa
                    </Button>
                </Link>
            </div>

            {!statsLoading && stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <Card className="p-4">
                        <p className="text-sm text-themed-muted">Wszystkie</p>
                        <p className="text-2xl font-bold text-themed">{stats.total}</p>
                    </Card>
                    <Card className="p-4">
                        <p className="text-sm text-themed-muted">Aktywne</p>
                        <p className="text-2xl font-bold text-emerald-600">{stats.byStatus.ACTIVE || 0}</p>
                    </Card>
                    <Card className="p-4">
                        <p className="text-sm text-themed-muted">Do podpisu</p>
                        <p className="text-2xl font-bold text-amber-600">{stats.byStatus.PENDING_SIGNATURE || 0}</p>
                    </Card>
                    <Card className="p-4">
                        <p className="text-sm text-themed-muted">Wartość aktywnych</p>
                        <p className="text-2xl font-bold text-cyan-600">{formatCurrency(stats.activeValue)}</p>
                    </Card>
                </div>
            )}

            <Card className="mb-6">
                <div className="p-4 flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Szukaj po numerze, tytule lub kliencie..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            icon={
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            }
                        />
                    </div>
                    <div className="w-full md:w-48">
                        <Select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value as ContractStatus | ''); setPage(1); }}
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

            {loading ? (
                <PageLoader />
            ) : error ? (
                <Card>
                    <div className="text-center py-12">
                        <p className="text-red-600">{error}</p>
                        <Button variant="outline" onClick={refetch} className="mt-4">Spróbuj ponownie</Button>
                    </div>
                </Card>
            ) : contracts.length === 0 ? (
                <Card>
                    <div className="text-center py-12">
                        <div className="w-16 h-16 section-themed rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-themed-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-themed mb-2">
                            {search || statusFilter ? 'Brak wyników' : 'Brak umów'}
                        </h3>
                        <p className="text-themed-muted mb-4">
                            {search || statusFilter ? 'Spróbuj zmienić kryteria wyszukiwania' : 'Utwórz pierwszą umowę lub wygeneruj ją z oferty'}
                        </p>
                        {!search && !statusFilter && (
                            <Link href="/dashboard/contracts/new">
                                <Button>
                                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Nowa umowa
                                </Button>
                            </Link>
                        )}
                    </div>
                </Card>
            ) : (
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="section-themed border-b divider-themed">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-themed-muted uppercase tracking-wider">Umowa</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-themed-muted uppercase tracking-wider">Klient</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-themed-muted uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-themed-muted uppercase tracking-wider">Dystrybucja</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-themed-muted uppercase tracking-wider">Wartość</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-themed-muted uppercase tracking-wider">Daty</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-themed-muted uppercase tracking-wider">Akcje</th>
                            </tr>
                            </thead>
                            <tbody>
                            {contracts.map((contract) => {
                                const statusConfig = getContractStatusConfig(contract.status);
                                const isCopied = copiedId === contract.id;

                                return (
                                    <tr
                                        key={contract.id}
                                        className="border-b divider-themed hover-themed transition-colors cursor-pointer"
                                        onClick={() => router.push(`/dashboard/contracts/${contract.id}`)}
                                    >
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-themed">{contract.title}</p>
                                                <p className="text-sm text-themed-muted">{contract.number}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white text-xs font-semibold">
                                                    {getInitials(contract.client?.name || '?')}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-themed">{contract.client?.name || 'Nieznany'}</p>
                                                    {contract.client?.company && (
                                                        <p className="text-xs text-themed-muted">{contract.client.company}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge className={`${statusConfig.bgColor} ${statusConfig.color}`}>
                                                {statusConfig.label}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                {contract.publicToken ? (
                                                    <>
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-emerald-500/15 text-emerald-600 border border-emerald-500/25 rounded-full">
                                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                                            </svg>
                                                            Link aktywny
                                                        </span>
                                                        <button
                                                            onClick={(e) => handleCopyLink(e, contract)}
                                                            className={`p-1.5 rounded-lg transition-all ${
                                                                isCopied
                                                                    ? 'bg-emerald-500/15 text-emerald-600'
                                                                    : 'text-themed-muted hover:text-emerald-600 hover:bg-emerald-500/10'
                                                            }`}
                                                            title={isCopied ? 'Skopiowano!' : 'Kopiuj link'}
                                                        >
                                                            {isCopied ? (
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            ) : (
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                                </svg>
                                                            )}
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span className="text-xs text-themed-muted">—</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <p className="font-semibold text-themed">{formatCurrency(Number(contract.totalGross))}</p>
                                            <p className="text-xs text-themed-muted">netto: {formatCurrency(Number(contract.totalNet))}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            {contract.signedAt ? (
                                                <div>
                                                    <p className="text-xs text-emerald-600 font-medium">Podpisana</p>
                                                    <p className="text-sm text-themed-muted">{formatDate(contract.signedAt)}</p>
                                                </div>
                                            ) : contract.startDate ? (
                                                <div>
                                                    <p className="text-xs text-themed-muted">Od: {formatDate(contract.startDate)}</p>
                                                    {contract.endDate && <p className="text-xs text-themed-muted">Do: {formatDate(contract.endDate)}</p>}
                                                </div>
                                            ) : (
                                                <span className="text-sm text-themed-muted">{formatDate(contract.createdAt)}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={() => router.push(`/dashboard/contracts/${contract.id}`)}
                                                    className="p-2 text-themed-muted hover-themed rounded-lg transition-colors"
                                                    title="Szczegóły"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => router.push(`/dashboard/contracts/${contract.id}/edit`)}
                                                    className="p-2 text-themed-muted hover-themed rounded-lg transition-colors"
                                                    title="Edytuj"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => setDeleteModal(contract)}
                                                    className="p-2 text-themed-muted hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-colors"
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
                        <div className="px-6 py-4 border-t divider-themed flex flex-col sm:flex-row items-center justify-between gap-4">
                            <p className="text-sm text-themed-muted">
                                Pokazuje {((page - 1) * 10) + 1} - {Math.min(page * 10, pagination.total)} z {pagination.total} umów
                            </p>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </Button>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) pageNum = i + 1;
                                        else if (page <= 3) pageNum = i + 1;
                                        else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                                        else pageNum = page - 2 + i;
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setPage(pageNum)}
                                                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${page === pageNum ? 'bg-cyan-600 text-white' : 'text-themed hover-themed'}`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>
                                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            )}

            <ConfirmDialog
                isOpen={!!deleteModal}
                onClose={() => setDeleteModal(null)}
                onConfirm={handleDelete}
                title="Usuń umowę"
                description={`Czy na pewno chcesz usunąć umowę "${deleteModal?.title}" (${deleteModal?.number})? Ta operacja jest nieodwracalna.`}
                confirmLabel="Usuń"
                isLoading={isDeleting}
            />
        </div>
    );
}
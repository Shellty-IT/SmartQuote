// src/app/dashboard/contracts/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Search, Plus, RefreshCw, ScrollText,
    Link as LinkIcon, Copy, Pencil, Trash2,
    ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useContracts, useContractsStats } from '@/hooks/useContracts';
import { ConfirmDialog } from '@/components/ui';
import { SkeletonKPICard, SkeletonTableRow } from '@/components/ui/Skeleton';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatCurrency, formatDate, getInitials, cn } from '@/lib/utils';
import type { ContractStatus, Contract } from '@/types';
import { useToast } from '@/contexts/ToastContext';
import { useTranslations } from '@/i18n';

export default function ContractsPage() {
    const router = useRouter();
    const toast = useToast();
    const tr = useTranslations('contracts');
    const commonTr = useTranslations('common');

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<ContractStatus | ''>('');
    const [sort, setSort] = useState('createdAt:desc');
    const [page, setPage] = useState(1);
    const [deleteModal, setDeleteModal] = useState<Contract | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const { contracts, pagination, loading, error, refetch, deleteContract } = useContracts({
        page, limit: 10,
        search: search || undefined,
        status: statusFilter || undefined,
    });
    const { stats, loading: statsLoading } = useContractsStats();

    const STATUS_OPTIONS = [
        { value: '', label: tr.filters.allStatuses },
        { value: 'DRAFT', label: tr.statuses.DRAFT },
        { value: 'PENDING_SIGNATURE', label: tr.statuses.PENDING_SIGNATURE },
        { value: 'ACTIVE', label: tr.statuses.ACTIVE },
        { value: 'COMPLETED', label: tr.statuses.COMPLETED },
        { value: 'TERMINATED', label: tr.statuses.TERMINATED },
        { value: 'EXPIRED', label: tr.statuses.EXPIRED },
    ];

    const SORT_OPTIONS = [
        { value: 'createdAt:desc', label: tr.sortNewest },
        { value: 'createdAt:asc', label: tr.sortOldest },
        { value: 'totalGross:desc', label: tr.sortValueDesc },
        { value: 'totalGross:asc', label: tr.sortValueAsc },
    ];

    const STAT_CARDS = [
        { key: 'total', label: tr.stats.all, accent: 'from-[oklch(0.65_0.18_245)] to-[oklch(0.72_0.14_215)]' },
        { key: 'active', label: tr.stats.active, accent: 'from-[oklch(0.68_0.15_165)] to-[oklch(0.72_0.13_200)]' },
        { key: 'pending', label: tr.stats.pending, accent: 'from-[oklch(0.72_0.16_60)] to-[oklch(0.72_0.14_40)]' },
        { key: 'value', label: tr.stats.value, accent: 'from-[oklch(0.7_0.15_50)] to-[oklch(0.72_0.16_25)]' },
    ] as const;

    const TH = [tr.table.contract, tr.table.client, tr.table.status, tr.table.distribution, tr.table.value, tr.table.dates, ''];

    const handleDelete = async () => {
        if (!deleteModal) return;
        setIsDeleting(true);
        try {
            await deleteContract(deleteModal.id);
            toast.success(tr.deleted);
            setDeleteModal(null);
        } catch {
            toast.error(commonTr.errorTitle, tr.deleteError);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCopyLink = async (e: React.MouseEvent, contract: Contract) => {
        e.stopPropagation();
        if (!contract.publicToken) return;
        const base = (process.env.NEXT_PUBLIC_FRONTEND_URL || window.location.origin).replace(/\/$/, '');
        try {
            await navigator.clipboard.writeText(`${base}/contract/view/${contract.publicToken}`);
            toast.info(commonTr.linkCopied, tr.linkCopied);
        } catch {
            toast.error(commonTr.errorTitle, tr.linkError);
        }
    };

    const totalPages = pagination.totalPages;
    const hasFilters = !!(search || statusFilter);

    const statValues: Record<string, string> = {
        total: String(stats?.total || 0),
        active: String(stats?.byStatus?.ACTIVE || 0),
        pending: String(stats?.byStatus?.PENDING_SIGNATURE || 0),
        value: formatCurrency(stats?.activeValue || 0).replace(/\s*PLN/, ''),
    };

    return (
        <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-8 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{tr.breadcrumb}</div>
                    <h1 className="mt-1 text-3xl font-bold tracking-tight">{tr.title}</h1>
                    <p className="mt-1 text-sm text-muted-foreground">{tr.subtitle}</p>
                </div>
                <Link href="/dashboard/contracts/new">
                    <button className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-primary px-4 text-sm font-semibold text-white shadow-glow ring-1 ring-white/15 transition hover:brightness-110">
                        <Plus className="h-4 w-4" /> {tr.newContract}
                    </button>
                </Link>
            </div>

            {statsLoading ? (
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => <SkeletonKPICard key={i} />)}
                </div>
            ) : stats ? (
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {STAT_CARDS.map(({ key, label, accent }) => (
                        <div key={key} className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-card">
                            <div className={cn('absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br opacity-15 blur-2xl', accent)} />
                            <p className="relative text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
                            <p className="relative mt-1.5 text-2xl font-bold tracking-tight tabular-nums">{statValues[key]}</p>
                        </div>
                    ))}
                </div>
            ) : null}

            <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
                <div className="flex flex-col gap-3 md:flex-row md:gap-4">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            placeholder={tr.filters.search}
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="h-10 w-full rounded-lg border border-border bg-secondary/60 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring/30"
                        />
                    </div>
                    <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as ContractStatus | ''); setPage(1); }}
                        className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:border-primary focus:outline-none md:w-44">
                        {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <select value={sort} onChange={(e) => setSort(e.target.value)}
                        className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:border-primary focus:outline-none md:w-44">
                        {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b border-border bg-surface-subtle">
                                <tr>{TH.map((h, i) => <th key={i} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{h}</th>)}</tr>
                            </thead>
                            <tbody>{Array.from({ length: 6 }).map((_, i) => <SkeletonTableRow key={i} columns={7} />)}</tbody>
                        </table>
                    </div>
                </div>
            ) : error ? (
                <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-card">
                    <p className="text-destructive">{error}</p>
                    <button onClick={refetch} className="mt-4 inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold transition hover:bg-secondary">
                        <RefreshCw className="h-4 w-4" /> {commonTr.retry}
                    </button>
                </div>
            ) : contracts.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card py-16 text-center shadow-card">
                    <ScrollText className="mx-auto mb-4 h-10 w-10 text-muted-foreground/40" strokeWidth={1.5} />
                    <h3 className="text-lg font-semibold tracking-tight">{hasFilters ? tr.noResults : tr.noContracts}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {hasFilters ? tr.changeFilters : tr.createFirst}
                    </p>
                    {!hasFilters && (
                        <Link href="/dashboard/contracts/new" className="mt-4 inline-flex h-9 items-center gap-2 rounded-xl bg-gradient-primary px-4 text-sm font-semibold text-white shadow-glow ring-1 ring-white/15 hover:brightness-110">
                            <Plus className="h-4 w-4" /> {tr.newContract}
                        </Link>
                    )}
                </div>
            ) : (
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b border-border bg-surface-subtle">
                                <tr>
                                    {TH.map((h, i) => (
                                        <th key={i} className={cn('px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground', i === TH.length - 1 ? 'text-right' : 'text-left')}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {contracts.map((contract) => (
                                    <tr key={contract.id} className="cursor-pointer border-b border-border transition-colors hover:bg-secondary/40" onClick={() => router.push(`/dashboard/contracts/${contract.id}`)}>
                                        <td className="px-4 py-3">
                                            <p className="font-semibold leading-tight">{contract.title}</p>
                                            <p className="font-mono text-xs text-muted-foreground">{contract.number}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2.5">
                                                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-primary text-[10px] font-bold text-white">
                                                    {getInitials(contract.client?.name || '?')}
                                                </div>
                                                <p className="text-sm font-medium">{contract.client?.name || commonTr.unknown}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3"><StatusBadge status={contract.status} /></td>
                                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                            {contract.publicToken ? (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-status-accepted/25 bg-status-accepted/10 px-2 py-0.5 text-[11px] font-semibold text-status-accepted">
                                                        <LinkIcon className="h-3 w-3" /> {tr.activeLink}
                                                    </span>
                                                    <button onClick={(e) => handleCopyLink(e, contract)} className="rounded p-1 text-muted-foreground hover:text-primary"><Copy className="h-3.5 w-3.5" /></button>
                                                </div>
                                            ) : <span className="text-xs text-muted-foreground">—</span>}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <p className="font-semibold tabular-nums">{formatCurrency(Number(contract.totalGross))}</p>
                                            <p className="text-xs text-muted-foreground">{tr.net} {formatCurrency(Number(contract.totalNet))}</p>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">
                                            {contract.signedAt
                                                ? <span className="font-medium text-status-accepted">{tr.signed} {formatDate(contract.signedAt)}</span>
                                                : contract.startDate
                                                    ? <span>{tr.from} {formatDate(contract.startDate)}{contract.endDate ? ` — ${formatDate(contract.endDate)}` : ''}</span>
                                                    : formatDate(contract.createdAt)}
                                        </td>
                                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-0.5">
                                                <button onClick={() => router.push(`/dashboard/contracts/${contract.id}/edit`)} title={commonTr.edit} className="rounded-lg p-2 text-muted-foreground hover:text-primary"><Pencil className="h-4 w-4" /></button>
                                                <button onClick={() => setDeleteModal(contract)} title={commonTr.delete} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-border px-6 py-4">
                            <p className="text-sm text-muted-foreground">
                                {tr.page.replace('{page}', String(page)).replace('{total}', String(totalPages))}
                            </p>
                            <div className="flex gap-2">
                                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card transition hover:bg-secondary disabled:pointer-events-none disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
                                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card transition hover:bg-secondary disabled:pointer-events-none disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <ConfirmDialog
                isOpen={!!deleteModal}
                onClose={() => setDeleteModal(null)}
                onConfirm={handleDelete}
                title={tr.delete.title}
                description={tr.delete.description.replace('{title}', deleteModal?.title || '')}
                confirmLabel={tr.delete.confirm}
                isLoading={isDeleting}
            />
        </div>
    );
}

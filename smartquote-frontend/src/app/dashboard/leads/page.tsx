'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search,
    UserSearch,
    Plus,
    ChevronLeft,
    ChevronRight,
    Pencil,
    Trash2,
    ArrowRight,
    RefreshCw,
} from 'lucide-react';
import { useLeads, useLeadsStats } from '@/hooks/useLeads';
import { leadsApi } from '@/lib/api/leads.api';
import { ConfirmDialog } from '@/components/ui';
import { SkeletonTableRow } from '@/components/ui/Skeleton';
import { formatDate, cn } from '@/lib/utils';
import { useToast } from '@/contexts/ToastContext';
import { useTranslations } from '@/i18n';
import type { Lead, LeadStatus } from '@/types/lead.types';

const STATUS_COLORS: Record<LeadStatus, string> = {
    NEW:       'bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-amber-500/20',
    CONTACTED: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 ring-blue-500/20',
    CONVERTED: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20',
    LOST:      'bg-slate-500/15 text-slate-500 dark:text-slate-400 ring-slate-500/20',
};

// Converted leads have become clients and are no longer shown on the leads list.
const ALL_STATUSES: LeadStatus[] = ['NEW', 'CONTACTED', 'LOST'];

export default function LeadsPage() {
    const router = useRouter();
    const toast = useToast();
    const tr = useTranslations('leads');
    const commonTr = useTranslations('common');

    const [searchValue, setSearchValue] = useState('');
    const [statusFilter, setStatusFilter] = useState<LeadStatus | null>(null);
    const [page, setPage] = useState(1);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; lead: Lead | null }>({ isOpen: false, lead: null });
    const [isDeleting, setIsDeleting] = useState(false);

    const params = useMemo(() => ({
        page,
        limit: 20,
        ...(statusFilter ? { status: statusFilter } : {}),
    }), [page, statusFilter]);

    const { leads: allLeads, total, isLoading, error, refresh } = useLeads(params);
    const { stats } = useLeadsStats();

    // Local search filter
    const leads = useMemo(() => {
        if (!searchValue.trim()) return allLeads;
        const q = searchValue.toLowerCase();
        return allLeads.filter(l =>
            l.name.toLowerCase().includes(q) ||
            (l.company ?? '').toLowerCase().includes(q) ||
            (l.email ?? '').toLowerCase().includes(q)
        );
    }, [allLeads, searchValue]);

    const ITEMS_PER_PAGE = 20;
    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

    const handleDelete = async () => {
        if (!deleteModal.lead) return;
        setIsDeleting(true);
        try {
            await leadsApi.delete(deleteModal.lead.id);
            await refresh();
            toast.success(tr.deleted);
            setDeleteModal({ isOpen: false, lead: null });
        } catch {
            toast.error(commonTr.errorTitle, tr.deleteError);
        } finally {
            setIsDeleting(false);
        }
    };

    const thCols = [
        { label: tr.title,     className: '' },
        { label: tr.email,     className: 'hidden sm:table-cell' },
        { label: tr.phone,     className: 'hidden sm:table-cell' },
        { label: tr.source,    className: 'hidden sm:table-cell' },
        { label: 'Status',     className: '' },
        { label: tr.createdAt, className: 'hidden sm:table-cell' },
        { label: tr.actions,   className: 'text-right' },
    ];

    return (
        <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-8 sm:px-6">
            {/* Header */}
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">CRM</div>
                    <h1 className="mt-1 text-3xl font-bold tracking-tight">{tr.title}</h1>
                </div>
                <button
                    onClick={() => router.push('/dashboard/leads/new')}
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-primary px-4 text-sm font-semibold text-white shadow-glow ring-1 ring-white/15 transition hover:brightness-110"
                >
                    <Plus className="h-4 w-4" /> {tr.newLead}
                </button>
            </div>

            {/* Stats bar */}
            {stats && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <button
                        onClick={() => setStatusFilter(null)}
                        className={cn(
                            'rounded-xl border p-4 text-left transition hover:border-primary/40',
                            statusFilter === null ? 'border-primary/50 bg-primary/5' : 'border-border bg-card',
                        )}
                    >
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <div className="text-xs text-muted-foreground">{tr.stats.all}</div>
                    </button>
                    {ALL_STATUSES.map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(statusFilter === s ? null : s)}
                            className={cn(
                                'rounded-xl border p-4 text-left transition hover:border-primary/40',
                                statusFilter === s ? 'border-primary/50 bg-primary/5' : 'border-border bg-card',
                            )}
                        >
                            <div className="text-2xl font-bold">{stats.byStatus[s] ?? 0}</div>
                            <div className="text-xs text-muted-foreground">{tr.stats[s]}</div>
                        </button>
                    ))}
                </div>
            )}

            {/* Filters */}
            <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
                <div className="flex flex-wrap gap-3">
                    <div className="relative min-w-[200px] flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            placeholder={tr.searchPlaceholder}
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            className="h-10 w-full rounded-lg border border-border bg-secondary/60 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring/30"
                        />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        <button
                            onClick={() => setStatusFilter(null)}
                            className={cn(
                                'h-10 rounded-lg border px-3 text-sm font-medium transition',
                                statusFilter === null
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-border bg-card text-muted-foreground hover:text-foreground',
                            )}
                        >
                            {tr.stats.all}
                        </button>
                        {ALL_STATUSES.map((s) => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(statusFilter === s ? null : s)}
                                className={cn(
                                    'h-10 rounded-lg border px-3 text-sm font-medium transition',
                                    statusFilter === s
                                        ? 'border-primary bg-primary/10 text-primary'
                                        : 'border-border bg-card text-muted-foreground hover:text-foreground',
                                )}
                            >
                                {tr.stats[s]}
                            </button>
                        ))}
                    </div>
                    <button onClick={refresh} className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:text-foreground">
                        <RefreshCw className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                    {error}
                    <button onClick={refresh} className="ml-2 underline hover:opacity-80">{commonTr.retry}</button>
                </div>
            )}

            {/* Table */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b border-border bg-surface-subtle">
                            <tr>
                                {thCols.map((col, i) => (
                                    <th
                                        key={i}
                                        className={cn(
                                            'px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground text-left',
                                            col.className,
                                        )}
                                    >
                                        {col.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading && leads.length === 0
                                ? Array.from({ length: 6 }).map((_, i) => <SkeletonTableRow key={i} columns={7} />)
                                : leads.length === 0
                                ? (
                                    <tr>
                                        <td colSpan={7} className="py-16 text-center">
                                            <UserSearch className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" strokeWidth={1.5} />
                                            <p className="text-sm font-medium">{searchValue || statusFilter ? tr.noResults : tr.noLeads}</p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {searchValue || statusFilter ? tr.changeFilters : tr.noLeadsHint}
                                            </p>
                                            {!searchValue && !statusFilter && (
                                                <button
                                                    onClick={() => router.push('/dashboard/leads/new')}
                                                    className="mt-4 inline-flex h-9 items-center gap-2 rounded-xl bg-gradient-primary px-4 text-sm font-semibold text-white shadow-glow ring-1 ring-white/15 hover:brightness-110"
                                                >
                                                    <Plus className="h-4 w-4" /> {tr.newLead}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                )
                                : leads.map((lead) => (
                                    <tr
                                        key={lead.id}
                                        className="cursor-pointer border-b border-border transition-colors hover:bg-secondary/40"
                                        onClick={() => router.push(`/dashboard/leads/${lead.id}`)}
                                    >
                                        <td className="px-4 py-3 min-h-[44px]">
                                            <div>
                                                <p className="font-semibold leading-tight">{lead.name}</p>
                                                {lead.company && <p className="text-xs text-muted-foreground">{lead.company}</p>}
                                            </div>
                                        </td>
                                        <td className="hidden sm:table-cell px-4 py-3 text-sm text-muted-foreground">
                                            {lead.email ?? '—'}
                                        </td>
                                        <td className="hidden sm:table-cell px-4 py-3 text-sm text-muted-foreground">
                                            {lead.phone ?? '—'}
                                        </td>
                                        <td className="hidden sm:table-cell px-4 py-3 text-sm text-muted-foreground">
                                            {lead.source ?? '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={cn(
                                                'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
                                                STATUS_COLORS[lead.status],
                                            )}>
                                                {tr.status[lead.status]}
                                            </span>
                                        </td>
                                        <td className="hidden sm:table-cell px-4 py-3 text-sm text-muted-foreground">
                                            {formatDate(lead.createdAt)}
                                        </td>
                                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-0.5">
                                                {lead.status !== 'CONVERTED' && (
                                                    <button
                                                        onClick={() => router.push(`/dashboard/leads/${lead.id}`)}
                                                        title={tr.convert}
                                                        className="rounded-lg p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-muted-foreground transition hover:text-primary"
                                                    >
                                                        <ArrowRight className="h-4 w-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => router.push(`/dashboard/leads/${lead.id}`)}
                                                    title={commonTr.edit}
                                                    className="rounded-lg p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-muted-foreground transition hover:text-primary"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteModal({ isOpen: true, lead })}
                                                    title={commonTr.delete}
                                                    className="rounded-lg p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            }
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-border px-6 py-4">
                        <p className="text-sm text-muted-foreground">
                            {leads.length} / {total}
                        </p>
                        <div className="flex gap-2">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:bg-secondary disabled:pointer-events-none disabled:opacity-40"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <span className="flex items-center text-sm font-medium text-muted-foreground">
                                {page}/{totalPages}
                            </span>
                            <button
                                disabled={page === totalPages}
                                onClick={() => setPage(p => p + 1)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:bg-secondary disabled:pointer-events-none disabled:opacity-40"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <ConfirmDialog
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, lead: null })}
                onConfirm={handleDelete}
                title={tr.deleteTitle}
                description={tr.deleteDesc.replace('{name}', deleteModal.lead?.name || '')}
                confirmLabel={tr.deleteConfirm}
                isLoading={isDeleting}
            />
        </div>
    );
}

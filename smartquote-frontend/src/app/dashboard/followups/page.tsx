// src/app/dashboard/followups/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFollowUps, useFollowUpStats } from '@/hooks/useFollowUps';
import { Button, Input, Badge, EmptyState, ConfirmDialog } from '@/components/ui';
import { SkeletonStatsCardWithIcon, SkeletonTableRow } from '@/components/ui/Skeleton';
import { formatDate } from '@/lib/utils';
import { FollowUp, FollowUpStatus, FollowUpType, Priority } from '@/types';
import { useToast } from '@/contexts/ToastContext';
import { useTranslations } from '@/i18n';

export default function FollowUpsPage() {
    const router = useRouter();
    const toast = useToast();
    const tr = useTranslations('followups');
    const commonTr = useTranslations('common');

    const {
        followUps,
        loading,
        error,
        filters,
        setFilters,
        deleteFollowUp,
        completeFollowUp,
        refetch,
        total,
        page,
        totalPages,
    } = useFollowUps({ limit: 10 });

    const { stats, loading: statsLoading } = useFollowUpStats();

    const [searchValue, setSearchValue] = useState('');
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; followUp: FollowUp | null }>({
        isOpen: false,
        followUp: null,
    });
    const [isDeleting, setIsDeleting] = useState(false);
    const [completingId, setCompletingId] = useState<string | null>(null);

    const hasFilters = !!(searchValue || filters.status || filters.type || filters.priority || filters.overdue);

    const statusConfig: Record<FollowUpStatus, { label: string; color: string; bgColor: string }> = {
        PENDING:   { label: tr.statuses.PENDING,   color: 'text-[oklch(0.55_0.14_60)] dark:text-[oklch(0.78_0.14_60)]', bgColor: 'bg-[oklch(0.72_0.16_60)/15%]' },
        COMPLETED: { label: tr.statuses.COMPLETED, color: 'text-status-accepted',  bgColor: 'bg-status-accepted/15' },
        CANCELLED: { label: tr.statuses.CANCELLED, color: 'text-muted-foreground', bgColor: 'bg-secondary' },
        OVERDUE:   { label: tr.statuses.OVERDUE,   color: 'text-status-rejected',  bgColor: 'bg-status-rejected/15' },
    };

    const typeConfig: Record<FollowUpType, { label: string; icon: string }> = {
        CALL:     { label: tr.types.CALL,     icon: '📞' },
        EMAIL:    { label: tr.types.EMAIL,    icon: '✉️' },
        MEETING:  { label: tr.types.MEETING,  icon: '🤝' },
        TASK:     { label: tr.types.TASK,     icon: '✅' },
        REMINDER: { label: tr.types.REMINDER, icon: '🔔' },
        OTHER:    { label: tr.types.OTHER,    icon: '📌' },
    };

    const priorityConfig: Record<Priority, { label: string; color: string; bgColor: string }> = {
        LOW:    { label: tr.priorities.LOW,    color: 'text-muted-foreground', bgColor: 'bg-secondary' },
        MEDIUM: { label: tr.priorities.MEDIUM, color: 'text-status-open', bgColor: 'bg-[color-mix(in_oklab,var(--status-open)_15%,transparent)]' },
        HIGH:   { label: tr.priorities.HIGH,   color: 'text-[oklch(0.55_0.16_45)] dark:text-[oklch(0.78_0.14_45)]', bgColor: 'bg-orange-500/15' },
        URGENT: { label: tr.priorities.URGENT, color: 'text-status-rejected', bgColor: 'bg-status-rejected/15' },
    };

    const handleSearch = (value: string) => {
        setSearchValue(value);
        setFilters({ search: value, page: 1 });
    };

    const handleDelete = async () => {
        if (!deleteModal.followUp) return;
        setIsDeleting(true);
        try {
            await deleteFollowUp(deleteModal.followUp.id);
            toast.success(tr.deleted, `"${deleteModal.followUp.title}" został usunięty`);
            setDeleteModal({ isOpen: false, followUp: null });
        } catch {
            toast.error('Błąd', tr.deleteError);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleComplete = async (followUp: FollowUp) => {
        setCompletingId(followUp.id);
        try {
            await completeFollowUp(followUp.id);
            toast.success(tr.done, `"${followUp.title}" został oznaczony jako wykonany`);
        } catch {
            toast.error('Błąd', tr.doneError);
        } finally {
            setCompletingId(null);
        }
    };

    const isOverdue = (followUp: FollowUp) => {
        if (followUp.status === 'OVERDUE') return true;
        if (followUp.status === 'COMPLETED' || followUp.status === 'CANCELLED') return false;
        return new Date(followUp.dueDate) < new Date();
    };

    const tableHeaderClass = 'px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground';

    return (
        <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-8 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{tr.title}</h1>
                    <p className="text-muted-foreground mt-1">{tr.subtitle}</p>
                </div>
                <Button onClick={() => router.push('/dashboard/followups/new')}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {tr.newFollowup}
                </Button>
            </div>

            {statsLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {Array.from({ length: 4 }).map((_, i) => <SkeletonStatsCardWithIcon key={i} />)}
                </div>
            ) : stats ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: tr.stats.pending, value: stats.byStatus?.PENDING || 0, icon: '⏳', colorVar: 'var(--accent)', valueClass: '' },
                        { label: tr.stats.overdue, value: stats.overdue || 0, icon: '🚨', colorVar: 'color-mix(in oklab, var(--status-rejected) 15%, transparent)', valueClass: 'text-status-rejected' },
                        { label: tr.stats.today, value: stats.todayDue || 0, icon: '📅', colorVar: 'color-mix(in oklab, var(--status-open) 15%, transparent)', valueClass: 'text-status-open' },
                        { label: tr.stats.completedMonth, value: stats.completedThisMonth || 0, icon: '✅', colorVar: 'color-mix(in oklab, var(--status-accepted) 15%, transparent)', valueClass: 'text-status-accepted' },
                    ].map(({ label, value, icon, colorVar, valueClass }) => (
                        <div key={label} className="rounded-2xl border border-border bg-card p-6 shadow-card">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">{label}</p>
                                    <p className={`text-2xl font-bold tracking-tight ${valueClass}`}>{value}</p>
                                </div>
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: colorVar }}>
                                    <span className="text-xl">{icon}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : null}

            <div className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-card">
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <Input
                            placeholder={tr.filters.search}
                            value={searchValue}
                            onChange={(e) => handleSearch(e.target.value)}
                            icon={
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            }
                        />
                    </div>
                    {[
                        {
                            value: filters.status || '',
                            onChange: (v: string) => setFilters({ status: v, page: 1 }),
                            options: [
                                { value: '', label: tr.filters.allStatuses },
                                { value: 'PENDING', label: tr.statuses.PENDING },
                                { value: 'OVERDUE', label: tr.statuses.OVERDUE },
                                { value: 'COMPLETED', label: tr.statuses.COMPLETED },
                                { value: 'CANCELLED', label: tr.statuses.CANCELLED },
                            ],
                        },
                        {
                            value: filters.type || '',
                            onChange: (v: string) => setFilters({ type: v, page: 1 }),
                            options: [
                                { value: '', label: tr.filters.allTypes },
                                { value: 'CALL', label: tr.types.CALL },
                                { value: 'EMAIL', label: tr.types.EMAIL },
                                { value: 'MEETING', label: tr.types.MEETING },
                                { value: 'TASK', label: tr.types.TASK },
                                { value: 'REMINDER', label: tr.types.REMINDER },
                                { value: 'OTHER', label: tr.types.OTHER },
                            ],
                        },
                        {
                            value: filters.priority || '',
                            onChange: (v: string) => setFilters({ priority: v, page: 1 }),
                            options: [
                                { value: '', label: tr.filters.allPriorities },
                                { value: 'LOW', label: tr.priorities.LOW },
                                { value: 'MEDIUM', label: tr.priorities.MEDIUM },
                                { value: 'HIGH', label: tr.priorities.HIGH },
                                { value: 'URGENT', label: tr.priorities.URGENT },
                            ],
                        },
                    ].map((sel, idx) => (
                        <select
                            key={idx}
                            className="px-4 py-2.5 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-ring/30"
                            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                            value={sel.value}
                            onChange={(e) => sel.onChange(e.target.value)}
                        >
                            {sel.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    ))}
                    <label
                        className="flex items-center gap-2 px-4 py-2.5 border rounded-lg cursor-pointer transition-colors"
                        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                    >
                        <input
                            type="checkbox"
                            checked={filters.overdue || false}
                            onChange={(e) => setFilters({ overdue: e.target.checked || undefined, page: 1 })}
                            className="w-4 h-4 text-primary rounded"
                        />
                        <span className="text-foreground text-sm">{tr.filters.overdueOnly}</span>
                    </label>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 rounded-lg border" style={{ backgroundColor: 'var(--error-bg, rgba(239, 68, 68, 0.1))', borderColor: 'var(--error-border, rgba(239, 68, 68, 0.25))', color: 'var(--error-text, #ef4444)' }}>
                    {error}
                    <button onClick={refetch} className="ml-2 underline hover:opacity-80">{commonTr.retry}</button>
                </div>
            )}

            {loading && followUps.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card shadow-card">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                            <tr className="border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-subtle)' }}>
                                <th className={tableHeaderClass}>{tr.table.followup}</th>
                                <th className={`${tableHeaderClass} hidden md:table-cell`}>{tr.table.linked}</th>
                                <th className={`${tableHeaderClass} hidden sm:table-cell`}>{tr.table.type}</th>
                                <th className={`${tableHeaderClass} hidden lg:table-cell`}>{tr.table.priority}</th>
                                <th className={tableHeaderClass}>{tr.table.due}</th>
                                <th className={`${tableHeaderClass} hidden sm:table-cell`}>{tr.table.status}</th>
                                <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{tr.table.actions}</th>
                            </tr>
                            </thead>
                            <tbody>
                            {Array.from({ length: 6 }).map((_, i) => <SkeletonTableRow key={i} columns={7} />)}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : followUps.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                    <EmptyState
                        icon={
                            hasFilters ? (
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            ) : (
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                </svg>
                            )
                        }
                        title={hasFilters ? tr.noResults : tr.noFollowups}
                        description={hasFilters ? tr.changeFilters : tr.createFirst}
                        action={hasFilters ? undefined : { label: tr.newFollowup, onClick: () => router.push('/dashboard/followups/new') }}
                    />
                </div>
            ) : (
                <div className="rounded-2xl border border-border bg-card shadow-card">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                            <tr className="border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-subtle)' }}>
                                <th className={tableHeaderClass}>{tr.table.followup}</th>
                                <th className={`${tableHeaderClass} hidden md:table-cell`}>{tr.table.linked}</th>
                                <th className={`${tableHeaderClass} hidden sm:table-cell`}>{tr.table.type}</th>
                                <th className={`${tableHeaderClass} hidden lg:table-cell`}>{tr.table.priority}</th>
                                <th className={tableHeaderClass}>{tr.table.due}</th>
                                <th className={`${tableHeaderClass} hidden sm:table-cell`}>{tr.table.status}</th>
                                <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{tr.table.actions}</th>
                            </tr>
                            </thead>
                            <tbody>
                            {followUps.map((followUp) => {
                                const overdue = isOverdue(followUp);
                                const statusCfg = overdue ? statusConfig.OVERDUE : statusConfig[followUp.status];
                                const typeCfg = typeConfig[followUp.type];
                                const priorityCfg = priorityConfig[followUp.priority];

                                return (
                                    <tr
                                        key={followUp.id}
                                        className={`border-b cursor-pointer border-b border-border transition-colors hover:bg-secondary/40 ${overdue ? 'border-l-4 border-l-red-500' : ''}`}
                                        style={{ borderBottomColor: 'var(--border)', backgroundColor: overdue ? 'rgba(239, 68, 68, 0.04)' : undefined }}
                                        onClick={() => router.push(`/dashboard/followups/${followUp.id}`)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-start gap-2">
                                                {overdue && <span className="text-status-rejected animate-pulse flex-shrink-0 mt-0.5" title={tr.overdue}>⚠️</span>}
                                                <div>
                                                    <p className="font-medium text-foreground">{followUp.title}</p>
                                                    {followUp.description && (
                                                        <p className="text-sm text-muted-foreground truncate max-w-xs">{followUp.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <div className="text-sm">
                                                {followUp.client && <p className="text-foreground">{followUp.client.name}</p>}
                                                {followUp.offer && <p className="text-muted-foreground">{tr.related.offer}: {followUp.offer.number}</p>}
                                                {followUp.contract && <p className="text-muted-foreground">{tr.related.contract}: {followUp.contract.number}</p>}
                                                {!followUp.client && !followUp.offer && !followUp.contract && <span className="text-muted-foreground">-</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden sm:table-cell">
                                            <span className="inline-flex items-center gap-1.5">
                                                <span>{typeCfg.icon}</span>
                                                <span className="text-sm text-foreground">{typeCfg.label}</span>
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 hidden lg:table-cell">
                                            <Badge className={`${priorityCfg.bgColor} ${priorityCfg.color}`}>{priorityCfg.label}</Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-sm ${overdue ? 'text-status-rejected font-semibold' : 'text-muted-foreground'}`}>
                                                {formatDate(followUp.dueDate)}
                                                {overdue && <span className="block text-xs text-destructive mt-0.5">{tr.overdue}</span>}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 hidden sm:table-cell">
                                            <Badge className={`${statusCfg.bgColor} ${statusCfg.color}`}>{statusCfg.label}</Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                                {(followUp.status === 'PENDING' || followUp.status === 'OVERDUE') && (
                                                    <button
                                                        onClick={() => handleComplete(followUp)}
                                                        disabled={completingId === followUp.id}
                                                        className="p-2 text-muted-foreground rounded-lg transition-colors disabled:opacity-50"
                                                        style={{ backgroundColor: 'transparent' }}
                                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.15)'; e.currentTarget.style.color = '#10b981'; }}
                                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--muted-foreground)'; }}
                                                        title={tr.markDone}
                                                    >
                                                        {completingId === followUp.id ? (
                                                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                            </svg>
                                                        ) : (
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => router.push(`/dashboard/followups/${followUp.id}/edit`)}
                                                    className="p-2 text-muted-foreground rounded-lg transition-colors"
                                                    style={{ backgroundColor: 'transparent' }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--primary)'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--muted-foreground)'; }}
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => setDeleteModal({ isOpen: true, followUp })}
                                                    className="p-2 text-muted-foreground rounded-lg transition-colors"
                                                    style={{ backgroundColor: 'transparent' }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = '#ef4444'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--muted-foreground)'; }}
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
                        <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderColor: 'var(--border)' }}>
                            <p className="text-sm text-muted-foreground">
                                {tr.showing.replace('{shown}', String(followUps.length)).replace('{total}', String(total))}
                            </p>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setFilters({ page: page - 1 })}>{commonTr.previous}</Button>
                                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setFilters({ page: page + 1 })}>{commonTr.next}</Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <ConfirmDialog
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, followUp: null })}
                onConfirm={handleDelete}
                title={tr.delete.title}
                description={tr.delete.description.replace('{title}', deleteModal.followUp?.title || '')}
                confirmLabel={tr.delete.confirm}
                isLoading={isDeleting}
            />
        </div>
    );
}

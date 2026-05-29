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

const statusConfig: Record<FollowUpStatus, { label: string; color: string; bgColor: string }> = {
    PENDING: { label: 'Oczekujące', color: 'text-[oklch(0.55_0.14_60)] dark:text-[oklch(0.78_0.14_60)]', bgColor: 'bg-[oklch(0.72_0.16_60)/15%]' },
    COMPLETED: { label: 'Wykonane', color: 'text-status-accepted', bgColor: 'bg-status-accepted/15' },
    CANCELLED: { label: 'Anulowane', color: 'text-muted-foreground', bgColor: 'bg-secondary' },
    OVERDUE: { label: 'Zaległe', color: 'text-status-rejected', bgColor: 'bg-status-rejected/15' },
};

const typeConfig: Record<FollowUpType, { label: string; icon: string }> = {
    CALL: { label: 'Telefon', icon: '📞' },
    EMAIL: { label: 'Email', icon: '✉️' },
    MEETING: { label: 'Spotkanie', icon: '🤝' },
    TASK: { label: 'Zadanie', icon: '✅' },
    REMINDER: { label: 'Przypomnienie', icon: '🔔' },
    OTHER: { label: 'Inne', icon: '📌' },
};

const priorityConfig: Record<Priority, { label: string; color: string; bgColor: string }> = {
    LOW: { label: 'Niski', color: 'text-muted-foreground', bgColor: 'bg-secondary' },
    MEDIUM: { label: 'Średni', color: 'text-status-open', bgColor: 'bg-[color-mix(in_oklab,var(--status-open)_15%,transparent)]' },
    HIGH: { label: 'Wysoki', color: 'text-[oklch(0.55_0.16_45)] dark:text-[oklch(0.78_0.14_45)]', bgColor: 'bg-orange-500/15' },
    URGENT: { label: 'Pilne', color: 'text-status-rejected', bgColor: 'bg-status-rejected/15' },
};

export default function FollowUpsPage() {
    const router = useRouter();
    const toast = useToast();
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

    const handleSearch = (value: string) => {
        setSearchValue(value);
        setFilters({ search: value, page: 1 });
    };

    const handleDelete = async () => {
        if (!deleteModal.followUp) return;

        setIsDeleting(true);
        try {
            await deleteFollowUp(deleteModal.followUp.id);
            toast.success('Follow-up usunięty', `"${deleteModal.followUp.title}" został usunięty`);
            setDeleteModal({ isOpen: false, followUp: null });
        } catch {
            toast.error('Błąd', 'Nie udało się usunąć follow-upu');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleComplete = async (followUp: FollowUp) => {
        setCompletingId(followUp.id);
        try {
            await completeFollowUp(followUp.id);
            toast.success('Follow-up wykonany', `"${followUp.title}" został oznaczony jako wykonany`);
        } catch {
            toast.error('Błąd', 'Nie udało się oznaczyć jako wykonane');
        } finally {
            setCompletingId(null);
        }
    };

    const isOverdue = (followUp: FollowUp) => {
        if (followUp.status === 'OVERDUE') return true;
        if (followUp.status === 'COMPLETED' || followUp.status === 'CANCELLED') return false;
        return new Date(followUp.dueDate) < new Date();
    };

    return (
        <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-8 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Follow-upy</h1>
                    <p className="text-muted-foreground mt-1">Zarządzaj zadaniami i przypomnieniami</p>
                </div>
                <Button onClick={() => router.push('/dashboard/followups/new')}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nowy follow-up
                </Button>
            </div>

            {statsLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <SkeletonStatsCardWithIcon key={i} />
                    ))}
                </div>
            ) : stats ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Oczekujące</p>
                                <p className="text-2xl font-bold tracking-tight">{stats.byStatus?.PENDING || 0}</p>
                            </div>
                            <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: 'var(--accent)' }}
                            >
                                <span className="text-xl">⏳</span>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Zaległe</p>
                                <p className="text-2xl font-bold text-status-rejected">{stats.overdue || 0}</p>
                            </div>
                            <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: 'color-mix(in oklab, var(--status-rejected) 15%, transparent)' }}
                            >
                                <span className="text-xl">🚨</span>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Na dziś</p>
                                <p className="text-2xl font-bold text-status-open">{stats.todayDue || 0}</p>
                            </div>
                            <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: 'color-mix(in oklab, var(--status-open) 15%, transparent)' }}
                            >
                                <span className="text-xl">📅</span>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Wykonane (miesiąc)</p>
                                <p className="text-2xl font-bold text-status-accepted">{stats.completedThisMonth || 0}</p>
                            </div>
                            <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: 'color-mix(in oklab, var(--status-accepted) 15%, transparent)' }}
                            >
                                <span className="text-xl">✅</span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}

            <div className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-card">
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <Input
                            placeholder="Szukaj follow-upów..."
                            value={searchValue}
                            onChange={(e) => handleSearch(e.target.value)}
                            icon={
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            }
                        />
                    </div>
                    <select
                        className="px-4 py-2.5 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-ring/30"
                        style={{
                            backgroundColor: 'var(--card)',
                            borderColor: 'var(--border)',
                            color: 'var(--foreground)',
                        }}
                        value={filters.status || ''}
                        onChange={(e) => setFilters({ status: e.target.value, page: 1 })}
                    >
                        <option value="">Wszystkie statusy</option>
                        <option value="PENDING">Oczekujące</option>
                        <option value="OVERDUE">Zaległe</option>
                        <option value="COMPLETED">Wykonane</option>
                        <option value="CANCELLED">Anulowane</option>
                    </select>
                    <select
                        className="px-4 py-2.5 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-ring/30"
                        style={{
                            backgroundColor: 'var(--card)',
                            borderColor: 'var(--border)',
                            color: 'var(--foreground)',
                        }}
                        value={filters.type || ''}
                        onChange={(e) => setFilters({ type: e.target.value, page: 1 })}
                    >
                        <option value="">Wszystkie typy</option>
                        <option value="CALL">Telefon</option>
                        <option value="EMAIL">Email</option>
                        <option value="MEETING">Spotkanie</option>
                        <option value="TASK">Zadanie</option>
                        <option value="REMINDER">Przypomnienie</option>
                        <option value="OTHER">Inne</option>
                    </select>
                    <select
                        className="px-4 py-2.5 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-ring/30"
                        style={{
                            backgroundColor: 'var(--card)',
                            borderColor: 'var(--border)',
                            color: 'var(--foreground)',
                        }}
                        value={filters.priority || ''}
                        onChange={(e) => setFilters({ priority: e.target.value, page: 1 })}
                    >
                        <option value="">Wszystkie priorytety</option>
                        <option value="LOW">Niski</option>
                        <option value="MEDIUM">Średni</option>
                        <option value="HIGH">Wysoki</option>
                        <option value="URGENT">Pilne</option>
                    </select>
                    <label
                        className="flex items-center gap-2 px-4 py-2.5 border rounded-lg cursor-pointer transition-colors"
                        style={{
                            backgroundColor: 'var(--card)',
                            borderColor: 'var(--border)',
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={filters.overdue || false}
                            onChange={(e) => setFilters({ overdue: e.target.checked || undefined, page: 1 })}
                            className="w-4 h-4 text-primary rounded"
                        />
                        <span className="text-foreground text-sm">Tylko zaległe</span>
                    </label>
                </div>
            </div>

            {error && (
                <div
                    className="mb-6 p-4 rounded-lg border"
                    style={{
                        backgroundColor: 'var(--error-bg, rgba(239, 68, 68, 0.1))',
                        borderColor: 'var(--error-border, rgba(239, 68, 68, 0.25))',
                        color: 'var(--error-text, #ef4444)',
                    }}
                >
                    {error}
                    <button onClick={refetch} className="ml-2 underline hover:opacity-80">
                        Spróbuj ponownie
                    </button>
                </div>
            )}

            {loading && followUps.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card shadow-card">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                            <tr className="border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-subtle)' }}>
                                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Follow-up</th>
                                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground hidden md:table-cell">Powiązanie</th>
                                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground hidden sm:table-cell">Typ</th>
                                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground hidden lg:table-cell">Priorytet</th>
                                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Termin</th>
                                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground hidden sm:table-cell">Status</th>
                                <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Akcje</th>
                            </tr>
                            </thead>
                            <tbody>
                            {Array.from({ length: 6 }).map((_, i) => (
                                <SkeletonTableRow key={i} columns={7} />
                            ))}
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
                        title={hasFilters ? 'Brak wyników' : 'Brak follow-upów'}
                        description={
                            hasFilters
                                ? 'Spróbuj zmienić kryteria wyszukiwania'
                                : 'Utwórz pierwszy follow-up, aby śledzić zadania i przypomnienia'
                        }
                        action={
                            hasFilters
                                ? undefined
                                : { label: 'Nowy follow-up', onClick: () => router.push('/dashboard/followups/new') }
                        }
                    />
                </div>
            ) : (
                <div className="rounded-2xl border border-border bg-card shadow-card">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                            <tr className="border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-subtle)' }}>
                                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Follow-up</th>
                                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground hidden md:table-cell">Powiązanie</th>
                                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground hidden sm:table-cell">Typ</th>
                                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground hidden lg:table-cell">Priorytet</th>
                                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Termin</th>
                                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground hidden sm:table-cell">Status</th>
                                <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Akcje</th>
                            </tr>
                            </thead>
                            <tbody>
                            {followUps.map((followUp) => {
                                const overdue = isOverdue(followUp);
                                const status = overdue ? statusConfig.OVERDUE : statusConfig[followUp.status];
                                const type = typeConfig[followUp.type];
                                const priority = priorityConfig[followUp.priority];

                                return (
                                    <tr
                                        key={followUp.id}
                                        className={`border-b cursor-pointer border-b border-border transition-colors hover:bg-secondary/40 ${
                                            overdue ? 'border-l-4 border-l-red-500' : ''
                                        }`}
                                        style={{
                                            borderBottomColor: 'var(--border)',
                                            backgroundColor: overdue ? 'rgba(239, 68, 68, 0.04)' : undefined,
                                        }}
                                        onClick={() => router.push(`/dashboard/followups/${followUp.id}`)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-start gap-2">
                                                {overdue && (
                                                    <span className="text-status-rejected animate-pulse flex-shrink-0 mt-0.5" title="Zaległy!">⚠️</span>
                                                )}
                                                <div>
                                                    <p className="font-medium text-foreground">{followUp.title}</p>
                                                    {followUp.description && (
                                                        <p className="text-sm text-muted-foreground truncate max-w-xs">
                                                            {followUp.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <div className="text-sm">
                                                {followUp.client && (
                                                    <p className="text-foreground">{followUp.client.name}</p>
                                                )}
                                                {followUp.offer && (
                                                    <p className="text-muted-foreground">Oferta: {followUp.offer.number}</p>
                                                )}
                                                {followUp.contract && (
                                                    <p className="text-muted-foreground">Umowa: {followUp.contract.number}</p>
                                                )}
                                                {!followUp.client && !followUp.offer && !followUp.contract && (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden sm:table-cell">
                                            <span className="inline-flex items-center gap-1.5">
                                                <span>{type.icon}</span>
                                                <span className="text-sm text-foreground">{type.label}</span>
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 hidden lg:table-cell">
                                            <Badge className={`${priority.bgColor} ${priority.color}`}>
                                                {priority.label}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-sm ${overdue ? 'text-status-rejected font-semibold' : 'text-muted-foreground'}`}>
                                                {formatDate(followUp.dueDate)}
                                                {overdue && (
                                                    <span className="block text-xs text-destructive mt-0.5">Zaległy!</span>
                                                )}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 hidden sm:table-cell">
                                            <Badge className={`${status.bgColor} ${status.color}`}>
                                                {status.label}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                                {(followUp.status === 'PENDING' || followUp.status === 'OVERDUE') && (
                                                    <button
                                                        onClick={() => handleComplete(followUp)}
                                                        disabled={completingId === followUp.id}
                                                        className="p-2 text-muted-foreground rounded-lg transition-colors disabled:opacity-50"
                                                        style={{ backgroundColor: 'transparent' }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.15)';
                                                            e.currentTarget.style.color = '#10b981';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.backgroundColor = 'transparent';
                                                            e.currentTarget.style.color = 'var(--muted-foreground)';
                                                        }}
                                                        title="Oznacz jako wykonane"
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
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.backgroundColor = 'var(--accent)';
                                                        e.currentTarget.style.color = 'var(--primary)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.backgroundColor = 'transparent';
                                                        e.currentTarget.style.color = 'var(--muted-foreground)';
                                                    }}
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => setDeleteModal({ isOpen: true, followUp })}
                                                    className="p-2 text-muted-foreground rounded-lg transition-colors"
                                                    style={{ backgroundColor: 'transparent' }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                                                        e.currentTarget.style.color = '#ef4444';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.backgroundColor = 'transparent';
                                                        e.currentTarget.style.color = 'var(--muted-foreground)';
                                                    }}
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
                                Pokazano {followUps.length} z {total} follow-upów
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page === 1}
                                    onClick={() => setFilters({ page: page - 1 })}
                                >
                                    Poprzednia
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page === totalPages}
                                    onClick={() => setFilters({ page: page + 1 })}
                                >
                                    Następna
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <ConfirmDialog
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, followUp: null })}
                onConfirm={handleDelete}
                title="Usuń follow-up"
                description={`Czy na pewno chcesz usunąć follow-up "${deleteModal.followUp?.title}"? Ta operacja jest nieodwracalna.`}
                confirmLabel="Usuń"
                isLoading={isDeleting}
            />
        </div>
    );
}
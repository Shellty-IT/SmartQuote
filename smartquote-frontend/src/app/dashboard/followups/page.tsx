// src/app/dashboard/followups/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFollowUps, useFollowUpStats } from '@/hooks/useFollowUps';
import { Button, Card, Input, Badge, EmptyState, ConfirmDialog } from '@/components/ui';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatDate } from '@/lib/utils';
import { FollowUp, FollowUpStatus, FollowUpType, Priority } from '@/types';

// Konfiguracje dla statusów, typów i priorytetów
const statusConfig: Record<FollowUpStatus, { label: string; color: string; bgColor: string }> = {
    PENDING: { label: 'Oczekujące', color: 'text-amber-700', bgColor: 'bg-amber-50' },
    COMPLETED: { label: 'Wykonane', color: 'text-green-700', bgColor: 'bg-green-50' },
    CANCELLED: { label: 'Anulowane', color: 'text-slate-700', bgColor: 'bg-slate-100' },
    OVERDUE: { label: 'Zaległe', color: 'text-red-700', bgColor: 'bg-red-50' },
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
    LOW: { label: 'Niski', color: 'text-slate-600', bgColor: 'bg-slate-100' },
    MEDIUM: { label: 'Średni', color: 'text-blue-700', bgColor: 'bg-blue-50' },
    HIGH: { label: 'Wysoki', color: 'text-orange-700', bgColor: 'bg-orange-50' },
    URGENT: { label: 'Pilne', color: 'text-red-700', bgColor: 'bg-red-50' },
};

export default function FollowUpsPage() {
    const router = useRouter();
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

    const { stats } = useFollowUpStats();

    const [searchValue, setSearchValue] = useState('');
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; followUp: FollowUp | null }>({
        isOpen: false,
        followUp: null,
    });
    const [isDeleting, setIsDeleting] = useState(false);
    const [completingId, setCompletingId] = useState<string | null>(null);

    const handleSearch = (value: string) => {
        setSearchValue(value);
        setFilters({ search: value, page: 1 });
    };

    const handleDelete = async () => {
        if (!deleteModal.followUp) return;

        setIsDeleting(true);
        try {
            await deleteFollowUp(deleteModal.followUp.id);
            setDeleteModal({ isOpen: false, followUp: null });
        } catch (error) {
            console.error('Delete error:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleComplete = async (followUp: FollowUp) => {
        setCompletingId(followUp.id);
        try {
            await completeFollowUp(followUp.id);
        } catch (error) {
            console.error('Complete error:', error);
        } finally {
            setCompletingId(null);
        }
    };

    const isOverdue = (followUp: FollowUp) => {
        if (followUp.status === 'COMPLETED' || followUp.status === 'CANCELLED') return false;
        return new Date(followUp.dueDate) < new Date();
    };

    if (loading && followUps.length === 0) {
        return <PageLoader />;
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Follow-upy</h1>
                    <p className="text-slate-500 mt-1">Zarządzaj zadaniami i przypomnieniami</p>
                </div>
                <Button onClick={() => router.push('/dashboard/followups/new')}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nowy follow-up
                </Button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card className="!p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Oczekujące</p>
                                <p className="text-2xl font-bold text-slate-900">{stats.byStatus?.PENDING || 0}</p>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                                <span className="text-xl">⏳</span>
                            </div>
                        </div>
                    </Card>
                    <Card className="!p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Zaległe</p>
                                <p className="text-2xl font-bold text-red-600">{stats.overdue || 0}</p>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                                <span className="text-xl">🚨</span>
                            </div>
                        </div>
                    </Card>
                    <Card className="!p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Na dziś</p>
                                <p className="text-2xl font-bold text-blue-600">{stats.todayDue || 0}</p>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                <span className="text-xl">📅</span>
                            </div>
                        </div>
                    </Card>
                    <Card className="!p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Wykonane (miesiąc)</p>
                                <p className="text-2xl font-bold text-green-600">{stats.completedThisMonth || 0}</p>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                <span className="text-xl">✅</span>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Filters */}
            <Card className="mb-6">
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
                        className="px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                        value={filters.status || ''}
                        onChange={(e) => setFilters({ status: e.target.value, page: 1 })}
                    >
                        <option value="">Wszystkie statusy</option>
                        <option value="PENDING">Oczekujące</option>
                        <option value="COMPLETED">Wykonane</option>
                        <option value="CANCELLED">Anulowane</option>
                    </select>
                    <select
                        className="px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
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
                        className="px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                        value={filters.priority || ''}
                        onChange={(e) => setFilters({ priority: e.target.value, page: 1 })}
                    >
                        <option value="">Wszystkie priorytety</option>
                        <option value="LOW">Niski</option>
                        <option value="MEDIUM">Średni</option>
                        <option value="HIGH">Wysoki</option>
                        <option value="URGENT">Pilne</option>
                    </select>
                    <label className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 rounded-lg bg-white cursor-pointer hover:bg-slate-50">
                        <input
                            type="checkbox"
                            checked={filters.overdue || false}
                            onChange={(e) => setFilters({ overdue: e.target.checked || undefined, page: 1 })}
                            className="w-4 h-4 text-cyan-600 rounded"
                        />
                        <span className="text-slate-700 text-sm">Tylko zaległe</span>
                    </label>
                </div>
            </Card>

            {/* Error */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                    <button onClick={refetch} className="ml-2 underline">
                        Spróbuj ponownie
                    </button>
                </div>
            )}

            {/* Follow-ups List */}
            {followUps.length === 0 ? (
                <Card>
                    <EmptyState
                        icon={
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                        }
                        title="Brak follow-upów"
                        description="Utwórz pierwszy follow-up, aby śledzić zadania i przypomnienia"
                        action={{
                            label: 'Nowy follow-up',
                            onClick: () => router.push('/dashboard/followups/new'),
                        }}
                    />
                </Card>
            ) : (
                <Card padding="none">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                            <tr className="border-b border-slate-200 bg-slate-50">
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Follow-up
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Powiązanie
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Typ
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Priorytet
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Termin
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Akcje
                                </th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                            {followUps.map((followUp) => {
                                const status = isOverdue(followUp) ? statusConfig.OVERDUE : statusConfig[followUp.status];
                                const type = typeConfig[followUp.type];
                                const priority = priorityConfig[followUp.priority];

                                return (
                                    <tr
                                        key={followUp.id}
                                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                                        onClick={() => router.push(`/dashboard/followups/${followUp.id}`)}
                                    >
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-slate-900">{followUp.title}</p>
                                                {followUp.description && (
                                                    <p className="text-sm text-slate-500 truncate max-w-xs">
                                                        {followUp.description}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm">
                                                {followUp.client && (
                                                    <p className="text-slate-900">{followUp.client.name}</p>
                                                )}
                                                {followUp.offer && (
                                                    <p className="text-slate-500">Oferta: {followUp.offer.number}</p>
                                                )}
                                                {followUp.contract && (
                                                    <p className="text-slate-500">Umowa: {followUp.contract.number}</p>
                                                )}
                                                {!followUp.client && !followUp.offer && !followUp.contract && (
                                                    <span className="text-slate-400">-</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5">
                                                <span>{type.icon}</span>
                                                <span className="text-sm text-slate-700">{type.label}</span>
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge className={`${priority.bgColor} ${priority.color}`}>
                                                {priority.label}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-sm ${isOverdue(followUp) ? 'text-red-600 font-medium' : 'text-slate-600'}`}>
                                                {formatDate(followUp.dueDate)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge className={`${status.bgColor} ${status.color}`}>
                                                {status.label}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                                {followUp.status === 'PENDING' && (
                                                    <button
                                                        onClick={() => handleComplete(followUp)}
                                                        disabled={completingId === followUp.id}
                                                        className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
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
                                                    className="p-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => setDeleteModal({ isOpen: true, followUp })}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                            <p className="text-sm text-slate-500">
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
                </Card>
            )}

            {/* Delete Confirmation */}
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
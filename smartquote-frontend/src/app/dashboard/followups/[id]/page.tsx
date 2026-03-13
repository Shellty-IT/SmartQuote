// src/app/dashboard/followups/[id]/page.tsx
'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useFollowUp } from '@/hooks/useFollowUps';
import { followUpsApi } from '@/lib/api';
import { Button, Card, Badge, ConfirmDialog } from '@/components/ui';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatDate } from '@/lib/utils';
import { FollowUpStatus, FollowUpType, Priority } from '@/types';

const statusConfig: Record<FollowUpStatus, { label: string; color: string; bgColor: string }> = {
    PENDING: { label: 'Oczekujące', color: 'text-amber-700 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-900/30' },
    COMPLETED: { label: 'Wykonane', color: 'text-green-700 dark:text-green-400', bgColor: 'bg-green-50 dark:bg-green-900/30' },
    CANCELLED: { label: 'Anulowane', color: 'text-slate-700 dark:text-slate-300', bgColor: 'bg-slate-100 dark:bg-slate-700/50' },
    OVERDUE: { label: 'Zaległe', color: 'text-red-700 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-900/30' },
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
    LOW: { label: 'Niski', color: 'text-slate-600 dark:text-slate-400', bgColor: 'bg-slate-100 dark:bg-slate-700/50' },
    MEDIUM: { label: 'Średni', color: 'text-blue-700 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-900/30' },
    HIGH: { label: 'Wysoki', color: 'text-orange-700 dark:text-orange-400', bgColor: 'bg-orange-50 dark:bg-orange-900/30' },
    URGENT: { label: 'Pilne', color: 'text-red-700 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-900/30' },
};

export default function FollowUpDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { followUp, loading, error, refetch } = useFollowUp(id);
    const [isCompleting, setIsCompleting] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const isOverdue = followUp &&
        followUp.status === 'PENDING' &&
        new Date(followUp.dueDate) < new Date();

    const handleComplete = async () => {
        if (!followUp) return;
        setIsCompleting(true);
        try {
            await followUpsApi.complete(followUp.id);
            refetch();
        } catch (error) {
            console.error('Error completing follow-up:', error);
        } finally {
            setIsCompleting(false);
        }
    };

    const handleDelete = async () => {
        if (!followUp) return;
        setIsDeleting(true);
        try {
            await followUpsApi.delete(followUp.id);
            router.push('/dashboard/followups');
        } catch (error) {
            console.error('Error deleting follow-up:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) return <PageLoader />;

    if (error || !followUp) {
        return (
            <div className="p-4 md:p-8">
                <Card>
                    <div className="text-center py-12">
                        <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Nie znaleziono follow-upa'}</p>
                        <Button onClick={() => router.push('/dashboard/followups')}>
                            Wróć do listy
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    const status = isOverdue ? statusConfig.OVERDUE : statusConfig[followUp.status];
    const type = typeConfig[followUp.type];
    const priority = priorityConfig[followUp.priority];

    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/dashboard/followups')}
                        className="p-2 text-themed-muted hover:text-themed hover-themed rounded-lg"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center text-white text-2xl">
                        {type.icon}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-themed">{followUp.title}</h1>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                            <Badge className={`${status.bgColor} ${status.color}`}>
                                {status.label}
                            </Badge>
                            <Badge className={`${priority.bgColor} ${priority.color}`}>
                                {priority.label}
                            </Badge>
                            <span className="text-sm text-themed-muted">{type.label}</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap gap-3">
                    {followUp.status === 'PENDING' && (
                        <Button
                            variant="outline"
                            onClick={handleComplete}
                            isLoading={isCompleting}
                            className="text-green-600 dark:text-green-400 border-green-300 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/30"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Oznacz jako wykonane
                        </Button>
                    )}
                    <Button variant="outline" onClick={() => router.push(`/dashboard/followups/${followUp.id}/edit`)}>
                        Edytuj
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setDeleteModal(true)}
                        className="text-red-600 dark:text-red-400 border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
                    >
                        Usuń
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {followUp.description && (
                        <Card>
                            <h2 className="text-lg font-semibold text-themed mb-4">Opis</h2>
                            <p className="text-themed whitespace-pre-wrap">{followUp.description}</p>
                        </Card>
                    )}

                    {followUp.notes && (
                        <Card>
                            <h2 className="text-lg font-semibold text-themed mb-4">Notatki</h2>
                            <p className="text-themed whitespace-pre-wrap">{followUp.notes}</p>
                        </Card>
                    )}

                    {(followUp.client || followUp.offer || followUp.contract) && (
                        <Card>
                            <h2 className="text-lg font-semibold text-themed mb-4">Powiązania</h2>
                            <div className="space-y-3">
                                {followUp.client && (
                                    <div
                                        onClick={() => router.push(`/dashboard/clients/${followUp.client!.id}`)}
                                        className="flex items-center justify-between p-4 section-themed rounded-xl hover-themed cursor-pointer transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                                <svg className="w-5 h-5 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-sm text-themed-muted">Klient</p>
                                                <p className="font-medium text-themed">{followUp.client.name}</p>
                                            </div>
                                        </div>
                                        <svg className="w-5 h-5 text-themed-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                )}
                                {followUp.offer && (
                                    <div
                                        onClick={() => router.push(`/dashboard/offers/${followUp.offer!.id}`)}
                                        className="flex items-center justify-between p-4 section-themed rounded-xl hover-themed cursor-pointer transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                                                <svg className="w-5 h-5 text-cyan-600 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-sm text-themed-muted">Oferta</p>
                                                <p className="font-medium text-themed">{followUp.offer.number} - {followUp.offer.title}</p>
                                            </div>
                                        </div>
                                        <svg className="w-5 h-5 text-themed-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                )}
                                {followUp.contract && (
                                    <div
                                        onClick={() => router.push(`/dashboard/contracts/${followUp.contract!.id}`)}
                                        className="flex items-center justify-between p-4 section-themed rounded-xl hover-themed cursor-pointer transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-sm text-themed-muted">Umowa</p>
                                                <p className="font-medium text-themed">{followUp.contract.number} - {followUp.contract.title}</p>
                                            </div>
                                        </div>
                                        <svg className="w-5 h-5 text-themed-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        </Card>
                    )}
                </div>

                <div className="space-y-6">
                    <Card>
                        <h2 className="text-lg font-semibold text-themed mb-4">Szczegóły</h2>
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-themed-muted">Termin</span>
                                <span className={`font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-themed'}`}>
                  {formatDate(followUp.dueDate)}
                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-themed-muted">Typ</span>
                                <span className="text-themed">{type.icon} {type.label}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-themed-muted">Priorytet</span>
                                <Badge className={`${priority.bgColor} ${priority.color}`}>
                                    {priority.label}
                                </Badge>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-themed-muted">Status</span>
                                <Badge className={`${status.bgColor} ${status.color}`}>
                                    {status.label}
                                </Badge>
                            </div>
                            {followUp.completedAt && (
                                <div className="flex justify-between">
                                    <span className="text-themed-muted">Wykonano</span>
                                    <span className="text-themed">{formatDate(followUp.completedAt)}</span>
                                </div>
                            )}
                            <div className="pt-4 border-t divider-themed">
                                <div className="flex justify-between">
                                    <span className="text-themed-muted">Utworzono</span>
                                    <span className="text-themed">{formatDate(followUp.createdAt)}</span>
                                </div>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-themed-muted">Ostatnia aktualizacja</span>
                                <span className="text-themed">{formatDate(followUp.updatedAt)}</span>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <h2 className="text-lg font-semibold text-themed mb-4">Szybkie akcje</h2>
                        <div className="space-y-2">
                            {followUp.status === 'PENDING' && (
                                <Button
                                    variant="outline"
                                    className="w-full justify-start text-green-600 dark:text-green-400"
                                    onClick={handleComplete}
                                    isLoading={isCompleting}
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Oznacz jako wykonane
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => router.push('/dashboard/followups/new')}
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Nowy follow-up
                            </Button>
                            {followUp.client?.email && (
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => window.location.href = `mailto:${followUp.client!.email}`}
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    Wyślij email
                                </Button>
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            <ConfirmDialog
                isOpen={deleteModal}
                onClose={() => setDeleteModal(false)}
                onConfirm={handleDelete}
                title="Usuń follow-up"
                description={`Czy na pewno chcesz usunąć follow-up "${followUp.title}"? Ta operacja jest nieodwracalna.`}
                confirmLabel="Usuń"
                isLoading={isDeleting}
            />
        </div>
    );
}
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
            <div className="p-8">
                <Card>
                    <div className="text-center py-12">
                        <p className="text-red-600 mb-4">{error || 'Nie znaleziono follow-upa'}</p>
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
        <div className="p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/dashboard/followups')}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center text-white text-2xl">
                        {type.icon}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{followUp.title}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge className={`${status.bgColor} ${status.color}`}>
                                {status.label}
                            </Badge>
                            <Badge className={`${priority.bgColor} ${priority.color}`}>
                                {priority.label}
                            </Badge>
                            <span className="text-sm text-slate-500">{type.label}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    {followUp.status === 'PENDING' && (
                        <Button
                            variant="outline"
                            onClick={handleComplete}
                            isLoading={isCompleting}
                            className="text-green-600 border-green-300 hover:bg-green-50"
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
                        className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                        Usuń
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    {followUp.description && (
                        <Card>
                            <h2 className="text-lg font-semibold text-slate-900 mb-4">Opis</h2>
                            <p className="text-slate-700 whitespace-pre-wrap">{followUp.description}</p>
                        </Card>
                    )}

                    {followUp.notes && (
                        <Card>
                            <h2 className="text-lg font-semibold text-slate-900 mb-4">Notatki</h2>
                            <p className="text-slate-700 whitespace-pre-wrap">{followUp.notes}</p>
                        </Card>
                    )}

                    {/* Related Items */}
                    {(followUp.client || followUp.offer || followUp.contract) && (
                        <Card>
                            <h2 className="text-lg font-semibold text-slate-900 mb-4">Powiązania</h2>
                            <div className="space-y-3">
                                {followUp.client && (
                                    <div
                                        onClick={() => router.push(`/dashboard/clients/${followUp.client!.id}`)}
                                        className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                                                <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-500">Klient</p>
                                                <p className="font-medium text-slate-900">{followUp.client.name}</p>
                                            </div>
                                        </div>
                                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                )}
                                {followUp.offer && (
                                    <div
                                        onClick={() => router.push(`/dashboard/offers/${followUp.offer!.id}`)}
                                        className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
                                                <svg className="w-5 h-5 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-500">Oferta</p>
                                                <p className="font-medium text-slate-900">{followUp.offer.number} - {followUp.offer.title}</p>
                                            </div>
                                        </div>
                                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                )}
                                {followUp.contract && (
                                    <div
                                        onClick={() => router.push(`/dashboard/contracts/${followUp.contract!.id}`)}
                                        className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-500">Umowa</p>
                                                <p className="font-medium text-slate-900">{followUp.contract.number} - {followUp.contract.title}</p>
                                            </div>
                                        </div>
                                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">Szczegóły</h2>
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Termin</span>
                                <span className={`font-medium ${isOverdue ? 'text-red-600' : 'text-slate-900'}`}>
                                    {formatDate(followUp.dueDate)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Typ</span>
                                <span className="text-slate-900">{type.icon} {type.label}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Priorytet</span>
                                <Badge className={`${priority.bgColor} ${priority.color}`}>
                                    {priority.label}
                                </Badge>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Status</span>
                                <Badge className={`${status.bgColor} ${status.color}`}>
                                    {status.label}
                                </Badge>
                            </div>
                            {followUp.completedAt && (
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Wykonano</span>
                                    <span className="text-slate-900">{formatDate(followUp.completedAt)}</span>
                                </div>
                            )}
                            <div className="pt-4 border-t border-slate-200">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Utworzono</span>
                                    <span className="text-slate-900">{formatDate(followUp.createdAt)}</span>
                                </div>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Ostatnia aktualizacja</span>
                                <span className="text-slate-900">{formatDate(followUp.updatedAt)}</span>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">Szybkie akcje</h2>
                        <div className="space-y-2">
                            {followUp.status === 'PENDING' && (
                                <Button
                                    variant="outline"
                                    className="w-full justify-start text-green-600"
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

            {/* Delete Confirmation */}
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
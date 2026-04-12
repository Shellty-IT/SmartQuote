// src/app/dashboard/offers/[id]/components/emails/EmailsTab.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { emailsApi } from '@/lib/api/emails.api';
import { EmptyState } from '@/components/ui';
import type { EmailLog, EmailLogStatus } from '@/types/email.types';

interface EmailsTabProps {
    offerId: string;
    offerNumber: string;
}

function EmailStatusBadge({ status }: { status: EmailLogStatus }) {
    const config: Record<EmailLogStatus, { label: string; classes: string }> = {
        SENT: { label: 'Wysłano', classes: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
        FAILED: { label: 'Błąd', classes: 'bg-red-500/15 text-red-600 dark:text-red-400' },
        DRAFT: { label: 'Szkic', classes: 'bg-slate-500/15 text-slate-600 dark:text-slate-400' },
    };
    const { label, classes } = config[status];
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${classes}`}>
            {label}
        </span>
    );
}

function SkeletonRow() {
    return (
        <div className="flex items-start gap-3 p-4 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-48" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-72" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-32" />
            </div>
        </div>
    );
}

export function EmailsTab({ offerId, offerNumber }: EmailsTabProps) {
    const router = useRouter();
    const [items, setItems] = useState<EmailLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await emailsApi.list({ offerId, limit: 50 });
            if (!res.data) throw new Error('Brak danych');
            setItems(res.data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Błąd ładowania');
        } finally {
            setIsLoading(false);
        }
    }, [offerId]);

    useEffect(() => { load(); }, [load]);

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleString('pl-PL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-semibold text-themed">Historia korespondencji</h3>
                    <p className="text-xs text-themed-muted mt-0.5">
                        Wiadomości email powiązane z ofertą {offerNumber}
                    </p>
                </div>
                <button
                    onClick={() => router.push(`/dashboard/emails/new?offerId=${offerId}`)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-medium transition-colors"
                >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Nowa wiadomość
                </button>
            </div>

            <div className="card-themed border rounded-xl overflow-hidden">
                {error && (
                    <div className="p-4 text-sm text-red-600 dark:text-red-400 text-center">
                        {error}
                    </div>
                )}

                {isLoading ? (
                    <div className="divide-y divider-themed">
                        {[1, 2, 3].map(i => <SkeletonRow key={i} />)}
                    </div>
                ) : items.length === 0 ? (
                    <EmptyState
                        icon={
                            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        }
                        title="Brak wiadomości"
                        description="Nie wysłano jeszcze żadnych wiadomości email w kontekście tej oferty"
                    />
                ) : (
                    <div className="divide-y divider-themed">
                        {items.map(item => (
                            <div
                                key={item.id}
                                onClick={() => router.push(`/dashboard/emails/${item.id}`)}
                                className="flex items-start gap-3 p-4 hover-themed cursor-pointer transition-colors group"
                            >
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center mt-0.5">
                                    <svg className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-medium text-themed truncate">
                                            {item.toName ? item.toName : item.to}
                                        </span>
                                        <EmailStatusBadge status={item.status} />
                                        {item.attachments && item.attachments.length > 0 && (
                                            <span className="text-xs text-themed-muted flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                                </svg>
                                                {item.attachments.length}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-themed mt-0.5 truncate">{item.subject}</p>
                                    <p className="text-xs text-themed-muted mt-0.5">{formatDate(item.sentAt)}</p>
                                    {item.errorMessage && (
                                        <p className="text-xs text-red-500 mt-0.5 truncate">{item.errorMessage}</p>
                                    )}
                                </div>

                                <svg className="w-4 h-4 text-themed-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {items.length > 0 && (
                <div className="text-center">
                    <button
                        onClick={() => router.push(`/dashboard/emails?offerId=${offerId}`)}
                        className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline"
                    >
                        Zobacz pełną historię w module Korespondencja →
                    </button>
                </div>
            )}
        </div>
    );
}
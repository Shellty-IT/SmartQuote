// src/app/dashboard/emails/[id]/page.tsx
'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui';
import { emailsApi } from '@/lib/api/emails.api';
import type { EmailLog, EmailLogStatus, EmailAttachment } from '@/types/email.types';

interface PageProps {
    params: Promise<{ id: string }>;
}

function EmailStatusBadge({ status }: { status: EmailLogStatus }) {
    const config: Record<EmailLogStatus, { label: string; classes: string }> = {
        SENT: { label: 'Wysłano', classes: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
        FAILED: { label: 'Błąd wysyłki', classes: 'bg-red-500/15 text-red-600 dark:text-red-400' },
        DRAFT: { label: 'Szkic', classes: 'bg-slate-500/15 text-slate-600 dark:text-slate-400' },
    };
    const { label, classes } = config[status];
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${classes}`}>
            {label}
        </span>
    );
}

function AttachmentItem({ att }: { att: EmailAttachment }) {
    const isPdf = att.type === 'offer_pdf' || att.type === 'contract_pdf';
    const typeLabels: Record<EmailAttachment['type'], string> = {
        offer_pdf: 'PDF oferty',
        contract_pdf: 'PDF umowy',
        offer_link: 'Link oferty',
        contract_link: 'Link umowy',
    };
    return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            {isPdf ? (
                <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
            ) : (
                <svg className="w-4 h-4 text-cyan-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
            )}
            <div>
                <p className="text-xs font-medium text-themed">{att.name}</p>
                <p className="text-xs text-themed-muted">{typeLabels[att.type]}</p>
            </div>
        </div>
    );
}

export default function EmailDetailPage({ params }: PageProps) {
    const { id } = use(params);
    const router = useRouter();
    const [log, setLog] = useState<EmailLog | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await emailsApi.get(id);
                if (!res.data) throw new Error('Brak danych');
                setLog(res.data);
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : 'Błąd ładowania');
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [id]);

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleString('pl-PL', {
            day: '2-digit', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });

    if (isLoading) {
        return (
            <div className="p-4 md:p-8 max-w-3xl mx-auto">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-48" />
                    <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="h-48 bg-slate-200 dark:bg-slate-700 rounded" />
                </div>
            </div>
        );
    }

    if (error || !log) {
        return (
            <div className="p-4 md:p-8 max-w-3xl mx-auto">
                <Card>
                    <div className="text-center py-12">
                        <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Nie znaleziono wiadomości'}</p>
                        <button
                            onClick={() => router.push('/dashboard/emails')}
                            className="px-4 py-2 rounded-xl bg-cyan-600 text-white text-sm"
                        >
                            Wróć do listy
                        </button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-3xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => router.push('/dashboard/emails')}
                    className="p-2 text-themed-muted hover-themed rounded-lg transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
                <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-xl font-bold text-themed">{log.subject}</h1>
                        <EmailStatusBadge status={log.status} />
                    </div>
                    <p className="text-themed-muted text-sm mt-0.5">{formatDate(log.sentAt)}</p>
                </div>
                {log.status === 'DRAFT' && (
                    <button
                        onClick={() => router.push(`/dashboard/emails/${id}/edit`)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Edytuj i wyślij
                    </button>
                )}
            </div>

            <div className="space-y-4">
                <Card>
                    <h2 className="text-xs font-semibold text-themed-muted uppercase tracking-wide mb-3">Szczegóły</h2>
                    <dl className="space-y-2">
                        <div className="flex gap-4">
                            <dt className="text-sm text-themed-muted w-20 flex-shrink-0">Do:</dt>
                            <dd className="text-sm text-themed">
                                {log.toName ? `${log.toName} <${log.to}>` : log.to}
                            </dd>
                        </div>
                        <div className="flex gap-4">
                            <dt className="text-sm text-themed-muted w-20 flex-shrink-0">Temat:</dt>
                            <dd className="text-sm text-themed">{log.subject}</dd>
                        </div>
                        {log.client && (
                            <div className="flex gap-4">
                                <dt className="text-sm text-themed-muted w-20 flex-shrink-0">Klient:</dt>
                                <dd className="text-sm text-themed">
                                    <button
                                        onClick={() => router.push(`/dashboard/clients/${log.client!.id}`)}
                                        className="text-cyan-600 dark:text-cyan-400 hover:underline"
                                    >
                                        {log.client.name}
                                    </button>
                                </dd>
                            </div>
                        )}
                        {log.offer && (
                            <div className="flex gap-4">
                                <dt className="text-sm text-themed-muted w-20 flex-shrink-0">Oferta:</dt>
                                <dd className="text-sm text-themed">
                                    <button
                                        onClick={() => router.push(`/dashboard/offers/${log.offer!.id}`)}
                                        className="text-cyan-600 dark:text-cyan-400 hover:underline"
                                    >
                                        {log.offer.number} — {log.offer.title}
                                    </button>
                                </dd>
                            </div>
                        )}
                        {log.contract && (
                            <div className="flex gap-4">
                                <dt className="text-sm text-themed-muted w-20 flex-shrink-0">Umowa:</dt>
                                <dd className="text-sm text-themed">
                                    <button
                                        onClick={() => router.push(`/dashboard/contracts/${log.contract!.id}`)}
                                        className="text-emerald-600 dark:text-emerald-400 hover:underline"
                                    >
                                        {log.contract.number} — {log.contract.title}
                                    </button>
                                </dd>
                            </div>
                        )}
                        {log.errorMessage && (
                            <div className="flex gap-4">
                                <dt className="text-sm text-themed-muted w-20 flex-shrink-0">Błąd:</dt>
                                <dd className="text-sm text-red-600 dark:text-red-400">{log.errorMessage}</dd>
                            </div>
                        )}
                    </dl>
                </Card>

                <Card>
                    <h2 className="text-xs font-semibold text-themed-muted uppercase tracking-wide mb-3">Treść wiadomości</h2>
                    <div className="prose prose-sm max-w-none text-themed whitespace-pre-wrap leading-relaxed">
                        {log.body}
                    </div>
                </Card>

                {log.attachments && log.attachments.length > 0 && (
                    <Card>
                        <h2 className="text-xs font-semibold text-themed-muted uppercase tracking-wide mb-3">
                            Załączniki ({log.attachments.length})
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {log.attachments.map((att, i) => (
                                <AttachmentItem key={i} att={att} />
                            ))}
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}
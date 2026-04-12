// src/app/dashboard/emails/page.tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, ConfirmDialog, EmptyState } from '@/components/ui';
import { useEmailList } from '@/hooks/useEmailList';
import type { EmailLog, EmailLogStatus } from '@/types/email.types';

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

function AttachmentBadges({ attachments }: { attachments: EmailLog['attachments'] }) {
    if (!attachments || attachments.length === 0) return null;
    return (
        <div className="flex flex-wrap gap-1 mt-1">
            {attachments.map((att, i) => {
                const isPdf = att.type === 'offer_pdf' || att.type === 'contract_pdf';
                return (
                    <span
                        key={i}
                        className="inline-flex items-center gap-1 text-xs text-themed-muted bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded"
                    >
                        {isPdf ? (
                            <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                            </svg>
                        ) : (
                            <svg className="w-3 h-3 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                        )}
                        {att.name}
                    </span>
                );
            })}
        </div>
    );
}

function EmailListItem({
                           item,
                           onDelete,
                       }: {
    item: EmailLog;
    onDelete: (id: string) => void;
}) {
    const router = useRouter();
    const isDraft = item.status === 'DRAFT';

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' })
            + ' '
            + d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div
            className="flex items-start gap-4 p-4 hover-themed rounded-xl transition-colors cursor-pointer group"
            onClick={() => router.push(`/dashboard/emails/${item.id}`)}
        >
            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-cyan-500/10 flex items-center justify-center mt-0.5">
                <svg className="w-4 h-4 text-cyan-600 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-themed text-sm truncate">
                        {item.toName ? `${item.toName} <${item.to}>` : item.to}
                    </span>
                    <EmailStatusBadge status={item.status} />
                </div>
                <p className="text-sm text-themed mt-0.5 truncate">{item.subject}</p>
                <AttachmentBadges attachments={item.attachments} />
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="text-xs text-themed-muted">{formatDate(item.sentAt)}</span>
                    {item.offer && (
                        <span className="text-xs text-cyan-600 dark:text-cyan-400">
                            Oferta: {item.offer.number}
                        </span>
                    )}
                    {item.contract && (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400">
                            Umowa: {item.contract.number}
                        </span>
                    )}
                    {item.client && (
                        <span className="text-xs text-themed-muted">{item.client.name}</span>
                    )}
                    {item.errorMessage && (
                        <span className="text-xs text-red-500 truncate max-w-xs" title={item.errorMessage}>
                            {item.errorMessage}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                {isDraft && (
                    <Link
                        href={`/dashboard/emails/${item.id}/edit`}
                        onClick={e => e.stopPropagation()}
                        className="p-1.5 text-themed-muted hover:text-cyan-600 dark:hover:text-cyan-400 hover-themed rounded-lg transition-colors"
                        title="Edytuj szkic"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                    </Link>
                )}
                <button
                    onClick={e => { e.stopPropagation(); onDelete(item.id); }}
                    className="p-1.5 text-themed-muted hover:text-red-500 dark:hover:text-red-400 hover-themed rounded-lg transition-colors"
                    title="Usuń"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

function SkeletonRow() {
    return (
        <div className="flex items-start gap-4 p-4">
            <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-48" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-72" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-32" />
            </div>
        </div>
    );
}

function getEmptyStateProps(activeTab: 'sent' | 'drafts' | 'failed', hasFilters: boolean) {
    if (hasFilters) {
        return {
            title: 'Brak wyników',
            description: 'Spróbuj zmienić kryteria wyszukiwania',
        };
    }
    switch (activeTab) {
        case 'drafts':
            return {
                title: 'Brak szkiców',
                description: 'Zapisane szkice wiadomości pojawią się tutaj',
            };
        case 'failed':
            return {
                title: 'Brak błędów wysyłki',
                description: 'Wiadomości z błędem wysyłki pojawią się tutaj',
            };
        default:
            return {
                title: 'Brak wysłanych wiadomości',
                description: 'Kliknij "Nowa wiadomość" aby napisać do klienta',
            };
    }
}

export default function EmailsPage() {
    const {
        items,
        meta,
        isLoading,
        error,
        activeTab,
        setActiveTab,
        search,
        setSearch,
        page,
        setPage,
        deleteConfirmId,
        setDeleteConfirmId,
        isDeleting,
        handleDelete,
    } = useEmailList();

    const hasFilters = search.trim().length > 0;
    const emptyState = getEmptyStateProps(activeTab, hasFilters);

    const tabs: { id: 'sent' | 'drafts' | 'failed'; label: string; icon: React.ReactNode }[] = [
        {
            id: 'sent',
            label: 'Wysłane',
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
            ),
        },
        {
            id: 'drafts',
            label: 'Szkice',
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
            ),
        },
        {
            id: 'failed',
            label: 'Błędy',
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
        },
    ];

    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-themed">Korespondencja</h1>
                    <p className="text-themed-muted mt-1">Historia wiadomości email i szkice</p>
                </div>
                <div className="flex gap-2">
                    <Link
                        href="/dashboard/emails/templates"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-themed hover-themed transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h8" />
                        </svg>
                        Szablony
                    </Link>
                    <Link
                        href="/dashboard/emails/new"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Nowa wiadomość
                    </Link>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex gap-1 section-themed rounded-xl p-1 w-fit">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                activeTab === tab.id
                                    ? 'card-themed text-themed shadow-sm'
                                    : 'text-themed-muted hover-themed'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="relative flex-1 max-w-sm">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-themed-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Szukaj po temacie lub odbiorcy..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-themed text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                    />
                </div>
            </div>

            <Card>
                {error && (
                    <div className="p-4 text-red-600 dark:text-red-400 text-sm text-center">{error}</div>
                )}

                {isLoading ? (
                    <div className="divide-y divider-themed">
                        {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
                    </div>
                ) : items.length === 0 ? (
                    <EmptyState
                        icon={
                            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        }
                        title={emptyState.title}
                        description={emptyState.description}
                    />
                ) : (
                    <div className="divide-y divider-themed">
                        {items.map(item => (
                            <EmailListItem
                                key={item.id}
                                item={item}
                                onDelete={id => setDeleteConfirmId(id)}
                            />
                        ))}
                    </div>
                )}

                {!isLoading && meta.totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t divider-themed">
                        <p className="text-sm text-themed-muted">
                            Strona {meta.page} z {meta.totalPages} ({meta.total} wiadomości)
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-themed disabled:opacity-40 hover-themed transition-colors"
                            >
                                Poprzednia
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                                disabled={page === meta.totalPages}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-themed disabled:opacity-40 hover-themed transition-colors"
                            >
                                Następna
                            </button>
                        </div>
                    </div>
                )}
            </Card>

            <ConfirmDialog
                isOpen={!!deleteConfirmId}
                onClose={() => setDeleteConfirmId(null)}
                onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
                title="Usuń wiadomość"
                description="Czy na pewno chcesz usunąć tę wiadomość? Operacja jest nieodwracalna."
                confirmLabel="Usuń"
                isLoading={isDeleting}
            />
        </div>
    );
}
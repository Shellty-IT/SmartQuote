// src/app/dashboard/emails/page.tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, ConfirmDialog, EmptyState } from '@/components/ui';
import { useEmailList } from '@/hooks/useEmailList';
import type { EmailLog, EmailLogStatus } from '@/types/email.types';

function EmailStatusBadge({ status }: { status: EmailLogStatus }) {
    const config: Record<EmailLogStatus, { label: string; bg: string; text: string }> = {
        SENT: { label: 'Wysłano', bg: '#0891b2', text: '#ffffff' },
        FAILED: { label: 'Błąd', bg: '#dc2626', text: '#ffffff' },
        DRAFT: { label: 'Szkic', bg: '#475569', text: '#ffffff' },
    };
    const { label, bg, text } = config[status];
    return (
        <span
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
            style={{ backgroundColor: bg, color: text }}
        >
            {label}
        </span>
    );
}

function AttachmentBadges({ attachments }: { attachments: EmailLog['attachments'] }) {
    if (!attachments || attachments.length === 0) return null;
    return (
        <div className="flex flex-wrap gap-1.5 mt-1.5">
            {attachments.map((att, i) => {
                if (att.type === 'offer_pdf') {
                    return (
                        <span key={i} className="email-attachment-offer">
                            <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                            </svg>
                            {att.name}
                        </span>
                    );
                }
                if (att.type === 'contract_pdf') {
                    return (
                        <span key={i} className="email-attachment-contract">
                            <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                            </svg>
                            {att.name}
                        </span>
                    );
                }
                return (
                    <span
                        key={i}
                        className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border"
                        style={{
                            borderColor: 'var(--divider)',
                            backgroundColor: 'var(--section-bg)',
                            color: 'var(--foreground)',
                        }}
                    >
                        <svg className="w-3 h-3 text-cyan-600 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
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
            className="flex items-start gap-4 p-4 rounded-xl transition-colors cursor-pointer group border mb-2 mx-2"
            style={{
                backgroundColor: 'var(--card-bg)',
                borderColor: 'var(--card-border)',
            }}
            onClick={() => router.push(`/dashboard/emails/${item.id}`)}
        >
            <div
                className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center mt-0.5"
                style={{ backgroundColor: 'rgba(6,182,212,0.12)' }}
            >
                <svg className="w-4 h-4" style={{ color: '#0891b2' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>
                        {item.toName ? `${item.toName} <${item.to}>` : item.to}
                    </span>
                    <EmailStatusBadge status={item.status} />
                </div>
                <p className="text-sm font-medium mt-0.5 truncate" style={{ color: 'var(--dash-section-title)' }}>
                    {item.subject}
                </p>
                <AttachmentBadges attachments={item.attachments} />
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="text-xs" style={{ color: 'var(--muted-text)' }}>{formatDate(item.sentAt)}</span>
                    {item.offer && (
                        <span className="text-xs font-medium" style={{ color: '#0891b2' }}>
                            Oferta: {item.offer.number}
                        </span>
                    )}
                    {item.contract && (
                        <span className="text-xs font-medium" style={{ color: '#059669' }}>
                            Umowa: {item.contract.number}
                        </span>
                    )}
                    {item.client && (
                        <span className="text-xs font-medium" style={{ color: 'var(--muted-text)' }}>{item.client.name}</span>
                    )}
                    {item.errorMessage && (
                        <span className="text-xs text-red-600 dark:text-red-400 truncate max-w-xs" title={item.errorMessage}>
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
                        className="p-1.5 rounded-lg transition-colors hover-themed"
                        style={{ color: 'var(--muted-text)' }}
                        title="Edytuj szkic"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                    </Link>
                )}
                <button
                    onClick={e => { e.stopPropagation(); onDelete(item.id); }}
                    className="p-1.5 rounded-lg transition-colors hover-themed hover:text-red-500"
                    style={{ color: 'var(--muted-text)' }}
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
        <div className="flex items-start gap-4 p-4 mx-2 mb-2 rounded-xl border" style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--card-bg)' }}>
            <div className="w-9 h-9 rounded-full animate-pulse flex-shrink-0" style={{ backgroundColor: 'var(--hover-bg)' }} />
            <div className="flex-1 space-y-2">
                <div className="h-4 rounded animate-pulse w-48" style={{ backgroundColor: 'var(--hover-bg)' }} />
                <div className="h-3 rounded animate-pulse w-72" style={{ backgroundColor: 'var(--hover-bg)' }} />
                <div className="h-3 rounded animate-pulse w-32" style={{ backgroundColor: 'var(--hover-bg)' }} />
            </div>
        </div>
    );
}

function getEmptyStateProps(activeTab: 'sent' | 'drafts' | 'failed', hasFilters: boolean) {
    if (hasFilters) {
        return { title: 'Brak wyników', description: 'Spróbuj zmienić kryteria wyszukiwania' };
    }
    switch (activeTab) {
        case 'drafts':
            return { title: 'Brak szkiców', description: 'Zapisane szkice wiadomości pojawią się tutaj' };
        case 'failed':
            return { title: 'Brak błędów wysyłki', description: 'Wiadomości z błędem wysyłki pojawią się tutaj' };
        default:
            return { title: 'Brak wysłanych wiadomości', description: 'Kliknij "Nowa wiadomość" aby napisać do klienta' };
    }
}

const TAB_STYLES: Record<'sent' | 'drafts' | 'failed', { active: { bg: string; text: string }; label: string }> = {
    sent: { active: { bg: '#0891b2', text: '#ffffff' }, label: 'Wysłane' },
    drafts: { active: { bg: '#475569', text: '#ffffff' }, label: 'Szkice' },
    failed: { active: { bg: '#dc2626', text: '#ffffff' }, label: 'Błędy' },
};

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

    const tabs: { id: 'sent' | 'drafts' | 'failed'; icon: React.ReactNode }[] = [
        {
            id: 'sent',
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
            ),
        },
        {
            id: 'drafts',
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
            ),
        },
        {
            id: 'failed',
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
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium transition-colors"
                        style={{ backgroundColor: '#059669' }}
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
                <div
                    className="flex gap-1.5 rounded-xl p-1.5 w-fit"
                    style={{ backgroundColor: 'var(--section-bg)', border: '1px solid var(--divider)' }}
                >
                    {tabs.map(tab => {
                        const style = TAB_STYLES[tab.id];
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                                style={
                                    isActive
                                        ? { backgroundColor: style.active.bg, color: style.active.text, boxShadow: '0 1px 4px rgba(0,0,0,0.18)' }
                                        : { backgroundColor: 'transparent', color: 'var(--muted-text)' }
                                }
                            >
                                {tab.icon}
                                {style.label}
                            </button>
                        );
                    })}
                </div>

                <div className="relative flex-1 max-w-sm">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted-text)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Szukaj po temacie lub odbiorcy..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-colors"
                        style={{
                            backgroundColor: 'var(--input-bg)',
                            borderColor: 'var(--input-border)',
                            color: 'var(--input-text)',
                        }}
                    />
                </div>
            </div>

            <div
                className="rounded-2xl border overflow-hidden"
                style={{ backgroundColor: 'var(--dash-section-bg)', borderColor: 'var(--dash-section-border)' }}
            >
                <div
                    className="px-5 py-3 border-b"
                    style={{ backgroundColor: 'var(--dash-section-header)', borderColor: 'var(--dash-section-border)' }}
                >
                    <h2 className="text-sm font-semibold" style={{ color: 'var(--dash-section-title)' }}>
                        {TAB_STYLES[activeTab].label}
                        {meta.total > 0 && (
                            <span className="ml-2 text-xs font-normal" style={{ color: 'var(--muted-text)' }}>
                                ({meta.total})
                            </span>
                        )}
                    </h2>
                </div>

                {error && (
                    <div className="p-4 text-red-600 dark:text-red-400 text-sm text-center">{error}</div>
                )}

                <div className="py-3">
                    {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
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
                        items.map(item => (
                            <EmailListItem
                                key={item.id}
                                item={item}
                                onDelete={id => setDeleteConfirmId(id)}
                            />
                        ))
                    )}
                </div>

                {!isLoading && meta.totalPages > 1 && (
                    <div
                        className="flex items-center justify-between px-5 py-3 border-t"
                        style={{ borderColor: 'var(--divider)' }}
                    >
                        <p className="text-sm" style={{ color: 'var(--muted-text)' }}>
                            Strona {meta.page} z {meta.totalPages} ({meta.total} wiadomości)
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1.5 rounded-lg border text-sm transition-colors disabled:opacity-40 hover-themed"
                                style={{ borderColor: 'var(--card-border)', color: 'var(--foreground)' }}
                            >
                                Poprzednia
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                                disabled={page === meta.totalPages}
                                className="px-3 py-1.5 rounded-lg border text-sm transition-colors disabled:opacity-40 hover-themed"
                                style={{ borderColor: 'var(--card-border)', color: 'var(--foreground)' }}
                            >
                                Następna
                            </button>
                        </div>
                    </div>
                )}
            </div>

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
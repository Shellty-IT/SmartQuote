// src/app/dashboard/notifications/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { notificationsApi } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { EmptyState } from '@/components/ui';
import { useTranslations } from '@/i18n';
import type { Notification, NotificationType } from '@/types';

type FilterTab = 'all' | 'unread' | 'read';

const PER_PAGE = 20;

function getPageNumbers(current: number, total: number): (number | 'dots')[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | 'dots')[] = [1];
    if (current > 3) pages.push('dots');
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
    if (current < total - 2) pages.push('dots');
    if (total > 1) pages.push(total);
    return pages;
}

export default function NotificationsPage() {
    const router = useRouter();
    const toast = useToast();
    const tr = useTranslations('notifications');

    const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<FilterTab>('all');
    const [typeFilter, setTypeFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const typeConfig: Record<NotificationType, { icon: string; colorClass: string }> = {
        OFFER_VIEWED:        { icon: '👁️', colorClass: 'bg-[color-mix(in_oklab,var(--status-open)_15%,transparent)] text-status-open' },
        OFFER_ACCEPTED:      { icon: '✅', colorClass: 'bg-status-accepted/15 text-status-accepted' },
        OFFER_REJECTED:      { icon: '❌', colorClass: 'bg-status-rejected/15 text-status-rejected' },
        OFFER_COMMENT:       { icon: '💬', colorClass: 'bg-primary/10 text-primary' },
        AI_INSIGHT:          { icon: '✨', colorClass: 'bg-[oklch(0.7_0.16_300)/15%] text-[oklch(0.55_0.18_300)] dark:text-[oklch(0.78_0.14_300)]' },
        FOLLOW_UP_REMINDER:  { icon: '⏰', colorClass: 'bg-[oklch(0.72_0.16_60)/15%] text-[oklch(0.55_0.14_60)] dark:text-[oklch(0.78_0.14_60)]' },
        CONTRACT_SIGNED:     { icon: '✍️', colorClass: 'bg-status-accepted/15 text-status-accepted' },
        SYSTEM:              { icon: '⚙️', colorClass: 'bg-secondary text-muted-foreground' },
    };

    const typeOptions = [
        { value: '', label: tr.typeFilters.all },
        { value: 'OFFER_VIEWED', label: tr.typeFilters.viewed },
        { value: 'OFFER_ACCEPTED', label: tr.typeFilters.accepted },
        { value: 'OFFER_REJECTED', label: tr.typeFilters.rejected },
        { value: 'OFFER_COMMENT', label: tr.typeFilters.comments },
        { value: 'AI_INSIGHT', label: tr.typeFilters.aiInsights },
        { value: 'FOLLOW_UP_REMINDER', label: tr.typeFilters.followups },
        { value: 'CONTRACT_SIGNED', label: tr.typeFilters.contractSigned },
        { value: 'SYSTEM', label: tr.typeFilters.system },
    ];

    const timeAgo = (dateStr: string): string => {
        const now = new Date();
        const date = new Date(dateStr);
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        if (seconds < 60) return tr.timeAgo.justNow;
        if (seconds < 3600) return tr.timeAgo.minutesAgo.replace('{n}', String(Math.floor(seconds / 60)));
        if (seconds < 86400) return tr.timeAgo.hoursAgo.replace('{n}', String(Math.floor(seconds / 3600)));
        if (seconds < 172800) return tr.timeAgo.yesterday;
        if (seconds < 604800) return tr.timeAgo.daysAgo.replace('{n}', String(Math.floor(seconds / 86400)));
        return date.toLocaleDateString();
    };

    const fetchNotifications = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await notificationsApi.list({ page: 1, limit: 200 });
            if (res.success && res.data) setAllNotifications(res.data);
        } catch {
            toast.error('Błąd', 'Nie udało się pobrać powiadomień');
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => { fetchNotifications(); }, [fetchNotifications]);
    useEffect(() => { setCurrentPage(1); }, [activeTab, typeFilter]);

    const filtered = allNotifications.filter(n => {
        if (activeTab === 'unread' && n.isRead) return false;
        if (activeTab === 'read' && !n.isRead) return false;
        if (typeFilter && n.type !== typeFilter) return false;
        return true;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const paginated = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);
    const unreadCount = allNotifications.filter(n => !n.isRead).length;
    const readCount = allNotifications.filter(n => n.isRead).length;

    const handleMarkAsRead = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        try {
            await notificationsApi.markAsRead(id);
            setAllNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch {
            toast.error('Błąd', 'Nie udało się oznaczyć jako przeczytane');
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationsApi.markAllAsRead();
            setAllNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            toast.success('Oznaczono', tr.markedAll);
        } catch {
            toast.error('Błąd', 'Nie udało się oznaczyć powiadomień');
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        try {
            await notificationsApi.delete(id);
            setAllNotifications(prev => prev.filter(n => n.id !== id));
            toast.success('Usunięto', tr.deleted);
        } catch {
            toast.error('Błąd', 'Nie udało się usunąć powiadomienia');
        }
    };

    const handleClick = async (notification: Notification) => {
        if (!notification.isRead) {
            try {
                await notificationsApi.markAsRead(notification.id);
                setAllNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
            } catch { /* silent */ }
        }
        if (notification.link) router.push(notification.link);
    };

    const getEmptyDescription = (): string => {
        if (allNotifications.length === 0) return tr.empty.noNotificationsDesc;
        if (activeTab === 'unread') return tr.empty.noUnread;
        if (activeTab === 'read') return tr.empty.noRead;
        if (typeFilter) return tr.empty.noType;
        return tr.empty.filtered;
    };

    const tabs: { value: FilterTab; label: string; count: number }[] = [
        { value: 'all', label: tr.tabs.all, count: allNotifications.length },
        { value: 'unread', label: tr.tabs.unread, count: unreadCount },
        { value: 'read', label: tr.tabs.read, count: readCount },
    ];

    return (
        <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-8 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary text-white shadow-glow ring-1 ring-white/15">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{tr.title}</h1>
                        <p className="text-sm text-muted-foreground">
                            {tr.counts.replace('{total}', String(allNotifications.length)).replace('{unread}', String(unreadCount))}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={fetchNotifications} className="p-2 text-muted-foreground hover:text-primary rounded-lg transition-colors" title={tr.refresh}>
                        <svg className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                    {unreadCount > 0 && (
                        <button onClick={handleMarkAllAsRead} className="px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors">
                            {tr.markAll}
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-card border-border border rounded-2xl p-4 mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
                        {tabs.map(tab => (
                            <button
                                key={tab.value}
                                onClick={() => setActiveTab(tab.value)}
                                className={`px-4 py-2 text-sm font-semibold rounded-lg whitespace-nowrap transition-all ${
                                    activeTab === tab.value
                                        ? 'bg-gradient-primary text-white shadow-glow ring-1 ring-white/15'
                                        : 'text-muted-foreground hover:bg-secondary/60'
                                }`}
                            >
                                {tab.label} ({tab.count})
                            </button>
                        ))}
                    </div>
                    <div className="w-full sm:w-auto sm:ml-auto">
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="w-full sm:w-auto px-3 py-2 text-sm border rounded-lg outline-none transition-colors"
                            style={{ backgroundColor: 'var(--card)', color: 'var(--foreground)', borderColor: 'var(--border)' }}
                        >
                            {typeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="bg-card border-border border rounded-xl p-4 animate-pulse">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-lg flex-shrink-0" style={{ backgroundColor: 'var(--secondary)' }} />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-3/4 rounded" style={{ backgroundColor: 'var(--secondary)' }} />
                                    <div className="h-3 w-1/2 rounded" style={{ backgroundColor: 'var(--secondary)' }} />
                                    <div className="h-3 w-1/4 rounded" style={{ backgroundColor: 'var(--secondary)' }} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : paginated.length === 0 ? (
                <div className="bg-card border-border border rounded-2xl">
                    <EmptyState
                        icon={allNotifications.length === 0 ? (
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        ) : (
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                        )}
                        title={allNotifications.length === 0 ? tr.empty.noNotifications : tr.empty.noResults}
                        description={getEmptyDescription()}
                    />
                </div>
            ) : (
                <div className="space-y-2">
                    {paginated.map(notification => {
                        const cfg = typeConfig[notification.type] || typeConfig.SYSTEM;
                        const typeLabel = tr.types[notification.type] || notification.type;
                        return (
                            <div
                                key={notification.id}
                                onClick={() => handleClick(notification)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleClick(notification); }}
                                className={`bg-card border-border border rounded-xl p-4 transition-all group cursor-pointer hover:shadow-md ${!notification.isRead ? 'border-l-4 border-l-cyan-500' : ''}`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${cfg.colorClass}`}>
                                        {cfg.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <h3 className={`text-sm ${notification.isRead ? 'font-medium text-muted-foreground' : 'font-semibold text-foreground'}`}>
                                                        {notification.title}
                                                    </h3>
                                                    {!notification.isRead && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                                                </div>
                                                <p className={`text-sm leading-relaxed ${notification.isRead ? 'text-muted-foreground' : 'text-foreground'}`}>
                                                    {notification.message}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                                    <span className="text-xs text-muted-foreground">{timeAgo(notification.createdAt)}</span>
                                                    <span className={`px-2 py-0.5 text-xs rounded-full ${cfg.colorClass}`}>{typeLabel}</span>
                                                    {notification.link && <span className="text-xs text-primary">{tr.clickNavigate}</span>}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                {!notification.isRead && (
                                                    <button onClick={(e) => handleMarkAsRead(e, notification.id)} className="p-1.5 text-muted-foreground hover:text-primary rounded-lg transition-colors" title={tr.markAsRead}>
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </button>
                                                )}
                                                <button onClick={(e) => handleDelete(e, notification.id)} className="p-1.5 text-muted-foreground hover:text-status-rejected rounded-lg transition-colors" title={tr.delete}>
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 bg-card border-border border rounded-xl p-3">
                    <p className="text-sm text-muted-foreground">
                        {tr.pagination.replace('{count}', String(filtered.length)).replace('{page}', String(currentPage)).replace('{total}', String(totalPages))}
                    </p>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 text-sm rounded-lg transition-colors disabled:opacity-40 hover:bg-secondary/60 text-foreground">← Prev</button>
                        {getPageNumbers(currentPage, totalPages).map((item, idx) =>
                            item === 'dots' ? (
                                <span key={`dots-${idx}`} className="px-1 text-muted-foreground">…</span>
                            ) : (
                                <button
                                    key={item}
                                    onClick={() => setCurrentPage(item)}
                                    className={`min-w-[32px] h-8 text-sm rounded-lg transition-colors ${currentPage === item ? 'bg-primary text-white' : 'hover:bg-secondary/60 text-foreground'}`}
                                >
                                    {item}
                                </button>
                            )
                        )}
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 text-sm rounded-lg transition-colors disabled:opacity-40 hover:bg-secondary/60 text-foreground">Next →</button>
                    </div>
                </div>
            )}
        </div>
    );
}

// src/app/dashboard/notifications/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { notificationsApi } from '@/lib/api';
import type { Notification, NotificationType } from '@/types';

type FilterTab = 'all' | 'unread' | 'read';

const PER_PAGE = 20;

const typeConfig: Record<NotificationType, { icon: string; label: string; colorClass: string }> = {
    OFFER_VIEWED: { icon: '👁️', label: 'Wyświetlenie oferty', colorClass: 'bg-blue-500/15 text-blue-700' },
    OFFER_ACCEPTED: { icon: '✅', label: 'Akceptacja oferty', colorClass: 'bg-emerald-500/15 text-emerald-700' },
    OFFER_REJECTED: { icon: '❌', label: 'Odrzucenie oferty', colorClass: 'bg-red-500/15 text-red-700' },
    OFFER_COMMENT: { icon: '💬', label: 'Komentarz', colorClass: 'bg-cyan-500/15 text-cyan-700' },
    AI_INSIGHT: { icon: '✨', label: 'Wgląd AI', colorClass: 'bg-purple-500/15 text-purple-700' },
    FOLLOW_UP_REMINDER: { icon: '🔔', label: 'Przypomnienie', colorClass: 'bg-amber-500/15 text-amber-700' },
    SYSTEM: { icon: '⚙️', label: 'Systemowe', colorClass: 'bg-slate-500/15 text-slate-700' },
};

const typeOptions = [
    { value: '', label: 'Wszystkie typy' },
    { value: 'OFFER_VIEWED', label: '👁️ Wyświetlenia' },
    { value: 'OFFER_ACCEPTED', label: '✅ Akceptacje' },
    { value: 'OFFER_REJECTED', label: '❌ Odrzucenia' },
    { value: 'OFFER_COMMENT', label: '💬 Komentarze' },
    { value: 'AI_INSIGHT', label: '✨ AI Insights' },
    { value: 'FOLLOW_UP_REMINDER', label: '🔔 Przypomnienia' },
    { value: 'SYSTEM', label: '⚙️ Systemowe' },
];

function timeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'Przed chwilą';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min temu`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} godz. temu`;
    if (seconds < 172800) return 'Wczoraj';
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} dni temu`;
    return date.toLocaleDateString('pl-PL');
}

function getPageNumbers(current: number, total: number): (number | 'dots')[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | 'dots')[] = [1];
    if (current > 3) pages.push('dots');
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
        pages.push(i);
    }
    if (current < total - 2) pages.push('dots');
    if (total > 1) pages.push(total);
    return pages;
}

export default function NotificationsPage() {
    const router = useRouter();
    const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<FilterTab>('all');
    const [typeFilter, setTypeFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const fetchNotifications = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await notificationsApi.list({ page: 1, limit: 200 });
            if (res.success && res.data) {
                setAllNotifications(res.data);
            }
        } catch (err: unknown) {
            console.error('Failed to fetch notifications:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, typeFilter]);

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
        } catch (err: unknown) {
            console.error('Mark as read failed:', err);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationsApi.markAllAsRead();
            setAllNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (err: unknown) {
            console.error('Mark all as read failed:', err);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        try {
            await notificationsApi.delete(id);
            setAllNotifications(prev => prev.filter(n => n.id !== id));
        } catch (err: unknown) {
            console.error('Delete failed:', err);
        }
    };

    const handleClick = async (notification: Notification) => {
        if (!notification.isRead) {
            try {
                await notificationsApi.markAsRead(notification.id);
                setAllNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
            } catch (err: unknown) {
                console.error('Mark as read failed:', err);
            }
        }
        if (notification.link) {
            router.push(notification.link);
        }
    };

    const tabs: { value: FilterTab; label: string; count: number }[] = [
        { value: 'all', label: 'Wszystkie', count: allNotifications.length },
        { value: 'unread', label: 'Nieprzeczytane', count: unreadCount },
        { value: 'read', label: 'Przeczytane', count: readCount },
    ];

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                        <svg className="w-6 h-6 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-themed">Powiadomienia</h1>
                        <p className="text-sm text-themed-muted">
                            {allNotifications.length} łącznie • {unreadCount} nieprzeczytanych
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchNotifications}
                        className="p-2 text-themed-muted hover:text-cyan-600 rounded-lg transition-colors"
                        title="Odśwież"
                    >
                        <svg className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllAsRead}
                            className="px-4 py-2 text-sm font-medium text-cyan-600 hover:bg-cyan-500/10 rounded-lg transition-colors"
                        >
                            Oznacz wszystkie
                        </button>
                    )}
                </div>
            </div>

            <div className="card-themed border rounded-2xl p-4 mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
                        {tabs.map(tab => (
                            <button
                                key={tab.value}
                                onClick={() => setActiveTab(tab.value)}
                                className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                                    activeTab === tab.value
                                        ? 'bg-cyan-500 text-white'
                                        : 'text-themed-muted hover-themed'
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
                            style={{
                                backgroundColor: 'var(--input-bg)',
                                color: 'var(--input-text)',
                                borderColor: 'var(--input-border)',
                            }}
                        >
                            {typeOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="card-themed border rounded-xl p-4 animate-pulse">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-lg flex-shrink-0" style={{ backgroundColor: 'var(--hover-bg)' }} />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-3/4 rounded" style={{ backgroundColor: 'var(--hover-bg)' }} />
                                    <div className="h-3 w-1/2 rounded" style={{ backgroundColor: 'var(--hover-bg)' }} />
                                    <div className="h-3 w-1/4 rounded" style={{ backgroundColor: 'var(--hover-bg)' }} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : paginated.length === 0 ? (
                <div className="card-themed border rounded-2xl p-12 text-center">
                    <div className="w-16 h-16 section-themed rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-themed-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-themed mb-1">Brak powiadomień</h3>
                    <p className="text-themed-muted">
                        {activeTab === 'unread'
                            ? 'Nie masz nieprzeczytanych powiadomień'
                            : activeTab === 'read'
                                ? 'Brak przeczytanych powiadomień'
                                : typeFilter
                                    ? 'Brak powiadomień tego typu'
                                    : 'Nie masz jeszcze żadnych powiadomień'}
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {paginated.map(notification => {
                        const cfg = typeConfig[notification.type] || typeConfig.SYSTEM;

                        return (
                            <div
                                key={notification.id}
                                onClick={() => handleClick(notification)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleClick(notification); }}
                                className={`card-themed border rounded-xl p-4 transition-all group cursor-pointer hover:shadow-md ${
                                    !notification.isRead ? 'border-l-4 border-l-cyan-500' : ''
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${cfg.colorClass}`}>
                                        {cfg.icon}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <h3 className={`text-sm ${
                                                        notification.isRead
                                                            ? 'font-medium text-themed-muted'
                                                            : 'font-semibold text-themed'
                                                    }`}>
                                                        {notification.title}
                                                    </h3>
                                                    {!notification.isRead && (
                                                        <div className="w-2 h-2 rounded-full bg-cyan-500 flex-shrink-0" />
                                                    )}
                                                </div>
                                                <p className={`text-sm leading-relaxed ${
                                                    notification.isRead ? 'text-themed-muted' : 'text-themed'
                                                }`}>
                                                    {notification.message}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                                    <span className="text-xs text-themed-muted">
                                                        {timeAgo(notification.createdAt)}
                                                    </span>
                                                    <span className={`px-2 py-0.5 text-xs rounded-full ${cfg.colorClass}`}>
                                                        {cfg.label}
                                                    </span>
                                                    {notification.link && (
                                                        <span className="text-xs text-cyan-600">
                                                            Kliknij, aby przejść →
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                {!notification.isRead && (
                                                    <button
                                                        onClick={(e) => handleMarkAsRead(e, notification.id)}
                                                        className="p-1.5 text-themed-muted hover:text-cyan-600 rounded-lg transition-colors"
                                                        title="Oznacz jako przeczytane"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => handleDelete(e, notification.id)}
                                                    className="p-1.5 text-themed-muted hover:text-red-500 rounded-lg transition-colors"
                                                    title="Usuń"
                                                >
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
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 card-themed border rounded-xl p-3">
                    <p className="text-sm text-themed-muted">
                        {filtered.length} wyników • strona {currentPage} z {totalPages}
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 text-sm rounded-lg transition-colors disabled:opacity-40 hover-themed text-themed"
                        >
                            ← Prev
                        </button>
                        {getPageNumbers(currentPage, totalPages).map((item, idx) =>
                            item === 'dots' ? (
                                <span key={`dots-${idx}`} className="px-1 text-themed-muted">…</span>
                            ) : (
                                <button
                                    key={item}
                                    onClick={() => setCurrentPage(item)}
                                    className={`min-w-[32px] h-8 text-sm rounded-lg transition-colors ${
                                        currentPage === item
                                            ? 'bg-cyan-500 text-white'
                                            : 'hover-themed text-themed'
                                    }`}
                                >
                                    {item}
                                </button>
                            )
                        )}
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1.5 text-sm rounded-lg transition-colors disabled:opacity-40 hover-themed text-themed"
                        >
                            Next →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
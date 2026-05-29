// src/components/notifications/NotificationBell.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/hooks/useNotifications';
import type { Notification, NotificationType } from '@/types';

const typeConfig: Record<NotificationType, { icon: string; colorClass: string }> = {
    OFFER_VIEWED: { icon: '👁️', colorClass: 'bg-primary/10 text-primary' },
    OFFER_ACCEPTED: { icon: '✅', colorClass: 'bg-status-accepted/10 text-status-accepted' },
    OFFER_REJECTED: { icon: '❌', colorClass: 'bg-destructive/10 text-destructive' },
    OFFER_COMMENT: { icon: '💬', colorClass: 'bg-primary/10 text-primary' },
    AI_INSIGHT: { icon: '✨', colorClass: 'bg-[oklch(0.7_0.16_300)/15%] text-[oklch(0.55_0.18_300)] dark:text-[oklch(0.78_0.14_300)]' },
    FOLLOW_UP_REMINDER: { icon: '⏰', colorClass: 'bg-[oklch(0.72_0.16_60)/10%]0/15 text-[oklch(0.55_0.14_60)] dark:text-[oklch(0.78_0.14_60)]' },
    CONTRACT_SIGNED: { icon: '✍️', colorClass: 'bg-status-accepted/15 text-status-accepted' },
    SYSTEM: { icon: '⚙️', colorClass: 'bg-secondary text-secondary-foreground' },
};

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

export default function NotificationBell() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const {
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
    } = useNotifications(15);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.isRead) {
            await markAsRead(notification.id);
        }

        if (notification.link) {
            setIsOpen(false);
            router.push(notification.link);
        }
    };

    const handleMarkAllRead = async (e: React.MouseEvent) => {
        e.stopPropagation();
        await markAllAsRead();
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        await deleteNotification(id);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-muted-foreground hover:bg-secondary/60 rounded-lg transition-colors"
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                </svg>

                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center text-xs font-bold text-white rounded-full px-1 bg-primary/100 animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-[420px] max-w-[calc(100vw-2rem)] bg-card border-border border rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="px-4 py-3 bg-surface-subtle border-b border-border">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-foreground">Powiadomienia</h3>
                                {unreadCount > 0 && (
                                    <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                                        {unreadCount} nowych
                                    </span>
                                )}
                            </div>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    className="text-xs font-medium text-primary hover:text-primary transition-colors"
                                >
                                    Oznacz wszystkie
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="max-h-[460px] overflow-y-auto">
                        {isLoading ? (
                            <div className="p-8 text-center">
                                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <div className="w-12 h-12 bg-surface-subtle rounded-full flex items-center justify-center mx-auto mb-3">
                                    <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                    </svg>
                                </div>
                                <p className="text-foreground font-medium">Brak powiadomień</p>
                                <p className="text-sm text-muted-foreground mt-1">Wszystko na bieżąco!</p>
                            </div>
                        ) : (
                            <div className="divide-y border-border">
                                {notifications.map((notification) => {
                                    const cfg = typeConfig[notification.type] || typeConfig.SYSTEM;

                                    return (
                                        <div
                                            key={notification.id}
                                            onClick={() => handleNotificationClick(notification)}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => { if (e.key === 'Enter') handleNotificationClick(notification); }}
                                            className={`w-full px-4 py-3 text-left transition-colors group cursor-pointer ${
                                                notification.isRead
                                                    ? 'bg-card border-border hover:bg-secondary/60'
                                                    : 'bg-surface-subtle hover:bg-secondary/60'
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${cfg.colorClass}`}>
                                                    {cfg.icon}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <p className={`text-sm leading-tight ${
                                                            notification.isRead
                                                                ? 'font-medium text-muted-foreground'
                                                                : 'font-semibold text-foreground'
                                                        }`}>
                                                            {notification.title}
                                                        </p>

                                                        <div className="flex items-center gap-1 flex-shrink-0">
                                                            {!notification.isRead && (
                                                                <div className="w-2 h-2 rounded-full bg-primary/100" />
                                                            )}
                                                            <button
                                                                onClick={(e) => handleDelete(e, notification.id)}
                                                                className="p-1 text-muted-foreground hover:text-status-rejected opacity-0 group-hover:opacity-100 transition-all rounded"
                                                                title="Usuń"
                                                            >
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <p className={`text-xs mt-0.5 leading-relaxed line-clamp-2 ${
                                                        notification.isRead ? 'text-muted-foreground' : 'text-foreground'
                                                    }`}>
                                                        {notification.message}
                                                    </p>

                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {timeAgo(notification.createdAt)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="px-4 py-3 bg-surface-subtle border-t border-border text-center">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    router.push('/dashboard/notifications');
                                }}
                                className="text-sm font-medium text-primary hover:text-primary transition-colors"
                            >
                                Zobacz wszystkie →
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
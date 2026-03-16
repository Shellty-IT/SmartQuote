// src/components/notifications/NotificationBell.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/hooks/useNotifications';
import type { Notification, NotificationType } from '@/types';

const typeConfig: Record<NotificationType, { icon: string; colorClass: string }> = {
    OFFER_VIEWED: { icon: '👁️', colorClass: 'badge-info' },
    OFFER_ACCEPTED: { icon: '✅', colorClass: 'badge-success' },
    OFFER_REJECTED: { icon: '❌', colorClass: 'badge-danger' },
    OFFER_COMMENT: { icon: '💬', colorClass: 'bg-cyan-500/15 text-cyan-700' },
    AI_INSIGHT: { icon: '✨', colorClass: 'bg-purple-500/15 text-purple-700' },
    FOLLOW_UP_REMINDER: { icon: '🔔', colorClass: 'badge-warning' },
    SYSTEM: { icon: '⚙️', colorClass: 'badge-themed' },
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
                className="relative p-2 text-themed-muted hover-themed rounded-lg transition-colors"
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
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center text-xs font-bold text-white rounded-full px-1 bg-cyan-500 animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-[420px] max-w-[calc(100vw-2rem)] card-themed border rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="px-4 py-3 section-themed border-b divider-themed">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-themed">Powiadomienia</h3>
                                {unreadCount > 0 && (
                                    <span className="px-2 py-0.5 text-xs font-medium bg-cyan-500/15 text-cyan-700 rounded-full">
                                        {unreadCount} nowych
                                    </span>
                                )}
                            </div>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    className="text-xs font-medium text-cyan-600 hover:text-cyan-700 transition-colors"
                                >
                                    Oznacz wszystkie
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="max-h-[460px] overflow-y-auto">
                        {isLoading ? (
                            <div className="p-8 text-center">
                                <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <div className="w-12 h-12 section-themed rounded-full flex items-center justify-center mx-auto mb-3">
                                    <svg className="w-6 h-6 text-themed-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                    </svg>
                                </div>
                                <p className="text-themed font-medium">Brak powiadomień</p>
                                <p className="text-sm text-themed-muted mt-1">Wszystko na bieżąco!</p>
                            </div>
                        ) : (
                            <div className="divide-y divider-themed">
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
                                                    ? 'card-themed hover-themed'
                                                    : 'section-themed hover-themed'
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
                                                                ? 'font-medium text-themed-muted'
                                                                : 'font-semibold text-themed'
                                                        }`}>
                                                            {notification.title}
                                                        </p>

                                                        <div className="flex items-center gap-1 flex-shrink-0">
                                                            {!notification.isRead && (
                                                                <div className="w-2 h-2 rounded-full bg-cyan-500" />
                                                            )}
                                                            <button
                                                                onClick={(e) => handleDelete(e, notification.id)}
                                                                className="p-1 text-themed-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded"
                                                                title="Usuń"
                                                            >
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <p className={`text-xs mt-0.5 leading-relaxed line-clamp-2 ${
                                                        notification.isRead ? 'text-themed-muted' : 'text-themed'
                                                    }`}>
                                                        {notification.message}
                                                    </p>

                                                    <p className="text-xs text-themed-muted mt-1">
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
                        <div className="px-4 py-3 section-themed border-t divider-themed text-center">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    router.push('/dashboard/notifications');
                                }}
                                className="text-sm font-medium text-cyan-600 hover:text-cyan-700 transition-colors"
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
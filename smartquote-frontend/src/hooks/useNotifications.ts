// SmartQuote-AI/src/hooks/useNotifications.ts

import { useState, useEffect, useCallback } from 'react';
import { notificationsApi } from '@/lib/api';
import type { Notification } from '@/types';

const POLL_INTERVAL = 30000;

export function useNotifications(limit: number = 10) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchNotifications = useCallback(async () => {
        try {
            const [listRes, countRes] = await Promise.all([
                notificationsApi.list({ page: 1, limit }),
                notificationsApi.unreadCount(),
            ]);

            if (listRes.success && listRes.data) {
                setNotifications(listRes.data);
                setTotal(listRes.meta?.total || 0);
            }

            if (countRes.success && countRes.data) {
                setUnreadCount(countRes.data.count);
            }

            setError(null);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Błąd pobierania powiadomień';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, [limit]);

    const markAsRead = useCallback(async (id: string) => {
        try {
            await notificationsApi.markAsRead(id);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err: unknown) {
            console.error('Mark as read failed:', err);
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        try {
            await notificationsApi.markAllAsRead();
            setNotifications(prev =>
                prev.map(n => ({ ...n, isRead: true }))
            );
            setUnreadCount(0);
        } catch (err: unknown) {
            console.error('Mark all as read failed:', err);
        }
    }, []);

    const deleteNotification = useCallback(async (id: string) => {
        try {
            await notificationsApi.delete(id);
            setNotifications(prev => {
                const target = prev.find(n => n.id === id);
                if (target && !target.isRead) {
                    setUnreadCount(c => Math.max(0, c - 1));
                }
                return prev.filter(n => n.id !== id);
            });
            setTotal(prev => Math.max(0, prev - 1));
        } catch (err: unknown) {
            console.error('Delete notification failed:', err);
        }
    }, []);

    const refresh = useCallback(() => {
        setIsLoading(true);
        fetchNotifications();
    }, [fetchNotifications]);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, POLL_INTERVAL);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    return {
        notifications,
        unreadCount,
        total,
        isLoading,
        error,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refresh,
    };
}

export function useUnreadCount() {
    const [count, setCount] = useState(0);

    const fetch = useCallback(async () => {
        try {
            const res = await notificationsApi.unreadCount();
            if (res.success && res.data) {
                setCount(res.data.count);
            }
        } catch (err: unknown) {
            console.error('Unread count fetch failed:', err);
        }
    }, []);

    useEffect(() => {
        fetch();
        const interval = setInterval(fetch, POLL_INTERVAL);
        return () => clearInterval(interval);
    }, [fetch]);

    return { count, refresh: fetch };
}
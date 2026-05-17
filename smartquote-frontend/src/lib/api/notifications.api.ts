// src/lib/api/notifications.api.ts

import { api } from './client';
import type { Notification } from '@/types';

export const notificationsApi = {
    list: (params?: Record<string, string | number | boolean | undefined>) =>
        api.get<Notification[]>('/notifications', params),
    unreadCount: () =>
        api.get<{ count: number }>('/notifications/unread-count'),
    markAsRead: (id: string) =>
        api.patch<{ marked: boolean }>(`/notifications/${id}/read`),
    markAllAsRead: () =>
        api.patch<{ marked: boolean }>('/notifications/read-all'),
    delete: (id: string) =>
        api.delete<{ deleted: boolean }>(`/notifications/${id}`),
};
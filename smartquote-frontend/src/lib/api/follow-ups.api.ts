// src/lib/api/follow-ups.api.ts

import { api } from './client';
import type {
    FollowUp,
    CreateFollowUpData,
    UpdateFollowUpData,
    FollowUpStats,
} from '@/types';

export const followUpsApi = {
    list: (params?: Record<string, string | number | boolean | undefined>) =>
        api.get<FollowUp[]>('/followups', params),
    get: (id: string) =>
        api.get<FollowUp>(`/followups/${id}`),
    create: (data: CreateFollowUpData) =>
        api.post<FollowUp>('/followups', data),
    update: (id: string, data: UpdateFollowUpData) =>
        api.put<FollowUp>(`/followups/${id}`, data),
    delete: (id: string) =>
        api.delete<{ message: string }>(`/followups/${id}`),
    complete: (id: string) =>
        api.patch<FollowUp>(`/followups/${id}/complete`, {}),
    stats: () =>
        api.get<FollowUpStats>('/followups/stats'),
    upcoming: (params?: Record<string, string | number | boolean | undefined>) =>
        api.get<FollowUp[]>('/followups/upcoming', params),
    overdue: () =>
        api.get<FollowUp[]>('/followups/overdue'),
};
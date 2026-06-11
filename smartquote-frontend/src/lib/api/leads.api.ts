// src/lib/api/leads.api.ts

import { api } from './client';
import type {
    Lead,
    CreateLeadInput,
    UpdateLeadInput,
    ConvertLeadInput,
    LeadsStats,
} from '@/types/lead.types';

export const leadsApi = {
    list: (params?: Record<string, string | number | boolean | undefined>) =>
        api.get<Lead[]>('/leads', params),
    get: (id: string) =>
        api.get<Lead>(`/leads/${id}`),
    create: (data: CreateLeadInput) =>
        api.post<Lead>('/leads', data),
    update: (id: string, data: UpdateLeadInput) =>
        api.put<Lead>(`/leads/${id}`, data),
    delete: (id: string) =>
        api.delete<{ message: string }>(`/leads/${id}`),
    convert: (id: string, data?: ConvertLeadInput) =>
        api.post<{ clientId: string }>(`/leads/${id}/convert`, data),
    stats: () =>
        api.get<LeadsStats>('/leads/stats'),
};

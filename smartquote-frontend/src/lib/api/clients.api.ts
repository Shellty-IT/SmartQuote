// src/lib/api/clients.api.ts

import { api } from './client';
import type {
    Client,
    CreateClientInput,
    UpdateClientInput,
    ClientsStats,
} from '@/types';

export const clientsApi = {
    list: (params?: Record<string, string | number | boolean | undefined>) =>
        api.get<Client[]>('/clients', params),
    get: (id: string) =>
        api.get<Client>(`/clients/${id}`),
    create: (data: CreateClientInput) =>
        api.post<Client>('/clients', data),
    update: (id: string, data: UpdateClientInput) =>
        api.put<Client>(`/clients/${id}`, data),
    delete: (id: string) =>
        api.delete<{ message: string }>(`/clients/${id}`),
    stats: () =>
        api.get<ClientsStats>('/clients/stats'),
};
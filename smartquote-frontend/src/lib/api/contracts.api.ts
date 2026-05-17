// src/lib/api/contracts.api.ts

import { api } from './client';
import type {
    Contract,
    CreateContractInput,
    ContractsStats,
} from '@/types';

export const contractsApi = {
    list: (params?: Record<string, string | number | boolean | undefined>) =>
        api.get<Contract[]>('/contracts', params),
    get: (id: string) =>
        api.get<Contract>(`/contracts/${id}`),
    create: (data: CreateContractInput) =>
        api.post<Contract>('/contracts', data),
    update: (id: string, data: Partial<CreateContractInput>) =>
        api.put<Contract>(`/contracts/${id}`, data),
    delete: (id: string) =>
        api.delete<{ message: string }>(`/contracts/${id}`),
    createFromOffer: (offerId: string) =>
        api.post<Contract>(`/contracts/from-offer/${offerId}`),
    updateStatus: (id: string, status: string) =>
        api.put<Contract>(`/contracts/${id}/status`, { status }),
    stats: () =>
        api.get<ContractsStats>('/contracts/stats'),
    downloadPdf: (id: string) =>
        api.downloadBlob(`/contracts/${id}/pdf`),
    publish: (id: string) =>
        api.post<{ publicToken: string; publicUrl: string; alreadyPublished: boolean }>(`/contracts/${id}/publish`),
    unpublish: (id: string) =>
        api.delete<{ unpublished: boolean }>(`/contracts/${id}/publish`),
};
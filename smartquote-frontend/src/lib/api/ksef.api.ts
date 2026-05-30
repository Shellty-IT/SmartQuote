// src/lib/api/ksef.api.ts

import { api } from './client';
import type { KsefAvailability, KsefPreviewData, KsefSendPayload, KsefSendResult } from '@/types/ksef.types';

export const ksefApi = {
    async getPreview(offerId: string): Promise<KsefPreviewData> {
        const response = await api.get<KsefPreviewData>(`/ksef/preview/${offerId}`);
        if (!response.data) {
            throw new Error('No preview data');
        }
        return response.data;
    },

    async send(payload: KsefSendPayload): Promise<KsefSendResult> {
        const response = await api.post<KsefSendResult>('/ksef/send', payload);
        if (!response.data) {
            throw new Error('Brak danych w odpowiedzi');
        }
        return response.data;
    },

    async availability(forceRefresh = false): Promise<KsefAvailability> {
        const query = forceRefresh ? '?refresh=1' : '';
        const response = await api.get<KsefAvailability>(`/ksef/availability${query}`);
        if (!response.data) {
            return { available: false, reason: 'KSEF_UNREACHABLE' };
        }
        return response.data;
    },
};
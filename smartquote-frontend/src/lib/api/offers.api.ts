// src/lib/api/offers.api.ts

import { api } from './client';
import type {
    Offer,
    CreateOfferInput,
    UpdateOfferInput,
    OffersStats,
    PublishOfferResult,
    SendToClientResult,
    OfferAnalytics,
    OfferComment,
} from '@/types';

export const offersApi = {
    list: (params?: Record<string, string | number | boolean | undefined>) =>
        api.get<Offer[]>('/offers', params),
    get: (id: string) =>
        api.get<Offer>(`/offers/${id}`),
    create: (data: CreateOfferInput) =>
        api.post<Offer>('/offers', data),
    update: (id: string, data: UpdateOfferInput) =>
        api.put<Offer>(`/offers/${id}`, data),
    delete: (id: string) =>
        api.delete<{ message: string }>(`/offers/${id}`),
    duplicate: (id: string) =>
        api.post<Offer>(`/offers/${id}/duplicate`),
    stats: () =>
        api.get<OffersStats>('/offers/stats'),
    downloadPdf: (id: string) =>
        api.downloadBlob(`/offers/${id}/pdf`),
    publish: (id: string) =>
        api.post<PublishOfferResult>(`/offers/${id}/publish`),
    unpublish: (id: string) =>
        api.delete<{ unpublished: boolean }>(`/offers/${id}/publish`),
    analytics: (id: string) =>
        api.get<OfferAnalytics>(`/offers/${id}/analytics`),
    getComments: (id: string) =>
        api.get<OfferComment[]>(`/offers/${id}/comments`),
    addComment: (id: string, content: string) =>
        api.post<OfferComment>(`/offers/${id}/comments`, { content }),
    sendToClient: (id: string) =>
        api.post<SendToClientResult>(`/offers/${id}/send-to-client`),
};
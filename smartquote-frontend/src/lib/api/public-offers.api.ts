// src/lib/api/public-offers.api.ts

import { api } from './client';
import type {
    PublicOfferData,
    PublicOfferAcceptPayload,
    PublicOfferRejectPayload,
    OfferComment,
} from '@/types';

export const publicOffersApi = {
    get: (token: string) =>
        api.getPublic<PublicOfferData>(`/public/offers/${token}`),
    registerView: (token: string) =>
        api.postPublic<{ registered: boolean }>(`/public/offers/${token}/view`),
    accept: (token: string, payload: PublicOfferAcceptPayload) =>
        api.postPublic<{ accepted: boolean }>(`/public/offers/${token}/accept`, payload),
    reject: (token: string, payload: PublicOfferRejectPayload) =>
        api.postPublic<{ rejected: boolean }>(`/public/offers/${token}/reject`, payload),
    addComment: (token: string, content: string) =>
        api.postPublic<OfferComment>(`/public/offers/${token}/comment`, { content }),
    trackSelection: (
        token: string,
        items: Array<{ id: string; isSelected: boolean; quantity: number }>,
        selectedVariant?: string
    ) =>
        api.patchPublic<{ tracked: boolean }>(`/public/offers/${token}/selection`, { items, selectedVariant }),
};
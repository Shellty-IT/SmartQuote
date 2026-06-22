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
    /** Classic template — download PDF (rendered by Vercel/Puppeteer) */
    downloadClassicPdf: async (id: string): Promise<Blob> => {
        const res = await fetch(`/api/offers/${id}/pdf/classic`)
        if (!res.ok) throw new Error(`PDF generation failed: ${res.status}`)
        return res.blob()
    },
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
    /** Proposal template — download PDF (rendered by Vercel/Puppeteer) */
    downloadProposalPdf: async (id: string): Promise<Blob> => {
        const res = await fetch(`/api/offers/${id}/pdf/proposal`)
        if (!res.ok) throw new Error(`PDF generation failed: ${res.status}`)
        return res.blob()
    },
    /** Proposal template — fetch HTML string for in-browser preview */
    getProposalPreviewUrl: (id: string): string =>
        `/api/offers/${id}/proposal/preview`,
    /** Shop template — download PDF (rendered by Vercel/Puppeteer) */
    downloadShopPdf: async (id: string): Promise<Blob> => {
        const res = await fetch(`/api/offers/${id}/pdf/shop`)
        if (!res.ok) throw new Error(`PDF generation failed: ${res.status}`)
        return res.blob()
    },
    /** Shop template — fetch HTML string for in-browser preview */
    getShopPreviewUrl: (id: string): string =>
        `/api/offers/${id}/shop/preview`,
    /** Website v2 template — download PDF (rendered by Vercel/Puppeteer) */
    downloadWebsiteV2Pdf: async (id: string): Promise<Blob> => {
        const res = await fetch(`/api/offers/${id}/pdf/website-v2`)
        if (!res.ok) throw new Error(`PDF generation failed: ${res.status}`)
        return res.blob()
    },
    /** Website v2 template — fetch HTML string for in-browser preview */
    getWebsiteV2PreviewUrl: (id: string): string =>
        `/api/offers/${id}/website-v2/preview`,
    /** Website v3 template — download PDF (rendered by Vercel/Puppeteer) */
    downloadWebsiteV3Pdf: async (id: string): Promise<Blob> => {
        const res = await fetch(`/api/offers/${id}/pdf/website-v3`)
        if (!res.ok) throw new Error(`PDF generation failed: ${res.status}`)
        return res.blob()
    },
    /** Website v3 template — fetch HTML string for in-browser preview */
    getWebsiteV3PreviewUrl: (id: string): string =>
        `/api/offers/${id}/website-v3/preview`,
    /** Support template — download PDF (rendered by Vercel/Puppeteer) */
    downloadSupportPdf: async (id: string): Promise<Blob> => {
        const res = await fetch(`/api/offers/${id}/pdf/support`)
        if (!res.ok) throw new Error(`PDF generation failed: ${res.status}`)
        return res.blob()
    },
    /** Support template — fetch HTML string for in-browser preview */
    getSupportPreviewUrl: (id: string): string =>
        `/api/offers/${id}/support/preview`,
    /** Mobile App template — download PDF (rendered by Vercel/Puppeteer) */
    downloadMobileAppPdf: async (id: string): Promise<Blob> => {
        const res = await fetch(`/api/offers/${id}/pdf/mobile-app`)
        if (!res.ok) throw new Error(`PDF generation failed: ${res.status}`)
        return res.blob()
    },
    /** Mobile App template — fetch HTML string for in-browser preview */
    getMobileAppPreviewUrl: (id: string): string =>
        `/api/offers/${id}/mobile-app/preview`,
    /** Mobile Simple template — download PDF (rendered by Vercel/Puppeteer) */
    downloadMobileSimplePdf: async (id: string): Promise<Blob> => {
        const res = await fetch(`/api/offers/${id}/pdf/mobile-simple`)
        if (!res.ok) throw new Error(`PDF generation failed: ${res.status}`)
        return res.blob()
    },
    /** Mobile Simple template — fetch HTML string for in-browser preview */
    getMobileSimplePreviewUrl: (id: string): string =>
        `/api/offers/${id}/mobile-simple/preview`,
    /** Universal template — download PDF (rendered by Vercel/Puppeteer) */
    downloadUniversalPdf: async (id: string): Promise<Blob> => {
        const res = await fetch(`/api/offers/${id}/pdf/universal`)
        if (!res.ok) throw new Error(`PDF generation failed: ${res.status}`)
        return res.blob()
    },
    /** Universal template — fetch HTML string for in-browser preview */
    getUniversalPreviewUrl: (id: string): string =>
        `/api/offers/${id}/universal/preview`,
};
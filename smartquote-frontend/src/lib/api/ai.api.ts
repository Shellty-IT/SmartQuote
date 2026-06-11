// src/lib/api/ai.api.ts

import { api } from './client';
import type {
    ChatData,
    SuggestionsData,
    GeneratedOffer,
    ClientAnalysis,
    PriceInsightResult,
    ObserverInsight,
    ClosingStrategy,
    LatestInsightItem,
    InsightsListItem,
    PriceCheckResult,
} from '@/types/ai';
import type { OfferItem } from '@/types';
import type { AlertsResponse } from '@/types/alert.types';

export const ai = {
    chat: async (
        message: string,
        history: Array<{ role: 'user' | 'assistant'; content: string }> = [],
        pageContext?: { type: string; id?: string; title?: string; extra?: string }
    ): Promise<ChatData> => {
        const response = await api.post<ChatData>('/ai/chat', { message, history, pageContext });
        return response.data as ChatData;
    },

    generateOffer: async (description: string, clientId?: string): Promise<GeneratedOffer> => {
        const response = await api.post<GeneratedOffer>('/ai/generate-offer', { description, clientId });
        return response.data as GeneratedOffer;
    },

    generateEmail: async (
        type: 'offer_send' | 'followup' | 'thank_you' | 'reminder',
        clientName: string,
        offerTitle?: string,
        customContext?: string
    ): Promise<{ email: string }> => {
        const response = await api.post<{ email: string }>('/ai/generate-email', {
            type,
            clientName,
            offerTitle,
            customContext,
        });
        return response.data as { email: string };
    },

    analyzeClient: async (clientId: string): Promise<ClientAnalysis> => {
        const response = await api.get<ClientAnalysis>(`/ai/analyze-client/${clientId}`);
        return response.data as ClientAnalysis;
    },

    getSuggestions: async (): Promise<SuggestionsData> => {
        const response = await api.get<SuggestionsData>('/ai/suggestions');
        return response.data as SuggestionsData;
    },

    getContext: async (): Promise<SuggestionsData> => {
        const response = await api.get<SuggestionsData>('/ai/context');
        return response.data as SuggestionsData;
    },

    clearHistory: async (): Promise<{ message: string }> => {
        const response = await api.delete<{ message: string }>('/ai/history');
        return response.data as { message: string };
    },

    priceInsight: async (itemName: string, category?: string): Promise<PriceInsightResult> => {
        const response = await api.post<PriceInsightResult>('/ai/price-insight', { itemName, category });
        return response.data as PriceInsightResult;
    },

    observerInsight: async (offerId: string): Promise<ObserverInsight> => {
        const response = await api.get<ObserverInsight>(`/ai/observer/${offerId}`);
        return response.data as ObserverInsight;
    },

    closingStrategy: async (offerId: string): Promise<ClosingStrategy> => {
        const response = await api.get<ClosingStrategy>(`/ai/closing-strategy/${offerId}`);
        return response.data as ClosingStrategy;
    },

    latestInsights: async (limit?: number): Promise<LatestInsightItem[]> => {
        const params = limit ? { limit: String(limit) } : undefined;
        const response = await api.get<LatestInsightItem[]>('/ai/latest-insights', params);
        return response.data as LatestInsightItem[];
    },

    insightsList: async (params?: Record<string, string | number | boolean | undefined>): Promise<{ data: InsightsListItem[]; meta: { page: number; limit: number; total: number; totalPages: number } }> => {
        const response = await api.get<InsightsListItem[]>('/ai/insights', params);
        return {
            data: response.data as InsightsListItem[],
            meta: response.meta as { page: number; limit: number; total: number; totalPages: number },
        };
    },

    generateOfferDescription: async (params: {
        title: string;
        clientName: string;
        clientType?: string;
        templateType?: string;
        currentText?: string;
        mode: 'generate' | 'polish';
    }): Promise<string> => {
        const response = await api.post<{ description: string }>('/ai/offer-description', params);
        return (response.data as { description: string }).description;
    },

    /**
     * Multi-turn conversation that collects project info and returns ProposalBlocks.
     * When isComplete is true, blocks contains the generated template content.
     */
    offerFill: async (params: {
        message: string
        history: Array<{ role: 'user' | 'assistant'; content: string }>
        context: { clientName: string; offerTitle: string }
        currentBlocks?: Record<string, unknown>
    }): Promise<{ message: string; blocks: Record<string, unknown> | null; isComplete: boolean }> => {
        const response = await api.post<{ message: string; blocks: Record<string, unknown> | null; isComplete: boolean }>(
            '/ai/offer-fill',
            params,
        )
        return response.data as { message: string; blocks: Record<string, unknown> | null; isComplete: boolean }
    },

    getAlerts: async (): Promise<AlertsResponse> => {
        const response = await api.get<AlertsResponse>('/ai/alerts');
        return response.data as AlertsResponse;
    },

    priceCheck: async (items: OfferItem[], currency: string, clientContext?: string): Promise<PriceCheckResult[]> => {
        const response = await api.post<PriceCheckResult[]>('/ai/price-check', { items, currency, clientContext });
        return response.data as PriceCheckResult[];
    },

    /**
     * Generates structured content for a single proposal section via AI.
     * Returns a partial block object (e.g. { paragraphs: [...] } for intro).
     * Falls back to empty object on parse error.
     */
    generateSection: async (params: {
        sectionKey: string
        offerTitle: string
        clientName: string
        totalGross: number
        currency: string
    }): Promise<Record<string, unknown>> => {
        const response = await api.post<Record<string, unknown>>('/ai/generate-section', params)
        return (response.data as Record<string, unknown>) ?? {}
    },
};
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
} from '@/types/ai';

export const ai = {
    chat: async (message: string, history: Array<{ role: 'user' | 'assistant'; content: string }> = []): Promise<ChatData> => {
        const response = await api.post<ChatData>('/ai/chat', { message, history });
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
};
// src/services/ai/index.ts
import { GoogleGenAI } from '@google/genai';
import {
    AIMessage,
    AIResponse,
    AISuggestion,
    AIStats,
    GeneratedOffer,
    ClientAnalysis,
    EmailGenerationContext,
    EmailType,
} from '../../types';
import { initAI } from './core';
import {
    chat,
    generateOffer,
    generateEmail,
    analyzeClient,
    getUserContext,
    generateSectionContent,
    type GenerateSectionParams,
} from './chat';
import { getPriceInsight, getObserverInsight, getClosingStrategy } from './analysis';
import { generatePostMortem, getLatestInsights, getInsightsList } from './feedback';
import { offerFillChat, type OfferFillMessage, type OfferFillContext, type OfferFillResult } from './offer-fill';
import { priceCheck, type PriceCheckInput, type PriceCheckResult } from './price-check';
import { priceSuggestion, type PriceSuggestionInput, type PriceSuggestionResult } from './price-suggestion';

export type { OfferFillMessage, OfferFillContext, OfferFillResult };
export type { PriceCheckInput, PriceCheckResult };
export type { PriceSuggestionInput, PriceSuggestionResult };

class AIService {
    private readonly ai: GoogleGenAI | null;

    constructor() {
        this.ai = initAI();
    }

    getUserContext(userId: string) {
        return getUserContext(userId);
    }

    chat(userId: string, message: string, conversationHistory: AIMessage[] = [], pageContext?: { type: string; id?: string; title?: string; extra?: string }): Promise<AIResponse> {
        return chat(this.ai, userId, message, conversationHistory, pageContext);
    }

    generateOffer(_userId: string, description: string): Promise<GeneratedOffer> {
        return generateOffer(this.ai, description);
    }

    generateEmail(_userId: string, type: EmailType, context: EmailGenerationContext): Promise<string> {
        return generateEmail(this.ai, type, context);
    }

    analyzeClient(userId: string, clientId: string): Promise<ClientAnalysis> {
        return analyzeClient(this.ai, userId, clientId);
    }

    getPriceInsight(userId: string, itemName: string, category?: string) {
        return getPriceInsight(this.ai, userId, itemName, category);
    }

    getObserverInsight(userId: string, offerId: string) {
        return getObserverInsight(this.ai, userId, offerId);
    }

    getClosingStrategy(userId: string, offerId: string) {
        return getClosingStrategy(this.ai, userId, offerId);
    }

    generatePostMortem(userId: string, offerId: string, outcome: 'ACCEPTED' | 'REJECTED'): Promise<void> {
        return generatePostMortem(this.ai, userId, offerId, outcome);
    }

    getLatestInsights(userId: string, limit?: number) {
        return getLatestInsights(userId, limit);
    }

    getInsightsList(
        userId: string,
        params: {
            page: number;
            limit: number;
            outcome?: 'ACCEPTED' | 'REJECTED';
            dateFrom?: string;
            dateTo?: string;
            search?: string;
        },
    ) {
        return getInsightsList(userId, params);
    }

    generateSection(params: GenerateSectionParams): Promise<Record<string, unknown>> {
        return generateSectionContent(this.ai, params);
    }

    offerFill(context: OfferFillContext, history: OfferFillMessage[], message: string): Promise<OfferFillResult> {
        return offerFillChat(this.ai, context, history, message);
    }

    priceCheck(userId: string, input: PriceCheckInput): Promise<PriceCheckResult[]> {
        return priceCheck(this.ai, userId, input);
    }

    priceSuggestion(input: PriceSuggestionInput): Promise<PriceSuggestionResult> {
        return priceSuggestion(this.ai, input);
    }

    async getSuggestions(userId: string): Promise<{ suggestions: AISuggestion[]; stats: AIStats | undefined }> {
        const context = await getUserContext(userId);
        const suggestions: AISuggestion[] = [];

        if (context.stats?.pendingFollowUps && context.stats.pendingFollowUps > 0) {
            suggestions.push({
                type: 'warning',
                title: 'Zaległe follow-upy',
                message: `Masz ${context.stats.pendingFollowUps} zaległych follow-upów do wykonania`,
                action: { type: 'navigate', path: '/dashboard/followups?status=overdue' },
            });
        }

        const expiringOffers = context.offers?.filter((o) => {
            if (o.status !== 'SENT' || !o.validUntil) return false;
            const daysLeft = Math.ceil(
                (new Date(o.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
            );
            return daysLeft > 0 && daysLeft <= 7;
        });

        if (expiringOffers && expiringOffers.length > 0) {
            suggestions.push({
                type: 'info',
                title: 'Oferty wygasające wkrótce',
                message: `${expiringOffers.length} ofert wygasa w ciągu 7 dni`,
                action: { type: 'navigate', path: '/dashboard/offers?expiring=true' },
            });
        }

        const inactiveClients = context.clients?.filter((c) => !c.isActive);
        if (inactiveClients && inactiveClients.length > 5) {
            suggestions.push({
                type: 'tip',
                title: 'Reaktywacja klientów',
                message: `Masz ${inactiveClients.length} nieaktywnych klientów. Rozważ kampanię reaktywacyjną.`,
                action: {
                    type: 'ai_prompt',
                    prompt: 'Pomóż mi reaktywować nieaktywnych klientów',
                },
            });
        }

        return { suggestions, stats: context.stats };
    }
}

export const aiService = new AIService();
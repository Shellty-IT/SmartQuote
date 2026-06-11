// src/services/ai/chat.ts
import { GoogleGenAI } from '@google/genai';
import prisma from '../../lib/prisma';
import { aiCache, CACHE_TTL, buildCacheKey } from '../../lib/cache';
import { createModuleLogger } from '../../lib/logger';
import {
    AIMessage,
    AIContext,
    AIResponse,
    AIAction,
    AIStats,
    GeneratedOffer,
    ClientAnalysis,
    EmailGenerationContext,
    EmailType,
} from '../../types';
import { callGemini, extractJson, safeJsonParse } from './core';
import {
    buildSystemPrompt,
    buildChatPrompt,
    buildOfferGenerationPrompt,
    buildEmailPrompt,
    buildClientAnalysisPrompt,
    buildOfferDescriptionPrompt,
    type OfferDescriptionContext,
} from './prompts';

const log = createModuleLogger('ai:chat');

function buildMonthStart(): Date {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
}

export async function getUserContext(userId: string): Promise<AIContext> {
    const [clients, offers, contracts, followUps, leads] = await Promise.all([
        prisma.client.findMany({
            where: { userId },
            take: 50,
            orderBy: { updatedAt: 'desc' },
            select: {
                id: true,
                name: true,
                company: true,
                email: true,
                type: true,
                isActive: true,
            },
        }),
        prisma.offer.findMany({
            where: { userId },
            take: 30,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                number: true,
                title: true,
                status: true,
                totalGross: true,
                validUntil: true,
                client: { select: { name: true, company: true } },
            },
        }),
        prisma.contract.findMany({
            where: { userId },
            take: 20,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                number: true,
                title: true,
                status: true,
                totalGross: true,
                client: { select: { name: true, company: true } },
            },
        }),
        prisma.followUp.findMany({
            where: { userId },
            take: 30,
            orderBy: { dueDate: 'asc' },
            select: {
                id: true,
                title: true,
                type: true,
                status: true,
                priority: true,
                dueDate: true,
                client: { select: { name: true } },
            },
        }),
        prisma.lead.findMany({
            where: { userId },
            take: 20,
            orderBy: { createdAt: 'desc' },
            select: { id: true, name: true, company: true, email: true, status: true, createdAt: true },
        }),
    ]);

    const [totalClients, activeOffers, pendingFollowUps, revenueResult, leadsCount] = await Promise.all([
        prisma.client.count({ where: { userId } }),
        prisma.offer.count({
            where: { userId, status: { in: ['DRAFT', 'SENT', 'NEGOTIATION'] } },
        }),
        prisma.followUp.count({
            where: { userId, status: 'PENDING', dueDate: { lte: new Date() } },
        }),
        prisma.offer.aggregate({
            where: { userId, status: 'ACCEPTED', updatedAt: { gte: buildMonthStart() } },
            _sum: { totalGross: true },
        }),
        prisma.lead.count({ where: { userId, status: { in: ['NEW', 'CONTACTED'] } } }),
    ]);

    const stats: AIStats = {
        totalClients,
        activeOffers,
        pendingFollowUps,
        monthlyRevenue: revenueResult._sum.totalGross?.toNumber() ?? 0,
        leadsCount,
    };

    return { userId, clients, offers, contracts, followUps, leads, stats };
}

function parseActions(response: string): { cleanMessage: string; actions: AIAction[] } {
    const actions: AIAction[] = [];
    let cleanMessage = response;

    const actionRegex = /\[AKCJA:([\w_]+)(?::([^\]]+))?\]/g;
    let match;

    while ((match = actionRegex.exec(response)) !== null) {
        const [fullMatch, type, payload] = match;

        switch (type) {
            case 'create_offer':
                actions.push({
                    type: 'create_offer',
                    label: '➕ Utwórz ofertę',
                    payload: payload ? safeJsonParse(payload) : {},
                });
                break;
            case 'create_followup':
                actions.push({
                    type: 'create_followup',
                    label: '📅 Zaplanuj follow-up',
                    payload: payload ? safeJsonParse(payload) : {},
                });
                break;
            case 'send_email':
                actions.push({
                    type: 'send_email',
                    label: '✉️ Wyślij email',
                    payload: payload ? safeJsonParse(payload) : {},
                });
                break;
            case 'create_note':
                actions.push({
                    type: 'create_note',
                    label: '📝 Dodaj notatkę',
                    payload: payload ? safeJsonParse(payload) : {},
                });
                break;
            case 'update_status':
                actions.push({
                    type: 'update_status',
                    label: '🔄 Zmień status',
                    payload: payload ? safeJsonParse(payload) : {},
                });
                break;
            case 'navigate':
                actions.push({
                    type: 'navigate',
                    label: '→ Przejdź',
                    payload: payload ? safeJsonParse(payload) : {},
                });
                break;
            case 'create_lead':
                actions.push({
                    type: 'create_lead',
                    label: '👤 Utwórz lead',
                    payload: payload ? safeJsonParse(payload) : {},
                });
                break;
        }

        cleanMessage = cleanMessage.replace(fullMatch, '');
    }

    return { cleanMessage: cleanMessage.trim(), actions };
}

function generateSuggestions(message: string, context: AIContext): string[] {
    const suggestions: string[] = [];
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('ofert')) {
        suggestions.push('Pokaż moje ostatnie oferty');
        suggestions.push('Jak poprawić konwersję ofert?');
    }

    if (lowerMessage.includes('klient')) {
        suggestions.push('Którzy klienci są najbardziej aktywni?');
        suggestions.push('Zasugeruj follow-up dla klienta');
    }

    if (context.stats?.pendingFollowUps && context.stats.pendingFollowUps > 0) {
        suggestions.push(
            `Mam ${context.stats.pendingFollowUps} zaległych follow-upów. Co powinienem zrobić?`,
        );
    }

    if (suggestions.length === 0) {
        suggestions.push('Pomóż mi stworzyć ofertę');
        suggestions.push('Pokaż statystyki sprzedaży');
        suggestions.push('Jakie mam zaległe zadania?');
    }

    return suggestions.slice(0, 3);
}

function resolveAIErrorMessage(error: unknown): AIResponse {
    const msg = error instanceof Error ? error.message : '';

    if (msg.includes('API_KEY') || msg.includes('API key')) {
        return {
            message: '❌ Nieprawidłowy klucz API. Sprawdź konfigurację GEMINI_API_KEY.',
            suggestions: [],
        };
    }

    if (msg.includes('quota') || msg.includes('limit')) {
        return {
            message: '❌ Przekroczono limit zapytań do AI. Spróbuj ponownie później.',
            suggestions: [],
        };
    }

    if (msg.includes('not found') || msg.includes('404')) {
        return {
            message: '❌ Model AI nie został znaleziony. Sprawdź konfigurację GEMINI_MODEL.',
            suggestions: [],
        };
    }

    return {
        message: '❌ Wystąpił błąd podczas komunikacji z AI. Spróbuj ponownie.',
        suggestions: ['Spróbuj ponownie', 'Zadaj inne pytanie'],
    };
}

export async function chat(
    ai: GoogleGenAI | null,
    userId: string,
    message: string,
    conversationHistory: AIMessage[] = [],
    pageContext?: { type: string; id?: string; title?: string; extra?: string },
): Promise<AIResponse> {
    if (!ai) {
        return {
            message:
                '⚠️ AI Asystent nie jest skonfigurowany. Dodaj GEMINI_API_KEY do zmiennych środowiskowych.',
            suggestions: ['Skontaktuj się z administratorem'],
        };
    }

    try {
        const context = await getUserContext(userId);
        let systemPrompt = buildSystemPrompt(context);

        if (pageContext) {
            const pageSection = [
                '\n=== KONTEKST STRONY ===',
                `Użytkownik aktualnie przegląda: ${pageContext.type}${pageContext.title ? ` — "${pageContext.title}"` : ''}${pageContext.id ? ` (ID: ${pageContext.id})` : ''}`,
                pageContext.extra ? pageContext.extra : '',
                'Kiedy odpowiadasz na pytania o "tę ofertę", "tego klienta", "ten lead" itp. — odnoś się do powyższego kontekstu.',
                '=== KONIEC KONTEKSTU ===',
            ].filter(Boolean).join('\n');
            systemPrompt += pageSection;
        }

        const fullPrompt = buildChatPrompt(systemPrompt, conversationHistory, message);

        const responseText = await callGemini(ai, fullPrompt);
        const { cleanMessage, actions } = parseActions(responseText);
        const suggestions = generateSuggestions(message, context);

        return { message: cleanMessage, suggestions, actions };
    } catch (error: unknown) {
        log.error({ error, userId }, 'AI chat failed');
        return resolveAIErrorMessage(error);
    }
}

export async function generateOffer(
    ai: GoogleGenAI | null,
    description: string,
): Promise<GeneratedOffer> {
    if (!ai) throw new Error('AI nie jest skonfigurowany');

    const prompt = buildOfferGenerationPrompt(description);
    const responseText = await callGemini(ai, prompt);
    const parsed = extractJson(responseText);

    if (!parsed) throw new Error('Nie udało się wygenerować oferty');

    return parsed as GeneratedOffer;
}

export async function generateEmail(
    ai: GoogleGenAI | null,
    type: EmailType,
    context: EmailGenerationContext,
): Promise<string> {
    if (!ai) throw new Error('AI nie jest skonfigurowany');

    const prompt = buildEmailPrompt(type, context);
    return callGemini(ai, prompt);
}

export async function generateOfferDescription(
    ai: GoogleGenAI | null,
    ctx: OfferDescriptionContext,
): Promise<string> {
    if (!ai) throw new Error('AI nie jest skonfigurowany');
    const prompt = buildOfferDescriptionPrompt(ctx);
    const raw = await callGemini(ai, prompt);
    // Sanitise: strip any accidental markdown fences if model adds them
    return raw
        .replace(/^```html\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
}

export async function analyzeClient(
    ai: GoogleGenAI | null,
    userId: string,
    clientId: string,
): Promise<ClientAnalysis> {
    if (!ai) throw new Error('AI nie jest skonfigurowany');

    const cacheKey = buildCacheKey('client-analysis', userId, clientId);
    const cached = aiCache.get<ClientAnalysis>(cacheKey);
    if (cached) return cached;

    const client = await prisma.client.findFirst({
        where: { id: clientId, userId },
        include: {
            offers: { orderBy: { createdAt: 'desc' }, take: 10 },
            contracts: { orderBy: { createdAt: 'desc' }, take: 5 },
            followUps: { orderBy: { dueDate: 'desc' }, take: 10 },
        },
    });

    if (!client) throw new Error('Klient nie znaleziony');

    const prompt = buildClientAnalysisPrompt({
        name: client.name,
        company: client.company,
        type: client.type,
        email: client.email,
        isActive: client.isActive,
        offers: client.offers.map((o) => ({
            title: o.title,
            status: o.status,
            totalGross: o.totalGross,
        })),
        contracts: client.contracts.map((c) => ({
            title: c.title,
            status: c.status,
        })),
        followUps: client.followUps.map((f) => ({
            title: f.title,
            status: f.status,
            type: f.type,
        })),
    });

    const responseText = await callGemini(ai, prompt);
    const parsed = extractJson(responseText);

    const result: ClientAnalysis = parsed
        ? (parsed as ClientAnalysis)
        : {
            score: 5,
            potential: 'sredni',
            summary: responseText,
            recommendations: [],
            nextAction: 'Skontaktuj się z klientem',
            risks: [],
        };

    aiCache.set(cacheKey, result, CACHE_TTL.CLIENT_ANALYSIS);
    return result;
}

// ── Proposal section generation ───────────────────────────────────────────────

export interface GenerateSectionParams {
    sectionKey: string
    offerTitle: string
    clientName: string
    totalGross: number
    currency: string
}

const SECTION_INSTRUCTIONS: Record<string, string> = {
    intro: 'Napisz profesjonalne wprowadzenie do oferty (2 akapity po polsku, ciepły ale biznesowy ton). Odpowiedź TYLKO jako JSON: {"paragraphs":["akapit1","akapit2"]}',
    demo: 'Napisz treść sekcji demo/podglądu. Odpowiedź TYLKO jako JSON: {"title":"tytuł sekcji","body":"opis jednozdaniowy","note":"opcjonalna krótka nota"}',
    structure: 'Napisz strukturę projektu (4-5 elementów). Odpowiedź TYLKO jako JSON: {"title":"Proponowana struktura","items":[{"icon":"emoji","name":"nazwa","description":"krótki opis"},...]}',
    scope: 'Napisz zakres realizacji (7-9 pozycji). Odpowiedź TYLKO jako JSON: {"title":"Pełny zakres realizacji","items":[{"html":"opis pozycji"},...]}',
    testing: 'Napisz opis procesu realizacji/testowania (krótki). Odpowiedź TYLKO jako JSON: {"intro":"opis procesu jednozdaniowy","note":"opcjonalna nota"}',
    technology: 'Napisz opis technologii i uzasadnienie wyboru. Odpowiedź TYLKO jako JSON: {"body":"opis technologii 2-3 zdania","note":"opcjonalna nota"}',
    about: 'Napisz wezwanie do działania (CTA) kończące ofertę. Odpowiedź TYLKO jako JSON: {"ctaText":"2-3 zdania zachęcające do kontaktu"}',
}

/**
 * Generates structured content for a single proposal block.
 * Uses callGemini directly — no DB queries, no conversation history.
 */
export async function generateSectionContent(
    ai: GoogleGenAI | null,
    params: GenerateSectionParams,
): Promise<Record<string, unknown>> {
    if (!ai) throw new Error('AI nie jest skonfigurowany')

    const instruction =
        SECTION_INSTRUCTIONS[params.sectionKey] ??
        `Napisz treść sekcji ${params.sectionKey} po polsku. Zwróć JSON z odpowiednimi polami.`

    const formattedValue = params.totalGross.toLocaleString('pl-PL')
    const prompt = [
        `Kontekst oferty — tytuł: "${params.offerTitle}", klient: ${params.clientName}, wartość: ${formattedValue} ${params.currency}.`,
        '',
        `Zadanie: ${instruction}`,
        '',
        'Odpowiedź musi być TYLKO poprawnym JSON-em, bez markdown, bez wyjaśnień.',
    ].join('\n')

    const responseText = await callGemini(ai, prompt)
    const parsed = extractJson(responseText)
    return (parsed as Record<string, unknown>) ?? {}
}
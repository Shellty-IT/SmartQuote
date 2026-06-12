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
import { config } from '../../config';
import { callGemini, callGeminiStructured, Type, type Schema } from './core';
import {
    buildSystemPrompt,
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
    const cacheKey = buildCacheKey('user-context', userId);
    const cached = aiCache.get<AIContext>(cacheKey);
    if (cached) return cached;

    const monthStart = buildMonthStart();
    const [
        clients, offers, contracts, followUps, leads,
        totalClients, activeOffers, pendingFollowUps, revenueResult, leadsCount,
    ] = await Promise.all([
        prisma.client.findMany({
            where: { userId },
            take: 50,
            orderBy: { updatedAt: 'desc' },
            select: { id: true, name: true, company: true, email: true, type: true, isActive: true },
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
        prisma.client.count({ where: { userId } }),
        prisma.offer.count({ where: { userId, status: { in: ['DRAFT', 'SENT', 'NEGOTIATION'] } } }),
        prisma.followUp.count({ where: { userId, status: 'PENDING', dueDate: { lte: new Date() } } }),
        prisma.offer.aggregate({
            where: { userId, status: 'ACCEPTED', updatedAt: { gte: monthStart } },
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

    const context: AIContext = { userId, clients, offers, contracts, followUps, leads, stats };
    aiCache.set(cacheKey, context, CACHE_TTL.USER_CONTEXT);
    return context;
}

// ── Gemini function declarations ──────────────────────────────────────────────

const CHAT_FUNCTION_DECLARATIONS = [
    {
        name: 'create_offer',
        description: 'Utwórz nową ofertę dla klienta',
        parameters: {
            type: Type.OBJECT,
            properties: {
                clientId: { type: Type.STRING, description: 'ID klienta z systemu' },
                title: { type: Type.STRING, description: 'Tytuł oferty' },
            },
        },
    },
    {
        name: 'create_followup',
        description: 'Zaplanuj follow-up (telefon, email, spotkanie lub zadanie) z klientem',
        parameters: {
            type: Type.OBJECT,
            properties: {
                clientId: { type: Type.STRING, description: 'ID klienta' },
                title: { type: Type.STRING, description: 'Tytuł follow-upu' },
                type: { type: Type.STRING, description: 'CALL, EMAIL, MEETING lub TASK' },
            },
        },
    },
    {
        name: 'send_email',
        description: 'Wyślij email do klienta',
        parameters: {
            type: Type.OBJECT,
            properties: {
                clientId: { type: Type.STRING, description: 'ID klienta' },
                type: { type: Type.STRING, description: 'Typ emaila, np. offer_send' },
            },
        },
    },
    {
        name: 'create_note',
        description: 'Dodaj notatkę do oferty, klienta, leadu lub kontraktu',
        parameters: {
            type: Type.OBJECT,
            properties: {
                content: { type: Type.STRING, description: 'Treść notatki' },
                entityType: { type: Type.STRING, description: 'offer, client, lead lub contract' },
                entityId: { type: Type.STRING, description: 'ID encji' },
            },
            required: ['content'],
        },
    },
    {
        name: 'navigate',
        description: 'Nawiguj do konkretnej strony (gdy użytkownik prosi "pokaż mi X")',
        parameters: {
            type: Type.OBJECT,
            properties: {
                path: { type: Type.STRING, description: 'Ścieżka URL, np. /dashboard/offers/123' },
            },
            required: ['path'],
        },
    },
    {
        name: 'update_status',
        description: 'Zmień status oferty lub kontraktu',
        parameters: {
            type: Type.OBJECT,
            properties: {
                entityType: { type: Type.STRING, description: 'offer lub contract' },
                entityId: { type: Type.STRING, description: 'ID encji' },
                status: { type: Type.STRING, description: 'Nowy status, np. SENT lub ACCEPTED' },
            },
            required: ['entityType', 'entityId', 'status'],
        },
    },
    {
        name: 'create_lead',
        description: 'Zapisz nowego potencjalnego klienta (lead)',
        parameters: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING, description: 'Imię i nazwisko' },
                email: { type: Type.STRING, description: 'Adres email' },
                company: { type: Type.STRING, description: 'Nazwa firmy' },
                source: { type: Type.STRING, description: 'Źródło leadu' },
            },
        },
    },
] as const;

const ACTION_LABELS: Record<string, string> = {
    create_offer: '➕ Utwórz ofertę',
    create_followup: '📅 Zaplanuj follow-up',
    send_email: '✉️ Wyślij email',
    create_note: '📝 Dodaj notatkę',
    update_status: '🔄 Zmień status',
    navigate: '→ Przejdź',
    create_lead: '👤 Utwórz lead',
};

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

        type GeminiContent = { role: 'user' | 'model'; parts: Array<{ text: string }> };
        const contents: GeminiContent[] = [
            ...conversationHistory.map((msg): GeminiContent => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }],
            })),
            { role: 'user', parts: [{ text: message }] },
        ];

        const response = await ai.models.generateContent({
            model: config.gemini.model,
            contents,
            config: {
                systemInstruction: systemPrompt,
                tools: [{ functionDeclarations: CHAT_FUNCTION_DECLARATIONS as unknown as never[] }],
            },
        });

        const parts = response.candidates?.[0]?.content?.parts ?? [];
        const responseText = parts
            .filter((p): p is { text: string } => typeof (p as { text?: unknown }).text === 'string')
            .map((p) => p.text)
            .join('');

        const actions: AIAction[] = parts
            .filter((p): p is { functionCall: { name: string; args: Record<string, unknown> } } => {
                const fc = (p as { functionCall?: { name?: string } }).functionCall;
                return fc != null && typeof fc.name === 'string' && ACTION_LABELS[fc.name] != null;
            })
            .map((p) => ({
                type: p.functionCall.name as AIAction['type'],
                label: ACTION_LABELS[p.functionCall.name],
                payload: p.functionCall.args ?? {},
            }));

        const suggestions = generateSuggestions(message, context);
        return { message: responseText, suggestions, actions };
    } catch (error: unknown) {
        log.error({ error, userId }, 'AI chat failed');
        return resolveAIErrorMessage(error);
    }
}

const GENERATE_OFFER_SCHEMA: Schema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        notes: { type: Type.STRING },
        validDays: { type: Type.NUMBER },
        items: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    quantity: { type: Type.NUMBER },
                    unit: { type: Type.STRING },
                    unitPrice: { type: Type.NUMBER },
                    vatRate: { type: Type.NUMBER },
                },
                required: ['name', 'quantity', 'unit', 'unitPrice', 'vatRate'],
            },
        },
    },
    required: ['title', 'items', 'validDays'],
};

export async function generateOffer(
    ai: GoogleGenAI | null,
    description: string,
): Promise<GeneratedOffer> {
    if (!ai) throw new Error('AI nie jest skonfigurowany');

    const prompt = buildOfferGenerationPrompt(description);
    return callGeminiStructured<GeneratedOffer>(ai, prompt, GENERATE_OFFER_SCHEMA);
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

    const CLIENT_ANALYSIS_SCHEMA: Schema = {
        type: Type.OBJECT,
        properties: {
            score: { type: Type.NUMBER },
            potential: { type: Type.STRING },
            summary: { type: Type.STRING },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            nextAction: { type: Type.STRING },
            risks: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['score', 'potential', 'summary', 'recommendations', 'nextAction', 'risks'],
    };

    const result = await callGeminiStructured<ClientAnalysis>(ai, prompt, CLIENT_ANALYSIS_SCHEMA);
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

const SECTION_PROMPTS: Record<string, string> = {
    intro: 'Napisz profesjonalne wprowadzenie do oferty (2 akapity po polsku, ciepły ale biznesowy ton).',
    demo: 'Napisz treść sekcji demo/podglądu — tytuł i jednozdaniowy opis.',
    structure: 'Napisz strukturę projektu (4–5 elementów z ikonkami emoji, nazwami i krótkimi opisami).',
    scope: 'Napisz zakres realizacji (7–9 pozycji — konkretne deliverables).',
    testing: 'Napisz jednozdaniowy opis procesu realizacji.',
    technology: 'Napisz opis technologii i uzasadnienie wyboru (2–3 zdania).',
    about: 'Napisz ciepłe, asertywne wezwanie do działania (2–3 zdania, bez "zachęcam").',
}

const SECTION_SCHEMAS: Record<string, Schema> = {
    intro: {
        type: Type.OBJECT,
        properties: { paragraphs: { type: Type.ARRAY, items: { type: Type.STRING } } },
        required: ['paragraphs'],
    },
    demo: {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            body: { type: Type.STRING },
            note: { type: Type.STRING },
        },
        required: ['title', 'body'],
    },
    structure: {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            items: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        icon: { type: Type.STRING },
                        name: { type: Type.STRING },
                        description: { type: Type.STRING },
                    },
                    required: ['icon', 'name', 'description'],
                },
            },
        },
        required: ['title', 'items'],
    },
    scope: {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            items: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { html: { type: Type.STRING } }, required: ['html'] } },
        },
        required: ['title', 'items'],
    },
    testing: {
        type: Type.OBJECT,
        properties: { intro: { type: Type.STRING }, note: { type: Type.STRING } },
        required: ['intro'],
    },
    technology: {
        type: Type.OBJECT,
        properties: { body: { type: Type.STRING }, note: { type: Type.STRING } },
        required: ['body'],
    },
    about: {
        type: Type.OBJECT,
        properties: { ctaText: { type: Type.STRING } },
        required: ['ctaText'],
    },
}

const FALLBACK_SECTION_SCHEMA: Schema = {
    type: Type.OBJECT,
    properties: { content: { type: Type.STRING } },
    required: ['content'],
}

/**
 * Generates structured content for a single proposal block.
 * Uses responseSchema for guaranteed JSON — no extractJson regex fallback.
 */
export async function generateSectionContent(
    ai: GoogleGenAI | null,
    params: GenerateSectionParams,
): Promise<Record<string, unknown>> {
    if (!ai) throw new Error('AI nie jest skonfigurowany')

    const instruction = SECTION_PROMPTS[params.sectionKey]
        ?? `Napisz treść sekcji ${params.sectionKey} po polsku.`
    const schema = SECTION_SCHEMAS[params.sectionKey] ?? FALLBACK_SECTION_SCHEMA

    const formattedValue = params.totalGross.toLocaleString('pl-PL')
    const prompt = `Kontekst oferty — tytuł: "${params.offerTitle}", klient: ${params.clientName}, wartość: ${formattedValue} ${params.currency}.\n\n${instruction}`

    return callGeminiStructured<Record<string, unknown>>(ai, prompt, schema)
}
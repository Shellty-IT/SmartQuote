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

export const SECTION_PROMPTS: Record<string, string> = {
    // ── Proposal template ─────────────────────────────────────────────────────
    intro: `Napisz wprowadzenie do oferty po polsku w 2–3 KRÓTKICH akapitach (każdy 1–3 zdania).
- Akapit 1: mocne, osobiste powitanie zaczynające się od empatii wobec potrzeby klienta. Dodaj 1 pasujące do branży emoji na początku (np. 👋, 🚀, 🏗️).
- Kolejne akapity: język korzyści (co klient ZYSKA), konkretnie i branżowo, ciepły ale biznesowy ton.
- Wyróżnij JEDNĄ kluczową korzyść używając <strong>...</strong> (dokładnie ten tag).
- Możesz wpleść 1–2 dodatkowe emoji jeśli pasują. Bez ogólników i sloganów typu "profesjonalna strona".
Zwróć każdy akapit jako osobny element tablicy paragraphs.`,
    demo: 'Napisz treść sekcji demo/podglądu — tytuł i jednozdaniowy opis.',
    structure: 'Napisz strukturę projektu (4–5 elementów z ikonkami emoji, nazwami i krótkimi opisami).',
    scope: 'Napisz zakres realizacji (7–9 pozycji — konkretne deliverables).',
    testing: 'Napisz jednozdaniowy opis procesu realizacji.',
    technology: 'Napisz opis technologii i uzasadnienie wyboru (2–3 zdania).',
    about: 'Napisz ciepłe, asertywne wezwanie do działania (2–3 zdania, bez "zachęcam").',
    benefits: 'Napisz 3–4 kluczowe korzyści współpracy (każda: emoji jako ikona, krótki tytuł, jednozdaniowy opis). Język korzyści, konkretnie.',
    process: 'Napisz 3–4 etapy współpracy w kolejności (każdy: krótki tytuł + jednozdaniowy opis). Od pierwszego kontaktu do wdrożenia.',
    stats: 'Napisz 3 krótkie statystyki budujące zaufanie (każda: zwięzła wartość np. "50+", "10 lat", "100%" + krótki podpis). Realistyczne, bez przesady.',

    // ── mobile_simple template ─────────────────────────────────────────────────
    'mobile_simple.cover': `Przygotuj krótkie treści na okładkę oferty aplikacji mobilnej.
projectName: zwięzła, atrakcyjna nazwa projektu lub aplikacji (maks. 4 słowa).
subtitlePrefix: krótki tekst przed nazwą klienta, np. "Aplikacja mobilna dla".
promises: dokładnie 3 krótkie korzyści projektu (każda maks. 5 słów), bez danych wymyślonych i bez cen.`,
    'mobile_simple.checklist': `Napisz listę funkcji aplikacji mobilnej po polsku (6–9 pozycji).
Każda pozycja: krótki tytuł (5–7 słów, język korzyści) + opis (1–2 zdania, co klient z tego ma).
Nie używaj technicznego żargonu — pisz jak do właściciela małej firmy.
Dołącz też 3–4 opcje dodatkowe (options) z emoji, nazwą i orientacyjną ceną w zł.
Uwzględnij specyfikę projektu klienta na podstawie tytułu oferty.`,
    'mobile_simple.tech': `Napisz treść sekcji technologicznej — porównanie React Native i Flutter. Dostosuj do projektu klienta.
Dla każdej karty: tagline (1 zdanie co to daje klientowi) i description (2–3 zdania prostym językiem).
pros dla każdej karty: 3 krótkie punkty korzyści (maks. 8 słów każdy).
alternativeText: 1–2 zdania zachęcające do rozmowy o wyborze technologii. Ton: ciepły, bez żargonu.`,
    'mobile_simple.process': `Napisz opis procesu realizacji aplikacji mobilnej dla właściciela małej firmy.
steps: 3–4 etapy (tytuł + 1 zdanie opisu), od rozmowy do wdrożenia.
timelineNote: krótka informacja o czasie (np. "⏱ Całość trwa zazwyczaj 6–10 tygodni").
priceIncludes: 4–5 rzeczy wchodzących w cenę (krótkie punkty).
guarantees: 2–3 gwarancje: emoji + krótki label (max 6 słów). Ton ciepły, pisz "Ty" do klienta.`,

    // ── universal template ─────────────────────────────────────────────────────
    'universal.cover': `Przygotuj dane tekstowe na okładkę uniwersalnej oferty B2B.
serviceTitle: konkretna nazwa oferowanej usługi lub projektu (maks. 8 słów).
clientName: nazwa klienta dokładnie zgodna z kontekstem oferty.
Nie generuj dat, danych kontaktowych ani danych wykonawcy.`,
    'universal.summary': `Napisz streszczenie wykonawcze oferty B2B po polsku.
eyebrow: krótki tag np. "Streszczenie".
title: tytuł sekcji (np. "W skrócie").
leadText: 2–3 zdania o projekcie — cel, rozwiązanie, korzyść biznesowa.
scopeFact: 1 zdanie opisujące zakres.
timelineFact: szacowany czas (np. "6–8 tygodni").
valueFact: wartość lub skrót projektu. Styl formalny B2B, konkretny.`,
    'universal.needs': `Napisz sekcję analizy potrzeb klienta B2B.
sourceNote: krótka wzmianka o źródle briefu.
challengeText: 2–3 zdania — opis problemu/wyzwania klienta własnymi słowami.
goalText: 1–2 zdania — co klient chce osiągnąć (mierzalne).
resultText: 1–2 zdania — po czym poznamy że projekt się udał. Styl: rzeczowy, empatyczny.`,
    'universal.scope': `Napisz zakres projektu dla oferty B2B.
items: 5–7 elementów: {name (krótki tytuł), description (1 zdanie), optional (false dla głównych, true dla opcjonalnych)}.
excludes: 3–4 rzeczy NIE wchodzące w zakres.
assumptionText: 2–3 zdania założeń projektu. Styl formalny, chroni obie strony.`,
    'universal.timeline': `Napisz harmonogram projektu B2B (4–5 etapów w kolejności):
name: krótka nazwa etapu, duration: czas trwania (np. "3–5 dni"), description: 1 zdanie co obejmuje, active: false.
Dostosuj do rodzaju projektu klienta.`,
    'universal.terms': `Napisz 6 kart warunków współpracy B2B.
Każda: {icon: emoji, title: krótka nazwa (3–5 słów), text: 1–2 zdania}.
Uwzględnij: formę umowy, poufność, prawa autorskie, poprawki, odpowiedzialność, wypowiedzenie.
Styl formalny ale zrozumiały, chroni wykonawcę.`,

    // ── support template ──────────────────────────────────────────────────────
    'support.benefits': `Napisz sekcję korzyści z opieki technicznej IT — porównanie "bez nas" vs "z nami".
sectionTitle i sectionLead: krótki tytuł + 1 zdanie leadu.
withoutItems: 3–4 problemy BEZ opieki ({title: krótki, description: 1 zdanie scenariusza}).
withItems: 3–4 korzyści Z opieką ({title: krótki, description: 1 zdanie rozwiązania}).
quote: 1 cytat menedżerski w cudzysłowie o wartości opieki IT. Dostosuj do klienta.`,
    'support.scope': `Napisz zakres opieki technicznej IT.
included: 6–8 usług WCHODZĄCYCH w opiekę ({title, description: 1 zdanie}).
excluded: 4–5 usług POZA zakresem ({title, description: 1 zdanie}).
Uwzględnij: aktualizacje, monitoring, backup, bezpieczeństwo, wsparcie. Styl jasny, chroni obie strony.`,
    'support.process': `Napisz opis procesu obsługi zgłoszenia IT (5 etapów od zgłoszenia do zamknięcia):
emoji: odpowiednie emoji, title: krótki tytuł (2–4 słowa), description: 1–2 zdania jak przebiega etap.
Styl prosty, buduje zaufanie klienta.`,

    // ── mobile_app template ───────────────────────────────────────────────────
    'mobile_app.vision': `Napisz sekcję wizji projektu aplikacji mobilnej dostosowaną do klienta.
sectionTitle i sectionLead: krótki tytuł + 1 zdanie leadu.
projectDescription: 2–3 zdania — co klient chce osiągnąć, jaka wartość aplikacji na rynku.
cards: dokładnie 3 karty:
  {emoji: "🎯", accent: "rose", title: "Cel biznesowy", description: 2 zdania},
  {emoji: "👤", accent: "indigo", title: "Użytkownik docelowy", description: 2 zdania},
  {emoji: "📈", accent: "green", title: "Miernik sukcesu", description: 2 zdania}.`,
    'mobile_app.scope': `Napisz zakres MVP aplikacji mobilnej dla klienta.
mvpFeatures: 5–6 funkcji w MVP (krótkie punkty, każdy 3–6 słów).
fullFeatures: 6–8 funkcji w pełnej wersji (zacznij od "Wszystko z MVP").
recommendationNote: 1–2 zdania rekomendacji — zacznij od MVP, minimalizuj ryzyko.
Dostosuj do rodzaju aplikacji klienta.`,
    'mobile_app.timeline': `Napisz plan etapów projektu aplikacji mobilnej (5 etapów w kolejności).
Każdy: {title, description: 1–2 zdania co wchodzi, deliverable: co oddajemy klientowi, weeks: czas, paymentPercent: "X%", paymentAmount: "XX 000"}.
Etapy: Discovery/UX → UI Design → Development → Testy → Publikacja. Dostosuj do projektu.`,
    'mobile_app.postlaunch': `Napisz 3 plany utrzymania aplikacji mobilnej po wdrożeniu:
  {emoji: "🛡️", title: "Utrzymanie Basic", description: co obejmuje, price: "X 000 zł/mies.", highlighted: false},
  {emoji: "🚀", title: "Utrzymanie + Rozwój", description: co obejmuje, price: "X 000 zł/mies.", highlighted: true},
  {emoji: "🤝", title: "Partnerstwo strategiczne", description: co obejmuje, price: "Wycena indywidualna", highlighted: false}.
Styl: buduje poczucie bezpieczeństwa długoterminowego.`,
    'mobile_app.about': `Napisz sekcję "Dlaczego ja" dla developera aplikacji mobilnych.
bio: 2–3 zdania specjalizacji i wartości (konkretnie, bez ogólników).
techStack: 8–12 technologii (np. "React Native", "Flutter", "Firebase", "TypeScript").
stats: 3 statystyki ({value: liczba/%, label: krótki opis}) — realistyczne, budujące zaufanie.`,

    // ── shop template ─────────────────────────────────────────────────────────
    'shop.summary': `Napisz streszczenie projektu sklepu internetowego (2 kolumny).
columns: [{title: "Streszczenie projektu", body: 3–4 zdania o zakresie, terminach, wartości dla klienta},
          {title: "Dlaczego ten wybór", body: 3–4 zdania dlaczego to właściwa decyzja}].
Styl: przekonujący B2B, konkretny.`,
    'shop.scope': `Napisz zakres prac dla projektu sklepu internetowego (5–8 pozycji).
Każda: {icon: emoji, title: krótki tytuł (4–6 słów), description: 1 zdanie co wchodzi}.
Uwzględnij: projekt, frontend, backend, płatności, integracje, testy, wdrożenie.`,
    'shop.timeline': `Napisz harmonogram realizacji sklepu internetowego (4–6 etapów).
Każdy: {title: nazwa etapu, duration: czas (np. "7 dni"), description: 1 zdanie co wchodzi}.
Zacznij od analizy, skończ na wdrożeniu i szkoleniu.`,
    'shop.techStack': `Napisz opis stack technologicznego dla sklepu internetowego.
title: tytuł sekcji.
tags: 6–10 technologii (np. "Next.js", "WooCommerce", "Stripe", "PostgreSQL").
description: 2–3 zdania uzasadnienia wyboru (korzyści dla klienta, bez żargonu).`,
    'shop.warranty': `Napisz sekcję gwarancji i wsparcia po wdrożeniu sklepu internetowego.
items: 3–4 elementy gwarancji ({icon: emoji, title: krótki tytuł, description: 1 zdanie}).
Uwzględnij: czas gwarancji na błędy, rundy bezpłatnych poprawek, wsparcie techniczne.
ctaTitle i ctaSubtitle: krótkie wezwanie do działania.`,
    'shop.about': `Napisz sekcję "O wykonawcy" dla specjalisty e-commerce.
title: tytuł.
description: 3–4 zdania specjalizacji i doświadczenia (konkretnie, bez ogólników).
stats: 3 statystyki ({value, label}) — realistyczne, budujące zaufanie.`,

    // ── website_v2 template ───────────────────────────────────────────────────
    'website_v2.problem': `Napisz sekcję "problem klienta" dla oferty strony internetowej.
title: tytuł sekcji.
painPoints: 4–5 punktów bólowych ({emoji, text: 1 zdanie problemu}).
punchline: 1–2 zdania jak Ty to rozwiązujesz (pewny ton, bez "zachęcam").
Uwzględnij typowe problemy firm bez profesjonalnej strony.`,
    'website_v2.about': `Napisz sekcję "O mnie" dla web developera.
title: tytuł.
role: "Web Developer" lub podobna specjalizacja.
bio: 3–4 zdania o podejściu i specjalizacji (ciepłe, konkretne).
stats: 3 statystyki ({value, label}) — realistyczne, nie przesadzone.`,
    'website_v2.features': `Napisz sekcję funkcji/usług dla strony internetowej klienta.
title i subtitle: tytuł + krótki lead.
items: 5–7 funkcji ({title: 3–5 słów, description: 1 zdanie korzyści}).
extras: 3–4 rzeczy "w cenie" (krótkie punkty).
Dostosuj do rodzaju biznesu klienta.`,
    'website_v2.process': `Napisz opis procesu realizacji strony internetowej (4–5 etapów).
title: tytuł.
steps: [{title: nazwa etapu, description: 1–2 zdania}].
timelineNote: czas od startu do oddania.
Styl: buduje zaufanie, eliminuje niepewność klienta.`,
    'website_v2.faq': `Napisz 4–5 pytań i odpowiedzi FAQ dla oferty strony internetowej.
Każde: {question: krótkie pytanie (klient je zadaje), answer: 2–3 zdania konkretnej odpowiedzi}.
Uwzględnij: czas realizacji, co wchodzi w cenę, poprawki, wsparcie po wdrożeniu.
Odpowiedzi mają rozwiać typowe obiekcje klientów.`,

    // ── website_v3 template ───────────────────────────────────────────────────
    'website_v3.needs': `Napisz sekcję analizy potrzeb klienta dla oferty strony internetowej.
title: tytuł sekcji.
intro: 1–2 zdania wprowadzenia.
challengeTitle: tytuł listy wyzwań (np. "Co Ci doskwiera?").
challengeItems: 3–4 krótkie wyzwania klienta (bez profesjonalnej strony).
responseTitle: tytuł odpowiedzi (np. "Jak sobie z tym radzimy").
responseItems: 3–4 krótkie punkty rozwiązania. Dostosuj do rodzaju biznesu klienta.`,
    'website_v3.process': `Napisz opis procesu realizacji strony internetowej (4–5 etapów).
title: tytuł.
steps: [{label: krótki opis (2–3 słowa), duration: czas, description: 1–2 zdania}].
timelineNote: informacja o łącznym czasie. Pisz do klienta "Ty", buduj zaufanie.`,
    'website_v3.testimonials': `Napisz 3 przykładowe referencje klientów web developera (testimonials).
Każda: {quote: 2–3 zdania konkretnej opinii, initials: "AB", name: "Anna B.", position: "Właściciel firmy XYZ"}.
Opinie mają być autentyczne — konkretne korzyści, bez ogólnikowych pochlebstw.`,
    'website_v3.about': `Napisz sekcję "O mnie" dla web developera.
title: tytuł.
bio1: 2–3 zdania — specjalizacja i podejście do pracy.
bio2: 2–3 zdania — co klient zyska współpracując ze mną (konkretne korzyści).
stats: 3 statystyki ({value, label}) — realistyczne.`,
    'website_v3.terms': `Napisz 4–5 kart warunków współpracy dla web developera.
Każda: {icon: emoji, title: krótki tytuł (3–5 słów), text: 1–2 zdania}.
Uwzględnij: poprawki, czas realizacji, płatności, prawa autorskie, NDA.
Styl formalny ale przystępny, chroni wykonawcę.`,

    // ── Contract templates (umowy) ─────────────────────────────────────────────
    'contract_short.subject': `Napisz przedmiot umowy o wykonanie strony internetowej / usługi IT, dostosowany do projektu klienta.
scopeItems: 4–6 konkretnych pozycji zakresu prac (każda 1 zdanie, rzeczowo, językiem umowy — np. "projekt graficzny i implementacja strony zgodnie z wytycznymi Zamawiającego").
additionalNote: 1–2 zdania uwagi końcowej chroniącej Wykonawcę (np. że prace nieujęte wymagają aneksu, brak odpowiedzialności za treści dostarczone przez Zamawiającego).
Styl formalny, prawny, ale zrozumiały. Dostosuj zakres do tytułu umowy.`,
    'contract_services.scope': `Napisz zakres prac do umowy o wykonanie strony internetowej, dostosowany do projektu klienta.
items: 5–8 konkretnych pozycji zakresu (każda 1 zdanie, rzeczowo — co Wykonawca dostarcza).
exclusions: 1 zdanie wymieniające po przecinku, czego zakres NIE obejmuje (np. tworzenie treści, zdjęcia, kampanie reklamowe, pozycjonowanie SEO).
Styl formalny, prawny. Dostosuj do tytułu umowy.`,
    'contract_mobile.scope': `Napisz zakres prac do umowy o wykonanie aplikacji mobilnej, dostosowany do projektu klienta.
features: 6–9 pozycji zakresu (każda 1 zdanie — co wchodzi w realizację aplikacji).
exclusions: 3–5 pozycji wyłączonych z zakresu (czego umowa NIE obejmuje).
Styl formalny, prawny. Uwzględnij specyfikę aplikacji mobilnej (iOS/Android, publikacja w sklepach).`,
    'contract_dedicated.phases': `Napisz etapy realizacji dedykowanego systemu informatycznego, dostosowane do projektu klienta.
phases: 5–7 etapów w kolejności, każdy {name: krótka nazwa etapu, description: 1 zdanie co obejmuje / deliverable}.
exclusions: 3–5 pozycji wyłączonych z zakresu prac.
Styl formalny, prawny. Etapy typowe dla projektu software: specyfikacja, UI/UX, development, testy, wdrożenie.`,
    'contract_sla.services': `Napisz katalog usług do umowy opieki IT / SLA, dostosowany do klienta.
included: 6–9 usług objętych abonamentem (każda 1 zdanie — co Wykonawca świadczy w ramach opieki).
excluded: 4–5 prac POZA katalogiem (wymagających osobnej oferty).
Styl formalny, prawny. Uwzględnij: monitoring, aktualizacje, backup, bezpieczeństwo, wsparcie.`,
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
    benefits: {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            items: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        icon: { type: Type.STRING },
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                    },
                    required: ['icon', 'title', 'description'],
                },
            },
        },
        required: ['title', 'items'],
    },
    process: {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            steps: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                    },
                    required: ['title', 'description'],
                },
            },
        },
        required: ['title', 'steps'],
    },
    stats: {
        type: Type.OBJECT,
        properties: {
            items: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        value: { type: Type.STRING },
                        label: { type: Type.STRING },
                    },
                    required: ['value', 'label'],
                },
            },
        },
        required: ['items'],
    },

    // ── mobile_simple ─────────────────────────────────────────────────────────
    'mobile_simple.cover': {
        type: Type.OBJECT,
        properties: {
            projectName:    { type: Type.STRING },
            subtitlePrefix: { type: Type.STRING },
            promises:       { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['projectName', 'subtitlePrefix', 'promises'],
    },
    'mobile_simple.checklist': {
        type: Type.OBJECT,
        properties: {
            items: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: { title: { type: Type.STRING }, description: { type: Type.STRING } },
                    required: ['title', 'description'],
                },
            },
            options: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: { emoji: { type: Type.STRING }, label: { type: Type.STRING }, price: { type: Type.STRING } },
                    required: ['emoji', 'label', 'price'],
                },
            },
        },
        required: ['items'],
    },
    'mobile_simple.tech': {
        type: Type.OBJECT,
        properties: {
            cardATagline:    { type: Type.STRING },
            cardADescription: { type: Type.STRING },
            cardAPros:       { type: Type.ARRAY, items: { type: Type.STRING } },
            cardBTagline:    { type: Type.STRING },
            cardBDescription: { type: Type.STRING },
            cardBPros:       { type: Type.ARRAY, items: { type: Type.STRING } },
            alternativeText: { type: Type.STRING },
        },
        required: ['cardATagline', 'cardADescription', 'cardAPros', 'cardBTagline', 'cardBDescription', 'cardBPros'],
    },
    'mobile_simple.process': {
        type: Type.OBJECT,
        properties: {
            steps: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: { title: { type: Type.STRING }, description: { type: Type.STRING } },
                    required: ['title', 'description'],
                },
            },
            timelineNote:  { type: Type.STRING },
            priceIncludes: { type: Type.ARRAY, items: { type: Type.STRING } },
            guarantees: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: { emoji: { type: Type.STRING }, label: { type: Type.STRING } },
                    required: ['emoji', 'label'],
                },
            },
        },
        required: ['steps'],
    },

    // ── universal ─────────────────────────────────────────────────────────────
    'universal.cover': {
        type: Type.OBJECT,
        properties: {
            serviceTitle: { type: Type.STRING },
            clientName:   { type: Type.STRING },
        },
        required: ['serviceTitle', 'clientName'],
    },
    'universal.summary': {
        type: Type.OBJECT,
        properties: {
            eyebrow:      { type: Type.STRING },
            title:        { type: Type.STRING },
            leadText:     { type: Type.STRING },
            scopeFact:    { type: Type.STRING },
            timelineFact: { type: Type.STRING },
            valueFact:    { type: Type.STRING },
        },
        required: ['leadText'],
    },
    'universal.needs': {
        type: Type.OBJECT,
        properties: {
            sourceNote:    { type: Type.STRING },
            challengeText: { type: Type.STRING },
            goalText:      { type: Type.STRING },
            resultText:    { type: Type.STRING },
        },
        required: ['challengeText', 'goalText'],
    },
    'universal.scope': {
        type: Type.OBJECT,
        properties: {
            items: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        description: { type: Type.STRING },
                        optional: { type: Type.BOOLEAN },
                    },
                    required: ['name', 'description', 'optional'],
                },
            },
            excludes:       { type: Type.ARRAY, items: { type: Type.STRING } },
            assumptionText: { type: Type.STRING },
        },
        required: ['items'],
    },
    'universal.timeline': {
        type: Type.OBJECT,
        properties: {
            steps: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name:        { type: Type.STRING },
                        duration:    { type: Type.STRING },
                        description: { type: Type.STRING },
                    },
                    required: ['name', 'duration', 'description'],
                },
            },
        },
        required: ['steps'],
    },
    'universal.terms': {
        type: Type.OBJECT,
        properties: {
            cards: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        icon:  { type: Type.STRING },
                        title: { type: Type.STRING },
                        text:  { type: Type.STRING },
                    },
                    required: ['icon', 'title', 'text'],
                },
            },
        },
        required: ['cards'],
    },

    // ── support ───────────────────────────────────────────────────────────────
    'support.benefits': {
        type: Type.OBJECT,
        properties: {
            sectionTitle: { type: Type.STRING },
            sectionLead:  { type: Type.STRING },
            withoutItems: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: { title: { type: Type.STRING }, description: { type: Type.STRING } },
                    required: ['title', 'description'],
                },
            },
            withItems: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: { title: { type: Type.STRING }, description: { type: Type.STRING } },
                    required: ['title', 'description'],
                },
            },
            quote: { type: Type.STRING },
        },
        required: ['withoutItems', 'withItems'],
    },
    'support.scope': {
        type: Type.OBJECT,
        properties: {
            included: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: { title: { type: Type.STRING }, description: { type: Type.STRING } },
                    required: ['title', 'description'],
                },
            },
            excluded: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: { title: { type: Type.STRING }, description: { type: Type.STRING } },
                    required: ['title', 'description'],
                },
            },
        },
        required: ['included', 'excluded'],
    },
    'support.process': {
        type: Type.OBJECT,
        properties: {
            steps: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        emoji:       { type: Type.STRING },
                        title:       { type: Type.STRING },
                        description: { type: Type.STRING },
                    },
                    required: ['emoji', 'title', 'description'],
                },
            },
        },
        required: ['steps'],
    },

    // ── mobile_app ────────────────────────────────────────────────────────────
    'mobile_app.vision': {
        type: Type.OBJECT,
        properties: {
            sectionTitle:       { type: Type.STRING },
            sectionLead:        { type: Type.STRING },
            projectDescription: { type: Type.STRING },
            cards: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        emoji:       { type: Type.STRING },
                        accent:      { type: Type.STRING },
                        title:       { type: Type.STRING },
                        description: { type: Type.STRING },
                    },
                    required: ['emoji', 'accent', 'title', 'description'],
                },
            },
        },
        required: ['projectDescription', 'cards'],
    },
    'mobile_app.scope': {
        type: Type.OBJECT,
        properties: {
            mvpFeatures:        { type: Type.ARRAY, items: { type: Type.STRING } },
            fullFeatures:       { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendationNote: { type: Type.STRING },
        },
        required: ['mvpFeatures', 'fullFeatures'],
    },
    'mobile_app.timeline': {
        type: Type.OBJECT,
        properties: {
            stages: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title:          { type: Type.STRING },
                        description:    { type: Type.STRING },
                        deliverable:    { type: Type.STRING },
                        weeks:          { type: Type.STRING },
                        paymentPercent: { type: Type.STRING },
                        paymentAmount:  { type: Type.STRING },
                    },
                    required: ['title', 'description', 'deliverable', 'weeks'],
                },
            },
        },
        required: ['stages'],
    },
    'mobile_app.postlaunch': {
        type: Type.OBJECT,
        properties: {
            maintenancePlans: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        emoji:       { type: Type.STRING },
                        title:       { type: Type.STRING },
                        description: { type: Type.STRING },
                        price:       { type: Type.STRING },
                        highlighted: { type: Type.BOOLEAN },
                    },
                    required: ['emoji', 'title', 'description', 'price', 'highlighted'],
                },
            },
        },
        required: ['maintenancePlans'],
    },
    'mobile_app.about': {
        type: Type.OBJECT,
        properties: {
            bio:       { type: Type.STRING },
            techStack: { type: Type.ARRAY, items: { type: Type.STRING } },
            stats: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: { value: { type: Type.STRING }, label: { type: Type.STRING } },
                    required: ['value', 'label'],
                },
            },
        },
        required: ['bio'],
    },

    // ── shop ──────────────────────────────────────────────────────────────────
    'shop.summary': {
        type: Type.OBJECT,
        properties: {
            columns: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: { title: { type: Type.STRING }, body: { type: Type.STRING } },
                    required: ['title', 'body'],
                },
            },
        },
        required: ['columns'],
    },
    'shop.scope': {
        type: Type.OBJECT,
        properties: {
            items: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        icon:        { type: Type.STRING },
                        title:       { type: Type.STRING },
                        description: { type: Type.STRING },
                    },
                    required: ['icon', 'title', 'description'],
                },
            },
        },
        required: ['items'],
    },
    'shop.timeline': {
        type: Type.OBJECT,
        properties: {
            steps: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title:       { type: Type.STRING },
                        duration:    { type: Type.STRING },
                        description: { type: Type.STRING },
                    },
                    required: ['title', 'duration', 'description'],
                },
            },
        },
        required: ['steps'],
    },
    'shop.techStack': {
        type: Type.OBJECT,
        properties: {
            title:       { type: Type.STRING },
            tags:        { type: Type.ARRAY, items: { type: Type.STRING } },
            description: { type: Type.STRING },
        },
        required: ['tags'],
    },
    'shop.warranty': {
        type: Type.OBJECT,
        properties: {
            items: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        icon:        { type: Type.STRING },
                        title:       { type: Type.STRING },
                        description: { type: Type.STRING },
                    },
                    required: ['icon', 'title', 'description'],
                },
            },
            ctaTitle:    { type: Type.STRING },
            ctaSubtitle: { type: Type.STRING },
        },
        required: ['items'],
    },
    'shop.about': {
        type: Type.OBJECT,
        properties: {
            title:       { type: Type.STRING },
            description: { type: Type.STRING },
            stats: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: { value: { type: Type.STRING }, label: { type: Type.STRING } },
                    required: ['value', 'label'],
                },
            },
        },
        required: ['description'],
    },

    // ── website_v2 ────────────────────────────────────────────────────────────
    'website_v2.problem': {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            painPoints: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: { emoji: { type: Type.STRING }, text: { type: Type.STRING } },
                    required: ['emoji', 'text'],
                },
            },
            punchline: { type: Type.STRING },
        },
        required: ['painPoints', 'punchline'],
    },
    'website_v2.about': {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            role:  { type: Type.STRING },
            bio:   { type: Type.STRING },
            stats: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: { value: { type: Type.STRING }, label: { type: Type.STRING } },
                    required: ['value', 'label'],
                },
            },
        },
        required: ['bio'],
    },
    'website_v2.features': {
        type: Type.OBJECT,
        properties: {
            title:    { type: Type.STRING },
            subtitle: { type: Type.STRING },
            items: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: { title: { type: Type.STRING }, description: { type: Type.STRING } },
                    required: ['title', 'description'],
                },
            },
            extras: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['items'],
    },
    'website_v2.process': {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            steps: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: { title: { type: Type.STRING }, description: { type: Type.STRING } },
                    required: ['title', 'description'],
                },
            },
            timelineNote: { type: Type.STRING },
        },
        required: ['steps'],
    },
    'website_v2.faq': {
        type: Type.OBJECT,
        properties: {
            items: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: { question: { type: Type.STRING }, answer: { type: Type.STRING } },
                    required: ['question', 'answer'],
                },
            },
        },
        required: ['items'],
    },

    // ── website_v3 ────────────────────────────────────────────────────────────
    'website_v3.needs': {
        type: Type.OBJECT,
        properties: {
            title:          { type: Type.STRING },
            intro:          { type: Type.STRING },
            challengeTitle: { type: Type.STRING },
            challengeItems: { type: Type.ARRAY, items: { type: Type.STRING } },
            responseTitle:  { type: Type.STRING },
            responseItems:  { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['challengeItems', 'responseItems'],
    },
    'website_v3.process': {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            steps: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        label:       { type: Type.STRING },
                        duration:    { type: Type.STRING },
                        description: { type: Type.STRING },
                    },
                    required: ['label', 'duration', 'description'],
                },
            },
            timelineNote: { type: Type.STRING },
        },
        required: ['steps'],
    },
    'website_v3.testimonials': {
        type: Type.OBJECT,
        properties: {
            items: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        quote:    { type: Type.STRING },
                        initials: { type: Type.STRING },
                        name:     { type: Type.STRING },
                        position: { type: Type.STRING },
                    },
                    required: ['quote', 'initials', 'name', 'position'],
                },
            },
        },
        required: ['items'],
    },
    'website_v3.about': {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            bio1:  { type: Type.STRING },
            bio2:  { type: Type.STRING },
            stats: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: { value: { type: Type.STRING }, label: { type: Type.STRING } },
                    required: ['value', 'label'],
                },
            },
        },
        required: ['bio1'],
    },
    'website_v3.terms': {
        type: Type.OBJECT,
        properties: {
            guarantees: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        emoji:       { type: Type.STRING },
                        title:       { type: Type.STRING },
                        description: { type: Type.STRING },
                    },
                    required: ['emoji', 'title', 'description'],
                },
            },
        },
        required: ['guarantees'],
    },

    // ── Contract templates (umowy) ─────────────────────────────────────────────
    'contract_short.subject': {
        type: Type.OBJECT,
        properties: {
            scopeItems: { type: Type.ARRAY, items: { type: Type.STRING } },
            additionalNote: { type: Type.STRING },
        },
        required: ['scopeItems'],
    },
    'contract_services.scope': {
        type: Type.OBJECT,
        properties: {
            items: { type: Type.ARRAY, items: { type: Type.STRING } },
            exclusions: { type: Type.STRING },
        },
        required: ['items'],
    },
    'contract_mobile.scope': {
        type: Type.OBJECT,
        properties: {
            features: { type: Type.ARRAY, items: { type: Type.STRING } },
            exclusions: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['features'],
    },
    'contract_dedicated.phases': {
        type: Type.OBJECT,
        properties: {
            phases: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        description: { type: Type.STRING },
                    },
                    required: ['name', 'description'],
                },
            },
            exclusions: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['phases'],
    },
    'contract_sla.services': {
        type: Type.OBJECT,
        properties: {
            included: { type: Type.ARRAY, items: { type: Type.STRING } },
            excluded: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['included'],
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

// src/services/ai/offer-fill.ts
// Conversational AI that collects project details and generates ProposalBlocks JSON.
// Uses Gemini structured output — model ALWAYS returns { message, isComplete, blocks }.
// On the backend we Zod-validate blocks and apply a non-destructive diff-merge.
import { GoogleGenAI, Type } from '@google/genai'
import { z } from 'zod'
import { config } from '../../config'
import { createModuleLogger } from '../../lib/logger'

const log = createModuleLogger('ai:offer-fill')

export interface OfferFillMessage {
    role: 'user' | 'assistant'
    content: string
}

export interface OfferFillContext {
    clientName: string
    offerTitle: string
    currentBlocks?: Record<string, unknown>
}

export interface OfferFillResult {
    message: string
    blocks: Record<string, unknown> | null
    isComplete: boolean
}

// ── Zod schema for ProposalBlocks validation ──────────────────────────────────
// Lightweight — enough to catch garbage, not exhaustive field-by-field.

const SectionKeySchema = z.enum([
    'intro', 'demo', 'structure', 'scope', 'testing', 'technology', 'pricingExtra', 'about',
])

const ProposalBlocksSchema = z.object({
    version: z.literal(1).optional(),
    page1Sections: z.array(SectionKeySchema).optional(),
    page2Sections: z.array(SectionKeySchema).optional(),
    header: z.object({ enabled: z.boolean(), tag: z.string() }).optional(),
    footer: z.object({ enabled: z.boolean(), customNote: z.string(), showAuthor: z.boolean() }).optional(),
    intro: z.object({ enabled: z.boolean(), paragraphs: z.array(z.string()) }).optional(),
    demo: z.object({ enabled: z.boolean(), title: z.string(), body: z.string() }).partial().optional(),
    structure: z.object({
        enabled: z.boolean(),
        title: z.string(),
        items: z.array(z.object({ icon: z.string(), name: z.string(), description: z.string() })),
    }).optional(),
    scope: z.object({
        enabled: z.boolean(),
        title: z.string(),
        items: z.array(z.object({ html: z.string() })),
    }).optional(),
    testing: z.object({
        enabled: z.boolean(),
        intro: z.string(),
        cards: z.array(z.object({ icon: z.string(), title: z.string(), description: z.string() })),
    }).optional(),
    technology: z.object({ enabled: z.boolean(), body: z.string() }).partial().optional(),
    pricingExtra: z.object({
        enabled: z.boolean(),
        timeline: z.string(),
        timelineSub: z.string(),
        contractType: z.string(),
        contractSub: z.string(),
        priceOverride: z.number().nullable(),
        priceType: z.enum(['net', 'gross']),
    }).partial().optional(),
    about: z.object({
        enabled: z.boolean(),
        ctaText: z.string(),
        aboutBoxTitle: z.string(),
    }).partial().optional(),
}).passthrough()

type ValidatedBlocks = z.infer<typeof ProposalBlocksSchema>

// ── Non-destructive diff-merge ────────────────────────────────────────────────
// Rule: a field from the AI output overwrites the current value ONLY if it is
// "substantive" — non-empty string or non-empty array.  This prevents the model
// from accidentally clearing sections it was not asked to change.

const SECTION_KEYS = ['intro', 'demo', 'structure', 'scope', 'testing', 'technology', 'pricingExtra', 'about'] as const

function isSubstantive(value: unknown): boolean {
    if (Array.isArray(value)) return value.length > 0
    if (typeof value === 'string') return value.trim().length > 0
    if (value === null || value === undefined) return false
    return true
}

function deepMergeSection(
    current: Record<string, unknown>,
    aiSection: Record<string, unknown>,
): Record<string, unknown> {
    const merged: Record<string, unknown> = { ...current }
    for (const [field, value] of Object.entries(aiSection)) {
        if (field === 'enabled') {
            // Always take 'enabled' from AI — it explicitly enables/disables sections.
            merged[field] = value
        } else if (isSubstantive(value)) {
            merged[field] = value
        }
        // If value is empty array / empty string — keep current value unchanged.
    }
    return merged
}

export function diffMergeBlocks(
    current: Record<string, unknown>,
    aiGenerated: ValidatedBlocks,
): Record<string, unknown> {
    const result: Record<string, unknown> = { ...current }

    for (const key of SECTION_KEYS) {
        const aiSection = aiGenerated[key] as Record<string, unknown> | undefined
        const currentSection = current[key] as Record<string, unknown> | undefined
        if (!aiSection) continue
        result[key] = deepMergeSection(currentSection ?? {}, aiSection)
    }

    // page sections: only replace if AI returned non-empty arrays
    if (aiGenerated.page1Sections?.length) result.page1Sections = aiGenerated.page1Sections
    if (aiGenerated.page2Sections?.length) result.page2Sections = aiGenerated.page2Sections
    if (aiGenerated.header) result.header = deepMergeSection(current.header as Record<string, unknown> ?? {}, aiGenerated.header as Record<string, unknown>)
    if (aiGenerated.footer) result.footer = deepMergeSection(current.footer as Record<string, unknown> ?? {}, aiGenerated.footer as Record<string, unknown>)

    return result
}

// ── Gemini responseSchema ─────────────────────────────────────────────────────
// The model always returns { message, isComplete, blocks }.
// When isComplete=false, blocks is null (model is still asking questions).
// When isComplete=true, blocks is the full ProposalBlocks JSON.

const OFFER_FILL_RESPONSE_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        message: {
            type: Type.STRING,
            description: 'The conversational reply shown to the user.',
        },
        isComplete: {
            type: Type.BOOLEAN,
            description: 'true when the full template has been generated and blocks is populated.',
        },
        blocks: {
            type: Type.OBJECT,
            description: 'Full ProposalBlocks JSON when isComplete=true, otherwise absent.',
            nullable: true,
        },
    },
    required: ['message', 'isComplete'],
}

// ── System prompt ─────────────────────────────────────────────────────────────

function buildCurrentBlocksSummary(blocks: Record<string, unknown>): string {
    try {
        const intro = blocks.intro as { enabled?: boolean; paragraphs?: string[] } | undefined
        const scope = blocks.scope as { enabled?: boolean; items?: Array<{ html: string }> } | undefined
        const structure = blocks.structure as { enabled?: boolean; items?: Array<{ icon: string; name: string; description: string }> } | undefined
        const pricing = blocks.pricingExtra as { enabled?: boolean; timeline?: string; priceType?: string } | undefined
        const about = blocks.about as { enabled?: boolean; ctaText?: string } | undefined

        const lines: string[] = ['=== AKTUALNY STAN SZABLONU ===']

        if (intro?.enabled && intro.paragraphs?.length) {
            lines.push(`WSTĘP (${intro.paragraphs.length} akapity):`)
            intro.paragraphs.forEach((p, i) => lines.push(`  [${i + 1}] ${p.slice(0, 200)}`))
        } else {
            lines.push('WSTĘP: wyłączony lub pusty')
        }

        if (structure?.enabled && structure.items?.length) {
            lines.push(`STRUKTURA (${structure.items.length} elementów):`)
            structure.items.forEach(item => lines.push(`  ${item.icon} ${item.name} — ${item.description?.slice(0, 80)}`))
        } else {
            lines.push('STRUKTURA: wyłączona lub pusta')
        }

        if (scope?.enabled && scope.items?.length) {
            lines.push(`ZAKRES (${scope.items.length} pozycji):`)
            scope.items.slice(0, 8).forEach((item, i) => lines.push(`  [${i + 1}] ${item.html?.slice(0, 120)}`))
            if (scope.items.length > 8) lines.push(`  ... i ${scope.items.length - 8} więcej`)
        } else {
            lines.push('ZAKRES: wyłączony lub pusty')
        }

        if (pricing?.enabled) {
            lines.push(`WYCENA: termin="${pricing.timeline}", typ="${pricing.priceType ?? 'gross'}"`)
        }

        if (about?.enabled && about.ctaText) {
            lines.push(`CTA: "${about.ctaText.slice(0, 150)}"`)
        }

        lines.push('=== KONIEC STANU ===')
        return lines.join('\n')
    } catch {
        return ''
    }
}

function buildSystemPrompt(ctx: OfferFillContext): string {
    const hasContent = !!ctx.currentBlocks
    const blocksSummary = hasContent && ctx.currentBlocks
        ? '\n' + buildCurrentBlocksSummary(ctx.currentBlocks) + '\n'
        : ''

    const modeInstructions = hasContent
        ? `Szablon jest już częściowo wypełniony — widzisz jego aktualny stan powyżej.
Możesz modyfikować dowolną sekcję na prośbę użytkownika.
Gdy użytkownik pyta "co jest już wypełnione" — opisz mu aktualny stan z powyższego zestawienia.
Gdy prosi o zmianę — wprowadź zmiany i ustaw isComplete=true z pełnym blokiem JSON.
Gdy prosi o wygenerowanie od zera — wygeneruj kompletny nowy szablon.`
        : `Przeprowadź krótką rozmowę (maksymalnie 3-4 pytania) aby zebrać:
1. Opis branży / działalności klienta
2. Główne podstrony / funkcje serwisu (5-10 elementów)
3. Przybliżony termin realizacji
Gdy masz te informacje — od razu generuj szablon (isComplete=true). Nie pytaj o więcej.`

    return `Jesteś Markiem — doświadczonym copywriterem i handlowcem B2B z 15 latami praktyki w tworzeniu ofert na usługi IT i strony internetowe. Twoje oferty wygrywają przetargi.

KONTEKST:
Klient: "${ctx.clientName}"
Tytuł oferty: "${ctx.offerTitle}"
${blocksSummary}
TRYB PRACY:
${modeInstructions}

ZASADY PISANIA:
- Język korzyści, nie cech ("Twoi klienci znajdą Cię w Google" zamiast "SEO")
- Konkretnie i branżowo — zero ogólników jak "profesjonalna strona"
- Ikony w zakresie dobieraj tematycznie (🏠 nieruchomości, ⚖️ prawnik, 🍕 gastronomia)
- CTA ciepłe ale asertywne — bez "zachęcam", bez "proszę o kontakt"
- Wstęp zaczyna się od empatii wobec potrzeby klienta

ZASADY ROZMOWY:
- Jedno pytanie na raz, krótko i konkretnie
- Jeśli branża jest oczywista z nazwy klienta lub tytułu — zaproponuj ikony bez pytania
- Gdy masz wystarczające informacje — DZIAŁAJ natychmiast, nie pytaj o potwierdzenie
- Gdy użytkownik prosi o zmianę czegoś konkretnego — zrób to od razu
- NIE pytaj o cenę (pobierana z systemu automatycznie)

OCHRONA SEKCJI (KRYTYCZNE):
- Gdy użytkownik prosi o zmianę KONKRETNEJ sekcji, zmieniaj TYLKO tę sekcję.
- Wszystkie pozostałe sekcje przepisz DOKŁADNIE tak jak są w AKTUALNYM STANIE SZABLONU.
- NIGDY nie usuwaj, nie czyść, nie "resetuj" sekcji których użytkownik nie wymienił.
- Jeśli sekcja ma enabled:true w aktualnym stanie — w JSON też musi mieć enabled:true.
- page1Sections i page2Sections: zachowaj DOKŁADNIE tak jak są, chyba że user prosił o reorganizację.

FORMAT ODPOWIEDZI (ZAWSZE):
Zwróć obiekt JSON: { "message": "...", "isComplete": false/true, "blocks": null | { ... } }
- Gdy pytasz o informacje: isComplete=false, blocks=null
- Gdy generujesz/modyfikujesz szablon: isComplete=true, blocks=pełny_JSON_szablonu

SCHEMAT blocks gdy isComplete=true:
{
  "version": 1,
  "page1Sections": ["intro", "structure"],
  "page2Sections": ["scope", "pricingExtra", "about"],
  "header": { "enabled": true, "tag": "Oferta handlowa" },
  "footer": { "enabled": true, "customNote": "indywidualnie", "showAuthor": true },
  "intro": { "enabled": true, "paragraphs": ["Akapit 1.", "Akapit 2."] },
  "demo": { "enabled": false, "title": "", "body": "", "urls": [] },
  "structure": { "enabled": true, "title": "Proponowana struktura strony", "items": [{"icon":"📋","name":"Nazwa","description":"Opis"}], "note": "" },
  "scope": { "enabled": true, "title": "Pełny zakres realizacji", "items": [{"html":"Pozycja zakresu"}] },
  "testing": { "enabled": false, "intro": "", "cards": [] },
  "technology": { "enabled": false, "body": "", "options": [] },
  "pricingExtra": { "enabled": true, "timeline": "X tygodnie", "timelineSub": "od ustalenia szczegółów", "contractType": "Umowa, faktura VAT", "contractSub": "pełna transparentność", "priceOverride": null, "priceType": "gross" },
  "about": { "enabled": true, "ctaText": "2-3 zdania CTA.", "aboutBoxTitle": "Więcej o nas i naszych realizacjach" }
}`
}

// ── Main function ─────────────────────────────────────────────────────────────

// Exported for testing.
export function parseResponse(raw: string): { message: string; blocks: Record<string, unknown> | null } {
    // Legacy fallback: if raw text isn't JSON (e.g. unit tests calling this directly),
    // return it as a plain message. In production, Gemini structured output always returns JSON.
    try {
        const parsed = JSON.parse(raw) as { message?: string; blocks?: unknown }
        return {
            message: typeof parsed.message === 'string' ? parsed.message : raw,
            blocks: parsed.blocks != null && typeof parsed.blocks === 'object' && !Array.isArray(parsed.blocks)
                ? parsed.blocks as Record<string, unknown>
                : null,
        }
    } catch {
        return { message: raw.trim(), blocks: null }
    }
}

export async function offerFillChat(
    ai: GoogleGenAI | null,
    context: OfferFillContext,
    history: OfferFillMessage[],
    userMessage: string,
): Promise<OfferFillResult> {
    if (!ai) {
        return {
            message: '⚠️ AI nie jest skonfigurowane. Dodaj GEMINI_API_KEY.',
            blocks: null,
            isComplete: false,
        }
    }

    try {
        const systemPrompt = buildSystemPrompt(context)

        type GeminiContent = { role: 'user' | 'model'; parts: Array<{ text: string }> }
        const contents: GeminiContent[] = [
            ...history.map((msg): GeminiContent => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }],
            })),
            { role: 'user', parts: [{ text: userMessage }] },
        ]

        const response = await ai.models.generateContent({
            model: config.gemini.model,
            contents,
            config: {
                systemInstruction: systemPrompt,
                temperature: 0.75,
                maxOutputTokens: 8192,
                responseMimeType: 'application/json',
                responseSchema: OFFER_FILL_RESPONSE_SCHEMA,
            },
        })

        const raw = response.text ?? ''
        let parsed: { message?: string; isComplete?: boolean; blocks?: unknown }
        try {
            parsed = JSON.parse(raw) as typeof parsed
        } catch {
            log.warn({ raw: raw.slice(0, 200) }, 'offer-fill: failed to parse structured response')
            return { message: raw || 'Generuję ofertę...', blocks: null, isComplete: false }
        }

        const message = typeof parsed.message === 'string' ? parsed.message : 'Generuję ofertę...'
        const isComplete = parsed.isComplete === true

        let blocks: Record<string, unknown> | null = null

        if (isComplete && parsed.blocks != null && typeof parsed.blocks === 'object' && !Array.isArray(parsed.blocks)) {
            const rawBlocks = parsed.blocks as Record<string, unknown>

            // Validate with Zod — reject garbage before it reaches the DB.
            const validation = ProposalBlocksSchema.safeParse(rawBlocks)
            if (!validation.success) {
                log.warn({ issues: validation.error.issues.slice(0, 5) }, 'offer-fill: blocks failed Zod validation, discarding')
                return { message, blocks: null, isComplete: false }
            }

            // Apply non-destructive diff-merge against current blocks.
            blocks = context.currentBlocks
                ? diffMergeBlocks(context.currentBlocks, validation.data)
                : (validation.data as Record<string, unknown>)
        }

        return { message, blocks, isComplete: blocks !== null }
    } catch (error) {
        log.error({ error }, 'offer-fill chat failed')
        return {
            message: '❌ Błąd komunikacji z AI. Spróbuj ponownie.',
            blocks: null,
            isComplete: false,
        }
    }
}

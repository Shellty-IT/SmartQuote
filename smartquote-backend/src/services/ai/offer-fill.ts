// src/services/ai/offer-fill.ts
// Conversational AI that collects project details and generates ProposalBlocks JSON.
// responseMimeType:'application/json' guarantees parseable JSON; responseSchema is intentionally
// NOT used here — Gemini's structured output flattens nested objects when schema is shallow,
// producing empty blocks. The full schema is described in the system prompt instead; Zod validates.
import { GoogleGenAI } from '@google/genai'
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
    // Language for BOTH the chat reply and the generated template content.
    // Defaults to Polish when omitted.
    language?: 'pl' | 'en'
}

// Cap how much conversation history we forward to Gemini. The validator already
// limits the request to 30 turns, but a long thread inflates token cost and can
// crowd the context window; the last N messages carry the relevant intent.
const MAX_HISTORY_MESSAGES = 20

export interface OfferFillResult {
    message: string
    blocks: Record<string, unknown> | null
    isComplete: boolean
}

// ── Zod schema for ProposalBlocks validation ──────────────────────────────────
// Covers every field that proposal-html.ts reads at runtime. Fields not listed here
// would pass Zod but could silently break rendering if they carry garbage.

const SectionKeySchema = z.enum([
    'intro', 'demo', 'structure', 'scope', 'testing', 'technology', 'pricingExtra', 'about',
    'benefits', 'process', 'stats',
])

// Shared sub-schema — used in demo.urls and technology.options[].urls.
const DemoUrlSchema = z.object({ href: z.string(), label: z.string() })

const ProposalBlocksSchema = z.object({
    version: z.literal(1).optional(),
    page1Sections: z.array(SectionKeySchema).optional(),
    page2Sections: z.array(SectionKeySchema).optional(),
    header: z.object({ enabled: z.boolean(), tag: z.string() }).optional(),
    footer: z.object({ enabled: z.boolean(), customNote: z.string(), showAuthor: z.boolean() }).optional(),
    intro: z.object({ enabled: z.boolean(), paragraphs: z.array(z.string()) }).optional(),
    demo: z.object({
        enabled: z.boolean(),
        title: z.string(),
        body: z.string(),
        // renderDemo() iterates urls, reads warning, reads note — all must be validated.
        urls: z.array(DemoUrlSchema),
        warning: z.string().optional(),
        note: z.string().optional(),
    }).partial().optional(),
    structure: z.object({
        enabled: z.boolean(),
        title: z.string(),
        items: z.array(z.object({ icon: z.string(), name: z.string(), description: z.string() })),
        note: z.string().optional(),   // renderStructure() reads s.note
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
        note: z.string().optional(),   // renderTesting() reads t.note
    }).optional(),
    technology: z.object({
        enabled: z.boolean(),
        body: z.string(),
        // renderTechnology() iterates options and reads note — both were absent before.
        options: z.array(z.object({
            icon: z.string(),
            title: z.string(),
            urls: z.array(DemoUrlSchema),
        })),
        note: z.string().optional(),
    }).partial().optional(),
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
    benefits: z.object({
        enabled: z.boolean(),
        title: z.string(),
        items: z.array(z.object({ icon: z.string(), title: z.string(), description: z.string() })),
    }).partial().optional(),
    process: z.object({
        enabled: z.boolean(),
        title: z.string(),
        steps: z.array(z.object({ title: z.string(), description: z.string() })),
    }).partial().optional(),
    stats: z.object({
        enabled: z.boolean(),
        items: z.array(z.object({ value: z.string(), label: z.string() })),
    }).partial().optional(),
}).passthrough().superRefine((value, ctx) => {
    // Structural integrity of the page layout. SectionKeySchema already restricts the
    // entries to known keys; here we catch the two ways a regeneration corrupts layout:
    // a section listed twice on one page, or the same section placed on both pages
    // (it would render twice). These are cheap, false-positive-free invariants.
    const page1 = Array.isArray(value.page1Sections) ? (value.page1Sections as string[]) : []
    const page2 = Array.isArray(value.page2Sections) ? (value.page2Sections as string[]) : []

    const flagDuplicates = (arr: string[], path: 'page1Sections' | 'page2Sections') => {
        const seen = new Set<string>()
        for (const key of arr) {
            if (seen.has(key)) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Duplicate section "${key}" in ${path}`, path: [path] })
            }
            seen.add(key)
        }
    }
    flagDuplicates(page1, 'page1Sections')
    flagDuplicates(page2, 'page2Sections')

    const onPage2 = new Set(page2)
    for (const key of page1) {
        if (onPage2.has(key)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Section "${key}" appears on both pages`, path: ['page1Sections'] })
        }
    }
})

type ValidatedBlocks = z.infer<typeof ProposalBlocksSchema>

// ── Non-destructive diff-merge ────────────────────────────────────────────────
// Rule: a field from the AI output overwrites the current value ONLY if it is
// "substantive" — non-empty string or non-empty array.  This prevents the model
// from accidentally clearing sections it was not asked to change.

const SECTION_KEYS = ['intro', 'demo', 'structure', 'scope', 'testing', 'technology', 'pricingExtra', 'about', 'benefits', 'process', 'stats'] as const

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
    const currentEnabled = current.enabled === true
    for (const [field, value] of Object.entries(aiSection)) {
        if (field === 'enabled') {
            // Asymmetric: the AI may ENABLE a section (false→true) when it has content for
            // it, but it must NEVER silently DISABLE one (true→false). A hallucinated
            // regeneration that flips `enabled` off would make a populated section vanish
            // from the rendered PDF — the hardest data loss for the user to notice.
            // Disabling stays an explicit user action via the section manager UI.
            merged[field] = currentEnabled ? true : value === true
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

    // If the AI rewrote the page arrays but dropped a section that is still enabled,
    // it would disappear from the layout entirely. Re-attach any such section to the
    // page it previously lived on (page 2 as fallback) so nothing silently vanishes.
    reattachEnabledSections(result, current)

    return result
}

function reattachEnabledSections(
    result: Record<string, unknown>,
    current: Record<string, unknown>,
): void {
    const page1 = Array.isArray(result.page1Sections) ? [...(result.page1Sections as string[])] : []
    const page2 = Array.isArray(result.page2Sections) ? [...(result.page2Sections as string[])] : []
    // No layout is being tracked at all — nothing to reconcile.
    if (page1.length === 0 && page2.length === 0) return

    const placed = new Set<string>([...page1, ...page2])
    const prevPage1 = Array.isArray(current.page1Sections) ? (current.page1Sections as string[]) : []
    let changed = false

    for (const key of SECTION_KEYS) {
        const section = result[key] as Record<string, unknown> | undefined
        if (!section || section.enabled !== true || placed.has(key)) continue
        if (prevPage1.includes(key)) page1.push(key)
        else page2.push(key)
        placed.add(key)
        changed = true
    }

    if (!changed) return
    if (page1.length || Array.isArray(result.page1Sections)) result.page1Sections = page1
    if (page2.length || Array.isArray(result.page2Sections)) result.page2Sections = page2
}

// ── System prompt ─────────────────────────────────────────────────────────────

// Reports the enabled-state of EVERY section plus a short content indicator.
// This is critical for section protection: the model regenerates the full blocks
// JSON on every edit and always reports `enabled` back. If it cannot see which
// sections are currently enabled, it guesses (usually `false` from the schema
// defaults) and silently disables sections the user never touched.
function describeSectionState(section: unknown): { enabled: boolean; filled: boolean } {
    if (!section || typeof section !== 'object') return { enabled: false, filled: false }
    const s = section as Record<string, unknown>
    const enabled = s.enabled === true
    // "filled" = any array/string field carries substantive content.
    const filled = Object.entries(s).some(([k, v]) => k !== 'enabled' && isSubstantive(v))
    return { enabled, filled }
}

function buildCurrentBlocksSummary(blocks: Record<string, unknown>): string {
    try {
        const intro = blocks.intro as { enabled?: boolean; paragraphs?: string[] } | undefined
        const scope = blocks.scope as { enabled?: boolean; items?: Array<{ html: string }> } | undefined
        const structure = blocks.structure as { enabled?: boolean; items?: Array<{ icon: string; name: string; description: string }> } | undefined
        const pricing = blocks.pricingExtra as { enabled?: boolean; timeline?: string; priceType?: string } | undefined
        const about = blocks.about as { enabled?: boolean; ctaText?: string } | undefined

        const lines: string[] = ['=== AKTUALNY STAN SZABLONU ===']

        // Layout — which sections sit on which page, and in what order.
        const page1 = Array.isArray(blocks.page1Sections) ? (blocks.page1Sections as string[]) : []
        const page2 = Array.isArray(blocks.page2Sections) ? (blocks.page2Sections as string[]) : []
        if (page1.length || page2.length) {
            lines.push(`UKŁAD STRON: strona 1 = [${page1.join(', ')}]; strona 2 = [${page2.join(', ')}]`)
        }

        // Per-section on/off map for ALL sections — so the model can preserve enabled flags.
        const statusMap = SECTION_KEYS.map(key => {
            const { enabled, filled } = describeSectionState(blocks[key])
            const mark = enabled ? (filled ? 'WŁ.' : 'wł. (pusta)') : 'wył.'
            return `${key}=${mark}`
        }).join(', ')
        lines.push(`SEKCJE (enabled): ${statusMap}`)
        lines.push('⚠️ Zachowaj powyższe flagi enabled DOKŁADNIE, chyba że użytkownik prosi o ich zmianę.')

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
Gdy prosi o zmianę — od razu wprowadź zmiany i ustaw isComplete=true z pełnym blokiem JSON. NIE pytaj o potwierdzenie.
Gdy prosi o wygenerowanie od zera — wygeneruj kompletny nowy szablon.
AKTYWOWANIE SEKCJI: jeśli treść tego wymaga (np. masz info o technologiach, testach, demo), ustaw enabled:true w tych sekcjach.`
        : `Jeśli użytkownik podał wystarczające informacje w swojej wiadomości (branża, zakres, opis projektu) — NATYCHMIAST generuj szablon (isComplete=true). NIE pytaj o potwierdzenie.
Jeśli informacje są niewystarczające, zadaj JEDNO konkretne pytanie:
1. Opis branży / działalności klienta i zakres zlecenia
Po otrzymaniu opisu — od razu generuj szablon. Nie pytaj o więcej.
AKTYWOWANIE SEKCJI: aktywuj wszystkie sekcje (enabled:true) dla których masz treść. Możesz aktywować testing, technology, demo jeśli informacje na to pozwalają.`

    const language = ctx.language === 'en' ? 'en' : 'pl'
    const languageInstruction = language === 'en'
        ? `JĘZYK (KRYTYCZNE): Pisz WSZYSTKO po ANGIELSKU — zarówno wiadomości czatu, jak i CAŁĄ treść szablonu (intro, scope, CTA, tytuły sekcji itd.) — niezależnie od języka nazwy klienta, tytułu oferty czy aktualnych danych.`
        : `JĘZYK (KRYTYCZNE): Pisz WSZYSTKO po POLSKU — zarówno wiadomości czatu, jak i całą treść szablonu — niezależnie od języka danych wejściowych.`

    return `Jesteś Markiem — doświadczonym copywriterem i handlowcem B2B z 15 latami praktyki w tworzeniu ofert na usługi IT i strony internetowe. Twoje oferty wygrywają przetargi.

${languageInstruction}

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
- WSTĘP (intro): 2–3 krótkie akapity. Pierwszy zaczyna się od empatii wobec potrzeby klienta i ma 1 emoji pasujące do branży na początku (👋/🚀/🏗️). W którymś akapicie wyróżnij JEDNĄ kluczową korzyść tagiem <strong>...</strong>. Możesz wpleść 1–2 dodatkowe emoji. Zwróć każdy akapit jako osobny element tablicy paragraphs.

ZASADY ROZMOWY:
- Jedno pytanie na raz, krótko i konkretnie
- Jeśli branża jest oczywista z nazwy klienta lub tytułu — zaproponuj ikony bez pytania
- Gdy masz wystarczające informacje — DZIAŁAJ natychmiast, nie pytaj o potwierdzenie
- Gdy użytkownik prosi o zmianę czegoś konkretnego — zrób to od razu
- NIE pytaj o cenę (pobierana z systemu automatycznie)
- Gdy użytkownik przesyła gotowy brief/opis projektu — traktuj go jako kompletne dane i NATYCHMIAST generuj (isComplete=true)

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
  "intro": { "enabled": true, "paragraphs": ["👋 Akapit powitalny z empatią wobec potrzeby.", "Akapit z korzyściami, w którym <strong>kluczowa korzyść</strong> jest wyróżniona."] },
  "demo": { "enabled": false, "title": "", "body": "", "urls": [] },
  "structure": { "enabled": true, "title": "Proponowana struktura strony", "items": [{"icon":"📋","name":"Nazwa","description":"Opis"}], "note": "" },
  "scope": { "enabled": true, "title": "Pełny zakres realizacji", "items": [{"html":"Pozycja zakresu"}] },
  "testing": { "enabled": false, "intro": "", "cards": [] },
  "technology": { "enabled": false, "body": "", "options": [] },
  "pricingExtra": { "enabled": true, "timeline": "X tygodnie", "timelineSub": "od ustalenia szczegółów", "contractType": "Umowa, faktura VAT", "contractSub": "pełna transparentność", "priceOverride": null, "priceType": "gross" },
  "about": { "enabled": true, "ctaText": "2-3 zdania CTA.", "aboutBoxTitle": "Więcej o nas i naszych realizacjach" },
  "benefits": { "enabled": false, "title": "Dlaczego warto nam zaufać", "items": [{"icon":"⚡","title":"Korzyść","description":"Krótki opis"}] },
  "process": { "enabled": false, "title": "Jak przebiega współpraca", "steps": [{"title":"Krok","description":"Opis kroku"}] },
  "stats": { "enabled": false, "items": [{"value":"50+","label":"realizacji"}] }
}

DODATKOWE SEKCJE (opcjonalne — domyślnie enabled:false): "benefits" (karty korzyści), "process" (etapy współpracy 3-4 kroki), "stats" (pasek liczb budujących zaufanie). Możesz je AKTYWOWAĆ (enabled:true) i dodać do page1Sections/page2Sections, gdy wzbogacą ofertę.`
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

        // Keep only the most recent turns — bounds token cost and context-window pressure
        // on long threads. The current blocks state is carried separately in the system
        // prompt, so older chatter is safe to drop.
        const recentHistory = history.length > MAX_HISTORY_MESSAGES
            ? history.slice(-MAX_HISTORY_MESSAGES)
            : history

        type GeminiContent = { role: 'user' | 'model'; parts: Array<{ text: string }> }
        const contents: GeminiContent[] = [
            ...recentHistory.map((msg): GeminiContent => ({
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
                // A full proposal (all sections enabled) plus the chat message can approach
                // the old 8192 cap; truncation produces invalid JSON and a silent no-blocks
                // result. gemini-2.5-flash supports far more, so give generous headroom.
                maxOutputTokens: 16384,
                responseMimeType: 'application/json',
                // No responseSchema — structured schema for nested blocks causes Gemini to emit
                // empty objects. JSON mode + Zod validation in this function is sufficient.
            },
        })

        const raw = response.text ?? ''
        let parsed: { message?: string; isComplete?: boolean; blocks?: unknown }
        try {
            parsed = JSON.parse(raw) as typeof parsed
        } catch {
            log.warn({ raw: raw.slice(0, 200), len: raw.length }, 'offer-fill: failed to parse structured response')
            // Truncated/garbled JSON — never surface raw JSON to the user.
            const looksLikeJson = raw.trimStart().startsWith('{')
            return {
                message: looksLikeJson || !raw.trim()
                    ? 'Odpowiedź była zbyt długa lub niekompletna. Spróbuj ponownie — np. poproś o zmianę pojedynczej sekcji.'
                    : raw,
                blocks: null,
                isComplete: false,
            }
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

        if (blocks !== null && context.currentBlocks) {
            // Guard: if diff-merge produced no real changes, treat as incomplete so the user
            // doesn't see a silent no-op when clicking "Apply".
            const hasChanges = JSON.stringify(blocks) !== JSON.stringify(context.currentBlocks)
            if (!hasChanges) {
                log.warn('offer-fill: diff-merge produced no changes, returning isComplete=false')
                return {
                    message: 'Nie wykryłem zmian w stosunku do aktualnego szablonu. Spróbuj doprecyzować, co chcesz zmienić lub opisz projekt bardziej szczegółowo.',
                    blocks: null,
                    isComplete: false,
                }
            }
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

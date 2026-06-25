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
    templateType?: string
    entityType?: 'offer' | 'contract'
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
    header: z.object({ enabled: z.boolean(), tag: z.string() }).partial().optional(),
    footer: z.object({ enabled: z.boolean(), customNote: z.string(), showAuthor: z.boolean() }).partial().optional(),
    intro: z.object({ enabled: z.boolean(), paragraphs: z.array(z.string()) }).partial().optional(),
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
    }).partial().optional(),
    scope: z.object({
        enabled: z.boolean(),
        title: z.string(),
        items: z.array(z.object({ html: z.string() })),
    }).partial().optional(),
    testing: z.object({
        enabled: z.boolean(),
        intro: z.string(),
        cards: z.array(z.object({ icon: z.string(), title: z.string(), description: z.string() })),
        note: z.string().optional(),   // renderTesting() reads t.note
    }).partial().optional(),
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

const NO_APPLICABLE_BLOCKS_MESSAGE = 'Nie udało mi się przygotować poprawnych danych do zastosowania. Spróbuj ponownie lub poproś o wypełnienie jednej konkretnej sekcji.'

export function completionMessageWithoutBlocks(message: string): string {
    return /(?:wypełni|uzupełni|zaktualiz|gotow|fill|updated|complete)/i.test(message)
        ? NO_APPLICABLE_BLOCKS_MESSAGE
        : message
}

function isProposalTemplate(ctx: OfferFillContext): boolean {
    return (ctx.entityType ?? 'offer') === 'offer' && (!ctx.templateType || ctx.templateType === 'proposal')
}

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

export function mergeProposalPatch(
    current: Record<string, unknown> | undefined,
    rawPatch: unknown,
): Record<string, unknown> | null {
    const validation = ProposalBlocksSchema.safeParse(rawPatch)
    if (!validation.success) return null
    return current
        ? diffMergeBlocks(current, validation.data)
        : validation.data as Record<string, unknown>
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
function deepMergeGeneric(current: unknown, generated: unknown): unknown {
    if (Array.isArray(current)) {
        return Array.isArray(generated) && generated.length > 0 ? generated : current
    }
    if (current && typeof current === 'object') {
        if (!generated || typeof generated !== 'object' || Array.isArray(generated)) return current
        const currentObj = current as Record<string, unknown>
        const generatedObj = generated as Record<string, unknown>
        const merged: Record<string, unknown> = { ...currentObj }
        for (const key of Object.keys(currentObj)) {
            if (Object.prototype.hasOwnProperty.call(generatedObj, key)) {
                merged[key] = deepMergeGeneric(currentObj[key], generatedObj[key])
            }
        }
        return merged
    }
    if (typeof current === 'string') {
        return typeof generated === 'string' && generated.trim().length > 0 ? generated : current
    }
    if (typeof current === 'number') {
        return typeof generated === 'number' && Number.isFinite(generated) ? generated : current
    }
    if (typeof current === 'boolean') {
        return typeof generated === 'boolean' ? generated : current
    }
    if (current === null) {
        if (generated === null || generated === undefined) return current
        if (typeof generated === 'string' && generated.trim().length === 0) return current
        return generated
    }
    return generated ?? current
}

function mergeGenericBlocks(
    current: Record<string, unknown>,
    generated: Record<string, unknown>,
): Record<string, unknown> {
    const merged = deepMergeGeneric(current, generated)
    return merged && typeof merged === 'object' && !Array.isArray(merged)
        ? merged as Record<string, unknown>
        : current
}

async function genericOfferFillChat(
    ai: GoogleGenAI,
    context: OfferFillContext,
    history: OfferFillMessage[],
    userMessage: string,
): Promise<OfferFillResult> {
    const currentBlocks = context.currentBlocks
    if (!currentBlocks || Object.keys(currentBlocks).length === 0) {
        return {
            message: 'Nie mam aktualnej struktury szablonu do wypelnienia. Odswiez edytor i sproboj ponownie.',
            blocks: null,
            isComplete: false,
        }
    }

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
            systemInstruction: buildGenericSystemPrompt(context),
            temperature: 0.65,
            maxOutputTokens: 24576,
            responseMimeType: 'application/json',
        },
    })

    const raw = response.text ?? ''
    let parsed: { message?: string; isComplete?: boolean; blocks?: unknown }
    try {
        parsed = JSON.parse(raw) as typeof parsed
    } catch {
        log.warn({ raw: raw.slice(0, 200), len: raw.length }, 'offer-fill generic: failed to parse structured response')
        return {
            message: 'Odpowiedz AI byla niekompletna. Sprobuj ponownie albo podaj krotszy opis projektu.',
            blocks: null,
            isComplete: false,
        }
    }

    const message = typeof parsed.message === 'string' ? parsed.message : 'Wypelnilem szablon.'
    if (parsed.isComplete !== true || !parsed.blocks || typeof parsed.blocks !== 'object' || Array.isArray(parsed.blocks)) {
        return { message: completionMessageWithoutBlocks(message), blocks: null, isComplete: false }
    }

    const blocks = mergeGenericBlocks(currentBlocks, parsed.blocks as Record<string, unknown>)
    const hasChanges = JSON.stringify(blocks) !== JSON.stringify(currentBlocks)
    if (!hasChanges) {
        return {
            message: 'Nie wykrylem zmian w szablonie. Doprecyzuj prosze, jaki projekt lub dokument mam opisac.',
            blocks: null,
            isComplete: false,
        }
    }

    return { message, blocks, isComplete: true }
}

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

function buildGenericBlocksSummary(blocks: Record<string, unknown>): string {
    const lines: string[] = ['=== AKTUALNY STAN BLOKOW ===']
    const sections = Array.isArray(blocks.sections) ? (blocks.sections as string[]) : []
    const page1 = Array.isArray(blocks.page1Sections) ? (blocks.page1Sections as string[]) : []
    const page2 = Array.isArray(blocks.page2Sections) ? (blocks.page2Sections as string[]) : []
    if (sections.length) lines.push(`SEKCJE: [${sections.join(', ')}]`)
    if (page1.length || page2.length) lines.push(`UKLAD: page1=[${page1.join(', ')}], page2=[${page2.join(', ')}]`)

    const blockKeys = Object.keys(blocks).filter((key) => {
        const value = blocks[key]
        return value && typeof value === 'object' && !Array.isArray(value)
    })
    if (blockKeys.length) lines.push(`BLOKI: ${blockKeys.join(', ')}`)

    for (const key of blockKeys) {
        const block = blocks[key] as Record<string, unknown>
        const enabled = typeof block.enabled === 'boolean' ? `enabled=${block.enabled}` : ''
        const textFields = Object.entries(block)
            .filter(([, value]) => typeof value === 'string' && value.trim())
            .slice(0, 4)
            .map(([field, value]) => `${field}="${String(value).slice(0, 80)}"`)
        const arrays = Object.entries(block)
            .filter(([, value]) => Array.isArray(value))
            .slice(0, 4)
            .map(([field, value]) => `${field}[${(value as unknown[]).length}]`)
        const summary = [enabled, ...textFields, ...arrays].filter(Boolean).join('; ')
        if (summary) lines.push(`${key}: ${summary}`)
    }

    lines.push('=== KONIEC STANU ===')
    return lines.join('\n')
}

function buildGenericSystemPrompt(ctx: OfferFillContext): string {
    const language = ctx.language === 'en' ? 'en' : 'pl'
    const languageInstruction = language === 'en'
        ? 'Write every chat message and every generated template text in English.'
        : 'Pisz wszystkie wiadomosci czatu i cala tresc szablonu po polsku.'

    const entityLabel = ctx.entityType === 'contract' ? 'umowy' : 'oferty'
    const templateType = ctx.templateType ?? 'proposal'
    const currentBlocks = ctx.currentBlocks ?? {}
    const currentBlocksJson = JSON.stringify(currentBlocks, null, 2)
    const clippedBlocksJson = currentBlocksJson.length > 45000
        ? `${currentBlocksJson.slice(0, 45000)}\n... [JSON skrocony, zachowaj widoczna strukture i aktualne wartosci]`
        : currentBlocksJson

    return `Jestes doswiadczonym copywriterem B2B i specjalista od dokumentow handlowych IT. Pomagasz wypelniac szablon ${entityLabel} w aplikacji SmartQuote.

${languageInstruction}

KONTEKST:
Klient: "${ctx.clientName}"
Tytul: "${ctx.offerTitle}"
Typ dokumentu: ${entityLabel}
Typ szablonu: ${templateType}

${buildGenericBlocksSummary(currentBlocks)}

AKTUALNY JSON BLOKOW JEST JEDNOCZESNIE SCHEMATEM WYJSCIA:
${clippedBlocksJson}

TRYB PRACY:
- Jezeli uzytkownik podal wystarczajacy opis projektu, branzy, uslugi lub oczekiwanej umowy, natychmiast wypelnij caly szablon.
- Jezeli brakuje podstawowego kontekstu, zadaj jedno krotkie pytanie i ustaw isComplete=false.
- Jezeli uzytkownik prosi o zmiane konkretnej sekcji, zmien tylko te sekcje i zachowaj reszte.
- Jezeli uzytkownik prosi o wypelnienie od zera lub automatycznie, wypelnij wszystkie pola tekstowe we wszystkich blokach, ktore maja sens biznesowy.

ZASADY STRUKTURY JSON:
- Zwracaj dokladnie obiekt JSON: { "message": string, "isComplete": boolean, "blocks": null | object }.
- Gdy isComplete=true, "blocks" ma zawierac tylko zmienione bloki jako czesciowy patch w tej samej strukturze co AKTUALNY JSON BLOKOW.
- Nie kopiuj niezmienionych blokow. sections/page arrays zwracaj tylko, gdy uzytkownik prosi o zmiane ukladu.
- Zachowaj typy pol: string zostaje stringiem, number numberem, boolean booleanem, array arrayem, object objectem.
- Nie dodawaj markdowna, komentarzy ani tekstu poza JSON.
- Nie usuwaj pol. Nie zamieniaj obiektow na tekst.
- Zachowaj kontrolne pola techniczne i URL-e, chyba ze user wyraznie prosi o zmiane.
- NIGDY nie wymyslaj adresow URL obrazkow ani plikow (pola typu imageUrl, image, photoUrl, src, avatar, logo). Jezeli nie masz prawdziwego adresu podanego przez uzytkownika, zostaw takie pole jako pusty string "" lub zachowaj aktualna wartosc. Zmyslone adresy (np. https://example.com/...jpg) daja zepsute obrazki.
- Pola cenowe i kwoty dostosuj tylko tekstowo do kontekstu; priceOverride zostaw null, chyba ze user podal konkretna cene.
- Dla list generuj kompletne, konkretne pozycje zamiast pustych placeholderow.
- Dla umow zachowaj formalny, precyzyjny jezyk prawniczo-biznesowy, bez przesadnego marketingu.
- Dla ofert uzywaj jezyka korzysci, konkretow branzowych i naturalnego tonu.

ODPOWIEDZ ZAWSZE W JSON.`
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
Gdy prosi o zmianę — od razu wprowadź zmiany i ustaw isComplete=true z częściowym patchem JSON. NIE pytaj o potwierdzenie.
Gdy prosi o wygenerowanie od zera — wygeneruj patch wszystkich sekcji, które wypełniasz.
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
- Pozostałe sekcje pomiń w patchu. Aplikacja zachowa je bez zmian.
- NIGDY nie usuwaj, nie czyść, nie "resetuj" sekcji których użytkownik nie wymienił.
- Jeśli sekcja ma enabled:true w aktualnym stanie — w JSON też musi mieć enabled:true.
- page1Sections i page2Sections: pomiń, chyba że user prosił o reorganizację.

FORMAT ODPOWIEDZI (ZAWSZE):
Zwróć obiekt JSON: { "message": "...", "isComplete": false/true, "blocks": null | { ... } }
- Gdy pytasz o informacje: isComplete=false, blocks=null
- Gdy generujesz/modyfikujesz szablon: isComplete=true, blocks=częściowy_patch zawierający tylko zmieniane sekcje
- NIGDY nie pisz, że szablon został wypełniony, jeśli isComplete=false lub blocks=null

PRZYKŁADOWY SCHEMAT patcha blocks gdy isComplete=true (zwróć tylko potrzebne klucze):
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
        if (!isProposalTemplate(context)) {
            return await genericOfferFillChat(ai, context, history, userMessage)
        }

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
            blocks = mergeProposalPatch(context.currentBlocks, parsed.blocks)
            if (!blocks) {
                log.warn('offer-fill: blocks failed validation, discarding')
                return { message: NO_APPLICABLE_BLOCKS_MESSAGE, blocks: null, isComplete: false }
            }
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

        return {
            message: blocks === null ? completionMessageWithoutBlocks(message) : message,
            blocks,
            isComplete: blocks !== null,
        }
    } catch (error) {
        log.error({
            error: error instanceof Error
                ? { name: error.name, message: error.message, stack: error.stack }
                : String(error),
        }, 'offer-fill chat failed')
        return {
            message: '❌ Błąd komunikacji z AI. Spróbuj ponownie.',
            blocks: null,
            isComplete: false,
        }
    }
}

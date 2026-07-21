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

const SECTION_KEY_VALUES = [
    'intro', 'demo', 'structure', 'scope', 'testing', 'technology', 'pricingExtra', 'about',
    'benefits', 'process', 'stats',
] as const

const SectionKeySchema = z.enum(SECTION_KEY_VALUES)

const StringFromPrimitiveSchema = z.preprocess((value) => {
    if (typeof value === 'number' || typeof value === 'boolean') return String(value)
    return value
}, z.string())

const BooleanFromPrimitiveSchema = z.preprocess((value) => {
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase()
        if (['true', 'tak', 'yes', '1', 'enabled', 'wlaczone', 'włączone'].includes(normalized)) return true
        if (['false', 'nie', 'no', '0', 'disabled', 'wylaczone', 'wyłączone'].includes(normalized)) return false
    }
    return value
}, z.boolean())

const PriceOverrideSchema = z.preprocess((value) => {
    if (value === '' || value === undefined) return null
    if (typeof value === 'string') {
        const trimmed = value.trim().toLowerCase()
        if (!trimmed || ['null', 'none', 'brak'].includes(trimmed)) return null
        const match = trimmed.replace(/\s/g, '').match(/-?\d+(?:[,.]\d+)?/)
        if (match) return Number(match[0].replace(',', '.'))
    }
    return value
}, z.number().finite().nullable())

const PriceTypeSchema = z.preprocess((value) => {
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase()
        if (['gross', 'brutto'].includes(normalized)) return 'gross'
        if (['net', 'netto'].includes(normalized)) return 'net'
    }
    return value
}, z.enum(['net', 'gross']))

// Shared sub-schema — used in demo.urls and technology.options[].urls.
const DemoUrlSchema = z.object({ href: StringFromPrimitiveSchema, label: StringFromPrimitiveSchema })

const ProposalBlocksSchema = z.object({
    version: z.preprocess((value) => value === '1' ? 1 : value, z.literal(1)).optional(),
    page1Sections: z.array(SectionKeySchema).optional(),
    page2Sections: z.array(SectionKeySchema).optional(),
    header: z.object({ enabled: BooleanFromPrimitiveSchema, tag: StringFromPrimitiveSchema, titleOverride: StringFromPrimitiveSchema, clientLabelOverride: StringFromPrimitiveSchema }).partial().optional(),
    footer: z.object({ enabled: BooleanFromPrimitiveSchema, customNote: StringFromPrimitiveSchema, showAuthor: BooleanFromPrimitiveSchema }).partial().optional(),
    intro: z.object({ enabled: BooleanFromPrimitiveSchema, paragraphs: z.array(StringFromPrimitiveSchema) }).partial().optional(),
    demo: z.object({
        enabled: BooleanFromPrimitiveSchema,
        title: StringFromPrimitiveSchema,
        body: StringFromPrimitiveSchema,
        // renderDemo() iterates urls, reads warning, reads note — all must be validated.
        urls: z.array(DemoUrlSchema),
        warning: StringFromPrimitiveSchema.optional(),
        note: StringFromPrimitiveSchema.optional(),
    }).partial().optional(),
    structure: z.object({
        enabled: BooleanFromPrimitiveSchema,
        title: StringFromPrimitiveSchema,
        items: z.array(z.object({ icon: StringFromPrimitiveSchema, name: StringFromPrimitiveSchema, description: StringFromPrimitiveSchema })),
        note: StringFromPrimitiveSchema.optional(),   // renderStructure() reads s.note
    }).partial().optional(),
    scope: z.object({
        enabled: BooleanFromPrimitiveSchema,
        title: StringFromPrimitiveSchema,
        items: z.array(z.object({ html: StringFromPrimitiveSchema })),
    }).partial().optional(),
    testing: z.object({
        enabled: BooleanFromPrimitiveSchema,
        intro: StringFromPrimitiveSchema,
        cards: z.array(z.object({ icon: StringFromPrimitiveSchema, title: StringFromPrimitiveSchema, description: StringFromPrimitiveSchema })),
        note: StringFromPrimitiveSchema.optional(),   // renderTesting() reads t.note
    }).partial().optional(),
    technology: z.object({
        enabled: BooleanFromPrimitiveSchema,
        body: StringFromPrimitiveSchema,
        // renderTechnology() iterates options and reads note — both were absent before.
        options: z.array(z.object({
            icon: StringFromPrimitiveSchema,
            title: StringFromPrimitiveSchema,
            urls: z.array(DemoUrlSchema),
        })),
        note: StringFromPrimitiveSchema.optional(),
    }).partial().optional(),
    pricingExtra: z.object({
        enabled: BooleanFromPrimitiveSchema,
        timeline: StringFromPrimitiveSchema,
        timelineSub: StringFromPrimitiveSchema,
        contractType: StringFromPrimitiveSchema,
        contractSub: StringFromPrimitiveSchema,
        priceOverride: PriceOverrideSchema,
        priceType: PriceTypeSchema,
    }).partial().optional(),
    about: z.object({
        enabled: BooleanFromPrimitiveSchema,
        ctaText: StringFromPrimitiveSchema,
        aboutBoxTitle: StringFromPrimitiveSchema,
    }).partial().optional(),
    benefits: z.object({
        enabled: BooleanFromPrimitiveSchema,
        title: StringFromPrimitiveSchema,
        items: z.array(z.object({ icon: StringFromPrimitiveSchema, title: StringFromPrimitiveSchema, description: StringFromPrimitiveSchema })),
    }).partial().optional(),
    process: z.object({
        enabled: BooleanFromPrimitiveSchema,
        title: StringFromPrimitiveSchema,
        steps: z.array(z.object({ title: StringFromPrimitiveSchema, description: StringFromPrimitiveSchema })),
    }).partial().optional(),
    stats: z.object({
        enabled: BooleanFromPrimitiveSchema,
        items: z.array(z.object({ value: StringFromPrimitiveSchema, label: StringFromPrimitiveSchema })),
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

// Catches every phrasing seen in practice where the model claims to have made a
// change ("Dodałem...", "Wpisałem...", "Ustawiłem...") without actually setting
// isComplete+blocks — a claim like that reaching the user unmodified is worse
// than no reply at all, since they will look for content that was never applied.
export function completionMessageWithoutBlocks(message: string): string {
    // Additions use full past-tense endings ("dodał", not the truncated "doda")
    // specifically so they don't also match the infinitive/question form of the
    // same verb ("dodać") — an earlier draft matched "zmieni" against both
    // "zmienił" (claim) and "zmienić" (a genuine clarifying question), which
    // would have wrongly overwritten real questions with the fallback message.
    return /(?:wypełni|uzupełni|zaktualiz|gotow|dodał|wpisał|ustawił|zmienił|poprawił|stworzył|utworzył|wygenerował|zapisał|fill|updated|complete|added|created|saved)/i.test(message)
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

const SECTION_KEYS = SECTION_KEY_VALUES

const SECTION_KEY_ALIASES: Record<string, typeof SECTION_KEYS[number]> = {
    pricing: 'pricingExtra',
    price: 'pricingExtra',
    wycena: 'pricingExtra',
    cena: 'pricingExtra',
    zakres: 'scope',
    struktura: 'structure',
    demourls: 'demo',
    technologia: 'technology',
    technologie: 'technology',
    testy: 'testing',
    korzysci: 'benefits',
    'korzyści': 'benefits',
    proces: 'process',
    statystyki: 'stats',
    kontakt: 'about',
    cta: 'about',
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === 'object' && !Array.isArray(value)
}

function normalizeSectionKey(value: unknown): typeof SECTION_KEYS[number] | null {
    if (typeof value !== 'string') return null
    const direct = SECTION_KEYS.find(key => key === value)
    if (direct) return direct
    const normalized = value
        .trim()
        .replace(/\s+/g, '')
        .replace(/[-_]/g, '')
        .toLowerCase()
    const byNormalized = SECTION_KEYS.find(key => key.toLowerCase() === normalized)
    if (byNormalized) return byNormalized
    return SECTION_KEY_ALIASES[normalized] ?? null
}

function normalizeSectionList(value: unknown): unknown {
    if (!Array.isArray(value)) return value
    const result: Array<typeof SECTION_KEYS[number]> = []
    for (const rawKey of value) {
        const key = normalizeSectionKey(rawKey)
        if (key && !result.includes(key)) result.push(key)
    }
    return result
}

function normalizeDemoUrl(value: unknown): unknown {
    if (typeof value === 'string') return { href: value, label: value.replace(/^https?:\/\//, '') || 'link' }
    if (!isRecord(value)) return value
    const href = value.href ?? value.url ?? value.link
    const label = value.label ?? value.title ?? value.name ?? (typeof href === 'string' ? href.replace(/^https?:\/\//, '') : undefined)
    return { ...value, ...(href !== undefined ? { href } : {}), ...(label !== undefined ? { label } : {}) }
}

function normalizeItemArray(value: unknown, mapper: (item: unknown) => unknown): unknown {
    return Array.isArray(value) ? value.map(mapper) : value
}

function normalizeProposalSection(key: string, section: unknown): unknown {
    if (!isRecord(section)) return section
    const normalized: Record<string, unknown> = { ...section }

    if (key === 'demo') {
        normalized.urls = normalizeItemArray(normalized.urls, normalizeDemoUrl)
    }

    if (key === 'structure') {
        normalized.items = normalizeItemArray(normalized.items, (item) => {
            if (typeof item === 'string') return { icon: '', name: item, description: item }
            if (!isRecord(item)) return item
            const name = item.name ?? item.title ?? item.label
            const description = item.description ?? item.desc ?? item.body ?? item.text ?? name
            return { ...item, icon: item.icon ?? '', ...(name !== undefined ? { name } : {}), ...(description !== undefined ? { description } : {}) }
        })
    }

    if (key === 'scope') {
        normalized.items = normalizeItemArray(normalized.items, (item) => {
            if (typeof item === 'string') return { html: item }
            if (!isRecord(item)) return item
            const html = item.html ?? item.text ?? item.description ?? item.title
            return { ...item, ...(html !== undefined ? { html } : {}) }
        })
    }

    if (key === 'testing' || key === 'benefits') {
        const arrayKey = key === 'testing' ? 'cards' : 'items'
        normalized[arrayKey] = normalizeItemArray(normalized[arrayKey], (item) => {
            if (typeof item === 'string') return { icon: '', title: item, description: item }
            if (!isRecord(item)) return item
            const title = item.title ?? item.name ?? item.label
            const description = item.description ?? item.desc ?? item.body ?? item.text ?? title
            return { ...item, icon: item.icon ?? '', ...(title !== undefined ? { title } : {}), ...(description !== undefined ? { description } : {}) }
        })
    }

    if (key === 'technology') {
        normalized.options = normalizeItemArray(normalized.options, (item) => {
            if (typeof item === 'string') return { icon: '', title: item, urls: [] }
            if (!isRecord(item)) return item
            const title = item.title ?? item.name ?? item.label
            const urls = Array.isArray(item.urls) ? item.urls.map(normalizeDemoUrl) : []
            return { ...item, icon: item.icon ?? '', urls, ...(title !== undefined ? { title } : {}) }
        })
    }

    if (key === 'process') {
        normalized.steps = normalizeItemArray(normalized.steps, (item) => {
            if (typeof item === 'string') return { title: item, description: item }
            if (!isRecord(item)) return item
            const title = item.title ?? item.name ?? item.label
            const description = item.description ?? item.desc ?? item.body ?? item.text ?? title
            return { ...item, ...(title !== undefined ? { title } : {}), ...(description !== undefined ? { description } : {}) }
        })
    }

    if (key === 'stats') {
        normalized.items = normalizeItemArray(normalized.items, (item) => {
            if (typeof item === 'string') return { value: item, label: item }
            if (!isRecord(item)) return item
            const value = item.value ?? item.number ?? item.amount
            const label = item.label ?? item.title ?? item.name ?? item.description
            return { ...item, ...(value !== undefined ? { value } : {}), ...(label !== undefined ? { label } : {}) }
        })
    }

    return normalized
}

function normalizeProposalPatch(rawPatch: unknown): Record<string, unknown> | null {
    if (!isRecord(rawPatch)) return null
    const normalized: Record<string, unknown> = { ...rawPatch }

    if ('sections' in normalized && !('page1Sections' in normalized) && !('page2Sections' in normalized)) {
        normalized.page2Sections = normalized.sections
    }

    if ('page1Sections' in normalized) normalized.page1Sections = normalizeSectionList(normalized.page1Sections)
    if ('page2Sections' in normalized) normalized.page2Sections = normalizeSectionList(normalized.page2Sections)
    if (Array.isArray(normalized.page1Sections) && Array.isArray(normalized.page2Sections)) {
        const onPage1 = new Set(normalized.page1Sections)
        normalized.page2Sections = normalized.page2Sections.filter(key => !onPage1.has(key))
    }

    for (const key of SECTION_KEYS) {
        if (key in normalized) normalized[key] = normalizeProposalSection(key, normalized[key])
    }

    return normalized
}

function salvageValidProposalPatch(normalizedPatch: Record<string, unknown>): Record<string, unknown> {
    const salvaged: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(normalizedPatch)) {
        const singleFieldValidation = ProposalBlocksSchema.safeParse({ [key]: value })
        if (singleFieldValidation.success) salvaged[key] = value
    }
    return salvaged
}

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
    const normalizedPatch = normalizeProposalPatch(rawPatch)
    if (!normalizedPatch) return null

    let validation = ProposalBlocksSchema.safeParse(normalizedPatch)
    if (!validation.success) {
        const salvaged = salvageValidProposalPatch(normalizedPatch)
        if (Object.keys(salvaged).length === 0) return null
        validation = ProposalBlocksSchema.safeParse(salvaged)
        if (!validation.success) return null
    }

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

// Exported for testing.
export function mergeGenericBlocks(
    current: Record<string, unknown>,
    generated: Record<string, unknown>,
): Record<string, unknown> {
    const merged = deepMergeGeneric(current, generated)
    if (!merged || typeof merged !== 'object' || Array.isArray(merged)) return current
    const mergedObj = merged as Record<string, unknown>
    reattachEnabledGenericSections(mergedObj, current)
    return mergedObj
}

function reattachEnabledGenericSections(
    result: Record<string, unknown>,
    current: Record<string, unknown>,
): void {
    const enabledSectionKeys = Object.keys(current).filter((key) => {
        const section = result[key]
        return isRecord(section) && section.enabled === true
    })
    if (!enabledSectionKeys.length) return

    if (Array.isArray(result.sections)) {
        const knownKeys = new Set(Object.keys(current))
        const sections = (result.sections as unknown[])
            .filter((key): key is string => typeof key === 'string' && knownKeys.has(key))
        for (const key of enabledSectionKeys) {
            if (!sections.includes(key)) sections.push(key)
        }
        result.sections = sections
        return
    }

    const hasPageLayout = Array.isArray(result.page1Sections) || Array.isArray(result.page2Sections)
    if (!hasPageLayout) return

    const page1 = Array.isArray(result.page1Sections) ? [...(result.page1Sections as string[])] : []
    const page2 = Array.isArray(result.page2Sections) ? [...(result.page2Sections as string[])] : []
    const placed = new Set([...page1, ...page2])
    const currentPage1 = Array.isArray(current.page1Sections) ? (current.page1Sections as string[]) : []

    for (const key of enabledSectionKeys) {
        if (placed.has(key)) continue
        if (currentPage1.includes(key)) page1.push(key)
        else page2.push(key)
        placed.add(key)
    }

    result.page1Sections = page1
    result.page2Sections = page2
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

    const baseSystemPrompt = buildGenericSystemPrompt(context)

    // Structured-output calls at temperature 0.65 occasionally return
    // isComplete=true with a patch that doesn't actually change anything vs the
    // saved state (see RETRY_NUDGE below for why). That's a dead end for the
    // user on a single shot, so we retry once with a stronger corrective
    // instruction before giving up and asking the user to clarify.
    const RETRY_NUDGE = `

UWAGA — POPRAWKA: Twoja poprzednia odpowiedz miala isComplete=true, ale "blocks" nie wprowadzalo zadnej realnej zmiany wzgledem AKTUALNEGO STANU SZABLONU (puste lub pominiete pola). To blad. Wiadomosc uzytkownika ponizej zawiera wystarczajace informacje biznesowe — uzyj ich TERAZ i zwroc w "blocks" realnie wypelnione, niepuste wartosci dla odpowiednich pol (np. "description").`

    const callGemini = async (extraSystemNote: string) => {
        const response = await ai.models.generateContent({
            model: config.gemini.model,
            contents,
            config: {
                systemInstruction: baseSystemPrompt + extraSystemNote,
                temperature: 0.65,
                maxOutputTokens: 24576,
                responseMimeType: 'application/json',
            },
        })

        const raw = response.text ?? ''
        try {
            return JSON.parse(raw) as { message?: string; isComplete?: boolean; blocks?: unknown }
        } catch {
            log.warn({ raw: raw.slice(0, 200), len: raw.length }, 'offer-fill generic: failed to parse structured response')
            return null
        }
    }

    const parsed = await callGemini('')
    if (!parsed) {
        return {
            message: 'Odpowiedz AI byla niekompletna. Sprobuj ponownie albo podaj krotszy opis projektu.',
            blocks: null,
            isComplete: false,
        }
    }

    let message = typeof parsed.message === 'string' ? parsed.message : 'Wypelnilem szablon.'
    if (parsed.isComplete !== true || !parsed.blocks || typeof parsed.blocks !== 'object' || Array.isArray(parsed.blocks)) {
        return { message: completionMessageWithoutBlocks(message), blocks: null, isComplete: false }
    }

    let blocks = mergeGenericBlocks(currentBlocks, parsed.blocks as Record<string, unknown>)
    let hasChanges = JSON.stringify(blocks) !== JSON.stringify(currentBlocks)

    if (!hasChanges) {
        const retryParsed = await callGemini(RETRY_NUDGE)
        if (
            retryParsed &&
            retryParsed.isComplete === true &&
            retryParsed.blocks &&
            typeof retryParsed.blocks === 'object' &&
            !Array.isArray(retryParsed.blocks)
        ) {
            const retryBlocks = mergeGenericBlocks(currentBlocks, retryParsed.blocks as Record<string, unknown>)
            const retryHasChanges = JSON.stringify(retryBlocks) !== JSON.stringify(currentBlocks)
            if (retryHasChanges) {
                blocks = retryBlocks
                hasChanges = true
                message = typeof retryParsed.message === 'string' ? retryParsed.message : message
            }
        }
    }

    if (!hasChanges) {
        // Still nothing after the retry. Prefer the model's own message — it's
        // often a legitimate clarifying question — but run it through the
        // false-completion-claim filter, and fall back to a generic prompt only
        // if that filter fires.
        const fallback = 'Nie wykrylem zmian w szablonie. Doprecyzuj prosze, jaki projekt lub dokument mam opisac.'
        const filtered = completionMessageWithoutBlocks(message)
        return {
            message: filtered === NO_APPLICABLE_BLOCKS_MESSAGE ? fallback : filtered,
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

    // Flat schemas (e.g. classic offers: title/description/terms/notes, no
    // nested blocks at all) have no entries above — list the plain fields
    // directly instead of leaving the model with an empty summary.
    if (!blockKeys.length) {
        const flatFields = Object.entries(blocks).filter(([, value]) => typeof value === 'string' || typeof value === 'number')
        if (flatFields.length) {
            lines.push('POLA (plaski schemat, bez blokow):')
            for (const [field, value] of flatFields) {
                const display = typeof value === 'string'
                    ? (value.trim() ? `"${value.slice(0, 100)}"` : '(puste)')
                    : String(value)
                lines.push(`  ${field} = ${display}`)
            }
        }
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

    // Most templates handled by this generic path are nested "blocks" (objects
    // with enabled/title/items). Classic offers are the exception: a flat object
    // of plain fields (title/description/terms/notes/...) with no block/section
    // concept at all. Without this, the model's own vocabulary bias toward
    // "sections" and "enabled" flags (reinforced by every other example in this
    // prompt) leads it to either invent a nested shape that silently fails to
    // merge, or treat the flat fields as too thin to be worth filling.
    const hasNestedBlocks = Object.values(currentBlocks).some(
        (value) => value && typeof value === 'object' && !Array.isArray(value),
    )
    // Field-role guidance is keyed to the actual JSON key names, since classic/
    // universal offers reliably use this exact flat shape (title/description/
    // terms/notes) — unlike nested block templates, whose field names vary per
    // template and can't be hardcoded here. Without calling out "notes" by name,
    // the model treated it as just another free string field and dumped the
    // main generated content there — the client never sees it, since it's the
    // user's own private field, and "description" (which the client DOES see)
    // was left blank. The offer looked completely unfilled.
    const fieldRoleNote = 'description' in currentBlocks || 'notes' in currentBlocks
        ? `

ROLE KONKRETNYCH POL (waznosc krytyczna — czytelnik oferty widzi tylko niektore z nich):
- "description": TO JEST GLOWNE, WIDOCZNE DLA KLIENTA miejsce na tresc oferty. Gdy uzytkownik opisuje projekt/uslugi/funkcje — ta tresc ZAWSZE trafia tutaj jako pelny, przekonujacy opis (HTML: <p>, <strong>, <ul><li>). To pole jest PRIORYTETEM przy wypelnianiu.
- "terms": warunki platnosci/realizacji, tez widoczne dla klienta.
- "notes": PRYWATNE — widzi je TYLKO wystawiajacy oferte, klient NIGDY. NIE wklejaj tu glownej tresci oferty ani rekomendacji technologicznych zamiast do "description". Zostaw puste, chyba ze uzytkownik WYRAZNIE prosi o wewnetrzna notatke/przypomnienie dla siebie (np. "zapisz sobie, ze...").
- "title": tytul oferty — zmieniaj tylko gdy uzytkownik wyraznie o to prosi.`
        : ''

    const flatSchemaNote = hasNestedBlocks ? '' : `

UWAGA — PLASKI SCHEMAT (bez blokow/sekcji):
Powyzszy JSON nie ma zagniezdzonych blokow ani flag "enabled" — to zwykly zestaw pol tekstowych/liczbowych. Kazde pole typu string (poza tytulem, datami i polami technicznymi typu "templateType") to miejsce na PELNA, konkretna tresc biznesowa — traktuj je jak sekcje dokumentu, nie jak metadane.${fieldRoleNote}
NIE zwracaj zagniezdzonych obiektow ani kluczy "sections"/"blocks" — patch ma miec DOKLADNIE te same klucze na najwyzszym poziomie co powyzszy JSON.`

    // "classic" and "universal" are explicitly industry-agnostic templates — any
    // business, not just IT. Every OTHER template in this app happens to be about
    // websites/apps, and an earlier version of this prompt hardcoded "IT commercial
    // documents specialist" unconditionally. That framing bled into classic/universal
    // offers too, so the model would second-guess or refuse a non-IT business
    // (e.g. "opis sprzedazy samochodu") instead of just writing it.
    const isIndustryAgnostic = templateType === 'classic' || templateType === 'universal'
    const personaLine = isIndustryAgnostic
        ? `Jestes doswiadczonym copywriterem B2B, piszacym dokumenty handlowe dla firm z DOWOLNEJ branzy (nie tylko IT) — uslugi, handel, produkcja, gastronomia, motoryzacja, cokolwiek zglosi uzytkownik. Dopasuj tresc do branzy, ktora wynika z wiadomosci uzytkownika, tytulu oferty lub nazwy klienta — nie zakladaj domyslnie branzy IT i nie kwestionuj tematu, o ktory prosi uzytkownik.`
        : `Jestes doswiadczonym copywriterem B2B i specjalista od dokumentow handlowych IT.`

    return `${personaLine} Pomagasz wypelniac szablon ${entityLabel} w aplikacji SmartQuote.

${languageInstruction}

KONTEKST:
Klient: "${ctx.clientName}"
Tytul: "${ctx.offerTitle}"
Typ dokumentu: ${entityLabel}
Typ szablonu: ${templateType}

${buildGenericBlocksSummary(currentBlocks)}

AKTUALNY JSON BLOKOW JEST JEDNOCZESNIE SCHEMATEM WYJSCIA:
${clippedBlocksJson}
${flatSchemaNote}

TRYB PRACY:
- Jezeli uzytkownik podal wystarczajacy opis projektu, branzy, uslugi lub oczekiwanej umowy, natychmiast wypelnij caly szablon.
- Jezeli brakuje podstawowego kontekstu, zadaj jedno krotkie pytanie i ustaw isComplete=false.
- Jezeli uzytkownik prosi o zmiane konkretnej sekcji, zmien tylko te sekcje i zachowaj reszte.
- Jezeli uzytkownik prosi o wypelnienie od zera lub automatycznie, wypelnij wszystkie pola tekstowe we wszystkich blokach, ktore maja sens biznesowy.
- Jezeli opis projektu lub polecenie uzytkownika uzasadnia sekcje, ktore byly wylaczone (np. portfolio/demo, technologia/CMS, proces, FAQ, testy, referencje), aktywuj je przez enabled=true i wypelnij konkretna trescia. Jesli szablon ma liste "sections", "page1Sections" lub "page2Sections", dodaj tam aktywowana sekcje, aby byla widoczna w dokumencie.
- TYLKO powyzszy "AKTUALNY JSON BLOKOW" / "AKTUALNY STAN SZABLONU" odzwierciedla to, co naprawde jest juz zapisane w ofercie — historia czatu ponizej to tylko rozmowa, NIE zapisana tresc. Jesli w rozmowie padly juz konkretne informacje (zakres, funkcje, technologia, branza, ceny), ale odpowiadajace pole w AKTUALNYM STANIE jest nadal puste, potraktuj to jako wciaz niewypelnione i uzupelnij je teraz, nawet jesli o tych informacjach mowiono kilka wiadomosci wczesniej. Nie zakladaj, ze cos zostalo juz zapisane tylko dlatego, ze zostalo wspomniane w czacie.
- NIGDY nie zwracaj isComplete=true z "blocks", ktore w praktyce niczego nie zmieniaja (brak jakiejkolwiek nowej, niepustej wartosci wzgledem AKTUALNEGO STANU). Jesli naprawde nie masz nic nowego do dodania, ustaw isComplete=false i zadaj konkretne pytanie o brakujace informacje zamiast falszywie deklarowac ukonczenie.

ZASADY STRUKTURY JSON:
- Zwracaj dokladnie obiekt JSON: { "message": string, "isComplete": boolean, "blocks": null | object }.
- Gdy isComplete=true, "blocks" ma zawierac tylko zmienione bloki jako czesciowy patch w tej samej strukturze co AKTUALNY JSON BLOKOW.
- Nie kopiuj niezmienionych blokow. sections/page arrays zwracaj tylko, gdy uzytkownik prosi o zmiane ukladu.
- Wyjatek: jesli aktywujesz wylaczona sekcje, mozesz zwrocic zaktualizowane sections/page arrays z ta sekcja, zeby dokument ja renderowal.
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

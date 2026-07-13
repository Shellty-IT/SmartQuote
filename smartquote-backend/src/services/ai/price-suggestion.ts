// src/services/ai/price-suggestion.ts
// AI price suggestion grounded in live Google Search.
// Estimates a market price range for the service described in the offer.
// NOTE: Google Search grounding cannot be combined with responseSchema/JSON mode,
// so we ask the model to append a JSON block and extract it from the text.
import { GoogleGenAI } from '@google/genai'
import { config } from '../../config'
import { createModuleLogger } from '../../lib/logger'

const log = createModuleLogger('ai:price-suggestion')

// Extracts the LAST parseable top-level JSON object from free-form text.
// The model is instructed to append the JSON block at the very end of its prose,
// but the reasoning itself may contain stray braces (examples, ranges like "{x}",
// emoji-adjacent text). A greedy first-`{`…last-`}` match would swallow that prose
// and fail to parse. Instead we forward-scan, tracking brace depth while respecting
// string literals/escapes, collect every balanced top-level `{…}` span, and return
// the last one that parses as an object.
export function extractTrailingJson(text: string): Record<string, unknown> | null {
    const spans: Array<[number, number]> = []
    let depth = 0
    let start = -1
    let inString = false
    let escaped = false

    for (let i = 0; i < text.length; i++) {
        const ch = text[i]

        if (inString) {
            if (escaped) escaped = false
            else if (ch === '\\') escaped = true
            else if (ch === '"') inString = false
            continue
        }

        if (ch === '"') { inString = true; continue }
        if (ch === '{') {
            if (depth === 0) start = i
            depth++
        } else if (ch === '}') {
            if (depth > 0) {
                depth--
                if (depth === 0 && start !== -1) spans.push([start, i + 1])
            }
        }
    }

    for (let s = spans.length - 1; s >= 0; s--) {
        const [a, b] = spans[s]
        try {
            const parsed = JSON.parse(text.slice(a, b))
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                return parsed as Record<string, unknown>
            }
        } catch {
            // try the next-earlier span
        }
    }
    return null
}

export interface PriceSuggestionInput {
    offerTitle: string
    clientName: string
    /** Plain-text summary of the offer scope/structure (what is being sold). */
    scopeSummary: string
    currency: string
}

export interface PriceSource {
    title: string
    uri: string
}

export interface PriceSuggestionResult {
    min: number | null
    max: number | null
    recommended: number | null
    currency: string
    /** Human-readable explanation of the range and what drives it. */
    reasoning: string
    sources: PriceSource[]
}

interface GroundingChunk {
    web?: { uri?: string; title?: string }
}

function extractSources(response: unknown): PriceSource[] {
    try {
        const candidates = (response as { candidates?: Array<{ groundingMetadata?: { groundingChunks?: GroundingChunk[] } }> }).candidates
        const chunks = candidates?.[0]?.groundingMetadata?.groundingChunks ?? []
        const seen = new Set<string>()
        const sources: PriceSource[] = []
        for (const c of chunks) {
            const uri = c.web?.uri
            if (!uri || seen.has(uri)) continue
            seen.add(uri)
            sources.push({ uri, title: c.web?.title || uri })
            if (sources.length >= 5) break
        }
        return sources
    } catch {
        return []
    }
}

export function toNumberOrNull(v: unknown): number | null {
    if (typeof v === 'number' && Number.isFinite(v)) return v
    if (typeof v === 'string') {
        const normalized = v.replace(/[^\d.,-]/g, '').replace(/\s/g, '').replace(',', '.')
        if (!normalized || !/[\d]/.test(normalized)) return null
        const n = Number(normalized)
        return Number.isFinite(n) ? n : null
    }
    return null
}

export async function priceSuggestion(
    ai: GoogleGenAI | null,
    input: PriceSuggestionInput,
): Promise<PriceSuggestionResult> {
    const currency = input.currency || 'PLN'
    if (!ai) {
        return {
            min: null, max: null, recommended: null, currency,
            reasoning: '⚠️ AI nie jest skonfigurowane (brak GEMINI_API_KEY).',
            sources: [],
        }
    }

    const prompt = `Jesteś doświadczonym wyceniającym usługi IT / tworzenia stron internetowych na polskim rynku.
Wyszukaj w sieci aktualne (2025/2026) ceny rynkowe w Polsce dla usługi opisanej poniżej i oszacuj realistyczny przedział cenowy.

USŁUGA / OFERTA:
Tytuł: "${input.offerTitle}"
Klient: "${input.clientName}"
Zakres prac:
${input.scopeSummary || '(brak szczegółowego zakresu — oszacuj na podstawie tytułu)'}

ZADANIE:
1. Przeszukaj sieć w poszukiwaniu cen podobnych realizacji w Polsce.
2. Podaj widełki cenowe (min–max) oraz rekomendowaną wartość w walucie ${currency} (kwoty NETTO, typowe dla B2B).
3. Uzasadnij krótko (3–5 zdań): co wpływa na cenę, dlaczego taki przedział, na co zwrócić uwagę przy tej konkretnej usłudze.

Napisz uzasadnienie po polsku, zwięźle i konkretnie.
Na samym KOŃCU odpowiedzi dodaj wyłącznie jeden blok JSON w formacie (bez markdown, bez komentarzy):
{"min": <liczba>, "max": <liczba>, "recommended": <liczba>, "reasoning": "<2-4 zdania podsumowania>"}`

    try {
        const response = await ai.models.generateContent({
            model: config.gemini.model,
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                temperature: 0.4,
                maxOutputTokens: 2048,
            },
        })

        const text = response.text ?? ''
        const sources = extractSources(response)
        const parsed = extractTrailingJson(text)

        const min = toNumberOrNull(parsed?.min)
        const max = toNumberOrNull(parsed?.max)
        const recommended = toNumberOrNull(parsed?.recommended)
            ?? (min !== null && max !== null ? Math.round((min + max) / 2) : null)

        // Prefer the JSON reasoning; fall back to the prose with the trailing JSON
        // block stripped. Strip only a JSON object sitting at the very end (after the
        // last newline-or-start), so stray braces inside the prose are left intact.
        let reasoning = typeof parsed?.reasoning === 'string' ? parsed.reasoning.trim() : ''
        if (!reasoning) {
            reasoning = text.replace(/\{[\s\S]*\}\s*$/, '').trim()
            // Guard: if stripping ate everything (prose-level brace), keep original text.
            if (!reasoning) reasoning = text.replace(/```[a-z]*|```/gi, '').trim()
        }
        if (!reasoning) {
            reasoning = 'Nie udało się oszacować ceny. Spróbuj ponownie lub doprecyzuj zakres oferty.'
        }

        return { min, max, recommended, currency, reasoning, sources }
    } catch (error) {
        log.error({ error }, 'price suggestion failed')
        return {
            min: null, max: null, recommended: null, currency,
            reasoning: '❌ Błąd podczas wyszukiwania cen. Spróbuj ponownie.',
            sources: [],
        }
    }
}

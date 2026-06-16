// src/__tests__/priceSuggestionParsers.test.ts
import { extractTrailingJson, toNumberOrNull } from '../services/ai/price-suggestion'
import { SECTION_PROMPTS } from '../services/ai/chat'

// ── extractTrailingJson ───────────────────────────────────────────────────────

describe('extractTrailingJson', () => {
    it('returns null for empty string', () => {
        expect(extractTrailingJson('')).toBeNull()
    })

    it('returns null for plain text with no JSON', () => {
        expect(extractTrailingJson('no json here')).toBeNull()
    })

    it('returns null for a JSON array (only objects accepted)', () => {
        expect(extractTrailingJson('[1, 2, 3]')).toBeNull()
    })

    it('parses a bare JSON object', () => {
        expect(extractTrailingJson('{"min":1000,"max":5000}')).toEqual({ min: 1000, max: 5000 })
    })

    it('returns the last valid JSON object when prose precedes it', () => {
        const text = 'Here is my analysis.\n\nThe prices vary widely.\n\n{"min":1000,"max":5000,"recommended":3000}'
        expect(extractTrailingJson(text)).toEqual({ min: 1000, max: 5000, recommended: 3000 })
    })

    it('handles nested objects', () => {
        const text = '{"min":1000,"sources":[{"url":"https://example.com","title":"Ref"}]}'
        const result = extractTrailingJson(text)
        expect(result?.min).toBe(1000)
    })

    it('handles escaped quotes inside strings without breaking parsing', () => {
        const text = '{"reasoning":"price is \\"reasonable\\"","min":2000}'
        const result = extractTrailingJson(text)
        expect(result?.min).toBe(2000)
    })

    it('returns last object when multiple JSON objects appear in text', () => {
        const text = '{"ignored":true} some text {"min":500,"max":1500}'
        expect(extractTrailingJson(text)).toEqual({ min: 500, max: 1500 })
    })

    it('returns null for unclosed brace', () => {
        expect(extractTrailingJson('{"min":1000')).toBeNull()
    })

    it('returns null for invalid JSON inside braces', () => {
        expect(extractTrailingJson('{not valid json}')).toBeNull()
    })
})

// ── toNumberOrNull ────────────────────────────────────────────────────────────

describe('toNumberOrNull', () => {
    it('returns integer as-is', () => {
        expect(toNumberOrNull(5000)).toBe(5000)
    })

    it('returns float as-is', () => {
        expect(toNumberOrNull(3.14)).toBe(3.14)
    })

    it('returns null for Infinity', () => {
        expect(toNumberOrNull(Infinity)).toBeNull()
    })

    it('returns null for NaN', () => {
        expect(toNumberOrNull(NaN)).toBeNull()
    })

    it('parses numeric string', () => {
        expect(toNumberOrNull('3000')).toBe(3000)
    })

    it('strips currency symbols from string', () => {
        expect(toNumberOrNull('3 000 PLN')).toBe(3000)
    })

    it('converts European comma decimal separator', () => {
        expect(toNumberOrNull('2,5')).toBe(2.5)
    })

    it('returns 0 for a string with only letters (regex strips to empty → Number("") = 0)', () => {
        // Implementation strips non-numeric chars; empty string becomes 0, not null.
        expect(toNumberOrNull('varies')).toBe(0)
    })

    it('returns null for null', () => {
        expect(toNumberOrNull(null)).toBeNull()
    })

    it('returns null for undefined', () => {
        expect(toNumberOrNull(undefined)).toBeNull()
    })

    it('returns null for object', () => {
        expect(toNumberOrNull({})).toBeNull()
    })
})

// ── SECTION_PROMPTS coverage ──────────────────────────────────────────────────

describe('SECTION_PROMPTS — proposal new sections', () => {
    it('has an entry for "benefits"', () => {
        expect(SECTION_PROMPTS).toHaveProperty('benefits')
        expect(typeof SECTION_PROMPTS['benefits']).toBe('string')
        expect(SECTION_PROMPTS['benefits'].length).toBeGreaterThan(0)
    })

    it('has an entry for "process"', () => {
        expect(SECTION_PROMPTS).toHaveProperty('process')
        expect(typeof SECTION_PROMPTS['process']).toBe('string')
        expect(SECTION_PROMPTS['process'].length).toBeGreaterThan(0)
    })

    it('has an entry for "stats"', () => {
        expect(SECTION_PROMPTS).toHaveProperty('stats')
        expect(typeof SECTION_PROMPTS['stats']).toBe('string')
        expect(SECTION_PROMPTS['stats'].length).toBeGreaterThan(0)
    })

    it('has entries for the classic proposal sections (excluding pricingExtra which uses the fallback)', () => {
        const required = ['intro', 'demo', 'structure', 'scope', 'testing', 'about', 'benefits', 'process', 'stats']
        for (const key of required) {
            expect(SECTION_PROMPTS).toHaveProperty(key)
        }
    })
})

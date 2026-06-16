import { describe, it, expect } from 'vitest'
import {
    mergeWithDefaults,
    buildDefaultBlocks,
    DEFAULT_PAGE1_SECTIONS,
    DEFAULT_PAGE2_SECTIONS,
    type SectionKey,
} from '@/lib/pdf/proposal-blocks'

// ── 1. Filtrowanie nieznanych SectionKey ──────────────────────────────────────

describe('mergeWithDefaults — filterValid', () => {
    it('removes unknown/legacy section keys from page1Sections', () => {
        const result = mergeWithDefaults({
            // Cast simulates stale DB data with keys that no longer exist.
            page1Sections: ['intro', 'oldPricing', 'headerBanner'] as unknown as SectionKey[],
        })
        expect(result.page1Sections).toEqual(['intro'])
    })

    it('removes unknown keys from page2Sections independently', () => {
        const result = mergeWithDefaults({
            page2Sections: ['scope', 'legacyTestimonialsBlock', 'about'] as unknown as SectionKey[],
        })
        expect(result.page2Sections).toEqual(['scope', 'about'])
    })

    it('keeps all known keys intact', () => {
        const known: SectionKey[] = ['intro', 'scope', 'pricingExtra', 'benefits']
        const result = mergeWithDefaults({ page1Sections: known })
        expect(result.page1Sections).toEqual(known)
    })
})

// ── 2. Opcjonalne sekcje domyślnie wyłączone ──────────────────────────────────

describe('mergeWithDefaults — optional sections default to enabled: false', () => {
    it('benefits is disabled when saved blocks are absent', () => {
        const result = mergeWithDefaults({})
        expect(result.benefits.enabled).toBe(false)
    })

    it('process is disabled when saved blocks are absent', () => {
        const result = mergeWithDefaults({})
        expect(result.process.enabled).toBe(false)
    })

    it('stats is disabled when saved blocks are absent', () => {
        const result = mergeWithDefaults({})
        expect(result.stats.enabled).toBe(false)
    })

    it('preserves enabled: true when DB has it set', () => {
        const result = mergeWithDefaults({
            benefits: { enabled: true, title: 'Korzyści', items: [] },
        })
        expect(result.benefits.enabled).toBe(true)
    })
})

// ── 3. Przywracanie page2Sections do defaults ─────────────────────────────────

describe('mergeWithDefaults — page2Sections fallback', () => {
    it('returns default page2Sections when DB field is null', () => {
        // DB JSONB fields can come back as null even on a non-null column
        // when the column was added via ALTER TABLE without a default.
        const result = mergeWithDefaults({ page2Sections: null as unknown as SectionKey[] })
        expect(result.page2Sections).toEqual(DEFAULT_PAGE2_SECTIONS)
    })

    it('returns default page2Sections when DB field is undefined', () => {
        const result = mergeWithDefaults({})
        expect(result.page2Sections).toEqual(DEFAULT_PAGE2_SECTIONS)
    })

    it('preserves a user-customised page2Sections order', () => {
        const custom: SectionKey[] = ['about', 'pricingExtra', 'scope']
        const result = mergeWithDefaults({ page2Sections: custom })
        expect(result.page2Sections).toEqual(custom)
    })

    it('returns empty array when DB explicitly stored [] (all sections moved to page1)', () => {
        // This is intentional: user moved everything to page 1.
        // mergeWithDefaults must not silently restore defaults here.
        const result = mergeWithDefaults({ page2Sections: [] })
        expect(result.page2Sections).toEqual([])
    })
})

// ── 4. Runtime safety ─────────────────────────────────────────────────────────

describe('mergeWithDefaults — runtime safety', () => {
    it('returns full defaults for null input (no throw)', () => {
        const result = mergeWithDefaults(null)
        const defaults = buildDefaultBlocks()
        expect(result).toEqual(defaults)
    })

    it('returns full defaults for undefined input (no throw)', () => {
        const result = mergeWithDefaults(undefined)
        const defaults = buildDefaultBlocks()
        expect(result).toEqual(defaults)
    })

    it('returns full defaults for empty-object input (no throw)', () => {
        const result = mergeWithDefaults({})
        const defaults = buildDefaultBlocks()
        expect(result).toEqual(defaults)
    })

    it('keeps page1Sections from defaults when saved.page1Sections is null', () => {
        const result = mergeWithDefaults({ page1Sections: null as unknown as SectionKey[] })
        expect(result.page1Sections).toEqual(DEFAULT_PAGE1_SECTIONS)
    })
})

// ── 5. priceOverride edge cases ────────────────────────────────────────────────

describe('mergeWithDefaults — priceOverride', () => {
    it('preserves priceOverride: null from defaults when not set', () => {
        const result = mergeWithDefaults({})
        expect(result.pricingExtra.priceOverride).toBeNull()
    })

    it('preserves priceOverride: 0 from DB (0 is a valid stored value — callers guard <= 0)', () => {
        // The HTML renderer and syncTotalsFromBlocks both guard <= 0 independently.
        // mergeWithDefaults must not silently convert 0 to null — that's the caller's job.
        const result = mergeWithDefaults({ pricingExtra: { ...buildDefaultBlocks().pricingExtra, priceOverride: 0 } })
        expect(result.pricingExtra.priceOverride).toBe(0)
    })

    it('carries a positive priceOverride through unchanged', () => {
        const result = mergeWithDefaults({ pricingExtra: { ...buildDefaultBlocks().pricingExtra, priceOverride: 12000 } })
        expect(result.pricingExtra.priceOverride).toBe(12000)
    })
})

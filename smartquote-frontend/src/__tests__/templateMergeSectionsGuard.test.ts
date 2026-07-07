import { describe, it, expect } from 'vitest'
import {
    mergeShopWithDefaults,
    buildDefaultShopBlocks,
    type ShopSectionKey,
} from '@/lib/pdf/shop-blocks'
import {
    mergeContractWithDefaults,
    buildDefaultContractBlocks,
    type ContractSectionKey,
} from '@/lib/pdf/contract-short-blocks'
import {
    mergeServicesWithDefaults,
    buildDefaultContractServicesBlocks,
    type ContractServicesSectionKey,
} from '@/lib/pdf/contract-services-blocks'

// Regression: shop / contract-short / contract-services merges used
// `filterValid(saved.sections ?? defaults.sections)` with no Array.isArray
// guard. Corrupt/stale DB JSONB where `sections` is a non-array value
// (object, string, number) made `.filter` throw → PDF/preview 500 instead of
// gracefully rendering defaults (unlike the other 9 templates). The guard now
// falls back to defaults for any non-array `sections`.

describe('mergeShopWithDefaults — sections guard', () => {
    it('falls back to defaults when sections is a non-array object (no throw)', () => {
        const defaults = buildDefaultShopBlocks()
        const result = mergeShopWithDefaults({
            sections: {} as unknown as ShopSectionKey[],
        })
        expect(result.sections).toEqual(defaults.sections)
    })

    it('falls back to defaults when sections is a string (no throw)', () => {
        const defaults = buildDefaultShopBlocks()
        const result = mergeShopWithDefaults({
            sections: 'summary' as unknown as ShopSectionKey[],
        })
        expect(result.sections).toEqual(defaults.sections)
    })

    it('filters unknown/legacy keys from a valid array', () => {
        const result = mergeShopWithDefaults({
            sections: ['summary', 'legacyHero', 'pricing'] as unknown as ShopSectionKey[],
        })
        expect(result.sections).toEqual(['summary', 'pricing'])
    })

    it('preserves a user-customised order', () => {
        const custom: ShopSectionKey[] = ['pricing', 'summary', 'about']
        const result = mergeShopWithDefaults({ sections: custom })
        expect(result.sections).toEqual(custom)
    })

    it('returns full defaults for null input (no throw)', () => {
        expect(mergeShopWithDefaults(null)).toEqual(buildDefaultShopBlocks())
    })
})

describe('mergeContractWithDefaults — sections guard', () => {
    it('falls back to defaults when sections is a non-array object (no throw)', () => {
        const defaults = buildDefaultContractBlocks()
        const result = mergeContractWithDefaults({
            sections: {} as unknown as ContractSectionKey[],
        })
        expect(result.sections).toEqual(defaults.sections)
    })

    it('filters unknown/legacy keys from a valid array', () => {
        const result = mergeContractWithDefaults({
            sections: ['parties', 'oldClause', 'payment'] as unknown as ContractSectionKey[],
        })
        expect(result.sections).toEqual(['parties', 'payment'])
    })

    it('preserves a user-customised order', () => {
        const custom: ContractSectionKey[] = ['payment', 'parties', 'subject']
        const result = mergeContractWithDefaults({ sections: custom })
        expect(result.sections).toEqual(custom)
    })

    it('returns full defaults for null input (no throw)', () => {
        expect(mergeContractWithDefaults(null)).toEqual(buildDefaultContractBlocks())
    })
})

describe('mergeServicesWithDefaults — sections guard', () => {
    it('falls back to defaults when sections is a non-array object (no throw)', () => {
        const defaults = buildDefaultContractServicesBlocks()
        const result = mergeServicesWithDefaults({
            sections: {} as unknown as ContractServicesSectionKey[],
        })
        expect(result.sections).toEqual(defaults.sections)
    })

    it('filters unknown/legacy keys from a valid array', () => {
        const result = mergeServicesWithDefaults({
            sections: ['parties', 'legacyBanner', 'payment'] as unknown as ContractServicesSectionKey[],
        })
        expect(result.sections).toEqual(['parties', 'payment'])
    })

    it('preserves a user-customised order', () => {
        const custom: ContractServicesSectionKey[] = ['payment', 'parties', 'scope']
        const result = mergeServicesWithDefaults({ sections: custom })
        expect(result.sections).toEqual(custom)
    })

    it('returns full defaults for null input (no throw)', () => {
        expect(mergeServicesWithDefaults(null)).toEqual(buildDefaultContractServicesBlocks())
    })
})

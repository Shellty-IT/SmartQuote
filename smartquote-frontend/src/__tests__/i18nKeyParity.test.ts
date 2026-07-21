import { describe, expect, it } from 'vitest'
import { pl } from '@/i18n/pl'
import { en } from '@/i18n/en'

// TypeScript already catches missing/mistyped keys in en.ts (it's checked
// against a type derived from pl.ts in src/i18n/index.ts), but that check is
// one-directional and structural-only: it won't catch a key that exists in
// en.ts but was renamed/removed from pl.ts (an orphan that never breaks the
// build, just silently stops being reachable), nor an accidentally empty
// translation string. Both classes of bug only show up at runtime as
// "translation missing" or a blank label in the UI.
function collectLeafPaths(node: unknown, prefix = ''): string[] {
    if (typeof node !== 'object' || node === null) return [prefix]
    return Object.entries(node as Record<string, unknown>).flatMap(([key, value]) =>
        collectLeafPaths(value, prefix ? `${prefix}.${key}` : key),
    )
}

function collectEmptyPaths(node: unknown, prefix = ''): string[] {
    if (typeof node !== 'object' || node === null) {
        return typeof node === 'string' && node.trim() === '' ? [prefix] : []
    }
    return Object.entries(node as Record<string, unknown>).flatMap(([key, value]) =>
        collectEmptyPaths(value, prefix ? `${prefix}.${key}` : key),
    )
}

describe('i18n key parity between pl.ts and en.ts', () => {
    it('has every pl.ts key path present in en.ts', () => {
        const plKeys = new Set(collectLeafPaths(pl))
        const enKeys = new Set(collectLeafPaths(en))

        const missingInEn = [...plKeys].filter((k) => !enKeys.has(k)).sort()
        expect(missingInEn).toEqual([])
    })

    it('has no orphaned en.ts key path absent from pl.ts', () => {
        const plKeys = new Set(collectLeafPaths(pl))
        const enKeys = new Set(collectLeafPaths(en))

        const missingInPl = [...enKeys].filter((k) => !plKeys.has(k)).sort()
        expect(missingInPl).toEqual([])
    })

    it('has no blank translation strings in either language', () => {
        expect(collectEmptyPaths(pl)).toEqual([])
        expect(collectEmptyPaths(en)).toEqual([])
    })
})

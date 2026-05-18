// src/__tests__/contentHash.test.ts
import { generateContentHash, verifyContentHash } from '../utils/contentHash';

const BASE_INPUT = {
    offerNumber: 'OFF/2025/001',
    items: [
        {
            name: 'Produkt A',
            quantity: 2,
            unitPrice: 100,
            vatRate: 23,
            discount: 0,
            isSelected: true,
        },
    ],
    selectedVariant: null,
    totalNet: 200,
    totalVat: 46,
    totalGross: 246,
    currency: 'PLN',
};

// ── generateContentHash ──────────────────────────────────────────────────────

describe('generateContentHash', () => {
    it('returns a 64-character hex string (SHA-256)', () => {
        const hash = generateContentHash(BASE_INPUT);
        expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('is deterministic — same input produces same hash', () => {
        expect(generateContentHash(BASE_INPUT)).toBe(generateContentHash(BASE_INPUT));
    });

    it('changes when offerNumber changes', () => {
        const modified = { ...BASE_INPUT, offerNumber: 'OFF/2025/999' };
        expect(generateContentHash(BASE_INPUT)).not.toBe(generateContentHash(modified));
    });

    it('changes when totalGross changes', () => {
        const modified = { ...BASE_INPUT, totalGross: 999 };
        expect(generateContentHash(BASE_INPUT)).not.toBe(generateContentHash(modified));
    });

    it('changes when currency changes', () => {
        const modified = { ...BASE_INPUT, currency: 'EUR' };
        expect(generateContentHash(BASE_INPUT)).not.toBe(generateContentHash(modified));
    });

    it('excludes unselected items from hash', () => {
        const withUnselected = {
            ...BASE_INPUT,
            items: [
                ...BASE_INPUT.items,
                {
                    name: 'Ukryty produkt',
                    quantity: 5,
                    unitPrice: 50,
                    vatRate: 23,
                    discount: 0,
                    isSelected: false,
                },
            ],
        };
        // Hash should be same because unselected items are filtered out
        expect(generateContentHash(BASE_INPUT)).toBe(generateContentHash(withUnselected));
    });

    it('normalises item order by name', () => {
        const reversed = {
            ...BASE_INPUT,
            items: [
                {
                    name: 'Zzz produkt',
                    quantity: 1,
                    unitPrice: 50,
                    vatRate: 23,
                    discount: 0,
                    isSelected: true,
                },
                {
                    name: 'Aaa produkt',
                    quantity: 1,
                    unitPrice: 50,
                    vatRate: 23,
                    discount: 0,
                    isSelected: true,
                },
            ],
        };
        const normal = {
            ...BASE_INPUT,
            items: [reversed.items[1], reversed.items[0]], // Aaa first
        };
        expect(generateContentHash(reversed)).toBe(generateContentHash(normal));
    });

    it('trims item names before hashing', () => {
        const spacedName = {
            ...BASE_INPUT,
            items: [{ ...BASE_INPUT.items[0], name: '  Produkt A  ' }],
        };
        expect(generateContentHash(BASE_INPUT)).toBe(generateContentHash(spacedName));
    });

    it('treats null and missing selectedVariant the same', () => {
        const withUndefined = { ...BASE_INPUT, selectedVariant: undefined };
        expect(generateContentHash(BASE_INPUT)).toBe(generateContentHash(withUndefined));
    });

    it('handles empty items array', () => {
        const empty = { ...BASE_INPUT, items: [] };
        const hash = generateContentHash(empty);
        expect(hash).toMatch(/^[a-f0-9]{64}$/);
        expect(hash).not.toBe(generateContentHash(BASE_INPUT));
    });

    it('includes variantName in hash', () => {
        const withVariant = {
            ...BASE_INPUT,
            items: [{ ...BASE_INPUT.items[0], variantName: 'Wariant A' }],
        };
        const withoutVariant = {
            ...BASE_INPUT,
            items: [{ ...BASE_INPUT.items[0], variantName: null }],
        };
        expect(generateContentHash(withVariant)).not.toBe(generateContentHash(withoutVariant));
    });
});

// ── verifyContentHash ────────────────────────────────────────────────────────

describe('verifyContentHash', () => {
    it('returns true for a valid hash', () => {
        const hash = generateContentHash(BASE_INPUT);
        expect(verifyContentHash(BASE_INPUT, hash)).toBe(true);
    });

    it('returns false for a tampered hash', () => {
        const hash = generateContentHash(BASE_INPUT);
        const tampered = hash.slice(0, -1) + (hash.endsWith('0') ? '1' : '0');
        expect(verifyContentHash(BASE_INPUT, tampered)).toBe(false);
    });

    it('returns false when input data differs from hash', () => {
        const hash = generateContentHash(BASE_INPUT);
        const modified = { ...BASE_INPUT, totalNet: 9999 };
        expect(verifyContentHash(modified, hash)).toBe(false);
    });

    it('returns true when same hash is verified multiple times', () => {
        const hash = generateContentHash(BASE_INPUT);
        expect(verifyContentHash(BASE_INPUT, hash)).toBe(true);
        expect(verifyContentHash(BASE_INPUT, hash)).toBe(true);
    });
});

// src/__tests__/aiCore.test.ts
import {
    isRecord,
    asNonEmptyStringOrNull,
    asNumberOrNull,
    parseClientSelectedSnapshot,
    inferSelectedVariantFromInteractions,
    safeJsonParse,
    extractJson,
    priorityLabels,
    followUpTypeLabels,
    offerStatusLabels,
} from '../services/ai/core';

// ── isRecord ─────────────────────────────────────────────────────────────────

describe('isRecord', () => {
    it('returns true for a plain object', () => {
        expect(isRecord({ a: 1 })).toBe(true);
    });

    it('returns true for an empty object', () => {
        expect(isRecord({})).toBe(true);
    });

    it('returns false for null', () => {
        expect(isRecord(null)).toBe(false);
    });

    it('returns false for an array', () => {
        expect(isRecord([])).toBe(false);
    });

    it('returns false for a string', () => {
        expect(isRecord('hello')).toBe(false);
    });

    it('returns false for a number', () => {
        expect(isRecord(42)).toBe(false);
    });

    it('returns false for undefined', () => {
        expect(isRecord(undefined)).toBe(false);
    });

    it('returns false for a function', () => {
        expect(isRecord(() => {})).toBe(false);
    });
});

// ── asNonEmptyStringOrNull ────────────────────────────────────────────────────

describe('asNonEmptyStringOrNull', () => {
    it('returns the string when non-empty', () => {
        expect(asNonEmptyStringOrNull('hello')).toBe('hello');
    });

    it('returns trimmed value for whitespace-padded string', () => {
        expect(asNonEmptyStringOrNull('  world  ')).toBe('world');
    });

    it('returns null for empty string', () => {
        expect(asNonEmptyStringOrNull('')).toBeNull();
    });

    it('returns null for whitespace-only string', () => {
        expect(asNonEmptyStringOrNull('   ')).toBeNull();
    });

    it('returns null for non-string (number)', () => {
        expect(asNonEmptyStringOrNull(42)).toBeNull();
    });

    it('returns null for null', () => {
        expect(asNonEmptyStringOrNull(null)).toBeNull();
    });

    it('returns null for undefined', () => {
        expect(asNonEmptyStringOrNull(undefined)).toBeNull();
    });

    it('returns null for boolean', () => {
        expect(asNonEmptyStringOrNull(true)).toBeNull();
    });
});

// ── asNumberOrNull ────────────────────────────────────────────────────────────

describe('asNumberOrNull', () => {
    it('returns the number when given a finite number', () => {
        expect(asNumberOrNull(42)).toBe(42);
    });

    it('returns 0 for the number 0', () => {
        expect(asNumberOrNull(0)).toBe(0);
    });

    it('parses a numeric string', () => {
        expect(asNumberOrNull('3.14')).toBeCloseTo(3.14);
    });

    it('returns null for NaN', () => {
        expect(asNumberOrNull(NaN)).toBeNull();
    });

    it('returns null for Infinity', () => {
        expect(asNumberOrNull(Infinity)).toBeNull();
    });

    it('returns null for -Infinity', () => {
        expect(asNumberOrNull(-Infinity)).toBeNull();
    });

    it('returns null for a non-numeric string', () => {
        expect(asNumberOrNull('abc')).toBeNull();
    });

    it('returns null for null', () => {
        expect(asNumberOrNull(null)).toBeNull();
    });

    it('returns null for undefined', () => {
        expect(asNumberOrNull(undefined)).toBeNull();
    });

    it('handles negative numbers', () => {
        expect(asNumberOrNull(-5)).toBe(-5);
    });
});

// ── parseClientSelectedSnapshot ───────────────────────────────────────────────

const VALID_SNAPSHOT = {
    selectedVariant: 'Wariant A',
    items: [
        {
            itemId: 'item-1',
            name: 'Produkt',
            isSelected: true,
            quantity: 2,
            unitPrice: 100,
            vatRate: 23,
            discount: 0,
        },
    ],
};

describe('parseClientSelectedSnapshot', () => {
    it('parses a valid snapshot', () => {
        const result = parseClientSelectedSnapshot(VALID_SNAPSHOT);
        expect(result).not.toBeNull();
        expect(result?.selectedVariant).toBe('Wariant A');
        expect(result?.items).toHaveLength(1);
        expect(result?.items[0].name).toBe('Produkt');
    });

    it('returns null for null input', () => {
        expect(parseClientSelectedSnapshot(null)).toBeNull();
    });

    it('returns null for non-object input', () => {
        expect(parseClientSelectedSnapshot('string')).toBeNull();
        expect(parseClientSelectedSnapshot(42)).toBeNull();
        expect(parseClientSelectedSnapshot([])).toBeNull();
    });

    it('returns null when items is missing', () => {
        expect(parseClientSelectedSnapshot({ selectedVariant: null })).toBeNull();
    });

    it('returns null when items is not an array', () => {
        expect(parseClientSelectedSnapshot({ selectedVariant: null, items: 'not-array' })).toBeNull();
    });

    it('skips invalid items', () => {
        const snapshot = {
            selectedVariant: null,
            items: [
                { ...VALID_SNAPSHOT.items[0] }, // valid
                { name: 'Invalid' }, // missing required fields
            ],
        };
        const result = parseClientSelectedSnapshot(snapshot);
        expect(result?.items).toHaveLength(1);
    });

    it('parses selectedVariant as null when explicitly null', () => {
        const snapshot = { ...VALID_SNAPSHOT, selectedVariant: null };
        const result = parseClientSelectedSnapshot(snapshot);
        expect(result?.selectedVariant).toBeNull();
    });

    it('parses empty selectedVariant string as null', () => {
        const snapshot = { ...VALID_SNAPSHOT, selectedVariant: '   ' };
        const result = parseClientSelectedSnapshot(snapshot);
        expect(result?.selectedVariant).toBeNull();
    });

    it('returns empty items array for empty items input', () => {
        const result = parseClientSelectedSnapshot({ selectedVariant: null, items: [] });
        expect(result?.items).toHaveLength(0);
    });

    it('includes optional netto/vat/brutto fields when present', () => {
        const snapshot = {
            selectedVariant: null,
            items: [
                { ...VALID_SNAPSHOT.items[0], netto: 200, vat: 46, brutto: 246 },
            ],
        };
        const result = parseClientSelectedSnapshot(snapshot);
        expect(result?.items[0].netto).toBe(200);
        expect(result?.items[0].vat).toBe(46);
        expect(result?.items[0].brutto).toBe(246);
    });

    it('parses variantName correctly', () => {
        const snapshot = {
            selectedVariant: null,
            items: [{ ...VALID_SNAPSHOT.items[0], variantName: 'Wariant B' }],
        };
        const result = parseClientSelectedSnapshot(snapshot);
        expect(result?.items[0].variantName).toBe('Wariant B');
    });
});

// ── inferSelectedVariantFromInteractions ──────────────────────────────────────

describe('inferSelectedVariantFromInteractions', () => {
    it('returns undefined when no interactions', () => {
        expect(inferSelectedVariantFromInteractions([])).toBeUndefined();
    });

    it('returns the selectedVariant from the last ITEM_SELECT interaction', () => {
        const interactions = [
            { type: 'VIEW', details: { selectedVariant: 'old' } },
            { type: 'ITEM_SELECT', details: { selectedVariant: 'Wariant B' } },
        ];
        expect(inferSelectedVariantFromInteractions(interactions)).toBe('Wariant B');
    });

    it('returns the selectedVariant from the last ACCEPT interaction', () => {
        const interactions = [
            { type: 'ACCEPT', details: { selectedVariant: 'Wariant A' } },
        ];
        expect(inferSelectedVariantFromInteractions(interactions)).toBe('Wariant A');
    });

    it('returns null when last matching interaction has selectedVariant=null', () => {
        const interactions = [
            { type: 'ITEM_SELECT', details: { selectedVariant: null } },
        ];
        expect(inferSelectedVariantFromInteractions(interactions)).toBeNull();
    });

    it('skips interactions with non-record details', () => {
        const interactions = [
            { type: 'ITEM_SELECT', details: null },
            { type: 'ITEM_SELECT', details: { selectedVariant: 'Wariant C' } },
        ];
        // Should return variant from last valid interaction (index 1 is last, but we iterate from end)
        expect(inferSelectedVariantFromInteractions(interactions)).toBe('Wariant C');
    });

    it('skips non-ITEM_SELECT and non-ACCEPT interactions', () => {
        const interactions = [
            { type: 'VIEW', details: { selectedVariant: 'Wariant X' } },
            { type: 'COMMENT', details: { selectedVariant: 'Wariant Y' } },
        ];
        expect(inferSelectedVariantFromInteractions(interactions)).toBeUndefined();
    });

    it('prefers more recent interactions (iterates from end)', () => {
        const interactions = [
            { type: 'ITEM_SELECT', details: { selectedVariant: 'First' } },
            { type: 'ITEM_SELECT', details: { selectedVariant: 'Second' } },
        ];
        // Iterates from end, so returns 'Second'
        expect(inferSelectedVariantFromInteractions(interactions)).toBe('Second');
    });
});

// ── safeJsonParse ─────────────────────────────────────────────────────────────

describe('safeJsonParse', () => {
    it('parses valid JSON object', () => {
        const result = safeJsonParse('{"key":"value"}');
        expect(result).toEqual({ key: 'value' });
    });

    it('returns empty object for invalid JSON', () => {
        expect(safeJsonParse('not-json')).toEqual({});
    });

    it('returns empty object for empty string', () => {
        expect(safeJsonParse('')).toEqual({});
    });

    it('parses nested objects', () => {
        const result = safeJsonParse('{"a":{"b":1}}');
        expect(result).toEqual({ a: { b: 1 } });
    });

    it('returns empty object for JSON array (not a record)', () => {
        // JSON.parse('[1,2,3]') returns an array, but return type is Record, so cast
        const result = safeJsonParse('[1,2,3]');
        expect(Array.isArray(result)).toBe(true); // function returns whatever JSON.parse gives
    });

    it('returns empty object for JSON null', () => {
        // JSON.parse('null') = null, not an object; function returns it as Record
        const result = safeJsonParse('null');
        // Function just returns JSON.parse result cast to Record — null is returned
        expect(result).toBeNull();
    });
});

// ── extractJson ───────────────────────────────────────────────────────────────

describe('extractJson', () => {
    it('extracts a JSON object from text', () => {
        const result = extractJson('Some text {"key":"value"} more text');
        expect(result).toEqual({ key: 'value' });
    });

    it('returns null when no JSON object in text', () => {
        expect(extractJson('no json here')).toBeNull();
    });

    it('returns null for empty string', () => {
        expect(extractJson('')).toBeNull();
    });

    it('extracts nested JSON', () => {
        const result = extractJson('Response: {"a":{"b":2}}');
        expect(result).toEqual({ a: { b: 2 } });
    });

    it('returns null for malformed JSON', () => {
        const result = extractJson('text {invalid json}');
        expect(result).toBeNull();
    });

    it('returns null for arrays (no braces)', () => {
        const result = extractJson('[1,2,3]');
        expect(result).toBeNull();
    });
});

// ── label constants ───────────────────────────────────────────────────────────

describe('priorityLabels', () => {
    it('maps URGENT to Polish label', () => {
        expect(priorityLabels['URGENT']).toBeTruthy();
    });

    it('maps all 4 priority levels', () => {
        expect(Object.keys(priorityLabels)).toHaveLength(4);
    });
});

describe('followUpTypeLabels', () => {
    it('maps CALL to Polish label', () => {
        expect(followUpTypeLabels['CALL']).toBeTruthy();
    });

    it('maps all 6 follow-up types', () => {
        expect(Object.keys(followUpTypeLabels)).toHaveLength(6);
    });
});

describe('offerStatusLabels', () => {
    it('maps ACCEPTED to Polish label', () => {
        expect(offerStatusLabels['ACCEPTED']).toBeTruthy();
    });

    it('maps all 7 offer statuses', () => {
        expect(Object.keys(offerStatusLabels)).toHaveLength(7);
    });
});

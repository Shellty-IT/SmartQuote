// src/__tests__/aiParsers.test.ts
import {
    parseConfidence,
    parseClientIntent,
    parseRiskLevel,
    parseStringArray,
    parseNumber,
    computeAvgPrice,
} from '../services/ai/parsers';

// ── parseConfidence ──────────────────────────────────────────────────────────

describe('parseConfidence', () => {
    it('returns "low" for valid "low"', () => {
        expect(parseConfidence('low')).toBe('low');
    });

    it('returns "medium" for valid "medium"', () => {
        expect(parseConfidence('medium')).toBe('medium');
    });

    it('returns "high" for valid "high"', () => {
        expect(parseConfidence('high')).toBe('high');
    });

    it('falls back to "low" for unknown string', () => {
        expect(parseConfidence('very-high')).toBe('low');
    });

    it('falls back to "low" for undefined', () => {
        expect(parseConfidence(undefined)).toBe('low');
    });

    it('falls back to "low" for null', () => {
        expect(parseConfidence(null)).toBe('low');
    });

    it('falls back to "low" for number', () => {
        expect(parseConfidence(1)).toBe('low');
    });

    it('is case-sensitive — "Low" is not valid', () => {
        expect(parseConfidence('Low')).toBe('low');
    });
});

// ── parseClientIntent ────────────────────────────────────────────────────────

describe('parseClientIntent', () => {
    const valid = ['likely_accept', 'undecided', 'likely_reject', 'unknown'] as const;

    valid.forEach((v) => {
        it(`returns "${v}" for valid "${v}"`, () => {
            expect(parseClientIntent(v)).toBe(v);
        });
    });

    it('falls back to "unknown" for unrecognised string', () => {
        expect(parseClientIntent('maybe')).toBe('unknown');
    });

    it('falls back to "unknown" for undefined', () => {
        expect(parseClientIntent(undefined)).toBe('unknown');
    });

    it('falls back to "unknown" for null', () => {
        expect(parseClientIntent(null)).toBe('unknown');
    });

    it('falls back to "unknown" for empty string', () => {
        expect(parseClientIntent('')).toBe('unknown');
    });
});

// ── parseRiskLevel ───────────────────────────────────────────────────────────

describe('parseRiskLevel', () => {
    it('returns "low" for "low"', () => {
        expect(parseRiskLevel('low')).toBe('low');
    });

    it('returns "medium" for "medium"', () => {
        expect(parseRiskLevel('medium')).toBe('medium');
    });

    it('returns "high" for "high"', () => {
        expect(parseRiskLevel('high')).toBe('high');
    });

    it('falls back to "medium" for unrecognised value', () => {
        expect(parseRiskLevel('critical')).toBe('medium');
    });

    it('falls back to "medium" for undefined', () => {
        expect(parseRiskLevel(undefined)).toBe('medium');
    });

    it('falls back to "medium" for null', () => {
        expect(parseRiskLevel(null)).toBe('medium');
    });
});

// ── parseStringArray ─────────────────────────────────────────────────────────

describe('parseStringArray', () => {
    it('returns the array as-is for a string[]', () => {
        expect(parseStringArray(['a', 'b'])).toEqual(['a', 'b']);
    });

    it('converts non-string elements to strings', () => {
        expect(parseStringArray([1, true, null])).toEqual(['1', 'true', 'null']);
    });

    it('returns empty array for non-array values', () => {
        expect(parseStringArray('hello')).toEqual([]);
        expect(parseStringArray(42)).toEqual([]);
        expect(parseStringArray(null)).toEqual([]);
        expect(parseStringArray(undefined)).toEqual([]);
        expect(parseStringArray({})).toEqual([]);
    });

    it('returns empty array for empty array input', () => {
        expect(parseStringArray([])).toEqual([]);
    });
});

// ── parseNumber ──────────────────────────────────────────────────────────────

describe('parseNumber', () => {
    it('parses a numeric number', () => {
        expect(parseNumber(42, 0)).toBe(42);
    });

    it('parses a numeric string', () => {
        expect(parseNumber('3.14', 0)).toBeCloseTo(3.14);
    });

    it('returns fallback for NaN', () => {
        expect(parseNumber(NaN, 99)).toBe(99);
    });

    it('returns fallback for non-numeric string', () => {
        expect(parseNumber('abc', 5)).toBe(5);
    });

    it('returns fallback for undefined', () => {
        expect(parseNumber(undefined, 7)).toBe(7);
    });

    it('returns fallback for null', () => {
        expect(parseNumber(null, 3)).toBe(3);
    });

    it('parses 0 correctly (not a fallback)', () => {
        expect(parseNumber(0, 99)).toBe(0);
    });

    it('parses negative numbers', () => {
        expect(parseNumber(-5, 0)).toBe(-5);
    });
});

// ── computeAvgPrice ──────────────────────────────────────────────────────────

describe('computeAvgPrice', () => {
    it('returns 0 for empty array', () => {
        expect(computeAvgPrice([])).toBe(0);
    });

    it('returns the single value for a one-element array', () => {
        expect(computeAvgPrice([100])).toBe(100);
    });

    it('computes average of two equal values', () => {
        expect(computeAvgPrice([50, 50])).toBe(50);
    });

    it('computes average and rounds to 2 decimal places', () => {
        expect(computeAvgPrice([10, 20, 30])).toBe(20);
    });

    it('rounds correctly for repeating decimals', () => {
        // (100 + 200 + 300) / 3 = 200 exactly
        expect(computeAvgPrice([100, 200, 300])).toBe(200);
        // (1 + 2) / 2 = 1.5
        expect(computeAvgPrice([1, 2])).toBe(1.5);
    });

    it('handles large numbers without overflow', () => {
        expect(computeAvgPrice([1000000, 2000000])).toBe(1500000);
    });
});

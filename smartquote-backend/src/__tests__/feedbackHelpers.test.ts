// src/__tests__/feedbackHelpers.test.ts
import { buildVariantBlock, buildKeyLessons } from '../services/ai/feedback.helpers';
import type { VariantHistoryStats } from '../services/ai/core';

// ── buildVariantBlock ────────────────────────────────────────────────────────

describe('buildVariantBlock', () => {
    it('returns a message when no variants exist', () => {
        const result = buildVariantBlock([], null, null);
        expect(result).toContain('WARIANTOWANIE');
        expect(result).toContain('brak wariantów');
    });

    it('includes available variant names', () => {
        const result = buildVariantBlock(['Wariant A', 'Wariant B'], 'Wariant A', null);
        expect(result).toContain('Wariant A');
        expect(result).toContain('Wariant B');
    });

    it('includes the selected variant', () => {
        const result = buildVariantBlock(['Wariant A'], 'Wariant A', null);
        expect(result).toContain('Wybrany wariant klienta: Wariant A');
    });

    it('shows "nieznany / brak" when selectedVariant is null', () => {
        const result = buildVariantBlock(['Wariant A'], null, null);
        expect(result).toContain('nieznany / brak');
    });

    it('shows "brak danych" when variantHistory is null', () => {
        const result = buildVariantBlock(['Wariant A'], null, null);
        expect(result).toContain('brak danych');
    });

    it('includes variant trend when variantHistory is provided', () => {
        const history: VariantHistoryStats = {
            totalAcceptedOffersAnalyzed: 10,
            totalAcceptedWithVariant: 8,
            distribution: [{ variant: 'Wariant A', count: 6, share: 75 }],
            topVariant: 'Wariant A',
            topVariantShare: 75,
        };
        const result = buildVariantBlock(['Wariant A', 'Wariant B'], 'Wariant A', history);
        expect(result).toContain('Wariant A: 6 (75%)');
    });

    it('starts with WARIANTOWANIE heading', () => {
        const result = buildVariantBlock(['A'], 'A', null);
        expect(result).toContain('WARIANTOWANIE');
    });
});

// ── buildKeyLessons ───────────────────────────────────────────────────────────

describe('buildKeyLessons', () => {
    it('returns existing lessons from baseObj', () => {
        const base = { keyLessons: ['Lekcja 1', 'Lekcja 2'] };
        const result = buildKeyLessons(base, null, false);
        expect(result).toEqual(['Lekcja 1', 'Lekcja 2']);
    });

    it('returns empty array when baseObj has no keyLessons', () => {
        const result = buildKeyLessons({}, null, false);
        expect(result).toEqual([]);
    });

    it('returns empty array when keyLessons is not an array', () => {
        const result = buildKeyLessons({ keyLessons: 'not-an-array' }, null, false);
        expect(result).toEqual([]);
    });

    it('filters out empty string lessons', () => {
        const base = { keyLessons: ['Valid lesson', '', '   '] };
        const result = buildKeyLessons(base, null, false);
        expect(result).toEqual(['Valid lesson']);
    });

    it('converts non-string lessons to strings', () => {
        const base = { keyLessons: [42, true] };
        const result = buildKeyLessons(base, null, false);
        expect(result).toContain('42');
        expect(result).toContain('true');
    });

    it('does not add variant lesson when hasVariants is false', () => {
        const history: VariantHistoryStats = {
            totalAcceptedOffersAnalyzed: 10,
            totalAcceptedWithVariant: 5,
            distribution: [{ variant: 'A', count: 4, share: 80 }],
            topVariant: 'A',
            topVariantShare: 80,
        };
        const result = buildKeyLessons({ keyLessons: [] }, history, false);
        // No variant lesson added because hasVariants = false
        expect(result).toEqual([]);
    });

    it('does not add variant lesson when variantHistory is null', () => {
        const result = buildKeyLessons({ keyLessons: ['Lekcja'] }, null, true);
        expect(result).toEqual(['Lekcja']);
    });

    it('does not add variant lesson when topVariant is not a string', () => {
        const history: VariantHistoryStats = {
            totalAcceptedOffersAnalyzed: 10,
            totalAcceptedWithVariant: 5,
            distribution: [],
            topVariant: null,
            topVariantShare: null,
        };
        const result = buildKeyLessons({}, history, true);
        expect(result).toEqual([]);
    });

    it('does not add variant lesson when topVariantShare < 50', () => {
        const history: VariantHistoryStats = {
            totalAcceptedOffersAnalyzed: 10,
            totalAcceptedWithVariant: 5,
            distribution: [{ variant: 'A', count: 2, share: 40 }],
            topVariant: 'A',
            topVariantShare: 40,
        };
        const result = buildKeyLessons({}, history, true);
        expect(result).toEqual([]);
    });

    it('does not add variant lesson when totalAcceptedWithVariant < 3', () => {
        const history: VariantHistoryStats = {
            totalAcceptedOffersAnalyzed: 5,
            totalAcceptedWithVariant: 2, // less than 3
            distribution: [{ variant: 'A', count: 2, share: 100 }],
            topVariant: 'A',
            topVariantShare: 100,
        };
        const result = buildKeyLessons({}, history, true);
        expect(result).toEqual([]);
    });

    it('prepends variant lesson when all conditions are met', () => {
        const history: VariantHistoryStats = {
            totalAcceptedOffersAnalyzed: 10,
            totalAcceptedWithVariant: 5,
            distribution: [{ variant: 'Wariant Premium', count: 4, share: 80 }],
            topVariant: 'Wariant Premium',
            topVariantShare: 80,
        };
        const result = buildKeyLessons({ keyLessons: ['Istniejąca lekcja'] }, history, true);
        expect(result[0]).toContain('Wariant Premium');
        expect(result[0]).toContain('80%');
        expect(result[1]).toBe('Istniejąca lekcja');
    });

    it('does not duplicate existing variant lesson', () => {
        const history: VariantHistoryStats = {
            totalAcceptedOffersAnalyzed: 10,
            totalAcceptedWithVariant: 5,
            distribution: [{ variant: 'A', count: 4, share: 80 }],
            topVariant: 'A',
            topVariantShare: 80,
        };
        // First call adds variant lesson
        const first = buildKeyLessons({}, history, true);
        const variantLesson = first[0];

        // Second call with the variant lesson already in the array - should deduplicate
        const second = buildKeyLessons({ keyLessons: [variantLesson] }, history, true);
        const variantLessons = second.filter((l) => l === variantLesson);
        expect(variantLessons).toHaveLength(1);
    });
});

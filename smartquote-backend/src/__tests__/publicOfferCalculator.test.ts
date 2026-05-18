// src/__tests__/publicOfferCalculator.test.ts
import { Decimal } from '@prisma/client/runtime/library';
import { PublicOfferCalculator } from '../services/public-offer/calculator';

function d(n: number): Decimal {
    return new Decimal(n);
}

function makeItem(overrides: {
    id?: string;
    name?: string;
    quantity?: number;
    unitPrice?: number;
    vatRate?: number;
    discount?: number | null;
    isOptional?: boolean;
    minQuantity?: number;
    maxQuantity?: number;
    variantName?: string | null;
}) {
    return {
        id: overrides.id ?? 'item-1',
        name: overrides.name ?? 'Test Item',
        quantity: d(overrides.quantity ?? 1),
        unitPrice: d(overrides.unitPrice ?? 100),
        vatRate: d(overrides.vatRate ?? 23),
        discount: overrides.discount !== undefined ? (overrides.discount === null ? null : d(overrides.discount)) : null,
        isOptional: overrides.isOptional ?? false,
        minQuantity: overrides.minQuantity ?? 1,
        maxQuantity: overrides.maxQuantity ?? 100,
        variantName: overrides.variantName ?? null,
    };
}

const calculator = new PublicOfferCalculator();

// ── basic calculations ───────────────────────────────────────────────────────

describe('PublicOfferCalculator.calculate', () => {
    it('calculates a single non-optional item with 23% VAT', () => {
        const items = [makeItem({ quantity: 1, unitPrice: 100, vatRate: 23 })];
        const result = calculator.calculate(items, []);

        expect(result.netValue).toBe(100);
        expect(result.vatValue).toBe(23);
        expect(result.grossValue).toBe(123);
    });

    it('calculates multiple non-optional items', () => {
        const items = [
            makeItem({ id: 'i1', quantity: 2, unitPrice: 100, vatRate: 23 }),
            makeItem({ id: 'i2', quantity: 1, unitPrice: 200, vatRate: 0 }),
        ];
        const result = calculator.calculate(items, []);

        expect(result.netValue).toBe(400); // 200 + 200
        expect(result.vatValue).toBe(46);  // 46 + 0
        expect(result.grossValue).toBe(446);
    });

    it('applies discount correctly', () => {
        const items = [makeItem({ quantity: 1, unitPrice: 200, vatRate: 23, discount: 50 })];
        const result = calculator.calculate(items, []);

        expect(result.netValue).toBe(100);
        expect(result.vatValue).toBe(23);
        expect(result.grossValue).toBe(123);
    });

    it('treats null discount as zero', () => {
        const items = [makeItem({ quantity: 1, unitPrice: 100, vatRate: 23, discount: null })];
        const result = calculator.calculate(items, []);

        expect(result.netValue).toBe(100);
    });

    it('returns clientSelectedData for each visible item', () => {
        const items = [makeItem({ id: 'i1' }), makeItem({ id: 'i2' })];
        const result = calculator.calculate(items, []);

        expect(result.clientSelectedData).toHaveLength(2);
        expect(result.clientSelectedData[0].itemId).toBe('i1');
        expect(result.clientSelectedData[1].itemId).toBe('i2');
    });

    // ── optional items ────────────────────────────────────────────────────────

    it('defaults optional item to selected when no selection provided', () => {
        const items = [makeItem({ id: 'opt', isOptional: true, quantity: 1, unitPrice: 50 })];
        const result = calculator.calculate(items, []);

        expect(result.clientSelectedData[0].isSelected).toBe(true);
        expect(result.netValue).toBeGreaterThan(0);
    });

    it('deselects optional item when selection says isSelected=false', () => {
        const items = [makeItem({ id: 'opt', isOptional: true, quantity: 1, unitPrice: 50, vatRate: 23 })];
        const result = calculator.calculate(items, [{ id: 'opt', isSelected: false, quantity: 1 }]);

        expect(result.clientSelectedData[0].isSelected).toBe(false);
        expect(result.netValue).toBe(0);
    });

    it('clamps optional item quantity to [min, max]', () => {
        const items = [makeItem({ id: 'opt', isOptional: true, quantity: 1, unitPrice: 10, vatRate: 0, minQuantity: 2, maxQuantity: 5 })];
        const result = calculator.calculate(items, [{ id: 'opt', isSelected: true, quantity: 10 }]);

        // quantity should be clamped to maxQuantity=5
        expect(result.clientSelectedData[0].quantity).toBe(5);
    });

    it('clamps optional quantity to minQuantity when below minimum', () => {
        const items = [makeItem({ id: 'opt', isOptional: true, quantity: 3, unitPrice: 10, vatRate: 0, minQuantity: 2, maxQuantity: 5 })];
        const result = calculator.calculate(items, [{ id: 'opt', isSelected: true, quantity: 1 }]);

        expect(result.clientSelectedData[0].quantity).toBe(2);
    });

    // ── variant filtering ─────────────────────────────────────────────────────

    it('shows only base items when there are no variants', () => {
        const items = [
            makeItem({ id: 'b1', variantName: null }),
            makeItem({ id: 'b2', variantName: null }),
        ];
        const result = calculator.calculate(items, []);
        expect(result.clientSelectedData).toHaveLength(2);
    });

    it('filters items to selected variant when variants exist', () => {
        const items = [
            makeItem({ id: 'base', variantName: null }),
            makeItem({ id: 'va', variantName: 'A', unitPrice: 50 }),
            makeItem({ id: 'vb', variantName: 'B', unitPrice: 100 }),
        ];
        const result = calculator.calculate(items, [], 'A');

        // Should include base + variant A only
        const ids = result.clientSelectedData.map((i) => i.itemId);
        expect(ids).toContain('base');
        expect(ids).toContain('va');
        expect(ids).not.toContain('vb');
    });

    it('calculates totals only for selected variant', () => {
        const items = [
            makeItem({ id: 'base', variantName: null, unitPrice: 100, vatRate: 0 }),
            makeItem({ id: 'va', variantName: 'A', unitPrice: 50, vatRate: 0 }),
            makeItem({ id: 'vb', variantName: 'B', unitPrice: 200, vatRate: 0 }),
        ];
        const result = calculator.calculate(items, [], 'A');

        expect(result.netValue).toBe(150); // 100 + 50
        expect(result.grossValue).toBe(150);
    });

    // ── rounding ──────────────────────────────────────────────────────────────

    it('rounds net/vat/gross to 2 decimal places', () => {
        const items = [makeItem({ quantity: 3, unitPrice: 33.33, vatRate: 23 })];
        const result = calculator.calculate(items, []);

        const dp = (n: number) => (n.toString().split('.')[1] || '').length;
        expect(dp(result.netValue)).toBeLessThanOrEqual(2);
        expect(dp(result.vatValue)).toBeLessThanOrEqual(2);
        expect(dp(result.grossValue)).toBeLessThanOrEqual(2);
    });

    // ── empty items ───────────────────────────────────────────────────────────

    it('returns zeros for empty items array', () => {
        const result = calculator.calculate([], []);
        expect(result.netValue).toBe(0);
        expect(result.vatValue).toBe(0);
        expect(result.grossValue).toBe(0);
        expect(result.clientSelectedData).toHaveLength(0);
    });
});

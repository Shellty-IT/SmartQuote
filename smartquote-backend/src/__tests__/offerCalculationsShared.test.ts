// src/__tests__/offerCalculationsShared.test.ts
import { Decimal } from '@prisma/client/runtime/library';
import {
    calculateItemTotals,
    buildItemWithTotals,
    calculateOfferTotals,
    ItemWithTotals,
} from '../services/shared/offer-calculations';

// Helper to build an ItemWithTotals manually for calculateOfferTotals tests
function makeItem(overrides: Partial<ItemWithTotals> = {}): ItemWithTotals {
    return {
        name: 'Test Item',
        description: null,
        quantity: 1,
        unit: 'szt.',
        unitPrice: 100,
        vatRate: 23,
        discount: 0,
        totalNet: new Decimal(100),
        totalVat: new Decimal(23),
        totalGross: new Decimal(123),
        position: 0,
        isOptional: false,
        isSelected: true,
        minQuantity: null,
        maxQuantity: null,
        variantName: null,
        ...overrides,
    };
}

// ── calculateItemTotals ──────────────────────────────────────────────────────

describe('calculateItemTotals (shared)', () => {
    it('calculates standard item with 23% VAT', () => {
        const result = calculateItemTotals({ quantity: 1, unitPrice: 100, vatRate: 23, discount: 0 });
        expect(result.totalNet.toNumber()).toBe(100);
        expect(result.totalVat.toNumber()).toBe(23);
        expect(result.totalGross.toNumber()).toBe(123);
    });

    it('calculates multiple units', () => {
        const result = calculateItemTotals({ quantity: 5, unitPrice: 200, vatRate: 23, discount: 0 });
        expect(result.totalNet.toNumber()).toBe(1000);
        expect(result.totalVat.toNumber()).toBe(230);
        expect(result.totalGross.toNumber()).toBe(1230);
    });

    it('applies 10% discount', () => {
        const result = calculateItemTotals({ quantity: 1, unitPrice: 1000, vatRate: 23, discount: 10 });
        expect(result.totalNet.toNumber()).toBe(900);
        expect(result.totalVat.toNumber()).toBe(207);
        expect(result.totalGross.toNumber()).toBe(1107);
    });

    it('defaults vatRate to 23 when undefined', () => {
        const result = calculateItemTotals({ quantity: 1, unitPrice: 100 });
        expect(result.totalVat.toNumber()).toBe(23);
    });

    it('defaults discount to 0 when undefined', () => {
        const result = calculateItemTotals({ quantity: 1, unitPrice: 100, vatRate: 23 });
        expect(result.totalNet.toNumber()).toBe(100);
    });

    it('handles 100% discount', () => {
        const result = calculateItemTotals({ quantity: 5, unitPrice: 999, vatRate: 23, discount: 100 });
        expect(result.totalNet.toNumber()).toBe(0);
        expect(result.totalGross.toNumber()).toBe(0);
    });

    it('preserves a 0% VAT rate', () => {
        const result = calculateItemTotals({ quantity: 3, unitPrice: 150, vatRate: 0, discount: 0 });
        expect(result.totalVat.toNumber()).toBe(0);
        expect(result.totalGross.toNumber()).toBe(450);
    });

    it('rounds to 2 decimal places', () => {
        const result = calculateItemTotals({ quantity: 1, unitPrice: 99.999, vatRate: 23, discount: 0 });
        const decimalPlaces = (n: number) => (n.toString().split('.')[1] || '').length;
        expect(decimalPlaces(result.totalNet.toNumber())).toBeLessThanOrEqual(2);
        expect(decimalPlaces(result.totalVat.toNumber())).toBeLessThanOrEqual(2);
        expect(decimalPlaces(result.totalGross.toNumber())).toBeLessThanOrEqual(2);
    });

    it('handles zero unitPrice', () => {
        const result = calculateItemTotals({ quantity: 10, unitPrice: 0, vatRate: 23, discount: 0 });
        expect(result.totalNet.toNumber()).toBe(0);
        expect(result.totalVat.toNumber()).toBe(0);
        expect(result.totalGross.toNumber()).toBe(0);
    });

    it('handles zero quantity', () => {
        const result = calculateItemTotals({ quantity: 0, unitPrice: 500, vatRate: 23, discount: 0 });
        expect(result.totalNet.toNumber()).toBe(0);
    });
});

// ── buildItemWithTotals ──────────────────────────────────────────────────────

describe('buildItemWithTotals', () => {
    const baseInput = {
        name: 'Widget',
        quantity: 2,
        unitPrice: 50,
        vatRate: 23,
        discount: 0,
    };

    it('returns item with calculated totals', () => {
        const result = buildItemWithTotals(baseInput, 0);
        expect(result.name).toBe('Widget');
        expect(result.totalNet.toNumber()).toBe(100);
        expect(result.totalVat.toNumber()).toBe(23);
        expect(result.totalGross.toNumber()).toBe(123);
    });

    it('sets position from index argument', () => {
        const result = buildItemWithTotals(baseInput, 3);
        expect(result.position).toBe(3);
    });

    it('defaults unit to "szt." when not provided', () => {
        const result = buildItemWithTotals(baseInput, 0);
        expect(result.unit).toBe('szt.');
    });

    it('uses custom unit when provided', () => {
        const result = buildItemWithTotals({ ...baseInput, unit: 'godz.' }, 0);
        expect(result.unit).toBe('godz.');
    });

    it('defaults vatRate to 23 when not provided', () => {
        const { vatRate: _, ...noVat } = baseInput;
        const result = buildItemWithTotals(noVat, 0);
        expect(result.vatRate).toBe(23);
    });

    it('preserves a 0% VAT rate on built items', () => {
        const result = buildItemWithTotals({ ...baseInput, vatRate: 0 }, 0);
        expect(result.vatRate).toBe(0);
        expect(result.totalVat.toNumber()).toBe(0);
    });

    it('defaults discount to 0 when not provided', () => {
        const result = buildItemWithTotals(baseInput, 0);
        expect(result.discount).toBe(0);
    });

    it('defaults isOptional to false', () => {
        const result = buildItemWithTotals(baseInput, 0);
        expect(result.isOptional).toBe(false);
    });

    it('always sets isSelected to true', () => {
        const result = buildItemWithTotals(baseInput, 0);
        expect(result.isSelected).toBe(true);
    });

    it('sets description to null when not provided', () => {
        const result = buildItemWithTotals(baseInput, 0);
        expect(result.description).toBeNull();
    });

    it('preserves description when provided', () => {
        const result = buildItemWithTotals({ ...baseInput, description: 'Desc' }, 0);
        expect(result.description).toBe('Desc');
    });

    it('sets variantName to null when not provided', () => {
        const result = buildItemWithTotals(baseInput, 0);
        expect(result.variantName).toBeNull();
    });

    it('preserves variantName when provided', () => {
        const result = buildItemWithTotals({ ...baseInput, variantName: 'Wariant A' }, 0);
        expect(result.variantName).toBe('Wariant A');
    });

    it('sets minQuantity and maxQuantity to null by default', () => {
        const result = buildItemWithTotals(baseInput, 0);
        expect(result.minQuantity).toBeNull();
        expect(result.maxQuantity).toBeNull();
    });
});

// ── calculateOfferTotals ─────────────────────────────────────────────────────

describe('calculateOfferTotals (shared)', () => {
    it('sums all items when there are no variants', () => {
        const items = [
            makeItem({ totalNet: new Decimal(100), totalVat: new Decimal(23), totalGross: new Decimal(123) }),
            makeItem({ totalNet: new Decimal(200), totalVat: new Decimal(46), totalGross: new Decimal(246) }),
        ];
        const result = calculateOfferTotals(items);
        expect(result.totalNet.toNumber()).toBe(300);
        expect(result.totalVat.toNumber()).toBe(69);
        expect(result.totalGross.toNumber()).toBe(369);
    });

    it('returns zeros for empty array', () => {
        const result = calculateOfferTotals([]);
        expect(result.totalNet.toNumber()).toBe(0);
        expect(result.totalVat.toNumber()).toBe(0);
        expect(result.totalGross.toNumber()).toBe(0);
    });

    it('sums only base items and first variant when variants present', () => {
        const baseItem = makeItem({
            name: 'Base',
            totalNet: new Decimal(100),
            totalVat: new Decimal(23),
            totalGross: new Decimal(123),
            variantName: null,
        });
        const variantAItem = makeItem({
            name: 'Wariant A item',
            totalNet: new Decimal(50),
            totalVat: new Decimal(11.5),
            totalGross: new Decimal(61.5),
            variantName: 'Wariant A',
        });
        const variantBItem = makeItem({
            name: 'Wariant B item',
            totalNet: new Decimal(80),
            totalVat: new Decimal(18.4),
            totalGross: new Decimal(98.4),
            variantName: 'Wariant B',
        });

        const result = calculateOfferTotals([baseItem, variantAItem, variantBItem]);

        // Should include base + first variant (Wariant A)
        expect(result.totalNet.toNumber()).toBe(150); // 100 + 50
        expect(result.totalGross.toNumber()).toBe(184.5); // 123 + 61.5
    });

    it('sums single item correctly', () => {
        const items = [makeItem()];
        const result = calculateOfferTotals(items);
        expect(result.totalNet.toNumber()).toBe(100);
    });
});

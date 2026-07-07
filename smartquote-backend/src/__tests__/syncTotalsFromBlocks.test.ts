import { syncTotalsFromBlocks } from '../utils/syncTotalsFromBlocks';

describe('syncTotalsFromBlocks', () => {
    it('returns null when there is no override block', () => {
        expect(syncTotalsFromBlocks({}, 'mobile_simple')).toBeNull();
    });

    it('returns null when priceOverride is missing or non-positive', () => {
        expect(syncTotalsFromBlocks({ process: { priceOverride: null } }, 'mobile_simple')).toBeNull();
        expect(syncTotalsFromBlocks({ process: { priceOverride: 0 } }, 'mobile_simple')).toBeNull();
        expect(syncTotalsFromBlocks({ process: { priceOverride: -5 } }, 'mobile_simple')).toBeNull();
    });

    it('treats a net override as net and grosses it up (mobile_simple)', () => {
        const result = syncTotalsFromBlocks(
            { process: { priceOverride: 10000, priceType: 'net' } },
            'mobile_simple',
        );
        expect(result).toEqual({ totalNet: 10000, totalVat: 2300, totalGross: 12300 });
    });

    it('treats a gross override as gross and nets it down (shop)', () => {
        const result = syncTotalsFromBlocks(
            { pricing: { priceOverride: 12300, priceType: 'gross' } },
            'shop',
        );
        expect(result).toEqual({ totalNet: 10000, totalVat: 2300, totalGross: 12300 });
    });

    it('keeps proposal gross overrides as the final gross amount', () => {
        const result = syncTotalsFromBlocks(
            { pricingExtra: { priceOverride: 2000, priceType: 'gross' } },
            'proposal',
        );
        expect(result).toEqual({ totalNet: 1626.02, totalVat: 373.98, totalGross: 2000 });
    });

    it('reads the pricing block for the universal template', () => {
        const result = syncTotalsFromBlocks(
            { pricing: { priceOverride: 5000, priceType: 'net' } },
            'universal',
        );
        expect(result).toEqual({ totalNet: 5000, totalVat: 1150, totalGross: 6150 });
    });

    it('treats a website template override (no priceType) as gross', () => {
        const result = syncTotalsFromBlocks(
            { pricing: { priceOverride: 6150 } },
            'website_v2',
        );
        expect(result).toEqual({ totalNet: 5000, totalVat: 1150, totalGross: 6150 });
    });

    it('defaults to the proposal pricingExtra path when templateType is omitted', () => {
        const result = syncTotalsFromBlocks({
            pricingExtra: { priceOverride: 12300, priceType: 'gross' },
        });
        expect(result).toEqual({ totalNet: 10000, totalVat: 2300, totalGross: 12300 });
    });

    it('returns null for templates that do not carry a block price (classic)', () => {
        expect(
            syncTotalsFromBlocks({ pricing: { priceOverride: 1000 } }, 'classic'),
        ).toBeNull();
    });
});

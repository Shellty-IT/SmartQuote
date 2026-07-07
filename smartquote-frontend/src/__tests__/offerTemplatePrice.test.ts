import { describe, expect, it } from 'vitest';
import { resolveTemplatePrice, syncSingleDisplayItemToTemplatePrice } from '@/lib/offer-template-price';
import type { OfferItem } from '@/types';

describe('offer template price resolution', () => {
    it('treats proposal priceOverride marked as gross as the final gross amount', () => {
        const price = resolveTemplatePrice({
            pricingExtra: { priceOverride: 2000, priceType: 'gross' },
        }, 'proposal');

        expect(price).toEqual({
            net: 1626.02,
            vat: 373.98,
            gross: 2000,
            vatRate: 23,
            type: 'gross',
        });
    });

    it('normalizes a stale single placeholder item for display', () => {
        const staleItem: OfferItem = {
            id: 'item-1',
            name: 'Propozycja',
            description: null,
            quantity: 1,
            unit: 'szt.',
            unitPrice: 2000,
            vatRate: 23,
            discount: 0,
            totalNet: 2000,
            totalVat: 460,
            totalGross: 2460,
            position: 0,
            isOptional: false,
            isSelected: true,
            minQuantity: 1,
            maxQuantity: 100,
            variantName: null,
        };
        const price = resolveTemplatePrice({
            pricingExtra: { priceOverride: 2000, priceType: 'gross' },
        }, 'proposal');

        expect(syncSingleDisplayItemToTemplatePrice([staleItem], price)).toEqual([{
            ...staleItem,
            unitPrice: 1626.02,
            totalNet: 1626.02,
            totalVat: 373.98,
            totalGross: 2000,
        }]);
    });
});

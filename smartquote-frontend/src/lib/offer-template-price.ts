import type { OfferItem } from '@/types';

export type TemplatePriceType = 'net' | 'gross';

export interface ResolvedTemplatePrice {
    gross: number;
    net: number;
    vat: number;
    vatRate: number;
    type: TemplatePriceType;
}

const PRICE_BLOCK_CONFIG: Record<string, { key: string; defaultType: TemplatePriceType }> = {
    proposal: { key: 'pricingExtra', defaultType: 'gross' },
    shop: { key: 'pricing', defaultType: 'gross' },
    website_v2: { key: 'pricing', defaultType: 'gross' },
    website_v3: { key: 'pricing', defaultType: 'gross' },
    support: { key: 'pricing', defaultType: 'net' },
    mobile_app: { key: 'pricing', defaultType: 'net' },
    mobile_simple: { key: 'process', defaultType: 'net' },
    universal: { key: 'pricing', defaultType: 'net' },
};

function round2(value: number): number {
    return Math.round(value * 100) / 100;
}

export function resolveTemplatePrice(
    blocks: unknown,
    templateType?: string | null,
): ResolvedTemplatePrice | null {
    if (!blocks || typeof blocks !== 'object') return null;

    const config = PRICE_BLOCK_CONFIG[templateType ?? 'classic'];
    if (!config) return null;

    const block = (blocks as Record<string, unknown>)[config.key];
    if (!block || typeof block !== 'object') return null;

    const record = block as Record<string, unknown>;
    if (record.priceOverride == null) return null;

    const override = Number(record.priceOverride);
    if (!Number.isFinite(override) || override <= 0) return null;

    const type: TemplatePriceType = record.priceType === 'net'
        ? 'net'
        : record.priceType === 'gross'
            ? 'gross'
            : config.defaultType;
    const vatRate = Number(record.vat);
    const effectiveVatRate = Number.isFinite(vatRate) && vatRate >= 0 ? vatRate : 23;
    const multiplier = 1 + effectiveVatRate / 100;

    const net = type === 'net' ? override : round2(override / multiplier);
    const gross = type === 'gross' ? override : round2(override * multiplier);

    return {
        gross,
        net,
        vat: round2(gross - net),
        vatRate: effectiveVatRate,
        type,
    };
}

export function syncSingleDisplayItemToTemplatePrice(
    items: OfferItem[] | undefined,
    templatePrice: ResolvedTemplatePrice | null,
): OfferItem[] {
    if (!items || items.length !== 1 || !templatePrice) return items ?? [];

    const item = items[0];
    const quantity = Number(item.quantity) || 1;
    const discount = Number(item.discount) || 0;
    const divisor = quantity * (1 - discount / 100);
    const unitPrice = divisor > 0 ? round2(templatePrice.net / divisor) : templatePrice.net;

    return [{
        ...item,
        unitPrice,
        vatRate: templatePrice.vatRate,
        totalNet: templatePrice.net,
        totalVat: templatePrice.vat,
        totalGross: templatePrice.gross,
    }];
}

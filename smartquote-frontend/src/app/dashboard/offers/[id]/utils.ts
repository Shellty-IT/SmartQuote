// src/app/dashboard/offers/[id]/utils.ts
import type { OfferItem } from '@/types';

export interface VariantGroup {
    name: string | null;
    items: OfferItem[];
}

export interface VariantData {
    groups: VariantGroup[];
    variantNames: string[];
}

export function groupByVariant(items: OfferItem[]): VariantData {
    const hasVariants = items.some((i) => i.variantName);
    if (!hasVariants) {
        return { groups: [{ name: null, items }], variantNames: [] };
    }

    const groups: VariantGroup[] = [];
    const baseItems = items.filter((i) => !i.variantName);
    if (baseItems.length > 0) {
        groups.push({ name: null, items: baseItems });
    }

    const variantNames = [...new Set(items.filter((i) => i.variantName).map((i) => i.variantName!))];
    for (const vn of variantNames) {
        groups.push({ name: vn, items: items.filter((i) => i.variantName === vn) });
    }

    return { groups, variantNames };
}

export function truncateHash(hash: string, length = 16): string {
    if (hash.length <= length * 2 + 3) return hash;
    return `${hash.slice(0, length)}...${hash.slice(-length)}`;
}

export function getEngagementColor(score: number): string {
    if (score <= 3) return 'bg-red-500';
    if (score <= 6) return 'bg-amber-500';
    return 'bg-emerald-500';
}
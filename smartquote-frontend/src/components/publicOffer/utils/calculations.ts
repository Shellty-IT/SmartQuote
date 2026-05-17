// src/components/publicOffer/utils/calculations.ts
import type { PublicOfferItem } from '@/types';

export interface ItemState {
    isSelected: boolean;
    quantity: number;
}

export interface OfferTotals {
    totalNet: number;
    totalVat: number;
    totalGross: number;
    selectedCount: number;
    totalVisible: number;
}

export function getVisibleItems(
    items: PublicOfferItem[],
    variants: string[],
    selectedVariant: string | null
): PublicOfferItem[] {
    if (variants.length === 0) return items;
    return items.filter((item) => !item.variantName || item.variantName === selectedVariant);
}

export function calculateTotals(
    allItems: PublicOfferItem[],
    itemStates: Record<string, ItemState>,
    variants: string[],
    selectedVariant: string | null
): OfferTotals {
    const visibleItems = getVisibleItems(allItems, variants, selectedVariant);

    let totalNet = 0;
    let totalVat = 0;
    let totalGross = 0;
    let selectedCount = 0;

    visibleItems.forEach((item) => {
        const state = itemStates[item.id];
        if (!state) return;

        const isSelected = item.isOptional ? state.isSelected : true;
        if (!isSelected) return;

        selectedCount++;

        const quantity = state.quantity;
        const unitPrice = Number(item.unitPrice);
        const vatRate = Number(item.vatRate);
        const discount = Number(item.discount) || 0;

        const discountMultiplier = 1 - discount / 100;
        const lineNet = quantity * unitPrice * discountMultiplier;
        const lineVat = lineNet * (vatRate / 100);

        totalNet += lineNet;
        totalVat += lineVat;
        totalGross += lineNet + lineVat;
    });

    return {
        totalNet: Math.round(totalNet * 100) / 100,
        totalVat: Math.round(totalVat * 100) / 100,
        totalGross: Math.round(totalGross * 100) / 100,
        selectedCount,
        totalVisible: visibleItems.length,
    };
}

export interface SelectedItemSummary {
    name: string;
    quantity: number;
    unit: string;
    brutto: number;
}

export function buildSelectedItemsSummary(
    visibleItems: PublicOfferItem[],
    itemStates: Record<string, ItemState>
): SelectedItemSummary[] {
    return visibleItems
        .filter((item) => {
            const state = itemStates[item.id];
            return item.isOptional ? state?.isSelected : true;
        })
        .map((item) => {
            const state = itemStates[item.id];
            const quantity = state?.quantity || Number(item.quantity);
            const unitPrice = Number(item.unitPrice);
            const discount = Number(item.discount) || 0;
            const vatRate = Number(item.vatRate);
            const discountMultiplier = 1 - discount / 100;
            const lineNet = quantity * unitPrice * discountMultiplier;
            const lineGross = lineNet + lineNet * (vatRate / 100);

            return {
                name: item.name,
                quantity,
                unit: item.unit,
                brutto: Math.round(lineGross * 100) / 100,
            };
        });
}

export function initializeItemStates(items: PublicOfferItem[]): Record<string, ItemState> {
    const states: Record<string, ItemState> = {};
    items.forEach((item) => {
        states[item.id] = {
            isSelected: item.isSelected,
            quantity: Number(item.quantity),
        };
    });
    return states;
}
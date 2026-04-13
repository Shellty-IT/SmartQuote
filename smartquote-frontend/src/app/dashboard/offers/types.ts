// src/app/dashboard/offers/types.ts

import type { CreateOfferItemInput } from '@/types';

export interface ExtendedOfferItem extends CreateOfferItemInput {
    isOptional: boolean;
    minQuantity: number;
    maxQuantity: number;
    variantName: string;
}

export interface OfferDetails {
    title: string;
    description: string;
    validUntil: string;
    notes: string;
    terms: string;
    paymentDays: number;
    requireAuditTrail: boolean;
}

export interface OfferTotalsData {
    totalNet: number;
    totalVat: number;
    totalGross: number;
}

export const emptyItem: ExtendedOfferItem = {
    name: '',
    description: '',
    quantity: 1,
    unit: 'szt.',
    unitPrice: 0,
    vatRate: 23,
    discount: 0,
    isOptional: false,
    minQuantity: 1,
    maxQuantity: 100,
    variantName: '',
};

export const defaultOfferDetails: OfferDetails = {
    title: '',
    description: '',
    validUntil: '',
    notes: '',
    terms: 'Płatność przelewem w ciągu 14 dni od wystawienia faktury.',
    paymentDays: 14,
    requireAuditTrail: false,
};
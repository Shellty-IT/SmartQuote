// src/types/offer-template.types.ts

import type { PaginationParams } from './api.types';

export interface OfferTemplateItem {
    id: string;
    templateId: string;
    name: string;
    description: string | null;
    quantity: number;
    unit: string;
    unitPrice: number;
    vatRate: number;
    discount: number;
    position: number;
    isOptional: boolean;
    variantName: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface OfferTemplate {
    id: string;
    userId: string;
    name: string;
    description: string | null;
    category: string | null;
    defaultPaymentDays: number;
    defaultTerms: string | null;
    defaultNotes: string | null;
    items: OfferTemplateItem[];
    _count?: {
        items: number;
    };
    createdAt: string;
    updatedAt: string;
}

export interface CreateOfferTemplateItemInput {
    name: string;
    description?: string | null;
    quantity: number;
    unit?: string;
    unitPrice: number;
    vatRate?: number;
    discount?: number;
    isOptional?: boolean;
    variantName?: string | null;
}

export interface CreateOfferTemplateInput {
    name: string;
    description?: string | null;
    category?: string | null;
    defaultPaymentDays?: number;
    defaultTerms?: string | null;
    defaultNotes?: string | null;
    items: CreateOfferTemplateItemInput[];
}

export interface UpdateOfferTemplateInput extends Partial<Omit<CreateOfferTemplateInput, 'items'>> {
    items?: CreateOfferTemplateItemInput[];
}

export interface OfferTemplateFilters extends PaginationParams {
    search?: string;
    category?: string;
}
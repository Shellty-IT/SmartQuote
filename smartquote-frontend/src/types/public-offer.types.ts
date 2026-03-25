// src/types/public-offer.types.ts

import type { OfferStatus } from './offer.types';

export interface PublicOfferItem {
    id: string;
    name: string;
    description: string | null;
    quantity: number;
    unit: string;
    unitPrice: number;
    vatRate: number;
    discount: number;
    totalNet: number;
    totalVat: number;
    totalGross: number;
    position: number;
    isOptional: boolean;
    isSelected: boolean;
    minQuantity: number;
    maxQuantity: number;
    variantName: string | null;
}

export interface PublicOfferAcceptanceLog {
    contentHash: string;
    acceptedAt: string;
    selectedVariant: string | null;
    totalGross: number;
    currency: string;
}

export interface PublicOfferData {
    expired: boolean;
    decided: boolean;
    requireAuditTrail: boolean;
    variants: string[];
    acceptanceLog: PublicOfferAcceptanceLog | null;
    offer: {
        id: string;
        number: string;
        title: string;
        description: string | null;
        status: OfferStatus;
        validUntil: string | null;
        totalNet: number;
        totalVat: number;
        totalGross: number;
        currency: string;
        acceptedAt: string | null;
        rejectedAt: string | null;
        clientSelectedData: Record<string, unknown> | null;
        terms: string | null;
        paymentDays: number;
        createdAt: string;
        items: PublicOfferItem[];
        client: {
            name: string;
            company: string | null;
        };
        seller: {
            name: string | null;
            email: string;
            phone: string | null;
            company: string | null;
            nip: string | null;
            address: string | null;
            city: string | null;
            postalCode: string | null;
            website: string | null;
            logo: string | null;
            primaryColor: string | null;
        };
        comments: Array<{
            id: string;
            offerId: string;
            author: 'CLIENT' | 'SELLER';
            content: string;
            createdAt: string;
        }>;
    };
}

export interface PublicOfferAcceptPayload {
    confirmationChecked: true;
    selectedVariant?: string;
    clientName?: string;
    clientEmail?: string;
    selectedItems: Array<{
        id: string;
        isSelected: boolean;
        quantity: number;
    }>;
}

export interface PublicOfferRejectPayload {
    reason?: string;
}

export interface PublicOfferAcceptResponse {
    offerId: string;
    offerNumber: string;
    offerTitle: string;
    clientName: string;
    clientCompany: string | null;
    clientEmail: string | null;
    selectedVariant: string | null;
    totalNet: number;
    totalVat: number;
    totalGross: number;
    selectedItems: Array<Record<string, unknown>>;
    sellerEmail: string;
    sellerName: string | null;
    userId: string;
    auditTrail: {
        contentHash: string;
        ipAddress: string;
        acceptedAt: string;
    } | null;
}
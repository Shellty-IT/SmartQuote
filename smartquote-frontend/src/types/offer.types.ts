// src/types/offer.types.ts

import type { PaginationParams } from './api.types';
import type { Client } from './client.types';

export type OfferStatus =
    | 'DRAFT'
    | 'SENT'
    | 'VIEWED'
    | 'NEGOTIATION'
    | 'ACCEPTED'
    | 'REJECTED'
    | 'EXPIRED';

export interface OfferItem {
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

export interface OfferAcceptanceLog {
    id: string;
    offerId: string;
    ipAddress: string;
    userAgent: string;
    acceptedAt: string;
    contentHash: string;
    acceptedData: Record<string, unknown>;
    clientName: string | null;
    clientEmail: string | null;
    selectedVariant: string | null;
    totalNet: number;
    totalVat: number;
    totalGross: number;
    currency: string;
    createdAt: string;
}

export interface Offer {
    id: string;
    number: string;
    title: string;
    description: string | null;
    status: OfferStatus;
    totalNet: number;
    totalVat: number;
    totalGross: number;
    currency: string;
    validUntil: string | null;
    sentAt: string | null;
    viewedAt: string | null;
    acceptedAt: string | null;
    rejectedAt: string | null;
    notes: string | null;
    terms: string | null;
    paymentDays: number;
    publicToken: string | null;
    isInteractive: boolean;
    viewCount: number;
    lastViewedAt: string | null;
    clientSelectedData: Record<string, unknown> | null;
    requireAuditTrail: boolean;
    acceptanceLog?: OfferAcceptanceLog | null;
    invoiceSentAt: string | null;
    invoiceExternalId: string | null;
    createdAt: string;
    updatedAt: string;
    client: Client;
    items: OfferItem[];
    _count?: {
        items: number;
        followUps?: number;
        comments?: number;
        views?: number;
    };
}

export interface CreateOfferItemInput {
    name: string;
    description?: string | null;
    quantity: number;
    unit?: string;
    unitPrice: number;
    vatRate?: number;
    discount?: number;
    isOptional?: boolean;
    minQuantity?: number;
    maxQuantity?: number;
    variantName?: string | null;
}

export interface CreateOfferInput {
    clientId: string;
    title: string;
    description?: string | null;
    validUntil?: string | null;
    notes?: string | null;
    terms?: string | null;
    paymentDays?: number;
    requireAuditTrail?: boolean;
    items: CreateOfferItemInput[];
}

export interface UpdateOfferInput extends Partial<Omit<CreateOfferInput, 'items'>> {
    status?: OfferStatus;
    requireAuditTrail?: boolean;
    items?: CreateOfferItemInput[];
}

export interface OffersStats {
    total: number;
    byStatus: Record<OfferStatus, { count: number; value: number }>;
    totalValue: number;
    acceptedValue: number;
}

export interface PublishOfferResult {
    publicToken: string;
    publicUrl: string;
    alreadyPublished: boolean;
}

export interface SendToClientResult {
    sent: boolean;
    email: string;
}

export interface OfferView {
    id: string;
    offerId: string;
    viewedAt: string;
    ipAddress: string | null;
    userAgent: string | null;
    duration: number | null;
}

export type InteractionType =
    | 'VIEW'
    | 'ITEM_SELECT'
    | 'ITEM_DESELECT'
    | 'QUANTITY_CHANGE'
    | 'ACCEPT'
    | 'REJECT'
    | 'COMMENT'
    | 'PDF_DOWNLOAD'
    | 'VARIANT_SWITCH';

export interface OfferInteraction {
    id: string;
    offerId: string;
    type: InteractionType;
    details: Record<string, unknown>;
    createdAt: string;
}

export type CommentAuthor = 'CLIENT' | 'SELLER';

export interface OfferComment {
    id: string;
    offerId: string;
    author: CommentAuthor;
    content: string;
    createdAt: string;
}

export interface OfferAnalytics {
    id: string;
    number: string;
    title: string;
    status: OfferStatus;
    publicToken: string | null;
    isInteractive: boolean;
    viewCount: number;
    lastViewedAt: string | null;
    acceptedAt: string | null;
    rejectedAt: string | null;
    clientSelectedData: Record<string, unknown> | null;
    validUntil: string | null;
    totalNet: number;
    totalGross: number;
    views: OfferView[];
    interactions: OfferInteraction[];
    comments: OfferComment[];
    uniqueVisitors: number;
    publicUrl: string | null;
}

export interface OfferFilters extends PaginationParams {
    status?: OfferStatus;
    clientId?: string;
    dateFrom?: string;
    dateTo?: string;
}
// ============================================
// API Response Types
// ============================================
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    meta?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// ============================================
// User Types
// ============================================
export interface User {
    id: string;
    email: string;
    name: string | null;
    company?: string | null;
    phone?: string | null;
    role: 'USER' | 'ADMIN';
    createdAt: string;
}

// ============================================
// Client Types
// ============================================
export type ClientType = 'PERSON' | 'COMPANY';

export interface Client {
    id: string;
    type: ClientType;
    name: string;
    email: string | null;
    phone: string | null;
    company: string | null;
    nip: string | null;
    regon: string | null;
    address: string | null;
    city: string | null;
    postalCode: string | null;
    country: string | null;
    website: string | null;
    notes: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    _count?: {
        offers: number;
        followUps?: number;
    };
}

export interface CreateClientInput {
    type?: ClientType;
    name: string;
    email?: string | null;
    phone?: string | null;
    company?: string | null;
    nip?: string | null;
    regon?: string | null;
    address?: string | null;
    city?: string | null;
    postalCode?: string | null;
    country?: string;
    website?: string | null;
    notes?: string | null;
}

export interface UpdateClientInput extends Partial<CreateClientInput> {
    isActive?: boolean;
}

export interface ClientsStats {
    total: number;
    active: number;
    inactive: number;
    withOffers: number;
}

// ============================================
// Offer Types
// ============================================
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
    createdAt: string;
    updatedAt: string;
    client: Client;
    items: OfferItem[];
    _count?: {
        items: number;
        followUps?: number;
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
}

export interface CreateOfferInput {
    clientId: string;
    title: string;
    description?: string | null;
    validUntil?: string | null;
    notes?: string | null;
    terms?: string | null;
    paymentDays?: number;
    items: CreateOfferItemInput[];
}

export interface UpdateOfferInput extends Partial<Omit<CreateOfferInput, 'items'>> {
    status?: OfferStatus;
    items?: CreateOfferItemInput[];
}

export interface OffersStats {
    total: number;
    byStatus: Record<OfferStatus, { count: number; value: number }>;
    totalValue: number;
    acceptedValue: number;
}

// ============================================
// Filter & Pagination Types
// ============================================
export interface PaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
}

export interface ClientFilters extends PaginationParams {
    type?: ClientType;
    isActive?: boolean;
}

export interface OfferFilters extends PaginationParams {
    status?: OfferStatus;
    clientId?: string;
    dateFrom?: string;
    dateTo?: string;
}


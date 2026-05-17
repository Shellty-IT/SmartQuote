// src/types/client.types.ts

import type { PaginationParams } from './api.types';

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

export interface ClientFilters extends PaginationParams {
    type?: ClientType;
    isActive?: boolean;
}
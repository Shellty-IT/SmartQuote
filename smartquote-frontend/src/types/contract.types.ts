// src/types/contract.types.ts

import type { Client } from './client.types';
import type { Offer } from './offer.types';

export type ContractStatus =
    | 'DRAFT'
    | 'PENDING_SIGNATURE'
    | 'ACTIVE'
    | 'COMPLETED'
    | 'TERMINATED'
    | 'EXPIRED';

export interface ContractItem {
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

export interface ContractSignatureLog {
    id: string;
    contractId: string;
    signerName: string;
    signerEmail: string;
    signatureImage: string;
    ipAddress: string;
    userAgent: string;
    contentHash: string;
    signedAt: string;
    createdAt: string;
}

export interface Contract {
    id: string;
    number: string;
    title: string;
    description: string | null;
    status: ContractStatus;
    totalNet: number;
    totalVat: number;
    totalGross: number;
    currency: string;
    startDate: string | null;
    endDate: string | null;
    signedAt: string | null;
    terms: string | null;
    paymentTerms: string | null;
    paymentDays: number;
    notes: string | null;
    publicToken: string | null;
    sentAt: string | null;
    clientId: string;
    client: Client;
    offerId: string | null;
    offer?: Offer;
    items: ContractItem[];
    signatureLog?: ContractSignatureLog | null;
    createdAt: string;
    updatedAt: string;
}

export interface ContractsStats {
    total: number;
    byStatus: Record<ContractStatus, number>;
    totalValue: number;
    activeValue: number;
}

export interface CreateContractInput {
    title: string;
    description?: string;
    clientId: string;
    offerId?: string;
    startDate?: string;
    endDate?: string;
    terms?: string;
    paymentTerms?: string;
    paymentDays?: number;
    notes?: string;
    items: {
        name: string;
        description?: string;
        quantity: number;
        unit?: string;
        unitPrice: number;
        vatRate?: number;
        discount?: number;
        position?: number;
    }[];
}
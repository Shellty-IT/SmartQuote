// src/types/ksef.types.ts

export interface KsefParty {
    name: string;
    nip: string;
    address: string;
    city: string;
    postalCode: string;
}

export interface KsefInvoiceItem {
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
}

export interface KsefPreviewOffer {
    id: string;
    number: string;
    title: string;
    totalNet: number;
    totalVat: number;
    totalGross: number;
    currency: string;
    paymentDays: number;
    invoiceSentAt: string | null;
}

export interface KsefPreviewData {
    offer: KsefPreviewOffer;
    suggestedIssueDate: string;
    suggestedDueDate: string;
    seller: KsefParty;
    buyer: KsefParty;
    items: KsefInvoiceItem[];
}

export interface KsefSendPayload {
    offerId: string;
    issueDate: string;
    dueDate: string;
}

export interface KsefSendResult {
    success: boolean;
    draftId: string;
}
// src/services/ksef-bridge.service.ts

import prisma from '../lib/prisma';
import { config } from '../config';

interface KsefMasterResponse {
    draftId?: string;
    message?: string;
    success?: boolean;
}

interface KsefExistsResponse {
    success: boolean;
    exists: boolean;
    companyName?: string;
    message?: string;
}

export interface AvailabilityResult {
    available: boolean;
    reason?:
        | 'NO_SELLER_NIP'
        | 'KSEF_ACCOUNT_NOT_FOUND'
        | 'KSEF_NOT_CONFIGURED'
        | 'KSEF_UNREACHABLE';
    sellerNip?: string;
    companyName?: string;
}

const AVAILABILITY_TTL_MS = 5 * 60 * 1000;
const availabilityCache = new Map<string, { result: AvailabilityResult; expiresAt: number }>();

function calculateDueDate(paymentDays: number): string {
    const date = new Date();
    date.setDate(date.getDate() + paymentDays);
    return date.toISOString().split('T')[0];
}

export class KsefBridgeService {
    async checkAvailability(userId: string, forceRefresh = false): Promise<AvailabilityResult> {
        if (!forceRefresh) {
            const cached = availabilityCache.get(userId);
            if (cached && cached.expiresAt > Date.now()) return cached.result;
        }

        const result = await this.computeAvailability(userId);
        availabilityCache.set(userId, { result, expiresAt: Date.now() + AVAILABILITY_TTL_MS });
        return result;
    }

    invalidateAvailability(userId: string): void {
        availabilityCache.delete(userId);
    }

    private async computeAvailability(userId: string): Promise<AvailabilityResult> {
        const companyInfo = await prisma.companyInfo.findUnique({
            where: { userId },
            select: { nip: true },
        });

        const nip = companyInfo?.nip?.trim();
        if (!nip || !/^\d{10}$/.test(nip)) {
            return { available: false, reason: 'NO_SELLER_NIP' };
        }

        const { masterUrl, masterApiKey } = config.ksef;
        if (!masterUrl || !masterApiKey) {
            return { available: false, reason: 'KSEF_NOT_CONFIGURED', sellerNip: nip };
        }

        try {
            const response = await fetch(
                `${masterUrl}/api/v1/import/companies/exists?nip=${encodeURIComponent(nip)}`,
                { method: 'GET', headers: { 'X-API-Key': masterApiKey } }
            );

            if (!response.ok) {
                return { available: false, reason: 'KSEF_UNREACHABLE', sellerNip: nip };
            }

            const data = (await response.json()) as KsefExistsResponse;
            if (!data.exists) {
                return { available: false, reason: 'KSEF_ACCOUNT_NOT_FOUND', sellerNip: nip };
            }

            return { available: true, sellerNip: nip, companyName: data.companyName };
        } catch {
            return { available: false, reason: 'KSEF_UNREACHABLE', sellerNip: nip };
        }
    }

    async getPreviewData(offerId: string, userId: string) {
        const offer = await prisma.offer.findFirst({
            where: { id: offerId, userId, status: 'ACCEPTED' },
            include: {
                client: true,
                items: { orderBy: { position: 'asc' } },
                user: {
                    select: {
                        companyInfo: true,
                    },
                },
            },
        });

        if (!offer) return null;

        const activeItems = offer.items.filter((item) => item.isSelected);
        const today = new Date().toISOString().split('T')[0];

        return {
            offer: {
                id: offer.id,
                number: offer.number,
                title: offer.title,
                totalNet: Number(offer.totalNet),
                totalVat: Number(offer.totalVat),
                totalGross: Number(offer.totalGross),
                currency: offer.currency,
                paymentDays: offer.paymentDays,
                invoiceSentAt: offer.invoiceSentAt?.toISOString() || null,
            },
            suggestedIssueDate: today,
            suggestedDueDate: calculateDueDate(offer.paymentDays),
            seller: {
                name: offer.user.companyInfo?.name || '',
                nip: offer.user.companyInfo?.nip || '',
                address: offer.user.companyInfo?.address || '',
                city: offer.user.companyInfo?.city || '',
                postalCode: offer.user.companyInfo?.postalCode || '',
            },
            buyer: {
                name: offer.client.name,
                nip: offer.client.nip || '',
                address: offer.client.address || '',
                city: offer.client.city || '',
                postalCode: offer.client.postalCode || '',
            },
            items: activeItems.map((item) => ({
                name: item.name,
                description: item.description,
                quantity: Number(item.quantity),
                unit: item.unit,
                unitPrice: Number(item.unitPrice),
                vatRate: Number(item.vatRate),
                discount: Number(item.discount),
                totalNet: Number(item.totalNet),
                totalVat: Number(item.totalVat),
                totalGross: Number(item.totalGross),
            })),
        };
    }

    async sendToKsefMaster(
        offerId: string,
        userId: string,
        issueDate: string,
        dueDate: string
    ) {
        const offer = await prisma.offer.findFirst({
            where: { id: offerId, userId, status: 'ACCEPTED' },
            include: {
                client: true,
                items: {
                    where: { isSelected: true },
                    orderBy: { position: 'asc' },
                },
                user: {
                    select: { companyInfo: true },
                },
            },
        });

        if (!offer) throw new Error('OFFER_NOT_FOUND');
        if (offer.invoiceSentAt) throw new Error('ALREADY_SENT');
        if (!offer.user.companyInfo?.nip) throw new Error('SELLER_NIP_MISSING');
        if (!offer.client.nip) throw new Error('BUYER_NIP_MISSING');
        if (offer.items.length === 0) throw new Error('NO_ITEMS');

        const { masterUrl: ksefMasterUrl, masterApiKey: apiKey } = config.ksef;

        if (!ksefMasterUrl || !apiKey) throw new Error('KSEF_NOT_CONFIGURED');

        const payload = {
            smartQuoteId: offer.id,
            offerNumber: offer.number,
            issueDate,
            dueDate,
            seller: {
                name: offer.user.companyInfo.name || '',
                nip: offer.user.companyInfo.nip,
                address: offer.user.companyInfo.address || '',
                city: offer.user.companyInfo.city || '',
                postalCode: offer.user.companyInfo.postalCode || '',
            },
            buyer: {
                name: offer.client.name,
                nip: offer.client.nip,
                address: offer.client.address || '',
                city: offer.client.city || '',
                postalCode: offer.client.postalCode || '',
            },
            items: offer.items.map((item) => ({
                name: item.name,
                description: item.description,
                quantity: Number(item.quantity),
                unit: item.unit,
                unitPrice: Number(item.unitPrice),
                vatRate: Number(item.vatRate),
                discount: Number(item.discount),
                totalNet: Number(item.totalNet),
                totalVat: Number(item.totalVat),
                totalGross: Number(item.totalGross),
            })),
            totalNet: Number(offer.totalNet),
            totalVat: Number(offer.totalVat),
            totalGross: Number(offer.totalGross),
            currency: offer.currency,
            paymentDays: offer.paymentDays,
        };

        const response = await fetch(`${ksefMasterUrl}/api/v1/import/smartquote`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey,
            },
            body: JSON.stringify(payload),
        });

        let parsed: KsefMasterResponse | null = null;
        const rawBody = await response.text().catch(() => '');
        try {
            parsed = rawBody ? (JSON.parse(rawBody) as KsefMasterResponse) : null;
        } catch {
            parsed = null;
        }

        if (response.status === 409) {
            const draftId = parsed?.draftId ?? (await this.lookupExistingDraftId(offer.id, ksefMasterUrl, apiKey));
            await prisma.offer.update({
                where: { id: offerId },
                data: { invoiceSentAt: new Date(), invoiceExternalId: draftId ?? null },
            });
            return { success: true, draftId: draftId ?? undefined, idempotent: true };
        }

        if (!response.ok) {
            throw new Error(parsed?.message || 'KSEF_MASTER_ERROR');
        }

        await prisma.offer.update({
            where: { id: offerId },
            data: {
                invoiceSentAt: new Date(),
                invoiceExternalId: parsed?.draftId || null,
            },
        });

        return { success: true, draftId: parsed?.draftId };
    }

    private async lookupExistingDraftId(
        smartQuoteId: string,
        masterUrl: string,
        apiKey: string
    ): Promise<string | undefined> {
        try {
            const res = await fetch(
                `${masterUrl}/api/v1/import/drafts/by-smartquote/${encodeURIComponent(smartQuoteId)}`,
                { method: 'GET', headers: { 'X-API-Key': apiKey } }
            );
            if (!res.ok) return undefined;
            const body = (await res.json()) as { draftId?: string };
            return body.draftId;
        } catch {
            return undefined;
        }
    }

    async handleWebhook(
        smartQuoteId: string,
        action: string,
        externalId?: string
    ) {
        const offer = await prisma.offer.findFirst({
            where: { id: smartQuoteId },
            select: { id: true, invoiceSentAt: true },
        });

        if (!offer) throw new Error('OFFER_NOT_FOUND');

        if (action === 'rejected') {
            await prisma.offer.update({
                where: { id: smartQuoteId },
                data: {
                    invoiceSentAt: null,
                    invoiceExternalId: null,
                },
            });
        } else if (action === 'approved' && externalId) {
            await prisma.offer.update({
                where: { id: smartQuoteId },
                data: {
                    invoiceExternalId: externalId,
                },
            });
        }

        return { acknowledged: true };
    }
}

export const ksefBridgeService = new KsefBridgeService();

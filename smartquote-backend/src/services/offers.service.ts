// src/services/offers.service.ts
import { randomBytes } from 'crypto';
import { OfferStatus, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { config } from '../config';
import { createModuleLogger } from '../lib/logger';
import { offersRepository, OfferItemData, UpdateOfferData } from '../repositories/offers.repository';
import { CreateOfferInput, UpdateOfferInput, OfferItemInput } from '../types';
import { generateOfferNumber } from '../utils/offerNumber';
import { emailService } from './email';
import { getUserEmailConfig } from './settings.service';
import { buildItemWithTotals, calculateOfferTotals, ItemWithTotals } from './shared/offer-calculations';
import { triggerPostMortem } from './shared/postmortem.utils';
import { NotFoundError, ValidationError, ExternalServiceError } from '../errors/domain.errors';
import { mapToPDFUser, mapToPDFClient } from './pdf/data-mapper';
import { pdfService } from './pdf';
import { syncTotalsFromBlocks } from '../utils/syncTotalsFromBlocks';
import { sanitizeRichText } from '../utils/sanitizeHtml';
import prisma from '../lib/prisma';

const logger = createModuleLogger('offers-service');
const frontendUrl = config.frontendUrl.replace(/\/$/, '');

function mapItemToData(item: ItemWithTotals): OfferItemData {
    return {
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        vatRate: item.vatRate,
        discount: item.discount,
        totalNet: item.totalNet,
        totalVat: item.totalVat,
        totalGross: item.totalGross,
        position: item.position,
        isOptional: item.isOptional,
        isSelected: item.isSelected,
        minQuantity: item.minQuantity,
        maxQuantity: item.maxQuantity,
        variantName: item.variantName,
    };
}

function buildItemsWithTotals(items: OfferItemInput[]): ItemWithTotals[] {
    return items.map((item, index) => buildItemWithTotals(item, index));
}

function syncSinglePlaceholderItem(
    item: ItemWithTotals,
    totals: { totalNet: number; totalVat: number; totalGross: number },
): ItemWithTotals {
    const quantity = Number(item.quantity) || 1;
    const discount = Number(item.discount) || 0;
    const divisor = quantity * (1 - discount / 100);
    const unitPrice = divisor > 0 ? totals.totalNet / divisor : totals.totalNet;

    return buildItemsWithTotals([{
        name: item.name,
        description: item.description ?? undefined,
        quantity,
        unit: item.unit,
        unitPrice,
        vatRate: 23,
        discount,
        isOptional: item.isOptional,
        minQuantity: item.minQuantity ?? undefined,
        maxQuantity: item.maxQuantity ?? undefined,
        variantName: item.variantName ?? undefined,
    }])[0];
}

type OfferWithBlockTotals = {
    templateType: string | null;
    blocks: Prisma.JsonValue | null;
    totalNet: Decimal;
    totalVat: Decimal;
    totalGross: Decimal;
    items?: Array<{
        quantity: Decimal | number;
        discount: Decimal | number;
        unitPrice: Decimal;
        vatRate: Decimal;
        totalNet: Decimal;
        totalVat: Decimal;
        totalGross: Decimal;
    }>;
};

function normalizeOfferFromBlockTotals<T extends OfferWithBlockTotals>(offer: T): T {
    if (!offer.blocks || typeof offer.blocks !== 'object' || Array.isArray(offer.blocks)) {
        return offer;
    }

    const totals = syncTotalsFromBlocks(
        offer.blocks as Record<string, unknown>,
        offer.templateType ?? 'classic',
    );
    if (!totals) return offer;

    const normalized = {
        ...offer,
        totalNet: new Decimal(totals.totalNet),
        totalVat: new Decimal(totals.totalVat),
        totalGross: new Decimal(totals.totalGross),
    };

    if (offer.items?.length !== 1) return normalized;

    const item = offer.items[0];
    const quantity = Number(item.quantity) || 1;
    const discount = Number(item.discount) || 0;
    const divisor = quantity * (1 - discount / 100);
    const unitPrice = divisor > 0 ? totals.totalNet / divisor : totals.totalNet;

    return {
        ...normalized,
        items: [{
            ...item,
            unitPrice: new Decimal(unitPrice).toDecimalPlaces(2),
            vatRate: new Decimal(23),
            totalNet: new Decimal(totals.totalNet),
            totalVat: new Decimal(totals.totalVat),
            totalGross: new Decimal(totals.totalGross),
        }],
    };
}

function getStatusTimestampKey(status: string): keyof UpdateOfferData | null {
    const map: Partial<Record<string, keyof UpdateOfferData>> = {
        SENT: 'sentAt',
        VIEWED: 'viewedAt',
        ACCEPTED: 'acceptedAt',
        REJECTED: 'rejectedAt',
    };
    return map[status] ?? null;
}

function mapLeadToClientRaw(lead: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    company: string | null;
}) {
    return {
        id: lead.id,
        type: 'PERSON',
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        nip: null,
        address: null,
        city: null,
        postalCode: null,
    };
}

export class OffersService {
    async create(userId: string, data: CreateOfferInput) {
        if (Boolean(data.clientId) === Boolean(data.leadId)) {
            throw new ValidationError('Należy wskazać klienta albo leada');
        }

        if (data.clientId) {
            const client = await prisma.client.findFirst({ where: { id: data.clientId, userId }, select: { id: true } });
            if (!client) throw new NotFoundError('Klient');
        }

        if (data.leadId) {
            const lead = await prisma.lead.findFirst({ where: { id: data.leadId, userId }, select: { id: true } });
            if (!lead) throw new NotFoundError('Lead');
        }

        let itemsWithTotals = buildItemsWithTotals(data.items);
        let offerTotals = calculateOfferTotals(itemsWithTotals);

        // Document-template offers carry no line items — their price is typed into
        // the block editor. Mirror that block price override onto the offer totals
        // so the list, details and PDF all show the same value from the start.
        if (data.blocks != null) {
            const fromBlocks = syncTotalsFromBlocks(
                data.blocks as Record<string, unknown>,
                data.templateType ?? 'classic',
            );
            if (fromBlocks) {
                offerTotals = {
                    totalNet: new Decimal(fromBlocks.totalNet),
                    totalVat: new Decimal(fromBlocks.totalVat),
                    totalGross: new Decimal(fromBlocks.totalGross),
                };
                if (itemsWithTotals.length === 1) {
                    itemsWithTotals = [syncSinglePlaceholderItem(itemsWithTotals[0], fromBlocks)];
                }
            }
        }

        // Retry up to 5 times to handle rare concurrent-request collisions
        for (let attempt = 0; attempt < 5; attempt++) {
            const number = await generateOfferNumber(userId);
            logger.info({ userId, offerNumber: number, attempt }, 'Creating offer');

            try {
                return await offersRepository.create({
                    number,
                    title: data.title,
                    description: sanitizeRichText(data.description),
                    validUntil: data.validUntil ? new Date(data.validUntil) : null,
                    notes: data.notes,
                    terms: sanitizeRichText(data.terms),
                    paymentDays: data.paymentDays ?? 14,
                    requireAuditTrail: data.requireAuditTrail ?? false,
                    totalNet: offerTotals.totalNet,
                    totalVat: offerTotals.totalVat,
                    totalGross: offerTotals.totalGross,
                    userId,
                    clientId: data.clientId ?? null,
                    leadId: data.leadId ?? null,
                    items: itemsWithTotals.map(mapItemToData),
                    templateType: data.templateType ?? 'classic',
                    blocks: data.blocks != null
                        ? (data.blocks as Prisma.InputJsonValue)
                        : Prisma.JsonNull,
                });
            } catch (err) {
                const isUniqueViolation =
                    err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';
                if (isUniqueViolation && attempt < 4) {
                    logger.warn({ userId, attempt, number }, 'Offer number collision, retrying');
                    continue;
                }
                throw err;
            }
        }

        // Unreachable — satisfies TypeScript
        throw new Error('Failed to generate unique offer number');
    }

    async findById(id: string, userId: string) {
        const offer = await offersRepository.findById(id, userId);
        if (!offer) throw new NotFoundError('Oferta');
        return normalizeOfferFromBlockTotals(offer);
    }

    async findAll(userId: string, query: Record<string, string | undefined>) {
        const result = await offersRepository.findAll({ userId, ...query });
        return {
            ...result,
            offers: result.offers.map(normalizeOfferFromBlockTotals),
        };
    }

    async update(id: string, userId: string, data: UpdateOfferInput) {
        const existing = await offersRepository.findById(id, userId);
        if (!existing) throw new NotFoundError('Oferta');

        const previousStatus = existing.status;

        // Set below when a block priceOverride syncs onto the offer's single
        // placeholder item too (see the blocks-handling block further down).
        let syncedItems: ItemWithTotals[] | undefined;

        const updateData: UpdateOfferData = {
            title: data.title,
            description: sanitizeRichText(data.description),
            validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
            notes: data.notes,
            terms: sanitizeRichText(data.terms),
            paymentDays: data.paymentDays,
        };

        if (data.requireAuditTrail !== undefined) {
            updateData.requireAuditTrail = data.requireAuditTrail;
        }

        if (data.templateType !== undefined && data.templateType !== (existing.templateType ?? 'classic')) {
            throw new ValidationError('Nie można zmienić szablonu istniejącej oferty');
        }

        if (data.blocks !== undefined) {
            updateData.blocks = data.blocks != null
                ? (data.blocks as Prisma.InputJsonValue)
                : Prisma.JsonNull;

            // When a block template has a priceOverride, sync it to the offer totals
            // so all views (list, details, PDF) show the same price. The block key
            // holding the override differs per template, hence existing.templateType.
            // Document-template offers never populate `items` (no items step in their
            // wizard), so the frontend sends `items: []` on every block-only save —
            // an empty array is truthy, so this must check length, not just presence.
            if (data.blocks != null && (!data.items || data.items.length === 0)) {
                const totals = syncTotalsFromBlocks(
                    data.blocks as Record<string, unknown>,
                    existing.templateType,
                );
                if (totals) {
                    updateData.totalGross = totals.totalGross;
                    updateData.totalNet = totals.totalNet;
                    updateData.totalVat = totals.totalVat;

                    // Doc-template offers carry a single placeholder item mirroring
                    // the headline price. Without this, the items table shows a
                    // stale price (usually 0) while the totals just below it
                    // already reflect the newly synced value.
                    if (existing.items.length === 1) {
                        const placeholder = existing.items[0];
                        const quantity = Number(placeholder.quantity) || 1;
                        const discount = Number(placeholder.discount) || 0;
                        const divisor = quantity * (1 - discount / 100);
                        const unitPrice = divisor > 0 ? totals.totalNet / divisor : totals.totalNet;
                        syncedItems = buildItemsWithTotals([{
                            name: placeholder.name,
                            description: placeholder.description ?? undefined,
                            quantity,
                            unit: placeholder.unit,
                            unitPrice,
                            vatRate: 23,
                            discount,
                            isOptional: placeholder.isOptional,
                            minQuantity: placeholder.minQuantity ?? undefined,
                            maxQuantity: placeholder.maxQuantity ?? undefined,
                            variantName: placeholder.variantName ?? undefined,
                        }]);
                    }
                }
            }
        }

        if (data.status) {
            updateData.status = data.status as OfferStatus;
            const timestampKey = getStatusTimestampKey(data.status);
            if (timestampKey) {
                (updateData as Record<string, unknown>)[timestampKey] = new Date();
            }
        }

        let result;

        if (data.items && data.items.length > 0) {
            const itemsWithTotals = buildItemsWithTotals(data.items);
            const offerTotals = calculateOfferTotals(itemsWithTotals);

            result = await offersRepository.updateWithItems(
                id,
                userId,
                {
                    ...updateData,
                    totalNet: offerTotals.totalNet,
                    totalVat: offerTotals.totalVat,
                    totalGross: offerTotals.totalGross,
                },
                itemsWithTotals.map(mapItemToData),
            );
        } else if (syncedItems) {
            result = await offersRepository.updateWithItems(
                id,
                userId,
                updateData,
                syncedItems.map(mapItemToData),
            );
        } else {
            result = await offersRepository.update(id, userId, updateData);
        }

        if (!result) throw new NotFoundError('Oferta');

        const isTerminalChange =
            data.status &&
            (data.status === 'ACCEPTED' || data.status === 'REJECTED') &&
            previousStatus !== data.status;

        if (isTerminalChange) {
            logger.info({ offerId: id, status: data.status }, 'Triggering post-mortem');
            triggerPostMortem(userId, id, data.status as 'ACCEPTED' | 'REJECTED', 'manual');
        }

        return result;
    }

    async delete(id: string, userId: string) {
        const deleted = await offersRepository.delete(id, userId);
        if (!deleted) throw new NotFoundError('Oferta');
    }

    async getStats(userId: string) {
        const [statuses, valueRows] = await Promise.all([
            offersRepository.groupByStatus(userId),
            offersRepository.findValuesForStats(userId),
        ]);
        const total = statuses.reduce((sum, status) => sum + status._count.status, 0);
        const normalizedValues = valueRows.map(normalizeOfferFromBlockTotals);
        const sumGross = (status?: OfferStatus) => normalizedValues.reduce((sum, offer) => {
            if (status && offer.status !== status) return sum;
            return sum + Number(offer.totalGross);
        }, 0);
        const valueByStatus = normalizedValues.reduce((acc, offer) => {
            acc[offer.status] = (acc[offer.status] ?? 0) + Number(offer.totalGross);
            return acc;
        }, {} as Partial<Record<OfferStatus, number>>);

        return {
            total,
            byStatus: statuses.reduce(
                (acc, s) => {
                    acc[s.status] = {
                        count: s._count.status,
                        value: valueByStatus[s.status] ?? 0,
                    };
                    return acc;
                },
                {} as Record<string, { count: number; value: number }>,
            ),
            totalValue: sumGross(),
            acceptedValue: sumGross('ACCEPTED'),
        };
    }

    async duplicate(id: string, userId: string) {
        const original = await offersRepository.findForDuplicate(id, userId);
        if (!original) throw new NotFoundError('Oferta');

        const number = await generateOfferNumber(userId);

        logger.info({ userId, originalId: id, offerNumber: number }, 'Duplicating offer');

        return offersRepository.create({
            number,
            title: `${original.title} (kopia)`,
            description: original.description,
            validUntil: null,
            notes: original.notes,
            terms: original.terms,
            paymentDays: original.paymentDays,
            requireAuditTrail: original.requireAuditTrail,
            totalNet: original.totalNet,
            totalVat: original.totalVat,
            totalGross: original.totalGross,
            userId,
            clientId: original.clientId,
            leadId: original.leadId,
            templateType: original.templateType ?? 'classic',
            blocks: original.blocks ?? undefined,
            items: original.items.map((item) => ({
                name: item.name,
                description: item.description,
                quantity: item.quantity,
                unit: item.unit,
                unitPrice: item.unitPrice,
                vatRate: item.vatRate,
                discount: item.discount,
                totalNet: item.totalNet,
                totalVat: item.totalVat,
                totalGross: item.totalGross,
                position: item.position,
                isOptional: item.isOptional,
                isSelected: true,
                minQuantity: item.minQuantity,
                maxQuantity: item.maxQuantity,
                variantName: item.variantName,
            })),
        });
    }

    async publishOffer(offerId: string, userId: string) {
        const offer = await offersRepository.findByIdPublicFields(offerId, userId);
        if (!offer) throw new NotFoundError('Oferta');

        if (offer.publicToken && offer.isInteractive) {
            return {
                publicToken: offer.publicToken,
                publicUrl: `${frontendUrl}/offer/view/${offer.publicToken}`,
                alreadyPublished: true,
            };
        }

        const publicToken = randomBytes(16).toString('base64url');

        const updated = await offersRepository.update(offerId, userId, {
            publicToken,
            isInteractive: true,
            status: offer.status === 'DRAFT' ? 'SENT' : (offer.status as OfferStatus),
            sentAt: offer.status === 'DRAFT' ? new Date() : undefined,
        });
        if (!updated) throw new NotFoundError('Oferta');

        logger.info({ offerId, publicToken }, 'Offer published');

        return {
            publicToken: updated.publicToken,
            publicUrl: `${frontendUrl}/offer/view/${updated.publicToken}`,
            alreadyPublished: false,
        };
    }

    async unpublishOffer(offerId: string, userId: string) {
        const offer = await offersRepository.findById(offerId, userId);
        if (!offer) throw new NotFoundError('Oferta');

        await offersRepository.update(offerId, userId, {
            publicToken: null,
            isInteractive: false,
        });

        logger.info({ offerId }, 'Offer unpublished');

        return true;
    }

    async generatePDF(offerId: string, userId: string): Promise<{ buffer: Buffer; filename: string }> {
        const offer = await offersRepository.findByIdWithUser(offerId, userId);
        if (!offer) throw new NotFoundError('Oferta');
        if ((offer.templateType ?? 'classic') !== 'classic') {
            throw new ValidationError('Ta oferta musi być generowana w zapisanym szablonie');
        }

        const pdfOffer = {
            ...offer,
            user: mapToPDFUser({
                id: offer.user.id,
                email: offer.user.email,
                name: offer.user.name,
                phone: offer.user.companyInfo?.phone ?? offer.user.phone,
                companyInfo: offer.user.companyInfo,
            }),
            client: mapToPDFClient(offer.client ?? mapLeadToClientRaw(offer.lead!)),
        };

        const buffer = await pdfService.generateOfferPDF(
            pdfOffer as Parameters<typeof pdfService.generateOfferPDF>[0],
        );

        return {
            buffer,
            filename: `Oferta_${offer.number.replace(/\//g, '-')}.pdf`,
        };
    }

    async sendOfferToClient(
        offerId: string,
        userId: string,
    ): Promise<{ sent: boolean; email: string }> {
        const offer = await offersRepository.findByIdForEmail(offerId, userId);
        if (!offer) throw new NotFoundError('Oferta');

        const recipient = offer.client ?? (offer.lead ? mapLeadToClientRaw(offer.lead) : null);
        if (!recipient?.email) {
            throw new ValidationError('Odbiorca nie ma podanego adresu email');
        }

        const emailConfig = await getUserEmailConfig(userId);
        if (!emailConfig) {
            throw new ValidationError('Skonfiguruj sposób wysyłki e-maili w ustawieniach');
        }

        let publicUrl: string;

        if (offer.publicToken && offer.isInteractive) {
            publicUrl = `${frontendUrl}/offer/view/${offer.publicToken}`;
        } else {
            const publishResult = await this.publishOffer(offerId, userId);
            publicUrl = publishResult.publicUrl;
        }

        const sent = await emailService.sendOfferLink(
            recipient.email,
            {
                offerNumber: offer.number,
                offerTitle: offer.title,
                clientName: recipient.name,
                totalGross: Number(offer.totalGross),
                currency: offer.currency,
                validUntil: offer.validUntil ? offer.validUntil.toISOString() : null,
                publicUrl,
                sellerName: offer.user.name ?? offer.user.email,
                companyName: offer.user.companyInfo?.name ?? null,
            },
            emailConfig,
        );

        if (!sent) {
            throw new ExternalServiceError('SMTP', 'Nie udało się wysłać emaila. Sprawdź konfigurację SMTP');
        }

        logger.info({ offerId, clientEmail: recipient.email }, 'Offer email sent');

        return { sent: true, email: recipient.email };
    }

    async getOfferAnalytics(offerId: string, userId: string) {
        const offer = await offersRepository.findForAnalytics(offerId, userId);
        if (!offer) throw new NotFoundError('Oferta');

        const uniqueIps = new Set(
            offer.views.filter((v) => v.ipAddress).map((v) => v.ipAddress),
        );

        return {
            ...offer,
            uniqueVisitors: uniqueIps.size,
            publicUrl: offer.publicToken
                ? `${frontendUrl}/offer/view/${offer.publicToken}`
                : null,
        };
    }

    async getOfferComments(offerId: string, userId: string) {
        const offer = await offersRepository.findById(offerId, userId);
        if (!offer) throw new NotFoundError('Oferta');
        return offersRepository.findComments(offerId);
    }

    async addSellerComment(offerId: string, userId: string, content: string) {
        const offer = await offersRepository.findById(offerId, userId);
        if (!offer) throw new NotFoundError('Oferta');
        return offersRepository.createCommentWithInteraction(offerId, content);
    }
}

export const offersService = new OffersService();

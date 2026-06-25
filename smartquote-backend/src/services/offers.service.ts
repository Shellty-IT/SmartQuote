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
import { getEffectiveSmtpConfig } from './settings.service';
import { buildItemWithTotals, calculateOfferTotals, ItemWithTotals } from './shared/offer-calculations';
import { triggerPostMortem } from './shared/postmortem.utils';
import { NotFoundError, ValidationError, ExternalServiceError } from '../errors/domain.errors';
import { mapToPDFUser, mapToPDFClient } from './pdf/data-mapper';
import { pdfService } from './pdf';
import { syncTotalsFromBlocks } from '../utils/syncTotalsFromBlocks';

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

function getStatusTimestampKey(status: string): keyof UpdateOfferData | null {
    const map: Partial<Record<string, keyof UpdateOfferData>> = {
        SENT: 'sentAt',
        VIEWED: 'viewedAt',
        ACCEPTED: 'acceptedAt',
        REJECTED: 'rejectedAt',
    };
    return map[status] ?? null;
}

export class OffersService {
    async create(userId: string, data: CreateOfferInput) {
        const itemsWithTotals = buildItemsWithTotals(data.items);
        let offerTotals = calculateOfferTotals(itemsWithTotals);

        // Document-template offers carry no line items — their price is typed into
        // the block editor. Mirror that block price override onto the offer totals
        // so the list, details and PDF all show the same value from the start.
        if (data.blocks != null && offerTotals.totalGross.isZero()) {
            const fromBlocks = syncTotalsFromBlocks(
                data.blocks as Record<string, unknown>,
                data.templateType,
            );
            if (fromBlocks) {
                offerTotals = {
                    totalNet: new Decimal(fromBlocks.totalNet),
                    totalVat: new Decimal(fromBlocks.totalVat),
                    totalGross: new Decimal(fromBlocks.totalGross),
                };
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
                    description: data.description,
                    validUntil: data.validUntil ? new Date(data.validUntil) : null,
                    notes: data.notes,
                    terms: data.terms,
                    paymentDays: data.paymentDays ?? 14,
                    requireAuditTrail: data.requireAuditTrail ?? false,
                    totalNet: offerTotals.totalNet,
                    totalVat: offerTotals.totalVat,
                    totalGross: offerTotals.totalGross,
                    userId,
                    clientId: data.clientId,
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
        return offer;
    }

    async findAll(userId: string, query: Record<string, string | undefined>) {
        return offersRepository.findAll({ userId, ...query });
    }

    async update(id: string, userId: string, data: UpdateOfferInput) {
        const existing = await offersRepository.findById(id, userId);
        if (!existing) throw new NotFoundError('Oferta');

        const previousStatus = existing.status;

        const updateData: UpdateOfferData = {
            title: data.title,
            description: data.description,
            validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
            notes: data.notes,
            terms: data.terms,
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
            if (data.blocks != null && !data.items) {
                const totals = syncTotalsFromBlocks(
                    data.blocks as Record<string, unknown>,
                    existing.templateType,
                );
                if (totals) {
                    updateData.totalGross = totals.totalGross;
                    updateData.totalNet = totals.totalNet;
                    updateData.totalVat = totals.totalVat;
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
        const [statuses, total, totalValue, acceptedValue] = await Promise.all([
            offersRepository.groupByStatus(userId),
            offersRepository.count(userId),
            offersRepository.aggregateTotalGross(userId),
            offersRepository.aggregateTotalGross(userId, 'ACCEPTED'),
        ]);

        return {
            total,
            byStatus: statuses.reduce(
                (acc, s) => {
                    acc[s.status] = {
                        count: s._count.status,
                        value: s._sum.totalGross?.toNumber() ?? 0,
                    };
                    return acc;
                },
                {} as Record<string, { count: number; value: number }>,
            ),
            totalValue: totalValue._sum.totalGross?.toNumber() ?? 0,
            acceptedValue: acceptedValue._sum.totalGross?.toNumber() ?? 0,
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
            client: mapToPDFClient(offer.client),
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

        if (!offer.client.email) {
            throw new ValidationError('Klient nie ma podanego adresu email');
        }

        const smtpConfig = await getEffectiveSmtpConfig(userId);
        if (!smtpConfig) {
            throw new ValidationError('Skonfiguruj skrzynkę pocztową w ustawieniach');
        }

        let publicUrl: string;

        if (offer.publicToken && offer.isInteractive) {
            publicUrl = `${frontendUrl}/offer/view/${offer.publicToken}`;
        } else {
            const publishResult = await this.publishOffer(offerId, userId);
            publicUrl = publishResult.publicUrl;
        }

        const sent = await emailService.sendOfferLink(
            offer.client.email,
            {
                offerNumber: offer.number,
                offerTitle: offer.title,
                clientName: offer.client.name,
                totalGross: Number(offer.totalGross),
                currency: offer.currency,
                validUntil: offer.validUntil ? offer.validUntil.toISOString() : null,
                publicUrl,
                sellerName: offer.user.name ?? offer.user.email,
                companyName: offer.user.companyInfo?.name ?? null,
            },
            smtpConfig,
        );

        if (!sent) {
            throw new ExternalServiceError('SMTP', 'Nie udało się wysłać emaila. Sprawdź konfigurację SMTP');
        }

        logger.info({ offerId, clientEmail: offer.client.email }, 'Offer email sent');

        return { sent: true, email: offer.client.email };
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

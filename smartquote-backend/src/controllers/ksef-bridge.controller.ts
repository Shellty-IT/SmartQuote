// src/controllers/ksef-bridge.controller.ts

import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { ksefBridgeService, verifyWebhookHmac } from '../services/ksef-bridge.service';
import { ksefSendSchema, ksefWebhookSchema } from '../validators/ksef-bridge.validator';
import { successResponse, errorResponse } from '../utils/apiResponse';
import { config } from '../config';
import { createModuleLogger } from '../lib/logger';

const log = createModuleLogger('ksef-bridge-ctrl');

export class KsefBridgeController {
    async getPreview(req: AuthenticatedRequest, res: Response) {
        try {
            const data = await ksefBridgeService.getPreviewData(req.params.offerId, req.user!.id);
            if (!data) {
                return errorResponse(res, 'NOT_FOUND', 'Oferta nie znaleziona lub nie ma statusu ACCEPTED', 404);
            }
            return successResponse(res, data);
        } catch (error: unknown) {
            log.error({ err: error, offerId: req.params.offerId }, 'Preview error');
            return errorResponse(res, 'PREVIEW_FAILED', 'Nie udało się pobrać danych podglądu', 500);
        }
    }

    async availability(req: AuthenticatedRequest, res: Response) {
        try {
            const forceRefresh = req.query.refresh === '1' || req.query.refresh === 'true';
            const result = await ksefBridgeService.checkAvailability(req.user!.id, forceRefresh);
            return successResponse(res, result);
        } catch (error: unknown) {
            log.error({ err: error, userId: req.user?.id }, 'Availability error');
            return errorResponse(res, 'AVAILABILITY_FAILED', 'Nie udało się sprawdzić dostępności KSeF Master', 500);
        }
    }

    async send(req: AuthenticatedRequest, res: Response) {
        try {
            const parsed = ksefSendSchema.safeParse({ body: req.body, query: req.query, params: req.params });
            if (!parsed.success) {
                const firstError = parsed.error.errors[0];
                return errorResponse(res, 'VALIDATION_ERROR', firstError.message, 400);
            }

            const { offerId, issueDate, dueDate } = parsed.data.body;
            const result = await ksefBridgeService.sendToKsefMaster(offerId, req.user!.id, issueDate, dueDate);
            return successResponse(res, result);
        } catch (error: unknown) {
            log.error({ err: error, userId: req.user?.id }, 'Send error');

            if (error instanceof Error) {
                const errorMap: Record<string, { code: string; message: string; status: number }> = {
                    OFFER_NOT_FOUND: {
                        code: 'NOT_FOUND',
                        message: 'Oferta nie znaleziona lub nie ma statusu ACCEPTED',
                        status: 404,
                    },
                    ALREADY_SENT: {
                        code: 'ALREADY_SENT',
                        message: 'Faktura została już przesłana do KSeF Master',
                        status: 409,
                    },
                    SELLER_NIP_MISSING: {
                        code: 'SELLER_NIP_MISSING',
                        message: 'Brak NIP sprzedawcy - uzupełnij dane firmy w ustawieniach',
                        status: 400,
                    },
                    BUYER_NIP_MISSING: {
                        code: 'BUYER_NIP_MISSING',
                        message: 'Brak NIP nabywcy - uzupełnij dane klienta',
                        status: 400,
                    },
                    NO_ITEMS: {
                        code: 'NO_ITEMS',
                        message: 'Oferta nie zawiera zaznaczonych pozycji',
                        status: 400,
                    },
                    KSEF_NOT_CONFIGURED: {
                        code: 'KSEF_NOT_CONFIGURED',
                        message: 'Integracja KSeF Master nie jest skonfigurowana',
                        status: 400,
                    },
                };
                const mapped = errorMap[error.message];
                if (mapped) {
                    return errorResponse(res, mapped.code, mapped.message, mapped.status);
                }
            }

            return errorResponse(res, 'SEND_FAILED', 'Nie udało się przesłać danych do KSeF Master', 500);
        }
    }

    async webhook(req: Request, res: Response) {
        try {
            const apiKey = req.headers['x-api-key'] as string;
            const expectedKey = config.ksef.masterApiKey;

            if (!expectedKey || apiKey !== expectedKey) {
                return errorResponse(res, 'UNAUTHORIZED', 'Invalid API key', 401);
            }

            // Fix #4 – HMAC verification: prevents spoofed callbacks and replay attacks.
            // KSeF Master must include X-Timestamp and X-Signature headers.
            // Existing deployments without HMAC headers are rejected after this change.
            const timestamp = req.headers['x-timestamp'] as string | undefined;
            const signature = req.headers['x-signature'] as string | undefined;

            if (!timestamp || !signature) {
                log.warn({ ip: req.ip }, 'Webhook missing HMAC headers');
                return errorResponse(res, 'UNAUTHORIZED', 'Missing HMAC signature headers', 401);
            }

            // Body must be parsed before schema validation to extract fields for HMAC.
            const bodyForHmac = req.body as { smartQuoteId?: string; action?: string };
            if (!bodyForHmac.smartQuoteId || !bodyForHmac.action) {
                return errorResponse(res, 'VALIDATION_ERROR', 'Missing required fields', 400);
            }

            if (!verifyWebhookHmac(expectedKey, timestamp, bodyForHmac.smartQuoteId, bodyForHmac.action, signature)) {
                log.warn({ ip: req.ip, smartQuoteId: bodyForHmac.smartQuoteId }, 'Webhook HMAC verification failed');
                return errorResponse(res, 'UNAUTHORIZED', 'Invalid HMAC signature', 401);
            }

            const parsed = ksefWebhookSchema.safeParse({ body: req.body, query: req.query, params: req.params });
            if (!parsed.success) {
                const firstError = parsed.error.errors[0];
                return errorResponse(res, 'VALIDATION_ERROR', firstError.message, 400);
            }

            const { smartQuoteId, action, externalId } = parsed.data.body;
            const result = await ksefBridgeService.handleWebhook(smartQuoteId, action, externalId);
            return successResponse(res, result);
        } catch (error: unknown) {
            log.error({ err: error }, 'Webhook error');

            if (error instanceof Error && error.message === 'OFFER_NOT_FOUND') {
                return errorResponse(res, 'NOT_FOUND', 'Oferta nie znaleziona', 404);
            }

            return errorResponse(res, 'WEBHOOK_FAILED', 'Nie udało się przetworzyć webhooka', 500);
        }
    }
}

export const ksefBridgeController = new KsefBridgeController();
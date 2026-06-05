// src/validators/ai.validator.ts
import { z } from 'zod';

export const chatSchema = z.object({
    body: z.object({
        message: z.string().min(1, 'Wiadomość nie może być pusta'),
        history: z
            .array(
                z.object({
                    role: z.enum(['user', 'assistant']),
                    content: z.string(),
                    timestamp: z.string().datetime().optional(),
                }),
            )
            .optional()
            .default([]),
    }),
});

export const generateOfferSchema = z.object({
    body: z.object({
        description: z.string().min(10, 'Opis musi mieć minimum 10 znaków'),
    }),
});

export const generateEmailSchema = z.object({
    body: z.object({
        type: z.enum(['offer_send', 'followup', 'thank_you', 'reminder']),
        clientName: z.string().min(1, 'Nazwa klienta jest wymagana'),
        offerTitle: z.string().optional(),
        customContext: z.string().optional(),
    }),
});

export const analyzeClientSchema = z.object({
    params: z.object({
        clientId: z.string().cuid(),
    }),
});

export const priceInsightSchema = z.object({
    body: z.object({
        itemName: z.string().min(1, 'Nazwa pozycji jest wymagana'),
        category: z.string().optional(),
    }),
});

export const offerDescriptionSchema = z.object({
    body: z.object({
        title: z.string().min(1).max(300),
        clientName: z.string().min(1).max(200),
        clientType: z.string().max(100).optional(),
        templateType: z.string().max(50).optional(),
        currentText: z.string().max(5000).optional(),
        mode: z.enum(['generate', 'polish']).default('generate'),
    }),
});

export const offerIdParamSchema = z.object({
    params: z.object({
        offerId: z.string().cuid(),
    }),
});

export const insightsListSchema = z.object({
    query: z.object({
        page: z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: z.string().regex(/^\d+$/).transform(Number).optional(),
        outcome: z.enum(['ACCEPTED', 'REJECTED']).optional(),
        dateFrom: z.string().datetime().optional(),
        dateTo: z.string().datetime().optional(),
        search: z.string().optional(),
    }),
});

export const latestInsightsSchema = z.object({
    query: z.object({
        limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    }),
});
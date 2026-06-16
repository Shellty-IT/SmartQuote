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
        pageContext: z.object({
            type: z.string(),
            id: z.string().optional(),
            title: z.string().optional(),
            extra: z.string().optional(),
        }).optional(),
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

export const generateSectionSchema = z.object({
    body: z.object({
        sectionKey: z.string().min(1).max(50),
        offerTitle: z.string().min(1).max(300),
        clientName: z.string().min(1).max(200),
        totalGross: z.number().min(0),
        currency: z.string().min(1).max(10),
    }),
});

export const priceCheckSchema = z.object({
    body: z.object({
        items: z
            .array(
                z.object({
                    name: z.string().min(1).max(500),
                    description: z.string().max(1000).optional().nullable(),
                    quantity: z.number().positive(),
                    unit: z.string().min(1).max(50),
                    unitPrice: z.number().min(0),
                    vatRate: z.number().min(0).max(100),
                }),
            )
            .min(1, 'Musisz podać co najmniej jedną pozycję')
            .max(50),
        currency: z.string().min(1).max(10),
        clientContext: z.string().max(500).optional().nullable(),
    }),
});

export const priceSuggestionSchema = z.object({
    body: z.object({
        offerTitle: z.string().min(1).max(300),
        clientName: z.string().min(1).max(200),
        scopeSummary: z.string().max(4000).optional().default(''),
        currency: z.string().min(1).max(10).default('PLN'),
    }),
});

export const offerFillSchema = z.object({
    body: z.object({
        message: z.string().min(1).max(10000),
        history: z
            .array(
                z.object({
                    role: z.enum(['user', 'assistant']),
                    content: z.string().max(30000),
                }),
            )
            .max(30)
            .default([]),
        context: z.object({
            clientName: z.string().min(1).max(500),
            offerTitle: z.string().min(1).max(500),
            language: z.enum(['pl', 'en']).optional(),
        }),
        currentBlocks: z.record(z.unknown()).optional(),
    }),
});

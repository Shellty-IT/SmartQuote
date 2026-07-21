// src/validators/leads.validator.ts
import { z } from 'zod';

const leadStatusEnum = z.enum(['NEW', 'CONTACTED', 'CONVERTED', 'LOST']);

export const createLeadSchema = z.object({
    body: z.object({
        name: z.string().min(2),
        company: z.string().optional().nullable(),
        email: z.string().email().optional().nullable(),
        phone: z.string().optional().nullable(),
        source: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
    }),
});

export const updateLeadSchema = z.object({
    params: z.object({
        id: z.string().min(1),
    }),
    body: z.object({
        name: z.string().min(2).optional(),
        company: z.string().optional().nullable(),
        email: z.string().email().optional().nullable(),
        phone: z.string().optional().nullable(),
        source: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
        status: leadStatusEnum.optional(),
        clientId: z.string().optional().nullable(),
    }),
});

export const getLeadSchema = z.object({
    params: z.object({
        id: z.string().min(1),
    }),
});

export const listLeadsSchema = z.object({
    query: z.object({
        page: z.string().optional(),
        limit: z.string().optional(),
        search: z.string().optional(),
        status: leadStatusEnum.optional(),
        sortBy: z.enum(['createdAt', 'updatedAt', 'name', 'status']).optional(),
        sortOrder: z.enum(['asc', 'desc']).optional(),
    }),
});

export const convertLeadSchema = z.object({
    params: z.object({
        id: z.string().min(1),
    }),
    body: z.object({
        name: z.string().optional(),
        email: z.string().email().optional().nullable(),
        phone: z.string().optional().nullable(),
        company: z.string().optional().nullable(),
        nip: z.string().optional().nullable(),
    }).optional().default({}),
});

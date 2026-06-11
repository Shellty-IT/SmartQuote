// src/validators/notes.validator.ts
import { z } from 'zod';

export const createNoteSchema = z.object({
    body: z
        .object({
            content: z.string().min(1, 'Treść notatki jest wymagana').max(5000),
            clientId: z.string().optional().nullable(),
            offerId: z.string().optional().nullable(),
            contractId: z.string().optional().nullable(),
            leadId: z.string().optional().nullable(),
        })
        .refine(
            (data) => {
                const ids = [data.clientId, data.offerId, data.contractId, data.leadId].filter(
                    (v) => v != null && v !== '',
                );
                return ids.length === 1;
            },
            {
                message: 'Należy podać dokładnie jedno ID encji (clientId, offerId, contractId lub leadId)',
                path: ['clientId'],
            },
        ),
});

export const updateNoteSchema = z.object({
    params: z.object({
        id: z.string().min(1),
    }),
    body: z.object({
        content: z.string().min(1, 'Treść notatki jest wymagana').max(5000),
    }),
});

export const getNoteSchema = z.object({
    params: z.object({
        id: z.string().min(1),
    }),
});

export const listNotesSchema = z
    .object({
        query: z.object({
            clientId: z.string().optional(),
            offerId: z.string().optional(),
            contractId: z.string().optional(),
            leadId: z.string().optional(),
        }),
    })
    .refine(
        (data) => {
            const ids = [
                data.query.clientId,
                data.query.offerId,
                data.query.contractId,
                data.query.leadId,
            ].filter((v) => v != null && v !== '');
            return ids.length >= 1;
        },
        {
            message: 'Należy podać co najmniej jedno ID encji w query (clientId, offerId, contractId lub leadId)',
            path: ['query'],
        },
    );

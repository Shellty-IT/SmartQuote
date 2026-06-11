// src/validators/calendar.validator.ts
import { z } from 'zod';

const COLOR_VALUES = ['blue', 'green', 'red', 'amber', 'purple', 'pink', 'teal'] as const;

export const createCalendarEventSchema = z.object({
    body: z.object({
        title: z.string().min(1).max(200),
        description: z.string().max(2000).optional().nullable(),
        startAt: z.string().datetime(),
        endAt: z.string().datetime().optional().nullable(),
        allDay: z.boolean().optional().default(false),
        color: z.enum(COLOR_VALUES).optional().default('blue'),
        clientId: z.string().cuid().optional().nullable(),
        offerId: z.string().cuid().optional().nullable(),
        leadId: z.string().cuid().optional().nullable(),
    }),
});

export const updateCalendarEventSchema = z.object({
    params: z.object({ id: z.string().cuid() }),
    body: z.object({
        title: z.string().min(1).max(200).optional(),
        description: z.string().max(2000).optional().nullable(),
        startAt: z.string().datetime().optional(),
        endAt: z.string().datetime().optional().nullable(),
        allDay: z.boolean().optional(),
        color: z.enum(COLOR_VALUES).optional(),
        clientId: z.string().cuid().optional().nullable(),
        offerId: z.string().cuid().optional().nullable(),
        leadId: z.string().cuid().optional().nullable(),
    }),
});

export const getCalendarEventSchema = z.object({
    params: z.object({ id: z.string().cuid() }),
});

export const listCalendarEventsSchema = z.object({
    query: z.object({
        from: z.string().datetime().optional(),
        to: z.string().datetime().optional(),
        clientId: z.string().cuid().optional(),
        offerId: z.string().cuid().optional(),
        leadId: z.string().cuid().optional(),
    }),
});

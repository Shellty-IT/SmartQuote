// src/validators/search.validator.ts
import { z } from 'zod';

export const searchSchema = z.object({
    query: z.object({
        q: z.string().trim().min(1).max(200),
        limit: z
            .string()
            .regex(/^[1-9]\d*$/)
            .refine((value) => Number(value) <= 100, 'Limit nie moĹĽe przekraczaÄ‡ 100')
            .optional()
            .default('10'),
    }),
});

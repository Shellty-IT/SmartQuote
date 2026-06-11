// src/validators/search.validator.ts
import { z } from 'zod';

export const searchSchema = z.object({
    query: z.object({
        q: z.string().min(1).max(200),
        limit: z.string().optional().default('10'),
    }),
});

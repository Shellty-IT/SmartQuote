// src/config/index.ts
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const configSchema = z.object({
    PORT: z.string().default('8080').transform((v) => parseInt(v, 10)),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    CLIENT_URL: z
        .string()
        .url('CLIENT_URL musi być poprawnym URL')
        .default('http://localhost:3000'),
    FRONTEND_URL: z
        .string()
        .url('FRONTEND_URL musi być poprawnym URL')
        .default('http://localhost:3000'),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET musi mieć minimum 32 znaki'),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL jest wymagany'),
    GEMINI_API_KEY: z.string().default(''),
    GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
    CRON_SECRET: z.string().optional(),
    KSEF_MASTER_URL: z.string().default('http://localhost:5000'),
    KSEF_MASTER_API_KEY: z.string().default(''),
    KSEF_AVAILABILITY_CACHE_TTL_MS: z.string().default('300000').transform((v) => parseInt(v, 10)),
});

function validateConfig() {
    const result = configSchema.safeParse(process.env);

    if (!result.success) {
        const formatted = result.error.issues
            .map((issue) => `  • ${issue.path.join('.')}: ${issue.message}`)
            .join('\n');

        process.stderr.write(`❌ Nieprawidłowa konfiguracja środowiskowa:\n${formatted}\n`);
        process.exit(1);
    }

    return result.data;
}

const env = validateConfig();

export const config = {
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
    clientUrl: env.CLIENT_URL,
    frontendUrl: env.FRONTEND_URL,
    jwtSecret: env.JWT_SECRET,
    databaseUrl: env.DATABASE_URL,
    saltRounds: 12,
    gemini: {
        apiKey: env.GEMINI_API_KEY,
        model: env.GEMINI_MODEL,
    },
    cronSecret: env.CRON_SECRET,
    ksef: {
        masterUrl: env.KSEF_MASTER_URL,
        masterApiKey: env.KSEF_MASTER_API_KEY,
        availabilityCacheTtlMs: env.KSEF_AVAILABILITY_CACHE_TTL_MS,
    },
} as const;

export const isDev = config.nodeEnv === 'development';
export const isProd = config.nodeEnv === 'production';
export const isTest = config.nodeEnv === 'test';

export type Config = typeof config;
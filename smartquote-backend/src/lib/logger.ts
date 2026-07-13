// src/lib/logger.ts
import pino from 'pino';
import { config, isDev } from '../config';

export const logger = pino({
    level: process.env.LOG_LEVEL ?? (isDev ? 'debug' : 'info'),
    // Public offer/contract tokens are bearer capabilities — never let them
    // reach log storage in plaintext, even though URLs are separately masked.
    redact: {
        paths: [
            'token', '*.token', 'publicToken', '*.publicToken',
            'password', '*.password', 'pass', '*.pass',
            'apiKey', '*.apiKey', 'authorization', '*.authorization',
            'signatureImage', '*.signatureImage',
        ],
        censor: '[token]',
    },
    transport: isDev
        ? {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
            },
        }
        : undefined,
    base: {
        env: config.nodeEnv,
    },
    formatters: {
        level(label: string) {
            return { level: label };
        },
    },
});

export function createRequestLogger(requestId: string) {
    return logger.child({ requestId });
}

export function createModuleLogger(module: string) {
    return logger.child({ module });
}

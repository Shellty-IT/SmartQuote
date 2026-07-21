// src/app.ts
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { randomUUID } from 'crypto';
import rateLimit from 'express-rate-limit';
import { config, isDev } from './config';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './lib/logger';
import prisma from './lib/prisma';

const app = express();

app.set('trust proxy', 1);

app.use(helmet());

const allowedOrigins = new Set<string>(
    [config.clientUrl, config.frontendUrl, isDev ? 'http://localhost:3000' : null].filter(
        (v): v is string => Boolean(v),
    ),
);

// Vercel mints a fresh, unpredictable *.vercel.app URL for every PR/commit
// preview deployment, so they can never be added to allowedOrigins by exact
// value. Match them by pattern instead, scoped to this project + team only
// (never a bare *.vercel.app wildcard, which would trust every other
// Vercel-hosted site with credentialed requests too).
const VERCEL_PREVIEW_ORIGIN = /^https:\/\/smart-quote-[a-z0-9]+-tomaszs-projects-52a41d56\.vercel\.app$/;

function isAllowedOrigin(origin: string): boolean {
    return allowedOrigins.has(origin) || VERCEL_PREVIEW_ORIGIN.test(origin);
}

app.use(
    cors({
        origin(origin, callback) {
            if (!origin || isAllowedOrigin(origin)) {
                callback(null, true);
            } else {
                callback(new Error(`CORS: origin ${origin} nie jest dozwolony`));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        exposedHeaders: ['Content-Disposition', 'Content-Type', 'Content-Length'],
    }),
);

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Zbyt wiele żądań. Spróbuj ponownie za 15 minut.',
        },
    },
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Zbyt wiele prób logowania. Spróbuj ponownie za 15 minut.',
        },
    },
});

app.use(globalLimiter);
app.use('/api/auth', authLimiter);

// Only these two route groups ever carry base64 image data in the JSON body
// (settings: company logo / avatar upload; offers: website_v2 template
// portfolio screenshots) — everything else is structured text/numbers, so a
// much smaller default closes off unnecessary memory pressure on public and
// unauthenticated routes (login, public offer/contract view, KSeF webhook)
// on Render's 512 MB free tier. body-parser skips re-parsing an already-
// parsed body, so mounting the larger limit first for these two prefixes and
// the smaller default afterwards for everyone else works correctly.
const IMAGE_UPLOAD_JSON_LIMIT = '10mb';
const DEFAULT_JSON_LIMIT = '1mb';

app.use('/api/settings', express.json({ limit: IMAGE_UPLOAD_JSON_LIMIT }));
app.use('/api/offers', express.json({ limit: IMAGE_UPLOAD_JSON_LIMIT }));
app.use(express.json({ limit: DEFAULT_JSON_LIMIT }));
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, _res: Response, next: NextFunction) => {
    (req as Request & { id: string }).id = randomUUID();
    next();
});

// Replace long hex/base64 tokens in URL paths with [token] to prevent sensitive data in logs.
const TOKEN_PATTERN = /\/([a-zA-Z0-9_-]{20,})/g;
function maskTokensInUrl(url: string): string {
    return url.replace(TOKEN_PATTERN, '/[token]');
}

app.use((req: Request, res: Response, next: NextFunction) => {
    const requestId = (req as Request & { id: string }).id;
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info(
            {
                requestId,
                method: req.method,
                url: maskTokensInUrl(req.originalUrl),
                status: res.statusCode,
                duration,
                ip: req.ip,
            },
            'Request completed',
        );
    });

    next();
});

const healthHandler = async (_req: Request, res: Response) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.status(200).json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            services: { database: 'ok' },
        });
    } catch {
        res.status(503).json({
            status: 'degraded',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            services: { database: 'error' },
        });
    }
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

app.use('/api', routes);

app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: `Endpoint ${req.method} ${req.originalUrl} nie istnieje`,
        },
    });
});

app.use(errorHandler);

export default app;
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

app.use(
    cors({
        origin(origin, callback) {
            if (!origin || allowedOrigins.has(origin)) {
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

// Extract user ID from JWT token payload without verification (for rate-limiting key only).
function extractUserIdFromBearer(authHeader: string | undefined): string | null {
    if (!authHeader?.startsWith('Bearer ')) return null;
    try {
        const payload = JSON.parse(
            Buffer.from(authHeader.slice(7).split('.')[1], 'base64').toString(),
        );
        return (payload?.userId as string) || (payload?.id as string) || null;
    } catch {
        return null;
    }
}

const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    // AI endpoints require auth so userId key is always used; IP fallback is last resort only.
    validate: { keyGeneratorIpFallback: false },
    keyGenerator: (req) => {
        const userId = extractUserIdFromBearer(req.headers.authorization);
        return userId ? `ai:user:${userId}` : `ai:ip:${req.ip ?? req.socket.remoteAddress ?? 'unknown'}`;
    },
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Zbyt wiele żądań AI. Spróbuj ponownie za 15 minut.',
        },
    },
});

app.use(globalLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/ai', aiLimiter);

app.use(express.json({ limit: '10mb' }));
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
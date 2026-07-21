// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { DomainError, ExternalServiceError } from '../errors/domain.errors';
import { ZodError } from 'zod';
import { logger } from '../lib/logger';

const PRISMA_ERROR_STATUS: Record<string, { status: number; code: string; message: string }> = {
    P2002: { status: 409, code: 'CONFLICT', message: 'Rekord z takimi danymi już istnieje' },
    P2025: { status: 404, code: 'NOT_FOUND', message: 'Nie znaleziono zasobu' },
    P2003: { status: 409, code: 'CONFLICT', message: 'Operacja narusza powiązania danych' },
};

interface ErrorBody {
    success: false;
    error: {
        code: string;
        message: string;
        details?: unknown;
    };
}

function buildErrorBody(code: string, message: string, details?: unknown): ErrorBody {
    return {
        success: false,
        error: { code, message, ...(details !== undefined ? { details } : {}) },
    };
}

function formatZodErrors(error: ZodError) {
    return error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
    }));
}

// Framework middleware (body-parser's 413 "entity too large", malformed-JSON
// 400s, etc.) throws via the `http-errors` package, which marks its errors
// `expose: true` exactly when the status/message are safe to hand back to the
// client. Without this, those errors fell through to the generic 500 branch
// below and hid a real 413 behind "internal server error".
interface HttpErrorLike {
    status?: number;
    statusCode?: number;
    expose?: boolean;
}

function getExposedHttpStatus(err: unknown): number | null {
    if (typeof err !== 'object' || err === null) return null;
    const candidate = err as HttpErrorLike;
    if (candidate.expose !== true) return null;
    const status = candidate.status ?? candidate.statusCode;
    return typeof status === 'number' && status >= 400 && status < 500 ? status : null;
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
    const requestId = (req as Request & { id?: string }).id;

    if (err instanceof DomainError) {
        logger.warn(
            {
                requestId,
                code: err.code,
                message: err.message,
                statusCode: err.statusCode,
                // Internal detail from external APIs — only in logs, never in response.
                ...(err instanceof ExternalServiceError && err.internalMessage
                    ? { internalMessage: err.internalMessage }
                    : {}),
            },
            'Domain error',
        );

        res.status(err.statusCode).json(buildErrorBody(err.code, err.message));
        return;
    }

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        const mapped = PRISMA_ERROR_STATUS[err.code];

        if (mapped) {
            logger.warn(
                { requestId, prismaCode: err.code, meta: err.meta },
                'Prisma known request error',
            );
            res.status(mapped.status).json(buildErrorBody(mapped.code, mapped.message));
            return;
        }

        logger.error(
            { requestId, prismaCode: err.code, meta: err.meta },
            'Unmapped Prisma error',
        );
        res.status(500).json(buildErrorBody('INTERNAL_ERROR', 'Wystąpił wewnętrzny błąd serwera'));
        return;
    }

    if (err instanceof ZodError) {
        logger.warn(
            {
                requestId,
                issues: err.issues,
            },
            'Validation error',
        );

        res.status(422).json(
            buildErrorBody('VALIDATION_ERROR', 'Dane wejściowe są nieprawidłowe', formatZodErrors(err)),
        );
        return;
    }

    const exposedStatus = getExposedHttpStatus(err);
    if (exposedStatus !== null && err instanceof Error) {
        logger.warn({ requestId, status: exposedStatus, message: err.message }, 'HTTP request error');
        res.status(exposedStatus).json(buildErrorBody('BAD_REQUEST', err.message));
        return;
    }

    if (err instanceof Error) {
        const isDev = process.env.NODE_ENV === 'development';

        logger.error(
            {
                requestId,
                error: err,
                stack: err.stack,
            },
            'Unhandled error',
        );

        res.status(500).json(
            buildErrorBody('INTERNAL_ERROR', isDev ? err.message : 'Wystąpił wewnętrzny błąd serwera'),
        );
        return;
    }

    logger.error({ requestId, error: err }, 'Unknown error type');
    res.status(500).json(buildErrorBody('INTERNAL_ERROR', 'Wystąpił nieznany błąd'));
}
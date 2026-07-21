import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { errorHandler } from '../middleware/errorHandler';
import { NotFoundError } from '../errors/domain.errors';

function mockResponse() {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

function prismaError(code: string, meta?: Record<string, unknown>) {
    return new Prisma.PrismaClientKnownRequestError('boom', {
        code,
        clientVersion: '5.22.0',
        meta,
    });
}

// Mirrors the shape http-errors gives body-parser's 413/400 errors: a plain
// Error with .status/.expose set, not a specific class.
function httpError(status: number, message: string, expose = true) {
    const err = new Error(message) as Error & { status: number; expose: boolean };
    err.status = status;
    err.expose = expose;
    return err;
}

describe('errorHandler', () => {
    const req = { id: 'req-1' } as unknown as Request;
    const next = jest.fn() as unknown as NextFunction;

    it('maps DomainError to its own status code', () => {
        const res = mockResponse();
        errorHandler(new NotFoundError('Oferta'), req, res, next);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ success: false, error: expect.objectContaining({ code: 'NOT_FOUND' }) }),
        );
    });

    it('maps Prisma P2002 unique violation to 409 CONFLICT', () => {
        const res = mockResponse();
        errorHandler(prismaError('P2002'), req, res, next);
        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ error: expect.objectContaining({ code: 'CONFLICT' }) }),
        );
    });

    it('maps Prisma P2025 record-not-found to 404 NOT_FOUND', () => {
        const res = mockResponse();
        errorHandler(prismaError('P2025'), req, res, next);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ error: expect.objectContaining({ code: 'NOT_FOUND' }) }),
        );
    });

    it('maps Prisma P2003 FK violation to 409 CONFLICT', () => {
        const res = mockResponse();
        errorHandler(prismaError('P2003'), req, res, next);
        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ error: expect.objectContaining({ code: 'CONFLICT' }) }),
        );
    });

    it('falls back to 500 for unmapped Prisma codes without leaking details', () => {
        const res = mockResponse();
        errorHandler(prismaError('P2011'), req, res, next);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ error: expect.objectContaining({ code: 'INTERNAL_ERROR' }) }),
        );
    });

    it('maps ZodError to 422 VALIDATION_ERROR', () => {
        const res = mockResponse();
        const zodError = new ZodError([
            { path: ['email'], message: 'Invalid email', code: 'custom' },
        ]);
        errorHandler(zodError, req, res, next);
        expect(res.status).toHaveBeenCalledWith(422);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ error: expect.objectContaining({ code: 'VALIDATION_ERROR' }) }),
        );
    });

    it('respects an exposed 413 payload-too-large error from body-parser', () => {
        const res = mockResponse();
        errorHandler(httpError(413, 'request entity too large'), req, res, next);
        expect(res.status).toHaveBeenCalledWith(413);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                error: expect.objectContaining({ code: 'BAD_REQUEST', message: 'request entity too large' }),
            }),
        );
    });

    it('respects an exposed 400 malformed-JSON error from body-parser', () => {
        const res = mockResponse();
        errorHandler(httpError(400, 'Unexpected token in JSON'), req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('ignores a non-exposed status field and falls back to 500', () => {
        const res = mockResponse();
        errorHandler(httpError(413, 'should not be trusted', false), req, res, next);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ error: expect.objectContaining({ code: 'INTERNAL_ERROR' }) }),
        );
    });

    it('falls back to 500 for unrecognized errors', () => {
        const res = mockResponse();
        errorHandler(new Error('unexpected'), req, res, next);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ error: expect.objectContaining({ code: 'INTERNAL_ERROR' }) }),
        );
    });
});

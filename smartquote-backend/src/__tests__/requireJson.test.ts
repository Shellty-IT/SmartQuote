import type { NextFunction, Request, Response } from 'express';
import { UnsupportedMediaTypeError } from '../errors/domain.errors';
import { requireJson } from '../middleware/requireJson';

function runWith(contentType: string | boolean | null) {
    const req = { is: jest.fn().mockReturnValue(contentType) } as unknown as Request;
    const next = jest.fn();
    requireJson(req, {} as Response, next as NextFunction);
    return next;
}

describe('requireJson', () => {
    it('accepts application/json variants recognized by Express', () => {
        const next = runWith('application/json');
        expect(next).toHaveBeenCalledWith();
    });

    it.each([false, null])('rejects non-JSON content with HTTP 415', (contentType) => {
        const next = runWith(contentType);
        const error = next.mock.calls[0][0] as UnsupportedMediaTypeError;
        expect(error).toBeInstanceOf(UnsupportedMediaTypeError);
        expect(error.statusCode).toBe(415);
        expect(error.code).toBe('UNSUPPORTED_MEDIA_TYPE');
    });
});

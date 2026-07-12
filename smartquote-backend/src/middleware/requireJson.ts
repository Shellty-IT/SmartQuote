import { NextFunction, Request, Response } from 'express';
import { UnsupportedMediaTypeError } from '../errors/domain.errors';

/**
 * Public mutations accept JSON only. Cross-site HTML forms cannot submit this
 * media type, while browser JSON requests require a CORS preflight.
 */
export function requireJson(req: Request, _res: Response, next: NextFunction): void {
    if (!req.is('application/json')) {
        next(new UnsupportedMediaTypeError('Wymagany jest Content-Type application/json'));
        return;
    }

    next();
}

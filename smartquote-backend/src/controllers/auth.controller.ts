// smartquote_backend/src/controllers/auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { successResponse } from '../utils/apiResponse';
import type { AuthenticatedRequest } from '../types';

export class AuthController {
    async register(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await authService.register(req.body);
            return successResponse(res, { ...result, message: 'Konto utworzone pomyślnie' }, 201);
        } catch (err) {
            return next(err);
        }
    }

    async login(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await authService.login(req.body);
            return successResponse(res, result);
        } catch (err) {
            return next(err);
        }
    }

    async me(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const user = await authService.getMe(req.user!.id);
            return successResponse(res, user);
        } catch (err) {
            return next(err);
        }
    }

}

export const authController = new AuthController();

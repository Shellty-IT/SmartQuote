// src/controllers/leads.controller.ts
import { NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from '../types';
import { leadsService } from '../services/leads.service';
import { successResponse, paginatedResponse } from '../utils/apiResponse';

export class LeadsController {
    async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const lead = await leadsService.create(req.user!.id, req.body);
            return successResponse(res, lead, 201);
        } catch (err) {
            return next(err);
        }
    }

    async findById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const lead = await leadsService.findById(req.params.id, req.user!.id);
            return successResponse(res, lead);
        } catch (err) {
            return next(err);
        }
    }

    async findAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { leads, total, page, limit } = await leadsService.findAll(
                req.user!.id,
                req.query as Record<string, string>,
            );
            return paginatedResponse(res, leads, total, page, limit);
        } catch (err) {
            return next(err);
        }
    }

    async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const lead = await leadsService.update(req.params.id, req.user!.id, req.body);
            return successResponse(res, lead);
        } catch (err) {
            return next(err);
        }
    }

    async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            await leadsService.delete(req.params.id, req.user!.id);
            return successResponse(res, { message: 'Lead usunięty' });
        } catch (err) {
            return next(err);
        }
    }

    async convert(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const result = await leadsService.convert(req.params.id, req.user!.id, req.body);
            return successResponse(res, result);
        } catch (err) {
            return next(err);
        }
    }

    async getStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const stats = await leadsService.getStats(req.user!.id);
            return successResponse(res, stats);
        } catch (err) {
            return next(err);
        }
    }
}

export const leadsController = new LeadsController();

// src/controllers/clients.controller.ts
import { NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from '../types';
import { clientsService } from '../services/clients.service';
import { successResponse, paginatedResponse } from '../utils/apiResponse';
import { NotFoundError } from '../errors/domain.errors';

export class ClientsController {
    async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const client = await clientsService.create(req.user!.id, req.body);
            return successResponse(res, client, 201);
        } catch (err) {
            return next(err);
        }
    }

    async findById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const client = await clientsService.findById(req.params.id, req.user!.id);
            if (!client) throw new NotFoundError('Klient');
            return successResponse(res, client);
        } catch (err) {
            return next(err);
        }
    }

    async findAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { clients, total, page, limit } = await clientsService.findAll(
                req.user!.id,
                req.query as Record<string, string>,
            );
            return paginatedResponse(res, clients, total, page, limit);
        } catch (err) {
            return next(err);
        }
    }

    async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const client = await clientsService.update(req.params.id, req.user!.id, req.body);
            if (!client) throw new NotFoundError('Klient');
            return successResponse(res, client);
        } catch (err) {
            return next(err);
        }
    }

    async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            await clientsService.delete(req.params.id, req.user!.id);
            return successResponse(res, { message: 'Klient usunięty' });
        } catch (err) {
            return next(err);
        }
    }

    async getStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const stats = await clientsService.getStats(req.user!.id);
            return successResponse(res, stats);
        } catch (err) {
            return next(err);
        }
    }
}

export const clientsController = new ClientsController();

// src/controllers/notes.controller.ts
import { NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from '../types';
import { notesService } from '../services/notes.service';
import { successResponse } from '../utils/apiResponse';

export class NotesController {
    async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const note = await notesService.create(req.user!.id, req.body);
            return successResponse(res, note, 201);
        } catch (err) {
            return next(err);
        }
    }

    async findByEntity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { clientId, offerId, contractId, leadId } = req.query as {
                clientId?: string;
                offerId?: string;
                contractId?: string;
                leadId?: string;
            };
            const notes = await notesService.findByEntity(req.user!.id, {
                clientId,
                offerId,
                contractId,
                leadId,
            });
            return successResponse(res, notes);
        } catch (err) {
            return next(err);
        }
    }

    async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const note = await notesService.update(req.params.id, req.user!.id, req.body.content);
            return successResponse(res, note);
        } catch (err) {
            return next(err);
        }
    }

    async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            await notesService.delete(req.params.id, req.user!.id);
            return successResponse(res, { message: 'Notatka usunięta' });
        } catch (err) {
            return next(err);
        }
    }
}

export const notesController = new NotesController();

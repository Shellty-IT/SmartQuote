// src/controllers/calendar.controller.ts
import { NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from '../types';
import { calendarService } from '../services/calendar.service';
import { successResponse } from '../utils/apiResponse';

export class CalendarController {
    async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const event = await calendarService.create(req.user!.id, req.body);
            return successResponse(res, event, 201);
        } catch (err) {
            return next(err);
        }
    }

    async findById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const event = await calendarService.findById(req.params.id, req.user!.id);
            return successResponse(res, event);
        } catch (err) {
            return next(err);
        }
    }

    async findAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { from, to, clientId, offerId, leadId } = req.query as Record<string, string | undefined>;
            const events = await calendarService.findAll(req.user!.id, {
                from,
                to,
                clientId,
                offerId,
                leadId,
            });
            return successResponse(res, { events, total: events.length });
        } catch (err) {
            return next(err);
        }
    }

    async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const event = await calendarService.update(req.params.id, req.user!.id, req.body);
            return successResponse(res, event);
        } catch (err) {
            return next(err);
        }
    }

    async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            await calendarService.delete(req.params.id, req.user!.id);
            return successResponse(res, { message: 'Wydarzenie usunięte' });
        } catch (err) {
            return next(err);
        }
    }
}

export const calendarController = new CalendarController();

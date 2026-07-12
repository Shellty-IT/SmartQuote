import { NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from '../types';
import { dashboardService } from '../services/dashboard.service';
import { successResponse } from '../utils/apiResponse';

export class DashboardController {
    async getSidebarStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const stats = await dashboardService.getSidebarStats(req.user!.id);
            return successResponse(res, stats);
        } catch (error) {
            return next(error);
        }
    }
}

export const dashboardController = new DashboardController();

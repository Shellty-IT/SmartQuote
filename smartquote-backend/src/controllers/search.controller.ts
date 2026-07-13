// src/controllers/search.controller.ts
import { NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from '../types';
import { searchService } from '../services/search.service';
import { successResponse } from '../utils/apiResponse';
import { parseQueryInt } from '../utils/queryParsers';

export class SearchController {
    async search(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const q = req.query.q as string;
            const limit = parseQueryInt(req.query.limit as string | undefined, 10, 100);
            const result = await searchService.search(req.user!.id, q, limit);
            return successResponse(res, result);
        } catch (err) {
            return next(err);
        }
    }
}

export const searchController = new SearchController();

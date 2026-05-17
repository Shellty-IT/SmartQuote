// smartquote_backend/src/controllers/notifications.controller.ts

import { Request, Response } from 'express';
import { notificationService } from '../services/notification.service';
import { successResponse, paginatedResponse, errorResponse } from '../utils/apiResponse';
import { createModuleLogger } from '../lib/logger';
import { parseQueryInt } from '../utils/queryParsers';

const log = createModuleLogger('notifications');

export const getNotifications = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const page = parseQueryInt(req.query.page as string | undefined, 1);
        const limit = parseQueryInt(req.query.limit as string | undefined, 10, 100);

        const result = await notificationService.list(userId, page, limit);
        return paginatedResponse(res, result.notifications, result.total, result.page, result.limit);
    } catch (error: unknown) {
        log.error({ err: error, userId: req.user?.id }, 'List error');
        return errorResponse(res, 'INTERNAL_ERROR', 'Błąd pobierania powiadomień', 500);
    }
};

export const getUnreadCount = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const count = await notificationService.getUnreadCount(userId);
        return successResponse(res, { count });
    } catch (error: unknown) {
        log.error({ err: error, userId: req.user?.id }, 'UnreadCount error');
        return errorResponse(res, 'INTERNAL_ERROR', 'Błąd pobierania liczby powiadomień', 500);
    }
};

export const markAsRead = async (req: Request<{ id: string }>, res: Response) => {
    try {
        const userId = req.user!.id;
        const notificationId = req.params.id;

        await notificationService.markAsRead(userId, notificationId);
        return successResponse(res, { marked: true });
    } catch (error: unknown) {
        log.error({ err: error, userId: req.user?.id, notificationId: req.params.id }, 'MarkAsRead error');
        return errorResponse(res, 'INTERNAL_ERROR', 'Błąd oznaczania powiadomienia', 500);
    }
};

export const markAllAsRead = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        await notificationService.markAllAsRead(userId);
        return successResponse(res, { marked: true });
    } catch (error: unknown) {
        log.error({ err: error, userId: req.user?.id }, 'MarkAllAsRead error');
        return errorResponse(res, 'INTERNAL_ERROR', 'Błąd oznaczania powiadomień', 500);
    }
};

export const deleteNotification = async (req: Request<{ id: string }>, res: Response) => {
    try {
        const userId = req.user!.id;
        const notificationId = req.params.id;

        await notificationService.deleteNotification(userId, notificationId);
        return successResponse(res, { deleted: true });
    } catch (error: unknown) {
        log.error({ err: error, userId: req.user?.id, notificationId: req.params.id }, 'Delete error');
        return errorResponse(res, 'INTERNAL_ERROR', 'Błąd usuwania powiadomienia', 500);
    }
};

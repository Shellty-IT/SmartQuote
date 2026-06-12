// smartquote_backend/src/controllers/followupReminder.controller.ts
import { Request, Response } from 'express';
import { followUpReminderService } from '../services/followupReminder.service';
import { successResponse, errorResponse } from '../utils/apiResponse';
import { config } from '../config';
import { createModuleLogger } from '../lib/logger';

const log = createModuleLogger('followup-reminder-ctrl');

function checkCronAuth(req: Request, res: Response): boolean {
    const expectedSecret = config.cronSecret;
    // Deny unconditionally when CRON_SECRET is not configured — fail-closed.
    if (!expectedSecret || req.headers['x-cron-secret'] !== expectedSecret) {
        errorResponse(res, 'UNAUTHORIZED', 'Invalid cron secret', 401);
        return false;
    }
    return true;
}

export const triggerReminders = async (req: Request, res: Response) => {
    try {
        if (!checkCronAuth(req, res)) return;

        const result = await followUpReminderService.processOverdueFollowUps();

        return successResponse(res, {
            processed: result.processed,
            errors: result.errors,
            skipped: result.skipped,
        });
    } catch (error: unknown) {
        log.error({ err: error }, 'Trigger error');
        return errorResponse(res, 'INTERNAL_ERROR', 'Błąd przetwarzania przypomnień', 500);
    }
};

export const getReminderStatus = async (req: Request, res: Response) => {
    try {
        if (!checkCronAuth(req, res)) return;

        const status = followUpReminderService.getStatus();
        return successResponse(res, status);
    } catch (error: unknown) {
        log.error({ err: error }, 'Status error');
        return errorResponse(res, 'INTERNAL_ERROR', 'Błąd pobierania statusu', 500);
    }
};
// src/routes/calendar.routes.ts
import { Router } from 'express';
import { calendarController } from '../controllers/calendar.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import {
    createCalendarEventSchema,
    updateCalendarEventSchema,
    getCalendarEventSchema,
    listCalendarEventsSchema,
} from '../validators/calendar.validator';

const router = Router();

router.use(authenticate);

router.get('/', validate(listCalendarEventsSchema), calendarController.findAll.bind(calendarController));
router.get('/:id', validate(getCalendarEventSchema), calendarController.findById.bind(calendarController));
router.post('/', validate(createCalendarEventSchema), calendarController.create.bind(calendarController));
router.patch('/:id', validate(updateCalendarEventSchema), calendarController.update.bind(calendarController));
router.delete('/:id', validate(getCalendarEventSchema), calendarController.delete.bind(calendarController));

export default router;

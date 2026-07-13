// src/services/calendar.service.ts
import { calendarRepository, CalendarEventsFilter } from '../repositories/calendar.repository';
import { NotFoundError } from '../errors/domain.errors';
import { createModuleLogger } from '../lib/logger';
import type { CreateCalendarEventInput, UpdateCalendarEventInput } from '../types';

const logger = createModuleLogger('CalendarService');

export class CalendarService {
    async create(userId: string, data: CreateCalendarEventInput) {
        logger.info('Creating calendar event', { userId, title: data.title });
        await calendarRepository.validateRelations(userId, data);
        return calendarRepository.create(userId, data);
    }

    async findById(id: string, userId: string) {
        const event = await calendarRepository.findById(id, userId);
        if (!event) throw new NotFoundError('CalendarEvent');
        return event;
    }

    async findAll(userId: string, filter: CalendarEventsFilter) {
        return calendarRepository.findAll(userId, filter);
    }

    async update(id: string, userId: string, data: UpdateCalendarEventInput) {
        const existing = await calendarRepository.findById(id, userId);
        if (!existing) throw new NotFoundError('CalendarEvent');
        await calendarRepository.validateRelations(userId, data);
        return calendarRepository.update(id, userId, data);
    }

    async delete(id: string, userId: string) {
        const existing = await calendarRepository.findById(id, userId);
        if (!existing) throw new NotFoundError('CalendarEvent');
        return calendarRepository.delete(id, userId);
    }
}

export const calendarService = new CalendarService();

// src/repositories/calendar.repository.ts
import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';
import type { CreateCalendarEventInput, UpdateCalendarEventInput } from '../types';

const eventInclude = {
    client: { select: { id: true, name: true } },
    offer: { select: { id: true, title: true, number: true } },
    lead: { select: { id: true, name: true, company: true } },
} as const;

export interface CalendarEventsFilter {
    from?: string;
    to?: string;
    clientId?: string;
    offerId?: string;
    leadId?: string;
}

export class CalendarRepository {
    async create(userId: string, data: CreateCalendarEventInput) {
        return prisma.calendarEvent.create({
            data: {
                userId,
                title: data.title,
                description: data.description ?? null,
                startAt: new Date(data.startAt),
                endAt: data.endAt ? new Date(data.endAt) : null,
                allDay: data.allDay ?? false,
                color: data.color ?? 'blue',
                clientId: data.clientId ?? null,
                offerId: data.offerId ?? null,
                leadId: data.leadId ?? null,
            },
            include: eventInclude,
        });
    }

    async findById(id: string, userId: string) {
        return prisma.calendarEvent.findFirst({
            where: { id, userId },
            include: eventInclude,
        });
    }

    async findAll(userId: string, filter: CalendarEventsFilter) {
        const where: Prisma.CalendarEventWhereInput = { userId };

        if (filter.from && filter.to) {
            where.startAt = { gte: new Date(filter.from) };
            where.OR = [
                { endAt: { lte: new Date(filter.to) } },
                { endAt: null },
            ];
        } else if (filter.from) {
            where.startAt = { gte: new Date(filter.from) };
        } else if (filter.to) {
            where.startAt = { lte: new Date(filter.to) };
        }

        if (filter.clientId) where.clientId = filter.clientId;
        if (filter.offerId) where.offerId = filter.offerId;
        if (filter.leadId) where.leadId = filter.leadId;

        return prisma.calendarEvent.findMany({
            where,
            include: eventInclude,
            orderBy: { startAt: 'asc' },
        });
    }

    async update(id: string, userId: string, data: UpdateCalendarEventInput) {
        return prisma.$transaction(async (tx) => {
            const record = await tx.calendarEvent.findFirst({ where: { id, userId }, select: { id: true } });
            if (!record) return null;
            return tx.calendarEvent.update({
                where: { id },
                data: {
                    ...(data.title !== undefined ? { title: data.title } : {}),
                    ...(data.description !== undefined ? { description: data.description } : {}),
                    ...(data.startAt !== undefined ? { startAt: new Date(data.startAt) } : {}),
                    ...(data.endAt !== undefined ? { endAt: data.endAt ? new Date(data.endAt) : null } : {}),
                    ...(data.allDay !== undefined ? { allDay: data.allDay } : {}),
                    ...(data.color !== undefined ? { color: data.color } : {}),
                    ...(data.clientId !== undefined ? { clientId: data.clientId } : {}),
                    ...(data.offerId !== undefined ? { offerId: data.offerId } : {}),
                    ...(data.leadId !== undefined ? { leadId: data.leadId } : {}),
                },
                include: eventInclude,
            });
        });
    }

    async delete(id: string, userId: string): Promise<boolean> {
        const result = await prisma.calendarEvent.deleteMany({ where: { id, userId } });
        return result.count > 0;
    }
}

export const calendarRepository = new CalendarRepository();

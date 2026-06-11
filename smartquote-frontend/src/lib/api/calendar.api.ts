// src/lib/api/calendar.api.ts

import { api } from './client';
import type {
    CalendarEvent,
    CreateCalendarEventInput,
    UpdateCalendarEventInput,
} from '@/types/calendar.types';

export const calendarApi = {
    list: (params?: { from?: string; to?: string; clientId?: string; offerId?: string; leadId?: string }) =>
        api.get<CalendarEvent[]>('/calendar', params as Record<string, string | undefined>),
    get: (id: string) =>
        api.get<CalendarEvent>(`/calendar/${id}`),
    create: async (data: CreateCalendarEventInput): Promise<CalendarEvent> => {
        const response = await api.post<CalendarEvent>('/calendar', data);
        return response.data as CalendarEvent;
    },
    update: async (id: string, data: UpdateCalendarEventInput): Promise<CalendarEvent> => {
        const response = await api.put<CalendarEvent>(`/calendar/${id}`, data);
        return response.data as CalendarEvent;
    },
    delete: async (id: string): Promise<void> => {
        await api.delete<{ message: string }>(`/calendar/${id}`);
    },
};

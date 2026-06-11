'use client';

import { useState, useEffect, useCallback } from 'react';
import { calendarApi } from '@/lib/api/calendar.api';
import type { CalendarEvent } from '@/types/calendar.types';

interface UseCalendarEventsResult {
    events: CalendarEvent[];
    isLoading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

export function useCalendarEvents(params?: { from?: string; to?: string }): UseCalendarEventsResult {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchEvents = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await calendarApi.list(params);
            setEvents(response.data || []);
        } catch {
            setError('Nie udało się załadować zdarzeń');
            setEvents([]);
        } finally {
            setIsLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(params)]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    return { events, isLoading, error, refresh: fetchEvents };
}

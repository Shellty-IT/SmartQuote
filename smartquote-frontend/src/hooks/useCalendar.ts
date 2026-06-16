'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { calendarApi } from '@/lib/api/calendar.api';
import type { CalendarEvent } from '@/types/calendar.types';

interface UseCalendarEventsResult {
    events: CalendarEvent[];
    isLoading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

export function useCalendarEvents(params?: { from?: string; to?: string }): UseCalendarEventsResult {
    const { data: rawData, isLoading, error, refetch } = useQuery({
        queryKey: ['calendar-events', params],
        queryFn: () => calendarApi.list(params),
    });

    const events = useMemo(() => {
        // Defensive: accept either a bare array or a legacy { events, total } envelope.
        const data = rawData?.data as unknown;
        if (Array.isArray(data)) return data as CalendarEvent[];
        if (data && typeof data === 'object' && Array.isArray((data as { events?: unknown }).events)) {
            return (data as { events: CalendarEvent[] }).events;
        }
        return [];
    }, [rawData]);

    return {
        events,
        isLoading,
        error: error ? 'Nie udało się załadować zdarzeń' : null,
        refresh: async () => { await refetch(); },
    };
}

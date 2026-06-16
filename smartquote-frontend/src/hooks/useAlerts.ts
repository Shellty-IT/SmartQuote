'use client';
import { useQuery } from '@tanstack/react-query';
import { ai } from '@/lib/api';
import type { Alert } from '@/types/alert.types';

export function useAlerts() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['alerts'],
        queryFn: () => ai.getAlerts(),
    });

    return {
        alerts: (data?.alerts ?? []) as Alert[],
        isLoading,
        error: error ? 'Nie udało się załadować alertów' : null,
    };
}

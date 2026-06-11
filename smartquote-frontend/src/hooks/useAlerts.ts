'use client';
import { useState, useEffect } from 'react';
import { ai } from '@/lib/api';
import type { Alert } from '@/types/alert.types';

export function useAlerts() {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        ai.getAlerts()
            .then(res => setAlerts(res.alerts))
            .catch(() => setError('Nie udało się załadować alertów'))
            .finally(() => setIsLoading(false));
    }, []);

    return { alerts, isLoading, error };
}

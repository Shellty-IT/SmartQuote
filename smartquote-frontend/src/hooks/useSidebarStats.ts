// SmartQuote-AI/src/hooks/useSidebarStats.ts

'use client';

import { useState, useEffect, useCallback } from 'react';
import { offersApi, clientsApi, contractsApi, followUpsApi, ApiError } from '@/lib/api';

interface SidebarStats {
    offers: number;
    contracts: number;
    clients: number;
    followups: number;
}

export function useSidebarStats() {
    const [stats, setStats] = useState<SidebarStats>({
        offers: 0,
        contracts: 0,
        clients: 0,
        followups: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const [offersRes, clientsRes, contractsRes, followupsRes] = await Promise.allSettled([
                offersApi.stats(),
                clientsApi.stats(),
                contractsApi.stats(),
                followUpsApi.stats(),
            ]);

            let offersCount = 0;
            let clientsCount = 0;
            let contractsCount = 0;
            let followupsCount = 0;

            if (offersRes.status === 'fulfilled' && offersRes.value.data) {
                const data = offersRes.value.data;
                offersCount = data.total || 0;
            }

            if (clientsRes.status === 'fulfilled' && clientsRes.value.data) {
                const data = clientsRes.value.data;
                clientsCount = data.total || 0;
            }

            if (contractsRes.status === 'fulfilled' && contractsRes.value.data) {
                const data = contractsRes.value.data;
                contractsCount = data.total || 0;
            }

            if (followupsRes.status === 'fulfilled' && followupsRes.value.data) {
                const data = followupsRes.value.data;
                followupsCount =
                    (data.byStatus?.PENDING || 0) +
                    (data.overdue || 0);
            }

            setStats({
                offers: offersCount,
                contracts: contractsCount,
                clients: clientsCount,
                followups: followupsCount,
            });
        } catch (err) {
            const message = err instanceof ApiError ? err.message : 'Błąd pobierania statystyk';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();

        const interval = setInterval(fetchStats, 60000);
        return () => clearInterval(interval);
    }, [fetchStats]);

    return { stats, isLoading, error, refresh: fetchStats };
}
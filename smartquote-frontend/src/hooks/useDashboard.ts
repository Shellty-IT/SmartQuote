// src/hooks/useDashboard.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { offersApi, clientsApi, ApiError } from '@/lib/api';
import { ClientsStats, OffersStats, Offer } from '@/types';

interface UseDashboardReturn {
    clientsStats: ClientsStats | null;
    offersStats: OffersStats | null;
    recentOffers: Offer[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export function useDashboard(): UseDashboardReturn {
    const [clientsStats, setClientsStats] = useState<ClientsStats | null>(null);
    const [offersStats, setOffersStats] = useState<OffersStats | null>(null);
    const [recentOffers, setRecentOffers] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // Pobieramy wszystkie dane równolegle
            const [clientsStatsRes, offersStatsRes, recentOffersRes] = await Promise.allSettled([
                clientsApi.stats(),
                offersApi.stats(),
                offersApi.list({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
            ]);

            // Przetwarzanie statystyk klientów
            if (clientsStatsRes.status === 'fulfilled' && clientsStatsRes.value.data) {
                setClientsStats(clientsStatsRes.value.data);
            } else {
                console.error('Błąd pobierania statystyk klientów');
                setClientsStats({
                    total: 0,
                    active: 0,
                    inactive: 0,
                    withOffers: 0,
                });
            }

            // Przetwarzanie statystyk ofert
            if (offersStatsRes.status === 'fulfilled' && offersStatsRes.value.data) {
                setOffersStats(offersStatsRes.value.data);
            } else {
                console.error('Błąd pobierania statystyk ofert');
                setOffersStats({
                    total: 0,
                    byStatus: {
                        DRAFT: { count: 0, value: 0 },
                        SENT: { count: 0, value: 0 },
                        VIEWED: { count: 0, value: 0 },
                        NEGOTIATION: { count: 0, value: 0 },
                        ACCEPTED: { count: 0, value: 0 },
                        REJECTED: { count: 0, value: 0 },
                        EXPIRED: { count: 0, value: 0 },
                    },
                    totalValue: 0,
                    acceptedValue: 0,
                });
            }

            // Przetwarzanie ostatnich ofert
            if (recentOffersRes.status === 'fulfilled' && recentOffersRes.value.data) {
                setRecentOffers(recentOffersRes.value.data);
            } else {
                console.error('Błąd pobierania ostatnich ofert');
                setRecentOffers([]);
            }

        } catch (err) {
            const message = err instanceof ApiError ? err.message : 'Błąd pobierania danych dashboard';
            setError(message);
            console.error('Błąd dashboard:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    return {
        clientsStats,
        offersStats,
        recentOffers,
        loading,
        error,
        refetch: fetchDashboardData,
    };
}
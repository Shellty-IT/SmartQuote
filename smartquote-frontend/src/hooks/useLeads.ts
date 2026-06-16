'use client';

import { useQuery } from '@tanstack/react-query';
import { leadsApi } from '@/lib/api/leads.api';
import { leadKeys } from '@/lib/queryKeys';
import type { Lead, LeadsStats } from '@/types/lead.types';

interface UseLeadsResult {
    leads: Lead[];
    total: number;
    isLoading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

export function useLeads(params?: Record<string, string | number | boolean | undefined>): UseLeadsResult {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: leadKeys.list(params),
        queryFn: () => leadsApi.list(params),
    });

    return {
        leads: data?.data ?? [],
        total: data?.meta?.total ?? (data?.data?.length ?? 0),
        isLoading,
        error: error instanceof Error ? error.message : error ? 'Failed to fetch leads' : null,
        refresh: async () => { await refetch(); },
    };
}

export function useLead(id: string) {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: leadKeys.detail(id),
        queryFn: () => leadsApi.get(id),
        enabled: !!id,
    });

    return {
        lead: data?.data ?? null,
        isLoading,
        error: error instanceof Error ? error.message : error ? 'Failed to fetch lead' : null,
        refresh: async () => { await refetch(); },
    };
}

export function useLeadsStats() {
    const { data, isLoading } = useQuery({
        queryKey: leadKeys.stats,
        queryFn: () => leadsApi.stats(),
        retry: false,
    });

    return { stats: (data?.data ?? null) as LeadsStats | null, isLoading };
}

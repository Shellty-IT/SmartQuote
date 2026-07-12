'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi, type SidebarStatsResponse } from '@/lib/api';
import { dashboardKeys, queryStaleTime } from '@/lib/queryKeys';
import {
    affectsSidebarStats,
    DATA_MUTATION_EVENT,
    type DataMutationDetail,
} from '@/lib/data-mutation-events';

export interface SidebarStats {
    offers: number | undefined;
    contracts: number | undefined;
    clients: number | undefined;
    followups: number | undefined;
    leads: number | undefined;
}

type SidebarStatKey = keyof SidebarStats;

export function mapSidebarStats(
    data: SidebarStatsResponse | undefined,
    isPending: boolean,
): SidebarStats {
    if (isPending && !data) {
        return {
            offers: undefined,
            clients: undefined,
            contracts: undefined,
            followups: undefined,
            leads: undefined,
        };
    }

    return {
        offers: data?.offers ?? 0,
        clients: data?.clients ?? 0,
        contracts: data?.contracts ?? 0,
        followups: data?.followups ?? 0,
        leads: data?.leads ?? 0,
    };
}

export function useSidebarStats() {
    const { data, isPending, error, refetch } = useQuery({
        queryKey: dashboardKeys.sidebarStats,
        queryFn: () => dashboardApi.sidebarStats(),
        staleTime: queryStaleTime.dashboardStats,
        refetchInterval: 60_000,
    });

    useEffect(() => {
        const handleMutation = (event: Event) => {
            const detail = (event as CustomEvent<DataMutationDetail>).detail;
            if (detail && affectsSidebarStats(detail)) {
                void refetch();
            }
        };

        window.addEventListener(DATA_MUTATION_EVENT, handleMutation);
        return () => window.removeEventListener(DATA_MUTATION_EVENT, handleMutation);
    }, [refetch]);

    const stats = mapSidebarStats(data?.data, isPending);
    const loading = Object.fromEntries(
        (Object.keys(stats) as SidebarStatKey[]).map((key) => [key, isPending && stats[key] === undefined]),
    ) as Record<SidebarStatKey, boolean>;

    return {
        stats,
        loading,
        isLoading: isPending,
        error: error?.message ?? null,
    };
}

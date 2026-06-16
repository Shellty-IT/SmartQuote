'use client';

import { useQueries } from '@tanstack/react-query';
import { offersApi, clientsApi, contractsApi, followUpsApi } from '@/lib/api';
import { leadsApi } from '@/lib/api/leads.api';
import { clientKeys, contractKeys, followUpKeys, leadKeys, offerKeys, queryStaleTime } from '@/lib/queryKeys';

interface SidebarStats {
    offers: number | undefined;
    contracts: number | undefined;
    clients: number | undefined;
    followups: number | undefined;
    leads: number | undefined;
}

type SidebarStatKey = keyof SidebarStats;

// Shared query config — each stat is cached independently and shared with entity hooks.
// When useClients/useOffers/etc. invalidate their stats queries, the sidebar updates too.
const STATS_QUERY_CONFIG = {
    staleTime: queryStaleTime.dashboardStats,
    refetchInterval: 60_000,
} as const;

export function useSidebarStats() {
    const [offersRes, clientsRes, contractsRes, followupsRes, leadsRes] = useQueries({
        queries: [
            { queryKey: offerKeys.stats, queryFn: () => offersApi.stats(), ...STATS_QUERY_CONFIG },
            { queryKey: clientKeys.stats, queryFn: () => clientsApi.stats(), ...STATS_QUERY_CONFIG },
            { queryKey: contractKeys.stats, queryFn: () => contractsApi.stats(), ...STATS_QUERY_CONFIG },
            { queryKey: followUpKeys.stats, queryFn: () => followUpsApi.stats(), ...STATS_QUERY_CONFIG },
            { queryKey: leadKeys.stats, queryFn: () => leadsApi.stats(), ...STATS_QUERY_CONFIG },
        ],
    });

    const stats: SidebarStats = {
        offers: offersRes.isLoading ? undefined : offersRes.data?.data?.total ?? 0,
        clients: clientsRes.isLoading ? undefined : clientsRes.data?.data?.total ?? 0,
        contracts: contractsRes.isLoading ? undefined : contractsRes.data?.data?.total ?? 0,
        followups: followupsRes.isLoading ? undefined :
            (followupsRes.data?.data?.byStatus?.PENDING ?? 0) +
            (followupsRes.data?.data?.overdue ?? 0),
        leads: leadsRes.isLoading ? undefined :
            (leadsRes.data?.data?.byStatus?.NEW ?? 0) +
            (leadsRes.data?.data?.byStatus?.CONTACTED ?? 0),
    };

    const loading: Record<SidebarStatKey, boolean> = {
        offers: offersRes.isLoading,
        clients: clientsRes.isLoading,
        contracts: contractsRes.isLoading,
        followups: followupsRes.isLoading,
        leads: leadsRes.isLoading,
    };

    const isLoading = [offersRes, clientsRes, contractsRes, followupsRes, leadsRes].some(
        (r) => r.isLoading,
    );

    const error =
        offersRes.error?.message ??
        clientsRes.error?.message ??
        contractsRes.error?.message ??
        followupsRes.error?.message ??
        leadsRes.error?.message ??
        null;

    return { stats, loading, isLoading, error };
}

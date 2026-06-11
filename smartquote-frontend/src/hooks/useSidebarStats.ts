'use client';

import { useQueries } from '@tanstack/react-query';
import { offersApi, clientsApi, contractsApi, followUpsApi } from '@/lib/api';
import { leadsApi } from '@/lib/api/leads.api';

interface SidebarStats {
    offers: number;
    contracts: number;
    clients: number;
    followups: number;
    leads: number;
}

// Shared query config — each stat is cached independently and shared with entity hooks.
// When useClients/useOffers/etc. invalidate their stats queries, the sidebar updates too.
const STATS_QUERY_CONFIG = {
    staleTime: 30_000,
    refetchInterval: 60_000,
} as const;

export function useSidebarStats() {
    const [offersRes, clientsRes, contractsRes, followupsRes, leadsRes] = useQueries({
        queries: [
            { queryKey: ['offers-stats'], queryFn: () => offersApi.stats(), ...STATS_QUERY_CONFIG },
            { queryKey: ['clients-stats'], queryFn: () => clientsApi.stats(), ...STATS_QUERY_CONFIG },
            { queryKey: ['contracts-stats'], queryFn: () => contractsApi.stats(), ...STATS_QUERY_CONFIG },
            { queryKey: ['followups-stats'], queryFn: () => followUpsApi.stats(), ...STATS_QUERY_CONFIG },
            { queryKey: ['leads-stats'], queryFn: () => leadsApi.stats(), ...STATS_QUERY_CONFIG },
        ],
    });

    const stats: SidebarStats = {
        offers: offersRes.data?.data?.total ?? 0,
        clients: clientsRes.data?.data?.total ?? 0,
        contracts: contractsRes.data?.data?.total ?? 0,
        followups:
            (followupsRes.data?.data?.byStatus?.PENDING ?? 0) +
            (followupsRes.data?.data?.overdue ?? 0),
        leads:
            (leadsRes.data?.data?.byStatus?.NEW ?? 0) +
            (leadsRes.data?.data?.byStatus?.CONTACTED ?? 0),
    };

    const isLoading = [offersRes, clientsRes, contractsRes, followupsRes, leadsRes].some(
        (r) => r.isLoading,
    );

    const error =
        offersRes.error?.message ??
        clientsRes.error?.message ??
        contractsRes.error?.message ??
        null;

    return { stats, isLoading, error };
}

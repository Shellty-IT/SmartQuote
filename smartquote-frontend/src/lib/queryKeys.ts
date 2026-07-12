import type { ClientFilters, OfferFilters } from '@/types';

type QueryParams = Record<string, string | number | boolean | undefined>;

export const queryStaleTime = {
    offers: {
        list: 5_000,
        detail: 5_000,
        stats: 30_000,
    },
    clients: {
        list: 2 * 60_000,
        detail: 5 * 60_000,
        stats: 5 * 60_000,
    },
    dashboardStats: 30_000,
} as const;

export const offerKeys = {
    all: ['offers'] as const,
    list: (filters: OfferFilters) => ['offers', filters] as const,
    detail: (id: string) => ['offer', id] as const,
    stats: ['offers-stats'] as const,
    analytics: (id: string) => ['offer-analytics', id] as const,
    comments: (id: string) => ['offer-comments', id] as const,
};

export const clientKeys = {
    all: ['clients'] as const,
    list: (filters: ClientFilters) => ['clients', filters] as const,
    detail: (id: string) => ['client', id] as const,
    stats: ['clients-stats'] as const,
};

export const contractKeys = {
    all: ['contracts'] as const,
    list: <T extends object>(params: T) => ['contracts', params] as const,
    detail: (id: string) => ['contract', id] as const,
    stats: ['contracts-stats'] as const,
};

export const followUpKeys = {
    all: ['followups'] as const,
    list: <T extends object>(filters: T) => ['followups', filters] as const,
    detail: (id: string) => ['followup', id] as const,
    stats: ['followups-stats'] as const,
};

export const leadKeys = {
    all: ['leads'] as const,
    list: (params?: QueryParams) => ['leads', params] as const,
    detail: (id: string) => ['lead', id] as const,
    stats: ['leads-stats'] as const,
};

export const dashboardKeys = {
    all: ['dashboard'] as const,
    sidebarStats: ['dashboard', 'sidebar-stats'] as const,
};

import { api } from './client';

export interface SidebarStatsResponse {
    offers: number;
    clients: number;
    contracts: number;
    followups: number;
    leads: number;
}

export const dashboardApi = {
    sidebarStats: () => api.get<SidebarStatsResponse>('/dashboard/sidebar-stats'),
};

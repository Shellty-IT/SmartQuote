'use client';

import { useState, useEffect, useCallback } from 'react';
import { leadsApi } from '@/lib/api/leads.api';
import { ApiError } from '@/lib/api';
import type { Lead, LeadsStats } from '@/types/lead.types';

interface UseLeadsResult {
    leads: Lead[];
    total: number;
    isLoading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

export function useLeads(params?: Record<string, string | number | boolean | undefined>): UseLeadsResult {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLeads = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await leadsApi.list(params);
            setLeads(response.data || []);
            setTotal(response.meta?.total || (response.data?.length ?? 0));
        } catch (err) {
            const message = err instanceof ApiError ? err.message : 'Failed to fetch leads';
            setError(message);
            setLeads([]);
        } finally {
            setIsLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(params)]);

    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);

    return { leads, total, isLoading, error, refresh: fetchLeads };
}

export function useLead(id: string) {
    const [lead, setLead] = useState<Lead | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLead = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        setError(null);
        try {
            const response = await leadsApi.get(id);
            setLead(response.data ?? null);
        } catch (err) {
            const message = err instanceof ApiError ? err.message : 'Failed to fetch lead';
            setError(message);
            setLead(null);
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchLead();
    }, [fetchLead]);

    return { lead, isLoading, error, refresh: fetchLead };
}

export function useLeadsStats() {
    const [stats, setStats] = useState<LeadsStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await leadsApi.stats();
            setStats(response.data ?? null);
        } catch {
            // ignore stats errors silently
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return { stats, isLoading };
}

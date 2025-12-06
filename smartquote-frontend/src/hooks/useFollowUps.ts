// src/hooks/useFollowUps.ts

'use client';

import { useState, useEffect, useCallback } from 'react';
import { followUpsApi } from '@/lib/api';
import { FollowUp, FollowUpStats, CreateFollowUpData, UpdateFollowUpData } from '@/types';

interface UseFollowUpsOptions {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    type?: string;
    priority?: string;
    clientId?: string;
    offerId?: string;
    contractId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    overdue?: boolean;
    upcoming?: number;
}

interface PaginationData {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

// Hook dla listy follow-upów
export function useFollowUps(initialOptions: UseFollowUpsOptions = {}) {
    const [followUps, setFollowUps] = useState<FollowUp[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFiltersState] = useState<UseFollowUpsOptions>(initialOptions);

    const fetchFollowUps = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const params: Record<string, any> = {};
            if (filters.page) params.page = filters.page;
            if (filters.limit) params.limit = filters.limit;
            if (filters.search) params.search = filters.search;
            if (filters.status) params.status = filters.status;
            if (filters.type) params.type = filters.type;
            if (filters.priority) params.priority = filters.priority;
            if (filters.clientId) params.clientId = filters.clientId;
            if (filters.offerId) params.offerId = filters.offerId;
            if (filters.contractId) params.contractId = filters.contractId;
            if (filters.sortBy) params.sortBy = filters.sortBy;
            if (filters.sortOrder) params.sortOrder = filters.sortOrder;
            if (filters.overdue) params.overdue = 'true';
            if (filters.upcoming) params.upcoming = filters.upcoming;

            const response = await followUpsApi.list(params);

            if (response.success) {
                setFollowUps(response.data || []);
                setPagination(response.meta || null);
            } else {
                setError(response.error?.message || 'Błąd pobierania follow-upów');
            }
        } catch (err: any) {
            setError(err.message || 'Błąd połączenia z serwerem');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchFollowUps();
    }, [fetchFollowUps]);

    const setFilters = useCallback((newFilters: Partial<UseFollowUpsOptions>) => {
        setFiltersState(prev => ({ ...prev, ...newFilters }));
    }, []);

    const deleteFollowUp = useCallback(async (id: string) => {
        const response = await followUpsApi.delete(id);
        if (response.success) {
            await fetchFollowUps();
        } else {
            throw new Error(response.error?.message || 'Błąd usuwania');
        }
    }, [fetchFollowUps]);

    const completeFollowUp = useCallback(async (id: string) => {
        const response = await followUpsApi.complete(id);
        if (response.success) {
            await fetchFollowUps();
            return response.data;
        } else {
            throw new Error(response.error?.message || 'Błąd oznaczania jako wykonane');
        }
    }, [fetchFollowUps]);

    return {
        followUps,
        pagination,
        loading,
        error,
        filters,
        setFilters,
        deleteFollowUp,
        completeFollowUp,
        refetch: fetchFollowUps,
        total: pagination?.total || 0,
        page: pagination?.page || 1,
        totalPages: pagination?.totalPages || 1,
    };
}

// Hook dla pojedynczego follow-upa
export function useFollowUp(id: string) {
    const [followUp, setFollowUp] = useState<FollowUp | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchFollowUp = useCallback(async () => {
        if (!id) return;

        try {
            setLoading(true);
            setError(null);

            const response = await followUpsApi.get(id);

            if (response.success) {
                setFollowUp(response.data);
            } else {
                setError(response.error?.message || 'Nie znaleziono follow-upa');
            }
        } catch (err: any) {
            setError(err.message || 'Błąd połączenia z serwerem');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchFollowUp();
    }, [fetchFollowUp]);

    return { followUp, loading, error, refetch: fetchFollowUp };
}

// Hook dla statystyk
export function useFollowUpStats() {
    const [stats, setStats] = useState<FollowUpStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        try {
            setLoading(true);
            const response = await followUpsApi.stats();

            if (response.success) {
                setStats(response.data);
            } else {
                setError(response.error?.message || 'Błąd pobierania statystyk');
            }
        } catch (err: any) {
            setError(err.message || 'Błąd połączenia z serwerem');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return { stats, loading, error, refetch: fetchStats };
}
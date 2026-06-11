'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { followUpsApi } from '@/lib/api';
import { FollowUp } from '@/types';

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

function buildParams(filters: UseFollowUpsOptions): Record<string, string | number | boolean> {
    const params: Record<string, string | number | boolean> = {};
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
    return params;
}

export function useFollowUps(initialOptions: UseFollowUpsOptions = {}) {
    const queryClient = useQueryClient();
    const [filters, setFiltersState] = useState<UseFollowUpsOptions>(initialOptions);

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['followups', filters],
        queryFn: () => followUpsApi.list(buildParams(filters)),
    });

    const setFilters = useCallback((newFilters: Partial<UseFollowUpsOptions>) => {
        setFiltersState((prev) => ({ ...prev, ...newFilters }));
    }, []);

    const invalidateAll = async () => {
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['followups'] }),
            queryClient.invalidateQueries({ queryKey: ['followups-stats'] }),
        ]);
    };

    const deleteMutation = useMutation({
        mutationFn: (id: string) => followUpsApi.delete(id),
        onSuccess: invalidateAll,
    });

    const completeMutation = useMutation({
        mutationFn: (id: string) => followUpsApi.complete(id),
        onSuccess: invalidateAll,
    });

    const deleteFollowUp = async (id: string): Promise<void> => {
        const response = await deleteMutation.mutateAsync(id);
        if (!response.success) throw new Error(response.error?.message || 'Delete error');
    };

    const completeFollowUp = async (id: string): Promise<FollowUp | undefined> => {
        const response = await completeMutation.mutateAsync(id);
        if (!response.success) throw new Error(response.error?.message || 'Failed to mark as done');
        return response.data;
    };

    const pagination = data?.meta ?? null;

    return {
        followUps: data?.data || [],
        pagination,
        loading: isLoading,
        error: error?.message ?? null,
        filters,
        setFilters,
        deleteFollowUp,
        completeFollowUp,
        refetch: () => { void refetch(); },
        total: pagination?.total || 0,
        page: pagination?.page || 1,
        totalPages: pagination?.totalPages || 1,
    };
}

export function useFollowUp(id: string) {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['followup', id],
        queryFn: () => followUpsApi.get(id),
        enabled: !!id,
        staleTime: 60_000,
    });

    return {
        followUp: data?.data ?? null,
        loading: isLoading,
        error: error?.message ?? null,
        refetch: () => { void refetch(); },
    };
}

export function useFollowUpStats() {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['followups-stats'],
        queryFn: () => followUpsApi.stats(),
        staleTime: 60_000,
    });

    return {
        stats: data?.data ?? null,
        loading: isLoading,
        error: error?.message ?? null,
        refetch,
    };
}

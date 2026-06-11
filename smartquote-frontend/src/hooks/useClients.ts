'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi, ApiError } from '@/lib/api';
import { Client, ClientFilters, CreateClientInput, UpdateClientInput } from '@/types';

export function useClients(initialFilters: ClientFilters = {}) {
    const queryClient = useQueryClient();
    const [filters, setFiltersState] = useState<ClientFilters>({
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        ...initialFilters,
    });

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['clients', filters],
        queryFn: () => clientsApi.list(filters as Record<string, string | number | boolean | undefined>),
    });

    const setFilters = useCallback((newFilters: Partial<ClientFilters>) => {
        setFiltersState((prev) => ({ ...prev, ...newFilters }));
    }, []);

    const invalidateAll = useCallback(async () => {
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['clients'] }),
            queryClient.invalidateQueries({ queryKey: ['clients-stats'] }),
        ]);
    }, [queryClient]);

    const createMutation = useMutation({
        mutationFn: (input: CreateClientInput) => clientsApi.create(input),
        onSuccess: invalidateAll,
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, input }: { id: string; input: UpdateClientInput }) =>
            clientsApi.update(id, input),
        onSuccess: async (_, { id }) => {
            await invalidateAll();
            await queryClient.invalidateQueries({ queryKey: ['client', id] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => clientsApi.delete(id),
        onSuccess: invalidateAll,
    });

    const createClient = async (input: CreateClientInput): Promise<Client> => {
        const response = await createMutation.mutateAsync(input);
        if (!response.data) throw new Error('Failed to create client');
        return response.data;
    };

    const updateClient = async (id: string, input: UpdateClientInput): Promise<Client> => {
        const response = await updateMutation.mutateAsync({ id, input });
        if (!response.data) throw new Error('Failed to update client');
        return response.data;
    };

    const deleteClient = async (id: string): Promise<void> => {
        await deleteMutation.mutateAsync(id);
    };

    return {
        clients: data?.data || [],
        total: data?.meta?.total || 0,
        page: data?.meta?.page || 1,
        totalPages: data?.meta?.totalPages || 1,
        isLoading,
        error: error instanceof ApiError ? error.message : (error?.message ?? null),
        filters,
        setFilters,
        refresh: () => { void refetch(); },
        createClient,
        updateClient,
        deleteClient,
    };
}

export function useClient(id: string) {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['client', id],
        queryFn: () => clientsApi.get(id),
        enabled: !!id,
        staleTime: 60_000,
    });

    return {
        client: data?.data ?? null,
        isLoading,
        error: error?.message ?? null,
        refresh: () => { void refetch(); },
    };
}

export function useClientsStats() {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['clients-stats'],
        queryFn: () => clientsApi.stats(),
        staleTime: 60_000,
    });

    return {
        stats: data?.data ?? null,
        isLoading,
        error: error?.message ?? null,
        refresh: () => { void refetch(); },
    };
}

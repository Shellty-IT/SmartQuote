'use client';

import { useState, useEffect, useCallback } from 'react';
import { clientsApi, ApiError } from '@/lib/api';
import { Client, ClientFilters, ClientsStats, CreateClientInput, UpdateClientInput } from '@/types';

interface UseClientsResult {
    clients: Client[];
    total: number;
    page: number;
    totalPages: number;
    isLoading: boolean;
    error: string | null;
    filters: ClientFilters;
    setFilters: (filters: Partial<ClientFilters>) => void;
    refresh: () => Promise<void>;
    createClient: (data: CreateClientInput) => Promise<Client>;
    updateClient: (id: string, data: UpdateClientInput) => Promise<Client>;
    deleteClient: (id: string) => Promise<void>;
}

export function useClients(initialFilters: ClientFilters = {}): UseClientsResult {
    const [clients, setClients] = useState<Client[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFiltersState] = useState<ClientFilters>({
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        ...initialFilters,
    });

    const fetchClients = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await clientsApi.list(
                filters as Record<string, string | number | boolean | undefined>
            );
            setClients(response.data || []);
            setTotal(response.meta?.total || 0);
            setPage(response.meta?.page || 1);
            setTotalPages(response.meta?.totalPages || 1);
        } catch (err) {
            const message = err instanceof ApiError ? err.message : 'Błąd pobierania klientów';
            setError(message);
            setClients([]);
        } finally {
            setIsLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    const setFilters = useCallback((newFilters: Partial<ClientFilters>) => {
        setFiltersState((prev) => ({ ...prev, ...newFilters }));
    }, []);

    const createClient = useCallback(async (data: CreateClientInput): Promise<Client> => {
        const response = await clientsApi.create(data);
        await fetchClients();
        if (!response.data) {
            throw new Error('Nie udało się utworzyć klienta');
        }
        return response.data;
    }, [fetchClients]);

    const updateClient = useCallback(async (id: string, data: UpdateClientInput): Promise<Client> => {
        const response = await clientsApi.update(id, data);
        await fetchClients();
        if (!response.data) {
            throw new Error('Nie udało się zaktualizować klienta');
        }
        return response.data;
    }, [fetchClients]);

    const deleteClient = useCallback(async (id: string): Promise<void> => {
        await clientsApi.delete(id);
        await fetchClients();
    }, [fetchClients]);

    return {
        clients,
        total,
        page,
        totalPages,
        isLoading,
        error,
        filters,
        setFilters,
        refresh: fetchClients,
        createClient,
        updateClient,
        deleteClient,
    };
}

export function useClient(id: string) {
    const [client, setClient] = useState<Client | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchClient = useCallback(async () => {
        if (!id) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await clientsApi.get(id);
            setClient(response.data ?? null);
        } catch (err) {
            const message = err instanceof ApiError ? err.message : 'Błąd pobierania klienta';
            setError(message);
            setClient(null);
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchClient();
    }, [fetchClient]);

    return { client, isLoading, error, refresh: fetchClient };
}

export function useClientsStats() {
    const [stats, setStats] = useState<ClientsStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await clientsApi.stats();
            setStats(response.data ?? null);
        } catch (err) {
            const message = err instanceof ApiError ? err.message : 'Błąd pobierania statystyk';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return { stats, isLoading, error, refresh: fetchStats };
}
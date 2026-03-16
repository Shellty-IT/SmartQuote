// src/hooks/useContracts.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { contractsApi } from '@/lib/api';
import type { Contract, ContractsStats, CreateContractInput, ContractStatus } from '@/types';

interface UseContractsParams {
    page?: number;
    limit?: number;
    status?: ContractStatus;
    clientId?: string;
    search?: string;
}

export function useContracts(params: UseContractsParams = {}) {
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchContracts = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await contractsApi.list({
                page: params.page,
                limit: params.limit,
                status: params.status,
                clientId: params.clientId,
                search: params.search,
            });

            if (response.success) {
                setContracts(Array.isArray(response.data) ? response.data : []);
                if (response.meta) {
                    setPagination({
                        page: response.meta.page ?? 1,
                        limit: response.meta.limit ?? 10,
                        total: response.meta.total ?? 0,
                        totalPages: response.meta.totalPages ?? 0,
                    });
                }
            }
        } catch (err: unknown) {
            setError('Nie udało się pobrać umów');
            console.error('Fetch contracts error:', err);
        } finally {
            setLoading(false);
        }
    }, [params.page, params.limit, params.status, params.clientId, params.search]);

    useEffect(() => {
        fetchContracts();
    }, [fetchContracts]);

    const createContract = async (data: CreateContractInput) => {
        const response = await contractsApi.create(data);
        if (response.success) {
            await fetchContracts();
        }
        return response;
    };

    const createFromOffer = async (offerId: string) => {
        const response = await contractsApi.createFromOffer(offerId);
        if (response.success) {
            await fetchContracts();
        }
        return response;
    };

    const updateContract = async (id: string, data: Partial<CreateContractInput>) => {
        const response = await contractsApi.update(id, data);
        if (response.success) {
            await fetchContracts();
        }
        return response;
    };

    const updateStatus = async (id: string, status: ContractStatus) => {
        const response = await contractsApi.updateStatus(id, status);
        if (response.success) {
            await fetchContracts();
        }
        return response;
    };

    const deleteContract = async (id: string) => {
        const response = await contractsApi.delete(id);
        if (response.success) {
            await fetchContracts();
        }
        return response;
    };

    return {
        contracts,
        pagination,
        loading,
        error,
        refetch: fetchContracts,
        createContract,
        createFromOffer,
        updateContract,
        updateStatus,
        deleteContract,
    };
}

export function useContract(id: string) {
    const [contract, setContract] = useState<Contract | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchContract = useCallback(async () => {
        if (!id) return;
        try {
            setLoading(true);
            setError(null);
            const response = await contractsApi.get(id);
            if (response.success && response.data) {
                setContract(response.data);
            }
        } catch (err: unknown) {
            setError('Nie udało się pobrać umowy');
            console.error('Fetch contract error:', err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchContract();
    }, [fetchContract]);

    return { contract, loading, error, refetch: fetchContract };
}

export function useContractsStats() {
    const [stats, setStats] = useState<ContractsStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const response = await contractsApi.stats();
                if (response.success && response.data) {
                    setStats(response.data);
                }
            } catch (err: unknown) {
                setError('Nie udało się pobrać statystyk');
                console.error('Fetch contracts stats error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    return { stats, loading, error };
}
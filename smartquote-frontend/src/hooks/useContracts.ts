// SmartQuote-AI/src/hooks/useContracts.ts

'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Contract, ContractsStats, PaginatedResponse, CreateContractInput, ContractStatus } from '@/types';

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

            const queryParams = new URLSearchParams();
            if (params.page) queryParams.set('page', params.page.toString());
            if (params.limit) queryParams.set('limit', params.limit.toString());
            if (params.status) queryParams.set('status', params.status);
            if (params.clientId) queryParams.set('clientId', params.clientId);
            if (params.search) queryParams.set('search', params.search);

            const response = await api.get<PaginatedResponse<Contract>>(
                `/contracts?${queryParams.toString()}`
            );

            if (response.success && response.data) {
                setContracts(response.data.data);
                setPagination(response.data.pagination);
            }
        } catch (err) {
            setError('Nie udało się pobrać umów');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [params.page, params.limit, params.status, params.clientId, params.search]);

    useEffect(() => {
        fetchContracts();
    }, [fetchContracts]);

    const createContract = async (data: CreateContractInput) => {
        const response = await api.post<Contract>('/contracts', data);
        if (response.success) {
            await fetchContracts();
        }
        return response;
    };

    const createFromOffer = async (offerId: string) => {
        const response = await api.post<Contract>(`/contracts/from-offer/${offerId}`);
        if (response.success) {
            await fetchContracts();
        }
        return response;
    };

    const updateContract = async (id: string, data: Partial<CreateContractInput>) => {
        const response = await api.put<Contract>(`/contracts/${id}`, data);
        if (response.success) {
            await fetchContracts();
        }
        return response;
    };

    const updateStatus = async (id: string, status: ContractStatus) => {
        const response = await api.put<Contract>(`/contracts/${id}/status`, { status });
        if (response.success) {
            await fetchContracts();
        }
        return response;
    };

    const deleteContract = async (id: string) => {
        const response = await api.delete(`/contracts/${id}`);
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

    useEffect(() => {
        const fetchContract = async () => {
            try {
                setLoading(true);
                const response = await api.get<Contract>(`/contracts/${id}`);
                if (response.success && response.data) {
                    setContract(response.data);
                }
            } catch (err) {
                setError('Nie udało się pobrać umowy');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchContract();
        }
    }, [id]);

    return { contract, loading, error };
}

export function useContractsStats() {
    const [stats, setStats] = useState<ContractsStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const response = await api.get<ContractsStats>('/contracts/stats');
                if (response.success && response.data) {
                    setStats(response.data);
                }
            } catch (err) {
                setError('Nie udało się pobrać statystyk');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    return { stats, loading, error };
}
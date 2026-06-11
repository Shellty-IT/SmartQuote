'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
    const queryClient = useQueryClient();

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['contracts', params],
        queryFn: () => contractsApi.list({
            page: params.page,
            limit: params.limit,
            status: params.status,
            clientId: params.clientId,
            search: params.search,
        }),
    });

    const invalidateAll = async () => {
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['contracts'] }),
            queryClient.invalidateQueries({ queryKey: ['contracts-stats'] }),
        ]);
    };

    const createMutation = useMutation({
        mutationFn: (input: CreateContractInput) => contractsApi.create(input),
        onSuccess: invalidateAll,
    });

    const createFromOfferMutation = useMutation({
        mutationFn: (offerId: string) => contractsApi.createFromOffer(offerId),
        onSuccess: invalidateAll,
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, input }: { id: string; input: Partial<CreateContractInput> }) =>
            contractsApi.update(id, input),
        onSuccess: async (_, { id }) => {
            await invalidateAll();
            await queryClient.invalidateQueries({ queryKey: ['contract', id] });
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: ContractStatus }) =>
            contractsApi.updateStatus(id, status),
        onSuccess: async (_, { id }) => {
            await invalidateAll();
            await queryClient.invalidateQueries({ queryKey: ['contract', id] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => contractsApi.delete(id),
        onSuccess: invalidateAll,
    });

    const contracts = Array.isArray(data?.data) ? data.data : [];
    const meta = data?.meta;

    return {
        contracts,
        pagination: meta
            ? { page: meta.page ?? 1, limit: meta.limit ?? 10, total: meta.total ?? 0, totalPages: meta.totalPages ?? 0 }
            : { page: 1, limit: 10, total: 0, totalPages: 0 },
        loading: isLoading,
        error: error?.message ?? null,
        refetch: () => { void refetch(); },
        createContract: (input: CreateContractInput) => createMutation.mutateAsync(input),
        createFromOffer: (offerId: string) => createFromOfferMutation.mutateAsync(offerId),
        updateContract: (id: string, input: Partial<CreateContractInput>) =>
            updateMutation.mutateAsync({ id, input }),
        updateStatus: (id: string, status: ContractStatus) =>
            updateStatusMutation.mutateAsync({ id, status }),
        deleteContract: (id: string) => deleteMutation.mutateAsync(id),
    };
}

export function useContract(id: string) {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['contract', id],
        queryFn: () => contractsApi.get(id),
        enabled: !!id,
        staleTime: 60_000,
    });

    return {
        contract: data?.data ?? null,
        loading: isLoading,
        error: error?.message ?? null,
        refetch: () => { void refetch(); },
    };
}

export function useContractsStats() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['contracts-stats'],
        queryFn: () => contractsApi.stats(),
        staleTime: 60_000,
    });

    return {
        stats: (data?.success && data?.data ? data.data : null) as ContractsStats | null,
        loading: isLoading,
        error: error?.message ?? null,
    };
}

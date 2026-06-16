'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { offersApi, ApiError } from '@/lib/api';
import { offerKeys, queryStaleTime } from '@/lib/queryKeys';
import type {
    Offer,
    OfferFilters,
    CreateOfferInput,
    UpdateOfferInput,
    PublishOfferResult,
    SendToClientResult,
    OfferComment,
} from '@/types';

export function useOffers(initialFilters: OfferFilters = {}) {
    const queryClient = useQueryClient();
    const [filters, setFiltersState] = useState<OfferFilters>({
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        ...initialFilters,
    });

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: offerKeys.list(filters),
        queryFn: () => offersApi.list(filters as Record<string, string | number | boolean | undefined>),
        staleTime: queryStaleTime.offers.list,
    });

    const setFilters = useCallback((newFilters: Partial<OfferFilters>) => {
        setFiltersState((prev) => ({ ...prev, ...newFilters }));
    }, []);

    const invalidateAll = useCallback(async () => {
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: offerKeys.all }),
            queryClient.invalidateQueries({ queryKey: offerKeys.stats }),
        ]);
    }, [queryClient]);

    const createMutation = useMutation({
        mutationFn: (input: CreateOfferInput) => offersApi.create(input),
        onSuccess: invalidateAll,
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, input }: { id: string; input: UpdateOfferInput }) =>
            offersApi.update(id, input),
        onSuccess: async (_, { id }) => {
            await invalidateAll();
            await queryClient.invalidateQueries({ queryKey: offerKeys.detail(id) });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => offersApi.delete(id),
        onSuccess: invalidateAll,
    });

    const duplicateMutation = useMutation({
        mutationFn: (id: string) => offersApi.duplicate(id),
        onSuccess: invalidateAll,
    });

    const createOffer = async (input: CreateOfferInput): Promise<Offer> => {
        const response = await createMutation.mutateAsync(input);
        if (!response.data) throw new Error('Failed to create offer');
        return response.data;
    };

    const updateOffer = async (id: string, input: UpdateOfferInput): Promise<Offer> => {
        const response = await updateMutation.mutateAsync({ id, input });
        if (!response.data) throw new Error('Failed to update offer');
        return response.data;
    };

    const deleteOffer = async (id: string): Promise<void> => {
        await deleteMutation.mutateAsync(id);
    };

    const duplicateOffer = async (id: string): Promise<Offer> => {
        const response = await duplicateMutation.mutateAsync(id);
        if (!response.data) throw new Error('Failed to duplicate offer');
        return response.data;
    };

    return {
        offers: data?.data || [],
        total: data?.meta?.total || 0,
        page: data?.meta?.page || 1,
        totalPages: data?.meta?.totalPages || 1,
        isLoading,
        error: error instanceof ApiError ? error.message : (error?.message ?? null),
        filters,
        setFilters,
        refresh: () => { void refetch(); },
        createOffer,
        updateOffer,
        deleteOffer,
        duplicateOffer,
    };
}

export function useOffer(id: string) {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: offerKeys.detail(id),
        queryFn: () => offersApi.get(id),
        enabled: !!id,
        staleTime: queryStaleTime.offers.detail,
    });

    return {
        offer: data?.data ?? null,
        isLoading,
        error: error?.message ?? null,
        refresh: () => { void refetch(); },
    };
}

export function useOffersStats() {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: offerKeys.stats,
        queryFn: () => offersApi.stats(),
        staleTime: queryStaleTime.offers.stats,
    });

    return {
        stats: data?.data ?? null,
        isLoading,
        error: error?.message ?? null,
        refresh: refetch,
    };
}

export function useOfferPublish(id: string) {
    const queryClient = useQueryClient();

    const publishMutation = useMutation({
        mutationFn: () => offersApi.publish(id),
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: offerKeys.detail(id) }),
                queryClient.invalidateQueries({ queryKey: offerKeys.all }),
                queryClient.invalidateQueries({ queryKey: offerKeys.stats }),
            ]);
        },
    });

    const unpublishMutation = useMutation({
        mutationFn: () => offersApi.unpublish(id),
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: offerKeys.detail(id) }),
                queryClient.invalidateQueries({ queryKey: offerKeys.all }),
                queryClient.invalidateQueries({ queryKey: offerKeys.stats }),
            ]);
        },
    });

    const publish = async (): Promise<PublishOfferResult | null> => {
        const response = await publishMutation.mutateAsync();
        return response.data ?? null;
    };

    const unpublish = async (): Promise<boolean> => {
        await unpublishMutation.mutateAsync();
        return true;
    };

    return {
        publish,
        unpublish,
        isPublishing: publishMutation.isPending,
        isUnpublishing: unpublishMutation.isPending,
        error: publishMutation.error?.message ?? unpublishMutation.error?.message ?? null,
    };
}

export function useOfferSendToClient(id: string) {
    const sendMutation = useMutation({
        mutationFn: () => offersApi.sendToClient(id),
    });

    const sendToClient = async (): Promise<SendToClientResult | null> => {
        const response = await sendMutation.mutateAsync();
        return response.data ?? null;
    };

    return {
        sendToClient,
        isSending: sendMutation.isPending,
        error: sendMutation.error?.message ?? null,
    };
}

export function useOfferAnalytics(id: string) {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: offerKeys.analytics(id),
        queryFn: () => offersApi.analytics(id),
        enabled: !!id,
        staleTime: 60_000,
    });

    return {
        analytics: data?.data ?? null,
        isLoading,
        error: error?.message ?? null,
        refresh: refetch,
    };
}

export function useOfferComments(id: string) {
    const queryClient = useQueryClient();

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: offerKeys.comments(id),
        queryFn: () => offersApi.getComments(id),
        enabled: !!id,
    });

    const addMutation = useMutation({
        mutationFn: (content: string) => offersApi.addComment(id, content),
        onSuccess: (response) => {
            if (response.data) {
                queryClient.setQueryData(
                    offerKeys.comments(id),
                    (old: typeof data) => old
                        ? { ...old, data: [...(old.data ?? []), response.data!] }
                        : old,
                );
            }
        },
    });

    const addComment = async (content: string): Promise<OfferComment | null> => {
        const response = await addMutation.mutateAsync(content);
        return response.data ?? null;
    };

    return {
        comments: data?.data ?? [],
        isLoading,
        isSending: addMutation.isPending,
        error: error?.message ?? null,
        addComment,
        refresh: refetch,
    };
}

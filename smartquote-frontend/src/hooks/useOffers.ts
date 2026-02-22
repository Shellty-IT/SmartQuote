// SmartQuote-AI/src/hooks/useOffers.ts

'use client';

import { useState, useEffect, useCallback } from 'react';
import { offersApi, ApiError } from '@/lib/api';
import type {
    Offer,
    OfferFilters,
    OffersStats,
    CreateOfferInput,
    UpdateOfferInput,
    PublishOfferResult,
    OfferAnalytics,
    OfferComment,
} from '@/types';

interface UseOffersResult {
    offers: Offer[];
    total: number;
    page: number;
    totalPages: number;
    isLoading: boolean;
    error: string | null;
    filters: OfferFilters;
    setFilters: (filters: Partial<OfferFilters>) => void;
    refresh: () => Promise<void>;
    createOffer: (data: CreateOfferInput) => Promise<Offer>;
    updateOffer: (id: string, data: UpdateOfferInput) => Promise<Offer>;
    deleteOffer: (id: string) => Promise<void>;
    duplicateOffer: (id: string) => Promise<Offer>;
}

export function useOffers(initialFilters: OfferFilters = {}): UseOffersResult {
    const [offers, setOffers] = useState<Offer[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFiltersState] = useState<OfferFilters>({
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        ...initialFilters,
    });

    const fetchOffers = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await offersApi.list(
                filters as Record<string, string | number | boolean | undefined>
            );
            setOffers(response.data || []);
            setTotal(response.meta?.total || 0);
            setPage(response.meta?.page || 1);
            setTotalPages(response.meta?.totalPages || 1);
        } catch (err) {
            const message = err instanceof ApiError ? err.message : 'Błąd pobierania ofert';
            setError(message);
            setOffers([]);
        } finally {
            setIsLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchOffers();
    }, [fetchOffers]);

    const setFilters = useCallback((newFilters: Partial<OfferFilters>) => {
        setFiltersState((prev) => ({ ...prev, ...newFilters }));
    }, []);

    const createOffer = useCallback(async (data: CreateOfferInput): Promise<Offer> => {
        const response = await offersApi.create(data);
        await fetchOffers();
        if (!response.data) {
            throw new Error('Nie udało się utworzyć oferty');
        }
        return response.data;
    }, [fetchOffers]);

    const updateOffer = useCallback(async (id: string, data: UpdateOfferInput): Promise<Offer> => {
        const response = await offersApi.update(id, data);
        await fetchOffers();
        if (!response.data) {
            throw new Error('Nie udało się zaktualizować oferty');
        }
        return response.data;
    }, [fetchOffers]);

    const deleteOffer = useCallback(async (id: string): Promise<void> => {
        await offersApi.delete(id);
        await fetchOffers();
    }, [fetchOffers]);

    const duplicateOffer = useCallback(async (id: string): Promise<Offer> => {
        const response = await offersApi.duplicate(id);
        await fetchOffers();
        if (!response.data) {
            throw new Error('Nie udało się zduplikować oferty');
        }
        return response.data;
    }, [fetchOffers]);

    return {
        offers,
        total,
        page,
        totalPages,
        isLoading,
        error,
        filters,
        setFilters,
        refresh: fetchOffers,
        createOffer,
        updateOffer,
        deleteOffer,
        duplicateOffer,
    };
}

export function useOffer(id: string) {
    const [offer, setOffer] = useState<Offer | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchOffer = useCallback(async () => {
        if (!id) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await offersApi.get(id);
            setOffer(response.data ?? null);
        } catch (err) {
            const message = err instanceof ApiError ? err.message : 'Błąd pobierania oferty';
            setError(message);
            setOffer(null);
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchOffer();
    }, [fetchOffer]);

    return { offer, isLoading, error, refresh: fetchOffer };
}

export function useOffersStats() {
    const [stats, setStats] = useState<OffersStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await offersApi.stats();
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

export function useOfferPublish(id: string) {
    const [isPublishing, setIsPublishing] = useState(false);
    const [isUnpublishing, setIsUnpublishing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const publish = useCallback(async (): Promise<PublishOfferResult | null> => {
        setIsPublishing(true);
        setError(null);

        try {
            const response = await offersApi.publish(id);
            return response.data ?? null;
        } catch (err) {
            const message = err instanceof ApiError ? err.message : 'Nie udało się opublikować oferty';
            setError(message);
            return null;
        } finally {
            setIsPublishing(false);
        }
    }, [id]);

    const unpublish = useCallback(async (): Promise<boolean> => {
        setIsUnpublishing(true);
        setError(null);

        try {
            await offersApi.unpublish(id);
            return true;
        } catch (err) {
            const message = err instanceof ApiError ? err.message : 'Nie udało się dezaktywować linku';
            setError(message);
            return false;
        } finally {
            setIsUnpublishing(false);
        }
    }, [id]);

    return { publish, unpublish, isPublishing, isUnpublishing, error };
}

export function useOfferAnalytics(id: string) {
    const [analytics, setAnalytics] = useState<OfferAnalytics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAnalytics = useCallback(async () => {
        if (!id) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await offersApi.analytics(id);
            setAnalytics(response.data ?? null);
        } catch (err) {
            const message = err instanceof ApiError ? err.message : 'Błąd pobierania analityki';
            setError(message);
            setAnalytics(null);
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    return { analytics, isLoading, error, refresh: fetchAnalytics };
}

export function useOfferComments(id: string) {
    const [comments, setComments] = useState<OfferComment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchComments = useCallback(async () => {
        if (!id) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await offersApi.getComments(id);
            setComments(response.data ?? []);
        } catch (err) {
            const message = err instanceof ApiError ? err.message : 'Błąd pobierania komentarzy';
            setError(message);
            setComments([]);
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    const addComment = useCallback(async (content: string): Promise<OfferComment | null> => {
        setIsSending(true);
        setError(null);

        try {
            const response = await offersApi.addComment(id, content);
            if (response.data) {
                setComments((prev) => [...prev, response.data!]);
                return response.data;
            }
            return null;
        } catch (err) {
            const message = err instanceof ApiError ? err.message : 'Nie udało się dodać komentarza';
            setError(message);
            return null;
        } finally {
            setIsSending(false);
        }
    }, [id]);

    return { comments, isLoading, isSending, error, addComment, refresh: fetchComments };
}
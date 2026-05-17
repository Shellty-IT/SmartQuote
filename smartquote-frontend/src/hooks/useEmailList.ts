// src/hooks/useEmailList.ts
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { emailsApi } from '@/lib/api/emails.api';
import type { EmailLog, EmailLogStatus } from '@/types/email.types';

interface Meta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

const STATUS_MAP: Record<'sent' | 'drafts' | 'failed', EmailLogStatus> = {
    sent: 'SENT',
    drafts: 'DRAFT',
    failed: 'FAILED',
};

export function useEmailList() {
    const [items, setItems] = useState<EmailLog[]>([]);
    const [meta, setMeta] = useState<Meta>({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'sent' | 'drafts' | 'failed'>('sent');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const currentStatus = useMemo(() => STATUS_MAP[activeTab], [activeTab]);

    const load = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const params: Record<string, string | number | boolean | undefined> = {
                status: currentStatus,
                page,
                limit: 20,
            };
            if (search.trim()) params.search = search.trim();

            const res = await emailsApi.list(params);
            if (!res.data) throw new Error('Brak danych');
            setItems(res.data);
            if (res.meta) setMeta(res.meta);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Błąd ładowania');
        } finally {
            setIsLoading(false);
        }
    }, [currentStatus, page, search]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        setPage(1);
    }, [activeTab, search]);

    const handleDelete = useCallback(async (id: string) => {
        setIsDeleting(true);
        try {
            await emailsApi.delete(id);
            setDeleteConfirmId(null);
            await load();
        } catch {
            setError('Nie udało się usunąć wiadomości');
        } finally {
            setIsDeleting(false);
        }
    }, [load]);

    return {
        items,
        meta,
        isLoading,
        error,
        activeTab,
        setActiveTab,
        search,
        setSearch,
        page,
        setPage,
        deleteConfirmId,
        setDeleteConfirmId,
        isDeleting,
        handleDelete,
        refresh: load,
    };
}
'use client';

import { useQuery } from '@tanstack/react-query';
import { notesApi } from '@/lib/api/notes.api';
import type { Note } from '@/types/note.types';

interface UseNotesFilter {
    clientId?: string;
    offerId?: string;
    contractId?: string;
    leadId?: string;
}

interface UseNotesResult {
    notes: Note[];
    isLoading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

export function useNotes(filter: UseNotesFilter): UseNotesResult {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['notes', filter],
        queryFn: () => notesApi.list(filter),
    });

    return {
        notes: data?.data ?? [],
        isLoading,
        error: error instanceof Error ? error.message : error ? 'Failed to fetch notes' : null,
        refresh: async () => { await refetch(); },
    };
}

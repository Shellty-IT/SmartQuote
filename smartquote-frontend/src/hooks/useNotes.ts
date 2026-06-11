'use client';

import { useState, useEffect, useCallback } from 'react';
import { notesApi } from '@/lib/api/notes.api';
import { ApiError } from '@/lib/api';
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
    const [notes, setNotes] = useState<Note[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const filterKey = JSON.stringify(filter);
    const fetchNotes = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await notesApi.list(filter);
            setNotes(response.data || []);
        } catch (err) {
            const message = err instanceof ApiError ? err.message : 'Failed to fetch notes';
            setError(message);
            setNotes([]);
        } finally {
            setIsLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterKey]);

    useEffect(() => {
        fetchNotes();
    }, [fetchNotes]);

    return { notes, isLoading, error, refresh: fetchNotes };
}

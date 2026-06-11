// src/lib/api/notes.api.ts

import { api } from './client';
import type { Note, CreateNoteInput } from '@/types/note.types';

export const notesApi = {
    list: (filter: { clientId?: string; offerId?: string; contractId?: string; leadId?: string }) =>
        api.get<Note[]>('/notes', filter as Record<string, string | undefined>),
    create: (data: CreateNoteInput) =>
        api.post<Note>('/notes', data),
    update: (id: string, content: string) =>
        api.put<Note>(`/notes/${id}`, { content }),
    delete: (id: string) =>
        api.delete<{ message: string }>(`/notes/${id}`),
};

'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Pencil, Trash2, StickyNote, Check, X } from 'lucide-react';
import { useNotes } from '@/hooks/useNotes';
import { notesApi } from '@/lib/api/notes.api';
import { getInitials, formatDate, cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui';
import { useToast } from '@/contexts/ToastContext';

interface NotesFeedProps {
    entityId: string;
    entityType: 'client' | 'offer' | 'contract' | 'lead';
    className?: string;
}

export function NotesFeed({ entityId, entityType, className }: NotesFeedProps) {
    const filter = { [`${entityType}Id`]: entityId } as {
        clientId?: string;
        offerId?: string;
        contractId?: string;
        leadId?: string;
    };

    const { notes, isLoading, error, refresh } = useNotes(filter);
    const toast = useToast();

    const [newContent, setNewContent] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const sortedNotes = [...notes].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const handleAdd = async () => {
        if (!newContent.trim()) return;
        setIsAdding(true);
        try {
            await notesApi.create({ content: newContent.trim(), ...filter });
            setNewContent('');
            await refresh();
        } catch {
            toast.error('Błąd', 'Nie udało się dodać notatki. Spróbuj ponownie.');
        } finally {
            setIsAdding(false);
        }
    };

    const handleAddKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            handleAdd();
        }
    };

    const startEdit = (id: string, content: string) => {
        setEditingId(id);
        setEditContent(content);
        setDeletingId(null);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditContent('');
    };

    const handleSaveEdit = async () => {
        if (!editingId || !editContent.trim()) return;
        setIsSavingEdit(true);
        try {
            await notesApi.update(editingId, editContent.trim());
            setEditingId(null);
            setEditContent('');
            await refresh();
        } catch {
            toast.error('Błąd', 'Nie udało się zapisać notatki. Spróbuj ponownie.');
        } finally {
            setIsSavingEdit(false);
        }
    };

    const handleEditKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            handleSaveEdit();
        }
        if (e.key === 'Escape') {
            cancelEdit();
        }
    };

    const handleDelete = async (id: string) => {
        setIsDeleting(true);
        try {
            await notesApi.delete(id);
            setDeletingId(null);
            await refresh();
        } catch {
            toast.error('Błąd', 'Nie udało się usunąć notatki. Spróbuj ponownie.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className={cn('bg-card border border-border rounded-2xl p-4', className)}>
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <h3 className="text-base font-semibold tracking-tight">Notatki</h3>
                {!isLoading && (
                    <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                        {notes.length}
                    </span>
                )}
            </div>

            {/* Add note textarea */}
            <div className="mb-4 space-y-2">
                <textarea
                    ref={textareaRef}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    onKeyDown={handleAddKeyDown}
                    placeholder="Dodaj notatkę... (Ctrl+Enter aby dodać)"
                    rows={3}
                    disabled={isAdding}
                    className="w-full resize-none rounded-xl border border-border bg-surface-subtle px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 disabled:opacity-60 transition"
                />
                <div className="flex justify-end">
                    <button
                        onClick={handleAdd}
                        disabled={isAdding || !newContent.trim()}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isAdding ? (
                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        ) : (
                            <Check className="h-3.5 w-3.5" />
                        )}
                        Dodaj
                    </button>
                </div>
            </div>

            {/* Error state */}
            {error && (
                <div className="mb-3 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                    Błąd ładowania notatek
                </div>
            )}

            {/* Loading skeleton */}
            {isLoading && (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="rounded-xl border border-border bg-surface-subtle p-3 space-y-2">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-7 w-7 rounded-full" />
                                <Skeleton className="h-3 w-24 rounded" />
                                <Skeleton className="h-3 w-16 rounded ml-auto" />
                            </div>
                            <Skeleton className="h-3 w-full rounded" />
                            <Skeleton className="h-3 w-3/4 rounded" />
                        </div>
                    ))}
                </div>
            )}

            {/* Empty state */}
            {!isLoading && !error && sortedNotes.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <StickyNote className="h-8 w-8 text-muted-foreground/30" strokeWidth={1.5} />
                    <p className="text-sm text-muted-foreground">Brak notatek. Dodaj pierwszą.</p>
                </div>
            )}

            {/* Notes list */}
            {!isLoading && sortedNotes.length > 0 && (
                <div className="space-y-2">
                    {sortedNotes.map((note) => (
                        <div
                            key={note.id}
                            className="group rounded-xl border border-border bg-surface-subtle p-3 transition hover:border-border/80"
                        >
                            {/* Note header */}
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary ring-1 ring-primary/20">
                                        {getInitials(note.user.name || note.user.email)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold leading-tight truncate">
                                            {note.user.name || note.user.email}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground">
                                            {formatDate(note.createdAt)}
                                        </p>
                                    </div>
                                </div>

                                {/* Action buttons - visible on hover (desktop) */}
                                {editingId !== note.id && deletingId !== note.id && (
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                        <button
                                            onClick={() => startEdit(note.id, note.content)}
                                            className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition"
                                            title="Edytuj"
                                        >
                                            <Pencil className="h-3 w-3" />
                                        </button>
                                        <button
                                            onClick={() => { setDeletingId(note.id); setEditingId(null); }}
                                            className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                                            title="Usuń"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Edit mode */}
                            {editingId === note.id ? (
                                <div className="space-y-2">
                                    <textarea
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        onKeyDown={handleEditKeyDown}
                                        rows={3}
                                        disabled={isSavingEdit}
                                        autoFocus
                                        className="w-full resize-none rounded-lg border border-primary/40 bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60 transition"
                                    />
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleSaveEdit}
                                            disabled={isSavingEdit || !editContent.trim()}
                                            className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
                                        >
                                            {isSavingEdit ? (
                                                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                            ) : (
                                                <Check className="h-3 w-3" />
                                            )}
                                            Zapisz
                                        </button>
                                        <button
                                            onClick={cancelEdit}
                                            disabled={isSavingEdit}
                                            className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
                                        >
                                            <X className="h-3 w-3" />
                                            Anuluj
                                        </button>
                                    </div>
                                </div>
                            ) : deletingId === note.id ? (
                                /* Delete confirm */
                                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2">
                                    <p className="text-xs text-destructive font-medium flex-1">Usunąć tę notatkę?</p>
                                    <button
                                        onClick={() => handleDelete(note.id)}
                                        disabled={isDeleting}
                                        className="inline-flex items-center gap-1 rounded-md bg-destructive px-2 py-0.5 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
                                    >
                                        {isDeleting ? (
                                            <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                        ) : null}
                                        Usuń
                                    </button>
                                    <button
                                        onClick={() => setDeletingId(null)}
                                        disabled={isDeleting}
                                        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
                                    >
                                        Anuluj
                                    </button>
                                </div>
                            ) : (
                                /* Normal content */
                                <p className="text-sm whitespace-pre-wrap text-foreground">{note.content}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

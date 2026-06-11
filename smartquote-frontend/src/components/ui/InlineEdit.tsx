'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Pencil, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InlineEditProps {
    value: string;
    onSave: (value: string) => Promise<void>;
    placeholder?: string;
    multiline?: boolean;
    className?: string;
    displayClassName?: string;
    emptyText?: string;
}

export function InlineEdit({
    value,
    onSave,
    placeholder,
    multiline = false,
    className,
    displayClassName,
    emptyText = 'Kliknij, aby edytować',
}: InlineEditProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState(value);
    const [isSaving, setIsSaving] = useState(false);
    const [savedFlash, setSavedFlash] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const inputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Keep draft in sync when value changes from outside
    useEffect(() => {
        if (!isEditing) {
            setDraft(value);
        }
    }, [value, isEditing]);

    const startEdit = () => {
        setDraft(value);
        setSaveError(null);
        setIsEditing(true);
    };

    useEffect(() => {
        if (isEditing) {
            if (multiline) {
                textareaRef.current?.focus();
                // Move cursor to end
                const len = textareaRef.current?.value.length ?? 0;
                textareaRef.current?.setSelectionRange(len, len);
            } else {
                inputRef.current?.focus();
                inputRef.current?.select();
            }
        }
    }, [isEditing, multiline]);

    const handleSave = async () => {
        if (isSaving) return;
        const trimmed = draft.trim();
        // If unchanged, just cancel
        if (trimmed === value.trim()) {
            setIsEditing(false);
            return;
        }
        setIsSaving(true);
        setSaveError(null);
        try {
            await onSave(trimmed);
            setIsEditing(false);
            setSavedFlash(true);
            setTimeout(() => setSavedFlash(false), 1500);
        } catch {
            setSaveError('Błąd zapisu');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setDraft(value);
        setSaveError(null);
        setIsEditing(false);
    };

    const handleBlur = () => {
        // Small delay to allow click on Save/Cancel buttons
        setTimeout(() => {
            if (isEditing && !isSaving) {
                handleSave();
            }
        }, 150);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            handleCancel();
            return;
        }
        if (!multiline && e.key === 'Enter') {
            e.preventDefault();
            handleSave();
            return;
        }
        if (multiline && e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            handleSave();
        }
    };

    if (isEditing) {
        return (
            <div className={cn('relative', className)}>
                {multiline ? (
                    <textarea
                        ref={textareaRef}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={handleBlur}
                        disabled={isSaving}
                        placeholder={placeholder}
                        rows={3}
                        className={cn(
                            'w-full resize-none rounded-lg border bg-card px-2 py-1 text-sm focus:outline-none focus:ring-2 transition disabled:opacity-60',
                            saveError
                                ? 'border-destructive focus:ring-destructive/30'
                                : 'border-primary/50 focus:ring-primary/30',
                        )}
                    />
                ) : (
                    <input
                        ref={inputRef}
                        type="text"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={handleBlur}
                        disabled={isSaving}
                        placeholder={placeholder}
                        className={cn(
                            'w-full rounded-lg border bg-card px-2 py-1 text-sm focus:outline-none focus:ring-2 transition disabled:opacity-60',
                            saveError
                                ? 'border-destructive focus:ring-destructive/30'
                                : 'border-primary/50 focus:ring-primary/30',
                        )}
                    />
                )}
                <div className="mt-1 flex items-center gap-1.5">
                    <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); handleSave(); }}
                        disabled={isSaving}
                        className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-0.5 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
                    >
                        {isSaving ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                            <Check className="h-3 w-3" />
                        )}
                        Zapisz
                    </button>
                    <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); handleCancel(); }}
                        disabled={isSaving}
                        className="rounded-md border border-border px-2 py-0.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground disabled:opacity-50"
                    >
                        Anuluj
                    </button>
                    {saveError && (
                        <span className="text-xs text-destructive">{saveError}</span>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div
            className={cn('group relative inline-flex items-center gap-1.5 cursor-pointer rounded-md px-1 py-0.5 hover:bg-secondary/60 transition', className)}
            onClick={startEdit}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') startEdit(); }}
            aria-label="Kliknij, aby edytować"
        >
            <span className={cn(
                'text-sm',
                !value && 'text-muted-foreground/60 italic',
                savedFlash && 'text-status-accepted',
                displayClassName,
            )}>
                {savedFlash ? (
                    <span className="inline-flex items-center gap-1">
                        <Check className="h-3 w-3" /> Zapisano
                    </span>
                ) : (
                    value || emptyText
                )}
            </span>
            <Pencil className="h-3 w-3 shrink-0 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    );
}

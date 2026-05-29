// src/app/dashboard/offers/[id]/components/details/ActionsCard.tsx
'use client';

import { Download, Link as LinkIcon, Trash2, Loader2 } from 'lucide-react';

interface ActionsCardProps {
    isInteractive: boolean;
    isDownloadingPDF: boolean;
    onDownloadPDF: () => void;
    onPublishClick: () => void;
    onDeleteClick: () => void;
}

export function ActionsCard({
    isInteractive,
    isDownloadingPDF,
    onDownloadPDF,
    onPublishClick,
    onDeleteClick,
}: ActionsCardProps) {
    return (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="mb-4 text-lg font-semibold tracking-tight">Akcje</h2>
            <div className="space-y-2">
                <button
                    onClick={onDownloadPDF}
                    disabled={isDownloadingPDF}
                    className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface-subtle p-3 text-sm font-semibold text-foreground transition hover:bg-secondary disabled:pointer-events-none disabled:opacity-60"
                >
                    {isDownloadingPDF
                        ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        : <Download className="h-4 w-4 text-muted-foreground" />
                    }
                    {isDownloadingPDF ? 'Generowanie PDF…' : 'Pobierz PDF'}
                </button>

                <button
                    onClick={onPublishClick}
                    className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface-subtle p-3 text-sm font-semibold text-foreground transition hover:bg-secondary"
                >
                    <LinkIcon className="h-4 w-4 text-primary" />
                    {isInteractive ? 'Zarządzaj linkiem' : 'Publikuj interaktywny link'}
                </button>

                <div className="border-t border-border pt-2">
                    <button
                        onClick={onDeleteClick}
                        className="flex w-full items-center gap-3 rounded-xl p-3 text-sm font-semibold text-destructive transition hover:bg-destructive/10"
                    >
                        <Trash2 className="h-4 w-4" /> Usuń ofertę
                    </button>
                </div>
            </div>
        </div>
    );
}

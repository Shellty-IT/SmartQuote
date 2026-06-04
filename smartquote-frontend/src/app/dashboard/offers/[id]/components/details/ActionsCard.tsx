// src/app/dashboard/offers/[id]/components/details/ActionsCard.tsx
'use client';

import { Download, Eye, Link as LinkIcon, Trash2, Loader2 } from 'lucide-react';
import { useTranslations } from '@/i18n';

interface ActionsCardProps {
    isInteractive: boolean;
    isDownloadingPDF: boolean;
    isPreviewingPDF: boolean;
    onPreviewPDF: () => void;
    onDownloadPDF: () => void;
    onPublishClick: () => void;
    onDeleteClick: () => void;
}

export function ActionsCard({
    isInteractive,
    isDownloadingPDF,
    isPreviewingPDF,
    onPreviewPDF,
    onDownloadPDF,
    onPublishClick,
    onDeleteClick,
}: ActionsCardProps) {
    const tr = useTranslations('offerDetail');

    return (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="mb-4 text-lg font-semibold tracking-tight">{tr.actions.title}</h2>
            <div className="space-y-2">
                <button
                    onClick={onPreviewPDF}
                    disabled={isPreviewingPDF}
                    className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface-subtle p-3 text-sm font-semibold text-foreground transition hover:bg-secondary disabled:pointer-events-none disabled:opacity-60"
                >
                    {isPreviewingPDF
                        ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        : <Eye className="h-4 w-4 text-muted-foreground" />
                    }
                    {isPreviewingPDF ? tr.actions.loadingPreview : tr.actions.previewPDF}
                </button>

                <button
                    onClick={onDownloadPDF}
                    disabled={isDownloadingPDF}
                    className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface-subtle p-3 text-sm font-semibold text-foreground transition hover:bg-secondary disabled:pointer-events-none disabled:opacity-60"
                >
                    {isDownloadingPDF
                        ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        : <Download className="h-4 w-4 text-muted-foreground" />
                    }
                    {isDownloadingPDF ? tr.actions.generatingPDF : tr.actions.downloadPDF}
                </button>

                <button
                    data-testid="offer-publish-button"
                    onClick={onPublishClick}
                    className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface-subtle p-3 text-sm font-semibold text-foreground transition hover:bg-secondary"
                >
                    <LinkIcon className="h-4 w-4 text-primary" />
                    {isInteractive ? tr.actions.manageLink : tr.actions.publishLink}
                </button>

                <div className="border-t border-border pt-2">
                    <button
                        onClick={onDeleteClick}
                        className="flex w-full items-center gap-3 rounded-xl p-3 text-sm font-semibold text-destructive transition hover:bg-destructive/10"
                    >
                        <Trash2 className="h-4 w-4" /> {tr.actions.deleteOffer}
                    </button>
                </div>
            </div>
        </div>
    );
}

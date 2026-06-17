// Shared toolbar for all contract document editors (SLA, Mobile, Dedicated, Services).
'use client'

import type { ReactNode } from 'react'
import { Download, RefreshCw, ZoomIn, ZoomOut, Layers } from 'lucide-react'
import { Button } from '@/components/ui'
import { ZOOM_LEVELS, ZOOM_LABELS } from '@/hooks/useZoom'
import { cn } from '@/lib/utils'

export interface ContractEditorToolbarProps {
    zoom: number
    zoomIn: () => void
    zoomOut: () => void
    showSections: boolean
    onToggleSections: () => void
    onRefresh: () => void
    onDownloadPdf?: () => void
    isDownloading?: boolean
    showSaveButton?: boolean
    onSave?: () => void
    isSaving?: boolean
    aiFill?: ReactNode
}

export function ContractEditorToolbar({
    zoom, zoomIn, zoomOut, showSections, onToggleSections, onRefresh,
    onDownloadPdf, isDownloading, showSaveButton, onSave, isSaving, aiFill,
}: ContractEditorToolbarProps) {
    return (
        <div className="flex items-center gap-2 border-b border-border bg-card px-4 py-2.5">
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                    Podgląd umowy
                    <span className="ml-2 text-xs font-normal text-muted-foreground">Kliknij dowolną sekcję aby edytować</span>
                </p>
            </div>
            <div className="flex items-center gap-1">
                {aiFill}
                {aiFill && <div className="mx-1 h-4 w-px bg-border" />}
                <button type="button" onClick={onToggleSections} title="Zarządzaj sekcjami"
                    className={cn('flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                        showSections ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground')}>
                    <Layers className="h-3.5 w-3.5" />Sekcje
                </button>
                <div className="mx-1 h-4 w-px bg-border" />
                <button type="button" onClick={zoomOut} disabled={zoom === ZOOM_LEVELS[0]} title="Pomniejsz" className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary/60 hover:text-foreground disabled:opacity-40"><ZoomOut className="h-4 w-4" /></button>
                <span className="min-w-[38px] text-center text-xs font-medium text-muted-foreground tabular-nums">{ZOOM_LABELS[zoom]}</span>
                <button type="button" onClick={zoomIn} disabled={zoom === ZOOM_LEVELS[ZOOM_LEVELS.length - 1]} title="Powiększ" className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary/60 hover:text-foreground disabled:opacity-40"><ZoomIn className="h-4 w-4" /></button>
                <div className="mx-1 h-4 w-px bg-border" />
                <button type="button" onClick={onRefresh} title="Odśwież" className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"><RefreshCw className="h-4 w-4" /></button>
                {onDownloadPdf && (
                    <Button variant="outline" size="sm" onClick={onDownloadPdf} disabled={isDownloading} className="ml-1">
                        <Download className="h-3.5 w-3.5" />{isDownloading ? 'Generowanie…' : 'Pobierz PDF'}
                    </Button>
                )}
                {showSaveButton && onSave && (
                    <Button size="sm" onClick={onSave} disabled={isSaving} className="ml-1">
                        {isSaving ? 'Zapisywanie…' : 'Zapisz umowę'}
                    </Button>
                )}
            </div>
        </div>
    )
}

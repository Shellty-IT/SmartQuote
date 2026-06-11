// src/components/contracts/editor/ContractDocumentEditor.tsx
// Document-as-editor for the "Umowa — Krótka" contract template.
// Renders the contract HTML in an iframe. User clicks a section → side panel opens.
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Download, RefreshCw, ZoomIn, ZoomOut, Layers } from 'lucide-react'
import { Button } from '@/components/ui'
import {
    ContractBlockEditorPanel,
    SectionManagerPanel,
    type EditableSectionKey,
} from './ContractBlockEditorPanel'
import { buildContractShortHtml } from '@/lib/pdf/contract-short-html'
import { mergeContractWithDefaults, type ContractShortBlocks } from '@/lib/pdf/contract-short-blocks'
import { cn } from '@/lib/utils'

export interface ContractDocumentEditorProps {
    blocks: ContractShortBlocks
    onBlocksChange: (blocks: ContractShortBlocks) => void
    onDownloadPdf?: () => void
    isDownloading?: boolean
    showSaveButton?: boolean
    onSave?: () => void
    isSaving?: boolean
}

const ZOOM_LEVELS = [0.5, 0.65, 0.8, 1.0, 1.25, 1.5] as const
const ZOOM_LABELS: Record<number, string> = {
    0.5: '50%', 0.65: '65%', 0.8: '80%', 1.0: '100%', 1.25: '125%', 1.5: '150%',
}

const VALID_SECTION_KEYS: EditableSectionKey[] = [
    'header',
    'parties', 'subject', 'deadline', 'payment', 'obligations',
    'acceptance', 'copyright', 'warranty', 'confidentiality', 'finalProvisions',
    'signatures',
]

type PanelView = { kind: 'section'; key: EditableSectionKey } | { kind: 'sections' } | null

export function ContractDocumentEditor({
    blocks,
    onBlocksChange,
    onDownloadPdf,
    isDownloading,
    showSaveButton,
    onSave,
    isSaving,
}: ContractDocumentEditorProps) {
    const [panelView, setPanelView] = useState<PanelView>(null)
    const [zoom, setZoom] = useState<number>(0.8)
    const [srcdoc, setSrcdoc] = useState<string>(() =>
        buildContractShortHtml(blocks, { editorMode: true, zoom: 0.8 }),
    )

    const activeKey = panelView?.kind === 'section' ? panelView.key : null

    // Rebuild srcdoc when blocks or zoom change
    useEffect(() => {
        const html = buildContractShortHtml(blocks, { editorMode: true, zoom, activeSection: activeKey })
        setSrcdoc(html)
    }, [blocks, zoom, activeKey])

    // Listen for postMessage events from the iframe
    useEffect(() => {
        const handler = (event: MessageEvent) => {
            if (event.data?.type === 'sq:editSection') {
                const key = event.data.sectionKey as EditableSectionKey
                if (VALID_SECTION_KEYS.includes(key)) {
                    setPanelView({ kind: 'section', key })
                }
            }
        }
        window.addEventListener('message', handler)
        return () => window.removeEventListener('message', handler)
    }, [])

    const handleSaveSection = useCallback(
        (updatedBlocks: ContractShortBlocks) => {
            onBlocksChange(updatedBlocks)
            setPanelView(null)
        },
        [onBlocksChange],
    )

    const handleSaveSections = useCallback(
        (updatedBlocks: ContractShortBlocks) => {
            onBlocksChange(updatedBlocks)
        },
        [onBlocksChange],
    )

    const handleClosePanel = useCallback(() => {
        setPanelView(null)
    }, [])

    const handleRefresh = useCallback(() => {
        const html = buildContractShortHtml(blocks, { editorMode: true, zoom })
        setSrcdoc(html + `<!-- refresh:${Date.now()} -->`)
    }, [blocks, zoom])

    const zoomIn = () => {
        const idx = ZOOM_LEVELS.indexOf(zoom as (typeof ZOOM_LEVELS)[number])
        if (idx < ZOOM_LEVELS.length - 1) setZoom(ZOOM_LEVELS[idx + 1])
    }
    const zoomOut = () => {
        const idx = ZOOM_LEVELS.indexOf(zoom as (typeof ZOOM_LEVELS)[number])
        if (idx > 0) setZoom(ZOOM_LEVELS[idx - 1])
    }

    const panelOpen = panelView !== null
    const showSections = panelView?.kind === 'sections'
    const editingSection = panelView?.kind === 'section' ? panelView.key : null

    return (
        <div className="flex h-full min-h-[700px] flex-col gap-0 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-2 border-b border-border bg-card px-4 py-2.5">
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                        Podgląd umowy
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                            Kliknij dowolną sekcję aby edytować
                        </span>
                    </p>
                </div>
                <div className="flex items-center gap-1">
                    {/* Sections manager button */}
                    <button
                        type="button"
                        onClick={() => setPanelView(showSections ? null : { kind: 'sections' })}
                        title="Zarządzaj sekcjami"
                        className={cn(
                            'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                            showSections
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
                        )}
                    >
                        <Layers className="h-3.5 w-3.5" />
                        Sekcje
                    </button>

                    <div className="mx-1 h-4 w-px bg-border" />

                    {/* Zoom controls */}
                    <button
                        type="button"
                        onClick={zoomOut}
                        disabled={zoom === ZOOM_LEVELS[0]}
                        title="Pomniejsz"
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary/60 hover:text-foreground disabled:opacity-40"
                    >
                        <ZoomOut className="h-4 w-4" />
                    </button>
                    <span className="min-w-[38px] text-center text-xs font-medium text-muted-foreground tabular-nums">
                        {ZOOM_LABELS[zoom]}
                    </span>
                    <button
                        type="button"
                        onClick={zoomIn}
                        disabled={zoom === ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
                        title="Powiększ"
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary/60 hover:text-foreground disabled:opacity-40"
                    >
                        <ZoomIn className="h-4 w-4" />
                    </button>

                    <div className="mx-1 h-4 w-px bg-border" />

                    <button
                        type="button"
                        onClick={handleRefresh}
                        title="Odśwież podgląd"
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </button>
                    {onDownloadPdf && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onDownloadPdf}
                            disabled={isDownloading}
                            className="ml-1"
                        >
                            <Download className="h-3.5 w-3.5" />
                            {isDownloading ? 'Generowanie…' : 'Pobierz PDF'}
                        </Button>
                    )}
                    {showSaveButton && onSave && (
                        <Button size="sm" onClick={onSave} disabled={isSaving} className="ml-1">
                            {isSaving ? 'Zapisywanie…' : 'Zapisz umowę'}
                        </Button>
                    )}
                </div>
            </div>

            {/* Main area: document + optional editor panel */}
            <div className="flex flex-1 min-h-0">
                {/* Document iframe */}
                <div className="flex-1 min-w-0 overflow-auto bg-[#CDD2E2] transition-all duration-300">
                    <iframe
                        srcDoc={srcdoc}
                        title="Podgląd umowy"
                        sandbox="allow-scripts allow-same-origin"
                        className="h-full w-full"
                        style={{ minHeight: 700 }}
                    />
                </div>

                {/* Side panel */}
                <div
                    className={cn(
                        'flex-shrink-0 overflow-hidden border-l border-border transition-all duration-300',
                        panelOpen ? 'w-[380px]' : 'w-0',
                    )}
                >
                    {showSections && (
                        <SectionManagerPanel
                            blocks={blocks}
                            onSave={handleSaveSections}
                            onClose={handleClosePanel}
                        />
                    )}
                    {editingSection && (
                        <ContractBlockEditorPanel
                            key={editingSection}
                            sectionKey={editingSection}
                            blocks={blocks}
                            onSave={handleSaveSection}
                            onClose={handleClosePanel}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

// ── Convenience wrapper: builds blocks from raw saved data ────────────────────

export interface ContractDocumentEditorFromSavedProps {
    savedBlocks?: unknown
    onBlocksChange?: (blocks: ContractShortBlocks) => void
    onDownloadPdf?: () => void
    isDownloading?: boolean
}

export function ContractDocumentEditorFromSaved({
    savedBlocks,
    onBlocksChange,
    onDownloadPdf,
    isDownloading,
}: ContractDocumentEditorFromSavedProps) {
    const [blocks, setBlocks] = useState<ContractShortBlocks>(() =>
        mergeContractWithDefaults(
            savedBlocks && typeof savedBlocks === 'object'
                ? (savedBlocks as Partial<ContractShortBlocks>)
                : null,
        ),
    )

    const handleBlocksChange = useCallback(
        (updated: ContractShortBlocks) => {
            setBlocks(updated)
            onBlocksChange?.(updated)
        },
        [onBlocksChange],
    )

    return (
        <ContractDocumentEditor
            blocks={blocks}
            onBlocksChange={handleBlocksChange}
            onDownloadPdf={onDownloadPdf}
            isDownloading={isDownloading}
        />
    )
}

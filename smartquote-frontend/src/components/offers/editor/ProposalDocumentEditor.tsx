// src/components/offers/editor/ProposalDocumentEditor.tsx
// Document-as-editor for the "Strona internetowa" proposal template.
// Renders the proposal HTML in an iframe. User clicks a section → side panel opens.
// Panel edits → srcdoc is updated → iframe re-renders the updated document.
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Download, RefreshCw, ZoomIn, ZoomOut, Layers } from 'lucide-react'
import { Button } from '@/components/ui'
import { TemplateAIFillButton } from '@/components/offers/TemplateAIFillButton'
import {
    BlockEditorPanel,
    SectionManagerPanel,
    type EditableBlockKey,
    type OfferContext,
} from './BlockEditorPanel'
import { buildProposalHtml, type ProposalOfferData } from '@/lib/pdf/proposal-html'
import { ALL_SECTION_KEYS, mergeWithDefaults, type ProposalBlocks } from '@/lib/pdf/proposal-blocks'
import { cn } from '@/lib/utils'
import { useResizablePanel } from '@/hooks/useResizablePanel'
import { useZoom, ZOOM_LEVELS, ZOOM_LABELS } from '@/hooks/useZoom'

export interface ProposalDocumentEditorProps {
    /** Offer data used to render the document. `blocks` field may be null (defaults used). */
    offer: ProposalOfferData
    /** Current blocks state */
    blocks: ProposalBlocks
    /** Called when the user saves block edits. Parent is responsible for persisting. */
    onBlocksChange: (blocks: ProposalBlocks) => void
    /** Optional: download PDF button handler */
    onDownloadPdf?: () => void
    isDownloading?: boolean
    /** If true, show a "Save offer" button (used during creation wizard) */
    showSaveButton?: boolean
    onSave?: () => void
    isSaving?: boolean
}

const VALID_BLOCK_KEYS: EditableBlockKey[] = [
    'header', 'footer',
    ...ALL_SECTION_KEYS,
]

type PanelView = { kind: 'block'; key: EditableBlockKey } | { kind: 'sections' } | null

export function ProposalDocumentEditor({
    offer,
    blocks,
    onBlocksChange,
    onDownloadPdf,
    isDownloading,
    showSaveButton,
    onSave,
    isSaving,
}: ProposalDocumentEditorProps) {
    const [panelView, setPanelView] = useState<PanelView>(null)
    const {
        containerRef,
        previewPanelStyle,
        editorPanelStyle,
        handleStyle,
        isDragging,
        onResizeMouseDown,
    } = useResizablePanel('sq_preview_ratio_offer', { mode: 'preview-ratio' })
    const { zoom, zoomIn, zoomOut } = useZoom()
    const [refreshKey, setRefreshKey] = useState(0)

    const srcdoc = useMemo(
        () => buildProposalHtml({ ...offer, blocks }, { editorMode: true, zoom }),
        [offer, blocks, zoom],
    )

    // Build offer context for AI generation
    const offerContext = useMemo<OfferContext>(() => ({
        title: offer.title,
        clientName: offer.client.name,
        totalGross: offer.totalGross,
        currency: offer.currency,
    }), [offer.title, offer.client.name, offer.totalGross, offer.currency])

    // Listen for postMessage events from the iframe
    useEffect(() => {
        const handler = (event: MessageEvent) => {
            if (event.data?.type === 'sq:editBlock') {
                const key = event.data.blockKey as EditableBlockKey
                if (VALID_BLOCK_KEYS.includes(key)) {
                    setPanelView({ kind: 'block', key })
                }
            }
        }
        window.addEventListener('message', handler)
        return () => window.removeEventListener('message', handler)
    }, [])

    const handleSaveBlock = useCallback(
        (updatedBlocks: ProposalBlocks) => {
            onBlocksChange(updatedBlocks)
            setPanelView(null)
        },
        [onBlocksChange],
    )

    const handleSaveSections = useCallback(
        (updatedBlocks: ProposalBlocks) => {
            onBlocksChange(updatedBlocks)
            setPanelView(null)
        },
        [onBlocksChange],
    )

    const handleClosePanel = useCallback(() => setPanelView(null), [])
    const handleRefresh = useCallback(() => setRefreshKey(n => n + 1), [])

    const panelOpen = panelView !== null
    const showSections = panelView?.kind === 'sections'
    const editingBlock = panelView?.kind === 'block' ? panelView.key : null

    return (
        <div className="flex h-full min-h-[700px] flex-col gap-0 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-2 border-b border-border bg-card px-4 py-2.5">
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                        Podgląd dokumentu
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                            Kliknij dowolną sekcję aby edytować
                        </span>
                    </p>
                </div>
                <div className="flex items-center gap-1">
                    <TemplateAIFillButton
                        blocks={blocks}
                        onBlocksChange={onBlocksChange}
                        clientName={offer.client.name}
                        title={offer.title}
                        templateType="proposal"
                    />

                    <div className="mx-1 h-4 w-px bg-border" />

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
                            {isSaving ? 'Zapisywanie…' : 'Zapisz ofertę'}
                        </Button>
                    )}
                </div>
            </div>

            {/* Main area: document + optional editor panel */}
            <div ref={containerRef} className="flex flex-1 min-h-0">
                {/* Document iframe */}
                <div
                    className={cn(
                        'min-w-0 overflow-auto bg-[#CDD2E2]',
                        panelOpen ? 'flex-shrink-0' : 'flex-1',
                        !isDragging && 'transition-all duration-300',
                    )}
                    style={panelOpen ? previewPanelStyle : undefined}
                >
                    <iframe
                        key={refreshKey}
                        srcDoc={srcdoc}
                        title="Podgląd oferty"
                        sandbox="allow-scripts allow-same-origin"
                        className={cn('h-full w-full', isDragging && 'pointer-events-none')}
                        style={{ minHeight: 700 }}
                    />
                </div>

                {panelOpen && (
                    <div
                        role="separator"
                        aria-orientation="vertical"
                        title="Zmień szerokość podglądu"
                        onMouseDown={onResizeMouseDown}
                        className={cn(
                            'group relative z-20 cursor-col-resize bg-border/70 hover:bg-primary/30',
                            !isDragging && 'transition-colors',
                            isDragging && 'bg-primary/30',
                        )}
                        style={handleStyle}
                    >
                        <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border group-hover:bg-primary/50" />
                    </div>
                )}

                {/* Side panel */}
                <div
                    className={cn(
                        'min-w-0 overflow-hidden border-l border-border',
                        panelOpen ? '' : 'w-0 flex-shrink-0',
                        !isDragging && 'transition-all duration-300',
                    )}
                    style={panelOpen ? editorPanelStyle : undefined}
                >
                    {showSections && (
                        <SectionManagerPanel
                            blocks={blocks}
                            onSave={handleSaveSections}
                            onClose={handleClosePanel}
                        />
                    )}
                    {editingBlock && (
                        <BlockEditorPanel
                            key={editingBlock}
                            blockKey={editingBlock}
                            blocks={blocks}
                            onSave={handleSaveBlock}
                            onClose={handleClosePanel}
                            offerContext={offerContext}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

// ── Convenience wrapper: builds blocks from offer if not provided ─────────────

export interface ProposalDocumentEditorFromOfferProps {
    offer: ProposalOfferData & { blocks?: unknown }
    onBlocksChange?: (blocks: ProposalBlocks) => void
    onDownloadPdf?: () => void
    isDownloading?: boolean
}

export function ProposalDocumentEditorFromOffer({
    offer,
    onBlocksChange,
    onDownloadPdf,
    isDownloading,
}: ProposalDocumentEditorFromOfferProps) {
    const [blocks, setBlocks] = useState<ProposalBlocks>(() =>
        mergeWithDefaults(offer.blocks as Partial<ProposalBlocks> | null, offer.client.name),
    )

    const handleBlocksChange = useCallback(
        (updated: ProposalBlocks) => {
            setBlocks(updated)
            onBlocksChange?.(updated)
        },
        [onBlocksChange],
    )

    return (
        <ProposalDocumentEditor
            offer={offer}
            blocks={blocks}
            onBlocksChange={handleBlocksChange}
            onDownloadPdf={onDownloadPdf}
            isDownloading={isDownloading}
        />
    )
}

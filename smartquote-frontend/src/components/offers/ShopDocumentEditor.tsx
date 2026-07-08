// src/components/offers/ShopDocumentEditor.tsx
// Document-as-editor for the "Sklep internetowy" offer template.
// Renders the shop HTML in an iframe. User clicks a section → side panel opens.
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Download, RefreshCw, ZoomIn, ZoomOut, Layers } from 'lucide-react'
import { Button } from '@/components/ui'
import { TemplateAIFillButton } from './TemplateAIFillButton'
import {
    ShopBlockEditorPanel,
    ShopSectionManagerPanel,
    type EditableShopBlockKey,
} from './editor/ShopBlockEditorPanel'
import { buildShopHtml, type ShopOfferData } from '@/lib/pdf/shop-html'
import { applyPdfPreviewMode } from '@/lib/pdf/print-preview'
import { mergeShopWithDefaults, type ShopBlocks } from '@/lib/pdf/shop-blocks'
import { cn } from '@/lib/utils'
import { useResizablePanel } from '@/hooks/useResizablePanel'
import { useZoom, ZOOM_LEVELS, ZOOM_LABELS } from '@/hooks/useZoom'
import type { OfferContext } from './editor/block-editors'

export interface ShopDocumentEditorProps {
    offer: ShopOfferData
    blocks: ShopBlocks
    onBlocksChange: (blocks: ShopBlocks) => void
    onDownloadPdf?: () => void
    isDownloading?: boolean
    offerContext?: OfferContext
}

const VALID_BLOCK_KEYS: EditableShopBlockKey[] = [
    'cover', 'footer',
    'summary', 'scope', 'platforms', 'timeline',
    'pricing', 'techStack', 'warranty', 'about',
]

type PanelView = { kind: 'block'; key: EditableShopBlockKey } | { kind: 'sections' } | null

export function ShopDocumentEditor({
    offer,
    blocks,
    onBlocksChange,
    onDownloadPdf,
    isDownloading,
    offerContext,
}: ShopDocumentEditorProps) {
    const [panelView, setPanelView] = useState<PanelView>(null)
    const {
        containerRef,
        previewPanelStyle,
        editorPanelStyle,
        handleStyle,
        isDragging,
        onResizeMouseDown,
    } = useResizablePanel('sq_preview_ratio_shop', { mode: 'preview-ratio' })
    const { zoom, zoomIn, zoomOut } = useZoom()
    const [refreshKey, setRefreshKey] = useState(0)

    const srcdoc = useMemo(
        () => applyPdfPreviewMode(buildShopHtml({ ...offer, blocks }, { editorMode: true })),
        [offer, blocks],
    )

    // Listen for postMessage events from the iframe
    useEffect(() => {
        const handler = (event: MessageEvent) => {
            if (event.data?.type === 'sq:editBlock') {
                const key = event.data.blockKey as EditableShopBlockKey
                if (VALID_BLOCK_KEYS.includes(key)) {
                    setPanelView({ kind: 'block', key })
                }
            }
        }
        window.addEventListener('message', handler)
        return () => window.removeEventListener('message', handler)
    }, [])

    const handleSaveBlock = useCallback(
        (updatedBlocks: ShopBlocks) => {
            onBlocksChange(updatedBlocks)
            setPanelView(null)
        },
        [onBlocksChange],
    )

    const handleSaveSections = useCallback(
        (updatedBlocks: ShopBlocks) => {
            onBlocksChange(updatedBlocks)
            setRefreshKey(n => n + 1)
            setPanelView(null)
        },
        [onBlocksChange],
    )

    const handleRefresh = useCallback(() => setRefreshKey(n => n + 1), [])

    const panelOpen = panelView !== null
    const showSections = panelView?.kind === 'sections'
    const editingBlock = panelView?.kind === 'block' ? panelView.key : null

    return (
        <div className="flex h-[clamp(520px,calc(100vh-190px),900px)] min-h-0 flex-col gap-0 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
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
                        templateType="shop"
                    />

                    <div className="mx-1 h-4 w-px bg-border" />

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

                    <button type="button" onClick={zoomOut} disabled={zoom === ZOOM_LEVELS[0]} title="Pomniejsz" className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary/60 hover:text-foreground disabled:opacity-40">
                        <ZoomOut className="h-4 w-4" />
                    </button>
                    <span className="min-w-[38px] text-center text-xs font-medium text-muted-foreground tabular-nums">{ZOOM_LABELS[zoom]}</span>
                    <button type="button" onClick={zoomIn} disabled={zoom === ZOOM_LEVELS[ZOOM_LEVELS.length - 1]} title="Powiększ" className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary/60 hover:text-foreground disabled:opacity-40">
                        <ZoomIn className="h-4 w-4" />
                    </button>

                    <div className="mx-1 h-4 w-px bg-border" />

                    <button type="button" onClick={handleRefresh} title="Odśwież podgląd" className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary/60 hover:text-foreground">
                        <RefreshCw className="h-4 w-4" />
                    </button>
                    {onDownloadPdf && (
                        <Button variant="outline" size="sm" onClick={onDownloadPdf} disabled={isDownloading} className="ml-1">
                            <Download className="h-3.5 w-3.5" />
                            {isDownloading ? 'Generowanie…' : 'Pobierz PDF'}
                        </Button>
                    )}
                </div>
            </div>

            {/* Main area: document + panel */}
            <div ref={containerRef} className="flex flex-1 min-h-0">
                <div
                    className={cn(
                        'min-w-0 overflow-auto bg-[#CDD2E2]',
                        panelOpen ? 'flex-shrink-0' : 'flex-1',
                        !isDragging && 'transition-all duration-300',
                    )}
                    style={panelOpen ? previewPanelStyle : undefined}
                >
                    <div style={{ transformOrigin: 'top left', transform: `scale(${zoom})`, width: `${100 / zoom}%`, height: `${100 / zoom}%` }}>
                        <iframe
                            key={`${refreshKey}:${srcdoc.length}`}
                            srcDoc={srcdoc}
                            title="Podgląd oferty — Sklep internetowy"
                            sandbox="allow-scripts allow-same-origin"
                            className={cn('h-full w-full border-0', isDragging && 'pointer-events-none')}
                        />
                    </div>
                </div>

                {panelOpen && (
                    <div
                        role="separator"
                        aria-orientation="vertical"
                        title="ZmieĹ„ szerokoĹ›Ä‡ podglÄ…du"
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

                <div
                    className={cn(
                        'min-w-0 overflow-hidden border-l border-border',
                        panelOpen ? '' : 'w-0 flex-shrink-0',
                        !isDragging && 'transition-all duration-300',
                    )}
                    style={panelOpen ? editorPanelStyle : undefined}
                >
                    {showSections && (
                        <ShopSectionManagerPanel
                            blocks={blocks}
                            onSave={handleSaveSections}
                            onClose={() => setPanelView(null)}
                        />
                    )}
                    {editingBlock && (
                        <ShopBlockEditorPanel
                            key={editingBlock}
                            blockKey={editingBlock}
                            blocks={blocks}
                            onSave={handleSaveBlock}
                            onClose={() => setPanelView(null)}
                            offerContext={offerContext}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

// ── Convenience wrapper ───────────────────────────────────────────────────────

export interface ShopDocumentEditorFromOfferProps {
    offer: ShopOfferData & { blocks?: unknown }
    onBlocksChange?: (blocks: ShopBlocks) => void
    onDownloadPdf?: () => void
    isDownloading?: boolean
}

export function ShopDocumentEditorFromOffer({
    offer,
    onBlocksChange,
    onDownloadPdf,
    isDownloading,
}: ShopDocumentEditorFromOfferProps) {
    const [blocks, setBlocks] = useState<ShopBlocks>(() =>
        mergeShopWithDefaults(offer.blocks as Partial<ShopBlocks> | null),
    )

    const handleBlocksChange = useCallback(
        (updated: ShopBlocks) => {
            setBlocks(updated)
            onBlocksChange?.(updated)
        },
        [onBlocksChange],
    )

    return (
        <ShopDocumentEditor
            offer={offer}
            blocks={blocks}
            onBlocksChange={handleBlocksChange}
            onDownloadPdf={onDownloadPdf}
            isDownloading={isDownloading}
        />
    )
}

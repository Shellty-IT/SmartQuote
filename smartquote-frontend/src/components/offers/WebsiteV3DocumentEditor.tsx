// src/components/offers/WebsiteV3DocumentEditor.tsx
// Document-as-editor for the "Strona internetowa v3" offer template.
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Download, RefreshCw, ZoomIn, ZoomOut, Layers } from 'lucide-react'
import { Button } from '@/components/ui'
import { TemplateAIFillButton } from './TemplateAIFillButton'
import { WebsiteV3BlockEditorPanel, WebsiteV3SectionManagerPanel, type EditableWV3BlockKey } from './editor/WebsiteV3BlockEditorPanel'
import { buildWebsiteV3Html, type WebsiteV3OfferData } from '@/lib/pdf/website-v3-html'
import { applyPdfPreviewMode } from '@/lib/pdf/print-preview'
import { mergeWebsiteV3WithDefaults, buildDefaultWebsiteV3Blocks, type WebsiteV3Blocks } from '@/lib/pdf/website-v3-blocks'
import { cn } from '@/lib/utils'
import { useResizablePanel } from '@/hooks/useResizablePanel'
import { useZoom, ZOOM_LABELS } from '@/hooks/useZoom'
import type { OfferContext } from './editor/block-editors'

export interface WebsiteV3DocumentEditorProps {
    offer: WebsiteV3OfferData
    blocks: WebsiteV3Blocks
    onBlocksChange: (blocks: WebsiteV3Blocks) => void
    onDownloadPdf?: () => void
    isDownloading?: boolean
    offerContext?: OfferContext
}

const VALID_BLOCK_KEYS: EditableWV3BlockKey[] = [
    'cover', 'footer', 'needs', 'packages', 'process', 'scope',
    'timeline', 'pricing', 'portfolio', 'testimonials', 'about', 'stack', 'terms',
]

type PanelView = { kind: 'block'; key: EditableWV3BlockKey } | { kind: 'sections' } | null

export function WebsiteV3DocumentEditor({
    offer,
    blocks,
    onBlocksChange,
    onDownloadPdf,
    isDownloading,
    offerContext,
}: WebsiteV3DocumentEditorProps) {
    const [panelView, setPanelView] = useState<PanelView>(null)
    const {
        containerRef,
        previewPanelStyle,
        editorPanelStyle,
        handleStyle,
        isDragging,
        onResizeMouseDown,
    } = useResizablePanel('sq_preview_ratio_website_v3', { mode: 'preview-ratio' })
    const { zoom, zoomIn, zoomOut } = useZoom()
    const [refreshKey, setRefreshKey] = useState(0)

    const srcdoc = useMemo(
        () => applyPdfPreviewMode(buildWebsiteV3Html({ ...offer, blocks }, { editorMode: true })),
        [offer, blocks],
    )

    useEffect(() => {
        const handler = (event: MessageEvent) => {
            if (event.data?.type === 'sq:editBlock') {
                const key = event.data.blockKey as EditableWV3BlockKey
                if (VALID_BLOCK_KEYS.includes(key)) {
                    setPanelView({ kind: 'block', key })
                }
            }
        }
        window.addEventListener('message', handler)
        return () => window.removeEventListener('message', handler)
    }, [])

    const handleSaveBlock = useCallback(
        (updatedBlocks: WebsiteV3Blocks) => {
            onBlocksChange(updatedBlocks)
            setPanelView(null)
        },
        [onBlocksChange],
    )

    const handleSaveSections = useCallback(
        (updatedBlocks: WebsiteV3Blocks) => {
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
            <div className="flex items-center gap-2 flex-wrap border-b border-border bg-card px-4 py-2.5">
                <TemplateAIFillButton
                    blocks={blocks}
                    onBlocksChange={onBlocksChange}
                    clientName={offer.client.name}
                    title={offer.title}
                    templateType="website_v3"
                />
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                    <RefreshCw className="w-4 h-4" />
                    Odśwież
                </Button>
                <button
                    type="button"
                    onClick={() => setPanelView(panelView?.kind === 'sections' ? null : { kind: 'sections' })}
                    className={cn(
                        'flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
                        showSections
                            ? 'border-primary/40 bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
                    )}
                >
                    <Layers className="w-4 h-4" />
                    Sekcje
                </button>
                <div className="flex items-center gap-1 ml-auto">
                    <button onClick={zoomOut} className="p-1.5 rounded hover:bg-secondary/60 text-muted-foreground hover:text-foreground">
                        <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-medium w-10 text-center">{ZOOM_LABELS[zoom]}</span>
                    <button onClick={zoomIn} className="p-1.5 rounded hover:bg-secondary/60 text-muted-foreground hover:text-foreground">
                        <ZoomIn className="w-4 h-4" />
                    </button>
                </div>
                {onDownloadPdf && (
                    <Button variant="outline" size="sm" onClick={onDownloadPdf} isLoading={isDownloading}>
                        <Download className="w-4 h-4" />
                        PDF
                    </Button>
                )}
            </div>

            <p className="border-b border-border bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
                Kliknij dowolną sekcję na podglądzie dokumentu, aby otworzyć edytor.
            </p>

            {/* Editor + side panel */}
            <div ref={containerRef} className="flex flex-1 min-h-0">
                <div
                    className={cn(
                        'min-w-0 overflow-hidden',
                        panelOpen ? 'flex-shrink-0' : 'flex-1',
                        !isDragging && 'transition-all duration-300',
                    )}
                    style={panelOpen ? previewPanelStyle : undefined}
                >
                    <div style={{ transformOrigin: 'top left', transform: `scale(${zoom})`, width: `${100 / zoom}%`, height: `${100 / zoom}%` }}>
                        <iframe
                            key={`${refreshKey}:${srcdoc.length}`}
                            srcDoc={srcdoc}
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
                        <WebsiteV3SectionManagerPanel
                            blocks={blocks}
                            onSave={handleSaveSections}
                            onClose={() => setPanelView(null)}
                        />
                    )}
                    {editingBlock && (
                        <WebsiteV3BlockEditorPanel
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

// ── From-offer wrapper (detail page) ─────────────────────────────────────────

export interface WebsiteV3DocumentEditorFromOfferProps {
    offer: WebsiteV3OfferData & { blocks?: unknown }
    onBlocksChange?: (blocks: WebsiteV3Blocks) => void
    onDownloadPdf?: () => void
    isDownloading?: boolean
}

export function WebsiteV3DocumentEditorFromOffer({
    offer,
    onBlocksChange,
    onDownloadPdf,
    isDownloading,
}: WebsiteV3DocumentEditorFromOfferProps) {
    const [blocks, setBlocks] = useState<WebsiteV3Blocks>(() =>
        offer.blocks
            ? mergeWebsiteV3WithDefaults(offer.blocks as Partial<WebsiteV3Blocks>)
            : buildDefaultWebsiteV3Blocks(),
    )

    const handleBlocksChange = useCallback(
        (updated: WebsiteV3Blocks) => {
            setBlocks(updated)
            onBlocksChange?.(updated)
        },
        [onBlocksChange],
    )

    return (
        <WebsiteV3DocumentEditor
            offer={offer}
            blocks={blocks}
            onBlocksChange={handleBlocksChange}
            onDownloadPdf={onDownloadPdf}
            isDownloading={isDownloading}
        />
    )
}

// src/components/offers/WebsiteV3DocumentEditor.tsx
// Document-as-editor for the "Strona internetowa v3" offer template.
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Download, RefreshCw, ZoomIn, ZoomOut, Layers } from 'lucide-react'
import { Button } from '@/components/ui'
import { TemplateAIFillButton } from './TemplateAIFillButton'
import { WebsiteV3BlockEditorPanel, WebsiteV3SectionManagerPanel, type EditableWV3BlockKey } from './editor/WebsiteV3BlockEditorPanel'
import { buildWebsiteV3Html, type WebsiteV3OfferData } from '@/lib/pdf/website-v3-html'
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
    const { panelWidth, onResizeMouseDown } = useResizablePanel('sq_editor_panel_width')
    const { zoom, zoomIn, zoomOut } = useZoom()
    const [refreshKey, setRefreshKey] = useState(0)

    const srcdoc = useMemo(
        () => buildWebsiteV3Html({ ...offer, blocks }, { editorMode: true, zoom }),
        [offer, blocks, zoom],
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
            setPanelView(null)
        },
        [onBlocksChange],
    )

    const handleRefresh = useCallback(() => setRefreshKey(n => n + 1), [])

    const panelOpen = panelView !== null
    const showSections = panelView?.kind === 'sections'
    const editingBlock = panelView?.kind === 'block' ? panelView.key : null

    return (
        <div className="flex flex-col gap-3">
            {/* Toolbar */}
            <div className="flex items-center gap-2 flex-wrap">
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

            <p className="text-xs text-muted-foreground">
                Kliknij dowolną sekcję na podglądzie dokumentu, aby otworzyć edytor.
            </p>

            {/* Editor + side panel */}
            <div className="flex border border-border rounded-xl overflow-hidden" style={{ minHeight: 700 }}>
                <div className="flex-1 overflow-hidden">
                    <iframe
                        key={refreshKey}
                        srcDoc={srcdoc}
                        className="w-full border-0"
                        style={{ minHeight: 700 }}
                    />
                </div>

                <div
                    className={cn('flex-shrink-0 overflow-hidden border-l border-border relative', panelOpen ? '' : '!w-0')}
                    style={panelOpen ? { width: panelWidth } : undefined}
                >
                    {panelOpen && (
                        <div
                            onMouseDown={onResizeMouseDown}
                            className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize z-20 hover:bg-primary/20 transition-colors"
                        />
                    )}
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

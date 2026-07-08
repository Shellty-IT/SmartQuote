// src/components/offers/SupportDocumentEditor.tsx
// Document-as-editor for the "Wsparcie" (IT Support / SLA) offer template.
'use client'

import { useState, useEffect, useMemo } from 'react'
import { Download, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/components/ui'
import { TemplateAIFillButton } from './TemplateAIFillButton'
import { SupportBlockEditorPanel, type EditableSupportBlockKey } from './editor/SupportBlockEditorPanel'
import { buildSupportHtml, type SupportOfferData } from '@/lib/pdf/support-html'
import { applyPdfPreviewMode } from '@/lib/pdf/print-preview'
import type { SupportBlocks } from '@/lib/pdf/support-blocks'
import { cn } from '@/lib/utils'
import { useResizablePanel } from '@/hooks/useResizablePanel'
import { useZoom, ZOOM_LABELS } from '@/hooks/useZoom'
import type { OfferContext } from './editor/block-editors'

export interface SupportDocumentEditorProps {
    offer: SupportOfferData
    blocks: SupportBlocks
    onBlocksChange: (blocks: SupportBlocks) => void
    onDownloadPdf?: () => void
    isDownloading?: boolean
    offerContext?: OfferContext
}

const VALID_BLOCK_KEYS = new Set<EditableSupportBlockKey>([
    'cover', 'footer', 'benefits', 'packages', 'scope', 'sla', 'process', 'pricing',
])

export function SupportDocumentEditor({
    offer,
    blocks,
    onBlocksChange,
    onDownloadPdf,
    isDownloading,
    offerContext,
}: SupportDocumentEditorProps) {
    const [activeBlock, setActiveBlock] = useState<EditableSupportBlockKey | null>(null)
    const {
        containerRef,
        previewPanelStyle,
        editorPanelStyle,
        handleStyle,
        isDragging,
        onResizeMouseDown,
    } = useResizablePanel('sq_preview_ratio_support', { mode: 'preview-ratio' })
    const { zoom, zoomIn, zoomOut } = useZoom()

    const srcdoc = useMemo(
        () => applyPdfPreviewMode(buildSupportHtml(blocks, offer, { editorMode: true })),
        [blocks, offer],
    )

    useEffect(() => {
        const handler = (event: MessageEvent) => {
            if (event.data?.type === 'sq:editBlock') {
                const key = event.data.blockKey as EditableSupportBlockKey
                if (VALID_BLOCK_KEYS.has(key)) {
                    setActiveBlock(key)
                }
            }
        }
        window.addEventListener('message', handler)
        return () => window.removeEventListener('message', handler)
    }, [])

    const panelOpen = activeBlock !== null

    return (
        <div className="flex h-[clamp(520px,calc(100vh-190px),900px)] min-h-0 flex-col gap-0 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-2 flex-wrap border-b border-border bg-card px-4 py-2.5">
                <TemplateAIFillButton
                    blocks={blocks}
                    onBlocksChange={onBlocksChange}
                    clientName={offer.clientName ?? 'Klient'}
                    title={offer.offerNumber ?? 'Oferta wsparcia IT'}
                    templateType="support"
                />
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={zoomOut}
                        className="p-1.5 rounded hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
                    >
                        <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-medium w-10 text-center">{ZOOM_LABELS[zoom]}</span>
                    <button
                        type="button"
                        onClick={zoomIn}
                        className="p-1.5 rounded hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
                    >
                        <ZoomIn className="w-4 h-4" />
                    </button>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    {onDownloadPdf && (
                        <Button variant="outline" size="sm" onClick={onDownloadPdf} isLoading={isDownloading}>
                            <Download className="w-4 h-4" />
                            PDF
                        </Button>
                    )}
                </div>
            </div>

            <p className="border-b border-border bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
                Kliknij dowolną sekcję w podglądzie, aby otworzyć edytor. W panelu po prawej możesz też zarządzać kolejnością sekcji.
            </p>

            {/* Editor + side panel */}
            <div ref={containerRef} className="flex flex-1 min-h-0">
                <div
                    className={cn(
                        'min-w-0 overflow-auto bg-slate-100',
                        panelOpen ? 'flex-shrink-0' : 'flex-1',
                        !isDragging && 'transition-all duration-300',
                    )}
                    style={panelOpen ? previewPanelStyle : undefined}
                >
                    <div
                        style={{
                            transformOrigin: 'top left',
                            transform: `scale(${zoom})`,
                            width: `${100 / zoom}%`,
                            height: `${100 / zoom}%`,
                        }}
                    >
                        <iframe
                            key={srcdoc.length}
                            srcDoc={srcdoc}
                            className={cn('h-full w-full border-0', isDragging && 'pointer-events-none')}
                            title="Podgląd szablonu Wsparcie"
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
                    {panelOpen && (
                        <SupportBlockEditorPanel
                            activeBlock={activeBlock}
                            blocks={blocks}
                            onChange={onBlocksChange}
                            onClose={() => setActiveBlock(null)}
                            offerContext={offerContext}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

// ── Wizard variant ────────────────────────────────────────────────────────────

export function SupportDocumentEditorWizard({
    offer,
    blocks,
    onBlocksChange,
    offerContext,
}: {
    offer: SupportOfferData
    blocks: SupportBlocks
    onBlocksChange: (blocks: SupportBlocks) => void
    offerContext?: OfferContext
}) {
    return <SupportDocumentEditor offer={offer} blocks={blocks} onBlocksChange={onBlocksChange} offerContext={offerContext} />
}

// ── Detail page variant ───────────────────────────────────────────────────────

export function SupportDocumentEditorFromOffer({
    offer,
    blocks,
    onBlocksChange,
    onDownloadPdf,
    isDownloading,
    offerContext,
}: {
    offer: SupportOfferData & { id: string }
    blocks: SupportBlocks
    onBlocksChange: (blocks: SupportBlocks) => void
    onDownloadPdf: () => void
    isDownloading: boolean
    offerContext?: OfferContext
}) {
    return (
        <SupportDocumentEditor
            offer={offer}
            blocks={blocks}
            onBlocksChange={onBlocksChange}
            onDownloadPdf={onDownloadPdf}
            isDownloading={isDownloading}
            offerContext={offerContext}
        />
    )
}

// src/components/offers/SupportDocumentEditor.tsx
// Document-as-editor for the "Wsparcie" (IT Support / SLA) offer template.
'use client'

import { useState, useEffect, useMemo } from 'react'
import { Download, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/components/ui'
import { TemplateAIFillButton } from './TemplateAIFillButton'
import { SupportBlockEditorPanel, type EditableSupportBlockKey } from './editor/SupportBlockEditorPanel'
import { buildSupportHtml, type SupportOfferData } from '@/lib/pdf/support-html'
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
    const { panelWidth, onResizeMouseDown } = useResizablePanel('sq_editor_panel_width')
    const { zoom, zoomIn, zoomOut } = useZoom()

    const srcdoc = useMemo(
        () => buildSupportHtml(blocks, offer, { editorMode: true }),
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
        <div className="flex flex-col gap-3">
            {/* Toolbar */}
            <div className="flex items-center gap-2 flex-wrap">
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

            <p className="text-xs text-muted-foreground">
                Kliknij dowolną sekcję w podglądzie, aby otworzyć edytor. W panelu po prawej możesz też zarządzać kolejnością sekcji.
            </p>

            {/* Editor + side panel */}
            <div className="flex border border-border rounded-xl overflow-hidden" style={{ minHeight: 700 }}>
                <div className="flex-1 overflow-auto bg-slate-100">
                    <div
                        style={{
                            transformOrigin: 'top left',
                            transform: `scale(${zoom})`,
                            width: `${100 / zoom}%`,
                        }}
                    >
                        <iframe
                            srcDoc={srcdoc}
                            className="w-full border-0"
                            style={{ minHeight: `${700 / zoom}px`, height: `${900 / zoom}px` }}
                            title="Podgląd szablonu Wsparcie"
                        />
                    </div>
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

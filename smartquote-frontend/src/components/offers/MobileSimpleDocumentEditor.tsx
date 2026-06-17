// src/components/offers/MobileSimpleDocumentEditor.tsx
// iframe editor with zoom, postMessage, and download for "Aplikacja mobilna - simple".
'use client'

import { useState, useEffect, useMemo } from 'react'
import { Download, Layers, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/components/ui'
import { TemplateAIFillButton } from './TemplateAIFillButton'
import { MobileSimpleBlockEditorPanel, type EditableMobileSimpleBlockKey } from './editor/MobileSimpleBlockEditorPanel'
import { buildMobileSimpleHtml, type MobileSimpleOfferData } from '@/lib/pdf/mobile-simple-html'
import type { MobileSimpleBlocks, MobileSimpleSectionKey } from '@/lib/pdf/mobile-simple-blocks'
import { cn } from '@/lib/utils'
import { useResizablePanel } from '@/hooks/useResizablePanel'
import { useZoom, ZOOM_LABELS } from '@/hooks/useZoom'
import type { PanelView } from './editor/MobileAppBlockEditorPanel'
import type { OfferContext } from './editor/block-editors'

export interface MobileSimpleDocumentEditorProps {
    offer: MobileSimpleOfferData
    blocks: MobileSimpleBlocks
    onBlocksChange: (blocks: MobileSimpleBlocks) => void
    onDownloadPdf?: () => void
    isDownloading?: boolean
    offerContext?: OfferContext
}

const VALID_SECTION_KEYS = new Set<MobileSimpleSectionKey>(['checklist', 'tech', 'process'])
const STATIC_KEYS = new Set<EditableMobileSimpleBlockKey>(['cover', 'footer'])

export function MobileSimpleDocumentEditor({
    offer,
    blocks,
    onBlocksChange,
    onDownloadPdf,
    isDownloading,
    offerContext,
}: MobileSimpleDocumentEditorProps) {
    const [panelView, setPanelView] = useState<PanelView>(null)
    const { panelWidth, onResizeMouseDown } = useResizablePanel('sq_editor_panel_width')
    const { zoom, zoomIn, zoomOut } = useZoom()

    const srcdoc = useMemo(
        () => buildMobileSimpleHtml(blocks, offer, { editorMode: true }),
        [blocks, offer],
    )

    useEffect(() => {
        const handler = (event: MessageEvent) => {
            if (event.data?.type !== 'sq:editBlock') return
            const key = event.data.blockKey as string
            if (STATIC_KEYS.has(key as EditableMobileSimpleBlockKey)) {
                setPanelView({ kind: 'block', key: key as EditableMobileSimpleBlockKey })
            } else if (VALID_SECTION_KEYS.has(key as MobileSimpleSectionKey)) {
                setPanelView({ kind: 'block', key: key as MobileSimpleSectionKey })
            }
        }
        window.addEventListener('message', handler)
        return () => window.removeEventListener('message', handler)
    }, [])

    const panelOpen = panelView !== null

    return (
        <div className="flex flex-col gap-3">
            {/* Toolbar */}
            <div className="flex items-center gap-2 flex-wrap">
                <TemplateAIFillButton
                    blocks={blocks}
                    onBlocksChange={onBlocksChange}
                    clientName={offer.clientName ?? 'Klient'}
                    title={offer.offerNumber ?? 'Oferta aplikacji mobilnej'}
                    templateType="mobile_simple"
                />
                <div className="mx-1 h-4 w-px bg-border" />
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
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPanelView((v: PanelView) => v?.kind === 'sections' ? null : { kind: 'sections' })}
                    className={cn(panelView?.kind === 'sections' ? 'bg-primary/10 text-primary' : 'text-muted-foreground')}
                >
                    <Layers className="w-4 h-4" />
                    Sekcje
                </Button>
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
                Kliknij dowolną sekcję w podglądzie, aby otworzyć edytor. Przycisk &quot;Sekcje&quot; zarządza kolejnością i widocznością sekcji.
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
                            title="Podgląd szablonu Aplikacja mobilna - simple"
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
                        <MobileSimpleBlockEditorPanel
                            view={panelView}
                            blocks={blocks}
                            onChange={onBlocksChange}
                            onClose={() => setPanelView(null)}
                            onOpenSections={() => setPanelView({ kind: 'sections' })}
                            offerContext={offerContext}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

// ── Wizard variant ────────────────────────────────────────────────────────────

export function MobileSimpleDocumentEditorWizard({
    offer,
    blocks,
    onBlocksChange,
    offerContext,
}: {
    offer: MobileSimpleOfferData
    blocks: MobileSimpleBlocks
    onBlocksChange: (blocks: MobileSimpleBlocks) => void
    offerContext?: OfferContext
}) {
    return <MobileSimpleDocumentEditor offer={offer} blocks={blocks} onBlocksChange={onBlocksChange} offerContext={offerContext} />
}

// ── Detail page variant ───────────────────────────────────────────────────────

export function MobileSimpleDocumentEditorFromOffer({
    offer,
    blocks,
    onBlocksChange,
    onDownloadPdf,
    isDownloading,
    offerContext,
}: {
    offer: MobileSimpleOfferData & { id: string }
    blocks: MobileSimpleBlocks
    onBlocksChange: (blocks: MobileSimpleBlocks) => void
    onDownloadPdf: () => void
    isDownloading: boolean
    offerContext?: OfferContext
}) {
    return (
        <MobileSimpleDocumentEditor
            offer={offer}
            blocks={blocks}
            onBlocksChange={onBlocksChange}
            onDownloadPdf={onDownloadPdf}
            isDownloading={isDownloading}
            offerContext={offerContext}
        />
    )
}

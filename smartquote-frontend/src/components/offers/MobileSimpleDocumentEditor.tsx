// src/components/offers/MobileSimpleDocumentEditor.tsx
// iframe editor with zoom, postMessage, and download for "Aplikacja mobilna - domyślny".
'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Download, Layers, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/components/ui'
import { TemplateAIFillButton } from './TemplateAIFillButton'
import { MobileSimpleBlockEditorPanel, type EditableMobileSimpleBlockKey } from './editor/MobileSimpleBlockEditorPanel'
import { buildMobileSimpleHtml, type MobileSimpleOfferData } from '@/lib/pdf/mobile-simple-html'
import { applyPdfPreviewMode } from '@/lib/pdf/print-preview'
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
    const {
        containerRef,
        previewPanelStyle,
        editorPanelStyle,
        handleStyle,
        isDragging,
        onResizeMouseDown,
    } = useResizablePanel('sq_preview_ratio_mobile_simple', { mode: 'preview-ratio' })
    const { zoom, zoomIn, zoomOut } = useZoom()

    const srcdoc = useMemo(
        () => applyPdfPreviewMode(buildMobileSimpleHtml(blocks, offer, { editorMode: true })),
        [blocks, offer],
    )

    const iframeRef = useRef<HTMLIFrameElement>(null)

    useEffect(() => {
        const handler = (event: MessageEvent) => {
            if (event.source !== iframeRef.current?.contentWindow) return
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
        <div className="flex h-[clamp(520px,calc(100vh-190px),900px)] min-h-0 flex-col gap-0 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-2 flex-wrap border-b border-border bg-card px-4 py-2.5">
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

            <p className="border-b border-border bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
                Kliknij dowolną sekcję w podglądzie, aby otworzyć edytor. Przycisk &quot;Sekcje&quot; zarządza kolejnością i widocznością sekcji.
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
                            ref={iframeRef}
                            key={srcdoc.length}
                            srcDoc={srcdoc}
                            className={cn('h-full w-full border-0', isDragging && 'pointer-events-none')}
                            title="Podgląd szablonu Aplikacja mobilna - domyślny"
                            sandbox="allow-scripts"
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

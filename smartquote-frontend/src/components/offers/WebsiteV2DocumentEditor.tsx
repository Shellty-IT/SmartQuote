// src/components/offers/WebsiteV2DocumentEditor.tsx
// Document-as-editor for the "Strona internetowa v2" offer template.
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Download, RefreshCw, ZoomIn, ZoomOut, Layers } from 'lucide-react'
import { Button } from '@/components/ui'
import { WebsiteV2BlockEditorPanel, WebsiteV2SectionManagerPanel, type EditableWV2BlockKey } from './editor/WebsiteV2BlockEditorPanel'
import { buildWebsiteV2Html, type WebsiteV2OfferData } from '@/lib/pdf/website-v2-html'
import { mergeWebsiteV2WithDefaults, buildDefaultWebsiteV2Blocks, type WebsiteV2Blocks } from '@/lib/pdf/website-v2-blocks'
import { cn } from '@/lib/utils'
import { useResizablePanel } from '@/hooks/useResizablePanel'
import { useZoom, ZOOM_LEVELS, ZOOM_LABELS } from '@/hooks/useZoom'
import type { OfferContext } from './editor/block-editors'

export interface WebsiteV2DocumentEditorProps {
    offer: WebsiteV2OfferData
    blocks: WebsiteV2Blocks
    onBlocksChange: (blocks: WebsiteV2Blocks) => void
    onDownloadPdf?: () => void
    isDownloading?: boolean
    offerContext?: OfferContext
}

const VALID_BLOCK_KEYS: EditableWV2BlockKey[] = [
    'cover', 'footer', 'problem', 'about', 'features', 'portfolio',
    'process', 'technology', 'pricing', 'faq',
]

type PanelView = { kind: 'block'; key: EditableWV2BlockKey } | { kind: 'sections' } | null

export function WebsiteV2DocumentEditor({
    offer,
    blocks,
    onBlocksChange,
    onDownloadPdf,
    isDownloading,
    offerContext,
}: WebsiteV2DocumentEditorProps) {
    const [panelView, setPanelView] = useState<PanelView>(null)
    const { panelWidth, onResizeMouseDown } = useResizablePanel('sq_editor_panel_width')
    const { zoom, zoomIn, zoomOut } = useZoom()
    const [refreshKey, setRefreshKey] = useState(0)

    const srcdoc = useMemo(
        () => buildWebsiteV2Html({ ...offer, blocks }, { editorMode: true, zoom }),
        [offer, blocks, zoom],
    )

    useEffect(() => {
        const handler = (event: MessageEvent) => {
            if (event.data?.type === 'sq:editBlock') {
                const key = event.data.blockKey as EditableWV2BlockKey
                if (VALID_BLOCK_KEYS.includes(key)) {
                    setPanelView({ kind: 'block', key })
                }
            }
        }
        window.addEventListener('message', handler)
        return () => window.removeEventListener('message', handler)
    }, [])

    const handleSaveBlock = useCallback(
        (updatedBlocks: WebsiteV2Blocks) => {
            onBlocksChange(updatedBlocks)
            setPanelView(null)
        },
        [onBlocksChange],
    )

    const handleSaveSections = useCallback(
        (updatedBlocks: WebsiteV2Blocks) => {
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
        <div className="flex h-full min-h-[700px] flex-col gap-0 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
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

            <div className="flex flex-1 min-h-0">
                <div className="flex-1 min-w-0 overflow-auto bg-[#CDD2E2] transition-all duration-300">
                    <iframe
                        key={refreshKey}
                        srcDoc={srcdoc}
                        title="Podgląd oferty — Strona internetowa v2"
                        sandbox="allow-scripts allow-same-origin"
                        className="h-full w-full"
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
                        <WebsiteV2SectionManagerPanel
                            blocks={blocks}
                            onSave={handleSaveSections}
                            onClose={() => setPanelView(null)}
                        />
                    )}
                    {editingBlock && (
                        <WebsiteV2BlockEditorPanel
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

// ── Wizard convenience wrapper ────────────────────────────────────────────────

export interface WebsiteV2DocumentEditorWizardProps {
    client: { name: string; company?: string | null } | null
    offerTitle: string
    totalGross: number
    currency: string
    paymentDays: number
    blocks: WebsiteV2Blocks
    onBlocksChange: (blocks: WebsiteV2Blocks) => void
    userEmail?: string
    userName?: string | null
    companyInfo?: {
        name: string | null
        website: string | null
        logo: string | null
        phone: string | null
        email: string | null
    } | null
}

export function WebsiteV2DocumentEditorWizard({
    client,
    offerTitle,
    totalGross,
    currency,
    paymentDays,
    blocks,
    onBlocksChange,
    userEmail = '',
    userName = null,
    companyInfo = null,
}: WebsiteV2DocumentEditorWizardProps) {
    const previewOffer: WebsiteV2OfferData = {
        number: 'PODGLĄD',
        title: offerTitle || 'Nowa oferta',
        totalGross,
        currency,
        paymentDays,
        createdAt: new Date().toISOString(),
        client: { name: client?.name ?? 'Klient', company: client?.company ?? null },
        user: { name: userName, email: userEmail, companyInfo: companyInfo ?? null },
        blocks,
    }
    return (
        <WebsiteV2DocumentEditor
            offer={previewOffer}
            blocks={blocks}
            onBlocksChange={onBlocksChange}
        />
    )
}

// ── From-offer wrapper (detail page) ─────────────────────────────────────────

export interface WebsiteV2DocumentEditorFromOfferProps {
    offer: WebsiteV2OfferData & { blocks?: unknown }
    onBlocksChange?: (blocks: WebsiteV2Blocks) => void
    onDownloadPdf?: () => void
    isDownloading?: boolean
}

export function WebsiteV2DocumentEditorFromOffer({
    offer,
    onBlocksChange,
    onDownloadPdf,
    isDownloading,
}: WebsiteV2DocumentEditorFromOfferProps) {
    const [blocks, setBlocks] = useState<WebsiteV2Blocks>(() =>
        offer.blocks
            ? mergeWebsiteV2WithDefaults(offer.blocks as Partial<WebsiteV2Blocks>)
            : buildDefaultWebsiteV2Blocks(),
    )

    const handleBlocksChange = useCallback(
        (updated: WebsiteV2Blocks) => {
            setBlocks(updated)
            onBlocksChange?.(updated)
        },
        [onBlocksChange],
    )

    return (
        <WebsiteV2DocumentEditor
            offer={offer}
            blocks={blocks}
            onBlocksChange={handleBlocksChange}
            onDownloadPdf={onDownloadPdf}
            isDownloading={isDownloading}
        />
    )
}

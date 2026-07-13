// src/components/offers/ClassicDocumentEditor.tsx
// Document-as-editor for the "Uniwersalny - systemowy" (classic) offer template.
// Live iframe preview of the classic PDF + click-to-edit side panel. Edits the
// offer's real fields (title/description/terms + line items) — NOT a blocks JSONB.
'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Download, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/components/ui'
import { TemplateAIFillButton } from './TemplateAIFillButton'
import { ClassicBlockEditorPanel, type EditableClassicKey } from './editor/ClassicBlockEditorPanel'
import { buildClassicHtml, type ClassicOfferData } from '@/lib/pdf/classic-html'
import { applyPdfPreviewMode } from '@/lib/pdf/print-preview'
import { calculateItemTotal } from '@/app/dashboard/offers/hooks/useOfferForm'
import type { OfferDetails, ExtendedOfferItem, OfferTotalsData } from '@/app/dashboard/offers/new/types'
import type { PanelView } from './editor/MobileAppBlockEditorPanel'
import { cn } from '@/lib/utils'
import { useResizablePanel } from '@/hooks/useResizablePanel'
import { useZoom, ZOOM_LABELS } from '@/hooks/useZoom'

const VALID_KEYS = new Set<EditableClassicKey>(['info', 'description', 'items', 'terms'])

// Classic renders description/terms as plain text (esc + white-space:pre-line).
// Strip any legacy rich-text markup so the preview never shows stray tags.
function toPlainText(v: string): string {
    if (!v) return ''
    if (!/[<&]/.test(v)) return v
    return v
        .replace(/<\s*br\s*\/?>/gi, '\n')
        .replace(/<\/(p|div|li|h[1-6])\s*>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
}

export interface ClassicDocumentEditorProps {
    number: string
    createdAt: string
    currency?: string
    status?: string
    previewClient: ClassicOfferData['client']
    previewUser: ClassicOfferData['user']
    details: OfferDetails
    onUpdate: <K extends keyof OfferDetails>(field: K, value: OfferDetails[K]) => void
    items: ExtendedOfferItem[]
    totals: OfferTotalsData
    uniqueVariants: string[]
    onAddItem: () => void
    onRemoveItem: (index: number) => void
    onUpdateItem: (index: number, field: keyof ExtendedOfferItem, value: string | number | boolean) => void
    clientName: string
    onDownloadPdf?: () => void
    isDownloading?: boolean
}

export function ClassicDocumentEditor({
    number,
    createdAt,
    currency = 'PLN',
    status = 'DRAFT',
    previewClient,
    previewUser,
    details,
    onUpdate,
    items,
    totals,
    uniqueVariants,
    onAddItem,
    onRemoveItem,
    onUpdateItem,
    clientName,
    onDownloadPdf,
    isDownloading,
}: ClassicDocumentEditorProps) {
    const [panelView, setPanelView] = useState<PanelView>(null)
    const {
        containerRef,
        previewPanelStyle,
        editorPanelStyle,
        handleStyle,
        isDragging,
        onResizeMouseDown,
    } = useResizablePanel('sq_preview_ratio_classic', { mode: 'preview-ratio' })
    const { zoom, zoomIn, zoomOut } = useZoom()

    const offerData = useMemo<ClassicOfferData>(() => {
        const mappedItems = items.map((it) => {
            const { totalNet } = calculateItemTotal(it)
            return {
                name: it.name,
                description: it.description || null,
                quantity: it.quantity ?? 0,
                unit: it.unit ?? 'szt.',
                unitPrice: it.unitPrice ?? 0,
                vatRate: it.vatRate ?? 23,
                discount: it.discount ?? 0,
                totalNet,
                variantName: it.variantName.trim() || null,
            }
        })
        return {
            number,
            title: details.title,
            description: toPlainText(details.description),
            terms: toPlainText(details.terms),
            status,
            totalNet: totals.totalNet,
            totalVat: totals.totalVat,
            totalGross: totals.totalGross,
            currency,
            validUntil: details.validUntil || null,
            paymentDays: details.paymentDays,
            createdAt,
            client: previewClient,
            user: previewUser,
            items: mappedItems,
        }
    }, [number, details, status, totals, currency, createdAt, previewClient, previewUser, items])

    const srcdoc = useMemo(() => applyPdfPreviewMode(buildClassicHtml(offerData, { editorMode: true })), [offerData])

    const iframeRef = useRef<HTMLIFrameElement>(null)

    useEffect(() => {
        const handler = (event: MessageEvent) => {
            if (event.source !== iframeRef.current?.contentWindow) return
            if (event.data?.type !== 'sq:editBlock') return
            const key = event.data.blockKey as string
            if (VALID_KEYS.has(key as EditableClassicKey)) {
                setPanelView({ kind: 'block', key })
            }
        }
        window.addEventListener('message', handler)
        return () => window.removeEventListener('message', handler)
    }, [])

    const panelOpen = panelView !== null

    // AI-fill operates on the flat classic fields (title/description/terms/notes).
    // Map the returned patch back through onUpdate, key by key.
    const aiBlocks = useMemo(() => ({
        title: details.title,
        description: details.description,
        terms: details.terms,
        notes: details.notes,
    }), [details.title, details.description, details.terms, details.notes])

    return (
        <div className="flex h-[clamp(520px,calc(100vh-190px),900px)] min-h-0 flex-col gap-0 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-2 flex-wrap border-b border-border bg-card px-4 py-2.5">
                <TemplateAIFillButton
                    blocks={aiBlocks}
                    onBlocksChange={(updated) => {
                        const u = updated as Partial<typeof aiBlocks>
                        // The AI may return description/terms as HTML, but the classic
                        // template renders them as plain text (esc + pre-line). Store
                        // plain text so the real PDF never shows stray markup.
                        if (typeof u.title === 'string') onUpdate('title', u.title)
                        if (typeof u.description === 'string') onUpdate('description', toPlainText(u.description))
                        if (typeof u.terms === 'string') onUpdate('terms', toPlainText(u.terms))
                        if (typeof u.notes === 'string') onUpdate('notes', u.notes)
                    }}
                    clientName={clientName}
                    title={details.title}
                    templateType="classic"
                />
                <div className="mx-1 h-4 w-px bg-border" />
                <div className="flex items-center gap-1">
                    <button type="button" onClick={zoomOut}
                        className="p-1.5 rounded hover:bg-secondary/60 text-muted-foreground hover:text-foreground">
                        <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-medium w-10 text-center">{ZOOM_LABELS[zoom]}</span>
                    <button type="button" onClick={zoomIn}
                        className="p-1.5 rounded hover:bg-secondary/60 text-muted-foreground hover:text-foreground">
                        <ZoomIn className="w-4 h-4" />
                    </button>
                </div>
                {onDownloadPdf && (
                    <div className="ml-auto flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={onDownloadPdf} isLoading={isDownloading}>
                            <Download className="w-4 h-4" />
                            PDF
                        </Button>
                    </div>
                )}
            </div>

            <p className="border-b border-border bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
                Kliknij dowolną sekcję w podglądzie (dane, opis, pozycje, warunki), aby ją edytować.
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
                    <div style={{ transformOrigin: 'top left', transform: `scale(${zoom})`, width: `${100 / zoom}%`, height: `${100 / zoom}%` }}>
                        <iframe
                            ref={iframeRef}
                            srcDoc={srcdoc}
                            className={cn('h-full w-full border-0', isDragging && 'pointer-events-none')}
                            title="Podgląd oferty klasycznej"
                            sandbox="allow-scripts"
                        />
                    </div>
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

                <div
                    className={cn(
                        'min-w-0 overflow-hidden border-l border-border',
                        panelOpen ? '' : 'w-0 flex-shrink-0',
                        !isDragging && 'transition-all duration-300',
                    )}
                    style={panelOpen ? editorPanelStyle : undefined}
                >
                    {panelOpen && (
                        <ClassicBlockEditorPanel
                            view={panelView}
                            details={details}
                            onUpdate={onUpdate}
                            items={items}
                            totals={totals}
                            uniqueVariants={uniqueVariants}
                            onAddItem={onAddItem}
                            onRemoveItem={onRemoveItem}
                            onUpdateItem={onUpdateItem}
                            onClose={() => setPanelView(null)}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

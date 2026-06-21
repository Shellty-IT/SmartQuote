// src/components/contracts/editor/ContractDocumentEditor.tsx
// Document-as-editor for the "Umowa — Krótka" contract template.
// Renders the contract HTML in an iframe. User clicks a section → side panel opens.
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
    ContractBlockEditorPanel,
    SectionManagerPanel,
    type EditableSectionKey,
} from './ContractBlockEditorPanel'
import { ContractEditorToolbar } from './ContractEditorToolbar'
import { TemplateAIFillButton } from '@/components/offers/TemplateAIFillButton'
import { buildContractShortHtml } from '@/lib/pdf/contract-short-html'
import { mergeContractWithDefaults, type ContractShortBlocks } from '@/lib/pdf/contract-short-blocks'
import { cn } from '@/lib/utils'
import { useResizablePanel } from '@/hooks/useResizablePanel'
import { useZoom } from '@/hooks/useZoom'
import type { OfferContext } from '@/components/offers/editor/block-editors'
import { useContractCompanyLogo } from '@/hooks/useContractCompanyLogo'

export interface ContractDocumentEditorProps {
    blocks: ContractShortBlocks
    onBlocksChange: (blocks: ContractShortBlocks) => void
    onDownloadPdf?: () => void
    isDownloading?: boolean
    showSaveButton?: boolean
    onSave?: () => void
    isSaving?: boolean
    aiContext?: OfferContext
}

const VALID_SECTION_KEYS: EditableSectionKey[] = [
    'header',
    'parties', 'subject', 'deadline', 'payment', 'obligations',
    'acceptance', 'copyright', 'warranty', 'confidentiality', 'finalProvisions',
    'signatures',
]

type PanelView = { kind: 'section'; key: EditableSectionKey } | { kind: 'sections' } | null

export function ContractDocumentEditor({
    blocks,
    onBlocksChange,
    onDownloadPdf,
    isDownloading,
    showSaveButton,
    onSave,
    isSaving,
    aiContext,
}: ContractDocumentEditorProps) {
    const [panelView, setPanelView] = useState<PanelView>(null)
    const [refreshKey, setRefreshKey] = useState(0)
    const {
        containerRef,
        previewPanelStyle,
        editorPanelStyle,
        handleStyle,
        isDragging,
        onResizeMouseDown,
    } = useResizablePanel('sq_preview_ratio_contract', { mode: 'preview-ratio' })
    const { zoom, zoomIn, zoomOut } = useZoom()

    const activeKey = panelView?.kind === 'section' ? panelView.key : null
    useContractCompanyLogo(blocks, onBlocksChange)

    const srcdoc = useMemo(
        () => buildContractShortHtml(blocks, { editorMode: true, zoom, activeSection: activeKey }),
        [blocks, zoom, activeKey],
    )

    // Listen for postMessage events from the iframe
    useEffect(() => {
        const handler = (event: MessageEvent) => {
            if (event.data?.type === 'sq:editSection') {
                const key = event.data.sectionKey as EditableSectionKey
                if (VALID_SECTION_KEYS.includes(key)) {
                    setPanelView({ kind: 'section', key })
                }
            }
        }
        window.addEventListener('message', handler)
        return () => window.removeEventListener('message', handler)
    }, [])

    const handleSaveSection = useCallback(
        (updatedBlocks: ContractShortBlocks) => {
            onBlocksChange(updatedBlocks)
            setPanelView(null)
        },
        [onBlocksChange],
    )

    const handleSaveSections = useCallback(
        (updatedBlocks: ContractShortBlocks) => {
            onBlocksChange(updatedBlocks)
        },
        [onBlocksChange],
    )

    const handleClosePanel = useCallback(() => {
        setPanelView(null)
    }, [])

    const handleRefresh = useCallback(() => setRefreshKey(n => n + 1), [])

    const panelOpen = panelView !== null
    const showSections = panelView?.kind === 'sections'
    const editingSection = panelView?.kind === 'section' ? panelView.key : null

    return (
        <div className="flex h-full min-h-[700px] flex-col gap-0 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <ContractEditorToolbar
                zoom={zoom}
                zoomIn={zoomIn}
                zoomOut={zoomOut}
                showSections={showSections}
                onToggleSections={() => setPanelView(showSections ? null : { kind: 'sections' })}
                onRefresh={handleRefresh}
                onDownloadPdf={onDownloadPdf}
                isDownloading={isDownloading}
                showSaveButton={showSaveButton}
                onSave={onSave}
                isSaving={isSaving}
                aiFill={(
                    <TemplateAIFillButton
                        blocks={blocks}
                        onBlocksChange={onBlocksChange}
                        clientName={aiContext?.clientName ?? 'Klient'}
                        title={aiContext?.title ?? 'Umowa'}
                        templateType="short"
                        entityType="contract"
                    />
                )}
            />

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
                        title="Podgląd umowy"
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
                    {editingSection && (
                        <ContractBlockEditorPanel
                            key={editingSection}
                            sectionKey={editingSection}
                            blocks={blocks}
                            onSave={handleSaveSection}
                            onClose={handleClosePanel}
                            aiContext={aiContext}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

// ── Convenience wrapper: builds blocks from raw saved data ────────────────────

export interface ContractDocumentEditorFromSavedProps {
    savedBlocks?: unknown
    onBlocksChange?: (blocks: ContractShortBlocks) => void
    onDownloadPdf?: () => void
    isDownloading?: boolean
}

export function ContractDocumentEditorFromSaved({
    savedBlocks,
    onBlocksChange,
    onDownloadPdf,
    isDownloading,
}: ContractDocumentEditorFromSavedProps) {
    const [blocks, setBlocks] = useState<ContractShortBlocks>(() =>
        mergeContractWithDefaults(
            savedBlocks && typeof savedBlocks === 'object'
                ? (savedBlocks as Partial<ContractShortBlocks>)
                : null,
        ),
    )

    const handleBlocksChange = useCallback(
        (updated: ContractShortBlocks) => {
            setBlocks(updated)
            onBlocksChange?.(updated)
        },
        [onBlocksChange],
    )

    return (
        <ContractDocumentEditor
            blocks={blocks}
            onBlocksChange={handleBlocksChange}
            onDownloadPdf={onDownloadPdf}
            isDownloading={isDownloading}
        />
    )
}

// src/components/contracts/editor/ContractDedicatedDocumentEditor.tsx
// Document-as-editor for the "System dedykowany" contract template.
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
    ContractDedicatedBlockEditorPanel,
    DedicatedSectionManagerPanel,
    type DedicatedEditableSectionKey,
} from './ContractDedicatedBlockEditorPanel'
import { ContractEditorToolbar } from './ContractEditorToolbar'
import { TemplateAIFillButton } from '@/components/offers/TemplateAIFillButton'
import { buildContractDedicatedHtml } from '@/lib/pdf/contract-dedicated-html'
import { mergeDedicatedWithDefaults, type ContractDedicatedBlocks } from '@/lib/pdf/contract-dedicated-blocks'
import { useZoom } from '@/hooks/useZoom'
import { useResizablePanel } from '@/hooks/useResizablePanel'
import { cn } from '@/lib/utils'
import type { OfferContext } from '@/components/offers/editor/block-editors'
import { useContractCompanyLogo } from '@/hooks/useContractCompanyLogo'

export interface ContractDedicatedDocumentEditorProps {
    blocks: ContractDedicatedBlocks
    onBlocksChange: (blocks: ContractDedicatedBlocks) => void
    onDownloadPdf?: () => void
    isDownloading?: boolean
    showSaveButton?: boolean
    onSave?: () => void
    isSaving?: boolean
    aiContext?: OfferContext
}

const VALID_SECTION_KEYS: DedicatedEditableSectionKey[] = [
    'header', 'parties', 'subject', 'phases', 'spec', 'obligations', 'timeline',
    'payment', 'scopeCreep', 'acceptance', 'infrastructure', 'gdpr',
    'copyright', 'confidentiality', 'warranty', 'termination', 'general', 'signatures',
]

type PanelView = { kind: 'section'; key: DedicatedEditableSectionKey } | { kind: 'sections' } | null

export function ContractDedicatedDocumentEditor({
    blocks, onBlocksChange, onDownloadPdf, isDownloading, showSaveButton, onSave, isSaving, aiContext,
}: ContractDedicatedDocumentEditorProps) {
    const [panelView, setPanelView] = useState<PanelView>(null)
    const { zoom, zoomIn, zoomOut } = useZoom()
    const [refreshKey, setRefreshKey] = useState(0)
    const {
        containerRef,
        previewPanelStyle,
        editorPanelStyle,
        handleStyle,
        isDragging,
        onResizeMouseDown,
    } = useResizablePanel('sq_preview_ratio_contract_dedicated', { mode: 'preview-ratio' })

    const activeKey = panelView?.kind === 'section' ? panelView.key : null
    useContractCompanyLogo(blocks, onBlocksChange)

    const srcdoc = useMemo(
        () => buildContractDedicatedHtml(blocks, { editorMode: true, zoom, activeSection: activeKey }),
        [blocks, zoom, activeKey],
    )

    useEffect(() => {
        const handler = (event: MessageEvent) => {
            if (event.data?.type === 'sq:editSection') {
                const key = event.data.sectionKey as DedicatedEditableSectionKey
                if (VALID_SECTION_KEYS.includes(key)) setPanelView({ kind: 'section', key })
            }
        }
        window.addEventListener('message', handler)
        return () => window.removeEventListener('message', handler)
    }, [])

    const handleSaveSection = useCallback((updated: ContractDedicatedBlocks) => {
        onBlocksChange(updated)
        setPanelView(null)
    }, [onBlocksChange])

    const handleSaveSections = useCallback((updated: ContractDedicatedBlocks) => {
        onBlocksChange(updated)
    }, [onBlocksChange])

    const handleRefresh = useCallback(() => setRefreshKey(n => n + 1), [])

    const panelOpen = panelView !== null
    const showSections = panelView?.kind === 'sections'
    const editingSection = panelView?.kind === 'section' ? panelView.key : null

    return (
        <div className="flex h-full min-h-[700px] flex-col gap-0 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <ContractEditorToolbar
                zoom={zoom} zoomIn={zoomIn} zoomOut={zoomOut}
                showSections={showSections}
                onToggleSections={() => setPanelView(showSections ? null : { kind: 'sections' })}
                onRefresh={handleRefresh}
                onDownloadPdf={onDownloadPdf} isDownloading={isDownloading}
                showSaveButton={showSaveButton} onSave={onSave} isSaving={isSaving}
                aiFill={(
                    <TemplateAIFillButton
                        blocks={blocks}
                        onBlocksChange={onBlocksChange}
                        clientName={aiContext?.clientName ?? 'Klient'}
                        title={aiContext?.title ?? 'Umowa'}
                        templateType="dedicated"
                        entityType="contract"
                    />
                )}
            />
            <div ref={containerRef} className="flex flex-1 min-h-0">
                <div
                    className={cn(
                        'min-w-0 overflow-auto bg-[#CDD2E2]',
                        panelOpen ? 'flex-shrink-0' : 'flex-1',
                        !isDragging && 'transition-all duration-300',
                    )}
                    style={panelOpen ? previewPanelStyle : undefined}
                >
                    <iframe key={refreshKey} srcDoc={srcdoc} title="Podgląd umowy" sandbox="allow-scripts allow-same-origin" className={cn('h-full w-full', isDragging && 'pointer-events-none')} style={{ minHeight: 700 }} />
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
                    {showSections && <DedicatedSectionManagerPanel blocks={blocks} onSave={handleSaveSections} onClose={() => setPanelView(null)} />}
                    {editingSection && <ContractDedicatedBlockEditorPanel key={editingSection} sectionKey={editingSection} blocks={blocks} onSave={handleSaveSection} onClose={() => setPanelView(null)} aiContext={aiContext} />}
                </div>
            </div>
        </div>
    )
}

export function ContractDedicatedDocumentEditorFromSaved({
    savedBlocks, onBlocksChange, onDownloadPdf, isDownloading,
}: { savedBlocks?: unknown; onBlocksChange?: (b: ContractDedicatedBlocks) => void; onDownloadPdf?: () => void; isDownloading?: boolean }) {
    const [blocks, setBlocks] = useState<ContractDedicatedBlocks>(() =>
        mergeDedicatedWithDefaults(savedBlocks && typeof savedBlocks === 'object' ? (savedBlocks as Partial<ContractDedicatedBlocks>) : null),
    )
    const handleChange = useCallback((updated: ContractDedicatedBlocks) => {
        setBlocks(updated)
        onBlocksChange?.(updated)
    }, [onBlocksChange])
    return <ContractDedicatedDocumentEditor blocks={blocks} onBlocksChange={handleChange} onDownloadPdf={onDownloadPdf} isDownloading={isDownloading} />
}

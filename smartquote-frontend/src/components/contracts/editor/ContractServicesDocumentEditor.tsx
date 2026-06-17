// src/components/contracts/editor/ContractServicesDocumentEditor.tsx
// Document-as-editor for the "Sklep internetowy" contract template.
// Renders the contract HTML in an iframe. User clicks a section → side panel opens.
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
    ContractServicesBlockEditorPanel,
    ServicesSectionManagerPanel,
    type ServicesEditableSectionKey,
} from './ContractServicesBlockEditorPanel'
import { ContractEditorToolbar } from './ContractEditorToolbar'
import { TemplateAIFillButton } from '@/components/offers/TemplateAIFillButton'
import { buildContractServicesHtml } from '@/lib/pdf/contract-services-html'
import { mergeServicesWithDefaults, type ContractServicesBlocks } from '@/lib/pdf/contract-services-blocks'
import { useZoom } from '@/hooks/useZoom'
import { cn } from '@/lib/utils'
import type { OfferContext } from '@/components/offers/editor/block-editors'

export interface ContractServicesDocumentEditorProps {
    blocks: ContractServicesBlocks
    onBlocksChange: (blocks: ContractServicesBlocks) => void
    onDownloadPdf?: () => void
    isDownloading?: boolean
    showSaveButton?: boolean
    onSave?: () => void
    isSaving?: boolean
    aiContext?: OfferContext
}

const VALID_SECTION_KEYS: ServicesEditableSectionKey[] = [
    'header',
    'parties', 'subject', 'scope', 'obligations', 'timeline', 'payment',
    'revisions', 'acceptance', 'copyright', 'confidentiality', 'liability',
    'warranty', 'termination', 'general', 'signatures',
]

type PanelView = { kind: 'section'; key: ServicesEditableSectionKey } | { kind: 'sections' } | null

export function ContractServicesDocumentEditor({
    blocks, onBlocksChange, onDownloadPdf, isDownloading, showSaveButton, onSave, isSaving, aiContext,
}: ContractServicesDocumentEditorProps) {
    const [panelView, setPanelView] = useState<PanelView>(null)
    const { zoom, zoomIn, zoomOut } = useZoom()
    const [refreshKey, setRefreshKey] = useState(0)

    const activeKey = panelView?.kind === 'section' ? panelView.key : null

    const srcdoc = useMemo(
        () => buildContractServicesHtml(blocks, { editorMode: true, zoom, activeSection: activeKey }),
        [blocks, zoom, activeKey],
    )

    useEffect(() => {
        const handler = (event: MessageEvent) => {
            if (event.data?.type === 'sq:editSection') {
                const key = event.data.sectionKey as ServicesEditableSectionKey
                if (VALID_SECTION_KEYS.includes(key)) setPanelView({ kind: 'section', key })
            }
        }
        window.addEventListener('message', handler)
        return () => window.removeEventListener('message', handler)
    }, [])

    const handleSaveSection = useCallback((updatedBlocks: ContractServicesBlocks) => {
        onBlocksChange(updatedBlocks)
        setPanelView(null)
    }, [onBlocksChange])

    const handleSaveSections = useCallback((updatedBlocks: ContractServicesBlocks) => {
        onBlocksChange(updatedBlocks)
    }, [onBlocksChange])

    const handleClosePanel = useCallback(() => setPanelView(null), [])
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
                        templateType="services"
                        entityType="contract"
                    />
                )}
            />
            <div className="flex flex-1 min-h-0">
                <div className="flex-1 min-w-0 overflow-auto bg-[#CDD2E2] transition-all duration-300">
                    <iframe
                        key={refreshKey}
                        srcDoc={srcdoc}
                        title="Podgląd umowy"
                        sandbox="allow-scripts allow-same-origin"
                        className="h-full w-full"
                        style={{ minHeight: 700 }}
                    />
                </div>
                <div className={cn('flex-shrink-0 overflow-hidden border-l border-border transition-all duration-300', panelOpen ? 'w-[380px]' : 'w-0')}>
                    {showSections && (
                        <ServicesSectionManagerPanel blocks={blocks} onSave={handleSaveSections} onClose={handleClosePanel} />
                    )}
                    {editingSection && (
                        <ContractServicesBlockEditorPanel
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

export interface ContractServicesDocumentEditorFromSavedProps {
    savedBlocks?: unknown
    onBlocksChange?: (blocks: ContractServicesBlocks) => void
    onDownloadPdf?: () => void
    isDownloading?: boolean
}

export function ContractServicesDocumentEditorFromSaved({
    savedBlocks, onBlocksChange, onDownloadPdf, isDownloading,
}: ContractServicesDocumentEditorFromSavedProps) {
    const [blocks, setBlocks] = useState<ContractServicesBlocks>(() =>
        mergeServicesWithDefaults(
            savedBlocks && typeof savedBlocks === 'object' ? (savedBlocks as Partial<ContractServicesBlocks>) : null,
        ),
    )
    const handleBlocksChange = useCallback((updated: ContractServicesBlocks) => {
        setBlocks(updated)
        onBlocksChange?.(updated)
    }, [onBlocksChange])
    return (
        <ContractServicesDocumentEditor
            blocks={blocks}
            onBlocksChange={handleBlocksChange}
            onDownloadPdf={onDownloadPdf}
            isDownloading={isDownloading}
        />
    )
}

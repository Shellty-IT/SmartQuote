// src/components/contracts/editor/ContractMobileDocumentEditor.tsx
// Document-as-editor for the "Aplikacja mobilna" contract template.
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
    ContractMobileBlockEditorPanel,
    MobileSectionManagerPanel,
    type MobileEditableSectionKey,
} from './ContractMobileBlockEditorPanel'
import { ContractEditorToolbar } from './ContractEditorToolbar'
import { TemplateAIFillButton } from '@/components/offers/TemplateAIFillButton'
import { buildContractMobileHtml } from '@/lib/pdf/contract-mobile-html'
import { mergeMobileWithDefaults, type ContractMobileBlocks } from '@/lib/pdf/contract-mobile-blocks'
import { useZoom } from '@/hooks/useZoom'
import { cn } from '@/lib/utils'
import type { OfferContext } from '@/components/offers/editor/block-editors'

export interface ContractMobileDocumentEditorProps {
    blocks: ContractMobileBlocks
    onBlocksChange: (blocks: ContractMobileBlocks) => void
    onDownloadPdf?: () => void
    isDownloading?: boolean
    showSaveButton?: boolean
    onSave?: () => void
    isSaving?: boolean
    aiContext?: OfferContext
}

const VALID_SECTION_KEYS: MobileEditableSectionKey[] = [
    'header', 'parties', 'subject', 'scope', 'obligations', 'timeline', 'payment',
    'revisions', 'acceptance', 'repository', 'backend', 'gdpr',
    'copyright', 'confidentiality', 'warranty', 'termination', 'general', 'signatures',
]

type PanelView = { kind: 'section'; key: MobileEditableSectionKey } | { kind: 'sections' } | null

export function ContractMobileDocumentEditor({
    blocks, onBlocksChange, onDownloadPdf, isDownloading, showSaveButton, onSave, isSaving, aiContext,
}: ContractMobileDocumentEditorProps) {
    const [panelView, setPanelView] = useState<PanelView>(null)
    const { zoom, zoomIn, zoomOut } = useZoom()
    const [refreshKey, setRefreshKey] = useState(0)

    const activeKey = panelView?.kind === 'section' ? panelView.key : null

    const srcdoc = useMemo(
        () => buildContractMobileHtml(blocks, { editorMode: true, zoom, activeSection: activeKey }),
        [blocks, zoom, activeKey],
    )

    useEffect(() => {
        const handler = (event: MessageEvent) => {
            if (event.data?.type === 'sq:editSection') {
                const key = event.data.sectionKey as MobileEditableSectionKey
                if (VALID_SECTION_KEYS.includes(key)) setPanelView({ kind: 'section', key })
            }
        }
        window.addEventListener('message', handler)
        return () => window.removeEventListener('message', handler)
    }, [])

    const handleSaveSection = useCallback((updated: ContractMobileBlocks) => {
        onBlocksChange(updated)
        setPanelView(null)
    }, [onBlocksChange])

    const handleSaveSections = useCallback((updated: ContractMobileBlocks) => {
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
                        title={aiContext?.title ?? 'Umowa aplikacji mobilnej'}
                        templateType="mobile"
                        entityType="contract"
                    />
                )}
            />
            <div className="flex flex-1 min-h-0">
                <div className="flex-1 min-w-0 overflow-auto bg-[#CDD2E2]">
                    <iframe key={refreshKey} srcDoc={srcdoc} title="Podgląd umowy" sandbox="allow-scripts allow-same-origin" className="h-full w-full" style={{ minHeight: 700 }} />
                </div>
                <div className={cn('flex-shrink-0 overflow-hidden border-l border-border transition-all duration-300', panelOpen ? 'w-[380px]' : 'w-0')}>
                    {showSections && <MobileSectionManagerPanel blocks={blocks} onSave={handleSaveSections} onClose={() => setPanelView(null)} />}
                    {editingSection && <ContractMobileBlockEditorPanel key={editingSection} sectionKey={editingSection} blocks={blocks} onSave={handleSaveSection} onClose={() => setPanelView(null)} aiContext={aiContext} />}
                </div>
            </div>
        </div>
    )
}

export function ContractMobileDocumentEditorFromSaved({
    savedBlocks, onBlocksChange, onDownloadPdf, isDownloading,
}: { savedBlocks?: unknown; onBlocksChange?: (b: ContractMobileBlocks) => void; onDownloadPdf?: () => void; isDownloading?: boolean }) {
    const [blocks, setBlocks] = useState<ContractMobileBlocks>(() =>
        mergeMobileWithDefaults(savedBlocks && typeof savedBlocks === 'object' ? (savedBlocks as Partial<ContractMobileBlocks>) : null),
    )
    const handleChange = useCallback((updated: ContractMobileBlocks) => {
        setBlocks(updated)
        onBlocksChange?.(updated)
    }, [onBlocksChange])
    return <ContractMobileDocumentEditor blocks={blocks} onBlocksChange={handleChange} onDownloadPdf={onDownloadPdf} isDownloading={isDownloading} />
}

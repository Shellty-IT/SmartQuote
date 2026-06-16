// src/components/contracts/editor/ContractSlaDocumentEditor.tsx
// Document-as-editor for the "Opieka IT" (SLA) contract template.
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
    ContractSlaBlockEditorPanel,
    SlaSectionManagerPanel,
    type SlaEditableSectionKey,
} from './ContractSlaBlockEditorPanel'
import { ContractEditorToolbar } from './ContractEditorToolbar'
import { buildContractSlaHtml } from '@/lib/pdf/contract-sla-html'
import { mergeSlaWithDefaults, type ContractSlaBlocks } from '@/lib/pdf/contract-sla-blocks'
import { useZoom } from '@/hooks/useZoom'
import { cn } from '@/lib/utils'
import type { OfferContext } from '@/components/offers/editor/block-editors'

export interface ContractSlaDocumentEditorProps {
    blocks: ContractSlaBlocks
    onBlocksChange: (blocks: ContractSlaBlocks) => void
    onDownloadPdf?: () => void
    isDownloading?: boolean
    showSaveButton?: boolean
    onSave?: () => void
    isSaving?: boolean
    aiContext?: OfferContext
}

const VALID_SECTION_KEYS: SlaEditableSectionKey[] = [
    'header', 'parties', 'subject', 'package', 'services', 'priorities',
    'incidents', 'obligations', 'reporting', 'confidentiality',
    'liability', 'termination', 'general', 'signatures',
]

type PanelView = { kind: 'section'; key: SlaEditableSectionKey } | { kind: 'sections' } | null

export function ContractSlaDocumentEditor({
    blocks, onBlocksChange, onDownloadPdf, isDownloading, showSaveButton, onSave, isSaving, aiContext,
}: ContractSlaDocumentEditorProps) {
    const [panelView, setPanelView] = useState<PanelView>(null)
    const { zoom, zoomIn, zoomOut } = useZoom()
    const [refreshKey, setRefreshKey] = useState(0)

    const activeKey = panelView?.kind === 'section' ? panelView.key : null

    const srcdoc = useMemo(
        () => buildContractSlaHtml(blocks, { editorMode: true, zoom, activeSection: activeKey }),
        [blocks, zoom, activeKey],
    )

    useEffect(() => {
        const handler = (event: MessageEvent) => {
            if (event.data?.type === 'sq:editSection') {
                const key = event.data.sectionKey as SlaEditableSectionKey
                if (VALID_SECTION_KEYS.includes(key)) setPanelView({ kind: 'section', key })
            }
        }
        window.addEventListener('message', handler)
        return () => window.removeEventListener('message', handler)
    }, [])

    const handleSaveSection = useCallback((updated: ContractSlaBlocks) => {
        onBlocksChange(updated)
        setPanelView(null)
    }, [onBlocksChange])

    const handleSaveSections = useCallback((updated: ContractSlaBlocks) => {
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
            />
            <div className="flex flex-1 min-h-0">
                <div className="flex-1 min-w-0 overflow-auto bg-[#CDD2E2]">
                    <iframe key={refreshKey} srcDoc={srcdoc} title="Podgląd umowy" sandbox="allow-scripts allow-same-origin" className="h-full w-full" style={{ minHeight: 700 }} />
                </div>
                <div className={cn('flex-shrink-0 overflow-hidden border-l border-border transition-all duration-300', panelOpen ? 'w-[380px]' : 'w-0')}>
                    {showSections && <SlaSectionManagerPanel blocks={blocks} onSave={handleSaveSections} onClose={() => setPanelView(null)} />}
                    {editingSection && <ContractSlaBlockEditorPanel key={editingSection} sectionKey={editingSection} blocks={blocks} onSave={handleSaveSection} onClose={() => setPanelView(null)} aiContext={aiContext} />}
                </div>
            </div>
        </div>
    )
}

export function ContractSlaDocumentEditorFromSaved({
    savedBlocks, onBlocksChange, onDownloadPdf, isDownloading,
}: { savedBlocks?: unknown; onBlocksChange?: (b: ContractSlaBlocks) => void; onDownloadPdf?: () => void; isDownloading?: boolean }) {
    const [blocks, setBlocks] = useState<ContractSlaBlocks>(() =>
        mergeSlaWithDefaults(savedBlocks && typeof savedBlocks === 'object' ? (savedBlocks as Partial<ContractSlaBlocks>) : null),
    )
    const handleChange = useCallback((updated: ContractSlaBlocks) => {
        setBlocks(updated)
        onBlocksChange?.(updated)
    }, [onBlocksChange])
    return <ContractSlaDocumentEditor blocks={blocks} onBlocksChange={handleChange} onDownloadPdf={onDownloadPdf} isDownloading={isDownloading} />
}

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
import { buildContractShortHtml } from '@/lib/pdf/contract-short-html'
import { mergeContractWithDefaults, type ContractShortBlocks } from '@/lib/pdf/contract-short-blocks'
import { cn } from '@/lib/utils'
import { useZoom } from '@/hooks/useZoom'
import type { OfferContext } from '@/components/offers/editor/block-editors'

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
    const { zoom, zoomIn, zoomOut } = useZoom()

    const activeKey = panelView?.kind === 'section' ? panelView.key : null

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
            />

            {/* Main area: document + optional editor panel */}
            <div className="flex flex-1 min-h-0">
                {/* Document iframe */}
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

                {/* Side panel */}
                <div
                    className={cn(
                        'flex-shrink-0 overflow-hidden border-l border-border transition-all duration-300',
                        panelOpen ? 'w-[380px]' : 'w-0',
                    )}
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

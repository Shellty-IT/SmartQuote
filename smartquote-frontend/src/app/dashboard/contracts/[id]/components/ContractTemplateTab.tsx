// src/app/dashboard/contracts/[id]/components/ContractTemplateTab.tsx
// Tab for editing and downloading the contract template.
// Mirrors the TemplateTab pattern used for offer proposals.
'use client'

import { useState, useCallback, useMemo } from 'react'
import { Eye, Download } from 'lucide-react'
import { Button } from '@/components/ui'
import { PdfPreviewModal } from '@/components/pdf/PdfPreviewModal'
import { ContractDocumentEditor } from '@/components/contracts/editor/ContractDocumentEditor'
import { ContractServicesDocumentEditor } from '@/components/contracts/editor/ContractServicesDocumentEditor'
import { ContractDedicatedDocumentEditor } from '@/components/contracts/editor/ContractDedicatedDocumentEditor'
import { ContractSlaDocumentEditor } from '@/components/contracts/editor/ContractSlaDocumentEditor'
import { ContractMobileDocumentEditor } from '@/components/contracts/editor/ContractMobileDocumentEditor'
import { contractsApi } from '@/lib/api'
import { useToast } from '@/contexts/ToastContext'
import { useTranslations } from '@/i18n'
import { mergeContractWithDefaults, type ContractShortBlocks } from '@/lib/pdf/contract-short-blocks'
import { mergeServicesWithDefaults, type ContractServicesBlocks } from '@/lib/pdf/contract-services-blocks'
import { mergeDedicatedWithDefaults, type ContractDedicatedBlocks } from '@/lib/pdf/contract-dedicated-blocks'
import { mergeSlaWithDefaults, type ContractSlaBlocks } from '@/lib/pdf/contract-sla-blocks'
import { mergeMobileWithDefaults, type ContractMobileBlocks } from '@/lib/pdf/contract-mobile-blocks'
import type { OfferContext } from '@/components/offers/editor/block-editors'
import type { Contract } from '@/types'
import { downloadContractDocument, getContractHtmlPreviewUrl } from '@/lib/document-pdf'

interface ContractTemplateTabProps {
    contract: Contract
    onSaved: () => void
}

export function ContractTemplateTab({ contract, onSaved }: ContractTemplateTabProps) {
    const t = useTranslations('contractDetailPage')
    const toast = useToast()

    const templateType = contract.templateType ?? 'classic'
    const aiContext = useMemo<OfferContext>(() => ({
        title: contract.title,
        clientName: contract.client?.name ?? '',
        totalGross: 0,
        currency: 'PLN',
    }), [contract.title, contract.client?.name])
    const [blocks, setBlocks] = useState<ContractShortBlocks>(() =>
        mergeContractWithDefaults(contract.blocks as Partial<ContractShortBlocks> | null),
    )
    const [servicesBlocks, setServicesBlocks] = useState<ContractServicesBlocks>(() =>
        mergeServicesWithDefaults(contract.blocks as Partial<ContractServicesBlocks> | null),
    )
    const [dedicatedBlocks, setDedicatedBlocks] = useState<ContractDedicatedBlocks>(() =>
        mergeDedicatedWithDefaults(contract.blocks as Partial<ContractDedicatedBlocks> | null),
    )
    const [slaBlocks, setSlaBlocks] = useState<ContractSlaBlocks>(() =>
        mergeSlaWithDefaults(contract.blocks as Partial<ContractSlaBlocks> | null),
    )
    const [mobileBlocks, setMobileBlocks] = useState<ContractMobileBlocks>(() =>
        mergeMobileWithDefaults(contract.blocks as Partial<ContractMobileBlocks> | null),
    )
    const [isDownloading, setIsDownloading] = useState(false)

    // ── Short template — download PDF ───────────────────────────────────────────

    const handleShortDownload = async () => {
        setIsDownloading(true)
        try {
            const blob = await downloadContractDocument(contract.id, 'short')
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `Umowa_${contract.number.replace(/\//g, '-')}_strona.pdf`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
            toast.success(t.toasts.pdfDownloaded, contract.number)
        } catch {
            toast.error(t.toasts.pdfError, t.toasts.pdfErrorDesc)
        } finally {
            setIsDownloading(false)
        }
    }

    // ── Services template — download PDF ────────────────────────────────────────

    const [isServicesDownloading, setIsServicesDownloading] = useState(false)

    const handleServicesDownload = async () => {
        setIsServicesDownloading(true)
        try {
            const blob = await downloadContractDocument(contract.id, 'services')
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `Umowa_${contract.number.replace(/\//g, '-')}_sklep.pdf`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
            toast.success(t.toasts.pdfDownloaded, contract.number)
        } catch {
            toast.error(t.toasts.pdfError, t.toasts.pdfErrorDesc)
        } finally {
            setIsServicesDownloading(false)
        }
    }

    const [servicesPreviewOpen, setServicesPreviewOpen] = useState(false)
    const servicesPreviewUrl = useMemo(
        () => getContractHtmlPreviewUrl(contract.id, 'services'),
        [contract.id],
    )

    // ── Dedicated template ──────────────────────────────────────────────────────

    const [isDedicatedDownloading, setIsDedicatedDownloading] = useState(false)
    const [dedicatedPreviewOpen, setDedicatedPreviewOpen] = useState(false)
    const dedicatedPreviewUrl = useMemo(() => getContractHtmlPreviewUrl(contract.id, 'dedicated'), [contract.id])

    const handleDedicatedDownload = async () => {
        setIsDedicatedDownloading(true)
        try {
            const blob = await downloadContractDocument(contract.id, 'dedicated')
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `Umowa_${contract.number.replace(/\//g, '-')}_system_dedykowany.pdf`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
            toast.success(t.toasts.pdfDownloaded, contract.number)
        } catch {
            toast.error(t.toasts.pdfError, t.toasts.pdfErrorDesc)
        } finally {
            setIsDedicatedDownloading(false)
        }
    }

    // ── SLA template ────────────────────────────────────────────────────────────

    const [isSlaDownloading, setIsSlaDownloading] = useState(false)
    const [slaPreviewOpen, setSlaPreviewOpen] = useState(false)
    const slaPreviewUrl = useMemo(() => getContractHtmlPreviewUrl(contract.id, 'sla'), [contract.id])

    const handleSlaDownload = async () => {
        setIsSlaDownloading(true)
        try {
            const blob = await downloadContractDocument(contract.id, 'sla')
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `Umowa_${contract.number.replace(/\//g, '-')}_opieka_it.pdf`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
            toast.success(t.toasts.pdfDownloaded, contract.number)
        } catch {
            toast.error(t.toasts.pdfError, t.toasts.pdfErrorDesc)
        } finally {
            setIsSlaDownloading(false)
        }
    }

    // ── Mobile template ─────────────────────────────────────────────────────────

    const [isMobileDownloading, setIsMobileDownloading] = useState(false)
    const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false)
    const mobilePreviewUrl = useMemo(() => getContractHtmlPreviewUrl(contract.id, 'mobile'), [contract.id])

    const handleMobileDownload = async () => {
        setIsMobileDownloading(true)
        try {
            const blob = await downloadContractDocument(contract.id, 'mobile')
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `Umowa_${contract.number.replace(/\//g, '-')}_aplikacja_mobilna.pdf`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
            toast.success(t.toasts.pdfDownloaded, contract.number)
        } catch {
            toast.error(t.toasts.pdfError, t.toasts.pdfErrorDesc)
        } finally {
            setIsMobileDownloading(false)
        }
    }

    // ── Short template — HTML preview ──────────────────────────────────────────

    const [shortPreviewOpen, setShortPreviewOpen] = useState(false)
    const [shortPreviewError, setShortPreviewError] = useState<string | null>(null)

    const handleShortPreview = () => {
        setShortPreviewError(null)
        setShortPreviewOpen(true)
    }

    const shortPreviewUrl = useMemo(
        () => getContractHtmlPreviewUrl(contract.id, 'short'),
        [contract.id],
    )

    // ── Classic template — preview / download ───────────────────────────────────

    const [classicPreviewOpen, setClassicPreviewOpen] = useState(false)
    const [classicPreviewUrl, setClassicPreviewUrl] = useState<string | null>(null)
    const [classicPreviewError, setClassicPreviewError] = useState<string | null>(null)
    const [isClassicPreviewing, setIsClassicPreviewing] = useState(false)
    const [isClassicDownloading, setIsClassicDownloading] = useState(false)

    const handleClassicPreview = async () => {
        setIsClassicPreviewing(true)
        setClassicPreviewError(null)
        try {
            const blob = await downloadContractDocument(contract.id, 'classic')
            const url = URL.createObjectURL(blob)
            setClassicPreviewUrl((old) => { if (old) URL.revokeObjectURL(old); return url })
            setClassicPreviewOpen(true)
        } catch {
            setClassicPreviewError(t.toasts.pdfPreviewError)
            setClassicPreviewOpen(true)
        } finally {
            setIsClassicPreviewing(false)
        }
    }

    const handleClassicDownload = async () => {
        setIsClassicDownloading(true)
        try {
            const blob = await downloadContractDocument(contract.id, 'classic')
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `Umowa_${contract.number.replace(/\//g, '-')}.pdf`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
            toast.success(t.toasts.pdfDownloaded, contract.number)
        } catch {
            toast.error(t.toasts.pdfError, t.toasts.pdfErrorDesc)
        } finally {
            setIsClassicDownloading(false)
        }
    }

    // ── Auto-save blocks when editor changes ────────────────────────────────────

    const handleBlocksChange = useCallback(async (updatedBlocks: ContractShortBlocks) => {
        setBlocks(updatedBlocks)
        try {
            await contractsApi.update(contract.id, { blocks: updatedBlocks as unknown })
            onSaved()
        } catch {
            toast.error(t.templateSaveError, contract.number)
        }
    }, [contract.id, contract.number, t.templateSaveError, toast, onSaved])

    const handleServicesBlocksChange = useCallback(async (updatedBlocks: ContractServicesBlocks) => {
        setServicesBlocks(updatedBlocks)
        try {
            await contractsApi.update(contract.id, { blocks: updatedBlocks as unknown })
            onSaved()
        } catch {
            toast.error(t.templateSaveError, contract.number)
        }
    }, [contract.id, contract.number, t.templateSaveError, toast, onSaved])

    const handleDedicatedBlocksChange = useCallback(async (updatedBlocks: ContractDedicatedBlocks) => {
        setDedicatedBlocks(updatedBlocks)
        try {
            await contractsApi.update(contract.id, { blocks: updatedBlocks as unknown })
            onSaved()
        } catch {
            toast.error(t.templateSaveError, contract.number)
        }
    }, [contract.id, contract.number, t.templateSaveError, toast, onSaved])

    const handleSlaBlocksChange = useCallback(async (updatedBlocks: ContractSlaBlocks) => {
        setSlaBlocks(updatedBlocks)
        try {
            await contractsApi.update(contract.id, { blocks: updatedBlocks as unknown })
            onSaved()
        } catch {
            toast.error(t.templateSaveError, contract.number)
        }
    }, [contract.id, contract.number, t.templateSaveError, toast, onSaved])

    const handleMobileBlocksChange = useCallback(async (updatedBlocks: ContractMobileBlocks) => {
        setMobileBlocks(updatedBlocks)
        try {
            await contractsApi.update(contract.id, { blocks: updatedBlocks as unknown })
            onSaved()
        } catch {
            toast.error(t.templateSaveError, contract.number)
        }
    }, [contract.id, contract.number, t.templateSaveError, toast, onSaved])

    return (
        <div className="space-y-6">

            {/* Short: inline document editor */}
            {templateType === 'short' && (
                <ContractDocumentEditor
                    blocks={blocks}
                    onBlocksChange={handleBlocksChange}
                    onDownloadPdf={handleShortDownload}
                    isDownloading={isDownloading}
                    aiContext={aiContext}
                />
            )}

            {/* Short: preview + download bar */}
            {templateType === 'short' && (
                <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
                    <Button variant="outline" onClick={handleShortPreview}>
                        <Eye className="h-4 w-4" />
                        {t.templatePreviewBtn}
                    </Button>
                    <Button variant="outline" onClick={handleShortDownload} disabled={isDownloading}>
                        <Download className="h-4 w-4" />
                        {isDownloading ? '…' : t.templateDownloadBtn}
                    </Button>
                    <p className="flex-1 text-xs text-muted-foreground">
                        {t.clickSectionHint}
                    </p>
                </div>
            )}

            {/* Services: inline document editor */}
            {templateType === 'services' && (
                <ContractServicesDocumentEditor
                    blocks={servicesBlocks}
                    onBlocksChange={handleServicesBlocksChange}
                    onDownloadPdf={handleServicesDownload}
                    isDownloading={isServicesDownloading}
                    aiContext={aiContext}
                />
            )}

            {/* Services: preview + download bar */}
            {templateType === 'services' && (
                <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
                    <Button variant="outline" onClick={() => setServicesPreviewOpen(true)}>
                        <Eye className="h-4 w-4" />
                        {t.templatePreviewBtn}
                    </Button>
                    <Button variant="outline" onClick={handleServicesDownload} disabled={isServicesDownloading}>
                        <Download className="h-4 w-4" />
                        {isServicesDownloading ? '…' : t.templateDownloadBtn}
                    </Button>
                    <p className="flex-1 text-xs text-muted-foreground">
                        {t.clickSectionHint}
                    </p>
                </div>
            )}

            {/* Dedicated: inline document editor */}
            {templateType === 'dedicated' && (
                <ContractDedicatedDocumentEditor
                    blocks={dedicatedBlocks}
                    onBlocksChange={handleDedicatedBlocksChange}
                    onDownloadPdf={handleDedicatedDownload}
                    isDownloading={isDedicatedDownloading}
                    aiContext={aiContext}
                />
            )}

            {/* Dedicated: preview + download bar */}
            {templateType === 'dedicated' && (
                <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
                    <Button variant="outline" onClick={() => setDedicatedPreviewOpen(true)}>
                        <Eye className="h-4 w-4" />
                        {t.templatePreviewBtn}
                    </Button>
                    <Button variant="outline" onClick={handleDedicatedDownload} disabled={isDedicatedDownloading}>
                        <Download className="h-4 w-4" />
                        {isDedicatedDownloading ? '…' : t.templateDownloadBtn}
                    </Button>
                    <p className="flex-1 text-xs text-muted-foreground">
                        {t.clickSectionHint}
                    </p>
                </div>
            )}

            {/* SLA: inline document editor */}
            {templateType === 'sla' && (
                <ContractSlaDocumentEditor
                    blocks={slaBlocks}
                    onBlocksChange={handleSlaBlocksChange}
                    onDownloadPdf={handleSlaDownload}
                    isDownloading={isSlaDownloading}
                    aiContext={aiContext}
                />
            )}

            {/* SLA: preview + download bar */}
            {templateType === 'sla' && (
                <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
                    <Button variant="outline" onClick={() => setSlaPreviewOpen(true)}>
                        <Eye className="h-4 w-4" />
                        {t.templatePreviewBtn}
                    </Button>
                    <Button variant="outline" onClick={handleSlaDownload} disabled={isSlaDownloading}>
                        <Download className="h-4 w-4" />
                        {isSlaDownloading ? '…' : t.templateDownloadBtn}
                    </Button>
                    <p className="flex-1 text-xs text-muted-foreground">
                        {t.clickSectionHint}
                    </p>
                </div>
            )}

            {/* Mobile: inline document editor */}
            {templateType === 'mobile' && (
                <ContractMobileDocumentEditor
                    blocks={mobileBlocks}
                    onBlocksChange={handleMobileBlocksChange}
                    onDownloadPdf={handleMobileDownload}
                    isDownloading={isMobileDownloading}
                    aiContext={aiContext}
                />
            )}

            {/* Mobile: preview + download bar */}
            {templateType === 'mobile' && (
                <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
                    <Button variant="outline" onClick={() => setMobilePreviewOpen(true)}>
                        <Eye className="h-4 w-4" />
                        {t.templatePreviewBtn}
                    </Button>
                    <Button variant="outline" onClick={handleMobileDownload} disabled={isMobileDownloading}>
                        <Download className="h-4 w-4" />
                        {isMobileDownloading ? '…' : t.templateDownloadBtn}
                    </Button>
                    <p className="flex-1 text-xs text-muted-foreground">
                        {t.clickSectionHint}
                    </p>
                </div>
            )}

            {/* Classic: preview + download */}
            {templateType === 'classic' && (
                <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
                    <Button variant="outline" onClick={handleClassicPreview} disabled={isClassicPreviewing}>
                        <Eye className="h-4 w-4" />
                        {isClassicPreviewing ? '…' : t.templatePreviewBtn}
                    </Button>
                    <Button variant="outline" onClick={handleClassicDownload} disabled={isClassicDownloading}>
                        <Download className="h-4 w-4" />
                        {isClassicDownloading ? '…' : t.templateDownloadBtn}
                    </Button>
                    <p className="flex-1 text-xs text-muted-foreground">
                        {t.classicTemplateHint}
                    </p>
                </div>
            )}

            {/* Short: HTML preview modal */}
            <PdfPreviewModal
                isOpen={shortPreviewOpen}
                onClose={() => { setShortPreviewOpen(false); setShortPreviewError(null) }}
                pdfUrl={shortPreviewUrl}
                error={shortPreviewError}
                title={t.templateShortPreviewTitle.replace('{number}', contract.number)}
                frameTitle="Podgląd umowy"
                openInNewTabLabel={t.pdfPreview.openInNewTab}
                loadingLabel={t.pdfPreview.loading}
                frameType="html"
            />

            {/* Services: HTML preview modal */}
            <PdfPreviewModal
                isOpen={servicesPreviewOpen}
                onClose={() => setServicesPreviewOpen(false)}
                pdfUrl={servicesPreviewUrl}
                error={null}
                title={t.contractPreviewTitle.replace('{number}', contract.number)}
                frameTitle={t.contractPreviewFrameTitle}
                openInNewTabLabel={t.pdfPreview.openInNewTab}
                loadingLabel={t.pdfPreview.loading}
                frameType="html"
            />

            {/* Dedicated: HTML preview modal */}
            <PdfPreviewModal
                isOpen={dedicatedPreviewOpen}
                onClose={() => setDedicatedPreviewOpen(false)}
                pdfUrl={dedicatedPreviewUrl}
                error={null}
                title={t.contractPreviewTitle.replace('{number}', contract.number)}
                frameTitle={t.contractPreviewFrameTitle}
                openInNewTabLabel={t.pdfPreview.openInNewTab}
                loadingLabel={t.pdfPreview.loading}
                frameType="html"
            />

            {/* SLA: HTML preview modal */}
            <PdfPreviewModal
                isOpen={slaPreviewOpen}
                onClose={() => setSlaPreviewOpen(false)}
                pdfUrl={slaPreviewUrl}
                error={null}
                title={t.contractPreviewTitle.replace('{number}', contract.number)}
                frameTitle={t.contractPreviewFrameTitle}
                openInNewTabLabel={t.pdfPreview.openInNewTab}
                loadingLabel={t.pdfPreview.loading}
                frameType="html"
            />

            {/* Mobile: HTML preview modal */}
            <PdfPreviewModal
                isOpen={mobilePreviewOpen}
                onClose={() => setMobilePreviewOpen(false)}
                pdfUrl={mobilePreviewUrl}
                error={null}
                title={t.contractPreviewTitle.replace('{number}', contract.number)}
                frameTitle={t.contractPreviewFrameTitle}
                openInNewTabLabel={t.pdfPreview.openInNewTab}
                loadingLabel={t.pdfPreview.loading}
                frameType="html"
            />

            {/* Classic: PDF preview modal */}
            <PdfPreviewModal
                isOpen={classicPreviewOpen}
                onClose={() => {
                    setClassicPreviewOpen(false)
                    if (classicPreviewUrl) { URL.revokeObjectURL(classicPreviewUrl); setClassicPreviewUrl(null) }
                }}
                pdfUrl={classicPreviewUrl}
                error={classicPreviewError}
                title={t.pdfPreview.title.replace('{number}', contract.number)}
                frameTitle={t.pdfPreview.frameTitle}
                openInNewTabLabel={t.pdfPreview.openInNewTab}
                loadingLabel={t.pdfPreview.loading}
                frameType="pdf"
            />
        </div>
    )
}

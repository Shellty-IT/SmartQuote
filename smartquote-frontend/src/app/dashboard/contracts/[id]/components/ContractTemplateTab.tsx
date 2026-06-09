// src/app/dashboard/contracts/[id]/components/ContractTemplateTab.tsx
// Tab for editing and downloading the "Umowa — Krótka" contract template.
// Mirrors the TemplateTab pattern used for offer proposals.
'use client'

import { useState, useCallback, useMemo } from 'react'
import { Eye, Download, Save, FileText, FileCode } from 'lucide-react'
import { Button } from '@/components/ui'
import { PdfPreviewModal } from '@/components/pdf/PdfPreviewModal'
import { ContractDocumentEditor } from '@/components/contracts/editor/ContractDocumentEditor'
import { contractsApi } from '@/lib/api'
import { useToast } from '@/contexts/ToastContext'
import { useTranslations } from '@/i18n'
import { cn } from '@/lib/utils'
import { mergeContractWithDefaults, type ContractShortBlocks } from '@/lib/pdf/contract-short-blocks'
import type { Contract } from '@/types'

interface ContractTemplateTabProps {
    contract: Contract
    onSaved: () => void
}

export function ContractTemplateTab({ contract, onSaved }: ContractTemplateTabProps) {
    const t = useTranslations('contractDetailPage')
    const toast = useToast()

    const [templateType, setTemplateType] = useState<'classic' | 'short'>(
        (contract.templateType ?? 'classic') as 'classic' | 'short',
    )
    const [blocks, setBlocks] = useState<ContractShortBlocks>(() =>
        mergeContractWithDefaults(contract.blocks as Partial<ContractShortBlocks> | null),
    )
    const [isSaving, setIsSaving] = useState(false)
    const [isDownloading, setIsDownloading] = useState(false)

    // ── Save template type + blocks ─────────────────────────────────────────────

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await contractsApi.update(contract.id, {
                templateType,
                blocks: templateType === 'short' ? (blocks as unknown) : undefined,
            })
            toast.success(t.templateSaved, contract.number)
            onSaved()
        } catch {
            toast.error(t.templateSaveError, contract.number)
        } finally {
            setIsSaving(false)
        }
    }

    // ── Short template — download PDF ───────────────────────────────────────────

    const handleShortDownload = async () => {
        setIsDownloading(true)
        try {
            const blob = await contractsApi.downloadShortPdf(contract.id)
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `Umowa_${contract.number.replace(/\//g, '-')}_krotka.pdf`
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

    // ── Short template — HTML preview ──────────────────────────────────────────

    const [shortPreviewOpen, setShortPreviewOpen] = useState(false)
    const [shortPreviewError, setShortPreviewError] = useState<string | null>(null)

    const handleShortPreview = () => {
        setShortPreviewError(null)
        setShortPreviewOpen(true)
    }

    const shortPreviewUrl = useMemo(
        () => contractsApi.getShortPreviewUrl(contract.id),
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
            const blob = await contractsApi.downloadPdf(contract.id)
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
            const blob = await contractsApi.downloadPdf(contract.id)
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
        } catch {
            toast.error(t.templateSaveError, contract.number)
        }
    }, [contract.id, contract.number, t.templateSaveError, toast])

    return (
        <div className="space-y-6">

            {/* Template type selector + save */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        {t.templateTypeLabel}
                    </h2>
                    <Button onClick={handleSave} disabled={isSaving} size="sm">
                        <Save className="h-3.5 w-3.5" />
                        {isSaving ? t.templateSaving : t.templateSaveBtn}
                    </Button>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {(['classic', 'short'] as const).map((type) => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => setTemplateType(type)}
                            className={cn(
                                'flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all',
                                templateType === type
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:border-border/80 hover:bg-secondary/30',
                            )}
                        >
                            <div className={cn(
                                'mt-0.5 flex-shrink-0 rounded-full p-1.5',
                                templateType === type ? 'bg-primary text-white' : 'bg-muted text-muted-foreground',
                            )}>
                                {type === 'classic'
                                    ? <FileText className="h-4 w-4" />
                                    : <FileCode className="h-4 w-4" />
                                }
                            </div>
                            <div>
                                <p className={cn('font-semibold', templateType === type ? 'text-primary' : 'text-foreground')}>
                                    {type === 'classic' ? t.templateClassic : t.templateShort}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    {type === 'classic' ? t.templateClassicDesc : t.templateShortDesc}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Short: inline document editor */}
            {templateType === 'short' && (
                <ContractDocumentEditor
                    blocks={blocks}
                    onBlocksChange={handleBlocksChange}
                    onDownloadPdf={handleShortDownload}
                    isDownloading={isDownloading}
                />
            )}

            {/* Short: preview button (outside editor toolbar for easy access) */}
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
                        Kliknij sekcję w podglądzie dokumentu aby ją edytować.
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
                        Klasyczny szablon — tabela pozycji z warunkami umowy. Logo i dane firmy z <em>Ustawienia → Firma</em>.
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

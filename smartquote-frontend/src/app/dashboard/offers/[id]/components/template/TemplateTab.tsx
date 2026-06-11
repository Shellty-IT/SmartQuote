// src/app/dashboard/offers/[id]/components/template/TemplateTab.tsx
'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { Eye, Download } from 'lucide-react'
import { Button } from '@/components/ui'
import { PdfPreviewModal } from '@/components/pdf/PdfPreviewModal'
import { ProposalDocumentEditor } from '@/components/offers/editor/ProposalDocumentEditor'
import { offersApi, settingsApi } from '@/lib/api'
import { useToast } from '@/contexts/ToastContext'
import { useTranslations } from '@/i18n'
import { mergeWithDefaults, type ProposalBlocks } from '@/lib/pdf/proposal-blocks'
import type { CompanyInfo, Offer } from '@/types'

// ── Main TemplateTab ──────────────────────────────────────────────────────────

interface TemplateTabProps {
    offer: Offer
    onSaved: () => void
}

export function TemplateTab({ offer, onSaved }: TemplateTabProps) {
    const tr = useTranslations('offerDetail')
    const ttr = tr.template
    const { data: session } = useSession()
    const toast = useToast()

    const templateType = (offer.templateType ?? 'classic') as 'classic' | 'proposal'
    const [blocks, setBlocks] = useState<ProposalBlocks>(
        mergeWithDefaults(offer.blocks as Partial<ProposalBlocks> | null, offer.client?.name),
    )
    const [isDownloading, setIsDownloading] = useState(false)
    const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null)

    // Load company info for logo + website in the document editor
    useEffect(() => {
        settingsApi.getCompany().then(setCompanyInfo).catch(() => {})
    }, [])

    const handleDownload = async () => {
        setIsDownloading(true)
        try {
            const blob = await offersApi.downloadProposalPdf(offer.id)
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `Propozycja_${offer.number.replace(/\//g, '-')}.pdf`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
            toast.success(tr.toasts.pdfDownloaded, offer.number)
        } catch {
            toast.error(tr.toasts.pdfError, offer.number)
        } finally {
            setIsDownloading(false)
        }
    }

    // ── Classic PDF preview/download ────────────────────────────────────────────

    const [classicPreviewOpen, setClassicPreviewOpen] = useState(false)
    const [classicPreviewUrl, setClassicPreviewUrl] = useState<string | null>(null)
    const [classicPreviewError, setClassicPreviewError] = useState<string | null>(null)
    const [isClassicPreviewing, setIsClassicPreviewing] = useState(false)
    const [isClassicDownloading, setIsClassicDownloading] = useState(false)

    const handleClassicPreview = async () => {
        setIsClassicPreviewing(true)
        setClassicPreviewError(null)
        try {
            const blob = await offersApi.downloadPdf(offer.id)
            const url = URL.createObjectURL(blob)
            setClassicPreviewUrl((old) => { if (old) URL.revokeObjectURL(old); return url })
            setClassicPreviewOpen(true)
        } catch {
            setClassicPreviewError(tr.toasts.pdfError)
            setClassicPreviewOpen(true)
        } finally {
            setIsClassicPreviewing(false)
        }
    }

    const handleClassicDownload = async () => {
        setIsClassicDownloading(true)
        try {
            const blob = await offersApi.downloadPdf(offer.id)
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `Oferta_${offer.number.replace(/\//g, '-')}.pdf`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
            toast.success(tr.toasts.pdfDownloaded, offer.number)
        } catch {
            toast.error(tr.toasts.pdfError, offer.number)
        } finally {
            setIsClassicDownloading(false)
        }
    }

    // ── Proposal offer data for the document editor ──────────────────────────

    const proposalOfferData = useMemo(() => ({
        id: offer.id,
        number: offer.number,
        title: offer.title,
        totalGross: Number(offer.totalGross ?? 0),
        currency: offer.currency ?? 'PLN',
        paymentDays: offer.paymentDays ?? 14,
        createdAt: offer.createdAt,
        client: {
            name: offer.client?.name ?? '',
            company: offer.client?.company ?? null,
        },
        user: {
            name: session?.user?.name ?? null,
            email: session?.user?.email ?? '',
            companyInfo: companyInfo ? {
                name: companyInfo.name,
                website: companyInfo.website,
                logo: companyInfo.logo,
                phone: companyInfo.phone,
            } : null,
        },
        blocks,
    }), [offer, session, companyInfo, blocks])

    const handleProposalBlocksChange = useCallback(async (updatedBlocks: ProposalBlocks) => {
        setBlocks(updatedBlocks)
        // Auto-save silently
        try {
            await offersApi.update(offer.id, { blocks: updatedBlocks as unknown })
            // Refresh offer so all tabs (Details, header) reflect updated totals
            onSaved()
        } catch {
            toast.error(ttr.saveError, offer.number)
        }
    }, [offer.id, offer.number, ttr.saveError, toast, onSaved])

    return (
        <div className="space-y-6">

            {/* ── PROPOSAL: inline document editor ──────────────────────────── */}
            {templateType === 'proposal' && (
                <ProposalDocumentEditor
                    offer={proposalOfferData}
                    blocks={blocks}
                    onBlocksChange={handleProposalBlocksChange}
                    onDownloadPdf={handleDownload}
                    isDownloading={isDownloading}
                />
            )}

            {/* ── CLASSIC: PDF preview + download ───────────────────────────── */}
            {templateType === 'classic' && (
                <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
                    <Button variant="outline" onClick={handleClassicPreview} disabled={isClassicPreviewing}>
                        <Eye className="h-4 w-4" />
                        {isClassicPreviewing ? '…' : ttr.previewBtn}
                    </Button>
                    <Button variant="outline" onClick={handleClassicDownload} disabled={isClassicDownloading}>
                        <Download className="h-4 w-4" />
                        {isClassicDownloading ? '…' : ttr.downloadBtn}
                    </Button>
                    <p className="flex-1 text-xs text-muted-foreground">
                        Klasyczny szablon — tabela pozycji z podsumowaniem. Logo i strona firmy ładowane z <em>Ustawienia → Firma</em>.
                    </p>
                </div>
            )}

            {/* Classic PDF preview modal */}
            <PdfPreviewModal
                isOpen={classicPreviewOpen}
                onClose={() => {
                    setClassicPreviewOpen(false)
                    if (classicPreviewUrl) { URL.revokeObjectURL(classicPreviewUrl); setClassicPreviewUrl(null) }
                }}
                pdfUrl={classicPreviewUrl}
                error={classicPreviewError}
                title={ttr.previewTitle.replace('{number}', offer.number)}
                frameTitle={ttr.previewFrameTitle}
                openInNewTabLabel={ttr.openInNewTab}
                loadingLabel={ttr.loadingPreview}
                frameType="pdf"
            />
        </div>
    )
}

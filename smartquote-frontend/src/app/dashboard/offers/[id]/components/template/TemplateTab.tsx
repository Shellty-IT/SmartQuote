// src/app/dashboard/offers/[id]/components/template/TemplateTab.tsx
'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { Eye, Download } from 'lucide-react'
import { Button } from '@/components/ui'
import { PdfPreviewModal } from '@/components/pdf/PdfPreviewModal'
import { ProposalDocumentEditor } from '@/components/offers/editor/ProposalDocumentEditor'
import { ShopDocumentEditor } from '@/components/offers/ShopDocumentEditor'
import { WebsiteV2DocumentEditor } from '@/components/offers/WebsiteV2DocumentEditor'
import { WebsiteV3DocumentEditor } from '@/components/offers/WebsiteV3DocumentEditor'
import { SupportDocumentEditorFromOffer } from '@/components/offers/SupportDocumentEditor'
import { MobileAppDocumentEditorFromOffer } from '@/components/offers/MobileAppDocumentEditor'
import { MobileSimpleDocumentEditorFromOffer } from '@/components/offers/MobileSimpleDocumentEditor'
import { UniversalDocumentEditorFromOffer } from '@/components/offers/UniversalDocumentEditor'
import { offersApi, settingsApi } from '@/lib/api'
import { useToast } from '@/contexts/ToastContext'
import { useTranslations } from '@/i18n'
import { mergeWithDefaults, type ProposalBlocks } from '@/lib/pdf/proposal-blocks'
import { mergeShopWithDefaults, type ShopBlocks } from '@/lib/pdf/shop-blocks'
import { mergeWebsiteV2WithDefaults, type WebsiteV2Blocks } from '@/lib/pdf/website-v2-blocks'
import { mergeWebsiteV3WithDefaults, type WebsiteV3Blocks } from '@/lib/pdf/website-v3-blocks'
import { mergeSupportWithDefaults, type SupportBlocks } from '@/lib/pdf/support-blocks'
import { mergeMobileAppWithDefaults, type MobileAppBlocks } from '@/lib/pdf/mobile-app-blocks'
import { mergeMobileSimpleWithDefaults, type MobileSimpleBlocks } from '@/lib/pdf/mobile-simple-blocks'
import { mergeUniversalWithDefaults, type UniversalBlocks } from '@/lib/pdf/universal-blocks'
import type { UniversalOfferData } from '@/lib/pdf/universal-html'
import type { CompanyInfo, Offer } from '@/types'
import type { SupportOfferData } from '@/lib/pdf/support-html'
import type { MobileAppOfferData } from '@/lib/pdf/mobile-app-html'
import type { MobileSimpleOfferData } from '@/lib/pdf/mobile-simple-html'
import type { OfferContext } from '@/components/offers/editor/block-editors'

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

    const templateType = (offer.templateType ?? 'classic') as 'classic' | 'proposal' | 'shop' | 'website_v2' | 'website_v3' | 'support' | 'mobile_app' | 'mobile_simple' | 'universal'
    const [blocks, setBlocks] = useState<ProposalBlocks>(
        mergeWithDefaults(offer.blocks as Partial<ProposalBlocks> | null, offer.client?.name),
    )
    const [shopBlocks, setShopBlocks] = useState<ShopBlocks>(
        mergeShopWithDefaults(offer.blocks as Partial<ShopBlocks> | null),
    )
    const [websiteV2Blocks, setWebsiteV2Blocks] = useState<WebsiteV2Blocks>(
        mergeWebsiteV2WithDefaults(offer.blocks as Partial<WebsiteV2Blocks> | null),
    )
    const [websiteV3Blocks, setWebsiteV3Blocks] = useState<WebsiteV3Blocks>(
        mergeWebsiteV3WithDefaults(offer.blocks as Partial<WebsiteV3Blocks> | null),
    )
    const [supportBlocks, setSupportBlocks] = useState<SupportBlocks>(
        mergeSupportWithDefaults(offer.blocks as Partial<SupportBlocks> | null ?? {}),
    )
    const [mobileAppBlocks, setMobileAppBlocks] = useState<MobileAppBlocks>(
        mergeMobileAppWithDefaults(offer.blocks as Partial<MobileAppBlocks> | null ?? {}),
    )
    const [mobileSimpleBlocks, setMobileSimpleBlocks] = useState<MobileSimpleBlocks>(
        mergeMobileSimpleWithDefaults(offer.blocks as Partial<MobileSimpleBlocks> | null ?? {}),
    )
    const [universalBlocks, setUniversalBlocks] = useState<UniversalBlocks>(
        mergeUniversalWithDefaults(offer.blocks as Partial<UniversalBlocks> | null ?? {}),
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
            let blob: Blob
            let filename: string
            if (templateType === 'shop') {
                blob = await offersApi.downloadShopPdf(offer.id)
                filename = `Oferta_${offer.number.replace(/\//g, '-')}_sklep.pdf`
            } else if (templateType === 'website_v2') {
                blob = await offersApi.downloadWebsiteV2Pdf(offer.id)
                filename = `Oferta_${offer.number.replace(/\//g, '-')}_strona-v2.pdf`
            } else if (templateType === 'website_v3') {
                blob = await offersApi.downloadWebsiteV3Pdf(offer.id)
                filename = `Oferta_${offer.number.replace(/\//g, '-')}_strona-v3.pdf`
            } else if (templateType === 'support') {
                blob = await offersApi.downloadSupportPdf(offer.id)
                filename = `Oferta_${offer.number.replace(/\//g, '-')}_wsparcie.pdf`
            } else if (templateType === 'mobile_app') {
                blob = await offersApi.downloadMobileAppPdf(offer.id)
                filename = `Oferta_${offer.number.replace(/\//g, '-')}_mobile-app.pdf`
            } else if (templateType === 'mobile_simple') {
                blob = await offersApi.downloadMobileSimplePdf(offer.id)
                filename = `Oferta_${offer.number.replace(/\//g, '-')}_mobile-simple.pdf`
            } else if (templateType === 'universal') {
                blob = await offersApi.downloadUniversalPdf(offer.id)
                filename = `Oferta_${offer.number.replace(/\//g, '-')}_universal.pdf`
            } else {
                blob = await offersApi.downloadProposalPdf(offer.id)
                filename = `Propozycja_${offer.number.replace(/\//g, '-')}.pdf`
            }
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = filename
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

    const shopOfferData = useMemo(() => ({
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
                email: companyInfo.email ?? null,
            } : null,
        },
        blocks: shopBlocks,
    }), [offer, session, companyInfo, shopBlocks])

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

    const handleShopBlocksChange = useCallback(async (updatedBlocks: ShopBlocks) => {
        setShopBlocks(updatedBlocks)
        try {
            await offersApi.update(offer.id, { blocks: updatedBlocks as unknown })
            onSaved()
        } catch {
            toast.error(ttr.saveError, offer.number)
        }
    }, [offer.id, offer.number, ttr.saveError, toast, onSaved])

    const websiteV2OfferData = useMemo(() => ({
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
                email: companyInfo.email ?? null,
            } : null,
        },
        blocks: websiteV2Blocks,
    }), [offer, session, companyInfo, websiteV2Blocks])

    const handleWebsiteV2BlocksChange = useCallback(async (updatedBlocks: WebsiteV2Blocks) => {
        setWebsiteV2Blocks(updatedBlocks)
        try {
            await offersApi.update(offer.id, { blocks: updatedBlocks as unknown })
            onSaved()
        } catch {
            toast.error(ttr.saveError, offer.number)
        }
    }, [offer.id, offer.number, ttr.saveError, toast, onSaved])

    const websiteV3OfferData = useMemo(() => ({
        id: offer.id,
        number: offer.number,
        title: offer.title,
        totalGross: Number(offer.totalGross ?? 0),
        currency: offer.currency ?? 'PLN',
        paymentDays: offer.paymentDays ?? 14,
        createdAt: offer.createdAt,
        client: { name: offer.client?.name ?? '', company: offer.client?.company ?? null },
        user: {
            name: session?.user?.name ?? null,
            email: session?.user?.email ?? '',
            companyInfo: companyInfo ? { name: companyInfo.name, website: companyInfo.website, logo: companyInfo.logo, phone: companyInfo.phone, email: companyInfo.email ?? null } : null,
        },
        blocks: websiteV3Blocks,
    }), [offer, session, companyInfo, websiteV3Blocks])

    const handleWebsiteV3BlocksChange = useCallback(async (updatedBlocks: WebsiteV3Blocks) => {
        setWebsiteV3Blocks(updatedBlocks)
        try {
            await offersApi.update(offer.id, { blocks: updatedBlocks as unknown })
            onSaved()
        } catch {
            toast.error(ttr.saveError, offer.number)
        }
    }, [offer.id, offer.number, ttr.saveError, toast, onSaved])

    const supportOfferData = useMemo<SupportOfferData>(() => ({
        offerNumber: offer.number,
        offerDate: offer.createdAt ? new Date(offer.createdAt).toLocaleDateString('pl-PL') : undefined,
        validUntil: offer.validUntil ? new Date(offer.validUntil).toLocaleDateString('pl-PL') : undefined,
        clientName: offer.client?.name,
        userLogoUrl: companyInfo?.logo ?? undefined,
        userCompanyName: companyInfo?.name ?? session?.user?.name ?? undefined,
        userEmail: companyInfo?.email ?? session?.user?.email ?? undefined,
        userPhone: companyInfo?.phone ?? undefined,
        userWebsite: companyInfo?.website ?? undefined,
    }), [offer, session, companyInfo])

    const handleSupportBlocksChange = useCallback(async (updatedBlocks: SupportBlocks) => {
        setSupportBlocks(updatedBlocks)
        try {
            await offersApi.update(offer.id, { blocks: updatedBlocks as unknown })
            onSaved()
        } catch {
            toast.error(ttr.saveError, offer.number)
        }
    }, [offer.id, offer.number, ttr.saveError, toast, onSaved])

    const mobileAppOfferData = useMemo<MobileAppOfferData>(() => ({
        offerNumber: offer.number,
        offerDate: offer.createdAt ? new Date(offer.createdAt).toLocaleDateString('pl-PL') : undefined,
        validUntil: offer.validUntil ? new Date(offer.validUntil).toLocaleDateString('pl-PL') : undefined,
        clientName: offer.client?.name,
        userLogoUrl: companyInfo?.logo ?? undefined,
        userCompanyName: companyInfo?.name ?? session?.user?.name ?? undefined,
        userEmail: companyInfo?.email ?? session?.user?.email ?? undefined,
        userPhone: companyInfo?.phone ?? undefined,
        userWebsite: companyInfo?.website ?? undefined,
    }), [offer, session, companyInfo])

    const handleMobileAppBlocksChange = useCallback(async (updatedBlocks: MobileAppBlocks) => {
        setMobileAppBlocks(updatedBlocks)
        try {
            await offersApi.update(offer.id, { blocks: updatedBlocks as unknown })
            onSaved()
        } catch {
            toast.error(ttr.saveError, offer.number)
        }
    }, [offer.id, offer.number, ttr.saveError, toast, onSaved])

    const mobileSimpleOfferData = useMemo<MobileSimpleOfferData>(() => ({
        offerNumber: offer.number,
        offerDate: offer.createdAt ? new Date(offer.createdAt).toLocaleDateString('pl-PL') : undefined,
        validUntil: offer.validUntil ? new Date(offer.validUntil).toLocaleDateString('pl-PL') : undefined,
        clientName: offer.client?.name,
        userLogoUrl: companyInfo?.logo ?? undefined,
        userCompanyName: companyInfo?.name ?? session?.user?.name ?? undefined,
        userEmail: companyInfo?.email ?? session?.user?.email ?? undefined,
        userPhone: companyInfo?.phone ?? undefined,
        userWebsite: companyInfo?.website ?? undefined,
    }), [offer, session, companyInfo])

    const handleMobileSimpleBlocksChange = useCallback(async (updatedBlocks: MobileSimpleBlocks) => {
        setMobileSimpleBlocks(updatedBlocks)
        try {
            await offersApi.update(offer.id, { blocks: updatedBlocks as unknown })
            onSaved()
        } catch {
            toast.error(ttr.saveError, offer.number)
        }
    }, [offer.id, offer.number, ttr.saveError, toast, onSaved])

    const universalOfferData = useMemo<UniversalOfferData>(() => ({
        offerNumber: offer.number,
        offerDate: offer.createdAt ? new Date(offer.createdAt).toLocaleDateString('pl-PL') : undefined,
        clientName: offer.client?.name,
        userLogoUrl: companyInfo?.logo ?? undefined,
        userCompanyName: companyInfo?.name ?? session?.user?.name ?? undefined,
        userEmail: companyInfo?.email ?? session?.user?.email ?? undefined,
        userPhone: companyInfo?.phone ?? undefined,
        userWebsite: companyInfo?.website ?? undefined,
    }), [offer, session, companyInfo])

    const offerContext = useMemo<OfferContext>(() => ({
        title: offer.title,
        clientName: offer.client?.name ?? '',
        totalGross: Number(offer.totalGross ?? 0),
        currency: offer.currency ?? 'PLN',
    }), [offer.title, offer.client?.name, offer.totalGross, offer.currency])

    const handleUniversalBlocksChange = useCallback(async (updatedBlocks: UniversalBlocks) => {
        setUniversalBlocks(updatedBlocks)
        try {
            await offersApi.update(offer.id, { blocks: updatedBlocks as unknown })
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

            {/* ── SHOP: inline document editor ──────────────────────────────── */}
            {templateType === 'shop' && (
                <ShopDocumentEditor
                    offer={shopOfferData}
                    blocks={shopBlocks}
                    onBlocksChange={handleShopBlocksChange}
                    onDownloadPdf={handleDownload}
                    isDownloading={isDownloading}
                    offerContext={offerContext}
                />
            )}

            {/* ── WEBSITE V2: inline document editor ────────────────────────── */}
            {templateType === 'website_v2' && (
                <WebsiteV2DocumentEditor
                    offer={websiteV2OfferData}
                    blocks={websiteV2Blocks}
                    onBlocksChange={handleWebsiteV2BlocksChange}
                    onDownloadPdf={handleDownload}
                    isDownloading={isDownloading}
                    offerContext={offerContext}
                />
            )}

            {/* ── WEBSITE V3: inline document editor ────────────────────────── */}
            {templateType === 'website_v3' && (
                <WebsiteV3DocumentEditor
                    offer={websiteV3OfferData}
                    blocks={websiteV3Blocks}
                    onBlocksChange={handleWebsiteV3BlocksChange}
                    onDownloadPdf={handleDownload}
                    isDownloading={isDownloading}
                    offerContext={offerContext}
                />
            )}

            {/* ── SUPPORT: inline document editor ───────────────────────────── */}
            {templateType === 'support' && (
                <SupportDocumentEditorFromOffer
                    offer={{ ...supportOfferData, id: offer.id }}
                    blocks={supportBlocks}
                    onBlocksChange={handleSupportBlocksChange}
                    onDownloadPdf={handleDownload}
                    isDownloading={isDownloading}
                    offerContext={offerContext}
                />
            )}

            {/* ── MOBILE APP: inline document editor ────────────────────────── */}
            {templateType === 'mobile_app' && (
                <MobileAppDocumentEditorFromOffer
                    offer={{ ...mobileAppOfferData, id: offer.id }}
                    blocks={mobileAppBlocks}
                    onBlocksChange={handleMobileAppBlocksChange}
                    onDownloadPdf={handleDownload}
                    isDownloading={isDownloading}
                    offerContext={offerContext}
                />
            )}

            {/* ── MOBILE SIMPLE: inline document editor ─────────────────────── */}
            {templateType === 'mobile_simple' && (
                <MobileSimpleDocumentEditorFromOffer
                    offer={{ ...mobileSimpleOfferData, id: offer.id }}
                    blocks={mobileSimpleBlocks}
                    onBlocksChange={handleMobileSimpleBlocksChange}
                    onDownloadPdf={handleDownload}
                    isDownloading={isDownloading}
                    offerContext={offerContext}
                />
            )}

            {/* ── UNIVERSAL: inline document editor ─────────────────────────── */}
            {templateType === 'universal' && (
                <UniversalDocumentEditorFromOffer
                    offer={{ ...universalOfferData, id: offer.id }}
                    blocks={universalBlocks}
                    onBlocksChange={handleUniversalBlocksChange}
                    onDownloadPdf={handleDownload}
                    isDownloading={isDownloading}
                    offerContext={offerContext}
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
                        {ttr.classicHint}
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

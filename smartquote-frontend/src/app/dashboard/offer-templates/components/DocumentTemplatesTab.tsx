// src/app/dashboard/offer-templates/components/DocumentTemplatesTab.tsx
// Offer document templates: Classic (info card) + Proposal (full editor).
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { FileText, Presentation, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui'
import { ProposalDocumentEditor } from '@/components/offers/editor/ProposalDocumentEditor'
import { settingsApi } from '@/lib/api'
import { buildDefaultBlocks, mergeWithDefaults, type ProposalBlocks } from '@/lib/pdf/proposal-blocks'
import { useTranslations } from '@/i18n'
import { cn } from '@/lib/utils'
import type { CompanyInfo } from '@/types'

const LS_KEY = 'sq_default_proposal_blocks'

function loadFromStorage(): Partial<ProposalBlocks> | null {
    if (typeof window === 'undefined') return null
    try {
        const raw = localStorage.getItem(LS_KEY)
        return raw ? (JSON.parse(raw) as Partial<ProposalBlocks>) : null
    } catch {
        return null
    }
}

function saveToStorage(blocks: ProposalBlocks) {
    try {
        localStorage.setItem(LS_KEY, JSON.stringify(blocks))
    } catch {
        // quota exceeded or private mode — ignore
    }
}

// ── Classic template info card ────────────────────────────────────────────────

function ClassicTemplateCard() {
    const tr = useTranslations('offerTemplatesPage')

    return (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-4">
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0 rounded-xl bg-primary/10 p-3 text-primary">
                    <FileText className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-base mb-1">{tr.classicOfferTitle}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{tr.classicOfferDesc}</p>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
                <div className="rounded-lg bg-secondary/40 p-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{tr.contentsLabel}</p>
                    <ul className="text-xs text-foreground space-y-1">
                        {([
                            tr.classicOfferContent1,
                            tr.classicOfferContent2,
                            tr.classicOfferContent3,
                            tr.classicOfferContent4,
                            tr.classicOfferContent5,
                        ] as string[]).map((item) => (
                            <li key={item}>• {item}</li>
                        ))}
                    </ul>
                </div>
                <div className="rounded-lg bg-secondary/40 p-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{tr.customizeLabel}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        {tr.classicOfferCustomizeDesc.split('{link}')[0]}
                        <span
                            className="font-medium text-primary cursor-pointer"
                            onClick={() => window.open('/dashboard/settings', '_blank')}
                        >
                            {tr.settingsLink}
                        </span>
                        {tr.classicOfferCustomizeDesc.split('{link}')[1]}
                    </p>
                </div>
            </div>
        </div>
    )
}

// ── Proposal template editor ──────────────────────────────────────────────────

function ProposalTemplateEditor() {
    const tr = useTranslations('offerTemplatesPage')
    const { data: session } = useSession()
    const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null)
    const [blocks, setBlocks] = useState<ProposalBlocks>(() => mergeWithDefaults(loadFromStorage()))
    const [savedIndicator, setSavedIndicator] = useState(false)

    useEffect(() => {
        settingsApi.getCompany().then(setCompanyInfo).catch(() => {})
    }, [])

    const demoOffer = useMemo(() => ({
        number: 'TEMPLATE',
        title: tr.docTypeProposal,
        totalGross: 0,
        currency: 'PLN',
        paymentDays: 14,
        createdAt: new Date().toISOString(),
        client: { name: 'Example Client', company: null },
        user: {
            name: session?.user?.name ?? null,
            email: session?.user?.email ?? '',
            companyInfo: companyInfo
                ? {
                      name: companyInfo.name,
                      website: companyInfo.website,
                      logo: companyInfo.logo,
                      phone: companyInfo.phone,
                  }
                : null,
        },
        blocks,
    }), [session, companyInfo, blocks, tr.docTypeProposal])

    const handleBlocksChange = useCallback((updated: ProposalBlocks) => {
        setBlocks(updated)
        saveToStorage(updated)
        setSavedIndicator(true)
        setTimeout(() => setSavedIndicator(false), 2000)
    }, [])

    const handleReset = useCallback(() => {
        if (!confirm(tr.proposalResetConfirm)) return
        const fresh = buildDefaultBlocks()
        setBlocks(fresh)
        saveToStorage(fresh)
    }, [tr.proposalResetConfirm])

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <p className="text-sm text-muted-foreground">{tr.proposalAutoSave}</p>
                <div className="flex items-center gap-3 shrink-0">
                    {savedIndicator && (
                        <span className="text-xs text-green-600 font-medium">{tr.proposalSaved}</span>
                    )}
                    <Button variant="outline" size="sm" onClick={handleReset}>
                        <RotateCcw className="h-3.5 w-3.5" />
                        {tr.proposalReset}
                    </Button>
                </div>
            </div>
            <ProposalDocumentEditor
                offer={demoOffer}
                blocks={blocks}
                onBlocksChange={handleBlocksChange}
            />
        </div>
    )
}

// ── Main export ───────────────────────────────────────────────────────────────

type DocType = 'classic' | 'proposal'

export function DocumentTemplatesTab() {
    const tr = useTranslations('offerTemplatesPage')
    const [docType, setDocType] = useState<DocType>('classic')

    const DOC_TYPES: { key: DocType; label: string; icon: React.ReactNode }[] = [
        { key: 'classic', label: tr.docTypeClassic, icon: <FileText className="h-4 w-4" /> },
        { key: 'proposal', label: tr.docTypeProposal, icon: <Presentation className="h-4 w-4" /> },
    ]

    return (
        <div className="space-y-5">
            <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{tr.docTypeLabel}</p>
                <div className="flex gap-2 flex-wrap">
                    {DOC_TYPES.map((t) => (
                        <button
                            key={t.key}
                            type="button"
                            onClick={() => setDocType(t.key)}
                            className={cn(
                                'flex items-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-all',
                                docType === t.key
                                    ? 'border-primary bg-primary/5 text-primary'
                                    : 'border-border bg-card text-muted-foreground hover:border-border/60 hover:text-foreground',
                            )}
                        >
                            {t.icon}
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {docType === 'classic' && <ClassicTemplateCard />}
            {docType === 'proposal' && <ProposalTemplateEditor />}
        </div>
    )
}

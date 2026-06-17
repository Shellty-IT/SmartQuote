// src/app/dashboard/offers/new/components/StepSupportTemplate.tsx
// Document-as-editor step — shown during offer creation when templateType === 'support'.
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { SupportDocumentEditorWizard } from '@/components/offers/SupportDocumentEditor'
import { settingsApi } from '@/lib/api'
import type { CompanyInfo, Client } from '@/types'
import type { SupportBlocks } from '@/lib/pdf/support-blocks'
import type { SupportOfferData } from '@/lib/pdf/support-html'
import type { OfferContext } from '@/components/offers/editor/block-editors'

interface StepSupportTemplateProps {
    client: Client | null
    offerTitle: string
    onTitleChange: (title: string) => void
    blocks: SupportBlocks
    onBlocksChange: (blocks: SupportBlocks) => void
}

export default function StepSupportTemplate({
    client,
    offerTitle,
    onTitleChange,
    blocks,
    onBlocksChange,
}: StepSupportTemplateProps) {
    const { data: session } = useSession()
    const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null)

    useEffect(() => {
        settingsApi.getCompany().then(setCompanyInfo).catch(() => {})
    }, [])

    const offerData = useMemo<SupportOfferData>(() => ({
        offerNumber: 'PODGLĄD',
        offerDate: new Date().toLocaleDateString('pl-PL'),
        clientName: client?.name ?? 'Klient',
        userLogoUrl: companyInfo?.logo ?? undefined,
        userCompanyName: companyInfo?.name ?? session?.user?.name ?? undefined,
        userEmail: companyInfo?.email ?? session?.user?.email ?? undefined,
        userPhone: companyInfo?.phone ?? undefined,
        userWebsite: companyInfo?.website ?? undefined,
    }), [client, session, companyInfo])

    const offerContext = useMemo<OfferContext>(() => ({
        title: offerTitle || 'Oferta wsparcia IT',
        clientName: client?.name ?? 'Klient',
        totalGross: 0,
        currency: 'PLN',
    }), [offerTitle, client])

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h2 className="text-lg font-semibold text-foreground">Szablon: Wsparcie IT / SLA</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Kliknij dowolną sekcję na dokumencie, aby edytować jej treść.
                </p>
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-foreground">Nazwa oferty</label>
                <input
                    type="text"
                    value={offerTitle}
                    onChange={(e) => onTitleChange(e.target.value)}
                    placeholder="np. Wsparcie IT — Nazwa Firmy..."
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
            </div>

            <SupportDocumentEditorWizard
                offer={offerData}
                blocks={blocks}
                onBlocksChange={onBlocksChange}
                offerContext={offerContext}
            />
        </div>
    )
}

// src/app/dashboard/offers/new/components/StepUniversalTemplate.tsx
// Document-as-editor step — shown during offer creation when templateType === 'universal'.
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { UniversalDocumentEditorWizard } from '@/components/offers/UniversalDocumentEditor'
import { settingsApi } from '@/lib/api'
import type { CompanyInfo, Client } from '@/types'
import type { UniversalBlocks } from '@/lib/pdf/universal-blocks'
import type { UniversalOfferData } from '@/lib/pdf/universal-html'
import type { OfferContext } from '@/components/offers/editor/block-editors'

interface StepUniversalTemplateProps {
    client: Client | null
    offerTitle: string
    onTitleChange: (title: string) => void
    blocks: UniversalBlocks
    onBlocksChange: (blocks: UniversalBlocks) => void
}

export default function StepUniversalTemplate({
    client,
    offerTitle,
    onTitleChange,
    blocks,
    onBlocksChange,
}: StepUniversalTemplateProps) {
    const { data: session } = useSession()
    const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null)

    useEffect(() => {
        settingsApi.getCompany().then(setCompanyInfo).catch(() => {})
    }, [])

    const offerData = useMemo<UniversalOfferData>(() => ({
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
        title: offerTitle || 'Oferta',
        clientName: client?.name ?? 'Klient',
        totalGross: 0,
        currency: 'PLN',
    }), [offerTitle, client])

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h2 className="text-lg font-semibold text-foreground">Szablon: Szablon uniwersalny</h2>
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
                    placeholder="np. Oferta — Nazwa Firmy..."
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
            </div>

            <UniversalDocumentEditorWizard
                offer={offerData}
                blocks={blocks}
                onBlocksChange={onBlocksChange}
                offerContext={offerContext}
            />
        </div>
    )
}

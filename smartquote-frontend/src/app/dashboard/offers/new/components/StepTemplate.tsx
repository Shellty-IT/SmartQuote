// src/app/dashboard/offers/new/components/StepTemplate.tsx
// Document-as-editor step — shown during offer creation when templateType === 'proposal'.
// Renders the proposal document inline; user clicks sections to edit them.
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { ProposalDocumentEditor } from '@/components/offers/editor/ProposalDocumentEditor'
import { settingsApi } from '@/lib/api'
import type { CompanyInfo } from '@/types'
import type { ProposalBlocks } from '@/lib/pdf/proposal-blocks'
import type { Client } from '@/types'

interface StepTemplateProps {
    client: Client | null
    offerTitle: string
    totalGross: number
    currency: string
    paymentDays: number
    blocks: ProposalBlocks
    onBlocksChange: (blocks: ProposalBlocks) => void
}

export default function StepTemplate({
    client,
    offerTitle,
    totalGross,
    currency,
    paymentDays,
    blocks,
    onBlocksChange,
}: StepTemplateProps) {
    const { data: session } = useSession()
    const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null)

    useEffect(() => {
        settingsApi.getCompany().then(setCompanyInfo).catch(() => {})
    }, [])

    // Build a minimal ProposalOfferData for the preview
    const previewOffer = useMemo(() => ({
        number: 'PODGLĄD',
        title: offerTitle || 'Nowa oferta',
        totalGross,
        currency,
        paymentDays,
        createdAt: new Date().toISOString(),
        client: {
            name: client?.name ?? 'Klient',
            company: client?.company ?? null,
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
    }), [offerTitle, totalGross, currency, paymentDays, client, session, companyInfo, blocks])

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h2 className="text-lg font-semibold text-foreground">Szablon: Strona internetowa</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Kliknij dowolną sekcję na dokumencie aby edytować jej treść.
                    Szare sekcje są wyłączone — kliknij aby włączyć i edytować.
                </p>
            </div>

            <ProposalDocumentEditor
                offer={previewOffer}
                blocks={blocks}
                onBlocksChange={onBlocksChange}
                // No PDF download during creation (offer not saved yet)
            />
        </div>
    )
}

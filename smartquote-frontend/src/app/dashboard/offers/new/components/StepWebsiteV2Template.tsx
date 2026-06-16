// src/app/dashboard/offers/new/components/StepWebsiteV2Template.tsx
// Document-as-editor step — shown during offer creation when templateType === 'website_v2'.
// Renders the website v2 document inline; user clicks sections to edit them.
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { WebsiteV2DocumentEditor } from '@/components/offers/WebsiteV2DocumentEditor'
import { settingsApi } from '@/lib/api'
import type { CompanyInfo, Client } from '@/types'
import type { WebsiteV2Blocks } from '@/lib/pdf/website-v2-blocks'

interface StepWebsiteV2TemplateProps {
    client: Client | null
    offerTitle: string
    onTitleChange: (title: string) => void
    totalGross: number
    currency: string
    paymentDays: number
    blocks: WebsiteV2Blocks
    onBlocksChange: (blocks: WebsiteV2Blocks) => void
}

export default function StepWebsiteV2Template({
    client,
    offerTitle,
    onTitleChange,
    totalGross,
    currency,
    paymentDays,
    blocks,
    onBlocksChange,
}: StepWebsiteV2TemplateProps) {
    const { data: session } = useSession()
    const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null)

    useEffect(() => {
        settingsApi.getCompany().then(setCompanyInfo).catch(() => {})
    }, [])

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
                email: companyInfo.email ?? null,
            } : null,
        },
        blocks,
    }), [offerTitle, totalGross, currency, paymentDays, client, session, companyInfo, blocks])

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h2 className="text-lg font-semibold text-foreground">Szablon: Strona internetowa v2</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Kliknij dowolną sekcję na dokumencie aby edytować jej treść.
                </p>
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-foreground">Nazwa oferty</label>
                <input
                    type="text"
                    value={offerTitle}
                    onChange={(e) => onTitleChange(e.target.value)}
                    placeholder="Wpisz nazwę oferty..."
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
            </div>

            <WebsiteV2DocumentEditor
                offer={previewOffer}
                blocks={blocks}
                onBlocksChange={onBlocksChange}
            />
        </div>
    )
}

// src/app/dashboard/offers/new/components/StepMobileAppTemplate.tsx
// Document-as-editor step — shown during offer creation when templateType === 'mobile_app'.
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { MobileAppDocumentEditorWizard } from '@/components/offers/MobileAppDocumentEditor'
import { settingsApi } from '@/lib/api'
import type { CompanyInfo, Client } from '@/types'
import type { MobileAppBlocks } from '@/lib/pdf/mobile-app-blocks'
import type { MobileAppOfferData } from '@/lib/pdf/mobile-app-html'

interface StepMobileAppTemplateProps {
    client: Client | null
    offerTitle: string
    onTitleChange: (title: string) => void
    blocks: MobileAppBlocks
    onBlocksChange: (blocks: MobileAppBlocks) => void
}

export default function StepMobileAppTemplate({
    client,
    offerTitle,
    onTitleChange,
    blocks,
    onBlocksChange,
}: StepMobileAppTemplateProps) {
    const { data: session } = useSession()
    const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null)

    useEffect(() => {
        settingsApi.getCompany().then(setCompanyInfo).catch(() => {})
    }, [])

    const offerData = useMemo<MobileAppOfferData>(() => ({
        offerNumber: 'PODGLĄD',
        offerDate: new Date().toLocaleDateString('pl-PL'),
        clientName: client?.name ?? 'Klient',
        userLogoUrl: companyInfo?.logo ?? undefined,
        userCompanyName: companyInfo?.name ?? session?.user?.name ?? undefined,
        userEmail: companyInfo?.email ?? session?.user?.email ?? undefined,
        userPhone: companyInfo?.phone ?? undefined,
        userWebsite: companyInfo?.website ?? undefined,
    }), [client, session, companyInfo])

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h2 className="text-lg font-semibold text-foreground">Szablon: Aplikacja mobilna - zaawansowana</h2>
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
                    placeholder="np. Aplikacja mobilna — Nazwa Firmy..."
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
            </div>

            <MobileAppDocumentEditorWizard
                offer={offerData}
                blocks={blocks}
                onBlocksChange={onBlocksChange}
            />
        </div>
    )
}

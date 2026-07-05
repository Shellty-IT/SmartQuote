// src/app/dashboard/offers/new/components/StepClassicTemplate.tsx
// Document-as-editor step for the "Uniwersalny - systemowy" (classic) template.
// Replaces the old flat Details + Items steps with a single live-preview editor.
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { ClassicDocumentEditor } from '@/components/offers/ClassicDocumentEditor'
import { settingsApi } from '@/lib/api'
import type { CompanyInfo, Client } from '@/types'
import type { ClassicOfferData } from '@/lib/pdf/classic-html'
import type { OfferDetails, ExtendedOfferItem, OfferTotalsData } from '../types'

interface StepClassicTemplateProps {
    client: Pick<Client, 'name' | 'company'> | null
    details: OfferDetails
    onUpdate: <K extends keyof OfferDetails>(field: K, value: OfferDetails[K]) => void
    items: ExtendedOfferItem[]
    totals: OfferTotalsData
    uniqueVariants: string[]
    onAddItem: () => void
    onRemoveItem: (index: number) => void
    onUpdateItem: (index: number, field: keyof ExtendedOfferItem, value: string | number | boolean) => void
}

export default function StepClassicTemplate({
    client,
    details,
    onUpdate,
    items,
    totals,
    uniqueVariants,
    onAddItem,
    onRemoveItem,
    onUpdateItem,
}: StepClassicTemplateProps) {
    const { data: session } = useSession()
    const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null)

    useEffect(() => {
        settingsApi.getCompany().then(setCompanyInfo).catch(() => {})
    }, [])

    const previewClient = useMemo<ClassicOfferData['client']>(() => ({
        type: client?.company ? 'COMPANY' : 'INDIVIDUAL',
        name: client?.name ?? 'Klient',
        company: client?.company ?? null,
        nip: null,
        email: null,
        phone: null,
        address: null,
        city: null,
        postalCode: null,
    }), [client])

    const previewUser = useMemo<ClassicOfferData['user']>(() => ({
        name: companyInfo?.name ?? session?.user?.name ?? null,
        email: companyInfo?.email ?? session?.user?.email ?? '',
        company: companyInfo?.name ?? null,
        nip: companyInfo?.nip ?? null,
        phone: companyInfo?.phone ?? null,
        address: companyInfo?.address ?? null,
        city: companyInfo?.city ?? null,
        postalCode: companyInfo?.postalCode ?? null,
        logo: companyInfo?.logo ?? null,
        website: companyInfo?.website ?? null,
    }), [companyInfo, session])

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h2 className="text-lg font-semibold text-foreground">Szablon: Uniwersalny - systemowy</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Klasyczna oferta z tabelą pozycji. Kliknij sekcję w podglądzie, aby edytować jej treść.
                </p>
            </div>

            <div className="h-[calc(100vh-260px)] min-h-[640px]">
                <ClassicDocumentEditor
                    number="PODGLĄD"
                    createdAt={new Date().toISOString()}
                    previewClient={previewClient}
                    previewUser={previewUser}
                    details={details}
                    onUpdate={onUpdate}
                    items={items}
                    totals={totals}
                    uniqueVariants={uniqueVariants}
                    onAddItem={onAddItem}
                    onRemoveItem={onRemoveItem}
                    onUpdateItem={onUpdateItem}
                    clientName={client?.name ?? ''}
                />
            </div>
        </div>
    )
}

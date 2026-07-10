// src/app/api/offers/[id]/mobile-simple/preview/route.ts
// Returns HTML preview for the "Aplikacja mobilna - domyślny" template.
// GET /api/offers/:id/mobile-simple/preview → text/html

import { buildMobileSimpleHtml, type MobileSimpleOfferData } from '@/lib/pdf/mobile-simple-html'
import { applyPdfPreviewMode } from '@/lib/pdf/print-preview'
import { mergeMobileSimpleWithDefaults, buildDefaultMobileSimpleBlocks } from '@/lib/pdf/mobile-simple-blocks'
import {
    getBackendUrl,
    requireAccessToken,
    buildHtmlOrRespond,
    htmlResponse,
} from '@/lib/pdf/route-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface RawOfferData {
    number?: string | null
    createdAt?: string | null
    totalNet?: number | null
    totalGross?: number | null
    currency?: string | null
    client?: { name?: string | null } | null
    user?: { name?: string | null; email?: string | null } | null
    blocks?: unknown
}

interface RawCompanySettings {
    logo?: string | null
    logoDark?: string | null
    name?: string | null
    email?: string | null
    phone?: string | null
    website?: string | null
}

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params

    const accessToken = await requireAccessToken()
    if (accessToken instanceof Response) return accessToken

    const backendUrl = getBackendUrl()

    const [offerRes, settingsRes] = await Promise.all([
        fetch(`${backendUrl}/api/offers/${id}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            cache: 'no-store',
        }),
        fetch(`${backendUrl}/api/settings/company`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            cache: 'no-store',
        }),
    ])

    if (!offerRes.ok) {
        return new Response('Offer not found', { status: offerRes.status === 404 ? 404 : 502 })
    }

    const { data: offer } = (await offerRes.json()) as { data: RawOfferData }

    let companySettings: RawCompanySettings | null = null
    if (settingsRes.ok) {
        try {
            // /api/settings/company returns the company object directly under `data`
            // (NOT nested under `companyInfo` like /api/settings does).
            const { data: settings } = (await settingsRes.json()) as { data: RawCompanySettings }
            companySettings = settings ?? null
        } catch { /* continue without company data */ }
    }

    const offerData: MobileSimpleOfferData = {
        offerNumber: offer.number ?? id,
        offerDate: offer.createdAt
            ? new Date(offer.createdAt).toLocaleDateString('pl-PL')
            : undefined,
        clientName: offer.client?.name ?? undefined,
        userLogoUrl: companySettings?.logo ?? undefined,
        userLogoDarkUrl: companySettings?.logoDark ?? undefined,
        userCompanyName: companySettings?.name ?? offer.user?.name ?? undefined,
        userEmail: companySettings?.email ?? offer.user?.email ?? undefined,
        userPhone: companySettings?.phone ?? undefined,
        userWebsite: companySettings?.website ?? undefined,
        totalNet: offer.totalNet ?? undefined,
        totalGross: offer.totalGross ?? undefined,
        currency: offer.currency ?? undefined,
    }

    const blocks = offer.blocks
        ? mergeMobileSimpleWithDefaults(offer.blocks)
        : buildDefaultMobileSimpleBlocks()

    const html = buildHtmlOrRespond('mobile-simple-preview', () => applyPdfPreviewMode(buildMobileSimpleHtml(blocks, offerData)))
    if (html instanceof Response) return html

    return htmlResponse(html)
}

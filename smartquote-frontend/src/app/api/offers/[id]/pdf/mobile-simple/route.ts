// src/app/api/offers/[id]/pdf/mobile-simple/route.ts
// Generates a PDF for the "Aplikacja mobilna - domyślny" template using Puppeteer.
// GET /api/offers/:id/pdf/mobile-simple → application/pdf

import { buildMobileSimpleHtml, type MobileSimpleOfferData } from '@/lib/pdf/mobile-simple-html'
import { addDocumentActionLinks, publicDocumentUrl } from '@/lib/pdf/document-action-links'
import { mergeMobileSimpleWithDefaults, buildDefaultMobileSimpleBlocks } from '@/lib/pdf/mobile-simple-blocks'
import { documentTemplateMismatch } from '@/lib/pdf/template-guard'
import {
    getBackendUrl,
    requireAccessToken,
    buildHtmlOrRespond,
    renderPdfOrRespond,
    pdfResponse,
} from '@/lib/pdf/route-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 10

interface RawOfferData {
    number?: string | null
    createdAt?: string | null
    totalNet?: number | null
    totalGross?: number | null
    currency?: string | null
    client?: { name?: string | null } | null
    user?: { name?: string | null; email?: string | null } | null
    blocks?: unknown
    publicToken?: string
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
    const mismatch = documentTemplateMismatch(offer, 'mobile_simple')
    if (mismatch) return mismatch

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

    const html = buildHtmlOrRespond('mobile-simple-pdf', () =>
        addDocumentActionLinks(buildMobileSimpleHtml(blocks, offerData), publicDocumentUrl('offer', offer.publicToken, 'accept'), 'accept'),
    )
    if (html instanceof Response) return html

    const buffer = await renderPdfOrRespond('mobile-simple-pdf', html)
    if (buffer instanceof Response) return buffer

    const safeNumber = (offer.number ?? id).replace(/\//g, '-')
    return pdfResponse(buffer, `Oferta_${safeNumber}_mobile-simple.pdf`)
}

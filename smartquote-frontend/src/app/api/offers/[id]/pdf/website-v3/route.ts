// src/app/api/offers/[id]/pdf/website-v3/route.ts
// Generates a PDF for the "Strona internetowa v3" template using Puppeteer.
// GET /api/offers/:id/pdf/website-v3 → application/pdf

import { buildWebsiteV3Html, type WebsiteV3OfferData } from '@/lib/pdf/website-v3-html'
import { addDocumentActionLinks, publicDocumentUrl } from '@/lib/pdf/document-action-links'
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

    const { data: offer } = (await offerRes.json()) as { data: WebsiteV3OfferData }
    const mismatch = documentTemplateMismatch(offer, 'website_v3')
    if (mismatch) return mismatch
    const companyInfo = settingsRes.ok ? ((await settingsRes.json()) as { data: WebsiteV3OfferData['user']['companyInfo'] }).data : null

    const offerData: WebsiteV3OfferData = {
        ...offer,
        user: {
            ...offer.user,
            companyInfo: companyInfo ?? offer.user.companyInfo,
        },
    }

    const html = buildHtmlOrRespond('website-v3-pdf', () =>
        addDocumentActionLinks(buildWebsiteV3Html(offerData), publicDocumentUrl('offer', (offer as WebsiteV3OfferData & { publicToken?: string }).publicToken, 'accept'), 'accept'),
    )
    if (html instanceof Response) return html

    const buffer = await renderPdfOrRespond('website-v3-pdf', html)
    if (buffer instanceof Response) return buffer

    const safeNumber = offer.number?.replace(/\//g, '-') ?? id
    return pdfResponse(buffer, `Oferta_${safeNumber}_strona-v3.pdf`)
}

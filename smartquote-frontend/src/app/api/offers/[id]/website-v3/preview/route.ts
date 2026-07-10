// src/app/api/offers/[id]/website-v3/preview/route.ts
// Returns raw HTML for the "Strona internetowa v3" template — for in-browser preview.
// GET /api/offers/:id/website-v3/preview → returns text/html

import { buildWebsiteV3Html, type WebsiteV3OfferData } from '@/lib/pdf/website-v3-html'
import { applyPdfPreviewMode } from '@/lib/pdf/print-preview'
import {
    getBackendUrl,
    requireAccessToken,
    buildHtmlOrRespond,
    htmlResponse,
} from '@/lib/pdf/route-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params

    const accessToken = await requireAccessToken()
    if (accessToken instanceof Response) return accessToken

    const backendUrl = getBackendUrl()
    const authHeader = { Authorization: `Bearer ${accessToken}` }

    const [offerRes, settingsRes] = await Promise.all([
        fetch(`${backendUrl}/api/offers/${id}`, { headers: authHeader, cache: 'no-store' }),
        fetch(`${backendUrl}/api/settings/company`, { headers: authHeader, cache: 'no-store' }),
    ])

    if (!offerRes.ok) {
        return new Response('Offer not found', { status: offerRes.status === 404 ? 404 : 502 })
    }

    const { data: offer } = (await offerRes.json()) as { data: WebsiteV3OfferData }
    const companyInfo = settingsRes.ok
        ? ((await settingsRes.json()) as { data: WebsiteV3OfferData['user']['companyInfo'] }).data
        : null

    const offerData: WebsiteV3OfferData = {
        ...offer,
        user: {
            ...offer.user,
            companyInfo: companyInfo ?? offer.user?.companyInfo ?? null,
        },
    }

    const html = buildHtmlOrRespond('website-v3-preview', () => applyPdfPreviewMode(buildWebsiteV3Html(offerData)))
    if (html instanceof Response) return html

    return htmlResponse(html)
}

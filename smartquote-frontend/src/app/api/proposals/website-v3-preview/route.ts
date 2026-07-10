// src/app/api/proposals/website-v3-preview/route.ts
// Returns HTML for the "Strona internetowa v3" template from inline POST data.
// Used during the offer creation wizard (before the offer exists in DB).
// POST /api/proposals/website-v3-preview → returns text/html

import { buildWebsiteV3Html, type WebsiteV3OfferData } from '@/lib/pdf/website-v3-html'
import { applyPdfPreviewMode } from '@/lib/pdf/print-preview'
import { requireAccessToken, htmlResponse } from '@/lib/pdf/route-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: Request) {
    const accessToken = await requireAccessToken()
    if (accessToken instanceof Response) return accessToken

    let offer: WebsiteV3OfferData
    try {
        offer = (await req.json()) as WebsiteV3OfferData
    } catch {
        return new Response('Invalid JSON body', { status: 400 })
    }

    return htmlResponse(applyPdfPreviewMode(buildWebsiteV3Html(offer)))
}

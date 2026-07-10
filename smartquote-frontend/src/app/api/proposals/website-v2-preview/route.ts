// src/app/api/proposals/website-v2-preview/route.ts
// Returns HTML for the "Strona internetowa v2" template from inline POST data.
// Used during the offer creation wizard (before the offer exists in DB).
// POST /api/proposals/website-v2-preview → returns text/html

import { buildWebsiteV2Html, type WebsiteV2OfferData } from '@/lib/pdf/website-v2-html'
import { applyPdfPreviewMode } from '@/lib/pdf/print-preview'
import { requireAccessToken, htmlResponse } from '@/lib/pdf/route-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: Request) {
    const accessToken = await requireAccessToken()
    if (accessToken instanceof Response) return accessToken

    let offer: WebsiteV2OfferData
    try {
        offer = (await req.json()) as WebsiteV2OfferData
    } catch {
        return new Response('Invalid JSON body', { status: 400 })
    }

    return htmlResponse(applyPdfPreviewMode(buildWebsiteV2Html(offer)))
}

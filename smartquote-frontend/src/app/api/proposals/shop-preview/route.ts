// src/app/api/proposals/shop-preview/route.ts
// Returns HTML for the "Sklep internetowy" template from inline POST data.
// Used during the offer creation wizard (before the offer exists in DB).
// POST /api/proposals/shop-preview → returns text/html

import { buildShopHtml, type ShopOfferData } from '@/lib/pdf/shop-html'
import { applyPdfPreviewMode } from '@/lib/pdf/print-preview'
import { requireAccessToken, htmlResponse } from '@/lib/pdf/route-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: Request) {
    const accessToken = await requireAccessToken()
    if (accessToken instanceof Response) return accessToken

    let offer: ShopOfferData
    try {
        offer = (await req.json()) as ShopOfferData
    } catch {
        return new Response('Invalid JSON body', { status: 400 })
    }

    return htmlResponse(applyPdfPreviewMode(buildShopHtml(offer)))
}

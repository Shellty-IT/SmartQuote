// src/app/api/proposals/support-preview/route.ts
// Returns HTML for the "Wsparcie" template from inline POST data.
// Used during the offer creation wizard (before the offer exists in DB).
// POST /api/proposals/support-preview → text/html

import { buildSupportHtml, type SupportOfferData } from '@/lib/pdf/support-html'
import { applyPdfPreviewMode } from '@/lib/pdf/print-preview'
import { mergeSupportWithDefaults, buildDefaultSupportBlocks, type SupportBlocks } from '@/lib/pdf/support-blocks'
import { requireAccessToken, htmlResponse } from '@/lib/pdf/route-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface PreviewBody {
    offer?: Partial<SupportOfferData>
    blocks?: Partial<SupportBlocks>
}

export async function POST(req: Request) {
    const accessToken = await requireAccessToken()
    if (accessToken instanceof Response) return accessToken

    let body: PreviewBody
    try {
        body = (await req.json()) as PreviewBody
    } catch {
        return new Response('Invalid JSON body', { status: 400 })
    }

    const offer: SupportOfferData = body.offer ?? {}
    const blocks = body.blocks
        ? mergeSupportWithDefaults(body.blocks)
        : buildDefaultSupportBlocks()

    return htmlResponse(applyPdfPreviewMode(buildSupportHtml(blocks, offer)))
}

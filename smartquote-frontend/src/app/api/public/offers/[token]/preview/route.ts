// src/app/api/public/offers/[token]/preview/route.ts
// Public (no auth) HTML preview for a shared offer.
// GET /api/public/offers/:token/preview  →  text/html

import { buildPublicOfferHtml } from '@/lib/pdf/public-offer-html'
import { addDocumentActionLinks } from '@/lib/pdf/document-action-links'
import { applyPdfPreviewMode } from '@/lib/pdf/print-preview'
import { getBackendUrl, fetchJsonOrRespond, htmlResponse } from '@/lib/pdf/route-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
    const { token } = await params

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await fetchJsonOrRespond<{ offer?: any }>(
        `${getBackendUrl()}/api/public/offers/${token}`,
        { cache: 'no-store' },
        'Offer not found',
    )
    if (data instanceof Response) return data
    const offer = data.offer
    if (!offer) return new Response('Offer not found', { status: 404 })

    const html = buildPublicOfferHtml(offer)
    if (!html) return new Response('Template not available', { status: 404 })

    return htmlResponse(applyPdfPreviewMode(addDocumentActionLinks(html, `/offer/view/${token}#accept`, 'accept')))
}

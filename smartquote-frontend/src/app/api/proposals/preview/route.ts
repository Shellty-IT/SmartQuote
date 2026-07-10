// src/app/api/proposals/preview/route.ts
// Returns raw HTML for a proposal template from inline data (no saved offer required).
// Used during offer creation wizard (before the offer exists in the DB).
// POST /api/proposals/preview
//   Body: ProposalOfferData (partial — missing id/number use placeholders)
//   Returns: text/html

import { buildProposalHtml, type ProposalOfferData } from '@/lib/pdf/proposal-html'
import { applyPdfPreviewMode } from '@/lib/pdf/print-preview'
import { requireAccessToken, htmlResponse } from '@/lib/pdf/route-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: Request) {
    const accessToken = await requireAccessToken()
    if (accessToken instanceof Response) return accessToken

    let body: Partial<ProposalOfferData>
    try {
        body = await req.json()
    } catch {
        return new Response('Invalid JSON', { status: 400 })
    }

    // Fill in placeholders for fields that may not exist yet during creation
    const offerData: ProposalOfferData = {
        number: body.number ?? 'PODGLĄD',
        title: body.title ?? 'Podgląd oferty',
        totalGross: body.totalGross ?? 0,
        currency: body.currency ?? 'PLN',
        paymentDays: body.paymentDays ?? 14,
        createdAt: body.createdAt ?? new Date().toISOString(),
        client: body.client ?? { name: 'Klient', company: null },
        user: body.user ?? { name: null, email: '' },
        blocks: body.blocks ?? null,
    }

    return htmlResponse(applyPdfPreviewMode(buildProposalHtml(offerData)))
}

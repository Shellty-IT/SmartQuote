// src/app/api/proposals/website-v3-preview/route.ts
// Returns HTML for the "Strona internetowa v3" template from inline POST data.
// Used during the offer creation wizard (before the offer exists in DB).
// POST /api/proposals/website-v3-preview → returns text/html

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { buildWebsiteV3Html, type WebsiteV3OfferData } from '@/lib/pdf/website-v3-html'
import { applyPdfPreviewMode } from '@/lib/pdf/print-preview'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface SessionWithToken { accessToken?: string }

export async function POST(req: Request) {
    const session = (await getServerSession(authOptions)) as SessionWithToken | null
    if (!session?.accessToken) {
        return new Response('Unauthorized', { status: 401 })
    }

    let offer: WebsiteV3OfferData
    try {
        offer = (await req.json()) as WebsiteV3OfferData
    } catch {
        return new Response('Invalid JSON body', { status: 400 })
    }

    const html = applyPdfPreviewMode(buildWebsiteV3Html(offer))

    return new Response(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
}

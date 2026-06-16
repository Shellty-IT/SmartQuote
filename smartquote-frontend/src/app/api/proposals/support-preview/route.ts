// src/app/api/proposals/support-preview/route.ts
// Returns HTML for the "Wsparcie" template from inline POST data.
// Used during the offer creation wizard (before the offer exists in DB).
// POST /api/proposals/support-preview → text/html

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { buildSupportHtml, type SupportOfferData } from '@/lib/pdf/support-html'
import { mergeSupportWithDefaults, buildDefaultSupportBlocks, type SupportBlocks } from '@/lib/pdf/support-blocks'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface SessionWithToken { accessToken?: string }

interface PreviewBody {
    offer?: Partial<SupportOfferData>
    blocks?: Partial<SupportBlocks>
}

export async function POST(req: Request) {
    const session = (await getServerSession(authOptions)) as SessionWithToken | null
    if (!session?.accessToken) {
        return new Response('Unauthorized', { status: 401 })
    }

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

    const html = buildSupportHtml(blocks, offer)

    return new Response(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
}

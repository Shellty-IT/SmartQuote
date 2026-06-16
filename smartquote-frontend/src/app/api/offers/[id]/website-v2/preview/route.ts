// src/app/api/offers/[id]/website-v2/preview/route.ts
// Returns raw HTML for the "Strona internetowa v2" template — for in-browser preview.
// GET /api/offers/:id/website-v2/preview → returns text/html

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { buildWebsiteV2Html, type WebsiteV2OfferData } from '@/lib/pdf/website-v2-html'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface SessionWithToken { accessToken?: string }

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params

    const session = (await getServerSession(authOptions)) as SessionWithToken | null
    if (!session?.accessToken) {
        return new Response('Unauthorized', { status: 401 })
    }

    const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8080').replace(/\/$/, '')
    const offerRes = await fetch(`${backendUrl}/api/offers/${id}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
        cache: 'no-store',
    })

    if (!offerRes.ok) {
        return new Response('Offer not found', { status: offerRes.status === 404 ? 404 : 502 })
    }

    const { data: offer } = (await offerRes.json()) as { data: WebsiteV2OfferData }
    const html = buildWebsiteV2Html(offer)

    return new Response(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
}

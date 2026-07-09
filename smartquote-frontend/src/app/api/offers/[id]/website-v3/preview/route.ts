// src/app/api/offers/[id]/website-v3/preview/route.ts
// Returns raw HTML for the "Strona internetowa v3" template — for in-browser preview.
// GET /api/offers/:id/website-v3/preview → returns text/html

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { buildWebsiteV3Html, type WebsiteV3OfferData } from '@/lib/pdf/website-v3-html'
import { applyPdfPreviewMode } from '@/lib/pdf/print-preview'

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
    const authHeader = { Authorization: `Bearer ${session.accessToken}` }

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

    let html: string
    try {
        html = applyPdfPreviewMode(buildWebsiteV3Html(offerData))
    } catch (err) {
        const detail = err instanceof Error ? `${err.message}\n${err.stack}` : String(err)
        console.error('[website-v3-preview] buildWebsiteV3Html threw:', detail)
        return new Response(JSON.stringify({ error: 'HTML build failed', ...(process.env.NODE_ENV === 'development' ? { detail } : {}) }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }

    return new Response(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
}

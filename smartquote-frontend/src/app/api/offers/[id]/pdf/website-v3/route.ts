// src/app/api/offers/[id]/pdf/website-v3/route.ts
// Generates a PDF for the "Strona internetowa v3" template using Puppeteer.
// GET /api/offers/:id/pdf/website-v3 → application/pdf

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { buildWebsiteV3Html, type WebsiteV3OfferData } from '@/lib/pdf/website-v3-html'
import { addDocumentActionLinks, publicDocumentUrl } from '@/lib/pdf/document-action-links'
import { htmlToPdfBuffer } from '@/lib/pdf/puppeteer'
import { documentTemplateMismatch } from '@/lib/pdf/template-guard'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 10

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

    const [offerRes, settingsRes] = await Promise.all([
        fetch(`${backendUrl}/api/offers/${id}`, {
            headers: { Authorization: `Bearer ${session.accessToken}` },
            cache: 'no-store',
        }),
        fetch(`${backendUrl}/api/settings/company`, {
            headers: { Authorization: `Bearer ${session.accessToken}` },
            cache: 'no-store',
        }),
    ])

    if (!offerRes.ok) {
        return new Response('Offer not found', { status: offerRes.status === 404 ? 404 : 502 })
    }

    const { data: offer } = (await offerRes.json()) as { data: WebsiteV3OfferData }
    const mismatch = documentTemplateMismatch(offer, 'website_v3')
    if (mismatch) return mismatch
    const companyInfo = settingsRes.ok ? ((await settingsRes.json()) as { data: WebsiteV3OfferData['user']['companyInfo'] }).data : null

    const offerData: WebsiteV3OfferData = {
        ...offer,
        user: {
            ...offer.user,
            companyInfo: companyInfo ?? offer.user.companyInfo,
        },
    }

    let html: string
    try {
        html = addDocumentActionLinks(buildWebsiteV3Html(offerData), publicDocumentUrl('offer', (offer as WebsiteV3OfferData & { publicToken?: string }).publicToken, 'accept'), 'accept')
    } catch (err) {
        const detail = err instanceof Error ? `${err.message}\n${err.stack}` : String(err)
        console.error('[website-v3-pdf] buildWebsiteV3Html threw:', detail)
        return new Response(JSON.stringify({ error: 'HTML build failed', ...(process.env.NODE_ENV === 'development' ? { detail } : {}) }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }

    let pdfBuffer: Buffer
    try {
        pdfBuffer = await htmlToPdfBuffer(html)
    } catch (err) {
        const detail = err instanceof Error ? `${err.message}\n${err.stack}` : String(err)
        console.error('[website-v3-pdf] Puppeteer error:', detail)
        return new Response(JSON.stringify({ error: 'PDF generation failed', ...(process.env.NODE_ENV === 'development' ? { detail } : {}) }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }

    const safeNumber = offer.number?.replace(/\//g, '-') ?? id
    return new Response(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="Oferta_${safeNumber}_strona-v3.pdf"`,
            'Content-Length': String(pdfBuffer.length),
        },
    })
}

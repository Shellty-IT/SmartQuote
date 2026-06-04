// src/app/api/offers/[id]/pdf/proposal/route.ts
// Generates a proposal PDF using Puppeteer.
// GET /api/offers/:id/pdf/proposal
//   → returns application/pdf

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { buildProposalHtml, type ProposalOfferData } from '@/lib/pdf/proposal-html'
import { htmlToPdfBuffer } from '@/lib/pdf/puppeteer'

// Vercel route config — require adequate memory + allow up to 10s (Hobby limit)
export const maxDuration = 10
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface SessionWithToken {
    accessToken?: string
}

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params

    // 1. Auth
    const session = (await getServerSession(authOptions)) as SessionWithToken | null
    if (!session?.accessToken) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        })
    }

    // 2. Fetch offer from backend
    const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8080').replace(/\/$/, '')
    const offerRes = await fetch(`${backendUrl}/api/offers/${id}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
        cache: 'no-store',
    })

    if (!offerRes.ok) {
        const status = offerRes.status === 404 ? 404 : 502
        return new Response(JSON.stringify({ error: 'Offer not found' }), {
            status,
            headers: { 'Content-Type': 'application/json' },
        })
    }

    const { data: offer } = (await offerRes.json()) as { data: ProposalOfferData }

    // 3. Build HTML
    const html = buildProposalHtml(offer)

    // 4. Render PDF
    let buffer: Buffer
    try {
        buffer = await htmlToPdfBuffer(html)
    } catch (err) {
        console.error('[proposal-pdf] Puppeteer error:', err)
        return new Response(JSON.stringify({ error: 'PDF generation failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }

    // 5. Return PDF
    const filename = `Oferta_${offer.number.replace(/\//g, '-')}_propozycja.pdf`
    return new Response(new Uint8Array(buffer), {
        status: 200,
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': String(buffer.length),
        },
    })
}

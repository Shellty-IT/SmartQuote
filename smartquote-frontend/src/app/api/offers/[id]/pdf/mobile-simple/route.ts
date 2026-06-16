// src/app/api/offers/[id]/pdf/mobile-simple/route.ts
// Generates a PDF for the "Aplikacja mobilna - simple" template using Puppeteer.
// GET /api/offers/:id/pdf/mobile-simple → application/pdf

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { buildMobileSimpleHtml, type MobileSimpleOfferData } from '@/lib/pdf/mobile-simple-html'
import { mergeMobileSimpleWithDefaults, buildDefaultMobileSimpleBlocks } from '@/lib/pdf/mobile-simple-blocks'
import { htmlToPdfBuffer } from '@/lib/pdf/puppeteer'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 10

interface SessionWithToken { accessToken?: string }

interface RawOfferData {
    number?: string | null
    createdAt?: string | null
    client?: { name?: string | null } | null
    user?: { name?: string | null; email?: string | null } | null
    blocks?: unknown
}

interface RawCompanySettings {
    logo?: string | null
    name?: string | null
    email?: string | null
    phone?: string | null
    website?: string | null
}

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

    const { data: offer } = (await offerRes.json()) as { data: RawOfferData }

    let companySettings: RawCompanySettings | null = null
    if (settingsRes.ok) {
        try {
            // /api/settings/company returns the company object directly under `data`
            // (NOT nested under `companyInfo` like /api/settings does).
            const { data: settings } = (await settingsRes.json()) as { data: RawCompanySettings }
            companySettings = settings ?? null
        } catch { /* continue without company data */ }
    }

    const offerData: MobileSimpleOfferData = {
        offerNumber: offer.number ?? id,
        offerDate: offer.createdAt
            ? new Date(offer.createdAt).toLocaleDateString('pl-PL')
            : undefined,
        clientName: offer.client?.name ?? undefined,
        userLogoUrl: companySettings?.logo ?? undefined,
        userCompanyName: companySettings?.name ?? offer.user?.name ?? undefined,
        userEmail: companySettings?.email ?? offer.user?.email ?? undefined,
        userPhone: companySettings?.phone ?? undefined,
        userWebsite: companySettings?.website ?? undefined,
    }

    const blocks = offer.blocks
        ? mergeMobileSimpleWithDefaults(offer.blocks)
        : buildDefaultMobileSimpleBlocks()

    let html: string
    try {
        html = buildMobileSimpleHtml(blocks, offerData)
    } catch (err) {
        const detail = err instanceof Error ? `${err.message}\n${err.stack}` : String(err)
        console.error('[mobile-simple-pdf] buildMobileSimpleHtml threw:', detail)
        return new Response(JSON.stringify({ error: 'HTML build failed', detail }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }

    let buffer: Buffer
    try {
        buffer = await htmlToPdfBuffer(html)
    } catch (err) {
        const detail = err instanceof Error ? `${err.message}\n${err.stack}` : String(err)
        console.error('[mobile-simple-pdf] Puppeteer error:', detail)
        return new Response(JSON.stringify({ error: 'PDF generation failed', detail }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }

    const safeNumber = (offer.number ?? id).replace(/\//g, '-')
    return new Response(new Uint8Array(buffer), {
        status: 200,
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="Oferta_${safeNumber}_mobile-simple.pdf"`,
            'Content-Length': String(buffer.length),
        },
    })
}

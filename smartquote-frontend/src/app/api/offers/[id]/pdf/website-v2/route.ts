// src/app/api/offers/[id]/pdf/website-v2/route.ts
// Generates a "Strona internetowa v2" offer PDF using Puppeteer.
// GET /api/offers/:id/pdf/website-v2 → returns application/pdf

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { buildWebsiteV2Html } from '@/lib/pdf/website-v2-html'
import { htmlToPdfBuffer } from '@/lib/pdf/puppeteer'

export const maxDuration = 10
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
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        })
    }

    const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8080').replace(/\/$/, '')
    const authHeader = { Authorization: `Bearer ${session.accessToken}` }

    const [offerRes, settingsRes] = await Promise.all([
        fetch(`${backendUrl}/api/offers/${id}`, { headers: authHeader, cache: 'no-store' }),
        fetch(`${backendUrl}/api/settings`, { headers: authHeader, cache: 'no-store' }),
    ])

    if (!offerRes.ok) {
        const status = offerRes.status === 404 ? 404 : 502
        return new Response(JSON.stringify({ error: 'Offer not found' }), {
            status,
            headers: { 'Content-Type': 'application/json' },
        })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: offerRaw } = (await offerRes.json()) as { data: Record<string, any> }

    let profileName: string | null = null
    let profileEmail = ''
    let companyData: { name: string | null; website: string | null; logo: string | null; phone: string | null; email: string | null } | null = null

    if (settingsRes.ok) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: settings } = (await settingsRes.json()) as { data: Record<string, any> }
            profileName = settings?.profile?.name ?? null
            profileEmail = settings?.profile?.email ?? ''
            if (settings?.companyInfo) {
                companyData = {
                    name: settings.companyInfo.name ?? null,
                    website: settings.companyInfo.website ?? null,
                    logo: settings.companyInfo.logo ?? null,
                    phone: settings.companyInfo.phone ?? null,
                    email: settings.companyInfo.email ?? settings?.profile?.email ?? null,
                }
            }
        } catch { /* continue without company data */ }
    }

    const offerData = {
        number: String(offerRaw.number ?? ''),
        title: String(offerRaw.title ?? ''),
        totalGross: Number(offerRaw.totalGross ?? 0),
        currency: String(offerRaw.currency ?? 'PLN'),
        paymentDays: Number(offerRaw.paymentDays ?? 14),
        createdAt: offerRaw.createdAt ?? new Date().toISOString(),
        blocks: offerRaw.blocks ?? null,
        client: { name: offerRaw.client?.name ?? '', company: offerRaw.client?.company ?? null },
        user: { name: profileName, email: profileEmail, companyInfo: companyData },
    }

    let html: string
    try {
        html = buildWebsiteV2Html(offerData)
    } catch (err) {
        const detail = err instanceof Error ? `${err.message}\n${err.stack}` : String(err)
        console.error('[website-v2-pdf] buildWebsiteV2Html threw:', detail)
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
        console.error('[website-v2-pdf] Puppeteer error:', detail)
        return new Response(JSON.stringify({ error: 'PDF generation failed', detail }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }

    const filename = `Oferta_${offerData.number.replace(/\//g, '-')}_strona-v2.pdf`
    return new Response(new Uint8Array(buffer), {
        status: 200,
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': String(buffer.length),
        },
    })
}

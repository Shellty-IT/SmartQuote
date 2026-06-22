// src/app/api/offers/[id]/pdf/classic/route.ts
// Generates a PDF for the "Klasyczny" template using Puppeteer.
// GET /api/offers/:id/pdf/classic → application/pdf

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { buildClassicHtml, type ClassicOfferData } from '@/lib/pdf/classic-html'
import { htmlToPdfBuffer } from '@/lib/pdf/puppeteer'
import { documentTemplateMismatch } from '@/lib/pdf/template-guard'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 10

interface SessionWithToken { accessToken?: string }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>

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
        fetch(`${backendUrl}/api/settings`, { headers: authHeader, cache: 'no-store' }),
    ])

    if (!offerRes.ok) {
        return new Response('Offer not found', { status: offerRes.status === 404 ? 404 : 502 })
    }

    const { data: offer } = (await offerRes.json()) as { data: AnyRecord }
    const mismatch = documentTemplateMismatch(offer, 'classic')
    if (mismatch) return mismatch

    let companyInfo: AnyRecord | null = null
    let profileName: string | null = null
    let profileEmail = ''
    if (settingsRes.ok) {
        try {
            const { data: settings } = (await settingsRes.json()) as { data: AnyRecord }
            profileName = settings?.profile?.name ?? null
            profileEmail = settings?.profile?.email ?? ''
            companyInfo = settings?.companyInfo ?? null
        } catch { /* continue without company data */ }
    }

    const data: ClassicOfferData = {
        number: String(offer.number ?? ''),
        title: String(offer.title ?? ''),
        description: offer.description ?? null,
        terms: offer.terms ?? null,
        status: String(offer.status ?? 'DRAFT'),
        totalNet: Number(offer.totalNet ?? 0),
        totalVat: Number(offer.totalVat ?? 0),
        totalGross: Number(offer.totalGross ?? 0),
        currency: String(offer.currency ?? 'PLN'),
        validUntil: offer.validUntil ?? null,
        paymentDays: Number(offer.paymentDays ?? 14),
        createdAt: offer.createdAt ?? new Date().toISOString(),
        client: {
            type: String(offer.client?.type ?? 'PERSON'),
            name: String(offer.client?.name ?? ''),
            company: offer.client?.company ?? null,
            nip: offer.client?.nip ?? null,
            email: offer.client?.email ?? null,
            phone: offer.client?.phone ?? null,
            address: offer.client?.address ?? null,
            city: offer.client?.city ?? null,
            postalCode: offer.client?.postalCode ?? null,
        },
        user: {
            name: profileName ?? offer.user?.name ?? null,
            email: profileEmail || offer.user?.email || '',
            company: companyInfo?.name ?? null,
            nip: companyInfo?.nip ?? null,
            phone: companyInfo?.phone ?? offer.user?.phone ?? null,
            address: companyInfo?.address ?? null,
            city: companyInfo?.city ?? null,
            postalCode: companyInfo?.postalCode ?? null,
            logo: companyInfo?.logoLight ?? companyInfo?.logo ?? null,
            website: companyInfo?.website ?? null,
        },
        items: Array.isArray(offer.items)
            ? offer.items.map((item: AnyRecord) => ({
                name: String(item.name ?? ''),
                description: item.description ?? null,
                quantity: Number(item.quantity ?? 1),
                unit: String(item.unit ?? 'szt'),
                unitPrice: Number(item.unitPrice ?? 0),
                vatRate: Number(item.vatRate ?? 23),
                discount: Number(item.discount ?? 0),
                totalNet: Number(item.totalNet ?? 0),
                variantName: item.variantName ?? null,
            }))
            : [],
    }

    let html: string
    try {
        html = buildClassicHtml(data)
    } catch (err) {
        const detail = err instanceof Error ? `${err.message}\n${err.stack}` : String(err)
        console.error('[classic-pdf] buildClassicHtml threw:', detail)
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
        console.error('[classic-pdf] Puppeteer error:', detail)
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
            'Content-Disposition': `attachment; filename="Oferta_${safeNumber}_klasyczna.pdf"`,
            'Content-Length': String(buffer.length),
        },
    })
}

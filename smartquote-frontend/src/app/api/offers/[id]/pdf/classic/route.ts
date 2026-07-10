// src/app/api/offers/[id]/pdf/classic/route.ts
// Generates a PDF for the "Klasyczny" template using Puppeteer.
// GET /api/offers/:id/pdf/classic → application/pdf

import { buildClassicHtml, type ClassicOfferData } from '@/lib/pdf/classic-html'
import { documentTemplateMismatch } from '@/lib/pdf/template-guard'
import {
    getBackendUrl,
    requireAccessToken,
    buildHtmlOrRespond,
    renderPdfOrRespond,
    pdfResponse,
} from '@/lib/pdf/route-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 10

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params

    const accessToken = await requireAccessToken()
    if (accessToken instanceof Response) return accessToken

    const backendUrl = getBackendUrl()
    const authHeader = { Authorization: `Bearer ${accessToken}` }

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

    const html = buildHtmlOrRespond('classic-pdf', () => buildClassicHtml(data))
    if (html instanceof Response) return html

    const buffer = await renderPdfOrRespond('classic-pdf', html)
    if (buffer instanceof Response) return buffer

    const safeNumber = (offer.number ?? id).replace(/\//g, '-')
    return pdfResponse(buffer, `Oferta_${safeNumber}_klasyczna.pdf`)
}

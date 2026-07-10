// src/app/api/offers/[id]/pdf/website-v2/route.ts
// Generates a "Strona internetowa v2" offer PDF using Puppeteer.
// GET /api/offers/:id/pdf/website-v2 → returns application/pdf

import { buildWebsiteV2Html } from '@/lib/pdf/website-v2-html'
import { addDocumentActionLinks, publicDocumentUrl } from '@/lib/pdf/document-action-links'
import { documentTemplateMismatch } from '@/lib/pdf/template-guard'
import {
    getBackendUrl,
    requireAccessToken,
    buildHtmlOrRespond,
    renderPdfOrRespond,
    pdfResponse,
} from '@/lib/pdf/route-helpers'

export const maxDuration = 10
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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
        const status = offerRes.status === 404 ? 404 : 502
        return new Response(JSON.stringify({ error: 'Offer not found' }), {
            status,
            headers: { 'Content-Type': 'application/json' },
        })
    }

    const { data: offerRaw } = (await offerRes.json()) as { data: AnyRecord }
    const mismatch = documentTemplateMismatch(offerRaw, 'website_v2')
    if (mismatch) return mismatch

    let profileName: string | null = null
    let profileEmail = ''
    let profileAvatar: string | null = null
    let companyData: { name: string | null; website: string | null; logo: string | null; logoLight: string | null; logoDark: string | null; phone: string | null; email: string | null } | null = null

    if (settingsRes.ok) {
        try {
            const { data: settings } = (await settingsRes.json()) as { data: AnyRecord }
            profileName = settings?.profile?.name ?? null
            profileEmail = settings?.profile?.email ?? ''
            profileAvatar = settings?.profile?.avatar ?? null
            if (settings?.companyInfo) {
                companyData = {
                    name: settings.companyInfo.name ?? null,
                    website: settings.companyInfo.website ?? null,
                    logo: settings.companyInfo.logo ?? null,
                    logoLight: settings.companyInfo.logoLight ?? settings.companyInfo.logo ?? null,
                    logoDark: settings.companyInfo.logoDark ?? null,
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
        user: { name: profileName, email: profileEmail, avatar: profileAvatar, companyInfo: companyData },
    }

    const html = buildHtmlOrRespond('website-v2-pdf', () =>
        addDocumentActionLinks(buildWebsiteV2Html(offerData), publicDocumentUrl('offer', offerRaw.publicToken, 'accept'), 'accept'),
    )
    if (html instanceof Response) return html

    const buffer = await renderPdfOrRespond('website-v2-pdf', html)
    if (buffer instanceof Response) return buffer

    return pdfResponse(buffer, `Oferta_${offerData.number.replace(/\//g, '-')}_strona-v2.pdf`)
}

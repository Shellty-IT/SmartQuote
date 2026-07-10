// src/app/api/offers/[id]/website-v2/preview/route.ts
// Returns raw HTML for the "Strona internetowa v2" template — for in-browser preview.
// GET /api/offers/:id/website-v2/preview → returns text/html

import { buildWebsiteV2Html } from '@/lib/pdf/website-v2-html'
import { applyPdfPreviewMode } from '@/lib/pdf/print-preview'
import {
    getBackendUrl,
    requireAccessToken,
    buildHtmlOrRespond,
    htmlResponse,
} from '@/lib/pdf/route-helpers'

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
        return new Response('Offer not found', { status: offerRes.status === 404 ? 404 : 502 })
    }

    const { data: offerRaw } = (await offerRes.json()) as { data: AnyRecord }

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

    const html = buildHtmlOrRespond('website-v2-preview', () => applyPdfPreviewMode(buildWebsiteV2Html(offerData)))
    if (html instanceof Response) return html

    return htmlResponse(html)
}

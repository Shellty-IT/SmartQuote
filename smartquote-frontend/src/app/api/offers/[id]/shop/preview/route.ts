// src/app/api/offers/[id]/shop/preview/route.ts
// Returns raw HTML for the "Sklep internetowy" template — used for in-browser preview (iframe).
// GET /api/offers/:id/shop/preview → returns text/html

import { buildShopHtml } from '@/lib/pdf/shop-html'
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
    let companyData: {
        name: string | null
        website: string | null
        logo: string | null
        logoLight: string | null
        logoDark: string | null
        phone: string | null
        email: string | null
    } | null = null

    if (settingsRes.ok) {
        try {
            const { data: settings } = (await settingsRes.json()) as { data: AnyRecord }
            profileName = settings?.profile?.name ?? null
            profileEmail = settings?.profile?.email ?? ''
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

    const shopOffer = {
        number: String(offerRaw.number ?? ''),
        title: String(offerRaw.title ?? ''),
        totalGross: Number(offerRaw.totalGross ?? 0),
        totalNet: Number(offerRaw.totalNet ?? 0),
        currency: String(offerRaw.currency ?? 'PLN'),
        paymentDays: Number(offerRaw.paymentDays ?? 14),
        createdAt: offerRaw.createdAt ?? new Date().toISOString(),
        blocks: offerRaw.blocks ?? null,
        client: {
            name: offerRaw.client?.name ?? '',
            company: offerRaw.client?.company ?? null,
        },
        user: {
            name: profileName,
            email: profileEmail,
            companyInfo: companyData,
        },
    }

    const html = buildHtmlOrRespond('shop-preview', () => applyPdfPreviewMode(buildShopHtml(shopOffer)))
    if (html instanceof Response) return html

    return htmlResponse(html)
}

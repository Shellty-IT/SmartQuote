// src/app/api/offers/[id]/mobile-app/preview/route.ts
// Returns HTML preview for the "Aplikacja mobilna - zaawansowana" template.
// GET /api/offers/:id/mobile-app/preview → text/html

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { buildMobileAppHtml, type MobileAppOfferData } from '@/lib/pdf/mobile-app-html'
import { mergeMobileAppWithDefaults, buildDefaultMobileAppBlocks } from '@/lib/pdf/mobile-app-blocks'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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
    logoDark?: string | null
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

    const offerData: MobileAppOfferData = {
        offerNumber: offer.number ?? id,
        offerDate: offer.createdAt
            ? new Date(offer.createdAt).toLocaleDateString('pl-PL')
            : undefined,
        clientName: offer.client?.name ?? undefined,
        userLogoUrl: companySettings?.logo ?? undefined,
        userLogoDarkUrl: companySettings?.logoDark ?? undefined,
        userCompanyName: companySettings?.name ?? offer.user?.name ?? undefined,
        userEmail: companySettings?.email ?? offer.user?.email ?? undefined,
        userPhone: companySettings?.phone ?? undefined,
        userWebsite: companySettings?.website ?? undefined,
    }

    const blocks = offer.blocks
        ? mergeMobileAppWithDefaults(offer.blocks)
        : buildDefaultMobileAppBlocks()

    const html = buildMobileAppHtml(blocks, offerData)

    return new Response(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
}

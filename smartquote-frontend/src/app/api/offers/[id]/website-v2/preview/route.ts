// src/app/api/offers/[id]/website-v2/preview/route.ts
// Returns raw HTML for the "Strona internetowa v2" template — for in-browser preview.
// GET /api/offers/:id/website-v2/preview → returns text/html

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { buildWebsiteV2Html } from '@/lib/pdf/website-v2-html'
import { applyPdfPreviewMode } from '@/lib/pdf/print-preview'

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: offerRaw } = (await offerRes.json()) as { data: Record<string, any> }

    let profileName: string | null = null
    let profileEmail = ''
    let profileAvatar: string | null = null
    let companyData: { name: string | null; website: string | null; logo: string | null; logoLight: string | null; logoDark: string | null; phone: string | null; email: string | null } | null = null

    if (settingsRes.ok) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: settings } = (await settingsRes.json()) as { data: Record<string, any> }
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

    let html: string
    try {
        html = applyPdfPreviewMode(buildWebsiteV2Html(offerData))
    } catch (err) {
        const detail = err instanceof Error ? `${err.message}\n${err.stack}` : String(err)
        console.error('[website-v2-preview] buildWebsiteV2Html threw:', detail)
        return new Response(JSON.stringify({ error: 'HTML build failed', ...(process.env.NODE_ENV === 'development' ? { detail } : {}) }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }

    return new Response(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
}

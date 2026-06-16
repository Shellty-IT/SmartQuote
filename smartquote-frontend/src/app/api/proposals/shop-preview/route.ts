// src/app/api/proposals/shop-preview/route.ts
// Returns HTML for the "Sklep internetowy" template from inline POST data.
// Used during the offer creation wizard (before the offer exists in DB).
// POST /api/proposals/shop-preview → returns text/html

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { buildShopHtml, type ShopOfferData } from '@/lib/pdf/shop-html'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface SessionWithToken {
    accessToken?: string
}

export async function POST(req: Request) {
    const session = (await getServerSession(authOptions)) as SessionWithToken | null
    if (!session?.accessToken) {
        return new Response('Unauthorized', { status: 401 })
    }

    let offer: ShopOfferData
    try {
        offer = (await req.json()) as ShopOfferData
    } catch {
        return new Response('Invalid JSON body', { status: 400 })
    }

    const html = buildShopHtml(offer)

    return new Response(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
}

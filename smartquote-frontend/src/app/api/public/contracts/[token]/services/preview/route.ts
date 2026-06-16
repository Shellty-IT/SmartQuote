// src/app/api/public/contracts/[token]/services/preview/route.ts
// Public (no auth) HTML preview for "Sklep internetowy" contract template.
// GET /api/public/contracts/:token/services/preview  →  text/html

import { buildContractServicesHtmlFromSaved } from '@/lib/pdf/contract-services-html'

export const maxDuration = 10
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ token: string }> },
) {
    const { token } = await params

    const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8080').replace(/\/$/, '')

    const contractRes = await fetch(`${backendUrl}/api/public/contracts/${token}`, {
        cache: 'no-store',
    })

    if (!contractRes.ok) {
        const status = contractRes.status === 404 ? 404 : 502
        return new Response(JSON.stringify({ error: 'Contract not found' }), {
            status,
            headers: { 'Content-Type': 'application/json' },
        })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = (await contractRes.json()) as { data: { contract: Record<string, any> } }
    const contract = data.contract

    let html: string
    try {
        html = buildContractServicesHtmlFromSaved(contract.blocks, { editorMode: false })
    } catch (err) {
        const detail = err instanceof Error ? err.message : String(err)
        return new Response(`<pre>Error: ${detail}</pre>`, {
            status: 500,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        })
    }

    return new Response(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
}

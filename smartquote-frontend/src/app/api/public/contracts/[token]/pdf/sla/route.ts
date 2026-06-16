// src/app/api/public/contracts/[token]/pdf/sla/route.ts
// Public (no auth) PDF generation for "Opieka IT" (SLA) contract template.
// GET /api/public/contracts/:token/pdf/sla  →  application/pdf

import { buildContractSlaHtmlFromSaved } from '@/lib/pdf/contract-sla-html'
import { htmlToPdfBuffer } from '@/lib/pdf/puppeteer'

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
        html = buildContractSlaHtmlFromSaved(contract.blocks, { editorMode: false })
    } catch (err) {
        const detail = err instanceof Error ? `${err.message}\n${err.stack}` : String(err)
        console.error('[public-contract-sla-pdf] buildContractSlaHtmlFromSaved threw:', detail)
        return new Response(
            JSON.stringify({ error: 'HTML build failed', detail }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
        )
    }

    let buffer: Buffer
    try {
        buffer = await htmlToPdfBuffer(html)
    } catch (err) {
        const detail = err instanceof Error ? `${err.message}\n${err.stack}` : String(err)
        console.error('[public-contract-sla-pdf] Puppeteer error:', detail)
        return new Response(
            JSON.stringify({ error: 'PDF generation failed', detail }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
        )
    }

    const number = String(contract.number ?? token)
    const filename = `Umowa_${number.replace(/\//g, '-')}_opieka_it.pdf`
    return new Response(new Uint8Array(buffer), {
        status: 200,
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': String(buffer.length),
        },
    })
}

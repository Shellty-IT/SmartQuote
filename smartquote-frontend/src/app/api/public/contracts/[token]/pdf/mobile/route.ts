// src/app/api/public/contracts/[token]/pdf/mobile/route.ts
// Public (no auth) PDF generation for "Aplikacja mobilna" contract template.
// GET /api/public/contracts/:token/pdf/mobile  →  application/pdf

import { buildContractMobileHtmlFromSaved } from '@/lib/pdf/contract-mobile-html'
import { addDocumentActionLinks, publicDocumentUrl } from '@/lib/pdf/document-action-links'
import { htmlToPdfBuffer } from '@/lib/pdf/puppeteer'

export const maxDuration = 60
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
        html = addDocumentActionLinks(buildContractMobileHtmlFromSaved(contract.blocks, { editorMode: false }), publicDocumentUrl('contract', token, 'sign'), 'sign')
    } catch (err) {
        const detail = err instanceof Error ? `${err.message}\n${err.stack}` : String(err)
        console.error('[public-contract-mobile-pdf] buildContractMobileHtmlFromSaved threw:', detail)
        return new Response(
            JSON.stringify({ error: 'HTML build failed', ...(process.env.NODE_ENV === 'development' ? { detail } : {}) }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
        )
    }

    let buffer: Buffer
    try {
        buffer = await htmlToPdfBuffer(html)
    } catch (err) {
        const detail = err instanceof Error ? `${err.message}\n${err.stack}` : String(err)
        console.error('[public-contract-mobile-pdf] Puppeteer error:', detail)
        return new Response(
            JSON.stringify({ error: 'PDF generation failed', ...(process.env.NODE_ENV === 'development' ? { detail } : {}) }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
        )
    }

    const number = String(contract.number ?? token)
    const filename = `Umowa_${number.replace(/\//g, '-')}_aplikacja_mobilna.pdf`
    return new Response(new Uint8Array(buffer), {
        status: 200,
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': String(buffer.length),
        },
    })
}

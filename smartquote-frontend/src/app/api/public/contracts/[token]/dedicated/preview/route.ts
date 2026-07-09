// src/app/api/public/contracts/[token]/dedicated/preview/route.ts
// Public (no auth) HTML preview for "System dedykowany" contract template.
// GET /api/public/contracts/:token/dedicated/preview  →  text/html

import { buildContractDedicatedHtmlFromSaved } from '@/lib/pdf/contract-dedicated-html'
import { addDocumentActionLinks } from '@/lib/pdf/document-action-links'
import { applyPdfPreviewMode } from '@/lib/pdf/print-preview'

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
        html = applyPdfPreviewMode(addDocumentActionLinks(buildContractDedicatedHtmlFromSaved(contract.blocks, { editorMode: false }), `/contract/view/${token}#sign`, 'sign'))
    } catch (err) {
        const detail = err instanceof Error ? err.message : String(err)
        console.error('[public-preview] HTML build failed:', detail)
        const body = process.env.NODE_ENV === 'development' ? `<pre>Error: ${detail}</pre>` : '<pre>Wystąpił błąd podczas generowania podglądu</pre>'
        return new Response(body, {
            status: 500,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        })
    }

    return new Response(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
}

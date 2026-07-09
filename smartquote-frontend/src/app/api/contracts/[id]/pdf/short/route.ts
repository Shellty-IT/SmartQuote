// src/app/api/contracts/[id]/pdf/short/route.ts
// Generates a PDF for the "Umowa — Krótka" contract template using Puppeteer.
// GET /api/contracts/:id/pdf/short  →  application/pdf

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { buildContractShortHtmlFromSaved } from '@/lib/pdf/contract-short-html'
import { addDocumentActionLinks, publicDocumentUrl } from '@/lib/pdf/document-action-links'
import { htmlToPdfBuffer } from '@/lib/pdf/puppeteer'
import { documentTemplateMismatch } from '@/lib/pdf/template-guard'

// PDF routes can exceed the default serverless budget on cold Chromium starts.
export const maxDuration = 60
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface SessionWithToken {
    accessToken?: string
}

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params

    // 1. Auth
    const session = (await getServerSession(authOptions)) as SessionWithToken | null
    if (!session?.accessToken) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        })
    }

    const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8080').replace(/\/$/, '')
    const authHeader = { Authorization: `Bearer ${session.accessToken}` }

    // 2. Fetch contract
    const contractRes = await fetch(`${backendUrl}/api/contracts/${id}`, {
        headers: authHeader,
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
    const { data: contract } = (await contractRes.json()) as { data: Record<string, any> }
    const mismatch = documentTemplateMismatch(contract, 'short')
    if (mismatch) return mismatch

    // 3. Build HTML from saved blocks
    let html: string
    try {
        html = addDocumentActionLinks(buildContractShortHtmlFromSaved(contract.blocks, { editorMode: false }), publicDocumentUrl('contract', contract.publicToken, 'sign'), 'sign')
    } catch (err) {
        const detail = err instanceof Error ? `${err.message}\n${err.stack}` : String(err)
        console.error('[contract-short-pdf] buildContractShortHtmlFromSaved threw:', detail)
        return new Response(
            JSON.stringify({ error: 'HTML build failed', ...(process.env.NODE_ENV === 'development' ? { detail } : {}) }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
        )
    }

    // 4. Render PDF via Puppeteer
    let buffer: Buffer
    try {
        buffer = await htmlToPdfBuffer(html)
    } catch (err) {
        const detail = err instanceof Error ? `${err.message}\n${err.stack}` : String(err)
        console.error('[contract-short-pdf] Puppeteer error:', detail)
        return new Response(
            JSON.stringify({ error: 'PDF generation failed', ...(process.env.NODE_ENV === 'development' ? { detail } : {}) }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
        )
    }

    // 5. Return PDF
    const number = String(contract.number ?? id)
    const filename = `Umowa_${number.replace(/\//g, '-')}_krotka.pdf`
    return new Response(new Uint8Array(buffer), {
        status: 200,
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': String(buffer.length),
        },
    })
}

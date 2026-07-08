// src/app/api/contracts/[id]/services/preview/route.ts
// Returns raw HTML for the "Sklep internetowy" template — used for in-browser preview (iframe).
// GET /api/contracts/:id/services/preview  →  text/html

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { buildContractServicesHtmlFromSaved } from '@/lib/pdf/contract-services-html'
import { applyPdfPreviewMode } from '@/lib/pdf/print-preview'

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

    const session = (await getServerSession(authOptions)) as SessionWithToken | null
    if (!session?.accessToken) {
        return new Response('Unauthorized', { status: 401 })
    }

    const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8080').replace(/\/$/, '')
    const contractRes = await fetch(`${backendUrl}/api/contracts/${id}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
        cache: 'no-store',
    })

    if (!contractRes.ok) {
        return new Response('Contract not found', {
            status: contractRes.status === 404 ? 404 : 502,
        })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: contract } = (await contractRes.json()) as { data: Record<string, any> }
    const html = applyPdfPreviewMode(buildContractServicesHtmlFromSaved(contract.blocks, { editorMode: false }))

    return new Response(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
}

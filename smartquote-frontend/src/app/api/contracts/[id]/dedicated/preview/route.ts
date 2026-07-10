// src/app/api/contracts/[id]/dedicated/preview/route.ts
// Returns raw HTML for the "System dedykowany" template — used for in-browser preview (iframe).
// GET /api/contracts/:id/dedicated/preview  →  text/html

import { buildContractDedicatedHtmlFromSaved } from '@/lib/pdf/contract-dedicated-html'
import { applyPdfPreviewMode } from '@/lib/pdf/print-preview'
import {
    getBackendUrl,
    requireAccessToken,
    fetchJsonOrRespond,
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

    const contract = await fetchJsonOrRespond<AnyRecord>(
        `${getBackendUrl()}/api/contracts/${id}`,
        { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store' },
        'Contract not found',
    )
    if (contract instanceof Response) return contract

    const html = buildHtmlOrRespond('contract-dedicated-preview', () =>
        applyPdfPreviewMode(buildContractDedicatedHtmlFromSaved(contract.blocks, { editorMode: false })),
    )
    if (html instanceof Response) return html

    return htmlResponse(html)
}

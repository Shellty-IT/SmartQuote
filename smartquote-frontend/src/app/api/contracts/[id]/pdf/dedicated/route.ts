// src/app/api/contracts/[id]/pdf/dedicated/route.ts
// Generates a PDF for the "System dedykowany" contract template using Puppeteer.
// GET /api/contracts/:id/pdf/dedicated  →  application/pdf

import { buildContractDedicatedHtmlFromSaved } from '@/lib/pdf/contract-dedicated-html'
import { addDocumentActionLinks, publicDocumentUrl } from '@/lib/pdf/document-action-links'
import { documentTemplateMismatch } from '@/lib/pdf/template-guard'
import {
    getBackendUrl,
    requireAccessToken,
    fetchJsonOrRespond,
    buildHtmlOrRespond,
    renderPdfOrRespond,
    pdfResponse,
} from '@/lib/pdf/route-helpers'

export const maxDuration = 60
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

    const mismatch = documentTemplateMismatch(contract, 'dedicated')
    if (mismatch) return mismatch

    const html = buildHtmlOrRespond('contract-dedicated-pdf', () =>
        addDocumentActionLinks(buildContractDedicatedHtmlFromSaved(contract.blocks, { editorMode: false }), publicDocumentUrl('contract', contract.publicToken, 'sign'), 'sign'),
    )
    if (html instanceof Response) return html

    const buffer = await renderPdfOrRespond('contract-dedicated-pdf', html)
    if (buffer instanceof Response) return buffer

    const number = String(contract.number ?? id)
    return pdfResponse(buffer, `Umowa_${number.replace(/\//g, '-')}_system_dedykowany.pdf`)
}

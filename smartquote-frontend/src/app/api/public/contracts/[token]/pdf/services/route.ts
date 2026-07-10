// src/app/api/public/contracts/[token]/pdf/services/route.ts
// Public (no auth) PDF generation for "Sklep internetowy" contract template.
// GET /api/public/contracts/:token/pdf/services  →  application/pdf

import { buildContractServicesHtmlFromSaved } from '@/lib/pdf/contract-services-html'
import { addDocumentActionLinks, publicDocumentUrl } from '@/lib/pdf/document-action-links'
import {
    getBackendUrl,
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
    { params }: { params: Promise<{ token: string }> },
) {
    const { token } = await params

    const data = await fetchJsonOrRespond<{ contract: AnyRecord }>(
        `${getBackendUrl()}/api/public/contracts/${token}`,
        { cache: 'no-store' },
        'Contract not found',
    )
    if (data instanceof Response) return data
    const contract = data.contract

    const html = buildHtmlOrRespond('public-contract-services-pdf', () =>
        addDocumentActionLinks(buildContractServicesHtmlFromSaved(contract.blocks, { editorMode: false }), publicDocumentUrl('contract', token, 'sign'), 'sign'),
    )
    if (html instanceof Response) return html

    const buffer = await renderPdfOrRespond('public-contract-services-pdf', html)
    if (buffer instanceof Response) return buffer

    const number = String(contract.number ?? token)
    return pdfResponse(buffer, `Umowa_${number.replace(/\//g, '-')}_sklep.pdf`)
}

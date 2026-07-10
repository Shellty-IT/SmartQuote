// src/app/api/public/contracts/[token]/services/preview/route.ts
// Public (no auth) HTML preview for "Sklep internetowy" contract template.
// GET /api/public/contracts/:token/services/preview  →  text/html

import { buildContractServicesHtmlFromSaved } from '@/lib/pdf/contract-services-html'
import { addDocumentActionLinks } from '@/lib/pdf/document-action-links'
import { applyPdfPreviewMode } from '@/lib/pdf/print-preview'
import {
    getBackendUrl,
    fetchJsonOrRespond,
    buildHtmlPreviewOrRespond,
    htmlResponse,
} from '@/lib/pdf/route-helpers'

export const maxDuration = 10
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

    const html = buildHtmlPreviewOrRespond('public-contract-services-preview', () =>
        applyPdfPreviewMode(addDocumentActionLinks(buildContractServicesHtmlFromSaved(contract.blocks, { editorMode: false }), `/contract/view/${token}#sign`, 'sign')),
    )
    if (html instanceof Response) return html

    return htmlResponse(html)
}

// src/app/api/contracts/preview/route.ts
// Inline preview for the "Umowa — Krótka" template — no contract ID required.
// POST /api/contracts/preview
// Body: { blocks: ContractShortBlocks }
// Returns: text/html

import { buildContractShortHtml } from '@/lib/pdf/contract-short-html'
import { applyPdfPreviewMode } from '@/lib/pdf/print-preview'
import type { ContractShortBlocks } from '@/lib/pdf/contract-short-blocks'
import { requireAccessToken } from '@/lib/pdf/route-helpers'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
    const accessToken = await requireAccessToken()
    if (accessToken instanceof Response) return accessToken

    let blocks: Partial<ContractShortBlocks> | null = null
    try {
        const body = await req.json()
        blocks = body?.blocks ?? null
    } catch {
        // invalid JSON — fall back to defaults
    }

    const html = applyPdfPreviewMode(buildContractShortHtml(blocks))
    return new Response(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
}

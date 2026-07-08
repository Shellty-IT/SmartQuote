import { buildPublicOfferHtml } from '@/lib/pdf/public-offer-html'
import { addDocumentActionLinks } from '@/lib/pdf/document-action-links'
import { applyPdfPreviewMode } from '@/lib/pdf/print-preview'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
    const { token } = await params
    const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8080').replace(/\/$/, '')
    const response = await fetch(`${backendUrl}/api/public/offers/${token}`, { cache: 'no-store' })
    if (!response.ok) return new Response('Offer not found', { status: response.status === 404 ? 404 : 502 })

    const payload = await response.json()
    const offer = payload.data?.offer
    if (!offer) return new Response('Offer not found', { status: 404 })

    const html = buildPublicOfferHtml(offer)
    if (!html) return new Response('Template not available', { status: 404 })

    const linkedHtml = applyPdfPreviewMode(addDocumentActionLinks(html, `/offer/view/${token}#accept`, 'accept'))
    return new Response(linkedHtml, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

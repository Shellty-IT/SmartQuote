import { contractsApi, offersApi } from '@/lib/api'

export type OfferDocumentTemplate =
    | 'classic' | 'proposal' | 'shop' | 'website_v2' | 'website_v3'
    | 'support' | 'mobile_app' | 'mobile_simple' | 'universal'
export type ContractDocumentTemplate = 'classic' | 'short' | 'services' | 'dedicated' | 'sla' | 'mobile'
export type DocumentPreview = { frameType: 'html'; url: string } | { frameType: 'pdf'; blob: Blob }

const offerRoutes: Record<Exclude<OfferDocumentTemplate, 'classic'>, string> = {
    proposal: 'proposal', shop: 'shop', website_v2: 'website-v2', website_v3: 'website-v3',
    support: 'support', mobile_app: 'mobile-app', mobile_simple: 'mobile-simple', universal: 'universal',
}
const contractRoutes: Record<Exclude<ContractDocumentTemplate, 'classic'>, string> = {
    short: 'short', services: 'services', dedicated: 'dedicated', sla: 'sla', mobile: 'mobile',
}

export function normalizeOfferTemplate(value: string | null | undefined): OfferDocumentTemplate {
    if (value === 'classic') return 'classic'
    return value && value in offerRoutes ? value as OfferDocumentTemplate : 'classic'
}

export function getOfferEditPath(id: string, template: string | null | undefined): string {
    return normalizeOfferTemplate(template) === 'classic'
        ? `/dashboard/offers/${id}/edit`
        : `/dashboard/offers/${id}?tab=template`
}

export function getContractEditPath(id: string, template: ContractDocumentTemplate): string {
    return template === 'classic'
        ? `/dashboard/contracts/${id}/edit`
        : `/dashboard/contracts/${id}?tab=template`
}

export async function downloadOfferDocument(id: string, template: string | null | undefined): Promise<Blob> {
    const type = normalizeOfferTemplate(template)
    if (type === 'classic') return offersApi.downloadPdf(id)
    const response = await fetch(`/api/offers/${id}/pdf/${offerRoutes[type]}`)
    if (!response.ok) throw new Error(`PDF generation failed: ${response.status}`)
    return response.blob()
}

export async function previewOfferDocument(id: string, template: string | null | undefined): Promise<DocumentPreview> {
    return { frameType: 'pdf', blob: await downloadOfferDocument(id, template) }
}

export async function downloadContractDocument(id: string, template: ContractDocumentTemplate): Promise<Blob> {
    if (template === 'classic') return contractsApi.downloadPdf(id)
    const response = await fetch(`/api/contracts/${id}/pdf/${contractRoutes[template]}`)
    if (!response.ok) throw new Error(`PDF generation failed: ${response.status}`)
    return response.blob()
}

export async function previewContractDocument(id: string, template: ContractDocumentTemplate): Promise<DocumentPreview> {
    return { frameType: 'pdf', blob: await downloadContractDocument(id, template) }
}

export function getContractHtmlPreviewUrl(id: string, template: Exclude<ContractDocumentTemplate, 'classic'>): string {
    return `/api/contracts/${id}/${contractRoutes[template]}/preview`
}

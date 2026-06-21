import { afterEach, describe, expect, it, vi } from 'vitest'
import {
    downloadContractDocument,
    downloadOfferDocument,
    getContractEditPath,
    getOfferEditPath,
    previewContractDocument,
    previewOfferDocument,
} from '@/lib/document-pdf'

afterEach(() => vi.unstubAllGlobals())

describe('document PDF routing', () => {
    it.each([
        ['classic', '/dashboard/offers/offer-1/edit'],
        ['proposal', '/dashboard/offers/offer-1?tab=template'],
        ['shop', '/dashboard/offers/offer-1?tab=template'],
        ['website_v2', '/dashboard/offers/offer-1?tab=template'],
        ['website_v3', '/dashboard/offers/offer-1?tab=template'],
        ['support', '/dashboard/offers/offer-1?tab=template'],
        ['mobile_app', '/dashboard/offers/offer-1?tab=template'],
        ['mobile_simple', '/dashboard/offers/offer-1?tab=template'],
        ['universal', '/dashboard/offers/offer-1?tab=template'],
    ])('routes %s offers to the matching editor', (template, expected) => {
        expect(getOfferEditPath('offer-1', template)).toBe(expected)
    })

    it.each([
        ['classic', '/dashboard/contracts/contract-1/edit'],
        ['short', '/dashboard/contracts/contract-1?tab=template'],
        ['services', '/dashboard/contracts/contract-1?tab=template'],
        ['dedicated', '/dashboard/contracts/contract-1?tab=template'],
        ['sla', '/dashboard/contracts/contract-1?tab=template'],
        ['mobile', '/dashboard/contracts/contract-1?tab=template'],
    ] as const)('routes %s contracts to the matching editor', (template, expected) => {
        expect(getContractEditPath('contract-1', template)).toBe(expected)
    })

    it.each([
        ['proposal', 'proposal'], ['shop', 'shop'], ['website_v2', 'website-v2'],
        ['website_v3', 'website-v3'], ['support', 'support'], ['mobile_app', 'mobile-app'],
        ['mobile_simple', 'mobile-simple'], ['universal', 'universal'],
    ])('routes %s offer downloads to its template endpoint', async (template, slug) => {
        const fetchMock = vi.fn().mockResolvedValue({ ok: true, blob: () => Promise.resolve(new Blob()) })
        vi.stubGlobal('fetch', fetchMock)
        await downloadOfferDocument('offer-1', template)
        expect(fetchMock).toHaveBeenCalledWith(`/api/offers/offer-1/pdf/${slug}`)
    })

    it.each([
        ['proposal', 'proposal'], ['shop', 'shop'], ['website_v2', 'website-v2'],
        ['website_v3', 'website-v3'], ['support', 'support'], ['mobile_app', 'mobile-app'],
        ['mobile_simple', 'mobile-simple'], ['universal', 'universal'],
    ])('previews %s offers using the matching generated PDF', async (template, slug) => {
        const pdf = new Blob(['pdf'])
        const fetchMock = vi.fn().mockResolvedValue({ ok: true, blob: () => Promise.resolve(pdf) })
        vi.stubGlobal('fetch', fetchMock)
        await expect(previewOfferDocument('offer-1', template)).resolves.toEqual({ frameType: 'pdf', blob: pdf })
        expect(fetchMock).toHaveBeenCalledWith(`/api/offers/offer-1/pdf/${slug}`)
    })

    it.each([
        ['short', 'short'], ['services', 'services'], ['dedicated', 'dedicated'],
        ['sla', 'sla'], ['mobile', 'mobile'],
    ] as const)('routes %s contract downloads and previews to their template endpoints', async (template, slug) => {
        const fetchMock = vi.fn().mockResolvedValue({ ok: true, blob: () => Promise.resolve(new Blob()) })
        vi.stubGlobal('fetch', fetchMock)
        await downloadContractDocument('contract-1', template)
        expect(fetchMock).toHaveBeenCalledWith(`/api/contracts/contract-1/pdf/${slug}`)
        await expect(previewContractDocument('contract-1', template)).resolves.toEqual({
            frameType: 'pdf', blob: expect.any(Blob),
        })
        expect(fetchMock).toHaveBeenLastCalledWith(`/api/contracts/contract-1/pdf/${slug}`)
    })
})

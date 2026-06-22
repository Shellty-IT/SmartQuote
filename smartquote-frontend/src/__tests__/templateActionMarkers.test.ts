import { describe, expect, it } from 'vitest'
import { buildShopHtml } from '@/lib/pdf/shop-html'
import { buildWebsiteV2Html } from '@/lib/pdf/website-v2-html'
import { buildWebsiteV3Html } from '@/lib/pdf/website-v3-html'
import { buildSupportHtml } from '@/lib/pdf/support-html'
import { buildMobileAppHtml } from '@/lib/pdf/mobile-app-html'
import { buildDefaultSupportBlocks } from '@/lib/pdf/support-blocks'
import { buildDefaultMobileAppBlocks } from '@/lib/pdf/mobile-app-blocks'

const fullOffer = {
    number: 'OF/2026/1',
    title: 'Oferta testowa',
    totalGross: 1230,
    currency: 'PLN',
    paymentDays: 14,
    createdAt: '2026-06-18T12:00:00.000Z',
    client: { name: 'Klient Testowy', company: 'Test Sp. z o.o.' },
    user: {
        name: 'Jan Sprzedawca',
        email: 'jan@example.com',
        companyInfo: {
            name: 'SmartQuote', website: 'https://example.com', logo: null,
            phone: '+48123456789', email: 'jan@example.com',
        },
    },
}

describe('offer template acceptance markers', () => {
    it.each([
        ['shop', () => buildShopHtml(fullOffer)],
        ['website v2', () => buildWebsiteV2Html(fullOffer)],
        ['website v3', () => buildWebsiteV3Html(fullOffer)],
        ['support', () => buildSupportHtml(buildDefaultSupportBlocks(), { offerNumber: fullOffer.number })],
        ['mobile app', () => buildMobileAppHtml(buildDefaultMobileAppBlocks(), { offerNumber: fullOffer.number })],
    ])('%s template marks its acceptance CTA explicitly', (_name, build) => {
        expect(build()).toContain('data-sq-action="accept"')
    })

    it('does not mark support package selection buttons as acceptance', () => {
        const html = buildSupportHtml(buildDefaultSupportBlocks(), { offerNumber: fullOffer.number })
        expect(html).not.toMatch(/data-sq-action="accept"[^>]*>Wybierz (?:Basic|Standard)/)
    })
})

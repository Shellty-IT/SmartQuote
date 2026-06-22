import { afterEach, describe, expect, it } from 'vitest'
import { addDocumentActionLinks, isDocumentActionLabel, publicDocumentUrl } from '@/lib/pdf/document-action-links'

describe('document action links', () => {
    const oldFrontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL

    afterEach(() => {
        process.env.NEXT_PUBLIC_FRONTEND_URL = oldFrontendUrl
    })

    it('injects an acceptance link script before the closing body tag', () => {
        const html = addDocumentActionLinks(
            '<html><body><span class="cta-btn">Zaakceptuj ofertę</span></body></html>',
            'https://example.com/offer/view/token#accept',
            'accept',
        )

        expect(html).toContain('https://example.com/offer/view/token#accept')
        expect(html.indexOf('<script>')).toBeLessThan(html.indexOf('</body>'))
        expect(html).toContain("el.setAttribute('href',url)")
        expect(html).toContain('[data-sq-action=')
    })

    it.each([
        'Zaakceptuj ofertę',
        'AKCEPTUJĘ OFERTĘ',
        'Akceptuję warunki i zaczynamy',
    ])('recognises acceptance CTA: %s', (label) => {
        expect(isDocumentActionLabel(label, 'accept')).toBe(true)
    })

    it.each([
        'Wybierz Basic',
        'Wybieram Premium',
        'Zapytaj o wycenę',
        'Porozmawiajmy',
    ])('does not mistake a selection/contact CTA for acceptance: %s', (label) => {
        expect(isDocumentActionLabel(label, 'accept')).toBe(false)
    })

    it.each(['Podpisz umowę', 'PODPISZ UMOWĘ ONLINE'])('recognises signing CTA: %s', (label) => {
        expect(isDocumentActionLabel(label, 'sign')).toBe(true)
    })

    it('does not modify documents without a public URL', () => {
        const html = '<html><body>Oferta</body></html>'
        expect(addDocumentActionLinks(html, null, 'accept')).toBe(html)
    })

    it('builds an absolute public contract URL for PDF annotations', () => {
        process.env.NEXT_PUBLIC_FRONTEND_URL = 'https://smartquote.example/'
        expect(publicDocumentUrl('contract', 'abc 123', 'sign'))
            .toBe('https://smartquote.example/contract/view/abc%20123#sign')
    })
})

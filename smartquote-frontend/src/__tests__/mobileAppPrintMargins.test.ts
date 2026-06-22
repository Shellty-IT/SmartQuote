import { describe, expect, it } from 'vitest'
import { buildDefaultMobileAppBlocks } from '@/lib/pdf/mobile-app-blocks'
import { buildMobileAppHtml } from '@/lib/pdf/mobile-app-html'

describe('mobile app PDF page margins', () => {
    it('keeps continuation pages away from the top and bottom edges', () => {
        const html = buildMobileAppHtml(buildDefaultMobileAppBlocks(), {})

        expect(html).toContain('@page{size:A4;margin:10mm 0;}')
    })

    it('renders the cover and footer on full-bleed pages', () => {
        const html = buildMobileAppHtml(buildDefaultMobileAppBlocks(), {})

        expect(html).toContain('@page sq-full-bleed{size:A4;margin:0;}')
        expect(html).toContain('class="sq-full-bleed-page sq-cover"')
        expect(html).toContain('class="pb sq-full-bleed-page sq-footer"')
        expect(html).toContain('.sq-footer{break-before:page;page-break-before:always;break-inside:avoid-page !important;page-break-inside:avoid !important;}')
    })
})

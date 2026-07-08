import { describe, expect, it } from 'vitest'
import { applyPdfPreviewMode, applyPrintPagination } from '@/lib/pdf/print-preview'

describe('PDF print pagination', () => {
    it('injects adaptive pagination rules before the document head closes', () => {
        const html = applyPrintPagination('<html><head></head><body><section>Tresc</section></body></html>')

        expect(html).toContain('data-smartquote-print-pagination')
        expect(html).toContain('section, article, .section, .sec, .pdf-splittable')
        expect(html).toContain('.sq-keep-together')
        expect(html).toContain('break-inside: avoid-page !important')
        expect(html).toContain('overflow-wrap: anywhere')
        expect(html).toContain('.sq-manual-page-break')
        expect(html).toContain('page-break-before: always')
        expect(html).toContain('data-smartquote-print-pagination-script')
        expect(html.indexOf('data-smartquote-print-pagination')).toBeLessThan(html.indexOf('</head>'))
    })

    it('exposes the semantic pagination hooks templates opt into', () => {
        const html = applyPrintPagination('<html><head></head><body></body></html>')

        // splittable + heading-glue + table + signatures hooks
        expect(html).toContain('.pdf-splittable')
        expect(html).toContain('.pdf-heading-group')
        expect(html).toContain('.pdf-table tr')
        expect(html).toContain('.pdf-table thead')
        expect(html).toContain('.pdf-signatures')
    })

    it('provides the full-bleed named page for edge-to-edge covers/footers', () => {
        const html = applyPrintPagination('<html><head></head><body></body></html>')

        expect(html).toContain('@page sq-full-bleed { size: A4; margin: 0; }')
        expect(html).toContain('.pdf-full-bleed { page: sq-full-bleed; }')
    })

    it('measures keep-together blocks against an overridable page budget', () => {
        const html = applyPrintPagination('<html><head></head><body></body></html>')

        // adaptive threshold (not a hardcoded magic number in the toggle call)
        expect(html).toContain('--pdf-page-content-px')
        expect(html).toContain('DEFAULT_CONTENT_PX = 1040')
        // signature blocks are measured so oversized ones degrade by splitting
        expect(html).toContain('.pdf-signatures,.sig-wrap,.sig-row,.sig-cols')
    })

    it('does not inject the rules more than once', () => {
        const once = applyPrintPagination('<html><head></head><body></body></html>')
        const twice = applyPrintPagination(once)

        expect(twice.match(/<style data-smartquote-print-pagination>/g)).toHaveLength(1)
        expect(twice.match(/<script data-smartquote-print-pagination-script>/g)).toHaveLength(1)
    })

    it('adds PDF preview mode before pagination measurements run', () => {
        const html = applyPdfPreviewMode('<html><head></head><body><main>Preview</main></body></html>')

        expect(html).toContain('data-smartquote-pdf-preview-script')
        expect(html).toContain('sq-print-css-screen-clone')
        expect(html).toContain('sq-pdf-preview-screen-frame')
        expect(html).toContain('sq-page-break-marker-layer')
        expect(html).toContain('Koniec strony ')
        expect(html).toContain('layoutManualPageBreaks')
        expect(html).toContain('width:794px!important')
        expect(html.indexOf('data-smartquote-pdf-preview-script')).toBeLessThan(html.indexOf('data-smartquote-print-pagination-script'))
    })

    it('paginates the preview on the template @page geometry, not a hardcoded height', () => {
        const html = applyPdfPreviewMode('<html><head></head><body></body></html>')

        // reads @page margins so the per-page content budget matches the PDF
        expect(html).toContain('CSSRule.PAGE_RULE')
        expect(html).toContain('A4_HEIGHT_PX = 297 * 96 / 25.4')
        expect(html).toContain('sq-pdf-preview-page-margins')
        // spacer heights must be important — the print-rule clone carries
        // "height:0 !important" onto the screen and would zero them out
        expect(html).toContain("setProperty('height', spacer + 'px', 'important')")
        // late image/font reflows realign the manual breaks
        expect(html).toContain('ResizeObserver')
        expect(html).toContain('document.fonts.ready')
    })

    it('does not inject PDF preview mode more than once', () => {
        const once = applyPdfPreviewMode('<html><head></head><body></body></html>')
        const twice = applyPdfPreviewMode(once)

        expect(twice.match(/data-smartquote-pdf-preview-script/g)).toHaveLength(1)
        expect(twice.match(/<style data-smartquote-print-pagination>/g)).toHaveLength(1)
    })
})

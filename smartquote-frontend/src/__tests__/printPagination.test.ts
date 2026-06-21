import { describe, expect, it } from 'vitest'
import { applyPrintPagination } from '@/lib/pdf/puppeteer'

describe('PDF print pagination', () => {
    it('injects adaptive pagination rules before the document head closes', () => {
        const html = applyPrintPagination('<html><head></head><body><section>Tresc</section></body></html>')

        expect(html).toContain('data-smartquote-print-pagination')
        expect(html).toContain('section, article, .section, .sec { break-inside: auto !important;')
        expect(html).toContain('.sq-keep-together')
        expect(html).toContain('break-inside: avoid-page !important')
        expect(html).toContain('overflow-wrap: anywhere')
        expect(html).toContain('data-smartquote-print-pagination-script')
        expect(html.indexOf('data-smartquote-print-pagination')).toBeLessThan(html.indexOf('</head>'))
    })

    it('does not inject the rules more than once', () => {
        const once = applyPrintPagination('<html><head></head><body></body></html>')
        const twice = applyPrintPagination(once)

        expect(twice.match(/<style data-smartquote-print-pagination>/g)).toHaveLength(1)
        expect(twice.match(/<script data-smartquote-print-pagination-script>/g)).toHaveLength(1)
    })
})

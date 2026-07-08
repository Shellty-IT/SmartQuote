import { describe, expect, it } from 'vitest'
import { buildProposalHtml, type ProposalOfferData } from '@/lib/pdf/proposal-html'
import type { ProposalBlocks } from '@/lib/pdf/proposal-blocks'

function offer(blocks: Partial<ProposalBlocks>): ProposalOfferData {
    return {
        number: 'OFF/2026/001',
        title: 'Test',
        totalGross: 1000,
        currency: 'PLN',
        paymentDays: 14,
        createdAt: '2026-06-15',
        client: { name: 'Klient' },
        user: { name: 'Sprzedawca', email: 's@example.com', companyInfo: null },
        blocks: blocks as unknown,
    }
}

describe('section layout controls', () => {
    it('does not render hidden proposal sections in editor preview', () => {
        const html = buildProposalHtml(
            offer({
                page1Sections: ['demo'],
                page2Sections: [],
                demo: { enabled: false } as ProposalBlocks['demo'],
            }),
            { editorMode: true },
        )

        expect(html).not.toContain('data-block="demo"')
        expect(html).not.toContain('<div class="demo-block">')
    })

    it('inserts manual page break markers after selected proposal sections', () => {
        const html = buildProposalHtml(
            offer({
                page1Sections: ['intro', 'scope'],
                page2Sections: [],
                pageBreakAfter: ['intro'],
            }),
        )

        expect(html).toContain('sq-manual-page-break')
        const markerIndex = html.indexOf('<div class="sq-manual-page-break" aria-hidden="true"></div>')
        expect(markerIndex).toBeGreaterThan(0)
        expect(html.indexOf('scope-grid', markerIndex)).toBeGreaterThan(markerIndex)
    })
})

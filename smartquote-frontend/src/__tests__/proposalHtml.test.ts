import { describe, it, expect } from 'vitest'
import {
    safeUrl,
    sanitizeInlineHtml,
    buildProposalHtml,
    type ProposalOfferData,
} from '@/lib/pdf/proposal-html'
import type { ProposalBlocks, SectionKey } from '@/lib/pdf/proposal-blocks'

// Unique inline style emitted only by buildPageBody when it pairs testing+technology.
const GRID_WRAPPER = 'grid-template-columns:1fr 1fr;gap:6mm'

function makeOffer(blocks: Partial<ProposalBlocks>): ProposalOfferData {
    return {
        number: 'OFF/2026/001',
        title: 'Test',
        totalGross: 1000,
        currency: 'PLN',
        paymentDays: 14,
        createdAt: '2026-06-15',
        client: { name: 'Klient' },
        user: { name: 'Sprzedawca', email: 's@e.com', companyInfo: null },
        blocks: blocks as unknown,
    }
}

// ── safeUrl ───────────────────────────────────────────────────────────────────

describe('safeUrl', () => {
    it('keeps https URLs (escaped)', () => {
        expect(safeUrl('https://example.com/x')).toBe('https://example.com/x')
    })

    it('keeps protocol-relative URLs', () => {
        expect(safeUrl('//cdn.example.com/a.js')).toBe('//cdn.example.com/a.js')
    })

    it('keeps root-relative URLs but rejects protocol-relative-looking ones via // branch', () => {
        expect(safeUrl('/path/to/page')).toBe('/path/to/page')
    })

    it('blocks javascript: scheme', () => {
        expect(safeUrl('javascript:alert(1)')).toBe('')
    })

    it('blocks data: scheme', () => {
        expect(safeUrl('data:text/html,<script>alert(1)</script>')).toBe('')
    })

    it('blocks vbscript: and unknown schemes', () => {
        expect(safeUrl('vbscript:msgbox(1)')).toBe('')
        expect(safeUrl('mailto:a@b.com')).toBe('')
    })

    it('returns empty for null/undefined/empty', () => {
        expect(safeUrl(null)).toBe('')
        expect(safeUrl(undefined)).toBe('')
        expect(safeUrl('')).toBe('')
    })

    it('HTML-escapes a kept URL to prevent attribute breakout', () => {
        expect(safeUrl('https://x.com/"><img src=x>')).toBe(
            'https://x.com/&quot;&gt;&lt;img src=x&gt;',
        )
    })
})

// ── sanitizeInlineHtml ──────────────────────────────────────────────────────────

describe('sanitizeInlineHtml', () => {
    it('strips script tag, keeps inner text', () => {
        expect(sanitizeInlineHtml('Cena<script>alert(1)</script>OK')).toBe('Cenaalert(1)OK')
    })

    it('removes img with onerror entirely', () => {
        expect(sanitizeInlineHtml('A<img src=x onerror=alert(1)>B')).toBe('AB')
    })

    it('strips event handler attributes from whitelisted tags', () => {
        expect(sanitizeInlineHtml('<b onclick="x()">bold</b>')).toBe('<b>bold</b>')
    })

    it('keeps attribute-less formatting tags', () => {
        expect(sanitizeInlineHtml('<strong>Tytuł</strong> i <em>kursywa</em><br>')).toBe(
            '<strong>Tytuł</strong> i <em>kursywa</em><br>',
        )
    })

    it('removes anchor (open + close) with javascript: href, keeps text', () => {
        // <a> is not whitelisted, so both <a ...> and </a> are stripped.
        expect(sanitizeInlineHtml('<a href="javascript:alert(1)">klik</a>')).toBe('klik')
    })

    it('neutralizes incomplete tags so the browser cannot complete them later', () => {
        expect(sanitizeInlineHtml('A<img src=x onerror=alert(1)')).toBe(
            'A&lt;img src=x onerror=alert(1)',
        )
    })

    it('normalizes whitelisted tags and removes unsafe attributes', () => {
        expect(sanitizeInlineHtml('<strong style="color:red">Tak</strong><br class=x/>')).toBe(
            '<strong>Tak</strong><br>',
        )
    })
})

// ── buildPageBody (via buildProposalHtml output) ────────────────────────────────

describe('buildProposalHtml — testing+technology side-by-side', () => {
    const adjacent: SectionKey[] = ['testing', 'technology']

    it('wraps both in a 1fr 1fr grid when both are enabled', () => {
        const html = buildProposalHtml(
            makeOffer({
                page1Sections: adjacent,
                page2Sections: [],
                testing: { enabled: true } as ProposalBlocks['testing'],
                technology: { enabled: true } as ProposalBlocks['technology'],
            }),
        )
        expect(html).toContain(GRID_WRAPPER)
        expect(html).toContain('Środowisko testowe')
        expect(html).toContain('<h2>Technologia</h2>')
    })

    it('does NOT use the grid when only one of the two is enabled', () => {
        const html = buildProposalHtml(
            makeOffer({
                page1Sections: adjacent,
                page2Sections: [],
                testing: { enabled: true } as ProposalBlocks['testing'],
                technology: { enabled: false } as ProposalBlocks['technology'],
            }),
        )
        // No half-width column: the survivor renders full-width, no grid wrapper.
        expect(html).not.toContain(GRID_WRAPPER)
        expect(html).toContain('Środowisko testowe')
        expect(html).not.toContain('<h2>Technologia</h2>')
    })
})

import { describe, expect, it } from 'vitest'
import { buildDefaultWebsiteV2Blocks, mergeWebsiteV2WithDefaults, type WebsiteV2Blocks } from '@/lib/pdf/website-v2-blocks'
import { buildWebsiteV2Html, type WebsiteV2OfferData } from '@/lib/pdf/website-v2-html'

function offer(): WebsiteV2OfferData {
    const blocks = buildDefaultWebsiteV2Blocks()
    blocks.cover.recipientName = 'Edytowalny Odbiorca'
    return {
        number: 'OFR/2026/019',
        title: 'Oferta',
        totalGross: 1000,
        currency: 'PLN',
        paymentDays: 14,
        createdAt: '2026-06-19T10:00:00.000Z',
        client: { name: 'Nazwa z klienta', company: null },
        user: {
            name: 'Sprzedawca',
            email: 'seller@example.com',
            avatar: 'data:image/png;base64,AVATAR',
            companyInfo: {
                name: 'Firma', website: null, phone: null, email: null,
                logo: 'legacy-logo.png', logoLight: 'light-logo.png', logoDark: 'dark-logo.png',
            },
        },
        blocks,
    }
}

describe('website v2 document branding', () => {
    it('uses an editable recipient without the gold placeholder styling', () => {
        const html = buildWebsiteV2Html(offer())
        const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
        expect(text).toContain('dla Edytowalny Odbiorca')
        expect(html).not.toContain('dla <span style="background:#FEF3C7')
        expect(html).toContain('Oferta nr <strong style="color:#334155;">OFR/2026/019</strong>')
    })

    it('wraps cover headlines only between words, including long names and industries', () => {
        const data = offer()
        const blocks = data.blocks as ReturnType<typeof buildDefaultWebsiteV2Blocks>
        blocks.cover.recipientName = 'Andrzej Tomaszkiewicz — branża gastronomiczna'

        const html = buildWebsiteV2Html(data)
        const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')

        expect(text).toContain('dla Andrzej Tomaszkiewicz — branża gastronomiczna')
        expect(html).toContain('<span class="headline-word">Tomaszkiewicz</span>')
        expect(html).toContain('<span class="headline-word">gastronomiczna</span>')
        expect(html).toContain('white-space: nowrap !important;')
        expect(html).toContain('grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);')
    })

    it('uses avatar for the author and background-specific logos', () => {
        const html = buildWebsiteV2Html(offer())
        expect(html).toContain('data:image/png;base64,AVATAR')
        expect(html).toContain('light-logo.png')
        expect(html).toContain('dark-logo.png')
    })

    it('renders values without brown placeholders and embeds portfolio screenshots', () => {
        const data = offer()
        const blocks = data.blocks as ReturnType<typeof buildDefaultWebsiteV2Blocks>
        blocks.portfolio.works[0].imageUrl = 'data:image/webp;base64,SCREENSHOT'
        const html = buildWebsiteV2Html(data)

        expect(html).not.toContain('#FEF3C7')
        expect(html).not.toContain('#92400E')
        expect(html).toContain('data:image/webp;base64,SCREENSHOT')
        expect(html).toContain('section { break-inside: auto;')
        expect(html).not.toContain('section { break-inside: avoid; }')
        expect(html).toContain('.price-wrap { display:block !important; }')
        expect(html).toContain('.price-aside {')
    })

    it('can force the next section to start on a new page', () => {
        const data = offer()
        const blocks = data.blocks as ReturnType<typeof buildDefaultWebsiteV2Blocks>
        blocks.pageBreakAfter = ['portfolio']
        blocks.process.title = 'NEXT SECTION'

        const html = buildWebsiteV2Html(data)

        expect(html).toContain('sq-manual-page-break')
        expect(html.indexOf('<div class="sq-manual-page-break" aria-hidden="true"></div>')).toBeLessThan(html.indexOf('NEXT SECTION'))
    })

    it('can force the first content section to start after the cover page', () => {
        const data = offer()
        const blocks = data.blocks as ReturnType<typeof buildDefaultWebsiteV2Blocks>
        blocks.pageBreakAfter = ['cover']
        blocks.problem.title = 'FIRST CONTENT SECTION'

        const html = buildWebsiteV2Html(data)
        const markerIndex = html.indexOf('<div class="sq-manual-page-break" aria-hidden="true"></div>')

        expect(markerIndex).toBeGreaterThan(html.indexOf('dla Edytowalny Odbiorca'))
        expect(markerIndex).toBeLessThan(html.indexOf('FIRST CONTENT SECTION'))
    })

    it('does not render unsupported arrow glyphs in the payment schedule', () => {
        const html = buildWebsiteV2Html(offer())

        expect(html).toContain('50</span>% zaliczki na start')
        expect(html).not.toContain('→')
    })
})

describe('website v2 independent prices', () => {
    it('does not copy a price from offer totals or another section', () => {
        const data = offer()
        const blocks = data.blocks as WebsiteV2Blocks
        data.totalGross = 999999
        blocks.cover.priceOverride = 1200
        blocks.cover.priceType = 'net'
        blocks.pricing.priceOverride = null

        const html = buildWebsiteV2Html(data)
        const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')

        expect(text).toContain('Cena: 1200 zł netto')
        expect(text).not.toContain('999 999 zł')
        expect(html.match(/do wyceny/g)?.length).toBeGreaterThanOrEqual(1)
    })

    it('renders the pricing section from its own gross amount and labels the converted net amount', () => {
        const data = offer()
        const blocks = data.blocks as WebsiteV2Blocks
        blocks.cover.priceOverride = 1200
        blocks.cover.priceType = 'net'
        blocks.pricing.priceOverride = 2460
        blocks.pricing.priceType = 'gross'
        blocks.pricing.costs = [{
            type: 'Rocznie',
            amount: '500 zł/rok',
            priceType: 'net',
            description: 'utrzymanie',
        }]

        const html = buildWebsiteV2Html(data)
        const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')

        expect(text).toContain('Cena: 1200 zł netto')
        expect(text).toContain('2460 zł')
        expect(text).toContain('2000 zł netto')
        expect(text).toContain('500 zł/rok netto')
    })

    it('adds independent price defaults to legacy saved blocks', () => {
        const merged = mergeWebsiteV2WithDefaults({
            cover: { title: 'Starsza oferta' },
            pricing: {
                priceOverride: 6150,
                costs: [{ type: 'Rocznie', amount: '400 zł', description: 'hosting' }],
            },
        } as unknown as Partial<WebsiteV2Blocks>)

        expect(merged.cover.priceOverride).toBeNull()
        expect(merged.cover.priceType).toBe('gross')
        expect(merged.pricing.priceOverride).toBe(6150)
        expect(merged.pricing.priceType).toBe('gross')
        expect(merged.pricing.costs[0].priceType).toBe('gross')
    })
})

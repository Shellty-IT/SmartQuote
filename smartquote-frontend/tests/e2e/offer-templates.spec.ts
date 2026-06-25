// tests/e2e/offer-templates.spec.ts
// E2E tests for all 9 offer template PDF pipelines.
// One describe block per template; each manages its own offer lifecycle.
//
// Validation layers per template:
//   HTML preview: sentinels for every section + forbidden garbage patterns
//   PDF bytes: %PDF- header, %%EOF footer, content-type, min size
//   PDF text:  section sentinels extracted from PDF content (via pdf-parse)
//   Browser render: loads preview in Playwright, checks console errors
//
// Templates without a preview route (classic) only get PDF validation.
//
// Etap 2: classic, proposal
// Etap 3: website_v2, website_v3, shop
// Etap 4: mobile_simple, mobile_app, support
// Etap 5: PDF text assertions (pdf-parse) added to all PDF tests

import { test, type Browser } from '@playwright/test'
import {
    login,
    getAccessToken,
    ensureClientId,
    seedOffer,
    deleteOffer,
    assertPreviewHtml,
    assertValidPdf,
    assertPreviewRenders,
} from './template-helpers'

// ─── Shared lifecycle helpers ──────────────────────────────────────────────────

type LifecycleState = { offerId: string; token: string }

async function setupOffer(
    browser: Browser,
    templateType: string,
    blocks: unknown,
    titlePrefix: string,
): Promise<LifecycleState> {
    const page = await browser.newPage()
    try {
        await login(page)
        const token = await getAccessToken(page)
        const clientId = await ensureClientId(token, page.request)
        const offerId = await seedOffer(token, page.request, {
            templateType,
            blocks,
            title: `${titlePrefix}-${Date.now()}`,
            clientId,
        })
        return { offerId, token }
    } finally {
        await page.close()
    }
}

async function cleanupOffer(browser: Browser, state: LifecycleState): Promise<void> {
    const page = await browser.newPage()
    try {
        await deleteOffer(state.token, page.request, state.offerId)
    } finally {
        await page.close()
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// CLASSIC
// Szablon klasyczny — tabela pozycji, warianty, opis, warunki.
// Brak trasy /preview → testujemy tylko PDF.
// ══════════════════════════════════════════════════════════════════════════════

// Classic doesn't use blocks — all data comes from offer.items + description/terms.
// We seed via the API and supply a rich items list to exercise the full table.
// The `blocks` field is null; templateType must equal 'classic'.

test.describe('Template: classic', () => {
    test.setTimeout(90_000)

    let state: LifecycleState

    test.beforeAll(async ({ browser }) => {
        test.setTimeout(120_000)
        // Classic offers are created without blocks; items are passed separately.
        // We create the offer with the default templateType path (classic is default).
        const page = await browser.newPage()
        try {
            await login(page)
            const token = await getAccessToken(page)
            const clientId = await ensureClientId(token, page.request)

            const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8080').replace(/\/$/, '')
            const res = await page.request.post(`${backendUrl}/api/offers`, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                data: {
                    clientId,
                    title: `E2E-Classic-${Date.now()}`,
                    templateType: 'classic',
                    description: '<p>E2E-ClassicDescription — opis oferty dla klienta.</p>',
                    terms: '<p>E2E-ClassicTerms — warunki umowy.</p>',
                    paymentDays: 14,
                    items: [
                        {
                            name: 'E2E-Item1-Implementacja',
                            description: 'Opis pierwszej pozycji.',
                            quantity: 1,
                            unit: 'szt.',
                            unitPrice: 10000,
                            vatRate: 23,
                            discount: 0,
                        },
                        {
                            name: 'E2E-Item2-Projekt',
                            description: 'Opis drugiej pozycji.',
                            quantity: 2,
                            unit: 'godz.',
                            unitPrice: 250,
                            vatRate: 23,
                            discount: 10,
                        },
                        {
                            name: 'E2E-Item3-Wdrożenie',
                            description: 'Opis trzeciej pozycji.',
                            quantity: 1,
                            unit: 'szt.',
                            unitPrice: 3000,
                            vatRate: 8,
                            discount: 0,
                        },
                        {
                            name: 'E2E-Item4-WariantBasic',
                            description: 'Pozycja wariantu Basic.',
                            quantity: 1,
                            unit: 'szt.',
                            unitPrice: 5000,
                            vatRate: 23,
                            discount: 0,
                            variantName: 'Basic',
                        },
                        {
                            name: 'E2E-Item5-WariantPremium',
                            description: 'Pozycja wariantu Premium.',
                            quantity: 1,
                            unit: 'szt.',
                            unitPrice: 15000,
                            vatRate: 23,
                            discount: 0,
                            variantName: 'Premium',
                        },
                    ],
                },
            })
            if (!res.ok()) throw new Error(`classic seed failed [${res.status()}]: ${(await res.text()).slice(0, 300)}`)
            const body = await res.json()
            state = { offerId: body.data.id, token }
        } finally {
            await page.close()
        }
    })

    test.afterAll(async ({ browser }) => {
        if (state) await cleanupOffer(browser, state)
    })

    test.beforeEach(async ({ page }) => {
        await login(page)
    })

    test('PDF is a valid, complete file with correct content-type', async ({ page }) => {
        // Classic has no /preview route — PDF is the only endpoint to validate.
        // A 5-item offer with description/terms should produce at least 60 KB.
        await assertValidPdf(page, `/api/offers/${state.offerId}/pdf/classic`, {
            minBytes: 60_000,
            // Item names are ASCII-only — reliably extractable from Puppeteer PDF
            expectedTexts: ['E2E-Item1-Implementacja', 'E2E-Item2-Projekt'],
        })
    })
})

// ══════════════════════════════════════════════════════════════════════════════
// PROPOSAL
// Szablon propozycja — 2 strony, 11 sekcji (w tym 3 opcjonalne: benefits,
// process, stats), aktywne wszystkie.
// ══════════════════════════════════════════════════════════════════════════════

// All 11 body sections active. Optional sections (benefits, process, stats)
// are placed in page1Sections and have enabled: true — they are disabled by
// default so this exercises the path that's off in production offers.

const PROPOSAL_BLOCKS = {
    version: 1,
    // Distribute all 11 sections across 2 pages
    page1Sections: ['intro', 'demo', 'structure', 'benefits', 'process', 'stats'],
    page2Sections: ['scope', 'testing', 'technology', 'pricingExtra', 'about'],
    header: {
        enabled: true,
        tag: 'E2E-ProposalHeader-Tag',
        titleOverride: '',
        clientLabelOverride: '',
    },
    footer: {
        enabled: true,
        customNote: 'E2E-ProposalFooter-Note',
        showAuthor: true,
    },
    intro: {
        enabled: true,
        paragraphs: [
            'E2E-IntroParagraph1 — wstępny akapit oferty testowej.',
            'E2E-IntroParagraph2 — drugi akapit z dodatkowym opisem.',
        ],
    },
    demo: {
        enabled: true,
        title: 'E2E-DemoTitle',
        body: 'E2E-DemoBody — opis demonstracji projektu.',
        urls: [{ href: 'https://e2e.test/demo', label: 'E2E-DemoUrl-Label' }],
        warning: 'E2E-DemoWarning',
        note: 'E2E-DemoNote',
    },
    structure: {
        enabled: true,
        title: 'E2E-StructureTitle',
        items: [
            { icon: '📋', name: 'E2E-StructItem1', description: 'Opis elementu struktury 1.' },
            { icon: '📋', name: 'E2E-StructItem2', description: 'Opis elementu struktury 2.' },
            { icon: '📋', name: 'E2E-StructItem3', description: 'Opis elementu struktury 3.' },
        ],
        note: 'E2E-StructureNote',
    },
    scope: {
        enabled: true,
        title: 'E2E-ScopeTitle',
        items: [
            { html: 'E2E-ScopeItem1 — pierwsza pozycja zakresu.' },
            { html: 'E2E-ScopeItem2 — druga pozycja zakresu.' },
            { html: 'E2E-ScopeItem3 — trzecia pozycja zakresu.' },
            { html: 'E2E-ScopeItem4 — czwarta pozycja zakresu.' },
        ],
    },
    testing: {
        enabled: true,
        intro: 'E2E-TestingIntro — opis podejścia do testowania.',
        cards: [
            { icon: '👁️', title: 'E2E-TestingCard1', description: 'Podgląd na żywo.' },
            { icon: '💬', title: 'E2E-TestingCard2', description: 'Komunikacja na bieżąco.' },
            { icon: '🔄', title: 'E2E-TestingCard3', description: 'Zatwierdzanie etapów.' },
            { icon: '🤝', title: 'E2E-TestingCard4', description: 'Transparentność.' },
        ],
        note: 'E2E-TestingNote',
    },
    technology: {
        enabled: true,
        body: 'E2E-TechBody — opis wybranych technologii.',
        options: [
            {
                icon: '🔷',
                title: 'E2E-TechOption1-Rekomendowana',
                urls: [{ href: 'https://e2e.test/tech-a', label: 'E2E-TechUrl-A' }],
            },
            {
                icon: '🔶',
                title: 'E2E-TechOption2-Alternatywna',
                urls: [{ href: 'https://e2e.test/tech-b', label: 'E2E-TechUrl-B' }],
            },
        ],
        note: 'E2E-TechNote',
    },
    pricingExtra: {
        enabled: true,
        timeline: 'E2E-PricingTimeline',
        timelineSub: 'E2E-PricingTimelineSub',
        contractType: 'E2E-ContractType',
        contractSub: 'E2E-ContractSub',
        priceOverride: null,
        priceType: 'gross' as const,
    },
    about: {
        enabled: true,
        ctaText: 'E2E-AboutCtaText — zaproszenie do kontaktu.',
        aboutBoxTitle: 'E2E-AboutBoxTitle',
    },
    // Optional sections — enabled: true to exercise paths off by default
    benefits: {
        enabled: true,
        title: 'E2E-BenefitsTitle',
        items: [
            { icon: '⚡', title: 'E2E-BenefitItem1', description: 'Szybka realizacja.' },
            { icon: '🛡️', title: 'E2E-BenefitItem2', description: 'Gwarancja jakości.' },
            { icon: '🤝', title: 'E2E-BenefitItem3', description: 'Transparentność.' },
        ],
    },
    process: {
        enabled: true,
        title: 'E2E-ProcessTitle',
        steps: [
            { title: 'E2E-ProcessStep1', description: 'Konsultacja.' },
            { title: 'E2E-ProcessStep2', description: 'Projekt.' },
            { title: 'E2E-ProcessStep3', description: 'Realizacja.' },
            { title: 'E2E-ProcessStep4', description: 'Wdrożenie.' },
        ],
    },
    stats: {
        enabled: true,
        items: [
            { value: 'E2E-50+', label: 'zrealizowanych projektów' },
            { value: 'E2E-10lat', label: 'doświadczenia' },
            { value: 'E2E-100%', label: 'terminowych wdrożeń' },
        ],
    },
}

test.describe('Template: proposal', () => {
    test.setTimeout(90_000)

    let state: LifecycleState

    test.beforeAll(async ({ browser }) => {
        test.setTimeout(120_000)
        state = await setupOffer(browser, 'proposal', PROPOSAL_BLOCKS, 'E2E-Proposal')
    })

    test.afterAll(async ({ browser }) => {
        if (state) await cleanupOffer(browser, state)
    })

    test.beforeEach(async ({ page }) => {
        await login(page)
    })

    test('preview HTML contains all 11 section sentinels', async ({ page }) => {
        // Verifies that every section (including the 3 optional ones) was rendered.
        // Each sentinel is a unique string placed in a specific section's text field.
        await assertPreviewHtml(
            page,
            `/api/offers/${state.offerId}/proposal/preview`,
            {
                requiredSentinels: [
                    // header
                    'E2E-ProposalHeader-Tag',
                    // intro (page1)
                    'E2E-IntroParagraph1',
                    // demo (page1) — was disabled by default, enabled here
                    'E2E-DemoTitle',
                    // structure (page1) — was disabled by default
                    'E2E-StructureTitle',
                    // benefits (page1, optional) — disabled by default
                    'E2E-BenefitsTitle',
                    // process (page1, optional) — disabled by default
                    'E2E-ProcessTitle',
                    // stats (page1, optional) — disabled by default
                    'E2E-50+',
                    // scope (page2)
                    'E2E-ScopeTitle',
                    // testing (page2) — was disabled by default
                    'E2E-TestingIntro',
                    // technology (page2) — was disabled by default
                    'E2E-TechBody',
                    // pricingExtra (page2)
                    'E2E-PricingTimeline',
                    // about (page2)
                    'E2E-AboutCtaText',
                ],
            },
        )
    })

    test('PDF is a valid, complete file', async ({ page }) => {
        // 2-page document with 11 sections → expect at least 80 KB
        await assertValidPdf(page, `/api/offers/${state.offerId}/pdf/proposal`, {
            minBytes: 80_000,
            // Header uses letter-spacing (spaced chars in PDF) and titles use text-transform:
            // uppercase — use body paragraph text and list item text instead, which are
            // never transformed by CSS and extract reliably via pdf-parse.
            expectedTexts: ['E2E-IntroParagraph1', 'E2E-ScopeItem1', 'E2E-DemoBody'],
        })
    })

    test('preview renders in browser without critical errors', async ({ page }) => {
        await assertPreviewRenders(page, `/api/offers/${state.offerId}/proposal/preview`)
    })
})

// ══════════════════════════════════════════════════════════════════════════════
// WEBSITE V2
// Szablon strona internetowa (domyślny) — 8 sekcji, wszystkie aktywne.
// ══════════════════════════════════════════════════════════════════════════════

const WEBSITE_V2_BLOCKS = {
    version: 1,
    sections: ['problem', 'about', 'features', 'portfolio', 'process', 'technology', 'pricing', 'faq'],
    cover: {
        title: 'E2E-WV2-CoverTitle',
        recipientName: 'Firma E2E',
        subtitle: 'Propozycja realizacji strony internetowej.',
        knowledgePill: 'Obsługa bez technicznej wiedzy',
        deadlineDays: 14,
        validityDays: 14,
    },
    footer: { tagline: 'E2E-WV2-FooterTagline' },
    problem: {
        enabled: true,
        title: 'E2E-WV2-ProblemTitle',
        painPoints: [
            { emoji: '😟', text: 'E2E-PainPoint1 — brak strony.' },
            { emoji: '📱', text: 'E2E-PainPoint2 — stara strona.' },
        ],
        punchline: 'E2E-ProblemPunchline',
    },
    about: {
        enabled: true,
        title: 'E2E-WV2-AboutTitle',
        name: 'E2E-AboutName',
        role: 'Twórca stron',
        bio: 'E2E-AboutBio — opis specjalisty.',
        stats: [
            { value: 'E2E-50+', label: 'stron' },
            { value: 'E2E-8lat', label: 'doświadczenia' },
        ],
    },
    features: {
        enabled: true,
        title: 'E2E-WV2-FeaturesTitle',
        subtitle: 'E2E-FeaturesSubtitle',
        items: [
            { title: 'E2E-Feature1', description: 'Opis funkcji 1.' },
            { title: 'E2E-Feature2', description: 'Opis funkcji 2.' },
        ],
        extras: ['E2E-Extra1', 'E2E-Extra2'],
    },
    portfolio: {
        enabled: true,
        title: 'E2E-WV2-PortfolioTitle',
        subtitle: 'E2E-PortfolioSubtitle',
        works: [
            { name: 'E2E-Work1', url: '#', imageUrl: '' },
            { name: 'E2E-Work2', url: '#', imageUrl: '' },
        ],
        testimonials: [
            { stars: 5, text: 'E2E-Testimonial1', name: 'Jan K.', company: 'Firma A' },
        ],
    },
    process: {
        enabled: true,
        title: 'E2E-WV2-ProcessTitle',
        steps: [
            { title: 'E2E-Step1', description: 'Rozmawiamy.' },
            { title: 'E2E-Step2', description: 'Projektuję.' },
            { title: 'E2E-Step3', description: 'Buduję.' },
            { title: 'E2E-Step4', description: 'Oddaję.' },
        ],
        timelineNote: 'E2E-ProcessTimeline',
    },
    technology: {
        enabled: true,
        title: 'E2E-WV2-TechnologyTitle',
        subtitle: 'E2E-TechSubtitle',
        recommended: {
            iconChar: 'W',
            iconBg: '#21759B',
            name: 'E2E-TechRecommended',
            description: 'Opis rekomendowanej technologii.',
            pros: ['Łatwa obsługa', 'Duży wybór'],
        },
        alternatives: [
            {
                name: 'E2E-TechAlt1',
                subtitle: 'Nowoczesna',
                badge: '⚡ ALT',
                description: 'Opis alternatywy.',
                pros: ['Szybkość', 'Design'],
            },
        ],
        footer: 'E2E-TechFooter',
    },
    pricing: {
        enabled: true,
        priceOverride: null,
        includes: [
            'E2E-PricingInclude1',
            'E2E-PricingInclude2',
            'E2E-PricingInclude3',
        ],
        paymentSchedule: [
            { percent: 50, label: 'E2E-PayStep1' },
            { percent: 50, label: 'E2E-PayStep2' },
        ],
        guarantees: [
            { emoji: '🛡️', text: 'E2E-Guarantee1' },
        ],
        costs: [
            { type: 'Jednorazowo', amount: '—', description: 'E2E-CostDesc1' },
        ],
    },
    faq: {
        enabled: true,
        title: 'E2E-WV2-FaqTitle',
        subtitle: 'E2E-FaqSubtitle',
        items: [
            { question: 'E2E-FaqQ1?', answer: 'E2E-FaqA1.' },
            { question: 'E2E-FaqQ2?', answer: 'E2E-FaqA2.' },
        ],
    },
}

test.describe('Template: website_v2', () => {
    test.setTimeout(90_000)

    let state: LifecycleState

    test.beforeAll(async ({ browser }) => {
        test.setTimeout(120_000)
        state = await setupOffer(browser, 'website_v2', WEBSITE_V2_BLOCKS, 'E2E-WebsiteV2')
    })

    test.afterAll(async ({ browser }) => {
        if (state) await cleanupOffer(browser, state)
    })

    test.beforeEach(async ({ page }) => {
        await login(page)
    })

    test('preview HTML contains all 8 section sentinels', async ({ page }) => {
        await assertPreviewHtml(
            page,
            `/api/offers/${state.offerId}/website-v2/preview`,
            {
                requiredSentinels: [
                    'E2E-WV2-ProblemTitle',
                    'E2E-WV2-AboutTitle',
                    'E2E-WV2-FeaturesTitle',
                    'E2E-WV2-PortfolioTitle',
                    'E2E-WV2-ProcessTitle',
                    'E2E-WV2-TechnologyTitle',
                    'E2E-PricingInclude1',
                    'E2E-WV2-FaqTitle',
                ],
            },
        )
    })

    test('PDF is a valid, complete file', async ({ page }) => {
        await assertValidPdf(page, `/api/offers/${state.offerId}/pdf/website-v2`, {
            minBytes: 50_000,
            expectedTexts: ['E2E-WV2-ProblemTitle', 'E2E-WV2-FeaturesTitle', 'E2E-WV2-FaqTitle'],
        })
    })

    test('preview renders in browser without critical errors', async ({ page }) => {
        await assertPreviewRenders(page, `/api/offers/${state.offerId}/website-v2/preview`)
    })
})

// ══════════════════════════════════════════════════════════════════════════════
// WEBSITE V3
// Szablon strona internetowa (zaawansowany) — 11 sekcji, wszystkie aktywne.
// ══════════════════════════════════════════════════════════════════════════════

const WEBSITE_V3_BLOCKS = {
    version: 1,
    sections: ['needs', 'packages', 'process', 'scope', 'timeline', 'pricing', 'portfolio', 'testimonials', 'about', 'stack', 'terms'],
    cover: {
        badgeLabel: 'E2E-WV3-BadgeLabel',
        subtitle: 'PROPOZYCJA E2E STRONY INTERNETOWEJ',
        promisePills: ['E2E-Pill1', 'E2E-Pill2', 'E2E-Pill3'],
        deadlineDays: 21,
        validityDays: 14,
    },
    footer: {
        ctaHeadline: 'E2E-WV3-CtaHeadline',
        ctaSubtitle: 'E2E-WV3-CtaSubtitle',
    },
    needs: {
        enabled: true,
        title: 'E2E-WV3-NeedsTitle',
        intro: 'E2E-NeedsIntro — opis potrzeb klienta.',
        challengeTitle: 'Wyzwanie',
        challengeItems: ['E2E-Challenge1', 'E2E-Challenge2'],
        responseTitle: 'Nasza odpowiedź',
        responseItems: ['E2E-Response1', 'E2E-Response2'],
    },
    packages: {
        enabled: true,
        title: 'E2E-WV3-PackagesTitle',
        subtitle: 'Pakiety',
        packages: [
            {
                name: 'E2E-PackageStart',
                tagline: 'dla startujących firm',
                price: 'od 2 500',
                highlighted: false,
                ctaLabel: 'Wybieram',
                features: [
                    { label: 'Do 5 podstron', included: true },
                    { label: 'SSL', included: true },
                ],
            },
            {
                name: 'E2E-PackageBiznes',
                tagline: 'dla rozwijających się',
                price: 'od 4 900',
                highlighted: true,
                ctaLabel: 'Wybieram Biznes',
                features: [
                    { label: 'Do 10 podstron', included: true },
                    { label: 'CMS WordPress', included: true },
                ],
            },
        ],
    },
    process: {
        enabled: true,
        title: 'E2E-WV3-ProcessTitle',
        steps: [
            { label: 'E2E-ProcessStep1', duration: '1 dzień', description: 'Briefing.' },
            { label: 'E2E-ProcessStep2', duration: '2 dni', description: 'Projekt.' },
            { label: 'E2E-ProcessStep3', duration: '5 dni', description: 'Kodowanie.' },
        ],
        timelineNote: 'E2E-ProcessTimelineNote',
    },
    scope: {
        enabled: true,
        title: 'E2E-WV3-ScopeTitle',
        categories: [
            {
                title: 'E2E-ScopeCat1',
                items: [
                    { label: 'E2E-ScopeItem1', description: 'Opis.', optional: false },
                    { label: 'E2E-ScopeItem2', optional: true },
                ],
            },
            {
                title: 'E2E-ScopeCat2',
                items: [
                    { label: 'E2E-ScopeItem3', description: 'Opis.', optional: false },
                ],
            },
        ],
    },
    timeline: {
        enabled: true,
        title: 'E2E-WV3-TimelineTitle',
        columnLabels: ['Tydz. 1', 'Tydz. 2', 'Tydz. 3'],
        rows: [
            { label: 'E2E-TimelineRow1', fills: [1, 0, 0] as Array<0 | 0.5 | 1> },
            { label: 'E2E-TimelineRow2', fills: [0, 1, 0.5] as Array<0 | 0.5 | 1> },
            { label: 'E2E-TimelineRow3', fills: [0, 0, 1] as Array<0 | 0.5 | 1> },
        ],
        estimatedCompletion: 'E2E-EstimatedCompletion',
    },
    pricing: {
        enabled: true,
        title: 'E2E-WV3-PricingTitle',
        priceOverride: null,
        items: [
            { label: 'E2E-PricingItem1', details: 'szczegóły', price: '4 900', isExtra: false },
            { label: 'E2E-PricingExtra1', details: 'opcja', price: '250', isExtra: true },
        ],
        paymentSteps: [
            { percent: 40, label: 'Zaliczka', description: 'E2E-PayDesc1' },
            { percent: 60, label: 'Płatność końcowa', description: 'E2E-PayDesc2' },
        ],
    },
    portfolio: {
        enabled: true,
        title: 'E2E-WV3-PortfolioTitle',
        portfolioUrl: '',
        items: [
            { name: 'E2E-PortfolioItem1', industry: 'IT', description: 'E2E opis projektu.', tech: 'WordPress', thumbColor: 'violet' },
        ],
    },
    testimonials: {
        enabled: true,
        title: 'E2E-WV3-TestimonialsTitle',
        items: [
            { quote: 'E2E-Quote1', initials: 'JK', name: 'Jan K.', position: 'CEO, Firma E2E' },
        ],
    },
    about: {
        enabled: true,
        title: 'E2E-WV3-AboutTitle',
        bio1: 'E2E-AboutBio1',
        bio2: 'E2E-AboutBio2',
        stats: [
            { value: 'E2E-6lat', label: 'doświadczenia' },
            { value: 'E2E-80', label: 'projektów' },
        ],
    },
    stack: {
        enabled: true,
        title: 'E2E-WV3-StackTitle',
        technologies: ['E2E-Tech1', 'E2E-Tech2', 'WordPress', 'Next.js'],
    },
    terms: {
        enabled: true,
        title: 'E2E-WV3-TermsTitle',
        guarantees: [
            { emoji: '🛡️', title: 'E2E-Guarantee1', description: 'Gwarancja 12 miesięcy.' },
            { emoji: '🔄', title: 'E2E-Guarantee2', description: '3 rundy poprawek.' },
        ],
        paymentTerms: 'E2E-PaymentTerms',
        contractForm: 'E2E-ContractForm',
        copyrightTerms: 'E2E-CopyrightTerms',
    },
}

test.describe('Template: website_v3', () => {
    test.setTimeout(90_000)

    let state: LifecycleState

    test.beforeAll(async ({ browser }) => {
        test.setTimeout(120_000)
        state = await setupOffer(browser, 'website_v3', WEBSITE_V3_BLOCKS, 'E2E-WebsiteV3')
    })

    test.afterAll(async ({ browser }) => {
        if (state) await cleanupOffer(browser, state)
    })

    test.beforeEach(async ({ page }) => {
        await login(page)
    })

    test('preview HTML contains all 11 section sentinels', async ({ page }) => {
        await assertPreviewHtml(
            page,
            `/api/offers/${state.offerId}/website-v3/preview`,
            {
                requiredSentinels: [
                    'E2E-WV3-NeedsTitle',
                    'E2E-WV3-PackagesTitle',
                    'E2E-WV3-ProcessTitle',
                    'E2E-WV3-ScopeTitle',
                    'E2E-WV3-TimelineTitle',
                    'E2E-WV3-PricingTitle',
                    'E2E-WV3-PortfolioTitle',
                    'E2E-WV3-TestimonialsTitle',
                    'E2E-WV3-AboutTitle',
                    'E2E-WV3-StackTitle',
                    'E2E-WV3-TermsTitle',
                ],
            },
        )
    })

    test('PDF is a valid, complete file', async ({ page }) => {
        await assertValidPdf(page, `/api/offers/${state.offerId}/pdf/website-v3`, {
            minBytes: 60_000,
            expectedTexts: ['E2E-WV3-NeedsTitle', 'E2E-WV3-PricingTitle', 'E2E-WV3-AboutTitle'],
        })
    })

    test('preview renders in browser without critical errors', async ({ page }) => {
        await assertPreviewRenders(page, `/api/offers/${state.offerId}/website-v3/preview`)
    })
})

// ══════════════════════════════════════════════════════════════════════════════
// SHOP
// Szablon sklep internetowy — 8 sekcji, wszystkie aktywne.
// ══════════════════════════════════════════════════════════════════════════════

const SHOP_BLOCKS = {
    version: 1,
    sections: ['summary', 'scope', 'platforms', 'timeline', 'pricing', 'techStack', 'warranty', 'about'],
    cover: {
        tag: 'E2E-Shop-CoverTag',
        subtitle: 'SKLEPU INTERNETOWEGO E2E',
        validityDays: 30,
    },
    footer: {
        ctaTitle: 'E2E-Shop-CtaTitle',
        ctaSubtitle: 'E2E-Shop-CtaSubtitle',
        ctaButtonText: 'AKCEPTUJĘ',
    },
    summary: {
        enabled: true,
        columns: [
            { title: 'E2E-Shop-SummaryCol1', body: 'E2E opis celu projektu sklepu.' },
            { title: 'E2E-Shop-SummaryCol2', body: 'E2E opis zakresu dostawy.' },
        ],
    },
    scope: {
        enabled: true,
        title: 'E2E-Shop-ScopeTitle',
        items: [
            { icon: '🎨', title: 'E2E-ScopeItem1', description: 'Projekt graficzny.' },
            { icon: '⚙️', title: 'E2E-ScopeItem2', description: 'Konfiguracja platformy.' },
            { icon: '💳', title: 'E2E-ScopeItem3', description: 'Płatności online.' },
        ],
    },
    platforms: {
        enabled: true,
        title: 'E2E-Shop-PlatformsTitle',
        options: [
            {
                name: 'E2E-Platform-WooCommerce',
                recommended: true,
                pros: 'E2E-pros elastyczność',
                cons: 'E2E-cons utrzymanie',
                forWho: 'E2E-forWho małe sklepy',
                priceFrom: '8 000 zł',
            },
            {
                name: 'E2E-Platform-PrestaShop',
                recommended: false,
                pros: 'E2E-pros szybkość',
                cons: 'E2E-cons plugin',
                forWho: 'E2E-forWho średnie sklepy',
                priceFrom: '10 000 zł',
            },
        ],
    },
    timeline: {
        enabled: true,
        title: 'E2E-Shop-TimelineTitle',
        steps: [
            { title: 'E2E-TLStep1', duration: '7 dni', description: 'Projekt graficzny.' },
            { title: 'E2E-TLStep2', duration: '14 dni', description: 'Wdrożenie platformy.' },
            { title: 'E2E-TLStep3', duration: '7 dni', description: 'Integracje i testy.' },
        ],
    },
    pricing: {
        enabled: true,
        title: 'E2E-Shop-PricingTitle',
        priceOverride: null,
        priceType: 'net' as const,
        items: [
            { name: 'E2E-PricingItem1', description: 'Projekt + wdrożenie', price: '8 000 zł' },
            { name: 'E2E-PricingItem2', description: 'Integracje', price: '2 000 zł' },
        ],
        extras: [
            { name: 'E2E-PricingExtra1', price: '+ 1 500 zł' },
        ],
        paymentSchedule: [
            { percent: '40%', description: 'E2E-PayDesc1' },
            { percent: '60%', description: 'E2E-PayDesc2' },
        ],
    },
    techStack: {
        enabled: true,
        title: 'E2E-Shop-TechStackTitle',
        tags: ['E2E-Tag1-WooCommerce', 'E2E-Tag2-WordPress', 'PHP 8', 'WooCommerce'],
        description: 'E2E-TechStackDescription',
    },
    warranty: {
        enabled: true,
        title: 'E2E-Shop-WarrantyTitle',
        items: [
            { icon: '🛡️', title: 'E2E-WarrantyItem1', description: 'Gwarancja 12 miesięcy.' },
            { icon: '🔄', title: 'E2E-WarrantyItem2', description: '3 rundy poprawek.' },
        ],
        ctaTitle: 'E2E-WarrantyCtaTitle',
        ctaSubtitle: 'E2E-WarrantyCtaSubtitle',
        ctaButtonText: 'AKCEPTUJĘ',
    },
    about: {
        enabled: true,
        title: 'E2E-Shop-AboutTitle',
        description: 'E2E-AboutDescription — opis wykonawcy.',
        stats: [
            { value: 'E2E-50+', label: 'sklepów' },
            { value: 'E2E-8lat', label: 'doświadczenia' },
        ],
    },
}

test.describe('Template: shop', () => {
    test.setTimeout(90_000)

    let state: LifecycleState

    test.beforeAll(async ({ browser }) => {
        test.setTimeout(120_000)
        state = await setupOffer(browser, 'shop', SHOP_BLOCKS, 'E2E-Shop')
    })

    test.afterAll(async ({ browser }) => {
        if (state) await cleanupOffer(browser, state)
    })

    test.beforeEach(async ({ page }) => {
        await login(page)
    })

    test('preview HTML contains all 8 section sentinels', async ({ page }) => {
        await assertPreviewHtml(
            page,
            `/api/offers/${state.offerId}/shop/preview`,
            {
                requiredSentinels: [
                    'E2E-Shop-SummaryCol1',
                    'E2E-Shop-ScopeTitle',
                    'E2E-Shop-PlatformsTitle',
                    'E2E-Shop-TimelineTitle',
                    'E2E-Shop-PricingTitle',
                    'E2E-Shop-TechStackTitle',
                    'E2E-Shop-WarrantyTitle',
                    'E2E-Shop-AboutTitle',
                ],
            },
        )
    })

    test('PDF is a valid, complete file', async ({ page }) => {
        await assertValidPdf(page, `/api/offers/${state.offerId}/pdf/shop`, {
            minBytes: 50_000,
            // Section titles use letter-spacing CSS → spaced chars in PDF (e.g. "E 2 E - S C O P E").
            // Use body/item text that extracts cleanly without CSS transforms.
            expectedTexts: ['E2E-Shop-SummaryCol1', 'E2E-ScopeItem1', 'E2E-TLStep1'],
        })
    })

    test('preview renders in browser without critical errors', async ({ page }) => {
        await assertPreviewRenders(page, `/api/offers/${state.offerId}/shop/preview`)
    })
})

// ─── mobile_simple ────────────────────────────────────────────────────────────

// Minimal fixture: only sentinel-carrying fields are set; merge function fills the rest.
const MOBILE_SIMPLE_BLOCKS = {
    version: 1,
    sections: ['checklist', 'tech', 'process'] as const,
    cover: {
        coverTag: 'E2E-MobileSimple-CoverTag',
    },
    checklist: {
        sectionTitle: 'E2E-MobileSimple-ChecklistTitle',
    },
    tech: {
        sectionTitle: 'E2E-MobileSimple-TechTitle',
    },
    process: {
        processTitle: 'E2E-MobileSimple-ProcessTitle',
    },
}

test.describe('Template: mobile_simple', () => {
    test.setTimeout(90_000)

    let state: LifecycleState

    test.beforeAll(async ({ browser }) => {
        test.setTimeout(120_000)
        state = await setupOffer(browser, 'mobile_simple', MOBILE_SIMPLE_BLOCKS, 'E2E-MobileSimple')
    })

    test.afterAll(async ({ browser }) => {
        if (state) await cleanupOffer(browser, state)
    })

    test.beforeEach(async ({ page }) => {
        await login(page)
    })

    test('preview HTML contains all 3 section sentinels', async ({ page }) => {
        await assertPreviewHtml(
            page,
            `/api/offers/${state.offerId}/mobile-simple/preview`,
            {
                requiredSentinels: [
                    'E2E-MobileSimple-CoverTag',       // cover.coverTag
                    'E2E-MobileSimple-ChecklistTitle', // checklist.sectionTitle
                    'E2E-MobileSimple-TechTitle',      // tech.sectionTitle
                    'E2E-MobileSimple-ProcessTitle',   // process.processTitle
                ],
            },
        )
    })

    test('PDF is a valid, complete file', async ({ page }) => {
        await assertValidPdf(page, `/api/offers/${state.offerId}/pdf/mobile-simple`, {
            minBytes: 40_000,
            expectedTexts: ['E2E-MobileSimple-ChecklistTitle', 'E2E-MobileSimple-TechTitle'],
        })
    })

    test('preview renders in browser without critical errors', async ({ page }) => {
        await assertPreviewRenders(page, `/api/offers/${state.offerId}/mobile-simple/preview`)
    })
})

// ─── mobile_app ───────────────────────────────────────────────────────────────

const MOBILE_APP_BLOCKS = {
    version: 1,
    sections: ['vision', 'platform', 'scope', 'architecture', 'timeline', 'pricing', 'postlaunch', 'about'] as const,
    vision: {
        sectionTitle: 'E2E-MobileApp-VisionTitle',
    },
    platform: {
        sectionTitle: 'E2E-MobileApp-PlatformTitle',
    },
    scope: {
        sectionTitle: 'E2E-MobileApp-ScopeTitle',
    },
    architecture: {
        sectionTitle: 'E2E-MobileApp-ArchTitle',
    },
    timeline: {
        sectionTitle: 'E2E-MobileApp-TimelineTitle',
    },
    pricing: {
        sectionTitle: 'E2E-MobileApp-PricingTitle',
    },
    postlaunch: {
        sectionTitle: 'E2E-MobileApp-PostlaunchTitle',
    },
    about: {
        sectionTitle: 'E2E-MobileApp-AboutTitle',
    },
}

test.describe('Template: mobile_app', () => {
    test.setTimeout(90_000)

    let state: LifecycleState

    test.beforeAll(async ({ browser }) => {
        test.setTimeout(120_000)
        state = await setupOffer(browser, 'mobile_app', MOBILE_APP_BLOCKS, 'E2E-MobileApp')
    })

    test.afterAll(async ({ browser }) => {
        if (state) await cleanupOffer(browser, state)
    })

    test.beforeEach(async ({ page }) => {
        await login(page)
    })

    test('preview HTML contains all 8 section sentinels', async ({ page }) => {
        await assertPreviewHtml(
            page,
            `/api/offers/${state.offerId}/mobile-app/preview`,
            {
                requiredSentinels: [
                    'E2E-MobileApp-VisionTitle',     // vision.sectionTitle
                    'E2E-MobileApp-PlatformTitle',   // platform.sectionTitle
                    'E2E-MobileApp-ScopeTitle',      // scope.sectionTitle
                    'E2E-MobileApp-ArchTitle',        // architecture.sectionTitle
                    'E2E-MobileApp-TimelineTitle',   // timeline.sectionTitle
                    'E2E-MobileApp-PricingTitle',    // pricing.sectionTitle
                    'E2E-MobileApp-PostlaunchTitle', // postlaunch.sectionTitle
                    'E2E-MobileApp-AboutTitle',      // about.sectionTitle
                ],
            },
        )
    })

    test('PDF is a valid, complete file', async ({ page }) => {
        await assertValidPdf(page, `/api/offers/${state.offerId}/pdf/mobile-app`, {
            minBytes: 50_000,
            expectedTexts: ['E2E-MobileApp-VisionTitle', 'E2E-MobileApp-PricingTitle', 'E2E-MobileApp-AboutTitle'],
        })
    })

    test('preview renders in browser without critical errors', async ({ page }) => {
        await assertPreviewRenders(page, `/api/offers/${state.offerId}/mobile-app/preview`)
    })
})

// ─── support ──────────────────────────────────────────────────────────────────

const SUPPORT_BLOCKS = {
    version: 1,
    sections: ['benefits', 'packages', 'scope', 'sla', 'process', 'pricing'] as const,
    benefits: {
        sectionTitle: 'E2E-Support-BenefitsTitle',
    },
    packages: {
        sectionTitle: 'E2E-Support-PackagesTitle',
    },
    scope: {
        sectionTitle: 'E2E-Support-ScopeTitle',
    },
    sla: {
        sectionTitle: 'E2E-Support-SlaTitle',
    },
    process: {
        sectionTitle: 'E2E-Support-ProcessTitle',
    },
    pricing: {
        sectionTitle: 'E2E-Support-PricingTitle',
    },
}

test.describe('Template: support', () => {
    test.setTimeout(90_000)

    let state: LifecycleState

    test.beforeAll(async ({ browser }) => {
        test.setTimeout(120_000)
        state = await setupOffer(browser, 'support', SUPPORT_BLOCKS, 'E2E-Support')
    })

    test.afterAll(async ({ browser }) => {
        if (state) await cleanupOffer(browser, state)
    })

    test.beforeEach(async ({ page }) => {
        await login(page)
    })

    test('preview HTML contains all 6 section sentinels', async ({ page }) => {
        await assertPreviewHtml(
            page,
            `/api/offers/${state.offerId}/support/preview`,
            {
                requiredSentinels: [
                    'E2E-Support-BenefitsTitle', // benefits.sectionTitle
                    'E2E-Support-PackagesTitle', // packages.sectionTitle
                    'E2E-Support-ScopeTitle',    // scope.sectionTitle
                    'E2E-Support-SlaTitle',      // sla.sectionTitle
                    'E2E-Support-ProcessTitle',  // process.sectionTitle
                    'E2E-Support-PricingTitle',  // pricing.sectionTitle
                ],
            },
        )
    })

    test('PDF is a valid, complete file', async ({ page }) => {
        await assertValidPdf(page, `/api/offers/${state.offerId}/pdf/support`, {
            minBytes: 50_000,
            expectedTexts: ['E2E-Support-BenefitsTitle', 'E2E-Support-SlaTitle', 'E2E-Support-PricingTitle'],
        })
    })

    test('preview renders in browser without critical errors', async ({ page }) => {
        await assertPreviewRenders(page, `/api/offers/${state.offerId}/support/preview`)
    })
})

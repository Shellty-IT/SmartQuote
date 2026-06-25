// tests/e2e/offer-templates.spec.ts
// E2E tests for all 9 offer template PDF pipelines.
// One describe block per template; each manages its own offer lifecycle.
//
// Validation layers per template:
//   HTML preview: sentinels for every section + forbidden garbage patterns
//   PDF bytes: %PDF- header, %%EOF footer, content-type, min size
//   Browser render: loads preview in Playwright, checks console errors
//
// Templates without a preview route (classic) only get PDF validation.
//
// Etap 2: classic, proposal
// Etap 3: website_v2, website_v3, shop        (to be added)
// Etap 4: mobile_simple, mobile_app, support  (to be added)

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
        await assertValidPdf(page, `/api/offers/${state.offerId}/pdf/classic`, { minBytes: 60_000 })
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
        await assertValidPdf(
            page,
            `/api/offers/${state.offerId}/pdf/proposal`,
            { minBytes: 80_000 },
        )
    })

    test('preview renders in browser without critical errors', async ({ page }) => {
        await assertPreviewRenders(page, `/api/offers/${state.offerId}/proposal/preview`)
    })
})

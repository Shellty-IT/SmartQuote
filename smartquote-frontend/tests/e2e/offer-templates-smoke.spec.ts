// tests/e2e/offer-templates-smoke.spec.ts
// Smoke test: verifies the full PDF pipeline for the "universal" template.
// Serves as integration smoke for the template-helpers infrastructure.
//
// What it checks:
//   1. Offer can be seeded via backend API with all 6 sections active
//   2. Preview HTML is valid (no garbage, all section markers present)
//   3. PDF bytes are a valid, complete PDF file (header + EOF + size)
//   4. Preview renders in-browser without critical console errors

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

// ── Fixture data ──────────────────────────────────────────────────────────────
// Universal template with all 6 sections active and meaningful text in each,
// so sentinels reliably identify that a section rendered.

const UNIVERSAL_BLOCKS = {
    version: 1,
    sections: ['summary', 'needs', 'scope', 'timeline', 'pricing', 'terms'] as const,
    cover: {
        serviceTitle: 'E2E – System CRM dla Klienta',
        clientName: 'Firma E2E Sp. z o.o.',
        contractorName: 'Jan Testowy',
        contractorRole: 'Senior Developer',
        contractorEmail: 'jan@e2e.pl',
        contractorPhone: '+48 123 456 789',
        websiteUrl: 'www.e2e.pl',
        offerDate: '2026-06-25',
        validUntil: '2026-07-25',
    },
    summary: {
        eyebrow: 'Streszczenie',
        title: 'E2E-Universal-SummaryTitle',
        leadText: 'Oferta wygenerowana przez testy E2E dla szablonu Universal.',
        scopeFact: 'Pełny zakres testowy',
        timelineFact: '6 tygodni',
        valueFact: '25 000',
    },
    needs: {
        sourceNote: 'E2E-NeedsSourceNote',
        challengeText: 'Firma potrzebuje nowoczesnego CRM integrującego ofertowanie z e-fakturowaniem.',
        goalText: 'Skrócenie czasu przygotowania ofert o 60%.',
        resultText: 'Czas oferty < 10 min, 0 błędów manualnych.',
    },
    scope: {
        items: [
            { name: 'E2E-ScopeItem-Analiza', description: 'Warsztaty z zespołem klienta.', optional: false },
            { name: 'Projekt UX/UI', description: 'Makiety i prototyp interaktywny.', optional: false },
            { name: 'Implementacja backendu', description: 'Node.js + Prisma + PostgreSQL.', optional: false },
            { name: 'Implementacja frontendu', description: 'Next.js 16, Tailwind CSS.', optional: false },
            { name: 'Testy i QA', description: 'Playwright E2E.', optional: false },
            { name: 'Wdrożenie', description: 'Deploy na Vercel + Render.', optional: false },
        ],
        excludes: ['Hosting i domeny (po stronie klienta)'],
        assumptionText: 'Klient dostarcza materiały w ciągu 3 dni roboczych.',
    },
    timeline: {
        steps: [
            { name: 'E2E-TimelineKickoff', duration: '3 dni', description: 'Ustalenie zakresu.', active: true },
            { name: 'Projekt UX', duration: '1 tyg.', description: 'Makiety.', active: false },
            { name: 'Implementacja', duration: '3 tyg.', description: 'Backend + frontend.', active: false },
            { name: 'QA', duration: '4 dni', description: 'Testy.', active: false },
            { name: 'Wdrożenie', duration: '2 dni', description: 'Go-live.', active: false },
        ],
        startDate: '2026-07-01',
        endDate: '2026-08-15',
    },
    pricing: {
        pricingMode: 'simple' as const,
        priceType: 'net' as const,
        simplePrice: 'E2E-25000',
        simpleIncludes: [
            'Analiza i projekt UX',
            'Implementacja backendu i frontendu',
            '3 rundy poprawek',
        ],
        categories: [],
        payments: [
            { percent: '30', amount: '7 500', when: 'przy podpisaniu umowy' },
            { percent: '40', amount: '10 000', when: 'po etapie I' },
            { percent: '30', amount: '7 500', when: 'po wdrożeniu' },
        ],
        paymentNote: 'Faktura VAT po zatwierdzeniu każdego etapu.',
        priceOverride: null,
    },
    terms: {
        cards: [
            { icon: '📄', title: 'E2E-TermsFormaUmowy', text: 'Kontrakt B2B — umowa o dzieło.' },
            { icon: '🔒', title: 'Poufność', text: 'NDA obowiązuje przez 3 lata.' },
            { icon: '©️', title: 'Prawa autorskie', text: 'Po opłaceniu ostatniej faktury.' },
            { icon: '🔄', title: 'Poprawki', text: '3 rundy bezpłatnych poprawek.' },
            { icon: '⚖️', title: 'Odpowiedzialność', text: 'Ograniczona do wartości kontraktu.' },
            { icon: '📅', title: 'Wypowiedzenie', text: '14-dniowy okres wypowiedzenia.' },
        ],
    },
    footer: {
        ctaTitle: 'Gotowy żeby zacząć?',
        ctaSubtitle: 'Napisz — odpiszę w ciągu',
        responseHours: '24',
        tagline: 'E2E footer tagline.',
        linkedinUrl: '#',
        githubUrl: '#',
        footerEmail: 'jan@e2e.pl',
        footerPhone: '+48 123 456 789',
        footerWebsite: 'www.e2e.pl',
    },
}

// ── Test state ─────────────────────────────────────────────────────────────────

let offerId: string
let accessToken: string

// ── Helpers ────────────────────────────────────────────────────────────────────

async function setupOffer(browser: Browser): Promise<void> {
    const page = await browser.newPage()
    try {
        await login(page)
        accessToken = await getAccessToken(page)
        const clientId = await ensureClientId(accessToken, page.request)
        offerId = await seedOffer(accessToken, page.request, {
            templateType: 'universal',
            blocks: UNIVERSAL_BLOCKS,
            title: `E2E-Smoke-Universal-${Date.now()}`,
            clientId,
        })
    } finally {
        await page.close()
    }
}

async function cleanupOffer(browser: Browser): Promise<void> {
    if (!offerId || !accessToken) return
    const page = await browser.newPage()
    try {
        await deleteOffer(accessToken, page.request, offerId)
    } finally {
        await page.close()
    }
}

// ── Tests ──────────────────────────────────────────────────────────────────────

test.describe('Smoke: universal template PDF pipeline', () => {
    test.setTimeout(90_000)

    test.beforeAll(async ({ browser }) => {
        test.setTimeout(120_000)
        await setupOffer(browser)
    })

    test.afterAll(async ({ browser }) => {
        await cleanupOffer(browser)
    })

    test.beforeEach(async ({ page }) => {
        await login(page)
    })

    test('preview HTML contains all section markers', async ({ page }) => {
        await assertPreviewHtml(page, `/api/offers/${offerId}/universal/preview`, {
            requiredSentinels: [
                'E2E-Universal-SummaryTitle',   // summary.title
                'E2E-NeedsSourceNote',           // needs.sourceNote
                'E2E-ScopeItem-Analiza',         // scope item name
                'E2E-TimelineKickoff',           // timeline step name
                'E2E-25000',                     // pricing.simplePrice
                'E2E-TermsFormaUmowy',           // terms card title
            ],
        })
    })

    test('PDF is a valid, complete file', async ({ page }) => {
        await assertValidPdf(page, `/api/offers/${offerId}/pdf/universal`, {
            minBytes: 30_000,
            expectedTexts: ['E2E-Universal-SummaryTitle', 'E2E-TimelineKickoff', 'E2E-TermsFormaUmowy'],
        })
    })

    test('preview renders in browser without critical errors', async ({ page }) => {
        await assertPreviewRenders(page, `/api/offers/${offerId}/universal/preview`)
    })
})

// tests/e2e/contract-templates.spec.ts
// E2E tests for all 5 Puppeteer contract template PDF pipelines.
// One describe block per template; each contains exactly one test.
//
// Validation layers per test:
//   HTML preview: sentinels for every section + forbidden garbage patterns
//   PDF bytes: %PDF- header, %%EOF footer, content-type, min size + text extraction
//   Browser render: loads preview in Playwright, checks console errors
//
// Templates: short, services, dedicated, sla, mobile
// (classic uses only form fields — no Puppeteer route exists for it)

import { test, type Browser } from '@playwright/test'
import {
    login,
    getAccessToken,
    ensureClientId,
    seedContract,
    deleteContract,
    assertPreviewHtml,
    assertValidPdf,
    assertPreviewRenders,
} from './template-helpers'

// ─── Shared lifecycle helpers ──────────────────────────────────────────────────

type LifecycleState = { contractId: string; token: string }

async function setupContract(
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
        const contractId = await seedContract(token, page.request, {
            templateType,
            blocks,
            title: `${titlePrefix}-${Date.now()}`,
            clientId,
        })
        return { contractId, token }
    } finally {
        await page.close()
    }
}

async function cleanupContract(browser: Browser, state: LifecycleState): Promise<void> {
    const page = await browser.newPage()
    try {
        await deleteContract(state.token, page.request, state.contractId)
    } finally {
        await page.close()
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// SHORT
// Umowa krótka (zielony design) — 10 sekcji, każda z edytowalnym sectionTitle.
// Wszystkie sekcje aktywne; unikalne sectionTitle jako sentinele HTML,
// treść paragrafowa jako sentinele PDF.
// ══════════════════════════════════════════════════════════════════════════════

const SHORT_BLOCKS = {
    version: 1 as const,
    sections: [
        'parties', 'subject', 'deadline', 'payment', 'obligations',
        'acceptance', 'copyright', 'warranty', 'confidentiality', 'finalProvisions',
    ],
    header: {
        kicker: 'E2E-Short-Kicker',
        title: 'E2E-Short-ContractTitle',
        contractNumber: 'E2E/SHORT/001',
        city: 'E2E-Miasto',
        date: '2026-07-01',
        footerWebsite: 'e2e-short.test',
        logoUrl: '',
        logoDarkUrl: '',
    },
    parties: {
        enabled: true,
        sectionTitle: 'E2E-Short-Parties',
        contractorRole: 'Wykonawca',
        contractor: {
            firmName: 'E2E-Short-ContractorFirm',
            address: 'ul. Testowa 1, 00-001 Warszawa',
            nip: '1234567890',
            representative: 'Jan E2E',
        },
        clientRole: 'Zamawiający',
        clientFirmLabel: 'Firma',
        client: {
            firmName: 'E2E-Short-ClientFirm',
            address: 'ul. Klienta 2, 00-002 Kraków',
            nip: '9876543210',
            representative: 'Anna E2E',
        },
    },
    subject: {
        enabled: true,
        sectionTitle: 'E2E-Short-Subject',
        isNewSite: true,
        isModernization: false,
        technology: 'E2E-Short-Technology',
        scopeItems: [
            'E2E-Short-ScopeItem1 — projekt graficzny i implementacja strony.',
            'E2E-Short-ScopeItem2 — konfiguracja panelu administracyjnego.',
        ],
        additionalNote: 'E2E-Short-AdditionalNote — wszelkie prace dodatkowe wymagają aneksu.',
    },
    deadline: {
        enabled: true,
        sectionTitle: 'E2E-Short-Deadline',
        startDate: '2026-07-01',
        endDate: '2026-09-30',
    },
    payment: {
        enabled: true,
        sectionTitle: 'E2E-Short-Payment',
        netAmount: '10000',
        vatRate: '23',
        vatAmount: '2300',
        grossAmount: '12300',
        advancePercent: '50',
        finalPercent: '50',
        finalPaymentDays: '14',
        bankAccount: 'PL00 1234 5678 9012 3456 7890 1234',
    },
    obligations: {
        enabled: true,
        sectionTitle: 'E2E-Short-Obligations',
        materialsDays: '7',
        accessDays: '7',
        responseDays: '3',
    },
    acceptance: {
        enabled: true,
        sectionTitle: 'E2E-Short-Acceptance',
        revisionRounds: '2',
        reviewDays: '5',
        hourlyRate: '200',
    },
    copyright: {
        enabled: true,
        sectionTitle: 'E2E-Short-Copyright',
        items: [
            'E2E-Short-CopyrightItem1 — przeniesienie autorskich praw majątkowych.',
            'E2E-Short-CopyrightItem2 — prawo do portfolio wykonawcy.',
        ],
    },
    warranty: {
        enabled: true,
        sectionTitle: 'E2E-Short-Warranty',
        warrantyMonths: '12',
        fixDays: '10',
    },
    confidentiality: {
        enabled: true,
        sectionTitle: 'E2E-Short-Confidentiality',
        items: ['E2E-Short-ConfidentialityItem — obowiązek zachowania poufności przez 3 lata.'],
    },
    finalProvisions: {
        enabled: true,
        sectionTitle: 'E2E-Short-FinalProvisions',
        items: [
            'E2E-Short-FinalProvision1 — stosuje się przepisy Kodeksu Cywilnego.',
            'E2E-Short-FinalProvision2 — zmiany umowy w formie pisemnej.',
        ],
    },
    signatures: {
        contractorTitle: 'Wykonawca',
        contractorFirm: 'E2E-Short-SigContractorFirm',
        contractorRepresentative: 'Jan E2E',
        contractorDate: '2026-07-01',
        clientTitle: 'Zamawiający',
        clientFirm: 'E2E-Short-SigClientFirm',
        clientRepresentative: 'Anna E2E',
        clientDate: '2026-07-01',
    },
}

test.describe('Contract template: short', () => {
    test.setTimeout(120_000)

    let state: LifecycleState

    test.beforeAll(async ({ browser }) => {
        test.setTimeout(150_000)
        state = await setupContract(browser, 'short', SHORT_BLOCKS, 'E2E-Short')
    })

    test.afterAll(async ({ browser }) => {
        if (state) await cleanupContract(browser, state)
    })

    test.beforeEach(async ({ page }) => {
        await login(page)
    })

    test('preview HTML, PDF, and browser render are all valid with all 10 sections active', async ({ page }) => {
        // 1. HTML preview — all 10 sectionTitle sentinels + body content sentinels
        await assertPreviewHtml(
            page,
            `/api/contracts/${state.contractId}/short/preview`,
            {
                requiredSentinels: [
                    // sectionTitle per section (proves each section was rendered)
                    'E2E-Short-Parties',
                    'E2E-Short-Subject',
                    'E2E-Short-Deadline',
                    'E2E-Short-Payment',
                    'E2E-Short-Obligations',
                    'E2E-Short-Acceptance',
                    'E2E-Short-Copyright',
                    'E2E-Short-Warranty',
                    'E2E-Short-Confidentiality',
                    'E2E-Short-FinalProvisions',
                    // body content (proves data flows through to rendered HTML)
                    'E2E-Short-ContractorFirm',
                    'E2E-Short-ClientFirm',
                    'E2E-Short-ScopeItem1',
                    'E2E-Short-CopyrightItem1',
                    'E2E-Short-ConfidentialityItem',
                    'E2E-Short-FinalProvision1',
                ],
            },
        )

        // 2. PDF validation — valid file structure + body text extraction
        await assertValidPdf(
            page,
            `/api/contracts/${state.contractId}/pdf/short`,
            {
                minBytes: 50_000,
                // Body text (paragraph/list items) — no CSS text-transform, extracts cleanly
                expectedTexts: [
                    'E2E-Short-ContractorFirm',
                    'E2E-Short-ClientFirm',
                    'E2E-Short-ScopeItem1',
                ],
            },
        )

        // 3. Browser render — no critical JS console errors
        await assertPreviewRenders(page, `/api/contracts/${state.contractId}/short/preview`)
    })
})

// ══════════════════════════════════════════════════════════════════════════════
// SERVICES
// Umowa strona internetowa (granat/złoto) — 14 sekcji, każda z sectionTitle.
// Wszystkie sekcje aktywne.
// ══════════════════════════════════════════════════════════════════════════════

const SERVICES_BLOCKS = {
    version: 1 as const,
    sections: [
        'parties', 'subject', 'scope', 'obligations', 'timeline', 'payment',
        'revisions', 'acceptance', 'copyright', 'confidentiality', 'liability',
        'warranty', 'termination', 'general',
    ],
    header: {
        websiteUrl: 'e2e-services.test',
        contractTitle: 'E2E-Srv-ContractTitle',
        contractNumber: 'E2E/SRV/001',
        date: '2026-07-01',
        place: 'Warszawa',
        logoUrl: '',
        logoDarkUrl: '',
    },
    parties: {
        enabled: true,
        sectionTitle: 'E2E-Srv-Parties',
        contractorRole: 'Wykonawca',
        contractor: {
            firmName: 'E2E-Srv-ContractorFirm',
            address: 'ul. Webowa 1, 00-001 Warszawa',
            nip: '1234567890',
            email: 'e2e@contractor.test',
            phone: '+48 123 456 789',
            representative: 'Jan E2E',
        },
        clientRole: 'Zamawiający',
        client: {
            firmName: 'E2E-Srv-ClientFirm',
            address: 'ul. Klienta 2, 00-002 Gdańsk',
            nip: '9876543210',
            email: 'e2e@client.test',
            phone: '+48 987 654 321',
            representative: 'Anna E2E',
        },
    },
    subject: {
        enabled: true,
        sectionTitle: 'E2E-Srv-Subject',
        domain: 'e2e-strona.test',
        technology: 'E2E-Srv-Technology',
        graphicBy: 'contractor' as const,
    },
    scope: {
        enabled: true,
        sectionTitle: 'E2E-Srv-Scope',
        items: [
            { id: '1', text: 'E2E-Srv-ScopeItem1 — projekt graficzny i implementacja.' },
            { id: '2', text: 'E2E-Srv-ScopeItem2 — responsywność RWD i testy.' },
            { id: '3', text: 'E2E-Srv-ScopeItem3 — certyfikat SSL.' },
        ],
        exclusions: 'E2E-Srv-ScopeExclusions — tworzenie treści, pozycjonowanie SEO.',
    },
    obligations: {
        enabled: true,
        sectionTitle: 'E2E-Srv-Obligations',
        materialsDeadline: '2026-07-15',
        responseBusinessDays: '3',
        additionalItems: [
            'E2E-Srv-ObligationItem1 — treści tekstowe do wszystkich podstron.',
            'E2E-Srv-ObligationItem2 — logotyp w formacie wektorowym.',
        ],
    },
    timeline: {
        enabled: true,
        sectionTitle: 'E2E-Srv-Timeline',
        startDate: '2026-07-01',
        endDate: '2026-09-30',
        startBusinessDays: '5',
    },
    payment: {
        enabled: true,
        sectionTitle: 'E2E-Srv-Payment',
        netAmount: '8000',
        vatRate: '23',
        bankAccount: 'PL00 9876 5432 1098 7654 3210 9876',
        invoiceDays: '14',
        rows: [
            { label: 'Zaliczka', amount: '50% — 4 920 zł', condition: 'E2E-Srv-PayCondition1' },
            { label: 'Płatność końcowa', amount: '50% — 4 920 zł', condition: 'E2E-Srv-PayCondition2' },
        ],
    },
    revisions: {
        enabled: true,
        sectionTitle: 'E2E-Srv-Revisions',
        graphicRounds: '2',
        siteRounds: '2',
        hourlyRate: '200',
    },
    acceptance: {
        enabled: true,
        sectionTitle: 'E2E-Srv-Acceptance',
        reviewBusinessDays: '5',
        deliverables: [
            'E2E-Srv-Deliverable1 — dane do panelu CMS.',
            'E2E-Srv-Deliverable2 — dane do hostingu.',
        ],
    },
    copyright: {
        enabled: true,
        sectionTitle: 'E2E-Srv-Copyright',
        items: [
            'E2E-Srv-CopyrightItem1 — przeniesienie autorskich praw majątkowych po zapłacie.',
            'E2E-Srv-CopyrightItem2 — prawo do portfolio wykonawcy.',
        ],
    },
    confidentiality: {
        enabled: true,
        sectionTitle: 'E2E-Srv-Confidentiality',
        years: '3',
    },
    liability: {
        enabled: true,
        sectionTitle: 'E2E-Srv-Liability',
        items: [
            'E2E-Srv-LiabilityItem1 — gwarancja poprawności w aktualnych przeglądarkach.',
            'E2E-Srv-LiabilityItem2 — ograniczenie odpowiedzialności do kwoty wynagrodzenia.',
        ],
    },
    warranty: {
        enabled: true,
        sectionTitle: 'E2E-Srv-Warranty',
        months: '12',
        fixBusinessDays: '10',
        contactEmail: 'e2e-warranty@contractor.test',
    },
    termination: {
        enabled: true,
        sectionTitle: 'E2E-Srv-Termination',
        noticeDays: '14',
        paymentDelayDays: '14',
        inactivityDays: '30',
    },
    general: {
        enabled: true,
        sectionTitle: 'E2E-Srv-General',
        items: [
            'E2E-Srv-GeneralItem1 — stosuje się przepisy Kodeksu Cywilnego.',
            'E2E-Srv-GeneralItem2 — zmiany umowy wymagają formy pisemnej.',
        ],
    },
    signatures: {
        contractorTitle: 'Wykonawca',
        contractorName: 'Jan E2E',
        contractorDate: '2026-07-01',
        clientTitle: 'Zamawiający',
        clientName: 'Anna E2E',
        clientDate: '2026-07-01',
    },
}

test.describe('Contract template: services', () => {
    test.setTimeout(120_000)

    let state: LifecycleState

    test.beforeAll(async ({ browser }) => {
        test.setTimeout(150_000)
        state = await setupContract(browser, 'services', SERVICES_BLOCKS, 'E2E-Services')
    })

    test.afterAll(async ({ browser }) => {
        if (state) await cleanupContract(browser, state)
    })

    test.beforeEach(async ({ page }) => {
        await login(page)
    })

    test('preview HTML, PDF, and browser render are all valid with all 14 sections active', async ({ page }) => {
        // 1. HTML preview — all 14 sectionTitle sentinels + body content sentinels
        await assertPreviewHtml(
            page,
            `/api/contracts/${state.contractId}/services/preview`,
            {
                requiredSentinels: [
                    // sectionTitle per section (proves each section was rendered)
                    'E2E-Srv-Parties',
                    'E2E-Srv-Subject',
                    'E2E-Srv-Scope',
                    'E2E-Srv-Obligations',
                    'E2E-Srv-Timeline',
                    'E2E-Srv-Payment',
                    'E2E-Srv-Revisions',
                    'E2E-Srv-Acceptance',
                    'E2E-Srv-Copyright',
                    'E2E-Srv-Confidentiality',
                    'E2E-Srv-Liability',
                    'E2E-Srv-Warranty',
                    'E2E-Srv-Termination',
                    'E2E-Srv-General',
                    // body content (proves data flows through)
                    'E2E-Srv-ContractorFirm',
                    'E2E-Srv-ClientFirm',
                    'E2E-Srv-ScopeItem1',
                    'E2E-Srv-LiabilityItem1',
                    'E2E-Srv-GeneralItem1',
                ],
            },
        )

        // 2. PDF validation — valid file structure + body text extraction
        await assertValidPdf(
            page,
            `/api/contracts/${state.contractId}/pdf/services`,
            {
                minBytes: 60_000,
                expectedTexts: [
                    'E2E-Srv-ContractorFirm',
                    'E2E-Srv-ClientFirm',
                    'E2E-Srv-ScopeItem1',
                ],
            },
        )

        // 3. Browser render — no critical JS console errors
        await assertPreviewRenders(page, `/api/contracts/${state.contractId}/services/preview`)
    })
})

// ══════════════════════════════════════════════════════════════════════════════
// DEDICATED
// Umowa system dedykowany (granat/złoto) — 16 sekcji bez edytowalnych
// sectionTitle; nagłówki sekcji są hardcoded (§ N — TYTUŁ).
// Sentinelami są pola treściowe wstrzyknięte w ciała paragrafów i tabel.
// ══════════════════════════════════════════════════════════════════════════════

const DEDICATED_BLOCKS = {
    version: 1 as const,
    sections: [
        'parties', 'subject', 'phases', 'spec', 'obligations', 'timeline',
        'payment', 'scopeCreep', 'acceptance', 'infrastructure', 'gdpr',
        'copyright', 'confidentiality', 'warranty', 'termination', 'general',
    ],
    header: {
        contractNumber: 'E2E/DED/001',
        date: '2026-07-01',
        website: 'e2e-dedicated.test',
        city: 'Warszawa',
        logoUrl: '',
        logoDarkUrl: '',
    },
    parties: {
        contractor: {
            name: 'E2E-Ded-ContractorName',
            address: 'ul. Deweloperska 1, 00-001 Warszawa',
            nip: '1234567890',
            email: 'e2e@ded-contractor.test',
        },
        client: {
            name: 'E2E-Ded-ClientName',
            address: 'ul. Biznesowa 2, 00-002 Poznań',
            nip: '9876543210',
            email: 'e2e@ded-client.test',
        },
    },
    subject: {
        systemName: 'E2E-Ded-SystemName',
        goal: 'E2E-Ded-SystemGoal — platforma B2B do zarządzania zamówieniami.',
        technology: 'E2E-Ded-Technology',
        accessType: 'E2E-Ded-AccessType',
    },
    phases: {
        phases: [
            { id: '1', name: 'E2E-Ded-Phase1Name', description: 'E2E-Ded-Phase1Desc', date: '2026-08-01' },
            { id: '2', name: 'E2E-Ded-Phase2Name', description: 'E2E-Ded-Phase2Desc', date: '2026-09-01' },
            { id: '3', name: 'E2E-Ded-Phase3Name', description: 'E2E-Ded-Phase3Desc', date: '2026-10-01' },
        ],
        exclusions: [
            'E2E-Ded-Exclusion1 — migracja danych z istniejących systemów.',
            'E2E-Ded-Exclusion2 — zakup licencji zewnętrznych.',
        ],
    },
    spec: {
        approvalDays: 'E2E-Ded-ApprovalDays',
    },
    obligations: {
        availabilityDays: 'E2E-Ded-AvailDays',
        responseDays: 'E2E-Ded-RespDays',
    },
    timeline: {
        startDate: '2026-07-01',
        startDays: 'E2E-Ded-StartDays',
        endDate: '2026-12-31',
    },
    payment: {
        totalNet: 'E2E-Ded-TotalNet',
        totalWords: 'E2E-Ded-TotalWords',
        vatRate: '23%',
        payments: [
            { id: '1', name: 'E2E-Ded-Payment1', condition: 'E2E-Ded-PayCond1', amount: '30 000', percent: '30' },
            { id: '2', name: 'E2E-Ded-Payment2', condition: 'E2E-Ded-PayCond2', amount: '20 000', percent: '20' },
        ],
        accountNumber: 'PL00 1234 5678 9012 3456 7890 1234',
        paymentDays: '14',
    },
    scopeCreep: {
        evaluationDays: 'E2E-Ded-EvalDays',
        freeHoursLimit: 'E2E-Ded-FreeHours',
    },
    acceptance: {
        reviewDays: 'E2E-Ded-ReviewDays',
        trainingHours: 'E2E-Ded-TrainingHours',
    },
    infrastructure: {
        productionProvider: 'E2E-Ded-InfraProvider',
    },
    gdpr: {
        note: 'E2E-Ded-GdprNote — strony zawrą umowę powierzenia przetwarzania danych.',
    },
    copyright: {
        note: 'E2E-Ded-CopyrightNote — kod przekazany po zaksięgowaniu pełnego wynagrodzenia.',
    },
    confidentiality: {
        years: 'E2E-Ded-ConfYears',
    },
    warranty: {
        months: 'E2E-Ded-WarrantyMonths',
        fixDays: 'E2E-Ded-WarrantyFixDays',
    },
    termination: {
        noticeDays: 'E2E-Ded-NoticeDays',
        immediatePaymentDays: 'E2E-Ded-ImmediatePayDays',
        noCoopDays: 'E2E-Ded-NoCoopDays',
    },
    general: {
        note: 'E2E-Ded-GeneralNote — umowę sporządzono w dwóch egzemplarzach.',
    },
    signatures: {
        contractorName: 'Jan E2E',
        contractorDate: '2026-07-01',
        clientName: 'Anna E2E',
        clientDate: '2026-07-01',
        footerNote: 'E2E-Ded-FooterNote — Załącznik nr 1 zostanie dołączony po Etapie 1.',
    },
}

test.describe('Contract template: dedicated', () => {
    test.setTimeout(120_000)

    let state: LifecycleState

    test.beforeAll(async ({ browser }) => {
        test.setTimeout(150_000)
        state = await setupContract(browser, 'dedicated', DEDICATED_BLOCKS, 'E2E-Dedicated')
    })

    test.afterAll(async ({ browser }) => {
        if (state) await cleanupContract(browser, state)
    })

    test.beforeEach(async ({ page }) => {
        await login(page)
    })

    test('preview HTML, PDF, and browser render are all valid with all 16 sections active', async ({ page }) => {
        // 1. HTML preview — data sentinels spread across all 16 sections
        await assertPreviewHtml(
            page,
            `/api/contracts/${state.contractId}/dedicated/preview`,
            {
                requiredSentinels: [
                    // § 1 parties — party name in box
                    'E2E-Ded-ContractorName',
                    'E2E-Ded-ClientName',
                    // § 2 subject — system name and goal in paragraph list
                    'E2E-Ded-SystemName',
                    'E2E-Ded-SystemGoal',
                    // § 3 phases — phase names in table rows
                    'E2E-Ded-Phase1Name',
                    'E2E-Ded-Phase2Name',
                    // § 4 spec — approvalDays in sentence
                    'E2E-Ded-ApprovalDays',
                    // § 5 obligations — availabilityDays in sentence
                    'E2E-Ded-AvailDays',
                    // § 7 payment — totalNet in paragraph + payment row names
                    'E2E-Ded-TotalNet',
                    'E2E-Ded-Payment1',
                    // § 8 scope creep — freeHoursLimit in sentence
                    'E2E-Ded-FreeHours',
                    // § 9 acceptance — trainingHours in sentence
                    'E2E-Ded-TrainingHours',
                    // § 10 infrastructure — productionProvider in sentence
                    'E2E-Ded-InfraProvider',
                    // § 11 gdpr — note (conditional render when non-empty)
                    'E2E-Ded-GdprNote',
                    // § 12 copyright — note (conditional render when non-empty)
                    'E2E-Ded-CopyrightNote',
                    // § 13 confidentiality — years in sentence
                    'E2E-Ded-ConfYears',
                    // § 14 warranty — months in sentence
                    'E2E-Ded-WarrantyMonths',
                    // § 15 termination — noticeDays in sentence
                    'E2E-Ded-NoticeDays',
                    // § 16 general — note (conditional render when non-empty)
                    'E2E-Ded-GeneralNote',
                ],
            },
        )

        // 2. PDF validation — valid file structure + body text extraction
        await assertValidPdf(
            page,
            `/api/contracts/${state.contractId}/pdf/dedicated`,
            {
                minBytes: 60_000,
                // Body paragraph text — no CSS text-transform, extracts cleanly
                expectedTexts: [
                    'E2E-Ded-ContractorName',
                    'E2E-Ded-SystemName',
                    'E2E-Ded-Phase1Name',
                ],
            },
        )

        // 3. Browser render — no critical JS console errors
        await assertPreviewRenders(page, `/api/contracts/${state.contractId}/dedicated/preview`)
    })
})

// ══════════════════════════════════════════════════════════════════════════════
// SLA
// Umowa opieka IT — 12 sekcji bez edytowalnych sectionTitle.
// Nagłówki sekcji hardcoded (§ N — TYTUŁ); sentinele oparte o pola treściowe.
// ══════════════════════════════════════════════════════════════════════════════

const SLA_BLOCKS = {
    version: 1 as const,
    sections: [
        'parties', 'subject', 'package', 'services', 'priorities',
        'incidents', 'obligations', 'reporting', 'confidentiality',
        'liability', 'termination', 'general',
    ],
    header: {
        contractNumber: 'E2E/SLA/001',
        date: '2026-07-01',
        website: 'e2e-sla.test',
        city: 'Warszawa',
        logoUrl: '',
        logoDarkUrl: '',
    },
    parties: {
        provider: {
            name: 'E2E-Sla-ProviderName',
            address: 'ul. Serwerowa 1, 00-001 Warszawa',
            nip: '1234567890',
            email: 'e2e@sla-provider.test',
            phone: '+48 123 456 789',
        },
        client: {
            name: 'E2E-Sla-ClientName',
            address: 'ul. Biznesowa 2, 00-002 Kraków',
            nip: '9876543210',
            email: 'e2e@sla-client.test',
            phone: '+48 987 654 321',
        },
    },
    subject: {
        systems: [
            { id: '1', name: 'E2E-Sla-System1Name', address: 'https://e2e-sla1.test' },
            { id: '2', name: 'E2E-Sla-System2Name', address: 'https://e2e-sla2.test' },
        ],
    },
    package: {
        packageName: 'E2E-Sla-PackageName',
        monthlyFee: '1500',
        vatRate: '23%',
        supportHours: '10',
        extraHourRate: '150',
        serviceHours: 'pon–pt 9:00–17:00',
        emergencyAvailability: '24/7',
        unusedHours: 'nie przechodzą',
        paymentDay: '5',
        accountNumber: 'PL00 1111 2222 3333 4444 5555 6666',
        paymentTermDays: '14',
        priceNoticeMonths: '1',
    },
    services: {
        included: [
            'E2E-Sla-ServiceIncluded1 — monitorowanie dostępności systemów.',
            'E2E-Sla-ServiceIncluded2 — aktualizacje CMS i wtyczek.',
            'E2E-Sla-ServiceIncluded3 — obsługa zgłoszeń błędów.',
        ],
        hourRate: '150',
        excluded: [
            'E2E-Sla-ServiceExcluded1 — nowe funkcjonalności i rozbudowa.',
            'E2E-Sla-ServiceExcluded2 — migracja systemu.',
        ],
    },
    priorities: {
        priorities: [
            {
                id: 'critical',
                priority: 'KRYTYCZNY',
                definition: 'E2E-Sla-PriorityDef1 — system całkowicie niedostępny.',
                reactionTime: '1 godzina',
                resolutionTime: '4 godziny',
                color: '#DC2626',
            },
            {
                id: 'high',
                priority: 'WYSOKI',
                definition: 'E2E-Sla-PriorityDef2 — część funkcji niedostępna.',
                reactionTime: '4 godziny rob.',
                resolutionTime: '2 dni rob.',
                color: '#EA580C',
            },
            {
                id: 'medium',
                priority: 'ŚREDNI',
                definition: 'E2E-Sla-PriorityDef3 — usterka widoczna, nie blokuje.',
                reactionTime: '1 dzień rob.',
                resolutionTime: '5 dni rob.',
                color: '#EAB308',
            },
        ],
        closureWorkDays: '2',
    },
    incidents: {
        email: 'e2e-incidents@sla.test',
        phone: '+48 111 222 333',
        ticketSystem: 'E2E-Sla-TicketSystem',
        closureWorkDays: '2',
    },
    obligations: {
        responseDays: 'E2E-Sla-RespDays',
    },
    reporting: {
        reportDay: '5',
        reportEmail: 'e2e-report@sla.test',
    },
    confidentiality: {
        years: 'E2E-Sla-ConfYears',
    },
    liability: {
        note: 'E2E-Sla-LiabilityNote — łączna odpowiedzialność ograniczona do 3-krotności miesięcznej opłaty.',
    },
    termination: {
        startDate: '2026-07-01',
        noticeMonths: 'E2E-Sla-NoticeMths',
        immediatePaymentDays: '14',
        handoverDays: '7',
    },
    general: {
        note: 'E2E-Sla-GeneralNote — umowę sporządzono w dwóch egzemplarzach.',
    },
    signatures: {
        providerName: 'Jan E2E',
        providerDate: '2026-07-01',
        clientName: 'Anna E2E',
        clientDate: '2026-07-01',
    },
}

test.describe('Contract template: sla', () => {
    test.setTimeout(120_000)

    let state: LifecycleState

    test.beforeAll(async ({ browser }) => {
        test.setTimeout(150_000)
        state = await setupContract(browser, 'sla', SLA_BLOCKS, 'E2E-Sla')
    })

    test.afterAll(async ({ browser }) => {
        if (state) await cleanupContract(browser, state)
    })

    test.beforeEach(async ({ page }) => {
        await login(page)
    })

    test('preview HTML, PDF, and browser render are all valid with all 12 sections active', async ({ page }) => {
        // 1. HTML preview — data sentinels spread across all 12 sections
        await assertPreviewHtml(
            page,
            `/api/contracts/${state.contractId}/sla/preview`,
            {
                requiredSentinels: [
                    // § 1 parties — provider and client names in boxes
                    'E2E-Sla-ProviderName',
                    'E2E-Sla-ClientName',
                    // § 2 subject — system names in table
                    'E2E-Sla-System1Name',
                    'E2E-Sla-System2Name',
                    // § 3 package — packageName in table row
                    'E2E-Sla-PackageName',
                    // § 4 services — included and excluded list items
                    'E2E-Sla-ServiceIncluded1',
                    'E2E-Sla-ServiceExcluded1',
                    // § 5 priorities — definition column in priority table
                    'E2E-Sla-PriorityDef1',
                    'E2E-Sla-PriorityDef2',
                    // § 6 incidents — ticketSystem (conditional render when non-empty)
                    'E2E-Sla-TicketSystem',
                    // § 7 obligations — responseDays in sentence
                    'E2E-Sla-RespDays',
                    // § 8 reporting — reportEmail in sentence
                    'e2e-report@sla.test',
                    // § 9 confidentiality — years in sentence
                    'E2E-Sla-ConfYears',
                    // § 11 termination — noticeMonths in sentence
                    'E2E-Sla-NoticeMths',
                ],
            },
        )

        // 2. PDF validation — valid file structure + body text extraction
        await assertValidPdf(
            page,
            `/api/contracts/${state.contractId}/pdf/sla`,
            {
                minBytes: 60_000,
                expectedTexts: [
                    'E2E-Sla-ProviderName',
                    'E2E-Sla-System1Name',
                    'E2E-Sla-ServiceIncluded1',
                ],
            },
        )

        // 3. Browser render — no critical JS console errors
        await assertPreviewRenders(page, `/api/contracts/${state.contractId}/sla/preview`)
    })
})

// ══════════════════════════════════════════════════════════════════════════════
// MOBILE
// Umowa aplikacja mobilna (granat/złoto) — 16 sekcji bez edytowalnych
// sectionTitle; nagłówki hardcoded (§ N — TYTUŁ). Sentinele oparte o pola treściowe.
// ══════════════════════════════════════════════════════════════════════════════

const MOBILE_BLOCKS = {
    version: 1 as const,
    sections: [
        'parties', 'subject', 'scope', 'obligations', 'timeline', 'payment',
        'revisions', 'acceptance', 'repository', 'backend', 'gdpr',
        'copyright', 'confidentiality', 'warranty', 'termination', 'general',
    ],
    header: {
        contractNumber: 'E2E/MOB/001',
        date: '2026-07-01',
        website: 'e2e-mobile.test',
        city: 'Warszawa',
        logoUrl: '',
        logoDarkUrl: '',
    },
    parties: {
        contractor: {
            name: 'E2E-Mob-ContractorName',
            address: 'ul. Mobilna 1, 00-001 Warszawa',
            nip: '1234567890',
            email: 'e2e@mob-contractor.test',
        },
        client: {
            name: 'E2E-Mob-ClientName',
            address: 'ul. Startupowa 2, 00-002 Wrocław',
            nip: '9876543210',
            email: 'e2e@mob-client.test',
        },
    },
    subject: {
        appName: 'E2E-Mob-AppName',
        technology: 'E2E-Mob-Technology',
        platforms: 'iOS i Android',
        minIos: '16',
        minAndroid: '10',
        stores: 'App Store i Google Play',
    },
    scope: {
        features: [
            'E2E-Mob-Feature1 — projekt graficzny UI/UX.',
            'E2E-Mob-Feature2 — rejestracja i logowanie użytkowników.',
            'E2E-Mob-Feature3 — powiadomienia push.',
        ],
        exclusions: [
            'E2E-Mob-Exclusion1 — opłaty za konta Apple Developer i Google Play.',
            'E2E-Mob-Exclusion2 — opłaty za serwery po dacie odbioru.',
        ],
    },
    obligations: {
        materialsDeadline: '2026-07-15',
        responseDays: 'E2E-Mob-RespDays',
    },
    timeline: {
        endDate: '2026-12-31',
        startDate: '2026-07-01',
        startDays: 'E2E-Mob-StartDays',
    },
    payment: {
        totalNet: 'E2E-Mob-TotalNet',
        totalWords: 'E2E-Mob-TotalWords',
        vatRate: '23%',
        payments: [
            { id: '1', name: 'E2E-Mob-Payment1', amount: '18 000', percent: '30', condition: 'E2E-Mob-PayCond1' },
            { id: '2', name: 'E2E-Mob-Payment2', amount: '18 000', percent: '30', condition: 'E2E-Mob-PayCond2' },
            { id: '3', name: 'E2E-Mob-Payment3', amount: '24 000', percent: '40', condition: 'E2E-Mob-PayCond3' },
        ],
        accountNumber: 'PL00 5555 6666 7777 8888 9999 0000',
        paymentDays: '14',
    },
    revisions: {
        uiRounds: 'E2E-Mob-UiRounds',
        appRounds: 'E2E-Mob-AppRounds',
        extraHourRate: '200',
    },
    acceptance: {
        reviewDays: 'E2E-Mob-ReviewDays',
    },
    repository: {
        note: 'E2E-Mob-RepoNote — GitHub z historią commitów i plikiem README.',
    },
    backend: {
        monthlyCostsDesc: 'E2E-Mob-BackendCosts — Firebase ok. 100 USD/mies.',
        hostingProvider: 'E2E-Mob-HostingProv',
    },
    gdpr: {
        note: '',
    },
    copyright: {
        note: '',
    },
    confidentiality: {
        years: 'E2E-Mob-ConfYears',
    },
    warranty: {
        iosMin: '16',
        androidMin: '10',
        months: 'E2E-Mob-WarrantyMonths',
        fixDays: 'E2E-Mob-WarrantyFixDays',
    },
    termination: {
        noticeDays: 'E2E-Mob-NoticeDays',
        immediatePaymentDays: '14',
        noCoopDays: 'E2E-Mob-NoCoopDays',
    },
    general: {
        note: 'E2E-Mob-GeneralNote — umowę sporządzono w dwóch egzemplarzach.',
    },
    signatures: {
        contractorName: 'Jan E2E',
        contractorDate: '2026-07-01',
        clientName: 'Anna E2E',
        clientDate: '2026-07-01',
    },
}

test.describe('Contract template: mobile', () => {
    test.setTimeout(120_000)

    let state: LifecycleState

    test.beforeAll(async ({ browser }) => {
        test.setTimeout(150_000)
        state = await setupContract(browser, 'mobile', MOBILE_BLOCKS, 'E2E-Mobile')
    })

    test.afterAll(async ({ browser }) => {
        if (state) await cleanupContract(browser, state)
    })

    test.beforeEach(async ({ page }) => {
        await login(page)
    })

    test('preview HTML, PDF, and browser render are all valid with all 16 sections active', async ({ page }) => {
        // 1. HTML preview — data sentinels spread across all 16 sections
        await assertPreviewHtml(
            page,
            `/api/contracts/${state.contractId}/mobile/preview`,
            {
                requiredSentinels: [
                    // § 1 parties — contractor and client names in boxes
                    'E2E-Mob-ContractorName',
                    'E2E-Mob-ClientName',
                    // § 2 subject — appName in paragraph
                    'E2E-Mob-AppName',
                    // § 3 scope — feature and exclusion list items
                    'E2E-Mob-Feature1',
                    'E2E-Mob-Feature2',
                    'E2E-Mob-Exclusion1',
                    // § 4 obligations — responseDays in sentence
                    'E2E-Mob-RespDays',
                    // § 5 timeline — startDays in sentence
                    'E2E-Mob-StartDays',
                    // § 6 payment — totalNet + payment row names in table
                    'E2E-Mob-TotalNet',
                    'E2E-Mob-Payment1',
                    // § 7 revisions — uiRounds in sentence
                    'E2E-Mob-UiRounds',
                    // § 8 acceptance — reviewDays in sentence
                    'E2E-Mob-ReviewDays',
                    // § 9 repository — note in paragraph
                    'E2E-Mob-RepoNote',
                    // § 10 backend — monthlyCostsDesc + hostingProvider in sentences
                    'E2E-Mob-BackendCosts',
                    'E2E-Mob-HostingProv',
                    // § 13 confidentiality — years in sentence
                    'E2E-Mob-ConfYears',
                    // § 14 warranty — months in sentence
                    'E2E-Mob-WarrantyMonths',
                    // § 15 termination — noticeDays in sentence
                    'E2E-Mob-NoticeDays',
                    // § 15 termination — noCoopDays in sentence
                    'E2E-Mob-NoCoopDays',
                ],
            },
        )

        // 2. PDF validation — valid file structure + body text extraction
        await assertValidPdf(
            page,
            `/api/contracts/${state.contractId}/pdf/mobile`,
            {
                minBytes: 60_000,
                expectedTexts: [
                    'E2E-Mob-ContractorName',
                    'E2E-Mob-AppName',
                    'E2E-Mob-Feature1',
                ],
            },
        )

        // 3. Browser render — no critical JS console errors
        await assertPreviewRenders(page, `/api/contracts/${state.contractId}/mobile/preview`)
    })
})

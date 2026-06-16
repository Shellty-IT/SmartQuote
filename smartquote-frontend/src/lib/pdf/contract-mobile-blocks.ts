// src/lib/pdf/contract-mobile-blocks.ts
// Block types and defaults for the "Aplikacja mobilna" contract template.

export type MobileSectionKey =
    | 'parties' | 'subject' | 'scope' | 'obligations' | 'timeline' | 'payment'
    | 'revisions' | 'acceptance' | 'repository' | 'backend' | 'gdpr'
    | 'copyright' | 'confidentiality' | 'warranty' | 'termination' | 'general'

export const ALL_MOBILE_SECTION_KEYS: MobileSectionKey[] = [
    'parties', 'subject', 'scope', 'obligations', 'timeline', 'payment',
    'revisions', 'acceptance', 'repository', 'backend', 'gdpr',
    'copyright', 'confidentiality', 'warranty', 'termination', 'general',
]

export type MobileEditableSectionKey = MobileSectionKey | 'header' | 'signatures'

// ── Sub-types ─────────────────────────────────────────────────────────────────

export interface MobileParty {
    name: string
    address: string
    nip: string
    email: string
}

export interface MobilePaymentRow {
    id: string
    name: string
    amount: string
    percent: string
    condition: string
}

// ── Block interfaces ───────────────────────────────────────────────────────────

export interface MobileHeaderBlock {
    contractNumber: string
    date: string
    website: string
    city: string
}

export interface MobilePartiesBlock {
    contractor: MobileParty
    client: MobileParty
}

export interface MobileSubjectBlock {
    appName: string
    technology: string
    platforms: string
    minIos: string
    minAndroid: string
    stores: string
}

export interface MobileScopeBlock {
    features: string[]
    exclusions: string[]
}

export interface MobileObligationsBlock {
    materialsDeadline: string
    responseDays: string
}

export interface MobileTimelineBlock {
    endDate: string
    startDate: string
    startDays: string
}

export interface MobilePaymentBlock {
    totalNet: string
    totalWords: string
    vatRate: string
    payments: MobilePaymentRow[]
    accountNumber: string
    paymentDays: string
}

export interface MobileRevisionsBlock {
    uiRounds: string
    appRounds: string
    extraHourRate: string
}

export interface MobileAcceptanceBlock {
    reviewDays: string
}

export interface MobileRepositoryBlock {
    note: string
}

export interface MobileBackendBlock {
    monthlyCostsDesc: string
    hostingProvider: string
}

export interface MobileGdprBlock {
    note: string
}

export interface MobileCopyrightBlock {
    note: string
}

export interface MobileConfidentialityBlock {
    years: string
}

export interface MobileWarrantyBlock {
    iosMin: string
    androidMin: string
    months: string
    fixDays: string
}

export interface MobileTerminationBlock {
    noticeDays: string
    immediatePaymentDays: string
    noCoopDays: string
}

export interface MobileGeneralBlock {
    note: string
}

export interface MobileSignaturesBlock {
    contractorName: string
    contractorDate: string
    clientName: string
    clientDate: string
}

// ── Top-level ─────────────────────────────────────────────────────────────────

export interface ContractMobileBlocks {
    version: 1
    sections: MobileSectionKey[]
    header: MobileHeaderBlock
    parties: MobilePartiesBlock
    subject: MobileSubjectBlock
    scope: MobileScopeBlock
    obligations: MobileObligationsBlock
    timeline: MobileTimelineBlock
    payment: MobilePaymentBlock
    revisions: MobileRevisionsBlock
    acceptance: MobileAcceptanceBlock
    repository: MobileRepositoryBlock
    backend: MobileBackendBlock
    gdpr: MobileGdprBlock
    copyright: MobileCopyrightBlock
    confidentiality: MobileConfidentialityBlock
    warranty: MobileWarrantyBlock
    termination: MobileTerminationBlock
    general: MobileGeneralBlock
    signatures: MobileSignaturesBlock
}

// ── Defaults ──────────────────────────────────────────────────────────────────

export function buildDefaultContractMobileBlocks(): ContractMobileBlocks {
    return {
        version: 1,
        sections: [...ALL_MOBILE_SECTION_KEYS],
        header: {
            contractNumber: 'MOB/2026/001',
            date: '',
            website: 'www.twoja-strona.pl',
            city: '',
        },
        parties: {
            contractor: { name: '', address: '', nip: '', email: '' },
            client: { name: '', address: '', nip: '', email: '' },
        },
        subject: {
            appName: '',
            technology: 'React Native',
            platforms: 'iOS i Android',
            minIos: '16',
            minAndroid: '10',
            stores: 'App Store i Google Play',
        },
        scope: {
            features: [
                'Projekt graficzny UI/UX',
                'Rejestracja i logowanie użytkowników',
                'Główna funkcjonalność aplikacji',
                'Powiadomienia push',
                'Testy na urządzeniach fizycznych iOS i Android',
                'Przygotowanie i publikacja w App Store i Google Play',
                'Szkolenie z obsługi panelu administracyjnego',
            ],
            exclusions: [
                'Stworzenia i opłacenia kont Apple Developer oraz Google Play',
                'Opłat za serwery i usługi zewnętrzne po dacie odbioru',
                'Aktualizacji wynikających z nowych wersji iOS/Android po upływie gwarancji',
                'Integracji z systemami zewnętrznymi nieujętymi w zakresie',
            ],
        },
        obligations: { materialsDeadline: '', responseDays: '2' },
        timeline: { endDate: '', startDate: '', startDays: '7' },
        payment: {
            totalNet: '',
            totalWords: '',
            vatRate: '23%',
            payments: [
                { id: '1', name: 'Zaliczka', amount: '', percent: '30', condition: 'W ciągu 7 dni od podpisania umowy' },
                { id: '2', name: 'Po etapie UI/UX', amount: '', percent: '30', condition: 'Po zatwierdzeniu projektu graficznego' },
                { id: '3', name: 'Płatność końcowa', amount: '', percent: '40', condition: 'Po odbiorze, przed publikacją w sklepach' },
            ],
            accountNumber: '',
            paymentDays: '14',
        },
        revisions: { uiRounds: '2', appRounds: '2', extraHourRate: '' },
        acceptance: { reviewDays: '5' },
        repository: { note: 'GitHub / GitLab / Bitbucket — do uzgodnienia' },
        backend: { monthlyCostsDesc: 'Firebase ~50–200 USD/mies. / VPS ~50–200 zł/mies.', hostingProvider: 'nie zapewnia' },
        gdpr: { note: '' },
        copyright: { note: '' },
        confidentiality: { years: '3' },
        warranty: { iosMin: '16', androidMin: '10', months: '12', fixDays: '10' },
        termination: { noticeDays: '30', immediatePaymentDays: '14', noCoopDays: '14' },
        general: { note: '' },
        signatures: { contractorName: '', contractorDate: '', clientName: '', clientDate: '' },
    }
}

// ── Merge helper ──────────────────────────────────────────────────────────────

const validSet = new Set<MobileSectionKey>(ALL_MOBILE_SECTION_KEYS)

export function mergeMobileWithDefaults(
    saved: Partial<ContractMobileBlocks> | null | undefined,
): ContractMobileBlocks {
    const def = buildDefaultContractMobileBlocks()
    if (!saved) return def
    return {
        ...def,
        ...saved,
        version: 1,
        sections: Array.isArray(saved.sections)
            ? (saved.sections as string[]).filter((k): k is MobileSectionKey => validSet.has(k as MobileSectionKey))
            : def.sections,
        header: { ...def.header, ...(saved.header ?? {}) },
        parties: {
            contractor: { ...def.parties.contractor, ...(saved.parties?.contractor ?? {}) },
            client: { ...def.parties.client, ...(saved.parties?.client ?? {}) },
        },
        subject: { ...def.subject, ...(saved.subject ?? {}) },
        scope: {
            features: Array.isArray(saved.scope?.features) ? saved.scope!.features : def.scope.features,
            exclusions: Array.isArray(saved.scope?.exclusions) ? saved.scope!.exclusions : def.scope.exclusions,
        },
        obligations: { ...def.obligations, ...(saved.obligations ?? {}) },
        timeline: { ...def.timeline, ...(saved.timeline ?? {}) },
        payment: {
            ...def.payment, ...(saved.payment ?? {}),
            payments: Array.isArray(saved.payment?.payments) ? saved.payment!.payments : def.payment.payments,
        },
        revisions: { ...def.revisions, ...(saved.revisions ?? {}) },
        acceptance: { ...def.acceptance, ...(saved.acceptance ?? {}) },
        repository: { ...def.repository, ...(saved.repository ?? {}) },
        backend: { ...def.backend, ...(saved.backend ?? {}) },
        gdpr: { ...def.gdpr, ...(saved.gdpr ?? {}) },
        copyright: { ...def.copyright, ...(saved.copyright ?? {}) },
        confidentiality: { ...def.confidentiality, ...(saved.confidentiality ?? {}) },
        warranty: { ...def.warranty, ...(saved.warranty ?? {}) },
        termination: { ...def.termination, ...(saved.termination ?? {}) },
        general: { ...def.general, ...(saved.general ?? {}) },
        signatures: { ...def.signatures, ...(saved.signatures ?? {}) },
    }
}

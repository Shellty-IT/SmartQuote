// src/lib/pdf/contract-dedicated-blocks.ts
// Block types and defaults for the "System dedykowany" contract template.

export type DedicatedSectionKey =
    | 'parties' | 'subject' | 'phases' | 'spec' | 'obligations' | 'timeline'
    | 'payment' | 'scopeCreep' | 'acceptance' | 'infrastructure' | 'gdpr'
    | 'copyright' | 'confidentiality' | 'warranty' | 'termination' | 'general'

export const ALL_DEDICATED_SECTION_KEYS: DedicatedSectionKey[] = [
    'parties', 'subject', 'phases', 'spec', 'obligations', 'timeline',
    'payment', 'scopeCreep', 'acceptance', 'infrastructure', 'gdpr',
    'copyright', 'confidentiality', 'warranty', 'termination', 'general',
]

export type DedicatedEditableSectionKey = DedicatedSectionKey | 'header' | 'signatures'

// ── Sub-types ─────────────────────────────────────────────────────────────────

export interface DedicatedParty {
    name: string
    address: string
    nip: string
    email: string
}

export interface DedicatedPhaseRow {
    id: string
    name: string
    description: string
    date: string
}

export interface DedicatedPaymentRow {
    id: string
    name: string
    condition: string
    amount: string
    percent: string
}

// ── Block interfaces ───────────────────────────────────────────────────────────

export interface DedicatedHeaderBlock {
    contractNumber: string
    date: string
    website: string
    city: string
}

export interface DedicatedPartiesBlock {
    contractor: DedicatedParty
    client: DedicatedParty
}

export interface DedicatedSubjectBlock {
    systemName: string
    goal: string
    technology: string
    accessType: string
}

export interface DedicatedPhasesBlock {
    phases: DedicatedPhaseRow[]
    exclusions: string[]
}

export interface DedicatedSpecBlock {
    approvalDays: string
}

export interface DedicatedObligationsBlock {
    availabilityDays: string
    responseDays: string
}

export interface DedicatedTimelineBlock {
    startDate: string
    startDays: string
    endDate: string
}

export interface DedicatedPaymentBlock {
    totalNet: string
    totalWords: string
    vatRate: string
    payments: DedicatedPaymentRow[]
    accountNumber: string
    paymentDays: string
}

export interface DedicatedScopeCreepBlock {
    evaluationDays: string
    freeHoursLimit: string
}

export interface DedicatedAcceptanceBlock {
    reviewDays: string
    trainingHours: string
}

export interface DedicatedInfrastructureBlock {
    productionProvider: string
}

export interface DedicatedGdprBlock {
    note: string
}

export interface DedicatedCopyrightBlock {
    note: string
}

export interface DedicatedConfidentialityBlock {
    years: string
}

export interface DedicatedWarrantyBlock {
    months: string
    fixDays: string
}

export interface DedicatedTerminationBlock {
    noticeDays: string
    immediatePaymentDays: string
    noCoopDays: string
}

export interface DedicatedGeneralBlock {
    note: string
}

export interface DedicatedSignaturesBlock {
    contractorName: string
    contractorDate: string
    clientName: string
    clientDate: string
    footerNote: string
}

// ── Top-level ─────────────────────────────────────────────────────────────────

export interface ContractDedicatedBlocks {
    version: 1
    sections: DedicatedSectionKey[]
    header: DedicatedHeaderBlock
    parties: DedicatedPartiesBlock
    subject: DedicatedSubjectBlock
    phases: DedicatedPhasesBlock
    spec: DedicatedSpecBlock
    obligations: DedicatedObligationsBlock
    timeline: DedicatedTimelineBlock
    payment: DedicatedPaymentBlock
    scopeCreep: DedicatedScopeCreepBlock
    acceptance: DedicatedAcceptanceBlock
    infrastructure: DedicatedInfrastructureBlock
    gdpr: DedicatedGdprBlock
    copyright: DedicatedCopyrightBlock
    confidentiality: DedicatedConfidentialityBlock
    warranty: DedicatedWarrantyBlock
    termination: DedicatedTerminationBlock
    general: DedicatedGeneralBlock
    signatures: DedicatedSignaturesBlock
}

// ── Defaults ──────────────────────────────────────────────────────────────────

export function buildDefaultContractDedicatedBlocks(): ContractDedicatedBlocks {
    return {
        version: 1,
        sections: [...ALL_DEDICATED_SECTION_KEYS],
        header: {
            contractNumber: 'SYS/2026/001',
            date: '',
            website: 'www.twoja-strona.pl',
            city: '',
        },
        parties: {
            contractor: { name: '', address: '', nip: '', email: '' },
            client: { name: '', address: '', nip: '', email: '' },
        },
        subject: {
            systemName: '',
            goal: 'system zarządzania zamówieniami / platforma B2B / portal klientów',
            technology: 'React + Node.js',
            accessType: 'aplikacja webowa przez przeglądarkę',
        },
        phases: {
            phases: [
                { id: '1', name: 'Specyfikacja techniczna', description: 'Analiza wymagań, architektura systemu, makiety UX — dokument do zatwierdzenia', date: '' },
                { id: '2', name: 'Projekt UI/UX', description: 'Projekt graficzny interfejsu — ekrany do zatwierdzenia', date: '' },
                { id: '3', name: 'Development — Etap I', description: '', date: '' },
                { id: '4', name: 'Development — Etap II', description: '', date: '' },
                { id: '5', name: 'Testy i poprawki', description: 'Testy funkcjonalne, testy bezpieczeństwa, poprawki', date: '' },
                { id: '6', name: 'Wdrożenie i odbiór', description: 'Uruchomienie na serwerze produkcyjnym, szkolenie, przekazanie kodu', date: '' },
            ],
            exclusions: [
                'Migracji danych z istniejących systemów — chyba że ujęta w Specyfikacji Technicznej',
                'Zakupu licencji na oprogramowanie zewnętrzne',
                'Administracji serwerem produkcyjnym po wdrożeniu',
                'Szkoleń poza zakresem określonym w harmonogramie',
            ],
        },
        spec: { approvalDays: '5' },
        obligations: { availabilityDays: '2', responseDays: '2' },
        timeline: { startDate: '', startDays: '7', endDate: '' },
        payment: {
            totalNet: '',
            totalWords: '',
            vatRate: '23%',
            payments: [
                { id: '1', name: 'Zaliczka', condition: 'Podpisanie umowy', amount: '', percent: '30' },
                { id: '2', name: 'Płatność 2', condition: 'Zatwierdzenie Specyfikacji Technicznej', amount: '', percent: '20' },
                { id: '3', name: 'Płatność 3', condition: 'Zatwierdzenie projektu UI/UX', amount: '', percent: '15' },
                { id: '4', name: 'Płatność 4', condition: 'Odbiór Development Etap I', amount: '', percent: '20' },
                { id: '5', name: 'Płatność końcowa', condition: 'Odbiór końcowy systemu', amount: '', percent: '15' },
            ],
            accountNumber: '',
            paymentDays: '14',
        },
        scopeCreep: { evaluationDays: '3', freeHoursLimit: '2' },
        acceptance: { reviewDays: '5', trainingHours: '4' },
        infrastructure: { productionProvider: 'Zamawiający' },
        gdpr: { note: '' },
        copyright: { note: '' },
        confidentiality: { years: '3' },
        warranty: { months: '12', fixDays: '5' },
        termination: { noticeDays: '30', immediatePaymentDays: '14', noCoopDays: '14' },
        general: { note: '' },
        signatures: { contractorName: '', contractorDate: '', clientName: '', clientDate: '', footerNote: 'Załącznik nr 1 (Specyfikacja Techniczna) zostanie dołączony po zakończeniu Etapu 1 i podpisany przez obie Strony.' },
    }
}

// ── Merge helper ──────────────────────────────────────────────────────────────

const validSet = new Set<DedicatedSectionKey>(ALL_DEDICATED_SECTION_KEYS)

export function mergeDedicatedWithDefaults(
    saved: Partial<ContractDedicatedBlocks> | null | undefined,
): ContractDedicatedBlocks {
    const def = buildDefaultContractDedicatedBlocks()
    if (!saved) return def
    return {
        ...def,
        ...saved,
        version: 1,
        sections: Array.isArray(saved.sections)
            ? (saved.sections as string[]).filter((k): k is DedicatedSectionKey => validSet.has(k as DedicatedSectionKey))
            : def.sections,
        header: { ...def.header, ...(saved.header ?? {}) },
        parties: {
            contractor: { ...def.parties.contractor, ...(saved.parties?.contractor ?? {}) },
            client: { ...def.parties.client, ...(saved.parties?.client ?? {}) },
        },
        subject: { ...def.subject, ...(saved.subject ?? {}) },
        phases: {
            phases: Array.isArray(saved.phases?.phases) ? saved.phases!.phases : def.phases.phases,
            exclusions: Array.isArray(saved.phases?.exclusions) ? saved.phases!.exclusions : def.phases.exclusions,
        },
        spec: { ...def.spec, ...(saved.spec ?? {}) },
        obligations: { ...def.obligations, ...(saved.obligations ?? {}) },
        timeline: { ...def.timeline, ...(saved.timeline ?? {}) },
        payment: {
            ...def.payment, ...(saved.payment ?? {}),
            payments: Array.isArray(saved.payment?.payments) ? saved.payment!.payments : def.payment.payments,
        },
        scopeCreep: { ...def.scopeCreep, ...(saved.scopeCreep ?? {}) },
        acceptance: { ...def.acceptance, ...(saved.acceptance ?? {}) },
        infrastructure: { ...def.infrastructure, ...(saved.infrastructure ?? {}) },
        gdpr: { ...def.gdpr, ...(saved.gdpr ?? {}) },
        copyright: { ...def.copyright, ...(saved.copyright ?? {}) },
        confidentiality: { ...def.confidentiality, ...(saved.confidentiality ?? {}) },
        warranty: { ...def.warranty, ...(saved.warranty ?? {}) },
        termination: { ...def.termination, ...(saved.termination ?? {}) },
        general: { ...def.general, ...(saved.general ?? {}) },
        signatures: { ...def.signatures, ...(saved.signatures ?? {}) },
    }
}

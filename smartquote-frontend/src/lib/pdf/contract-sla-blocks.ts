// src/lib/pdf/contract-sla-blocks.ts
// Block types and defaults for the "Opieka IT" (SLA) contract template.

export type SlaSectionKey =
    | 'parties' | 'subject' | 'package' | 'services' | 'priorities'
    | 'incidents' | 'obligations' | 'reporting' | 'confidentiality'
    | 'liability' | 'termination' | 'general'

export const ALL_SLA_SECTION_KEYS: SlaSectionKey[] = [
    'parties', 'subject', 'package', 'services', 'priorities',
    'incidents', 'obligations', 'reporting', 'confidentiality',
    'liability', 'termination', 'general',
]

export type SlaEditableSectionKey = SlaSectionKey | 'header' | 'signatures'
export type SlaPageBreakKey = 'header' | SlaSectionKey

// ── Sub-types ─────────────────────────────────────────────────────────────────

export interface SlaParty {
    name: string
    address: string
    nip: string
    email: string
    phone: string
}

export interface SlaSystemRow {
    id: string
    name: string
    address: string
}

export interface SlaPriorityRow {
    id: string
    priority: string
    definition: string
    reactionTime: string
    resolutionTime: string
    color: string
}

// ── Block interfaces ───────────────────────────────────────────────────────────

export interface SlaHeaderBlock {
    contractNumber: string
    date: string
    website: string
    city: string
    logoUrl: string
    logoDarkUrl: string
}

export interface SlaPartiesBlock {
    provider: SlaParty
    client: SlaParty
}

export interface SlaSubjectBlock {
    systems: SlaSystemRow[]
}

export interface SlaPackageBlock {
    packageName: string
    monthlyFee: string
    vatRate: string
    supportHours: string
    extraHourRate: string
    serviceHours: string
    emergencyAvailability: string
    unusedHours: string
    paymentDay: string
    accountNumber: string
    paymentTermDays: string
    priceNoticeMonths: string
}

export interface SlaServicesBlock {
    included: string[]
    hourRate: string
    excluded: string[]
}

export interface SlaPrioritiesBlock {
    priorities: SlaPriorityRow[]
    closureWorkDays: string
}

export interface SlaIncidentsBlock {
    email: string
    phone: string
    ticketSystem: string
    closureWorkDays: string
}

export interface SlaObligationsBlock {
    responseDays: string
}

export interface SlaReportingBlock {
    reportDay: string
    reportEmail: string
}

export interface SlaConfidentialityBlock {
    years: string
}

export interface SlaLiabilityBlock {
    note: string
}

export interface SlaTerminationBlock {
    startDate: string
    noticeMonths: string
    immediatePaymentDays: string
    handoverDays: string
}

export interface SlaGeneralBlock {
    note: string
}

export interface SlaSignaturesBlock {
    providerName: string
    providerDate: string
    clientName: string
    clientDate: string
}

// ── Top-level ─────────────────────────────────────────────────────────────────

export interface ContractSlaBlocks {
    version: 1
    sections: SlaSectionKey[]
    pageBreakAfter: SlaPageBreakKey[]
    header: SlaHeaderBlock
    parties: SlaPartiesBlock
    subject: SlaSubjectBlock
    package: SlaPackageBlock
    services: SlaServicesBlock
    priorities: SlaPrioritiesBlock
    incidents: SlaIncidentsBlock
    obligations: SlaObligationsBlock
    reporting: SlaReportingBlock
    confidentiality: SlaConfidentialityBlock
    liability: SlaLiabilityBlock
    termination: SlaTerminationBlock
    general: SlaGeneralBlock
    signatures: SlaSignaturesBlock
}

// ── Defaults ──────────────────────────────────────────────────────────────────

export function buildDefaultContractSlaBlocks(): ContractSlaBlocks {
    return {
        version: 1,
        sections: [...ALL_SLA_SECTION_KEYS],
        pageBreakAfter: [],
        header: {
            contractNumber: 'SLA/2026/001',
            date: '',
            website: 'www.twoja-strona.pl',
            city: '',
            logoUrl: '',
            logoDarkUrl: '',
        },
        parties: {
            provider: { name: '', address: '', nip: '', email: '', phone: '' },
            client: { name: '', address: '', nip: '', email: '', phone: '' },
        },
        subject: {
            systems: [
                { id: '1', name: '', address: '' },
                { id: '2', name: '', address: '' },
            ],
        },
        package: {
            packageName: 'STANDARD',
            monthlyFee: '',
            vatRate: '23%',
            supportHours: '10',
            extraHourRate: '',
            serviceHours: 'pon–pt, 9:00–17:00',
            emergencyAvailability: '24/7 dla priorytetów KRYTYCZNYCH',
            unusedHours: 'nie przechodzą',
            paymentDay: '5',
            accountNumber: '',
            paymentTermDays: '14',
            priceNoticeMonths: '1',
        },
        services: {
            included: [
                'Monitorowanie dostępności systemów — ciągłe',
                'Aktualizacje systemu CMS, wtyczek i bibliotek',
                'Zarządzanie certyfikatem SSL — monitoring ważności i odnowienie',
                'Wykonywanie i weryfikacja kopii zapasowych (backup) — codziennie',
                'Obsługa zgłoszeń błędów i awarii',
                'Drobne modyfikacje treści i konfiguracji — do 30 minut jednorazowo',
                'Konsultacje techniczne — w ramach puli godzin',
                'Miesięczny raport ze świadczonych usług',
            ],
            hourRate: '',
            excluded: [
                'Tworzenie nowych funkcjonalności i rozbudowa systemu',
                'Redesign i przeprojektowanie interfejsu',
                'Kampanie marketingowe i pozycjonowanie SEO',
                'Migracja systemu na nowy serwer lub platformę',
                'Odzyskiwanie danych utraconych z winy Usługobiorcy',
            ],
        },
        priorities: {
            priorities: [
                { id: 'critical', priority: 'KRYTYCZNY', definition: 'System całkowicie niedostępny, bezpośrednia strata przychodów', reactionTime: '1 godzina', resolutionTime: '4 godziny', color: '#DC2626' },
                { id: 'high', priority: 'WYSOKI', definition: 'Poważny błąd — część funkcji niedostępna', reactionTime: '4 godziny robocze', resolutionTime: '2 dni rob.', color: '#EA580C' },
                { id: 'medium', priority: 'ŚREDNI', definition: 'Usterka widoczna, nie blokuje działania', reactionTime: '1 dzień roboczy', resolutionTime: '5 dni rob.', color: '#EAB308' },
                { id: 'low', priority: 'NISKI', definition: 'Pytania, drobne zmiany, konsultacje', reactionTime: '2 dni robocze', resolutionTime: '10 dni rob.', color: '#16A34A' },
            ],
            closureWorkDays: '2',
        },
        incidents: {
            email: '',
            phone: '',
            ticketSystem: '',
            closureWorkDays: '2',
        },
        obligations: { responseDays: '2' },
        reporting: { reportDay: '5', reportEmail: '' },
        confidentiality: { years: '3' },
        liability: { note: '' },
        termination: { startDate: '', noticeMonths: '1', immediatePaymentDays: '14', handoverDays: '7' },
        general: { note: '' },
        signatures: { providerName: '', providerDate: '', clientName: '', clientDate: '' },
    }
}

// ── Merge helper ──────────────────────────────────────────────────────────────

const validSet = new Set<SlaSectionKey>(ALL_SLA_SECTION_KEYS)
const validPageBreakSet = new Set<SlaPageBreakKey>(['header', ...ALL_SLA_SECTION_KEYS])

export function mergeSlaWithDefaults(
    saved: Partial<ContractSlaBlocks> | null | undefined,
): ContractSlaBlocks {
    const def = buildDefaultContractSlaBlocks()
    if (!saved) return def
    return {
        ...def,
        ...saved,
        version: 1,
        sections: Array.isArray(saved.sections)
            ? (saved.sections as string[]).filter((k): k is SlaSectionKey => validSet.has(k as SlaSectionKey))
            : def.sections,
        pageBreakAfter: Array.isArray(saved.pageBreakAfter)
            ? (saved.pageBreakAfter as string[]).filter((k): k is SlaPageBreakKey => validPageBreakSet.has(k as SlaPageBreakKey))
            : def.pageBreakAfter,
        header: { ...def.header, ...(saved.header ?? {}) },
        parties: {
            provider: { ...def.parties.provider, ...(saved.parties?.provider ?? {}) },
            client: { ...def.parties.client, ...(saved.parties?.client ?? {}) },
        },
        subject: {
            systems: Array.isArray(saved.subject?.systems) ? saved.subject!.systems : def.subject.systems,
        },
        package: { ...def.package, ...(saved.package ?? {}) },
        services: {
            ...def.services, ...(saved.services ?? {}),
            included: Array.isArray(saved.services?.included) ? saved.services!.included : def.services.included,
            excluded: Array.isArray(saved.services?.excluded) ? saved.services!.excluded : def.services.excluded,
        },
        priorities: {
            ...def.priorities, ...(saved.priorities ?? {}),
            priorities: Array.isArray(saved.priorities?.priorities) ? saved.priorities!.priorities : def.priorities.priorities,
        },
        incidents: { ...def.incidents, ...(saved.incidents ?? {}) },
        obligations: { ...def.obligations, ...(saved.obligations ?? {}) },
        reporting: { ...def.reporting, ...(saved.reporting ?? {}) },
        confidentiality: { ...def.confidentiality, ...(saved.confidentiality ?? {}) },
        liability: { ...def.liability, ...(saved.liability ?? {}) },
        termination: { ...def.termination, ...(saved.termination ?? {}) },
        general: { ...def.general, ...(saved.general ?? {}) },
        signatures: { ...def.signatures, ...(saved.signatures ?? {}) },
    }
}

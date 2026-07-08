// src/lib/pdf/contract-services-blocks.ts
// Block types and defaults for the "Sklep internetowy" contract template.

export type ContractServicesSectionKey =
    | 'parties'
    | 'subject'
    | 'scope'
    | 'obligations'
    | 'timeline'
    | 'payment'
    | 'revisions'
    | 'acceptance'
    | 'copyright'
    | 'confidentiality'
    | 'liability'
    | 'warranty'
    | 'termination'
    | 'general'

export type ContractServicesPageBreakKey = 'header' | ContractServicesSectionKey

export const ALL_SERVICES_SECTION_KEYS: ContractServicesSectionKey[] = [
    'parties',
    'subject',
    'scope',
    'obligations',
    'timeline',
    'payment',
    'revisions',
    'acceptance',
    'copyright',
    'confidentiality',
    'liability',
    'warranty',
    'termination',
    'general',
]

// ── Block shapes ──────────────────────────────────────────────────────────────

export interface ServicesHeaderBlock {
    websiteUrl: string
    contractTitle: string
    contractNumber: string
    date: string
    place: string
    logoUrl: string
    logoDarkUrl: string
}

export interface ServicesParty {
    firmName: string
    address: string
    nip: string
    email: string
    phone: string
    representative: string
}

export interface ServicesPartiesBlock {
    enabled: boolean
    sectionTitle: string
    contractorRole: string
    contractor: ServicesParty
    clientRole: string
    client: ServicesParty
}

export interface ServicesSubjectBlock {
    enabled: boolean
    sectionTitle: string
    domain: string
    technology: string
    graphicBy: 'contractor' | 'client'
}

export interface ServicesScopeItem {
    id: string
    text: string
}

export interface ServicesScopeBlock {
    enabled: boolean
    sectionTitle: string
    items: ServicesScopeItem[]
    exclusions: string
}

export interface ServicesObligationsBlock {
    enabled: boolean
    sectionTitle: string
    materialsDeadline: string
    responseBusinessDays: string
    additionalItems: string[]
}

export interface ServicesTimelineBlock {
    enabled: boolean
    sectionTitle: string
    startDate: string
    endDate: string
    startBusinessDays: string
}

export interface ServicesPaymentRow {
    label: string
    amount: string
    condition: string
}

export interface ServicesPaymentBlock {
    enabled: boolean
    sectionTitle: string
    netAmount: string
    vatRate: string
    bankAccount: string
    invoiceDays: string
    rows: ServicesPaymentRow[]
}

export interface ServicesRevisionsBlock {
    enabled: boolean
    sectionTitle: string
    graphicRounds: string
    siteRounds: string
    hourlyRate: string
}

export interface ServicesAcceptanceBlock {
    enabled: boolean
    sectionTitle: string
    reviewBusinessDays: string
    deliverables: string[]
}

export interface ServicesCopyrightBlock {
    enabled: boolean
    sectionTitle: string
    items: string[]
}

export interface ServicesConfidentialityBlock {
    enabled: boolean
    sectionTitle: string
    years: string
}

export interface ServicesLiabilityBlock {
    enabled: boolean
    sectionTitle: string
    items: string[]
}

export interface ServicesWarrantyBlock {
    enabled: boolean
    sectionTitle: string
    months: string
    fixBusinessDays: string
    contactEmail: string
}

export interface ServicesTerminationBlock {
    enabled: boolean
    sectionTitle: string
    noticeDays: string
    paymentDelayDays: string
    inactivityDays: string
}

export interface ServicesGeneralBlock {
    enabled: boolean
    sectionTitle: string
    items: string[]
}

export interface ServicesSignaturesBlock {
    contractorTitle: string
    contractorName: string
    contractorDate: string
    clientTitle: string
    clientName: string
    clientDate: string
}

export interface ContractServicesBlocks {
    version: 1
    sections: ContractServicesSectionKey[]
    pageBreakAfter: ContractServicesPageBreakKey[]
    header: ServicesHeaderBlock
    parties: ServicesPartiesBlock
    subject: ServicesSubjectBlock
    scope: ServicesScopeBlock
    obligations: ServicesObligationsBlock
    timeline: ServicesTimelineBlock
    payment: ServicesPaymentBlock
    revisions: ServicesRevisionsBlock
    acceptance: ServicesAcceptanceBlock
    copyright: ServicesCopyrightBlock
    confidentiality: ServicesConfidentialityBlock
    liability: ServicesLiabilityBlock
    warranty: ServicesWarrantyBlock
    termination: ServicesTerminationBlock
    general: ServicesGeneralBlock
    signatures: ServicesSignaturesBlock
}

// ── Defaults ──────────────────────────────────────────────────────────────────

export function buildDefaultContractServicesBlocks(): ContractServicesBlocks {
    return {
        version: 1,
        sections: [...ALL_SERVICES_SECTION_KEYS],
        pageBreakAfter: [],

        header: {
            websiteUrl: '',
            contractTitle: 'UMOWA O WYKONANIE STRONY INTERNETOWEJ',
            contractNumber: '',
            date: '',
            place: '',
            logoUrl: '',
            logoDarkUrl: '',
        },

        parties: {
            enabled: true,
            sectionTitle: 'Strony umowy',
            contractorRole: 'Wykonawca',
            contractor: { firmName: '', address: '', nip: '', email: '', phone: '', representative: '' },
            clientRole: 'Zamawiający',
            client: { firmName: '', address: '', nip: '', email: '', phone: '', representative: '' },
        },

        subject: {
            enabled: true,
            sectionTitle: 'Przedmiot umowy',
            domain: '',
            technology: '',
            graphicBy: 'contractor',
        },

        scope: {
            enabled: true,
            sectionTitle: 'Zakres prac',
            items: [
                { id: '1', text: 'Projekt graficzny i implementacja strony zgodnie z wytycznymi Zamawiającego' },
                { id: '2', text: 'Kodowanie i wdrożenie — responsywność (mobile, tablet, desktop)' },
                { id: '3', text: 'Formularz kontaktowy' },
                { id: '4', text: 'Podstawowe SEO on-page' },
                { id: '5', text: 'Certyfikat SSL' },
                { id: '6', text: 'Szkolenie z obsługi CMS' },
            ],
            exclusions: 'tworzenie treści, zdjęcia, pozycjonowanie SEO, obsługa kampanii reklamowych',
        },

        obligations: {
            enabled: true,
            sectionTitle: 'Obowiązki Zamawiającego',
            materialsDeadline: '',
            responseBusinessDays: '3',
            additionalItems: [
                'Treści tekstowe do wszystkich podstron',
                'Logotyp w formacie wektorowym (AI, EPS, SVG)',
                'Zdjęcia i grafiki w rozdzielczości min. 1920 px',
            ],
        },

        timeline: {
            enabled: true,
            sectionTitle: 'Termin realizacji',
            startDate: '',
            endDate: '',
            startBusinessDays: '5',
        },

        payment: {
            enabled: true,
            sectionTitle: 'Wynagrodzenie i warunki płatności',
            netAmount: '',
            vatRate: '23',
            bankAccount: '',
            invoiceDays: '14',
            rows: [
                { label: 'Zaliczka', amount: '50% — … zł', condition: 'W ciągu 7 dni od podpisania umowy' },
                { label: 'Płatność końcowa', amount: '50% — … zł', condition: 'Po odbiorze, przed uruchomieniem na docelowej domenie' },
            ],
        },

        revisions: {
            enabled: true,
            sectionTitle: 'Poprawki i zmiany',
            graphicRounds: '2',
            siteRounds: '2',
            hourlyRate: '',
        },

        acceptance: {
            enabled: true,
            sectionTitle: 'Odbiór strony',
            reviewBusinessDays: '5',
            deliverables: [
                'dane dostępowe do panelu CMS',
                'dane dostępowe do hostingu / serwera',
                'dane dostępowe do panelu domeny',
            ],
        },

        copyright: {
            enabled: true,
            sectionTitle: 'Prawa autorskie',
            items: [
                'Z chwilą zaksięgowania pełnego wynagrodzenia Wykonawca przenosi na Zamawiającego autorskie prawa majątkowe do wykonanej strony internetowej na polach eksploatacji: utrwalanie i zwielokrotnianie, wprowadzenie do obrotu, publiczne udostępnianie w sieci Internet.',
                'Przeniesienie praw nie obejmuje elementów osób trzecich (szablony, wtyczki, zdjęcia stockowe, biblioteki open-source) — Zamawiający otrzymuje prawo używania zgodnie z licencją dostawcy.',
                'Do czasu zaksięgowania pełnego wynagrodzenia wszelkie prawa do wykonanej pracy pozostają przy Wykonawcy.',
                'Wykonawca ma prawo do umieszczenia informacji o wykonaniu strony w swoim portfolio i materiałach marketingowych, chyba że Zamawiający wyrazi sprzeciw na piśmie.',
            ],
        },

        confidentiality: {
            enabled: true,
            sectionTitle: 'Poufność',
            years: '3',
        },

        liability: {
            enabled: true,
            sectionTitle: 'Odpowiedzialność',
            items: [
                'Wykonawca gwarantuje, że strona będzie działać poprawnie w przeglądarkach Chrome, Firefox, Safari, Edge — w ich aktualnych wersjach w dniu odbioru.',
                'Wykonawca gwarantuje poprawne działanie strony na urządzeniach mobilnych (responsywność).',
                'Wykonawca nie ponosi odpowiedzialności za zmiany wprowadzone przez Zamawiającego lub osoby trzecie po odbiorze, dostępność zależną od dostawcy hostingu, pozycję w wyszukiwarkach ani treści dostarczone przez Zamawiającego.',
                'Łączna odpowiedzialność Wykonawcy ograniczona jest do wysokości wynagrodzenia określonego w umowie.',
            ],
        },

        warranty: {
            enabled: true,
            sectionTitle: 'Gwarancja',
            months: '12',
            fixBusinessDays: '10',
            contactEmail: '',
        },

        termination: {
            enabled: true,
            sectionTitle: 'Rozwiązanie umowy',
            noticeDays: '14',
            paymentDelayDays: '14',
            inactivityDays: '30',
        },

        general: {
            enabled: true,
            sectionTitle: 'Postanowienia końcowe',
            items: [
                'W sprawach nieuregulowanych niniejszą umową mają zastosowanie przepisy Kodeksu Cywilnego.',
                'Wszelkie zmiany umowy wymagają formy pisemnej pod rygorem nieważności.',
                'Ewentualne spory Strony będą starały się rozwiązać polubownie, a w przypadku braku porozumienia — właściwym będzie sąd siedziby Wykonawcy.',
                'Umowa sporządzona w dwóch jednobrzmiących egzemplarzach, po jednym dla każdej ze Stron.',
            ],
        },

        signatures: {
            contractorTitle: 'Wykonawca',
            contractorName: '',
            contractorDate: '',
            clientTitle: 'Zamawiający',
            clientName: '',
            clientDate: '',
        },
    }
}

export function mergeServicesWithDefaults(
    saved: Partial<ContractServicesBlocks> | null | undefined,
): ContractServicesBlocks {
    const defaults = buildDefaultContractServicesBlocks()
    if (!saved) return defaults

    const validSet = new Set<string>(ALL_SERVICES_SECTION_KEYS)
    const validPageBreakSet = new Set<string>(['header', ...ALL_SERVICES_SECTION_KEYS])
    const filterValid = (arr: ContractServicesSectionKey[]) =>
        (arr ?? []).filter((k) => validSet.has(k))
    const filterValidPageBreak = (arr: ContractServicesPageBreakKey[]) =>
        (arr ?? []).filter((k) => validPageBreakSet.has(k))

    return {
        version: 1,
        sections: Array.isArray(saved.sections) ? filterValid(saved.sections) : defaults.sections,
        pageBreakAfter: Array.isArray(saved.pageBreakAfter) ? filterValidPageBreak(saved.pageBreakAfter) : defaults.pageBreakAfter,
        header: { ...defaults.header, ...saved.header },
        parties: {
            ...defaults.parties,
            ...saved.parties,
            contractor: { ...defaults.parties.contractor, ...saved.parties?.contractor },
            client: { ...defaults.parties.client, ...saved.parties?.client },
        },
        subject: { ...defaults.subject, ...saved.subject },
        scope: {
            ...defaults.scope,
            ...saved.scope,
            items: saved.scope?.items ?? defaults.scope.items,
        },
        obligations: {
            ...defaults.obligations,
            ...saved.obligations,
            additionalItems: saved.obligations?.additionalItems ?? defaults.obligations.additionalItems,
        },
        timeline: { ...defaults.timeline, ...saved.timeline },
        payment: {
            ...defaults.payment,
            ...saved.payment,
            rows: saved.payment?.rows ?? defaults.payment.rows,
        },
        revisions: { ...defaults.revisions, ...saved.revisions },
        acceptance: {
            ...defaults.acceptance,
            ...saved.acceptance,
            deliverables: saved.acceptance?.deliverables ?? defaults.acceptance.deliverables,
        },
        copyright: {
            ...defaults.copyright,
            ...saved.copyright,
            items: saved.copyright?.items ?? defaults.copyright.items,
        },
        confidentiality: { ...defaults.confidentiality, ...saved.confidentiality },
        liability: {
            ...defaults.liability,
            ...saved.liability,
            items: saved.liability?.items ?? defaults.liability.items,
        },
        warranty: { ...defaults.warranty, ...saved.warranty },
        termination: { ...defaults.termination, ...saved.termination },
        general: {
            ...defaults.general,
            ...saved.general,
            items: saved.general?.items ?? defaults.general.items,
        },
        signatures: { ...defaults.signatures, ...saved.signatures },
    }
}

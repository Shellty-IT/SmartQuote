// src/lib/pdf/contract-short-blocks.ts
// Type definitions and default values for the "Umowa — Krótka" contract template.

export type ContractSectionKey =
    | 'parties'
    | 'subject'
    | 'deadline'
    | 'payment'
    | 'obligations'
    | 'acceptance'
    | 'copyright'
    | 'warranty'
    | 'confidentiality'
    | 'finalProvisions'

export type ContractPageBreakKey = 'header' | ContractSectionKey

export const ALL_CONTRACT_SECTION_KEYS: ContractSectionKey[] = [
    'parties',
    'subject',
    'deadline',
    'payment',
    'obligations',
    'acceptance',
    'copyright',
    'warranty',
    'confidentiality',
    'finalProvisions',
]

// ── Block shapes ──────────────────────────────────────────────────────────────

export interface ContractHeaderBlock {
    kicker: string
    title: string
    contractNumber: string
    city: string
    date: string
    /** Website shown in the screen footer (right side). Leave empty to use brand from kicker. */
    footerWebsite: string
    logoUrl: string
    logoDarkUrl: string
}

export interface ContractParty {
    firmName: string
    address: string
    nip: string
    representative: string
}

export interface ContractPartiesBlock {
    enabled: boolean
    sectionTitle: string
    contractorRole: string
    contractor: ContractParty
    clientRole: string
    clientFirmLabel: string
    client: ContractParty
}

export interface ContractSubjectBlock {
    enabled: boolean
    sectionTitle: string
    isNewSite: boolean
    isModernization: boolean
    technology: string
    scopeItems: string[]
    additionalNote: string
}

export interface ContractDeadlineBlock {
    enabled: boolean
    sectionTitle: string
    startDate: string
    endDate: string
}

export interface ContractPaymentBlock {
    enabled: boolean
    sectionTitle: string
    netAmount: string
    vatRate: string
    vatAmount: string
    grossAmount: string
    advancePercent: string
    finalPercent: string
    finalPaymentDays: string
    bankAccount: string
}

export interface ContractObligationsBlock {
    enabled: boolean
    sectionTitle: string
    materialsDays: string
    accessDays: string
    responseDays: string
}

export interface ContractAcceptanceBlock {
    enabled: boolean
    sectionTitle: string
    revisionRounds: string
    reviewDays: string
    hourlyRate: string
}

export interface ContractCopyrightBlock {
    enabled: boolean
    sectionTitle: string
    items: string[]
}

export interface ContractWarrantyBlock {
    enabled: boolean
    sectionTitle: string
    warrantyMonths: string
    fixDays: string
}

export interface ContractConfidentialityBlock {
    enabled: boolean
    sectionTitle: string
    items: string[]
}

export interface ContractFinalProvisionsBlock {
    enabled: boolean
    sectionTitle: string
    items: string[]
}

export interface ContractSignaturesBlock {
    contractorTitle: string
    contractorFirm: string
    contractorRepresentative: string
    contractorDate: string
    clientTitle: string
    clientFirm: string
    clientRepresentative: string
    clientDate: string
}

export interface ContractShortBlocks {
    version: 1
    /** Ordered list of section keys — controls which sections appear and in which order */
    sections: ContractSectionKey[]
    pageBreakAfter: ContractPageBreakKey[]
    header: ContractHeaderBlock
    parties: ContractPartiesBlock
    subject: ContractSubjectBlock
    deadline: ContractDeadlineBlock
    payment: ContractPaymentBlock
    obligations: ContractObligationsBlock
    acceptance: ContractAcceptanceBlock
    copyright: ContractCopyrightBlock
    warranty: ContractWarrantyBlock
    confidentiality: ContractConfidentialityBlock
    finalProvisions: ContractFinalProvisionsBlock
    signatures: ContractSignaturesBlock
}

// ── Default blocks ────────────────────────────────────────────────────────────

export function buildDefaultContractBlocks(): ContractShortBlocks {
    return {
        version: 1,
        sections: [...ALL_CONTRACT_SECTION_KEYS],
        pageBreakAfter: [],

        header: {
            kicker: 'Umowa cywilnoprawna · Usługi IT',
            title: 'Umowa o Wykonanie Strony Internetowej',
            contractNumber: '',
            city: '',
            date: '',
            footerWebsite: '',
            logoUrl: '',
            logoDarkUrl: '',
        },

        parties: {
            enabled: true,
            sectionTitle: 'Strony Umowy',
            contractorRole: 'Wykonawca',
            contractor: {
                firmName: '',
                address: '',
                nip: '',
                representative: '',
            },
            clientRole: 'Zamawiający',
            clientFirmLabel: 'Firma / Imię i nazw.:',
            client: {
                firmName: '',
                address: '',
                nip: '',
                representative: '',
            },
        },

        subject: {
            enabled: true,
            sectionTitle: 'Przedmiot Umowy',
            isNewSite: false,
            isModernization: false,
            technology: '',
            scopeItems: [
                'projekt graficzny i implementacja strony zgodnie z wytycznymi Zamawiającego',
                'wykonanie podstron i sekcji wymienionych w Załączniku nr 1 (Specyfikacja)',
                'konfiguracja panelu administracyjnego (CMS)',
                'optymalizacja SEO (podstawowa), responsywność (RWD), testy funkcjonalne',
            ],
            additionalNote:
                'Wszelkie prace nieujęte w Załączniku nr 1 stanowią zakres dodatkowy i wymagają odrębnego aneksu. Wykonawca nie odpowiada za treści dostarczone przez Zamawiającego ani za działanie usług i wtyczek osób trzecich.',
        },

        deadline: {
            enabled: true,
            sectionTitle: 'Termin Realizacji',
            startDate: '',
            endDate: '',
        },

        payment: {
            enabled: true,
            sectionTitle: 'Wynagrodzenie',
            netAmount: '',
            vatRate: '23',
            vatAmount: '',
            grossAmount: '',
            advancePercent: '50',
            finalPercent: '50',
            finalPaymentDays: '14',
            bankAccount: '',
        },

        obligations: {
            enabled: true,
            sectionTitle: 'Obowiązki Zamawiającego',
            materialsDays: '7',
            accessDays: '7',
            responseDays: '3',
        },

        acceptance: {
            enabled: true,
            sectionTitle: 'Odbiór i Poprawki',
            revisionRounds: '2',
            reviewDays: '5',
            hourlyRate: '',
        },

        copyright: {
            enabled: true,
            sectionTitle: 'Prawa Autorskie',
            items: [
                'Z chwilą zapłaty pełnego wynagrodzenia brutto Wykonawca przenosi na Zamawiającego autorskie prawa majątkowe do stworzonych elementów strony (projekt graficzny, kod źródłowy) na polach eksploatacji obejmujących utrwalanie, zwielokrotnianie oraz publiczne udostępnianie w Internecie.',
                'Do czasu zapłaty pełnego wynagrodzenia Zamawiający korzysta ze strony wyłącznie na podstawie licencji udzielonej przez Wykonawcę.',
                'Wykonawca zachowuje prawo do prezentowania realizacji we własnym portfolio i materiałach marketingowych.',
                'Umowa nie obejmuje przeniesienia praw do oprogramowania open-source, szablonów i wtyczek osób trzecich — podlegają one własnym licencjom.',
            ],
        },

        warranty: {
            enabled: true,
            sectionTitle: 'Gwarancja',
            warrantyMonths: '12',
            fixDays: '10',
        },

        confidentiality: {
            enabled: true,
            sectionTitle: 'Poufność',
            items: [
                'Obie Strony zobowiązują się do zachowania w poufności wszelkich informacji pozyskanych w związku z realizacją umowy, w szczególności danych handlowych, technicznych i finansowych.',
                'Obowiązek poufności obowiązuje przez <strong>3 (trzy) lata</strong> od zakończenia projektu i obejmuje pracowników oraz współpracowników każdej ze Stron.',
            ],
        },

        finalProvisions: {
            enabled: true,
            sectionTitle: 'Postanowienia Końcowe',
            items: [
                'Umowa wiąże Strony z chwilą podpisania i nie może zostać rozwiązana jednostronnie, z wyjątkiem przypadków rażącego naruszenia jej postanowień przez jedną ze Stron.',
                'W sprawach nieuregulowanych stosuje się przepisy prawa polskiego, w szczególności Kodeksu Cywilnego oraz ustawy o prawie autorskim i prawach pokrewnych.',
                'Spory będą rozstrzygane przez sąd powszechny właściwy dla siedziby Wykonawcy.',
                'Wszelkie zmiany umowy wymagają formy pisemnej pod rygorem nieważności.',
                'Umowę sporządzono w dwóch jednobrzmiących egzemplarzach, po jednym dla każdej ze Stron.',
                'Integralną część umowy stanowi: <strong>Załącznik nr 1</strong> — Specyfikacja i zakres prac.',
            ],
        },

        signatures: {
            contractorTitle: 'Wykonawca',
            contractorFirm: '',
            contractorRepresentative: '',
            contractorDate: '',
            clientTitle: 'Zamawiający',
            clientFirm: '',
            clientRepresentative: '',
            clientDate: '',
        },
    }
}

export function mergeContractWithDefaults(
    saved: Partial<ContractShortBlocks> | null | undefined,
): ContractShortBlocks {
    const defaults = buildDefaultContractBlocks()
    if (!saved) return defaults

    const validSet = new Set<string>(ALL_CONTRACT_SECTION_KEYS)
    const validPageBreakSet = new Set<string>(['header', ...ALL_CONTRACT_SECTION_KEYS])
    const filterValid = (arr: ContractSectionKey[]) =>
        (arr ?? []).filter((k) => validSet.has(k))
    const filterValidPageBreak = (arr: ContractPageBreakKey[]) =>
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
        subject: {
            ...defaults.subject,
            ...saved.subject,
            scopeItems: saved.subject?.scopeItems ?? defaults.subject.scopeItems,
        },
        deadline: { ...defaults.deadline, ...saved.deadline },
        payment: { ...defaults.payment, ...saved.payment },
        obligations: { ...defaults.obligations, ...saved.obligations },
        acceptance: { ...defaults.acceptance, ...saved.acceptance },
        copyright: {
            ...defaults.copyright,
            ...saved.copyright,
            items: saved.copyright?.items ?? defaults.copyright.items,
        },
        warranty: { ...defaults.warranty, ...saved.warranty },
        confidentiality: {
            ...defaults.confidentiality,
            ...saved.confidentiality,
            items: saved.confidentiality?.items ?? defaults.confidentiality.items,
        },
        finalProvisions: {
            ...defaults.finalProvisions,
            ...saved.finalProvisions,
            items: saved.finalProvisions?.items ?? defaults.finalProvisions.items,
        },
        signatures: { ...defaults.signatures, ...saved.signatures },
    }
}

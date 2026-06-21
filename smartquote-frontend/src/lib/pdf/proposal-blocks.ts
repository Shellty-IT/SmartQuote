// src/lib/pdf/proposal-blocks.ts
// Type definitions and default values for proposal template blocks

export interface DemoUrl {
    href: string
    label: string
}

export interface StructureItem {
    icon: string
    name: string
    description: string
}

export interface ScopeItem {
    /** HTML string rendered inside the checklist item */
    html: string
}

export interface TestingCard {
    icon: string
    title: string
    description: string
}

export interface TechOption {
    icon: string
    title: string
    urls: DemoUrl[]
}

// ── Block shapes ─────────────────────────────────────────────────────────────

export interface HeaderBlock {
    enabled: boolean
    /** Tag label shown above offer title, e.g. "Oferta handlowa" */
    tag: string
    /** Optional override for the title shown in the document header. Empty = use offer title. */
    titleOverride?: string
    /** Optional override for the client line shown below the title. Empty = use offer client. */
    clientLabelOverride?: string
}

export interface FooterBlock {
    enabled: boolean
    /** Text inserted after "przygotowana", e.g. "indywidualnie" */
    customNote: string
    /** Whether to show the seller name (logged-in user) in the footer */
    showAuthor: boolean
}

export interface IntroBlock {
    enabled: boolean
    /** Array of HTML paragraph strings */
    paragraphs: string[]
}

export interface DemoBlock {
    enabled: boolean
    title: string
    body: string
    urls: DemoUrl[]
    warning?: string
    note?: string
}

export interface StructureBlock {
    enabled: boolean
    title: string
    items: StructureItem[]
    note?: string
}

export interface ScopeBlock {
    enabled: boolean
    title: string
    items: ScopeItem[]
}

export interface TestingBlock {
    enabled: boolean
    intro: string
    cards: TestingCard[]
    note?: string
}

export interface TechnologyBlock {
    enabled: boolean
    /** HTML string */
    body: string
    options: TechOption[]
    note?: string
}

export interface PricingExtraBlock {
    enabled: boolean
    timeline: string
    timelineSub: string
    contractType: string
    contractSub: string
    /** When set, overrides the price automatically pulled from offer positions */
    priceOverride: number | null
    /** Whether the displayed price is net or gross (default: 'gross') */
    priceType: 'net' | 'gross'
}

export interface AboutBlock {
    enabled: boolean
    ctaText: string
    /** Heading text for the "about us" box shown when company website is set */
    aboutBoxTitle: string
}

// ── New optional sections (default disabled — existing offers unaffected) ───────

export interface BenefitItem {
    icon: string
    title: string
    description: string
}

export interface BenefitsBlock {
    enabled: boolean
    title: string
    items: BenefitItem[]
}

export interface ProcessStep {
    title: string
    description: string
}

export interface ProcessBlock {
    enabled: boolean
    title: string
    steps: ProcessStep[]
}

export interface StatItem {
    value: string
    label: string
}

export interface StatsBlock {
    enabled: boolean
    items: StatItem[]
}

/** Keys of all body sections (excludes header/footer which are always present) */
export type SectionKey =
    | 'intro' | 'demo' | 'structure' | 'scope' | 'testing' | 'technology' | 'pricingExtra' | 'about'
    | 'benefits' | 'process' | 'stats'

/** Default order — used by SectionManager when key is missing in saved data */
export const DEFAULT_PAGE1_SECTIONS: SectionKey[] = ['intro', 'demo', 'structure']
export const DEFAULT_PAGE2_SECTIONS: SectionKey[] = ['scope', 'testing', 'technology', 'pricingExtra', 'about']
/** Optional sections not placed on a page by default — available in the section manager. */
export const OPTIONAL_SECTIONS: SectionKey[] = ['benefits', 'process', 'stats']
/** All valid section keys (used to validate page arrays + find "removed"/available sections) */
export const ALL_SECTION_KEYS: SectionKey[] = [...DEFAULT_PAGE1_SECTIONS, ...DEFAULT_PAGE2_SECTIONS, ...OPTIONAL_SECTIONS]

export interface ProposalBlocks {
    version: 1
    /** Body section keys in render order on page 1 */
    page1Sections: SectionKey[]
    /** Body section keys in render order on page 2 */
    page2Sections: SectionKey[]
    header: HeaderBlock
    footer: FooterBlock
    intro: IntroBlock
    demo: DemoBlock
    structure: StructureBlock
    scope: ScopeBlock
    testing: TestingBlock
    technology: TechnologyBlock
    pricingExtra: PricingExtraBlock
    about: AboutBlock
    benefits: BenefitsBlock
    process: ProcessBlock
    stats: StatsBlock
}

// ── Default blocks ────────────────────────────────────────────────────────────

export function buildDefaultBlocks(clientName?: string): ProposalBlocks {
    const greeting = clientName
        ? `Dzień dobry${clientName ? `, ${clientName.split(' ')[0]}` : ''}. Dziękuję za kontakt i zainteresowanie współpracą. Przesyłam ofertę przygotowaną specjalnie dla Państwa.`
        : 'Dzień dobry. Dziękuję za kontakt i zainteresowanie współpracą. Przesyłam przygotowaną dla Państwa ofertę.'

    return {
        version: 1,

        page1Sections: [...DEFAULT_PAGE1_SECTIONS],
        page2Sections: [...DEFAULT_PAGE2_SECTIONS],

        header: {
            enabled: true,
            tag: 'Oferta handlowa',
            titleOverride: '',
            clientLabelOverride: '',
        },

        footer: {
            enabled: true,
            customNote: 'indywidualnie',
            showAuthor: true,
        },

        intro: {
            enabled: true,
            paragraphs: [
                greeting,
                'Zależy mi na tym, aby nasza współpraca przyniosła wymierne korzyści. Przygotowałem ofertę, która odpowiada na Państwa potrzeby — proszę o kontakt w przypadku jakichkolwiek pytań.',
            ],
        },

        demo: {
            enabled: false,
            title: 'Można zapoznać się z przykładowym projektem zanim zostanie podjęta decyzja',
            body: 'Zapraszam do obejrzenia przykładowej realizacji:',
            urls: [
                { href: 'https://', label: 'podgląd projektu' },
                { href: 'https://', label: 'panel administracyjny' },
            ],
            warning: '',
            note: '',
        },

        structure: {
            enabled: false,
            title: 'Proponowana struktura / zakres prac',
            items: [
                { icon: '📋', name: 'Element 1', description: 'Opis elementu' },
                { icon: '📋', name: 'Element 2', description: 'Opis elementu' },
                { icon: '📋', name: 'Element 3', description: 'Opis elementu' },
            ],
            note: '',
        },

        scope: {
            enabled: true,
            title: 'Pełny zakres realizacji',
            items: [
                { html: 'Pozycja zakresu 1 — opis' },
                { html: 'Pozycja zakresu 2 — opis' },
                { html: 'Pozycja zakresu 3 — opis' },
            ],
        },

        testing: {
            enabled: false,
            intro: 'W trakcie realizacji projektu będą Państwo na bieżąco informowani o postępach:',
            cards: [
                { icon: '👁️', title: 'Podgląd na żywo', description: 'Każda zmiana widoczna na bieżąco' },
                { icon: '💬', title: 'Bieżąca komunikacja', description: 'Poprawki realizowane na bieżąco' },
                { icon: '🔄', title: 'Wspólne zatwierdzanie', description: 'Każdy etap akceptowany wspólnie' },
                { icon: '🤝', title: 'Pełna transparentność', description: 'Wiadomo dokładnie na jakim etapie jesteśmy' },
            ],
            note: '',
        },

        technology: {
            enabled: false,
            body: 'Do realizacji projektu rekomendujemy sprawdzone technologie dopasowane do Państwa potrzeb.',
            options: [
                {
                    icon: '🔷',
                    title: 'Opcja A (rekomendowana)',
                    urls: [{ href: 'https://', label: 'przykład' }],
                },
                {
                    icon: '🔶',
                    title: 'Opcja B (alternatywna)',
                    urls: [{ href: 'https://', label: 'przykład' }],
                },
            ],
            note: '',
        },

        pricingExtra: {
            enabled: true,
            timeline: '2–4 tygodnie',
            timelineSub: 'od ustalenia szczegółów i przekazania materiałów',
            contractType: 'Umowa, faktura VAT',
            contractSub: 'pełna transparentność',
            priceOverride: null,
            priceType: 'gross' as const,
        },

        about: {
            enabled: true,
            ctaText:
                'Jeśli są Państwo zainteresowani współpracą, chętnie umówię się na krótką rozmowę, aby omówić szczegóły. Proszę o kontakt!',
            aboutBoxTitle: 'Więcej o nas i naszych realizacjach',
        },

        benefits: {
            enabled: false,
            title: 'Dlaczego warto nam zaufać',
            items: [
                { icon: '⚡', title: 'Szybka realizacja', description: 'Terminowość potwierdzona w umowie.' },
                { icon: '🛡️', title: 'Gwarancja jakości', description: 'Wsparcie i poprawki po wdrożeniu.' },
                { icon: '🤝', title: 'Pełna transparentność', description: 'Stały kontakt i podgląd postępów.' },
            ],
        },

        process: {
            enabled: false,
            title: 'Jak przebiega współpraca',
            steps: [
                { title: 'Konsultacja', description: 'Poznajemy Twoje potrzeby i cele.' },
                { title: 'Projekt', description: 'Przygotowujemy koncepcję i wycenę.' },
                { title: 'Realizacja', description: 'Wdrażamy z bieżącym podglądem postępów.' },
                { title: 'Wdrożenie', description: 'Publikujemy i przekazujemy gotowy produkt.' },
            ],
        },

        stats: {
            enabled: false,
            items: [
                { value: '50+', label: 'zrealizowanych projektów' },
                { value: '10 lat', label: 'doświadczenia' },
                { value: '100%', label: 'terminowych wdrożeń' },
            ],
        },
    }
}

/** Merge saved blocks (from DB) with current defaults — ensures new fields have values */
export function mergeWithDefaults(
    saved: Partial<ProposalBlocks> | null | undefined,
    clientName?: string,
): ProposalBlocks {
    const defaults = buildDefaultBlocks(clientName)
    if (!saved) return defaults
    const validSet = new Set<string>(ALL_SECTION_KEYS)
    const filterValid = (arr: SectionKey[]) => arr.filter((k) => validSet.has(k))

    return {
        version: 1,
        page1Sections: filterValid(saved.page1Sections ?? defaults.page1Sections),
        page2Sections: filterValid(saved.page2Sections ?? defaults.page2Sections),
        header: { ...defaults.header, ...saved.header },
        footer: { ...defaults.footer, ...saved.footer },
        intro: { ...defaults.intro, ...saved.intro },
        demo: { ...defaults.demo, ...saved.demo },
        structure: { ...defaults.structure, ...saved.structure },
        scope: { ...defaults.scope, ...saved.scope },
        testing: { ...defaults.testing, ...saved.testing },
        technology: { ...defaults.technology, ...saved.technology },
        pricingExtra: { ...defaults.pricingExtra, ...saved.pricingExtra },
        about: { ...defaults.about, ...saved.about },
        benefits: { ...defaults.benefits, ...saved.benefits },
        process: { ...defaults.process, ...saved.process },
        stats: { ...defaults.stats, ...saved.stats },
    }
}

// src/lib/pdf/mobile-simple-blocks.ts
// Block types and defaults for the "Aplikacja mobilna - domyślny" offer template.
// Design: teal #0D9488 + orange #F97316, clean Nunito-style layout.

export type MobileSimpleSectionKey = 'checklist' | 'tech' | 'process'
export type MobileSimplePageBreakKey = 'cover' | MobileSimpleSectionKey

// ── Sub-types ─────────────────────────────────────────────────────────────────

export interface MobileSimpleChecklistItem {
    title: string
    description: string
}

export interface MobileSimpleOption {
    emoji: string
    label: string
    price: string
}

export interface MobileSimpleTechCard {
    icon: string
    title: string
    badge: string
    badgeVariant: 'primary' | 'accent'
    tagline: string
    description: string
    pros: string[]
}

export interface MobileSimpleStep {
    title: string
    description: string
}

export interface MobileSimpleGuarantee {
    emoji: string
    label: string
}

// ── Block interfaces ──────────────────────────────────────────────────────────

export interface MobileSimpleCoverBlock {
    coverTag: string
    projectName: string
    subtitlePrefix: string
    clientName: string
    readyWeeks: string
    priceText: string
    deliveryLabel: string
    priceLabel: string
    platformCount: string
    platformLabel: string
    promises: string[]
}

export interface MobileSimpleChecklistBlock {
    sectionTitle: string
    sectionLead: string
    items: MobileSimpleChecklistItem[]
    infoBoxText: string
    optionsTitle: string
    optionsLead: string
    options: MobileSimpleOption[]
}

export interface MobileSimpleTechBlock {
    sectionTitle: string
    sectionLead: string
    cardA: MobileSimpleTechCard
    cardB: MobileSimpleTechCard
    alternativeText: string
}

export interface MobileSimpleProcessBlock {
    processTitle: string
    steps: MobileSimpleStep[]
    timelineNote: string
    priceNet: string
    priceIncludes: string[]
    payment1Percent: string
    payment1Amount: string
    payment2Percent: string
    payment2Amount: string
    validUntil: string
    guarantees: MobileSimpleGuarantee[]
    priceOverride: number | null
    /** Show the headline amount as net ('netto') or gross ('brutto'). */
    priceType: 'net' | 'gross'
}

export interface MobileSimpleFooterBlock {
    tagline: string
    contactEmail: string
    contactPhone: string
    websiteUrl: string
    linkedinUrl: string
    githubUrl: string
}

// ── Root type ─────────────────────────────────────────────────────────────────

export interface MobileSimpleBlocks {
    version: 1
    sections: MobileSimpleSectionKey[]
    pageBreakAfter: MobileSimplePageBreakKey[]
    cover: MobileSimpleCoverBlock
    checklist: MobileSimpleChecklistBlock
    tech: MobileSimpleTechBlock
    process: MobileSimpleProcessBlock
    footer: MobileSimpleFooterBlock
}

// ── Defaults ──────────────────────────────────────────────────────────────────

export function buildDefaultMobileSimpleBlocks(): MobileSimpleBlocks {
    return {
        version: 1,
        sections: ['checklist', 'tech', 'process'],
        pageBreakAfter: [],
        cover: {
            coverTag: 'Oferta handlowa',
            projectName: 'MyApp',
            subtitlePrefix: 'Aplikacja mobilna dla',
            clientName: 'Nazwa Firmy',
            readyWeeks: '8',
            priceText: '12 000',
            deliveryLabel: 'Czas realizacji',
            priceLabel: 'Cena netto',
            platformCount: '2',
            platformLabel: 'Platformy',
            promises: [
                'Jedna cena, bez niespodzianek',
                'Działasz na iPhonie i Androidzie',
                'Pomagam też po wdrożeniu',
            ],
        },
        checklist: {
            sectionTitle: 'Co znajdziesz w swojej aplikacji',
            sectionLead: 'Ustalamy razem — to lista bazowa, którą dostosujemy do Twojego pomysłu.',
            items: [
                { title: 'Ekran główny dopasowany do Twojej marki', description: 'Kolory, logo, nazwa — wszystko w stylu Twojej firmy.' },
                { title: 'Rejestracja i logowanie użytkowników', description: 'Przez email lub numer telefonu — szybko i bezpiecznie.' },
                { title: 'Główna funkcja aplikacji', description: 'Np. składanie zamówień, rezerwacja terminu, przeglądanie oferty.' },
                { title: 'Powiadomienia push', description: 'Informuj klientów o promocjach lub statusie zamówienia.' },
                { title: 'Formularz kontaktowy lub czat', description: 'Klienci łatwo skontaktują się z Twoją firmą.' },
                { title: 'Strona „O nas" i dane kontaktowe', description: 'Adres, godziny otwarcia, mapa dojazdu.' },
                { title: 'Aplikacja działa na iPhonie i Androidzie', description: 'Jeden projekt, obie platformy.' },
                { title: 'Publikacja w App Store i Google Play', description: 'Zajmuję się tym za Ciebie — od A do Z.' },
                { title: '4 tygodnie bezpłatnego wsparcia', description: 'Po uruchomieniu jestem do dyspozycji.' },
            ],
            infoBoxText: '💡 Potrzebujesz czegoś, czego tu nie ma? Napisz — wycenimy jako opcję dodatkową bez zmiany ceny bazowej.',
            optionsTitle: 'Opcje dodatkowe',
            optionsLead: 'Możemy rozszerzyć aplikację o dowolny z poniższych modułów — ceny orientacyjne.',
            options: [
                { emoji: '💳', label: 'System płatności online', price: '3 000' },
                { emoji: '🌍', label: 'Wersja wielojęzyczna', price: '1 500' },
                { emoji: '🖥️', label: 'Panel administracyjny na komputer', price: '4 000' },
                { emoji: '🧾', label: 'Integracja z systemem kasowym', price: '2 500' },
            ],
        },
        tech: {
            sectionTitle: 'Technologia — bez komplikacji',
            sectionLead: 'Nie musisz znać się na programowaniu. Poniżej wyjaśniam, co to dla Ciebie znaczy w praktyce.',
            cardA: {
                icon: '⚛️',
                title: 'React Native',
                badge: '★ REKOMENDOWANA',
                badgeVariant: 'primary',
                tagline: 'Jedna aplikacja — działa wszędzie',
                description: 'Tworzę jedną aplikację, która działa zarówno na telefonie Apple, jak i na Androidzie. Oszczędzamy czas i pieniądze — nie musisz płacić za dwie oddzielne wersje.',
                pros: [
                    'Działa na iPhone i Android',
                    'Niższy koszt niż dwie osobne aplikacje',
                    'Wygląda jak natywna aplikacja telefonu',
                ],
            },
            cardB: {
                icon: '🎯',
                title: 'Flutter',
                badge: '⚡ SZYBKA I PIĘKNA',
                badgeVariant: 'accent',
                tagline: 'Gdy design jest najważniejszy',
                description: 'Framework stworzony przez Google. Aplikacja wygląda absolutnie identycznie na każdym telefonie i działa błyskawicznie. Świetna opcja, gdy chcesz się wyróżnić wyglądem.',
                pros: [
                    'Wyjątkowy, płynny wygląd',
                    'Działa szybko nawet na starszych telefonach',
                    'Lekko dłuższy czas realizacji',
                ],
            },
            alternativeText: 'Masz inne preferencje albo ktoś Ci coś polecił? Żaden problem — napisz mi, co masz w głowie, dobierzemy razem najlepsze rozwiązanie dla Twojego budżetu.',
        },
        process: {
            processTitle: 'Jak wygląda nasza współpraca',
            steps: [
                { title: 'Rozmawiamy', description: 'Opowiadasz mi o swoim pomyśle. Bez żargonu, przez telefon lub Zoom — jak Ci wygodnie. To nic nie kosztuje.' },
                { title: 'Projektuję ekrany', description: 'Pokazuję Ci, jak będzie wyglądać aplikacja, zanim zacznę ją budować. Możesz zgłosić zmiany.' },
                { title: 'Buduję i testuję', description: 'Tworzę aplikację i na bieżąco informuję o postępach. Możesz śledzić, jak powstaje.' },
                { title: 'Uruchamiamy razem', description: 'Wrzucam aplikację do App Store i Google Play. Pokazuję Ci, jak nią zarządzać.' },
            ],
            timelineNote: '⏱ Cały proces trwa zazwyczaj od 6 do 10 tygodni od pierwszej rozmowy.',
            priceNet: '12 000',
            priceIncludes: [
                'Kompletna aplikacja iOS i Android',
                'Projekt ekranów i wdrożenie',
                'Publikacja w sklepach',
                'Wsparcie po uruchomieniu',
            ],
            payment1Percent: '50',
            payment1Amount: '6 000',
            payment2Percent: '50',
            payment2Amount: '6 000',
            validUntil: '',
            priceType: 'net',
            guarantees: [
                { emoji: '🛡️', label: 'Gwarancja 6 miesięcy na błędy' },
                { emoji: '🔄', label: '3 rundy bezpłatnych poprawek' },
                { emoji: '📞', label: '4 tygodnie wsparcia po wdrożeniu' },
            ],
            priceOverride: null,
        },
        footer: {
            tagline: 'Tworzę proste, działające aplikacje mobilne dla małych firm — bez żargonu i bez ukrytych kosztów.',
            contactEmail: 'kontakt@twoja-strona.pl',
            contactPhone: '+48 000 000 000',
            websiteUrl: 'www.twoja-strona.pl',
            linkedinUrl: '#',
            githubUrl: '#',
        },
    }
}

// ── Merge ─────────────────────────────────────────────────────────────────────

const VALID_SECTIONS = new Set<MobileSimpleSectionKey>(['checklist', 'tech', 'process'])
const VALID_PAGE_BREAK_KEYS = new Set<MobileSimplePageBreakKey>(['cover', 'checklist', 'tech', 'process'])

export function mergeMobileSimpleWithDefaults(saved: Partial<MobileSimpleBlocks>): MobileSimpleBlocks {
    const defaults = buildDefaultMobileSimpleBlocks()
    return {
        version: 1,
        sections: Array.isArray(saved.sections)
            ? (saved.sections as string[]).filter((k): k is MobileSimpleSectionKey => VALID_SECTIONS.has(k as MobileSimpleSectionKey))
            : defaults.sections,
        pageBreakAfter: Array.isArray(saved.pageBreakAfter)
            ? (saved.pageBreakAfter as string[]).filter((k): k is MobileSimplePageBreakKey => VALID_PAGE_BREAK_KEYS.has(k as MobileSimplePageBreakKey))
            : defaults.pageBreakAfter,
        cover: { ...defaults.cover, ...(saved.cover ?? {}) },
        checklist: {
            ...defaults.checklist,
            ...(saved.checklist ?? {}),
            items: Array.isArray(saved.checklist?.items) ? saved.checklist.items : defaults.checklist.items,
            options: Array.isArray(saved.checklist?.options) ? saved.checklist.options : defaults.checklist.options,
        },
        tech: {
            ...defaults.tech,
            ...(saved.tech ?? {}),
            cardA: { ...defaults.tech.cardA, ...(saved.tech?.cardA ?? {}) },
            cardB: { ...defaults.tech.cardB, ...(saved.tech?.cardB ?? {}) },
        },
        process: {
            ...defaults.process,
            ...(saved.process ?? {}),
            steps: Array.isArray(saved.process?.steps) ? saved.process.steps : defaults.process.steps,
            priceIncludes: Array.isArray(saved.process?.priceIncludes) ? saved.process.priceIncludes : defaults.process.priceIncludes,
            guarantees: Array.isArray(saved.process?.guarantees) ? saved.process.guarantees : defaults.process.guarantees,
            priceOverride: saved.process?.priceOverride !== undefined ? saved.process.priceOverride : defaults.process.priceOverride,
            priceType: saved.process?.priceType === 'gross' ? 'gross' : 'net',
        },
        footer: { ...defaults.footer, ...(saved.footer ?? {}) },
    }
}

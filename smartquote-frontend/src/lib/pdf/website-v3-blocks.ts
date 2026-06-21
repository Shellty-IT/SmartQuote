// src/lib/pdf/website-v3-blocks.ts
// Block types and defaults for the "Strona internetowa v3" offer template.

export type WebsiteV3SectionKey =
    | 'needs'
    | 'packages'
    | 'process'
    | 'scope'
    | 'timeline'
    | 'pricing'
    | 'portfolio'
    | 'testimonials'
    | 'about'
    | 'stack'
    | 'terms'

// ── Sub-types ─────────────────────────────────────────────────────────────────

export interface WV3PackageFeature { label: string; included: boolean }
export interface WV3Package {
    name: string
    tagline: string
    price: string
    features: WV3PackageFeature[]
    ctaLabel: string
    highlighted: boolean
}

export interface WV3ProcessStep {
    label: string
    duration: string
    description: string
}

export interface WV3ScopeItem { label: string; description?: string; optional: boolean }
export interface WV3ScopeCategory { title: string; items: WV3ScopeItem[] }

export interface WV3TimelineRow {
    label: string
    fills: Array<0 | 0.5 | 1>
}

export interface WV3PricingItem {
    label: string
    details: string
    price: string
    isExtra: boolean
}
export interface WV3PaymentStep { percent: number; label: string; description: string }

export interface WV3PortfolioItem {
    name: string
    industry: string
    description: string
    tech: string
    thumbColor: string
}

export interface WV3Testimonial {
    quote: string
    initials: string
    name: string
    position: string
}

export interface WV3Stat { value: string; label: string }

export interface WV3Guarantee { emoji: string; title: string; description: string }

// ── Block interfaces ──────────────────────────────────────────────────────────

export interface WV3CoverBlock {
    badgeLabel: string
    subtitle: string
    promisePills: string[]
    deadlineDays: number
    validityDays: number
}

export interface WV3FooterBlock {
    ctaHeadline: string
    ctaSubtitle: string
}

export interface WV3NeedsBlock {
    enabled: boolean
    title: string
    intro: string
    challengeTitle: string
    challengeItems: string[]
    responseTitle: string
    responseItems: string[]
}

export interface WV3PackagesBlock {
    enabled: boolean
    title: string
    subtitle: string
    packages: WV3Package[]
}

export interface WV3ProcessBlock {
    enabled: boolean
    title: string
    steps: WV3ProcessStep[]
    timelineNote: string
}

export interface WV3ScopeBlock {
    enabled: boolean
    title: string
    categories: WV3ScopeCategory[]
}

export interface WV3TimelineBlock {
    enabled: boolean
    title: string
    rows: WV3TimelineRow[]
    columnLabels: string[]
    estimatedCompletion: string
}

export interface WV3PricingBlock {
    enabled: boolean
    title: string
    priceOverride: number | null
    items: WV3PricingItem[]
    paymentSteps: WV3PaymentStep[]
}

export interface WV3PortfolioBlock {
    enabled: boolean
    title: string
    items: WV3PortfolioItem[]
    portfolioUrl: string
}

export interface WV3TestimonialsBlock {
    enabled: boolean
    title: string
    items: WV3Testimonial[]
}

export interface WV3AboutBlock {
    enabled: boolean
    title: string
    bio1: string
    bio2: string
    stats: WV3Stat[]
}

export interface WV3StackBlock {
    enabled: boolean
    title: string
    technologies: string[]
}

export interface WV3TermsBlock {
    enabled: boolean
    title: string
    guarantees: WV3Guarantee[]
    paymentTerms: string
    contractForm: string
    copyrightTerms: string
}

// ── Root type ─────────────────────────────────────────────────────────────────

export interface WebsiteV3Blocks {
    version: 1
    sections: WebsiteV3SectionKey[]
    cover: WV3CoverBlock
    footer: WV3FooterBlock
    needs: WV3NeedsBlock
    packages: WV3PackagesBlock
    process: WV3ProcessBlock
    scope: WV3ScopeBlock
    timeline: WV3TimelineBlock
    pricing: WV3PricingBlock
    portfolio: WV3PortfolioBlock
    testimonials: WV3TestimonialsBlock
    about: WV3AboutBlock
    stack: WV3StackBlock
    terms: WV3TermsBlock
}

// ── Constants ─────────────────────────────────────────────────────────────────

export const DEFAULT_WV3_SECTIONS: WebsiteV3SectionKey[] = [
    'needs', 'packages', 'process', 'scope', 'timeline',
    'pricing', 'portfolio', 'testimonials', 'about', 'stack', 'terms',
]

const VALID_SECTIONS = new Set<string>(DEFAULT_WV3_SECTIONS)

// ── Defaults ─────────────────────────────────────────────────────────────────

export function buildDefaultWebsiteV3Blocks(): WebsiteV3Blocks {
    return {
        version: 1,
        sections: [...DEFAULT_WV3_SECTIONS],
        cover: {
            badgeLabel: 'Oferta handlowa',
            subtitle: 'PROPOZYCJA REALIZACJI STRONY INTERNETOWEJ',
            promisePills: ['Nowoczesny design', 'Responsywność', 'Gotowe w 21 dni'],
            deadlineDays: 21,
            validityDays: 14,
        },
        footer: {
            ctaHeadline: 'Gotowy, żeby zacząć?',
            ctaSubtitle: 'Zaakceptuj ofertę, a w ciągu 24h przygotuję umowę i ruszamy z projektem.',
        },
        needs: {
            enabled: true,
            title: 'Rozumienie potrzeb klienta',
            intro: 'Klient potrzebuje reprezentatywnej strony internetowej, która zbuduje wiarygodność marki, pozyska nowych klientów i jasno przedstawi ofertę.',
            challengeTitle: 'Wyzwanie',
            challengeItems: [
                'obecna strona jest przestarzała lub nie istnieje',
                'brak responsywności na urządzeniach mobilnych',
                'niska widoczność w Google',
            ],
            responseTitle: 'Nasza odpowiedź',
            responseItems: [
                'nowoczesny, lekki design dopasowany do marki',
                'pełna responsywność i szybkość ładowania',
                'optymalizacja SEO od pierwszego dnia',
            ],
        },
        packages: {
            enabled: true,
            title: 'Wybierz zakres który odpowiada Twoim potrzebom',
            subtitle: 'Pakiety',
            packages: [
                {
                    name: 'Start',
                    tagline: 'dla startujących firm',
                    price: 'od 2 500',
                    highlighted: false,
                    ctaLabel: 'Wybieram Start',
                    features: [
                        { label: 'Do 5 podstron', included: true },
                        { label: 'Projekt graficzny szablonowy', included: true },
                        { label: 'Pełna responsywność (RWD)', included: true },
                        { label: 'Formularz kontaktowy', included: true },
                        { label: 'Certyfikat SSL', included: true },
                        { label: 'CMS (WordPress)', included: false },
                        { label: 'SEO podstawowe', included: false },
                        { label: 'Wsparcie po wdrożeniu', included: false },
                    ],
                },
                {
                    name: 'Biznes',
                    tagline: 'dla rozwijających się firm',
                    price: 'od 4 900',
                    highlighted: true,
                    ctaLabel: 'Wybieram Biznes',
                    features: [
                        { label: 'Do 10 podstron', included: true },
                        { label: 'Indywidualny projekt graficzny', included: true },
                        { label: 'Pełna responsywność (RWD)', included: true },
                        { label: 'CMS WordPress', included: true },
                        { label: 'Formularz kontaktowy', included: true },
                        { label: 'SEO podstawowe', included: true },
                        { label: 'Certyfikat SSL + szkolenie', included: true },
                        { label: 'Wsparcie 30 dni po wdrożeniu', included: false },
                    ],
                },
                {
                    name: 'Premium',
                    tagline: 'dla wymagających marek',
                    price: 'od 8 900',
                    highlighted: false,
                    ctaLabel: 'Wybieram Premium',
                    features: [
                        { label: 'Nieograniczona liczba podstron', included: true },
                        { label: 'Indywidualny projekt + animacje', included: true },
                        { label: 'Pełna responsywność (RWD)', included: true },
                        { label: 'CMS WordPress (rozbudowany)', included: true },
                        { label: 'Formularze + integracje', included: true },
                        { label: 'SEO zaawansowane', included: true },
                        { label: 'Certyfikat SSL + szkolenie', included: true },
                        { label: 'Wsparcie 30 dni po wdrożeniu', included: true },
                    ],
                },
            ],
        },
        process: {
            enabled: true,
            title: 'Proces realizacji',
            steps: [
                { label: 'Briefing', duration: '1–2 dni', description: 'Poznajemy cele, grupę docelową i zakres projektu.' },
                { label: 'Projekt UX', duration: '2–3 dni', description: 'Architektura informacji i ścieżki użytkownika.' },
                { label: 'Makiety', duration: '3–4 dni', description: 'Wireframe i projekt graficzny do akceptacji.' },
                { label: 'Kodowanie', duration: '5–8 dni', description: 'Wdrożenie projektu na działającą stronę.' },
                { label: 'Testy & Poprawki', duration: '2–3 dni', description: 'Testy na urządzeniach i rundy korekt.' },
                { label: 'Uruchomienie', duration: '1 dzień', description: 'Publikacja na serwerze i przekazanie dostępów.' },
            ],
            timelineNote: 'Łączny czas realizacji: od 14 do 21 dni roboczych.',
        },
        scope: {
            enabled: true,
            title: 'Szczegółowy zakres prac',
            categories: [
                {
                    title: 'Projekt i UX',
                    items: [
                        { label: 'Analiza konkurencji i benchmarking', description: 'Przegląd rozwiązań w branży klienta.', optional: false },
                        { label: 'Projekt makiet (wireframe)', optional: false },
                        { label: 'Indywidualny projekt graficzny', optional: true },
                    ],
                },
                {
                    title: 'Frontend',
                    items: [
                        { label: 'Kodowanie responsywne (RWD)', description: 'Wygląd dopasowany do telefonu, tabletu i desktopu.', optional: false },
                        { label: 'Animacje i mikrointerakcje', optional: false },
                        { label: 'Optymalizacja wydajności', optional: false },
                    ],
                },
                {
                    title: 'Backend i CMS',
                    items: [
                        { label: 'Instalacja i konfiguracja WordPress', optional: false },
                        { label: 'Panel do samodzielnej edycji treści', optional: false },
                        { label: 'Integracje zewnętrzne', optional: true },
                    ],
                },
                {
                    title: 'SEO i Performance',
                    items: [
                        { label: 'Podstawowa optymalizacja SEO', description: 'Meta tagi, struktura nagłówków, mapa strony.', optional: false },
                        { label: 'Optymalizacja Google PageSpeed', optional: false },
                        { label: 'Integracja Google Analytics', optional: false },
                    ],
                },
                {
                    title: 'Bezpieczeństwo',
                    items: [
                        { label: 'Certyfikat SSL (HTTPS)', optional: false },
                        { label: 'Konfiguracja kopii zapasowych', optional: false },
                        { label: 'Zabezpieczenia antyspamowe', optional: false },
                    ],
                },
                {
                    title: 'Dokumentacja',
                    items: [
                        { label: 'Szkolenie z obsługi panelu', optional: false },
                        { label: 'Instrukcja wideo', optional: true },
                        { label: 'Przekazanie wszystkich dostępów', optional: false },
                    ],
                },
            ],
        },
        timeline: {
            enabled: true,
            title: 'Harmonogram czasowy',
            columnLabels: ['Tydz. 1', 'Tydz. 2', 'Tydz. 3'],
            rows: [
                { label: 'Briefing & UX', fills: [1, 0, 0] },
                { label: 'Makiety & design', fills: [0.5, 1, 0] },
                { label: 'Kodowanie', fills: [0, 1, 0.5] },
                { label: 'Testy & poprawki', fills: [0, 0, 1] },
                { label: 'Uruchomienie', fills: [0, 0, 1] },
            ],
            estimatedCompletion: '',
        },
        pricing: {
            enabled: true,
            title: 'Wycena',
            priceOverride: null,
            items: [
                { label: 'Pakiet Biznes', details: 'strona z CMS, do 10 podstron', price: '4 900', isExtra: false },
                { label: 'Projekt graficzny', details: 'indywidualny design', price: 'w cenie', isExtra: false },
                { label: 'Dodatkowa podstrona', details: 'za 1 szt.', price: '250', isExtra: true },
                { label: 'Wersja wielojęzyczna', details: 'za 1 język', price: '900', isExtra: true },
                { label: 'Sklep internetowy', details: 'WooCommerce', price: 'od 2 500', isExtra: true },
                { label: 'Moduł bloga', details: 'z kategoriami', price: '600', isExtra: true },
            ],
            paymentSteps: [
                { percent: 40, label: 'Zaliczka', description: 'przy podpisaniu umowy' },
                { percent: 60, label: 'Płatność końcowa', description: 'przy odbiorze strony' },
            ],
        },
        portfolio: {
            enabled: true,
            title: 'Przykładowe projekty',
            portfolioUrl: '',
            items: [
                { name: 'Nazwa projektu', industry: 'Branża klienta', description: '2–3 zdania opisu: jaki był cel, co zostało zrobione i jaki był efekt projektu.', tech: 'WordPress', thumbColor: 'violet' },
                { name: 'Nazwa projektu', industry: 'Branża klienta', description: '2–3 zdania opisu projektu.', tech: 'React / Next.js', thumbColor: 'cyan' },
                { name: 'Nazwa projektu', industry: 'Branża klienta', description: '2–3 zdania opisu projektu.', tech: 'WooCommerce', thumbColor: 'dark' },
            ],
        },
        testimonials: {
            enabled: true,
            title: 'Referencje',
            items: [
                { quote: 'Cytat klienta — kilka zdań o współpracy, terminowości i efekcie końcowym.', initials: 'JK', name: 'Imię Nazwisko', position: 'Stanowisko, Firma' },
                { quote: 'Cytat klienta — kilka zdań o współpracy i rekomendacja.', initials: 'AW', name: 'Imię Nazwisko', position: 'Stanowisko, Firma' },
            ],
        },
        about: {
            enabled: true,
            title: 'O wykonawcy',
            bio1: 'Bio: kim jesteś, ile masz doświadczenia i w czym się specjalizujesz w projektowaniu stron internetowych.',
            bio2: 'Drugi akapit: Twoje podejście do projektów, wartości i co wyróżnia Twoją pracę.',
            stats: [
                { value: '6', label: 'lat doświadczenia' },
                { value: '80', label: 'zrealizowanych projektów' },
                { value: '50', label: 'zadowolonych klientów' },
            ],
        },
        stack: {
            enabled: true,
            title: 'Technologie których używam',
            technologies: ['WordPress', 'PHP 8', 'JavaScript', 'HTML5', 'CSS3 / SCSS', 'Git', 'Figma', 'Google PageSpeed', 'SSL / HTTPS', 'cPanel / Plesk'],
        },
        terms: {
            enabled: true,
            title: 'Warunki współpracy i gwarancja',
            guarantees: [
                { emoji: '🛡️', title: 'Gwarancja 12 miesięcy', description: 'Bezpłatne usuwanie usterek technicznych przez rok od wdrożenia.' },
                { emoji: '🔄', title: '3 rundy poprawek gratis', description: 'Dopracowujemy projekt na każdym etapie aż do akceptacji.' },
                { emoji: '📞', title: '30 dni wsparcia', description: 'Pełne wsparcie techniczne przez 30 dni po odbiorze strony.' },
            ],
            paymentTerms: '40% zaliczki, 60% przy odbiorze; przelew 7 dni',
            contractForm: 'umowa o dzieło / pisemna',
            copyrightTerms: 'pełne przeniesienie praw do projektu po końcowej płatności',
        },
    }
}

export function mergeWebsiteV3WithDefaults(
    saved: Partial<WebsiteV3Blocks> | null | undefined,
): WebsiteV3Blocks {
    const defaults = buildDefaultWebsiteV3Blocks()
    if (!saved) return defaults

    return {
        version: 1,
        sections: Array.isArray(saved.sections)
            ? (saved.sections.filter((s) => VALID_SECTIONS.has(s)) as WebsiteV3SectionKey[])
            : defaults.sections,
        cover: { ...defaults.cover, ...(saved.cover ?? {}) },
        footer: { ...defaults.footer, ...(saved.footer ?? {}) },
        needs: { ...defaults.needs, ...(saved.needs ?? {}) },
        packages: { ...defaults.packages, ...(saved.packages ?? {}) },
        process: { ...defaults.process, ...(saved.process ?? {}) },
        scope: { ...defaults.scope, ...(saved.scope ?? {}) },
        timeline: { ...defaults.timeline, ...(saved.timeline ?? {}) },
        pricing: { ...defaults.pricing, ...(saved.pricing ?? {}) },
        portfolio: { ...defaults.portfolio, ...(saved.portfolio ?? {}) },
        testimonials: { ...defaults.testimonials, ...(saved.testimonials ?? {}) },
        about: { ...defaults.about, ...(saved.about ?? {}) },
        stack: { ...defaults.stack, ...(saved.stack ?? {}) },
        terms: { ...defaults.terms, ...(saved.terms ?? {}) },
    }
}

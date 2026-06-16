// src/lib/pdf/universal-blocks.ts
// Block types and defaults for the "Szablon uniwersalny" offer template.
// Design: navy #1B3A5C + gold #C9A84C, IBM Plex Sans → Outfit Variable.

export type UniversalSectionKey = 'summary' | 'needs' | 'scope' | 'timeline' | 'pricing' | 'terms'

// ── Sub-types ─────────────────────────────────────────────────────────────────

export interface UniversalScopeItem {
    name: string
    description: string
    optional: boolean
}

export interface UniversalTimelineStep {
    name: string
    duration: string
    description: string
    active: boolean
}

export interface UniversalPricingCategory {
    name: string
    items: UniversalPricingItem[]
}

export interface UniversalPricingItem {
    name: string
    description: string
    qty: string
    unit: string
    unitPrice: string
    value: string
    optional: boolean
}

export interface UniversalPaymentRow {
    percent: string
    amount: string
    when: string
}

export interface UniversalTermCard {
    icon: string
    title: string
    text: string
}

// ── Block interfaces ──────────────────────────────────────────────────────────

export interface UniversalCoverBlock {
    serviceTitle: string
    clientName: string
    contractorName: string
    contractorRole: string
    contractorEmail: string
    contractorPhone: string
    websiteUrl: string
    offerDate: string
    validUntil: string
}

export interface UniversalSummaryBlock {
    eyebrow: string
    title: string
    leadText: string
    scopeFact: string
    timelineFact: string
    valueFact: string
}

export interface UniversalNeedsBlock {
    sourceNote: string
    challengeText: string
    goalText: string
    resultText: string
}

export interface UniversalScopeBlock {
    items: UniversalScopeItem[]
    excludes: string[]
    assumptionText: string
}

export interface UniversalTimelineBlock {
    steps: UniversalTimelineStep[]
    startDate: string
    endDate: string
}

export interface UniversalPricingBlock {
    pricingMode: 'simple' | 'detailed'
    simplePrice: string
    simpleIncludes: string[]
    categories: UniversalPricingCategory[]
    payments: UniversalPaymentRow[]
    paymentNote: string
    priceOverride: number | null
}

export interface UniversalTermsBlock {
    cards: UniversalTermCard[]
}

export interface UniversalFooterBlock {
    ctaTitle: string
    ctaSubtitle: string
    responseHours: string
    tagline: string
    linkedinUrl: string
    githubUrl: string
    footerEmail: string
    footerPhone: string
    footerWebsite: string
}

// ── Root type ─────────────────────────────────────────────────────────────────

export interface UniversalBlocks {
    version: 1
    sections: UniversalSectionKey[]
    cover: UniversalCoverBlock
    summary: UniversalSummaryBlock
    needs: UniversalNeedsBlock
    scope: UniversalScopeBlock
    timeline: UniversalTimelineBlock
    pricing: UniversalPricingBlock
    terms: UniversalTermsBlock
    footer: UniversalFooterBlock
}

// ── Defaults ──────────────────────────────────────────────────────────────────

export function buildDefaultUniversalBlocks(): UniversalBlocks {
    return {
        version: 1,
        sections: ['summary', 'needs', 'scope', 'timeline', 'pricing', 'terms'],
        cover: {
            serviceTitle: 'Tytuł usługi / projektu',
            clientName: 'Nazwa Klienta / Firmy',
            contractorName: 'Imię Nazwisko',
            contractorRole: 'Stanowisko / Specjalizacja',
            contractorEmail: 'kontakt@firma.pl',
            contractorPhone: '+48 000 000 000',
            websiteUrl: 'www.firma.pl',
            offerDate: '',
            validUntil: '',
        },
        summary: {
            eyebrow: 'Streszczenie',
            title: 'W skrócie',
            leadText: 'Firma [Klient] zwróciła się z potrzebą… Celem niniejszej oferty jest… Proponowane rozwiązanie pozwoli osiągnąć wymierne korzyści biznesowe.',
            scopeFact: 'Krótki opis zakresu projektu',
            timelineFact: '4–6 tygodni',
            valueFact: '00 000',
        },
        needs: {
            sourceNote: 'briefing telefoniczny z dnia …',
            challengeText: 'Opis problemu lub wyzwania, z którym zmaga się klient — własnym, prostym językiem.',
            goalText: 'Co klient chce osiągnąć — mierzalne rezultaty, np. „skrócenie czasu obsługi zamówienia o 30%".',
            resultText: 'Po czym klient pozna, że projekt się udał — KPI, wskaźnik sukcesu.',
        },
        scope: {
            items: [
                { name: 'Analiza wymagań i brief', description: 'Zebranie i dokumentacja wszystkich wymagań projektowych.', optional: false },
                { name: 'Projekt koncepcyjny / UX', description: 'Szkice, makiety, prototyp interaktywny.', optional: false },
                { name: 'Realizacja etapu I', description: 'Główna część prac — implementacja rdzenia rozwiązania.', optional: false },
                { name: 'Realizacja etapu II', description: 'Integracje, testy, dopracowanie szczegółów.', optional: false },
                { name: 'Wdrożenie i przekazanie', description: 'Deploy na środowisko produkcyjne, szkolenie z obsługi.', optional: false },
                { name: 'Opieka powdrożeniowa', description: 'X tygodni bezpłatnego wsparcia po wdrożeniu.', optional: false },
                { name: 'Dodatkowy moduł A', description: 'Opis opcjonalnego rozszerzenia.', optional: true },
                { name: 'Dodatkowy moduł B', description: 'Opis opcjonalnego rozszerzenia.', optional: true },
            ],
            excludes: [
                'Hosting i domeny (po stronie klienta)',
                'Treści i materiały graficzne (po stronie klienta)',
                'Tłumaczenia i lokalizacja',
                'Integracje zewnętrzne spoza zakresu',
            ],
            assumptionText: 'Klient dostarcza treści i materiały w ciągu 3 dni roboczych od żądania. Zakres nie ulega zmianie bez pisemnego aneksu. Klient zapewnia dostęp do niezbędnych zasobów i środowisk.',
        },
        timeline: {
            steps: [
                { name: 'Kick-off i analiza', duration: '3–5 dni', description: 'Zebranie wymagań, ustalenie zakresu i planu pracy.', active: true },
                { name: 'Projekt / Prototyp', duration: '1–2 tyg.', description: 'Makiety, projekt wizualny, akceptacja klienta.', active: false },
                { name: 'Realizacja', duration: '2–4 tyg.', description: 'Główne prace implementacyjne zgodnie z zakresem.', active: false },
                { name: 'Testy i poprawki', duration: '3–5 dni', description: 'QA, testy akceptacyjne, wdrożenie poprawek.', active: false },
                { name: 'Wdrożenie', duration: '1–2 dni', description: 'Uruchomienie produkcyjne i przekazanie projektu.', active: false },
            ],
            startDate: '',
            endDate: '',
        },
        pricing: {
            pricingMode: 'simple',
            simplePrice: '00 000',
            simpleIncludes: [
                'Analiza i projekt koncepcyjny',
                'Realizacja zgodna z zakresem',
                'X rund bezpłatnych poprawek',
                'Wdrożenie na środowisko produkcyjne',
                'X tygodni wsparcia po wdrożeniu',
            ],
            categories: [
                {
                    name: 'Analiza i przygotowanie',
                    items: [
                        { name: 'Analiza wymagań', description: 'Warsztaty i dokumentacja', qty: '1', unit: 'szt.', unitPrice: '0', value: '0', optional: false },
                        { name: 'Projekt UX/UI', description: 'Makiety i projekt graficzny', qty: '1', unit: 'szt.', unitPrice: '0', value: '0', optional: false },
                    ],
                },
                {
                    name: 'Realizacja',
                    items: [
                        { name: 'Implementacja', description: 'Główne prace programistyczne', qty: '1', unit: 'szt.', unitPrice: '0', value: '0', optional: false },
                        { name: 'Wdrożenie', description: 'Deploy i konfiguracja', qty: '1', unit: 'szt.', unitPrice: '0', value: '0', optional: false },
                    ],
                },
            ],
            payments: [
                { percent: '30', amount: '0', when: 'przy podpisaniu umowy' },
                { percent: '40', amount: '0', when: 'po zatwierdzeniu etapu I' },
                { percent: '30', amount: '0', when: 'po wdrożeniu' },
            ],
            paymentNote: 'Faktury wystawiane na podstawie zatwierdzenia każdego etapu. Termin płatności: 14 dni.',
            priceOverride: null,
        },
        terms: {
            cards: [
                { icon: '📄', title: 'Forma umowy', text: 'Kontrakt B2B — umowa o świadczenie usług lub umowa o dzieło do ustalenia.' },
                { icon: '🔒', title: 'Poufność (NDA)', text: 'Wszelkie informacje przekazane w trakcie realizacji są poufne i nie będą udostępniane osobom trzecim.' },
                { icon: '©️', title: 'Prawa autorskie', text: 'Po opłaceniu ostatniej faktury pełne prawa majątkowe do wytworzonych materiałów przechodzą na Zamawiającego.' },
                { icon: '🔄', title: 'Poprawki i zmiany', text: 'Oferta obejmuje 3 rundy bezpłatnych poprawek. Każda dodatkowa runda wyceniana jest 150 zł/h.' },
                { icon: '⚖️', title: 'Odpowiedzialność', text: 'Wykonawca nie ponosi odpowiedzialności za opóźnienia wynikające z braku terminowego dostarczenia materiałów przez Zamawiającego.' },
                { icon: '📅', title: 'Wypowiedzenie', text: 'Każda ze stron może rozwiązać współpracę z 14-dniowym wypowiedzeniem. Rozliczenie za wykonaną pracę proporcjonalnie do zakresu.' },
            ],
        },
        footer: {
            ctaTitle: 'Gotowy żeby zacząć?',
            ctaSubtitle: 'Zaakceptuj ofertę lub napisz z pytaniami — odpowiem w ciągu',
            responseHours: '24',
            tagline: 'Specjalista w swojej dziedzinie. Rzetelne wyceny, terminy dotrzymane.',
            linkedinUrl: '#',
            githubUrl: '#',
            footerEmail: 'kontakt@firma.pl',
            footerPhone: '+48 000 000 000',
            footerWebsite: 'www.firma.pl',
        },
    }
}

// ── Merge ─────────────────────────────────────────────────────────────────────

const VALID_SECTIONS = new Set<UniversalSectionKey>(['summary', 'needs', 'scope', 'timeline', 'pricing', 'terms'])

export function mergeUniversalWithDefaults(saved: Partial<UniversalBlocks>): UniversalBlocks {
    const d = buildDefaultUniversalBlocks()
    return {
        version: 1,
        sections: Array.isArray(saved.sections)
            ? (saved.sections as string[]).filter((k): k is UniversalSectionKey => VALID_SECTIONS.has(k as UniversalSectionKey))
            : d.sections,
        cover: { ...d.cover, ...(saved.cover ?? {}) },
        summary: { ...d.summary, ...(saved.summary ?? {}) },
        needs: { ...d.needs, ...(saved.needs ?? {}) },
        scope: {
            ...d.scope,
            ...(saved.scope ?? {}),
            items: Array.isArray(saved.scope?.items) ? saved.scope.items : d.scope.items,
            excludes: Array.isArray(saved.scope?.excludes) ? saved.scope.excludes : d.scope.excludes,
        },
        timeline: {
            ...d.timeline,
            ...(saved.timeline ?? {}),
            steps: Array.isArray(saved.timeline?.steps) ? saved.timeline.steps : d.timeline.steps,
        },
        pricing: {
            ...d.pricing,
            ...(saved.pricing ?? {}),
            simpleIncludes: Array.isArray(saved.pricing?.simpleIncludes) ? saved.pricing.simpleIncludes : d.pricing.simpleIncludes,
            categories: Array.isArray(saved.pricing?.categories) ? saved.pricing.categories : d.pricing.categories,
            payments: Array.isArray(saved.pricing?.payments) ? saved.pricing.payments : d.pricing.payments,
            priceOverride: saved.pricing?.priceOverride !== undefined ? saved.pricing.priceOverride : d.pricing.priceOverride,
        },
        terms: {
            ...d.terms,
            ...(saved.terms ?? {}),
            cards: Array.isArray(saved.terms?.cards) ? saved.terms.cards : d.terms.cards,
        },
        footer: { ...d.footer, ...(saved.footer ?? {}) },
    }
}

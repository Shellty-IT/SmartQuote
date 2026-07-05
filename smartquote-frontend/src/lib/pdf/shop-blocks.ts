// src/lib/pdf/shop-blocks.ts
// Type definitions and default values for the "Sklep internetowy" offer template.

// ── Sub-types ─────────────────────────────────────────────────────────────────

export interface ShopScopeItem {
    icon: string
    title: string
    description: string
}

export interface PlatformOption {
    name: string
    /** If true, rendered as the highlighted (navy) "REKOMENDOWANA" card */
    recommended: boolean
    pros: string
    cons: string
    forWho: string
    /** Display string e.g. "8 000 zł" */
    priceFrom: string
}

export interface TimelineStep {
    title: string
    /** e.g. "7 dni" */
    duration: string
    description: string
}

export interface PricingTableItem {
    name: string
    description: string
    /** Display string e.g. "3 000 zł" */
    price: string
}

export interface PricingExtraItem {
    name: string
    /** Display string e.g. "+ 1 500 zł" */
    price: string
}

export interface PaymentScheduleItem {
    /** Display string e.g. "30%" */
    percent: string
    description: string
}

export interface WarrantyItem {
    icon: string
    title: string
    description: string
}

export interface ShopStat {
    value: string
    label: string
}

export interface SummaryColumn {
    title: string
    body: string
}

// ── Block shapes ──────────────────────────────────────────────────────────────

export interface ShopCoverBlock {
    /** Small uppercase tag above the heading, e.g. "Propozycja realizacji" */
    tag: string
    /** Lower half of the big heading, e.g. "SKLEPU INTERNETOWEGO" */
    subtitle: string
    /** Validity in days shown in the cover footer bar */
    validityDays: number
}

export interface ShopFooterBlock {
    ctaTitle: string
    ctaSubtitle: string
    ctaButtonText: string
}

export interface SummaryBlock {
    enabled: boolean
    columns: SummaryColumn[]
}

export interface ShopScopeBlock {
    enabled: boolean
    title: string
    items: ShopScopeItem[]
}

export interface PlatformsBlock {
    enabled: boolean
    title: string
    options: PlatformOption[]
}

export interface TimelineBlock {
    enabled: boolean
    title: string
    steps: TimelineStep[]
}

export interface ShopPricingBlock {
    enabled: boolean
    title: string
    items: PricingTableItem[]
    extras: PricingExtraItem[]
    paymentSchedule: PaymentScheduleItem[]
    /** When set, overrides the auto-calculated offer.totalGross */
    priceOverride: number | null
    priceType: 'net' | 'gross'
}

export interface TechStackBlock {
    enabled: boolean
    title: string
    tags: string[]
    description: string
}

export interface WarrantyBlock {
    enabled: boolean
    title: string
    items: WarrantyItem[]
    ctaTitle: string
    ctaSubtitle: string
    ctaButtonText: string
}

export interface ShopAboutBlock {
    enabled: boolean
    title: string
    description: string
    stats: ShopStat[]
}

// ── Section keys ──────────────────────────────────────────────────────────────

export type ShopSectionKey =
    | 'summary'
    | 'scope'
    | 'platforms'
    | 'timeline'
    | 'pricing'
    | 'techStack'
    | 'warranty'
    | 'about'

export const DEFAULT_SHOP_SECTIONS: ShopSectionKey[] = [
    'summary', 'scope', 'platforms', 'timeline', 'pricing', 'techStack', 'warranty', 'about',
]

export const ALL_SHOP_SECTION_KEYS: ShopSectionKey[] = [...DEFAULT_SHOP_SECTIONS]

// ── Root block ────────────────────────────────────────────────────────────────

export interface ShopBlocks {
    version: 1
    /** Section keys in render order (cover + footer are always present outside this array) */
    sections: ShopSectionKey[]
    cover: ShopCoverBlock
    footer: ShopFooterBlock
    summary: SummaryBlock
    scope: ShopScopeBlock
    platforms: PlatformsBlock
    timeline: TimelineBlock
    pricing: ShopPricingBlock
    techStack: TechStackBlock
    warranty: WarrantyBlock
    about: ShopAboutBlock
}

// ── Defaults ──────────────────────────────────────────────────────────────────

export function buildDefaultShopBlocks(): ShopBlocks {
    return {
        version: 1,
        sections: [...DEFAULT_SHOP_SECTIONS],

        cover: {
            tag: 'Propozycja realizacji',
            subtitle: 'SKLEPU INTERNETOWEGO',
            validityDays: 30,
        },

        footer: {
            ctaTitle: 'Gotowy na start?',
            ctaSubtitle: 'Zaakceptuj ofertę, a rozpoczniemy współpracę i ustalimy termin briefingu.',
            ctaButtonText: 'AKCEPTUJĘ OFERTĘ',
        },

        summary: {
            enabled: true,
            columns: [
                {
                    title: 'Cel projektu',
                    body: 'Uruchomienie wydajnego, bezpiecznego i łatwego w obsłudze sklepu internetowego, który realnie przełoży się na wzrost sprzedaży.',
                },
                {
                    title: 'Co dostarczamy',
                    body: 'Kompletny, gotowy do sprzedaży sklep: projekt graficzny, wdrożenie platformy, integracje płatności i logistyki, optymalizację SEO oraz szkolenie z obsługi.',
                },
            ],
        },

        scope: {
            enabled: true,
            title: 'Zakres prac',
            items: [
                { icon: '🎨', title: 'Projekt graficzny sklepu', description: 'Indywidualny, responsywny layout dopasowany do marki. Projekt UI strony głównej, kategorii, karty produktu i koszyka.' },
                { icon: '⚙️', title: 'Platforma i konfiguracja', description: 'Instalacja i pełna konfiguracja silnika sklepu, struktura kategorii, zarządzanie produktami i panel administracyjny.' },
                { icon: '💳', title: 'Integracje płatności', description: 'Bramki płatnicze: PayU, Przelewy24 oraz Stripe. Płatności kartą, BLIK i szybkie przelewy online.' },
                { icon: '📦', title: 'Integracje logistyczne', description: 'Wysyłki z InPost (paczkomaty) i DPD. Automatyczne generowanie etykiet i śledzenie statusu przesyłek.' },
                { icon: '🔍', title: 'Optymalizacja SEO', description: 'Optymalizacja techniczna pod wyszukiwarki: meta dane, szybkość ładowania, mapa strony, dane strukturalne.' },
                { icon: '🎓', title: 'Szkolenie i dokumentacja', description: 'Szkolenie z obsługi sklepu oraz dokumentacja krok po kroku. Samodzielne zarządzanie zamówieniami i produktami.' },
            ],
        },

        platforms: {
            enabled: true,
            title: 'Opcje platformy',
            options: [
                {
                    name: 'WooCommerce',
                    recommended: true,
                    pros: 'Elastyczność, ogromny ekosystem wtyczek, niski koszt startu, łatwa rozbudowa i pełna własność danych.',
                    cons: 'Wymaga utrzymania aktualizacji i dobrego hostingu.',
                    forWho: 'Małe i średnie sklepy szukające równowagi ceny i możliwości.',
                    priceFrom: '8 000 zł',
                },
                {
                    name: 'PrestaShop',
                    recommended: false,
                    pros: 'Rozbudowane funkcje e-commerce out-of-the-box, dobre zarządzanie dużym katalogiem produktów.',
                    cons: 'Bardziej złożona personalizacja, droższe moduły premium.',
                    forWho: 'Sklepy z dużą liczbą produktów i wariantów.',
                    priceFrom: '11 000 zł',
                },
                {
                    name: 'Rozwiązanie dedykowane',
                    recommended: false,
                    pros: 'Pełna kontrola nad funkcjami i wydajnością, brak ograniczeń gotowych systemów.',
                    cons: 'Najwyższy koszt i najdłuższy czas realizacji.',
                    forWho: 'Projekty o niestandardowych wymaganiach i dużej skali.',
                    priceFrom: '25 000 zł',
                },
            ],
        },

        timeline: {
            enabled: true,
            title: 'Harmonogram realizacji',
            steps: [
                { title: 'Briefing i analiza', duration: '3 dni', description: 'Zebranie wymagań, analiza konkurencji, ustalenie celów.' },
                { title: 'Projekt UX/UI', duration: '7 dni', description: 'Makiety, projekt graficzny, akceptacja kierunku wizualnego.' },
                { title: 'Wdrożenie', duration: '14 dni', description: 'Budowa sklepu, integracje płatności i logistyki, treści.' },
                { title: 'Testy i szkolenie', duration: '5 dni', description: 'Testy funkcjonalne, optymalizacja, szkolenie zespołu.' },
                { title: 'Uruchomienie i odbiór', duration: '2 dni', description: 'Publikacja sklepu, przekazanie dostępów, start sprzedaży.' },
            ],
        },

        pricing: {
            enabled: true,
            title: 'Wycena',
            items: [
                { name: 'Projekt graficzny UX/UI', description: 'Makiety i projekt wszystkich kluczowych widoków', price: '3 000 zł' },
                { name: 'Wdrożenie platformy', description: 'Instalacja, konfiguracja i wdrożenie projektu', price: '5 500 zł' },
                { name: 'Integracje płatności', description: 'PayU, Przelewy24, Stripe', price: '1 200 zł' },
                { name: 'Integracje logistyczne', description: 'InPost, DPD — etykiety i śledzenie', price: '1 000 zł' },
                { name: 'Optymalizacja SEO', description: 'Konfiguracja techniczna pod wyszukiwarki', price: '800 zł' },
                { name: 'Szkolenie i dokumentacja', description: 'Szkolenie zespołu + instrukcja obsługi', price: '700 zł' },
            ],
            extras: [
                { name: 'Migracja produktów z obecnego sklepu', price: '+ 1 500 zł' },
                { name: 'Integracja z systemem ERP / fakturowaniem', price: '+ 2 200 zł' },
                { name: 'Sesja zdjęciowa produktów', price: '+ wycena indywidualna' },
            ],
            paymentSchedule: [
                { percent: '30%', description: 'Zaliczka przy podpisaniu umowy' },
                { percent: '40%', description: 'Po zakończeniu etapu wdrożenia' },
                { percent: '30%', description: 'Przy odbiorze i uruchomieniu' },
            ],
            priceOverride: null,
            priceType: 'gross',
        },

        techStack: {
            enabled: true,
            title: 'Stack technologiczny',
            tags: ['WordPress', 'WooCommerce', 'PHP', 'MySQL', 'JavaScript', 'Git', 'SSL', 'cPanel'],
            description: 'Sklep działa na sprawdzonym, otwartym stacku, co zapewnia stabilność, bezpieczeństwo i niezależność od zamkniętych platform. Zalecany hosting: SSD, PHP 8.x, certyfikat SSL oraz min. 2 GB RAM.',
        },

        warranty: {
            enabled: true,
            title: 'Gwarancja i wsparcie powdrożeniowe',
            items: [
                { icon: '🛡️', title: 'Gwarancja 12 miesięcy', description: 'Pełna gwarancja na poprawne działanie wdrożonych funkcji przez 12 miesięcy od odbioru.' },
                { icon: '📞', title: 'Wsparcie techniczne', description: 'Pomoc w razie problemów technicznych, czas reakcji do 24h w dni robocze.' },
                { icon: '🔄', title: 'Bezpłatne poprawki', description: 'Korekta usterek i drobnych błędów objętych gwarancją bez dodatkowych kosztów.' },
            ],
            ctaTitle: 'Potrzebujesz stałej opieki?',
            ctaSubtitle: 'Zapytaj o pakiet SLA — aktualizacje, kopie zapasowe i monitoring.',
            ctaButtonText: 'Zapytaj o pakiet SLA',
        },

        about: {
            enabled: true,
            title: 'O wykonawcy',
            description: 'Specjalista IT specjalizujący się w projektowaniu i wdrażaniu sklepów internetowych. Dbam o jakość kodu, terminowość i pełną transparentność na każdym etapie projektu.',
            stats: [
                { value: '10+', label: 'lat doświadczenia' },
                { value: '50+', label: 'zrealizowanych projektów' },
                { value: '40+', label: 'zadowolonych klientów' },
            ],
        },
    }
}

/** Merge saved blocks (from DB) with current defaults — ensures new fields always have values */
export function mergeShopWithDefaults(
    saved: Partial<ShopBlocks> | null | undefined,
): ShopBlocks {
    const defaults = buildDefaultShopBlocks()
    if (!saved) return defaults

    const validSet = new Set<string>(ALL_SHOP_SECTION_KEYS)
    const filterValid = (arr: ShopSectionKey[]) => arr.filter((k) => validSet.has(k))

    return {
        version: 1,
        sections: Array.isArray(saved.sections) ? filterValid(saved.sections) : defaults.sections,
        cover: { ...defaults.cover, ...saved.cover },
        footer: { ...defaults.footer, ...saved.footer },
        summary: {
            ...defaults.summary,
            ...saved.summary,
            columns: saved.summary?.columns ?? defaults.summary.columns,
        },
        scope: {
            ...defaults.scope,
            ...saved.scope,
            items: saved.scope?.items ?? defaults.scope.items,
        },
        platforms: {
            ...defaults.platforms,
            ...saved.platforms,
            options: saved.platforms?.options ?? defaults.platforms.options,
        },
        timeline: {
            ...defaults.timeline,
            ...saved.timeline,
            steps: saved.timeline?.steps ?? defaults.timeline.steps,
        },
        pricing: {
            ...defaults.pricing,
            ...saved.pricing,
            items: saved.pricing?.items ?? defaults.pricing.items,
            extras: saved.pricing?.extras ?? defaults.pricing.extras,
            paymentSchedule: saved.pricing?.paymentSchedule ?? defaults.pricing.paymentSchedule,
        },
        techStack: {
            ...defaults.techStack,
            ...saved.techStack,
            tags: saved.techStack?.tags ?? defaults.techStack.tags,
        },
        warranty: {
            ...defaults.warranty,
            ...saved.warranty,
            items: saved.warranty?.items ?? defaults.warranty.items,
        },
        about: {
            ...defaults.about,
            ...saved.about,
            stats: saved.about?.stats ?? defaults.about.stats,
        },
    }
}

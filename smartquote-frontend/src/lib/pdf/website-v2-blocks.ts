// src/lib/pdf/website-v2-blocks.ts
// Block type definitions for the "Strona internetowa v2" offer template.

export type WebsiteV2SectionKey =
    | 'problem'
    | 'about'
    | 'features'
    | 'portfolio'
    | 'process'
    | 'technology'
    | 'pricing'
    | 'faq'

// ── Sub-types ────────────────────────────────────────────────────────────────

export interface WV2PainPoint { emoji: string; text: string }
export interface WV2StatItem { value: string; label: string }
export interface WV2FeatureItem { title: string; description: string }
export interface WV2PortfolioItem { name: string; url: string; imageUrl?: string }
export interface WV2Testimonial { stars: number; text: string; name: string; company: string }
export interface WV2ProcessStep { title: string; description: string }
export interface WV2TechRecommended {
    iconChar: string
    iconBg: string
    name: string
    description: string
    pros: string[]
}
export interface WV2TechAlt {
    name: string
    subtitle: string
    badge: string
    description: string
    pros: string[]
}
export interface WV2PaymentStep { percent: number; label: string }
export interface WV2RecurringCost { type: string; amount: string; description: string }
export interface WV2Guarantee { emoji: string; text: string }
export interface WV2FaqItem { question: string; answer: string }

// ── Block interfaces ──────────────────────────────────────────────────────────

export interface WV2CoverBlock {
    title: string
    recipientName: string
    subtitle: string
    knowledgePill: string
    deadlineDays: number
    validityDays: number
}

export interface WV2FooterBlock {
    tagline: string
}

export interface WV2ProblemBlock {
    enabled: boolean
    title: string
    painPoints: WV2PainPoint[]
    punchline: string
}

export interface WV2AboutBlock {
    enabled: boolean
    title: string
    name: string
    role: string
    bio: string
    stats: WV2StatItem[]
}

export interface WV2FeaturesBlock {
    enabled: boolean
    title: string
    subtitle: string
    items: WV2FeatureItem[]
    extras: string[]
}

export interface WV2PortfolioBlock {
    enabled: boolean
    title: string
    subtitle: string
    works: WV2PortfolioItem[]
    testimonials: WV2Testimonial[]
}

export interface WV2ProcessBlock {
    enabled: boolean
    title: string
    steps: WV2ProcessStep[]
    timelineNote: string
}

export interface WV2TechnologyBlock {
    enabled: boolean
    title: string
    subtitle: string
    recommended: WV2TechRecommended
    alternatives: WV2TechAlt[]
    footer: string
}

export interface WV2PricingBlock {
    enabled: boolean
    priceOverride: number | null
    includes: string[]
    paymentSchedule: WV2PaymentStep[]
    guarantees: WV2Guarantee[]
    costs: WV2RecurringCost[]
}

export interface WV2FaqBlock {
    enabled: boolean
    title: string
    subtitle: string
    items: WV2FaqItem[]
}

// ── Root ─────────────────────────────────────────────────────────────────────

export interface WebsiteV2Blocks {
    version: 1
    sections: WebsiteV2SectionKey[]
    cover: WV2CoverBlock
    footer: WV2FooterBlock
    problem: WV2ProblemBlock
    about: WV2AboutBlock
    features: WV2FeaturesBlock
    portfolio: WV2PortfolioBlock
    process: WV2ProcessBlock
    technology: WV2TechnologyBlock
    pricing: WV2PricingBlock
    faq: WV2FaqBlock
}

export const DEFAULT_WV2_SECTIONS: WebsiteV2SectionKey[] = [
    'problem', 'about', 'features', 'portfolio', 'process', 'technology', 'pricing', 'faq',
]

export const ALL_WV2_SECTION_KEYS: WebsiteV2SectionKey[] = [
    'problem', 'about', 'features', 'portfolio', 'process', 'technology', 'pricing', 'faq',
]

// ── Defaults ─────────────────────────────────────────────────────────────────

export function buildDefaultWebsiteV2Blocks(): WebsiteV2Blocks {
    return {
        version: 1,
        sections: [...DEFAULT_WV2_SECTIONS],
        cover: {
            title: 'Strona internetowa',
            recipientName: '',
            subtitle: 'Prosta, nowoczesna strona, która sprawi, że klienci znajdą Cię w internecie.',
            knowledgePill: 'Obsługa bez technicznej wiedzy',
            deadlineDays: 14,
            validityDays: 14,
        },
        footer: {
            tagline: 'Tworzę proste, nowoczesne strony dla małych firm — bez technicznego żargonu.',
        },
        problem: {
            enabled: true,
            title: 'Czy to brzmi znajomo?',
            painPoints: [
                { emoji: '😟', text: 'Nie mam strony internetowej, a klienci szukają mnie w Google i nie mogą znaleźć.' },
                { emoji: '📱', text: 'Mam starą stronę, która źle wygląda na telefonie.' },
                { emoji: '⏰', text: 'Nie mam czasu na skomplikowane systemy — potrzebuję czegoś prostego do zarządzania.' },
            ],
            punchline: 'Dokładnie dlatego tu jestem.',
        },
        about: {
            enabled: true,
            title: 'Kto przygotuje Twoją stronę',
            name: 'Imię Nazwisko',
            role: 'Twórca stron dla małych firm',
            bio: 'Pomagam małym firmom zaistnieć w internecie — prosto, bez technicznego żargonu i bez zostawiania Cię samego po starcie. Pracujesz bezpośrednio ze mną, od pierwszej rozmowy aż po uruchomienie.',
            stats: [
                { value: '50+', label: 'zrobionych stron' },
                { value: '8 lat', label: 'doświadczenia' },
                { value: '1:1', label: 'kontakt bez pośredników' },
            ],
        },
        features: {
            enabled: true,
            title: 'Co zawiera Twoja strona',
            subtitle: 'Wszystko, czego potrzebuje mała firma, by zaistnieć w internecie — w jednym pakiecie.',
            items: [
                { title: 'Projekt graficzny dopasowany do Twojej firmy', description: 'W Twoich kolorach i stylu — klienci od razu widzą profesjonalną firmę.' },
                { title: 'Do 5 podstron', description: 'np. Start, O nas, Oferta, Kontakt — wszystko, czego szuka klient.' },
                { title: 'Działa perfekcyjnie na telefonie i tablecie', description: 'Większość klientów ogląda strony na telefonie — Twoja będzie wyglądać świetnie.' },
                { title: 'Formularz kontaktowy', description: 'Klienci napiszą do Ciebie jednym kliknięciem, bez szukania numeru.' },
                { title: 'Certyfikat bezpieczeństwa SSL', description: 'Zielona kłódka w przeglądarce — klienci widzą, że stronie można zaufać.' },
                { title: 'Podstawowe ustawienia SEO', description: 'Żeby klienci znaleźli Cię w Google, zanim trafią do konkurencji.' },
                { title: 'Szkolenie z obsługi', description: 'Pokażę Ci, jak zmienić tekst czy zdjęcie — bez dzwonienia do informatyka.' },
                { title: '3 miesiące bezpłatnego wsparcia', description: 'Gdyby coś było niejasne po starcie — jestem do dyspozycji bez dodatkowych kosztów.' },
            ],
            extras: ['Blog / aktualności', 'Sklep internetowy', 'Rezerwacja online'],
        },
        portfolio: {
            enabled: true,
            title: 'Wybrane realizacje',
            subtitle: 'Kilka stron, które zbudowałem dla podobnych firm. Najlepiej zobacz na żywo.',
            works: [
                { name: 'Nazwa firmy / branża', url: '#', imageUrl: '' },
                { name: 'Nazwa firmy / branża', url: '#', imageUrl: '' },
                { name: 'Nazwa firmy / branża', url: '#', imageUrl: '' },
            ],
            testimonials: [
                { stars: 5, text: 'Krótka, autentyczna opinia klienta — co się zmieniło dzięki stronie.', name: 'Jan K.', company: 'Firma XYZ' },
                { stars: 5, text: 'Druga opinia — najlepiej o prostocie obsługi lub kontakcie.', name: 'Anna M.', company: 'Firma ABC' },
            ],
        },
        process: {
            enabled: true,
            title: 'Jak wygląda nasza współpraca',
            steps: [
                { title: 'Rozmawiamy', description: 'Opowiedz mi o swojej firmie i czego potrzebujesz. Spotkanie online lub telefon — jak Ci wygodnie. To nic nie kosztuje.' },
                { title: 'Projektuję', description: 'Przygotuję wygląd strony i pokażę Ci, jak będzie wyglądać, zanim powstanie. Możesz zgłosić uwagi.' },
                { title: 'Buduję', description: 'Tworzę stronę według zatwierdzonego projektu. Na bieżąco informuję o postępach.' },
                { title: 'Oddaję i uczę', description: 'Uruchamiamy stronę. Pokazuję Ci, jak nią zarządzać. Jestem dostępny, jeśli coś będzie niejasne.' },
            ],
            timelineNote: 'Całość zajmuje zazwyczaj od 7 do 14 dni roboczych.',
        },
        technology: {
            enabled: true,
            title: 'Na jakiej technologii zbudujemy Twoją stronę?',
            subtitle: 'Nie musisz tego rozstrzygać. Poniżej moja rekomendacja dla Twojej firmy — resztę zostaw mnie.',
            recommended: {
                iconChar: 'W',
                iconBg: '#21759B',
                name: 'Rekomenduję: WordPress',
                description: 'Dla Twojej firmy i budżetu to najlepszy wybór: najłatwiej go samodzielnie obsłużysz — po wdrożeniu sam dodasz zdjęcie, wpis czy aktualność, jak w edytorze tekstu. To najpopularniejsza i najbardziej sprawdzona platforma na świecie.',
                pros: ['Łatwa samodzielna edycja', 'Duży wybór wtyczek', 'Pomoc znajdziesz wszędzie w sieci'],
            },
            alternatives: [
                {
                    name: 'Next.js + Payload',
                    subtitle: 'Nowoczesna i błyskawicznie szybka',
                    badge: '⚡ NOWOCZESNA',
                    description: 'Strona budowana od podstaw — ładuje się w ułamku sekundy i wyróżnia na tle konkurencji. Edycja przez prosty panel.',
                    pros: ['Wyjątkowa szybkość działania', 'Unikalny, niestandardowy wygląd'],
                },
            ],
            footer: 'Nie jesteś pewien? Zostaw to mnie — doradzę najlepsze rozwiązanie dla Twojej firmy i budżetu.',
        },
        pricing: {
            enabled: true,
            priceOverride: null,
            includes: [
                'Projekt i budowa całej strony',
                'Wersja na telefon, tablet i komputer',
                'Formularz kontaktowy i certyfikat SSL',
                'Szkolenie i 3 mies. wsparcia',
            ],
            paymentSchedule: [
                { percent: 50, label: 'zaliczki na start' },
                { percent: 50, label: 'przy odbiorze strony' },
            ],
            guarantees: [
                { emoji: '🛡️', text: 'Gwarancja 12 miesięcy' },
                { emoji: '🔄', text: '2 rundy bezpłatnych poprawek' },
                { emoji: '📞', text: 'Wsparcie po uruchomieniu' },
            ],
            costs: [
                { type: 'Jednorazowo', amount: '—', description: 'wykonanie strony — płacisz raz' },
                { type: 'Rocznie', amount: 'ok. 400 zł/rok', description: 'hosting + domena — płatne raz w roku, niezależnie ode mnie' },
            ],
        },
        faq: {
            enabled: true,
            title: 'Częste pytania',
            subtitle: 'To, o co klienci pytają najczęściej — żebyś nie musiał się zastanawiać.',
            items: [
                { question: 'Czyja będzie domena i kto jest właścicielem strony?', answer: 'Domena i strona są w 100% Twoją własnością. Rejestruję je na Ciebie i przekazuję pełne dostępy — nigdy nie jesteś ode mnie uzależniony.' },
                { question: 'Co muszę przygotować z mojej strony?', answer: 'Najlepiej teksty o firmie i zdjęcia, jeśli je masz. Jeśli nie — pomogę je dopracować lub doradzę, skąd wziąć dobre zdjęcia.' },
                { question: 'Czy mogę sam edytować stronę później?', answer: 'Tak. Po wdrożeniu pokażę Ci, jak zmienić tekst, zdjęcie czy dodać aktualność. To prostsze, niż myślisz.' },
                { question: 'Co, jeśli za rok będę chciał zmiany?', answer: 'Drobne zmiany w ramach wsparcia są bezpłatne. Większe rozbudowy wyceniam osobno — zawsze wiesz, ile zapłacisz, zanim zaczniemy.' },
                { question: 'Ile kosztuje utrzymanie strony?', answer: 'Hosting i domena to koszt roczny ok. 400 zł/rok. Poza tym strona nie generuje stałych opłat.' },
                { question: 'Co, jeśli coś przestanie działać?', answer: 'W okresie gwarancji naprawiam bezpłatnie. Później wciąż jestem dostępny — wystarczy napisać lub zadzwonić.' },
            ],
        },
    }
}

// ── Merge helper ──────────────────────────────────────────────────────────────

const VALID_SECTIONS = new Set<WebsiteV2SectionKey>(ALL_WV2_SECTION_KEYS)

export function mergeWebsiteV2WithDefaults(
    saved: Partial<WebsiteV2Blocks> | null | undefined,
): WebsiteV2Blocks {
    const defaults = buildDefaultWebsiteV2Blocks()
    if (!saved) return defaults

    return {
        version: 1,
        sections: Array.isArray(saved.sections)
            ? (saved.sections.filter((s) => VALID_SECTIONS.has(s)) as WebsiteV2SectionKey[])
            : defaults.sections,
        cover: { ...defaults.cover, ...(saved.cover ?? {}) },
        footer: { ...defaults.footer, ...(saved.footer ?? {}) },
        problem: { ...defaults.problem, ...(saved.problem ?? {}) },
        about: { ...defaults.about, ...(saved.about ?? {}) },
        features: { ...defaults.features, ...(saved.features ?? {}) },
        portfolio: { ...defaults.portfolio, ...(saved.portfolio ?? {}) },
        process: { ...defaults.process, ...(saved.process ?? {}) },
        technology: {
            ...defaults.technology,
            ...(saved.technology ?? {}),
            recommended: { ...defaults.technology.recommended, ...(saved.technology?.recommended ?? {}) },
        },
        pricing: { ...defaults.pricing, ...(saved.pricing ?? {}) },
        faq: { ...defaults.faq, ...(saved.faq ?? {}) },
    }
}

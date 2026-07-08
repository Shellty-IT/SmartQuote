// src/lib/pdf/mobile-app-blocks.ts
// Block types and defaults for the "Aplikacja mobilna - zaawansowana" offer template.
// Visual design: deep indigo #1E1B4B + rose #F43F5E + indigo-light #818CF8.

export type MobileAppSectionKey =
    | 'vision'
    | 'platform'
    | 'scope'
    | 'architecture'
    | 'timeline'
    | 'pricing'
    | 'postlaunch'
    | 'about'

export type MobileAppPageBreakKey = 'cover' | MobileAppSectionKey

// ── Sub-types ─────────────────────────────────────────────────────────────────

export interface MobileAppVisionCard {
    emoji: string
    accent: 'rose' | 'indigo' | 'green'
    title: string
    description: string
}

export type MobileAppBadgeStyle = 'recommended' | 'performance' | 'premium' | 'budget'

export interface MobileAppPlatformCard {
    icon: string
    title: string
    badge: string
    badgeStyle: MobileAppBadgeStyle
    tag: string
    description: string
    pros: string[]
    warnings: string[]
}

export type MobileAppFeatureStatus = 'included' | 'tbd' | 'optional'
export type MobileAppFeatureComplexity = 'low' | 'medium' | 'high'

export interface MobileAppFeatureCard {
    emoji: string
    title: string
    description: string
    complexity: MobileAppFeatureComplexity
    status: MobileAppFeatureStatus
}

export type MobileAppBackendStatus = 'selected' | 'option' | 'alternative'

export interface MobileAppBackendOption {
    icon: string
    title: string
    description: string
    status: MobileAppBackendStatus
    accentColor: string
}

export interface MobileAppServerCostRow {
    name: string
    cost: string
    target: string
}

export interface MobileAppTimelineStage {
    title: string
    description: string
    deliverable: string
    weeks: string
    paymentPercent: string
    paymentAmount: string
}

export interface MobileAppPricingLineItem {
    name: string
    scope: string
    weeks: string
    price: string
}

export interface MobileAppPricingPhase {
    label: string
    items: MobileAppPricingLineItem[]
}

export interface MobileAppPricingAddon {
    name: string
    price: string
}

export interface MobileAppMaintenancePlan {
    emoji: string
    title: string
    description: string
    price: string
    highlighted: boolean
}

export interface MobileAppMaintenanceCostRow {
    service: string
    cost: string
    notes: string
}

export interface MobileAppPortfolioCard {
    gradientFrom: string
    gradientTo: string
    title: string
    description: string
    tag: string
    storeLabel: string
}

// ── Block interfaces ──────────────────────────────────────────────────────────

export interface MobileAppCoverBlock {
    eyebrow: string
    titlePrefix: string
    titleAccent: string
    projectName: string
    clientName: string
    platformPill: string
    mvpWeeks: string
    priceFrom: string
    promises: string[]
}

export interface MobileAppVisionBlock {
    sectionTitle: string
    sectionLead: string
    projectDescription: string
    cards: MobileAppVisionCard[]
}

export interface MobileAppPlatformBlock {
    sectionTitle: string
    sectionLead: string
    cards: MobileAppPlatformCard[]
    footerNote: string
}

export interface MobileAppScopeBlock {
    sectionTitle: string
    mvpTimeline: string
    mvpPriceFrom: string
    mvpFeatures: string[]
    mvpNote: string
    fullTimeline: string
    fullPriceFrom: string
    fullFeatures: string[]
    fullNote: string
    recommendationNote: string
    featuresTitle: string
    features: MobileAppFeatureCard[]
    footerNote: string
}

export interface MobileAppArchitectureBlock {
    sectionTitle: string
    sectionLead: string
    backendOptions: MobileAppBackendOption[]
    warningNote: string
    serverCostRows: MobileAppServerCostRow[]
}

export interface MobileAppTimelineBlock {
    sectionTitle: string
    sectionLead: string
    stages: MobileAppTimelineStage[]
}

export interface MobileAppPricingBlock {
    sectionTitle: string
    sectionLead: string
    phases: MobileAppPricingPhase[]
    totalWeeks: string
    totalNet: string
    vat: number
    addons: MobileAppPricingAddon[]
    priceOverride: number | null
}

export interface MobileAppPostLaunchBlock {
    sectionTitle: string
    sectionLead: string
    maintenancePlans: MobileAppMaintenancePlan[]
    maintenanceCosts: MobileAppMaintenanceCostRow[]
    warningNote: string
}

export interface MobileAppAboutBlock {
    sectionTitle: string
    bio: string
    techStack: string[]
    stats: Array<{ value: string; label: string }>
    portfolioCards: MobileAppPortfolioCard[]
    linkedinUrl: string
    githubUrl: string
    portfolioUrl: string
}

export interface MobileAppFooterBlock {
    ctaHeadline: string
    ctaLead: string
    companyTagline: string
    contactEmail: string
    contactPhone: string
    websiteUrl: string
    summaryPlatform: string
    summaryScope: string
    summaryTime: string
    summaryValue: string
    validityDate?: string
}

// ── Root type ─────────────────────────────────────────────────────────────────

export interface MobileAppBlocks {
    version: 1
    sections: MobileAppSectionKey[]
    pageBreakAfter: MobileAppPageBreakKey[]
    cover: MobileAppCoverBlock
    footer: MobileAppFooterBlock
    vision: MobileAppVisionBlock
    platform: MobileAppPlatformBlock
    scope: MobileAppScopeBlock
    architecture: MobileAppArchitectureBlock
    timeline: MobileAppTimelineBlock
    pricing: MobileAppPricingBlock
    postlaunch: MobileAppPostLaunchBlock
    about: MobileAppAboutBlock
}

// ── Defaults ──────────────────────────────────────────────────────────────────

export function buildDefaultMobileAppBlocks(): MobileAppBlocks {
    return {
        version: 1,
        sections: ['vision', 'platform', 'scope', 'architecture', 'timeline', 'pricing', 'postlaunch', 'about'],
        pageBreakAfter: [],
        cover: {
            eyebrow: 'Propozycja realizacji',
            titlePrefix: 'Twoja aplikacja',
            titleAccent: 'mobilna',
            projectName: 'Nazwa projektu',
            clientName: 'Nazwa firmy / klienta',
            platformPill: 'iOS + Android',
            mvpWeeks: '8',
            priceFrom: 'XXX',
            promises: [
                'Projekt UX/UI w cenie',
                'Publikacja w App Store i Google Play',
                'Kod oddany do Ciebie',
                'Wsparcie po wdrożeniu',
            ],
        },
        footer: {
            ctaHeadline: 'Gotowy żeby zobaczyć swój pomysł w App Store?',
            ctaLead: 'Następny krok to bezpłatna rozmowa — 30 minut, żeby ocenić projekt i odpowiedzieć na wszystkie pytania.',
            companyTagline: 'Projektuję i buduję aplikacje mobilne, które trafiają do sklepów i do użytkowników.',
            contactEmail: 'kontakt@twoja-strona.pl',
            contactPhone: '+48 000 000 000',
            websiteUrl: 'www.twoja-strona.pl',
            summaryPlatform: 'React Native',
            summaryScope: 'MVP + Pełna aplikacja',
            summaryTime: 'ok. 4–6 miesięcy',
            summaryValue: 'XX 000',
            validityDate: '',
        },
        vision: {
            sectionTitle: 'Rozumiemy co chcesz osiągnąć',
            sectionLead: 'Zanim napiszemy linijkę kodu — musimy razem zrozumieć cel.',
            projectDescription: 'Opis projektu / wizji klienta — 2–3 zdania narracyjnie co klient chce osiągnąć i jaką wartość aplikacja ma dostarczyć na rynku.',
            cards: [
                { emoji: '🎯', accent: 'rose', title: 'Cel biznesowy', description: 'Co aplikacja ma osiągnąć dla biznesu — np. zwiększenie sprzedaży, automatyzacja procesów, dotarcie do nowych klientów.' },
                { emoji: '👤', accent: 'indigo', title: 'Użytkownik docelowy', description: 'Kto będzie używał aplikacji — profil demograficzny, potrzeby i problemy które rozwiązujemy.' },
                { emoji: '📈', accent: 'green', title: 'Miernik sukcesu', description: 'Po czym poznamy że projekt się udał — liczba pobrań, konwersja, przychód, redukcja kosztów.' },
            ],
        },
        platform: {
            sectionTitle: 'Na czym zbudujemy Twoją aplikację',
            sectionLead: 'To jedna z najważniejszych decyzji projektowych. Poniżej wyjaśniamy konsekwencje każdego wyboru — bez technicznego żargonu.',
            cards: [
                {
                    icon: '⚛',
                    title: 'React Native',
                    badge: '★ REKOMENDOWANE',
                    badgeStyle: 'recommended',
                    tag: 'CROSS-PLATFORM',
                    description: 'Jedna baza kodu działa na iOS i Android. Szybszy development, niższy koszt, 95% możliwości natywnych.',
                    pros: ['Niższy koszt i krótszy czas', 'Jeden zespół, dwie platformy', 'Ogromny ekosystem bibliotek'],
                    warnings: ['Bardzo zaawansowane animacje wymagają natywnych wstawek'],
                },
                {
                    icon: 'F',
                    title: 'Flutter',
                    badge: '⚡ WYSOKA WYDAJNOŚĆ',
                    badgeStyle: 'performance',
                    tag: 'CROSS-PLATFORM',
                    description: 'Framework Google — piękny UI, świetna wydajność. Dobry wybór gdy design jest priorytetem.',
                    pros: ['Dopracowane, spójne UI', 'Świetne animacje 60 fps', 'Jeden kod na obie platformy'],
                    warnings: ['Mniejszy ekosystem niż React Native'],
                },
                {
                    icon: 'Swift 🍎 + Kotlin 🤖',
                    title: 'Natywne',
                    badge: '💎 PREMIUM',
                    badgeStyle: 'premium',
                    tag: 'NATYWNE iOS + ANDROID',
                    description: 'Dwie osobne aplikacje — maksymalna wydajność i dostęp do wszystkich funkcji systemu. Wyższy koszt, dłuższy czas.',
                    pros: ['Maksymalna wydajność', 'Pełny dostęp do API systemu'],
                    warnings: ['Dwa razy więcej kodu', 'Najwyższy koszt i czas'],
                },
                {
                    icon: '🌐',
                    title: 'PWA',
                    badge: '💡 BUDŻETOWA OPCJA',
                    badgeStyle: 'budget',
                    tag: 'WEB-BASED',
                    description: 'Strona internetowa zachowująca się jak aplikacja — bez instalacji ze sklepu. Najszybsze i najtańsze rozwiązanie dla prostych przypadków.',
                    pros: ['Najniższy koszt i czas', 'Bez akceptacji sklepów'],
                    warnings: ['Ograniczony dostęp do funkcji telefonu', 'Brak obecności w App Store'],
                },
            ],
            footerNote: 'Nie jesteś pewien? Wskaż budżet i cel — dobiorę platformę optymalną dla Twojego przypadku.',
        },
        scope: {
            sectionTitle: 'Od czego zaczynamy?',
            mvpTimeline: '8–12 tyg.',
            mvpPriceFrom: 'XX 000',
            mvpFeatures: [
                'Rejestracja i logowanie',
                'Ekran główny z kluczową funkcją',
                'Podstawowy profil użytkownika',
                'Jedna kluczowa ścieżka biznesowa',
                'Powiadomienia push',
                'Publikacja w obu sklepach',
            ],
            mvpNote: 'Idealne żeby przetestować pomysł, pozyskać inwestora lub pierwszych klientów.',
            fullTimeline: '4–6 mies.',
            fullPriceFrom: 'XX 000',
            fullFeatures: [
                'Wszystko z MVP',
                'Płatności in-app i subskrypcje',
                'Chat / wiadomości real-time',
                'Geolokalizacja i mapy',
                'System ocen i recenzji',
                'Wyszukiwarka i filtry',
                'Panel administratora (web)',
                'Integracje zewnętrzne i analityka',
            ],
            fullNote: 'Gotowy produkt z pełną funkcjonalnością, panelem admina i integracjami.',
            recommendationNote: 'Zacznij od MVP. Jeśli rynek odpowie pozytywnie — rozbudujemy razem. To minimalizuje ryzyko finansowe.',
            featuresTitle: 'Jakie funkcje zawiera Twoja aplikacja',
            features: [
                { emoji: '👤', title: 'Rejestracja i logowanie', description: 'Email, logowanie social (Google/Apple) oraz biometria. Bezpieczne sesje i reset hasła.', complexity: 'medium', status: 'included' },
                { emoji: '🏠', title: 'Ekran główny (Dashboard)', description: 'Personalizowany pulpit z najważniejszymi danymi i skrótami. Powiadomienia w kontekście.', complexity: 'medium', status: 'included' },
                { emoji: '🔔', title: 'Push Notifications', description: 'Powiadomienia lokalne i zdalne z segmentacją odbiorców i harmonogramem wysyłki.', complexity: 'medium', status: 'included' },
                { emoji: '💳', title: 'Płatności in-app', description: 'Stripe / PayU / Apple Pay / Google Pay. Subskrypcje, faktury i obsługa zwrotów.', complexity: 'high', status: 'included' },
                { emoji: '📍', title: 'Geolokalizacja i Mapy', description: 'GPS, geofencing, mapowanie tras i wyszukiwanie po lokalizacji (Google / Apple Maps).', complexity: 'high', status: 'tbd' },
                { emoji: '📷', title: 'Aparat i galeria', description: 'Upload zdjęć i wideo, kompresja oraz kadrowanie po stronie urządzenia.', complexity: 'medium', status: 'tbd' },
                { emoji: '💬', title: 'Chat / Wiadomości', description: 'Komunikacja real-time z historią rozmów, statusami i załącznikami.', complexity: 'high', status: 'tbd' },
                { emoji: '⭐', title: 'System ocen i recenzji', description: 'Gwiazdki, komentarze i moderacja treści. Średnie ocen i sortowanie.', complexity: 'medium', status: 'optional' },
                { emoji: '🔍', title: 'Wyszukiwarka i filtry', description: 'Wyszukiwanie pełnotekstowe, tagowanie i zaawansowane filtry wyników.', complexity: 'medium', status: 'optional' },
                { emoji: '📊', title: 'Panel administratora', description: 'Web-based zarządzanie treścią, użytkownikami i statystykami w czasie rzeczywistym.', complexity: 'high', status: 'included' },
                { emoji: '🌍', title: 'Wielojęzyczność', description: 'Internacjonalizacja (i18n) z przełącznikiem języka i tłumaczeniami treści.', complexity: 'medium', status: 'optional' },
                { emoji: '📶', title: 'Tryb offline', description: 'Cache lokalny i synchronizacja danych po powrocie połączenia z siecią.', complexity: 'high', status: 'optional' },
            ],
            footerNote: 'Nie widzisz funkcji której potrzebujesz? Opisz ją — wycenimy indywidualnie.',
        },
        architecture: {
            sectionTitle: 'Co kryje się „za kulisami" aplikacji',
            sectionLead: 'Większość aplikacji to nie tylko to co widać na ekranie — to też serwer, baza danych i API. Oto jak to będzie działać w Twoim przypadku.',
            backendOptions: [
                {
                    icon: '☁️',
                    title: 'Backend w chmurze (Firebase / Supabase)',
                    description: 'Szybki start, skalowalność, niższy koszt początkowy. Rozliczenie w modelu subskrypcji miesięcznej.',
                    status: 'selected',
                    accentColor: '#0EA5E9',
                },
                {
                    icon: '⚙️',
                    title: 'Backend dedykowany (Node.js / Laravel)',
                    description: 'Pełna kontrola i brak vendor lock-in. Wyższy koszt wdrożenia, większa elastyczność.',
                    status: 'option',
                    accentColor: '#818CF8',
                },
                {
                    icon: '🔗',
                    title: 'Istniejące API / Integracja',
                    description: 'Gdy masz już system — łączymy aplikację z tym co istnieje, bez budowania od zera.',
                    status: 'option',
                    accentColor: '#16A34A',
                },
            ],
            warningNote: 'Aplikacja mobilna to tylko frontend. Bez backendu nie ma możliwości przechowywania danych użytkowników, logowania ani synchronizacji między urządzeniami. Koszt backendu jest uwzględniony w wycenie.',
            serverCostRows: [
                { name: 'Firebase Spark', cost: 'Darmowy', target: 'MVP, mały ruch' },
                { name: 'Firebase Blaze', cost: '~50–200 USD / mies', target: 'Rosnący ruch' },
                { name: 'VPS dedykowany', cost: '~100–500 zł / mies', target: 'Pełna kontrola' },
            ],
        },
        timeline: {
            sectionTitle: 'Plan realizacji projektu',
            sectionLead: 'Projekt podzielony na etapy — każdy kończy się konkretnym deliverable który możesz ocenić przed przejściem dalej.',
            stages: [
                { title: 'Etap 1 — Discovery i UX Design', description: 'Warsztaty wymagań, architektura informacji, user flows, wireframes, klikalny prototyp (Figma).', deliverable: 'zatwierdzony prototyp + specyfikacja techniczna', weeks: '2–3 tyg.', paymentPercent: '20%', paymentAmount: 'XX 000' },
                { title: 'Etap 2 — UI Design', description: 'Projekt graficzny wszystkich ekranów, design system, animacje przejść.', deliverable: 'kompletne makiety UI do zatwierdzenia', weeks: '2–3 tyg.', paymentPercent: '15%', paymentAmount: 'XX 000' },
                { title: 'Etap 3 — Development (Backend + Frontend)', description: 'Implementacja wszystkich modułów, integracje API, testy jednostkowe.', deliverable: 'działająca aplikacja na TestFlight / Google Play Internal Track', weeks: '6–12 tyg.', paymentPercent: '40%', paymentAmount: 'XX 000' },
                { title: 'Etap 4 — Testy i poprawki', description: 'Testy na urządzeniach fizycznych, testy użytkowników, poprawki UX.', deliverable: 'aplikacja gotowa do publikacji + raport z testów', weeks: '2 tyg.', paymentPercent: '15%', paymentAmount: 'XX 000' },
                { title: 'Etap 5 — Publikacja i wdrożenie', description: 'Przygotowanie materiałów do sklepów, submission do App Store i Google Play, monitoring po premierze.', deliverable: 'aplikacja LIVE w obu sklepach', weeks: '1–2 tyg.', paymentPercent: '10%', paymentAmount: 'XX 000' },
            ],
        },
        pricing: {
            sectionTitle: 'Inwestycja',
            sectionLead: 'Transparentna wycena — wiesz dokładnie za co płacisz na każdym etapie.',
            phases: [
                {
                    label: 'Etap 1–2 · Projekt i UX/UI',
                    items: [
                        { name: 'Discovery i UX', scope: 'Warsztaty, user flows, wireframes, prototyp', weeks: 'X tyg.', price: 'X 000' },
                        { name: 'UI Design', scope: 'Makiety wszystkich ekranów, design system', weeks: 'X tyg.', price: 'X 000' },
                    ],
                },
                {
                    label: 'Etap 3 · Development',
                    items: [
                        { name: 'Backend i API', scope: 'Serwer, baza danych, autoryzacja, integracje', weeks: 'X tyg.', price: 'X 000' },
                        { name: 'Aplikacja mobilna', scope: 'Implementacja modułów na iOS i Android', weeks: 'X tyg.', price: 'X 000' },
                        { name: 'Panel administratora', scope: 'Web-based zarządzanie treścią i użytkownikami', weeks: 'X tyg.', price: 'X 000' },
                    ],
                },
                {
                    label: 'Etap 4–5 · Testy i publikacja',
                    items: [
                        { name: 'Testy i wdrożenie', scope: 'QA, poprawki, submission do sklepów', weeks: 'X tyg.', price: 'X 000' },
                    ],
                },
            ],
            totalWeeks: 'ok. X tyg.',
            totalNet: 'XX 000',
            vat: 23,
            addons: [
                { name: 'Wielojęzyczność (i18n)', price: 'X 000' },
                { name: 'Tryb offline + synchronizacja', price: 'X 000' },
                { name: 'Zaawansowana analityka i A/B testy', price: 'X 000' },
            ],
            priceOverride: null,
        },
        postlaunch: {
            sectionTitle: 'Co się dzieje po publikacji?',
            sectionLead: 'To pytanie, które wiele osób zadaje za późno. My odpowiadamy na nie teraz.',
            maintenancePlans: [
                { emoji: '🛡️', title: 'Utrzymanie Basic', description: 'Aktualizacje pod nowe wersje iOS / Android, monitoring, backup.', price: 'X 000', highlighted: false },
                { emoji: '🚀', title: 'Utrzymanie + Rozwój', description: 'Basic + X godz/mies na nowe funkcje.', price: 'X 000', highlighted: true },
                { emoji: '🤝', title: 'Partnerstwo strategiczne', description: 'Dedykowane zasoby, priorytet wsparcia, wspólny roadmap.', price: 'Wycena indywidualna', highlighted: false },
            ],
            maintenanceCosts: [
                { service: 'Serwer / Backend', cost: 'X–Y zł / mies', notes: 'Zależnie od ruchu' },
                { service: 'Domena + SSL', cost: 'X zł / rok', notes: 'Jeśli dotyczy' },
                { service: 'Apple Developer', cost: '~430 zł / rok', notes: 'Wymagane dla iOS' },
                { service: 'Google Play', cost: '~100 zł jednorazowo', notes: 'Konto deweloperskie' },
                { service: 'CDN / Storage', cost: 'Zależnie od ruchu', notes: 'Pliki, media' },
            ],
            warningNote: 'Bez aktywnego utrzymania aplikacja przestaje być kompatybilna z nowymi wersjami iOS / Android w ciągu 12–18 miesięcy.',
        },
        about: {
            sectionTitle: 'Dlaczego ja',
            bio: 'Specjalizuję się w projektowaniu i budowaniu aplikacji mobilnych na iOS i Android. Łączę techniczne zaplecze z UX-owym myśleniem — efektem jest produkt który użytkownicy chcą używać i który dowozi cele biznesowe.',
            techStack: ['React Native', 'Flutter', 'Swift', 'Kotlin', 'Node.js', 'Firebase', 'Supabase', 'Figma', 'Git', 'TypeScript', 'PostgreSQL', 'REST API'],
            stats: [
                { value: '10+', label: 'aplikacji' },
                { value: '5+', label: 'lat' },
                { value: '50K+', label: 'użytkowników' },
            ],
            portfolioCards: [
                { gradientFrom: '#F43F5E', gradientTo: '#818CF8', title: 'Nazwa projektu 1', description: 'Krótki opis aplikacji w jednym zdaniu.', tag: 'React Native', storeLabel: 'App Store ↗' },
                { gradientFrom: '#1E1B4B', gradientTo: '#6D28D9', title: 'Nazwa projektu 2', description: 'Krótki opis aplikacji w jednym zdaniu.', tag: 'Flutter', storeLabel: 'Google Play ↗' },
            ],
            linkedinUrl: '#',
            githubUrl: '#',
            portfolioUrl: '#',
        },
    }
}

// ── Merge ─────────────────────────────────────────────────────────────────────

export function mergeMobileAppWithDefaults(saved: Partial<MobileAppBlocks>): MobileAppBlocks {
    const d = buildDefaultMobileAppBlocks()
    const validSections = new Set<MobileAppSectionKey>(['vision', 'platform', 'scope', 'architecture', 'timeline', 'pricing', 'postlaunch', 'about'])
    const validPageBreaks = new Set<MobileAppPageBreakKey>(['cover', 'vision', 'platform', 'scope', 'architecture', 'timeline', 'pricing', 'postlaunch', 'about'])
    return {
        version: 1,
        sections: Array.isArray(saved.sections)
            ? (saved.sections.filter(s => validSections.has(s)) as MobileAppSectionKey[])
            : d.sections,
        pageBreakAfter: Array.isArray(saved.pageBreakAfter)
            ? (saved.pageBreakAfter.filter(s => validPageBreaks.has(s)) as MobileAppPageBreakKey[])
            : d.pageBreakAfter,
        cover: saved.cover ? { ...d.cover, ...saved.cover } : d.cover,
        footer: saved.footer ? { ...d.footer, ...saved.footer } : d.footer,
        vision: saved.vision ? { ...d.vision, ...saved.vision } : d.vision,
        platform: saved.platform ? { ...d.platform, ...saved.platform } : d.platform,
        scope: saved.scope ? { ...d.scope, ...saved.scope } : d.scope,
        architecture: saved.architecture ? { ...d.architecture, ...saved.architecture } : d.architecture,
        timeline: saved.timeline ? { ...d.timeline, ...saved.timeline } : d.timeline,
        pricing: saved.pricing ? { ...d.pricing, ...saved.pricing } : d.pricing,
        postlaunch: saved.postlaunch ? { ...d.postlaunch, ...saved.postlaunch } : d.postlaunch,
        about: saved.about ? { ...d.about, ...saved.about } : d.about,
    }
}

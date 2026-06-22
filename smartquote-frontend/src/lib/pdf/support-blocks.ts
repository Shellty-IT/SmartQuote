// src/lib/pdf/support-blocks.ts
// Block types and defaults for the "Wsparcie" (IT Support / SLA) offer template.
// Visual design based on "Opieka IT SLA" template — ocean navy + emerald green.

export type SupportSectionKey =
    | 'benefits'
    | 'packages'
    | 'scope'
    | 'sla'
    | 'process'
    | 'pricing'

// ── Sub-types ─────────────────────────────────────────────────────────────────

export interface SupportMonitorRow {
    label: string
    status: string
}

export interface SupportPlanFeature {
    label: string
    included: boolean
}

export interface SupportPlan {
    name: string
    tagline: string
    price: string
    ctaLabel: string
    highlighted: boolean
    features: SupportPlanFeature[]
}

export interface SupportSlaRow {
    priority: string
    icon: string
    colorClass: 'critical' | 'high' | 'medium' | 'low'
    description: string
    examples: string
    basic: string
    standard: string
    premium: string
    resolution: string
}

export interface SupportChannel {
    name: string
    availability: string
    priority: string
}

export interface SupportProcessStep {
    emoji: string
    title: string
    description: string
}

export interface SupportPackagePricing {
    monthlyPrice: string
    hours: string
    extraHourRate: string
    noticePeriod: string
    weekendAvailability: boolean
}

export interface SupportTermItem {
    icon: string
    title: string
    value: string
}

// ── Block interfaces ──────────────────────────────────────────────────────────

export interface SupportCoverBlock {
    heroTagline: string
    heroTitle: string
    heroTitleSuffix: string
    heroSubtitle: string
    pills: string[]
    monitorRows: SupportMonitorRow[]
    monitorLabel: string
    availabilityLabel: string
    availabilityValue: string
    validityDays: number
    websiteUrl: string
}

export interface SupportBenefitsBlock {
    sectionTitle: string
    sectionLead: string
    withoutTitle: string
    withoutItems: Array<{ title: string; description: string }>
    withTitle: string
    withItems: Array<{ title: string; description: string }>
    quote: string
}

export interface SupportPackagesBlock {
    sectionTitle: string
    sectionLead: string
    plans: SupportPlan[]
    contactEmail: string
}

export interface SupportScopeBlock {
    sectionTitle: string
    sectionLead: string
    includedTitle: string
    included: Array<{ title: string; description: string }>
    excludedTitle: string
    excluded: Array<{ title: string; description: string }>
    extraNote: string
}

export interface SupportSlaBlock {
    sectionTitle: string
    sectionLead: string
    rows: SupportSlaRow[]
    footnote: string
    workingHoursNote: string
}

export interface SupportProcessBlock {
    sectionTitle: string
    steps: SupportProcessStep[]
    channels: SupportChannel[]
    channelsNote: string
    contactEmail: string
    contactPhone: string
    contactFormUrl: string
}

export interface SupportPricingBlock {
    sectionTitle: string
    basicPricing: SupportPackagePricing
    standardPricing: SupportPackagePricing
    premiumPricing: SupportPackagePricing
    invoiceDay: string
    terms: SupportTermItem[]
    reportItems: string[]
    reportDay: string
    reportEmail: string
    priceOverride: number | null
    vat: number
}

export interface SupportFooterBlock {
    ctaHeadline: string
    ctaLead: string
    ctaButtonLabel: string
    startDate: string
    companyTagline: string
    contactEmail: string
    contactPhone: string
    websiteUrl: string
    selectedPackageName: string
    selectedPackagePrice: string
    validityDate?: string
}

// ── Root type ─────────────────────────────────────────────────────────────────

export interface SupportBlocks {
    version: 1
    sections: SupportSectionKey[]
    cover: SupportCoverBlock
    footer: SupportFooterBlock
    benefits: SupportBenefitsBlock
    packages: SupportPackagesBlock
    scope: SupportScopeBlock
    sla: SupportSlaBlock
    process: SupportProcessBlock
    pricing: SupportPricingBlock
}

// ── Defaults ──────────────────────────────────────────────────────────────────

export function buildDefaultSupportBlocks(): SupportBlocks {
    return {
        version: 1,
        sections: ['benefits', 'packages', 'scope', 'sla', 'process', 'pricing'],
        cover: {
            heroTagline: 'PROPOZYCJA WSPÓŁPRACY',
            heroTitle: 'Opieka techniczna IT',
            heroTitleSuffix: 'i Umowa SLA',
            heroSubtitle: 'Twoje systemy działają. Zawsze. A jeśli coś się stanie — jestem gotowy.',
            pills: ['🛡️ Monitoring 24/7', '⚡ Szybki czas reakcji', '📊 Miesięczny raport'],
            monitorRows: [
                { label: 'Strona WWW', status: 'ONLINE' },
                { label: 'Baza danych', status: 'ONLINE' },
                { label: 'Certyfikat SSL', status: 'WAŻNY' },
                { label: 'Ostatni backup', status: '2h temu' },
            ],
            monitorLabel: 'SYSTEM MONITOR',
            availabilityLabel: 'Dostępność',
            availabilityValue: '99.9%',
            validityDays: 30,
            websiteUrl: 'www.twoja-strona.pl',
        },
        footer: {
            ctaHeadline: 'Gotowy, żeby przestać martwić się o technologię?',
            ctaLead: 'Podpisz umowę online — zacznę czuwać nad Twoimi systemami od daty startu.',
            ctaButtonLabel: 'AKCEPTUJĘ WARUNKI I ZACZYNAMY',
            startDate: 'DATA STARTU',
            companyTagline: 'Stała opieka techniczna i wsparcie SLA dla firm, które nie mogą sobie pozwolić na przestoje.',
            contactEmail: 'kontakt@twoja-strona.pl',
            contactPhone: '+48 XXX XXX XXX',
            websiteUrl: 'www.twoja-strona.pl',
            selectedPackageName: 'STANDARD',
            selectedPackagePrice: 'XXX zł',
        },
        benefits: {
            sectionTitle: 'Co zyskujesz z opieką techniczną',
            sectionLead: 'Spokój zamiast nerwów. Przewidywalność zamiast niespodzianek.',
            withoutTitle: 'Bez opieki technicznej',
            withoutItems: [
                { title: 'Awaria w piątek wieczór', description: 'Sklep nie działa przez cały weekend, a Ty nie wiesz do kogo zadzwonić.' },
                { title: 'Brak aktualnych backupów', description: 'Po awarii okazuje się, że ostatnia kopia ma kilka miesięcy.' },
                { title: 'Przestarzałe oprogramowanie', description: 'Niezałatane luki to otwarte drzwi dla włamań i wycieków danych.' },
                { title: 'Nikt nie zna Twojego systemu', description: 'Każdy nowy wykonawca zaczyna od zera — tracisz czas i pieniądze.' },
            ],
            withTitle: 'Z opieką techniczną',
            withItems: [
                { title: 'Reaguję, gdy coś się dzieje', description: 'Jasno określony czas reakcji — wiesz, że problem trafia w dobre ręce.' },
                { title: 'Zarządzane kopie zapasowe', description: 'Regularne, sprawdzane backupy — odzyskanie danych to kwestia chwil.' },
                { title: 'Zawsze aktualne i bezpieczne', description: 'Aktualizacje wgrywane na bieżąco — system odporny na zagrożenia.' },
                { title: 'Ktoś, kto zna Twój system', description: 'Stały opiekun techniczny — historia, kontekst i szybkie decyzje.' },
            ],
            quote: '„Koszt godziny przestoju Twojego systemu jest wielokrotnie wyższy niż miesięczny koszt opieki technicznej."',
        },
        packages: {
            sectionTitle: 'Wybierz pakiet dopasowany do Twoich potrzeb',
            sectionLead: 'Każdy pakiet można rozszerzyć o dodatkowe usługi.',
            contactEmail: 'kontakt@twoja-strona.pl',
            plans: [
                {
                    name: 'BASIC',
                    tagline: 'Dla małych stron i prostych systemów',
                    price: 'XXX zł / mies.',
                    ctaLabel: 'Wybierz Basic',
                    highlighted: false,
                    features: [
                        { label: 'X godzin wsparcia miesięcznie', included: true },
                        { label: 'Czas reakcji do X godzin roboczych', included: true },
                        { label: 'Obsługa zgłoszeń przez email', included: true },
                        { label: 'Aktualizacje systemu i wtyczek', included: true },
                        { label: 'Miesięczny raport podstawowy', included: true },
                        { label: 'Monitoring automatyczny 24/7', included: false },
                        { label: 'Priorytetowa linia telefoniczna', included: false },
                        { label: 'Backup codzienne zarządzane', included: false },
                    ],
                },
                {
                    name: 'STANDARD',
                    tagline: 'Dla aktywnych stron i sklepów online',
                    price: 'XXX zł / mies.',
                    ctaLabel: 'Wybierz Standard',
                    highlighted: true,
                    features: [
                        { label: 'X godzin wsparcia miesięcznie', included: true },
                        { label: 'Czas reakcji do X godzin roboczych', included: true },
                        { label: 'Zgłoszenia email i telefon', included: true },
                        { label: 'Aktualizacje systemu i wtyczek', included: true },
                        { label: 'Rozszerzony raport miesięczny', included: true },
                        { label: 'Monitoring automatyczny 24/7', included: true },
                        { label: 'Backup codzienne zarządzane', included: true },
                        { label: 'Priorytetowa linia telefoniczna', included: false },
                    ],
                },
                {
                    name: 'PREMIUM',
                    tagline: 'Dla krytycznego biznesu online',
                    price: 'XXX zł / mies.',
                    ctaLabel: 'Zapytaj o wycenę',
                    highlighted: false,
                    features: [
                        { label: 'Wszystko z pakietu Standard', included: true },
                        { label: 'Dedykowany numer telefonu', included: true },
                        { label: 'Priorytetowa linia telefoniczna', included: true },
                        { label: 'SLA obejmujące weekendy', included: true },
                        { label: 'Kwartalne spotkanie strategiczne', included: true },
                        { label: 'Priorytet nad innymi klientami', included: true },
                    ],
                },
            ],
        },
        scope: {
            sectionTitle: 'Co obejmuje opieka techniczna',
            sectionLead: 'Jasny zakres chroni obie strony.',
            includedTitle: '✓ Objęte opieką',
            included: [
                { title: 'Aktualizacje CMS i wtyczek', description: 'Bieżące wgrywanie poprawek bezpieczeństwa i wersji.' },
                { title: 'Monitorowanie dostępności strony', description: 'Automatyczne czujniki wykrywają awarię, zanim zauważy ją klient.' },
                { title: 'Zarządzanie backupami', description: 'Regularne kopie i kontrola możliwości ich przywrócenia.' },
                { title: 'Certyfikat SSL — odnowienie i monitoring', description: 'Pilnowanie ważności i poprawnej konfiguracji.' },
                { title: 'Wsparcie przy błędach i awariach', description: 'Diagnoza i usuwanie usterek w gwarantowanym czasie.' },
                { title: 'Drobne modyfikacje treści', description: 'Zmiany do X minut w ramach puli godzin.' },
                { title: 'Konsultacje techniczne', description: 'Doradztwo przy decyzjach dotyczących systemu.' },
                { title: 'Miesięczne raportowanie', description: 'Pełna przejrzystość wykonanych prac i stanu systemu.' },
            ],
            excludedTitle: '✗ Poza zakresem',
            excluded: [
                { title: 'Tworzenie nowych funkcjonalności', description: 'Rozbudowa systemu o nowe moduły i sekcje.' },
                { title: 'Redesign strony', description: 'Zmiana layoutu, brandingu czy całej szaty graficznej.' },
                { title: 'Usługi SEO i marketingowe', description: 'Pozycjonowanie, kampanie reklamowe, content marketing.' },
                { title: 'Zakup domen i hostingu', description: 'Chyba że jest to wyraźnie ujęte w wybranym pakiecie.' },
                { title: 'Odzyskiwanie danych z winy klienta', description: 'Skutki działań poza uzgodnionym dostępem i procedurą.' },
            ],
            extraNote: 'Powyższe usługi są dostępne jako zlecenia dodatkowe — wyceniane osobno i realizowane poza pulą godzin.',
        },
        sla: {
            sectionTitle: 'Gwarantowane czasy reakcji',
            sectionLead: 'Wiemy, że czas to pieniądz. Dlatego precyzyjnie określamy, kiedy reaguję na każdy typ zgłoszenia.',
            rows: [
                {
                    priority: 'Krytyczny',
                    icon: '🔴',
                    colorClass: 'critical',
                    description: 'Strona lub system całkowicie nie działa. Bezpośrednia strata przychodów.',
                    examples: 'Przykłady: sklep offline, baza danych niedostępna',
                    basic: '4 godz.',
                    standard: '2 godz.',
                    premium: '1 godz.',
                    resolution: 'do 8 godz.',
                },
                {
                    priority: 'Wysoki',
                    icon: '🟠',
                    colorClass: 'high',
                    description: 'Poważny błąd wpływający na działanie — część funkcji niedostępna.',
                    examples: 'Przykłady: formularz kontaktowy, błąd płatności',
                    basic: '8 godz.',
                    standard: '4 godz.',
                    premium: '2 godz.',
                    resolution: 'do 1 dnia',
                },
                {
                    priority: 'Średni',
                    icon: '🟡',
                    colorClass: 'medium',
                    description: 'Usterka widoczna dla użytkowników, ale nie blokuje działania.',
                    examples: 'Przykłady: błąd wyświetlania, wolne ładowanie',
                    basic: '2 dni rob.',
                    standard: '1 dzień rob.',
                    premium: '8 godz.',
                    resolution: 'do 3 dni',
                },
                {
                    priority: 'Niski',
                    icon: '🟢',
                    colorClass: 'low',
                    description: 'Pytania, drobne zmiany, konsultacje.',
                    examples: 'Przykłady: aktualizacja treści, pytanie techniczne',
                    basic: '5 dni rob.',
                    standard: '3 dni rob.',
                    premium: '2 dni rob.',
                    resolution: 'wg ustaleń',
                },
            ],
            footnote: '* Czasy reakcji liczone w godzinach roboczych (pon–pt, 9–17), chyba że pakiet Premium.',
            workingHoursNote: 'Godziny wsparcia: pon–pt, 9:00–17:00. W nagłych przypadkach poza godzinami — warunki dostępności wg pakietu Premium.',
        },
        process: {
            sectionTitle: 'Jak wygląda obsługa zgłoszenia',
            contactEmail: 'zgloszenia@twoja-strona.pl',
            contactPhone: '+48 XXX XXX XXX',
            contactFormUrl: '#',
            steps: [
                { emoji: '📨', title: 'Zgłaszasz problem', description: 'Email, telefon lub formularz — wybierz wygodną formę.' },
                { emoji: '⚡', title: 'Potwierdzam odbiór', description: 'W ciągu 15 minut otrzymujesz automatyczne potwierdzenie z numerem ticketu i szacowanym czasem reakcji.' },
                { emoji: '🔍', title: 'Diagnozuję', description: 'Analizuję problem, określam priorytet i plan działania. Informuję Cię o postępach.' },
                { emoji: '🛠️', title: 'Rozwiązuję', description: 'Wdrażam rozwiązanie. W razie potrzeby informuję o ryzyku lub alternatywach przed podjęciem działania.' },
                { emoji: '✅', title: 'Zamykam i dokumentuję', description: 'Potwierdzam rozwiązanie, proszę o weryfikację z Twojej strony. Zgłoszenie trafia do miesięcznego raportu.' },
            ],
            channels: [
                { name: '📧 Email', availability: '24/7', priority: 'Wszystkie' },
                { name: '📞 Telefon', availability: '9–17', priority: 'Wysoki / Kryt.' },
                { name: '📝 Formularz', availability: '24/7', priority: 'Średni / Niski' },
            ],
            channelsNote: 'Każde zgłoszenie otrzymuje unikalny numer ticketu — pełna historia komunikacji w jednym miejscu.',
        },
        pricing: {
            sectionTitle: 'Cena, warunki umowy i raportowanie',
            invoiceDay: '1',
            basicPricing: { monthlyPrice: 'XXX zł', hours: 'X h', extraHourRate: 'XX zł', noticePeriod: '30 dni', weekendAvailability: false },
            standardPricing: { monthlyPrice: 'XXX zł', hours: 'X h', extraHourRate: 'XX zł', noticePeriod: '30 dni', weekendAvailability: false },
            premiumPricing: { monthlyPrice: 'XXX zł', hours: 'X h', extraHourRate: 'XX zł', noticePeriod: '60 dni', weekendAvailability: true },
            terms: [
                { icon: '📄', title: 'Forma umowy', value: 'umowa B2B / zlecenie' },
                { icon: '📅', title: 'Czas trwania', value: 'bezterminowa z wypowiedzeniem' },
                { icon: '🔔', title: 'Wypowiedzenie', value: 'X dni / miesięcy wypowiedzenia' },
                { icon: '🔒', title: 'Poufność', value: 'Pełna poufność danych i dostępów — możliwość podpisania NDA.' },
                { icon: '💾', title: 'Dane po zakończeniu', value: 'Przekazanie dostępów i dokumentacji, usunięcie kopii z mojej strony.' },
                { icon: '⚖️', title: 'Odpowiedzialność', value: 'Zakres odpowiedzialności wykonawcy określony w umowie SLA.' },
            ],
            reportItems: [
                'Liczba i lista obsłużonych zgłoszeń',
                'Wykorzystane godziny z puli',
                'Status techniczny systemów',
                'Wykonane aktualizacje',
                'Stan certyfikatów i domen',
                'Rekomendacje na następny miesiąc',
            ],
            reportDay: 'X',
            reportEmail: 'email@klienta.pl',
            priceOverride: null,
            vat: 23,
        },
    }
}

// ── Merge ─────────────────────────────────────────────────────────────────────

export function mergeSupportWithDefaults(saved: Partial<SupportBlocks>): SupportBlocks {
    const d = buildDefaultSupportBlocks()
    const validSections = new Set<SupportSectionKey>(['benefits', 'packages', 'scope', 'sla', 'process', 'pricing'])
    return {
        version: 1,
        sections: Array.isArray(saved.sections)
            ? (saved.sections.filter(s => validSections.has(s)) as SupportSectionKey[])
            : d.sections,
        cover: saved.cover ? { ...d.cover, ...saved.cover } : d.cover,
        footer: saved.footer ? { ...d.footer, ...saved.footer } : d.footer,
        benefits: saved.benefits ? { ...d.benefits, ...saved.benefits } : d.benefits,
        packages: saved.packages ? { ...d.packages, ...saved.packages } : d.packages,
        scope: saved.scope ? { ...d.scope, ...saved.scope } : d.scope,
        sla: saved.sla ? { ...d.sla, ...saved.sla } : d.sla,
        process: saved.process ? { ...d.process, ...saved.process } : d.process,
        pricing: saved.pricing ? { ...d.pricing, ...saved.pricing } : d.pricing,
    }
}

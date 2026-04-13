# Architecture - Architektura projektu

SmartQuote-AI to nowoczesna aplikacja webowa zbudowana w architekturze klient-serwer, wspomagana przez silnik sztucznej inteligencji.

## Diagram Struktury Systemu

```mermaid
graph TD
    User((Użytkownik))
    Frontend[Frontend - Next.js]
    Backend[Backend - API Server]
    DB[(Baza danych - PostgreSQL)]
    AI[AI Engine - Google Gemini]
    PDF[PDF Generator]
    Email[Email Service - Nodemailer]

    User <--> Frontend
    Frontend <--> Backend
    Backend <--> DB
    Backend <--> AI
    Backend <--> PDF
    Backend <--> Email
Główne Komponenty
1. Frontend (Next.js 15 + App Router)
Kluczowe technologie:

Next.js 15: React framework z App Router, Server Components
TypeScript: Typowanie statyczne dla bezpieczeństwa i DX
Tailwind CSS: Utility-first CSS z dark mode support
NextAuth.js: Autoryzacja JWT
Context API: Globalny stan (AI Chat, Toast Notifications)
Struktura folderów:

text

src/
├── app/                        ← Next.js App Router
│   ├── dashboard/              ← Protected routes
│   │   ├── layout.tsx          ← Wspólny layout (Sidebar, Header)
│   │   ├── page.tsx            ← Dashboard główny
│   │   ├── offers/             ← Feature: Oferty
│   │   │   ├── page.tsx               ← Lista ofert
│   │   │   ├── constants.ts           ← Stałe (VAT_RATES, UNITS, STEPS, STATUS_OPTIONS)
│   │   │   ├── hooks/                 ← Feature-level hooks (WSPÓŁDZIELONE)
│   │   │   │   ├── useOfferForm.ts    ← Unified dla new + edit
│   │   │   │   ├── useOffersPage.ts   ← Logika listy ofert
│   │   │   │   └── index.ts           ← Barrel exports
│   │   │   ├── components/            ← Shared components listy
│   │   │   ├── new/                   ← Nowa oferta
│   │   │   │   ├── page.tsx
│   │   │   │   ├── NewOfferContent.tsx
│   │   │   │   ├── types.ts           ← ExtendedOfferItem, OfferDetails
│   │   │   │   └── components/        ← Step components
│   │   │   └── [id]/                  ← Szczegóły + Edycja
│   │   │       ├── page.tsx
│   │   │       ├── constants.ts       ← Tab, TABS_CONFIG, STATUS_TRANSITIONS
│   │   │       ├── hooks/
│   │   │       │   └── useOfferDetail.ts
│   │   │       ├── components/
│   │   │       └── edit/
│   │   │           └── page.tsx       ← Używa offers/hooks/useOfferForm
│   │   ├── clients/            ← Feature: Klienci
│   │   ├── contracts/          ← Feature: Umowy
│   │   ├── emails/             ← Feature: Email Composer
│   │   ├── offer-templates/    ← Feature: Szablony ofert
│   │   ├── followups/          ← Feature: Follow-upy
│   │   ├── notifications/      ← Feature: Powiadomienia
│   │   ├── ai/                 ← Feature: AI Chat
│   │   ├── ai-insights/        ← Feature: Wnioski AI
│   │   └── settings/           ← Feature: Ustawienia
│   ├── offer/view/[token]/     ← Public: Interaktywna oferta
│   └── contract/view/[token]/  ← Public: Podpis umowy
├── components/                 ← Reusable components
│   ├── ui/                     ← UI primitives (Button, Input, Modal, Toast)
│   ├── ai/                     ← AI-specific components
│   ├── offer-templates/        ← TemplateSelector
│   ├── publicOffer/            ← Public offer components
│   └── publicContract/         ← Public contract components
├── hooks/                      ← Global hooks (API wrappers)
├── lib/                        ← Utilities
│   ├── api/                    ← API clients (13 modułów)
│   └── utils.ts                ← Helpers
├── types/                      ← TypeScript types (15 modułów)
└── contexts/                   ← React Contexts (Toast, AIChat)
2. Backend (Express.js + TypeScript)
Kluczowe technologie:

Express.js: Web framework
Prisma ORM: Type-safe database client
PostgreSQL: Relacyjna baza danych
Zod: Runtime validation
JWT: Autoryzacja
PDFKit: Generowanie PDF z polskimi znakami (DejaVu fonts)
Nodemailer: Wysyłka emaili
Architektura warstwowa:

text

src/
├── routes/              ← Express routes
├── controllers/         ← Request handling, response formatting
├── services/            ← Business logic (CORE)
│   ├── ai/              ← AI module (6 plików)
│   ├── pdf/             ← PDF generation (6 plików)
│   ├── email/           ← Email templates & sending
│   └── shared/          ← Shared utilities
├── validators/          ← Zod schemas
├── middleware/          ← Auth, error handling
└── types/               ← TypeScript types
Zasady:

Slim controllers — tylko request/response handling
Fat services — cała logika biznesowa
No @/ paths — TYLKO ścieżki względne
Centralized mapping — data-mapper.ts dla transformacji Prisma → PDF
3. AI Module (Google Gemini 2.5 Flash)
Funkcje:

Architect (Price Insight): Sugestie cenowe dla pozycji ofert
Observer: Analiza interakcji klienta z ofertą
Closer: Strategie zamknięcia sprzedaży
Feedback Loop: Post-mortem zakończonych ofert → generowanie insights
text

src/services/ai/
├── core.ts         ← Inicjalizacja Gemini client
├── prompts.ts      ← System prompts
├── chat.ts         ← Interaktywny chat AI
├── analysis.ts     ← Analiza klienta/oferty
├── feedback.ts     ← Feedback loop + insights
└── index.ts        ← Public API
4. PDF Generation (PDFKit + DejaVu Fonts)
Features:

Polskie znaki (fonty DejaVu Sans)
Logo firmy w nagłówku
Pełne dane sprzedawcy (NIP, adres)
Certyfikat akceptacji (Electronic Audit Trail)
Certyfikat podpisu elektronicznego
Kalkulacja VAT
text

src/services/pdf/
├── types.ts             ← PDFUser, PDFClient, PDFOffer
├── helpers.ts           ← createDoc(), txt(), money(), tryRenderLogo()
├── offer-renderer.ts    ← Generowanie PDF oferty
├── contract-renderer.ts ← Generowanie PDF umowy
├── data-mapper.ts       ← Prisma → PDF types
└── index.ts             ← Public API
5. Email System (Nodemailer + Templates)
Features:

Szablony HTML
Załączniki PDF (oferty, umowy)
Linki do publicznych stron
Email Log (historia wysłanych emaili)
Rich Text Editor (Quill)
Filozofia Hooków (Frontend)
SmartQuote AI stosuje 3-poziomową hierarchię hooków.

1️⃣ Global Hooks — src/hooks/
Cel: Thin API wrappers używane w całej aplikacji.

✅ Proste wywołania API (CRUD)
✅ Reużywalne w wielu feature'ach
❌ Nie zawierają logiki UI/formularzy
Lista:

useOffers.ts — CRUD ofert
useClients.ts — CRUD klientów
useContracts.ts — CRUD umów
useFollowUps.ts — Follow-upy
useNotifications.ts — Powiadomienia
useSettings.ts — Ustawienia użytkownika
useAI.ts — AI chat
useDashboard.ts — Statystyki dashboardu
useEmailComposer.ts — Kompozytor emaili
useEmailList.ts — Lista emaili
useSidebarStats.ts — Statystyki sidebara
2️⃣ Feature-Level Hooks — src/app/.../[feature]/hooks/
Cel: Shared logic dla wielu stron w obrębie jednego feature'a.

✅ Współdzielone między new/edit/detail
✅ Kompleksowa logika biznesowa
❌ Nie używane poza feature'm
Przykład:

TypeScript

// src/app/dashboard/offers/hooks/useOfferForm.ts
// Współdzielone między new/page.tsx i [id]/edit/page.tsx
export function useOfferForm(options?: { initialData?: Offer }) {
    const isEditMode = !!options?.initialData;
    // Obsługuje zarówno tworzenie jak i edycję
}
3️⃣ Page-Specific Hooks — src/app/.../[page]/hooks/
Cel: Logika używana TYLKO na jednej konkretnej stronie.

✅ Bardzo specyficzna dla strony
✅ Nie jest reużywalna
Przykład:

TypeScript

// src/app/dashboard/offers/[id]/hooks/useOfferDetail.ts
// Używane TYLKO na stronie szczegółów oferty
export function useOfferDetail(offerId: string) { ... }
Zasady lokalizacji hooków
Pytanie	Lokalizacja
Hook używany w ≥2 feature'ach?	src/hooks/
Hook używany w ≥2 stronach tego samego feature'a?	src/app/.../[feature]/hooks/
Hook używany tylko na 1 stronie?	src/app/.../[page]/hooks/
Hook jest thin API wrapper?	src/hooks/
Hook zawiera kompleksową logikę formularza?	src/app/.../[feature]/hooks/
Index.ts Pattern (Barrel Exports)
TypeScript

// src/app/dashboard/offers/hooks/index.ts
export { useOfferForm, calculateItemTotal, getUniqueVariants } from './useOfferForm';
export { useOffersPage } from './useOffersPage';
Flow Danych w Systemie
Tworzenie Oferty z AI
mermaid

sequenceDiagram
    User->>Frontend: Wpisuje opis oferty
    Frontend->>Backend: POST /api/ai/generate-offer
    Backend->>Gemini: Prompt + kontekst użytkownika
    Gemini->>Backend: Struktura oferty (JSON)
    Backend->>Frontend: Oferta do weryfikacji
    User->>Frontend: Akceptuje/edytuje
    Frontend->>Backend: POST /api/offers
    Backend->>DB: Zapisuje ofertę
    Backend->>Frontend: Oferta utworzona
Interaktywna Oferta Publiczna
mermaid

sequenceDiagram
    User->>Frontend: Otwiera /offer/view/[token]
    Frontend->>Backend: GET /api/public/offers/:token
    Backend->>DB: Pobiera ofertę + log interakcji
    Backend->>Frontend: Dane oferty
    User->>Frontend: Zmienia wariant/ilości
    User->>Frontend: Akceptuje ofertę
    Frontend->>Backend: POST /api/public/offers/:token/accept
    Backend->>DB: Zmienia status + Electronic Audit Trail
    Backend->>Email: Wysyła potwierdzenie z certyfikatem
Podpis Elektroniczny Umowy
mermaid

sequenceDiagram
    User->>Frontend: Otwiera /contract/view/[token]
    Frontend->>Backend: GET /api/public/contracts/:token
    User->>Frontend: Rysuje podpis (Canvas)
    Frontend->>Backend: POST /api/public/contracts/:token/sign
    Backend->>DB: Zapisuje signatureLog (SHA-256)
    Backend->>PDF: Generuje PDF z certyfikatem
    Backend->>Email: Wysyła PDF + potwierdzenie
Feedback Loop AI
mermaid

sequenceDiagram
    Cron->>Backend: Co 24h
    Backend->>DB: Pobiera zakończone oferty
    Backend->>Gemini: Wysyła dane do analizy
    Gemini->>Backend: Generuje insights
    Backend->>DB: Zapisuje AIInsight
Decyzje Architektoniczne
Frontend
Technologia	Uzasadnienie
Next.js 15	SSR, App Router, SEO dla publicznych ofert
TypeScript	Bezpieczeństwo typów, DX, refactoring safety
Tailwind CSS	Utility-first, dark mode, mały bundle
NextAuth.js	Standard dla Next.js, JWT, bezpieczeństwo
Inline SVG	Brak lucide-react/heroicons — mniejszy bundle
Backend
Technologia	Uzasadnienie
Express.js	Pełna kontrola, łatwe testowanie, separation of concerns
Prisma ORM	Type-safe queries, migrations, excellent DX
PostgreSQL	Relacyjne dane, ACID, JSON support
Zod	Type inference, reusable schemas, lepsze error messages
AI
Aspekt	Decyzja
Model	Google Gemini 2.5 Flash
Powód	Szybszy, tańszy, 1M token context window
Deployment
Serwis	Platforma	Powód
Frontend	Netlify	Auto-deploy, CDN, free tier
Backend	Railway	Auto-deploy, PostgreSQL, free tier

Testowanie
E2E (Playwright) — 22 testy, 100% pass rate
text

tests/e2e/
├── critical-path.spec.ts
├── contract-lifecycle.spec.ts
├── contract-signature.spec.ts
├── offer-variants.spec.ts
├── offer-audit-trail.spec.ts
├── offer-comments.spec.ts
└── offer-reject.spec.ts
3 przeglądarki: chromium, mobile-chrome, mobile-safari

Unit (Jest)
text

src/__tests__/
├── calculations.test.ts
└── pdf.service.test.ts
CI/CD (GitHub Actions)
Backend: Jest + tsc --noEmit + prisma generate
Frontend: tsc --noEmit + ESLint
Deploy: Netlify/Railway auto-deploy niezależnie od CI
Bezpieczeństwo
JWT tokens — autoryzacja stateless
Middleware authenticate — na wszystkich chronionych endpointach
Publiczne endpointy — tokeny UUID w URL, bez middleware auth
Zod schemas — walidacja wszystkich inputów
SHA-256 hashing — audit trails i podpisy elektroniczne
Environment variables — wszystkie sekrety w .env
Roadmap Techniczny

✅ Zrobione (v1–v22)
Core CRM (klienci, oferty, umowy, follow-upy)
AI Assistant (Gemini 2.5 Flash)
PDF z polskimi znakami i logo firmy
Email Composer z załącznikami PDF
Interaktywne oferty publiczne z wariantami
Electronic Audit Trail
Podpis elektroniczny umów
KSeF Bridge (external billing)
Dark mode
System powiadomień
E2E tests (Playwright, 22 testy)
CI/CD (GitHub Actions)
Szablony ofert (Offer Templates)
Refactoring useOfferForm — unified hook (v22)

📋 Backlog
Push notifications (SSE/WebSocket)
Branch protection + mandatory CI pass
KSeF Master "Poczekalnia"
Więcej testów E2E (email, KSeF, templates flow)
Sentry error tracking
Analytics (Posthog/Plausible)
ESLint warnings cleanup
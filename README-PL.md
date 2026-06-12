<div align="center">

# SmartQuote

**Platforma CRM sprzedażowa wspierana przez AI — zarządzanie klientami, inteligentne generowanie ofert,
workflow umów i automatyczne follow-upy oparte o Google Gemini.**

[![Frontend CI](https://github.com/Shellty-IT/SmartQuote/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/Shellty-IT/SmartQuote/actions/workflows/frontend-ci.yml)
[![Backend CI](https://github.com/Shellty-IT/SmartQuote/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/Shellty-IT/SmartQuote/actions/workflows/backend-ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node-%3E%3D18.0-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-Proprietary-red)](#-licencja)

**[🚀 Demo na żywo](https://smartquote-ai.vercel.app)** &nbsp;·&nbsp; [🇬🇧 English version](./README.md)

</div>

---

## 📑 Spis treści

- [O projekcie](#-o-projekcie)
- [Funkcjonalności](#-funkcjonalności)
- [Stack technologiczny](#-stack-technologiczny)
- [Wymagania wstępne](#-wymagania-wstępne)
- [Pierwsze kroki](#-pierwsze-kroki)
- [Zmienne środowiskowe](#-zmienne-środowiskowe)
- [Struktura projektu](#-struktura-projektu)
- [Dokumentacja API](#-dokumentacja-api)
- [Testowanie](#-testowanie)
- [Wdrożenie](#-wdrożenie)
- [Współpraca](#-współpraca)
- [Licencja](#-licencja)
- [Autorzy i kontakt](#-autorzy-i-kontakt)

---

## 🎯 O projekcie

SmartQuote to fullstackowy CRM sprzedażowy, który automatyzuje powtarzalne czynności pracy w B2B. Łączy
zarządzanie relacjami z klientami z generowaniem ofert wspomaganym przez AI, workflowem umów, renderowaniem
dokumentów PDF i analityką post-mortem — dzięki czemu zespoły sprzedażowe poświęcają mniej czasu papierologii,
a więcej na domykanie transakcji.

Repozytorium ma formę **monorepo** i zawiera dwie niezależne aplikacje:

- **`smartquote-frontend/`** — aplikacja webowa Next.js 16 (dashboard, publiczne strony ofert/umów)
- **`smartquote-backend/`** — REST API w Express.js z PostgreSQL, Prisma ORM i integracją Google Gemini

Oba projekty mają osobne drzewa zależności, osobne pipeline'y CI i osobne wdrożenia
(Vercel dla frontendu, Render dla backendu).

---

## 🏗 Architektura

```
┌──────────────────────────────────────────────────────────────┐
│                    PRZEGLĄDARKA UŻYTKOWNIKA                  │
└─────────────────────────────┬────────────────────────────────┘
                              │ HTTPS
                              ▼
┌──────────────────────────────────────────────────────────────┐
│            VERCEL  (smartquote-frontend / Next.js 16)        │
│                                                              │
│  ┌──────────────────┐   ┌──────────────────────────────────┐ │
│  │ Strony dashboardu│   │ Vercel API routes (serverless)   │ │
│  │ /dashboard/*     │   │  GET /api/offers/:id/pdf/proposal│ │
│  │                  │   │  GET /api/contracts/:id/pdf/short│ │
│  │ Strony publiczne │   │  → Puppeteer + @sparticuz/chromium│ │
│  │ /offer/view/:tok │   └──────────────────────────────────┘ │
│  │ /contract/view/  │                                         │
│  └────────┬─────────┘                                         │
└───────────┼──────────────────────────────────────────────────┘
            │ REST API + JWT bearer
            ▼
┌──────────────────────────────────────────────────────────────┐
│            RENDER  (smartquote-backend / Express.js)         │
│                                                              │
│  Auth · Oferty · Umowy · Klienci · Follow-upy · Email       │
│  PDF (PDFKit classic) · KSeF bridge · Cron reminders         │
│                                                              │
│  ┌─────────────┐    ┌────────────┐    ┌────────────────────┐ │
│  │ Prisma ORM  │    │ Serwis AI  │    │ Serwis Email       │ │
│  └──────┬──────┘    └─────┬──────┘    └─────────┬──────────┘ │
└─────────┼─────────────────┼──────────────────────┼───────────┘
          │                 │                       │
          ▼                 ▼                       ▼
  ┌──────────────┐  ┌────────────────┐   ┌──────────────────┐
  │  Neon DB     │  │ Google Gemini  │   │  SMTP / MailerSend│
  │  PostgreSQL  │  │ 2.5 Flash      │   │  (konfiguracja    │
  └──────────────┘  └────────────────┘   │  per użytkownik)  │
                                         └──────────────────┘
```

**Przepływ: Oferta → AI → PDF → strona publiczna:**
1. Handlowiec wypełnia formularz → AI generuje opis i szablon propozycji (Gemini)
2. Oferta zapisywana do PostgreSQL; PDF generowany na Render (klasyczny) lub Vercel (propozycja/umowa)
3. Oferta publikowana → unikalny token → strona publiczna `/offer/view/:token`
4. Klient przegląda, wybiera wariant, akceptuje/odrzuca → ślad audytu w bazie danych
5. Po akceptacji → KSeF bridge opcjonalnie uruchamia e-fakturę przez KSeF Master

---

## 🔑 Demo na żywo

**URL:** https://smart-quote-ai.vercel.app

Instancja demo umożliwia bezpłatną otwartą rejestrację — utwórz konto i przetestuj wszystkie funkcje.
Przykładowych klientów, oferty i umowy można lokalnie załadować przez `npm run seed`.

---

## ✨ Funkcjonalności

### Główny CRM
- 👥 **Zarządzanie klientami** — firmy i osoby prywatne wraz z pełną historią kontaktów
- 📄 **Cykl życia oferty** — siedem statusów: `DRAFT → SENT → VIEWED → ACCEPTED / REJECTED`
- ✍️ **Workflow umów** — `DRAFT → PENDING_SIGNATURE → ACTIVE → COMPLETED`
- 📅 **Przypomnienia follow-up** — automatyczne emaile uruchamiane cronem dla zaległych zadań
- 📊 **Analityka dashboardu** — KPI w czasie rzeczywistym, współczynniki konwersji i metryki lejka
- 🔔 **Powiadomienia** — centrum powiadomień in-app dla każdego użytkownika

### Funkcje AI (Google Gemini 2.5 Flash)
- 🤖 **Asystent czatu** — interfejs języka naturalnego do operacji CRM
- ✏️ **Generator ofert** — strukturalne oferty z opisu w wolnym tekście
- 💰 **Price insight** — rekomendacje cenowe oparte o rynek
- 👁️ **Tryb observer** — analiza wydajności oferty w czasie rzeczywistym
- 🎯 **Strategia zamknięcia** — sugestie AI do finalizacji transakcji
- 🔁 **Feedback loop** — analiza post-mortem wygranych/przegranych ofert

### Dokumenty i komunikacja
- 🖨️ **Silnik PDF** — własny renderer z fontem DejaVu Sans (pełne wsparcie UTF-8 / polskie znaki)
- 🎨 **Dynamiczny branding** — logo i kolor wiodący per użytkownik zaszyte w PDF
- 🧾 **Kalkulacje VAT** — automatyczne liczenie podatku per pozycja
- 🔏 **Certyfikaty akceptacji** — audit trail z podpisem SHA-256 zaszyty w PDF oferty
- 📨 **Email composer** — emaile HTML z załącznikami PDF (Nodemailer / MailerSend)
- 🧰 **Szablony ofert** — wielokrotnego użytku rusztowanie ofert

### Funkcje publiczne i integracje
- 🔗 **Publiczne strony ofert** — udostępnialne linki z tokenem i wyborem wariantów
- ✒️ **Podpisy elektroniczne** — podpis canvas z weryfikacją kryptograficzną
- 🧮 **Most KSeF** — webhook do zewnętrznego systemu e-fakturowania (Krajowy System e-Faktur)

---

## 🛠 Stack technologiczny

### Frontend (`smartquote-frontend/`)

| Warstwa            | Technologia                                          |
|--------------------|------------------------------------------------------|
| Framework          | Next.js 16.1 (App Router, Server Components)         |
| UI                 | React 19.2, Tailwind CSS 4                           |
| Autoryzacja        | NextAuth.js 4.24 (sesje JWT)                         |
| Edytor rich-text   | TipTap 3 (StarterKit, Link, Placeholder, Underline)  |
| Animacje           | Framer Motion 12                                     |
| Markdown           | react-markdown                                       |
| Język              | TypeScript 5                                         |
| Linting            | ESLint 9 + eslint-config-next                        |
| Testy E2E          | Playwright 1.58                                      |
| Wdrożenie          | Vercel                                               |

### Backend (`smartquote-backend/`)

| Warstwa     | Technologia                                            |
|-------------|--------------------------------------------------------|
| Runtime     | Node.js ≥18                                            |
| Język       | TypeScript 5.5                                         |
| Framework   | Express.js 4.21                                        |
| Baza danych | PostgreSQL                                             |
| ORM         | Prisma 5.22 (22 modele, 20 migracji)                   |
| AI          | Google Gemini 2.5 Flash (`@google/genai`)              |
| Autoryzacja | JWT (`jsonwebtoken`) + bcryptjs, cache auth na 5 minut |
| Walidacja   | Zod 3.23                                               |
| Logowanie   | Pino 8 + pino-pretty                                   |
| Security    | Helmet, allow-list CORS, `express-rate-limit`          |
| PDF         | PDFKit + DejaVu Sans (UTF-8)                           |
| Email       | Nodemailer 6 (SMTP / MailerSend)                       |
| Testy       | Jest 29 + ts-jest                                      |
| Wdrożenie   | Render                                                 |

### DevOps

- **CI/CD**: GitHub Actions (osobne workflow dla frontendu i backendu, filtrowane po ścieżkach)
- **Layout monorepo**: oparty na strukturze plików, bez workspace managera —
  każdy subprojekt ma własny `package.json`

---

## 📋 Wymagania wstępne

- **Node.js** ≥ 18.0 (rekomendowana wersja 20.x)
- **npm** ≥ 9.0 (dostarczany z Node 18+)
- **PostgreSQL** ≥ 14 (dla backendu; można użyć managed instancji — Render, Supabase, Neon)
- **Git** ≥ 2.30
- **Klucz API Google Gemini** — do uzyskania w [Google AI Studio](https://aistudio.google.com/app/apikey)

Opcjonalnie:
- **Dane SMTP** lub **klucz API MailerSend**, jeśli chcesz wysyłać prawdziwe emaile

---

## 🚀 Pierwsze kroki

### 1. Sklonuj repozytorium

```bash
git clone https://github.com/Shellty-IT/SmartQuote.git
cd SmartQuote
```

### 2. Konfiguracja backendu

```bash
cd smartquote-backend
npm install

# Skonfiguruj środowisko
cp .env .env
# Edytuj .env — uzupełnij DATABASE_URL, JWT_SECRET (min. 32 znaki), GEMINI_API_KEY

# Setup bazy danych
npx prisma generate
npx prisma migrate dev
npm run seed              # opcjonalnie: załaduj przykładowe dane

# Uruchom serwer deweloperski
npm run dev
# → http://localhost:8080
```

### 3. Konfiguracja frontendu

W nowym terminalu:

```bash
cd smartquote-frontend
npm install

# Skonfiguruj środowisko — utwórz .env.local w smartquote-frontend/
# (pełna lista zmiennych w sekcji Zmienne środowiskowe poniżej)

# Uruchom serwer deweloperski
npm run dev
# → http://localhost:3000
```

### 4. Weryfikacja

- Frontend: otwórz `http://localhost:3000`
- Health backendu: `curl http://localhost:8080/api/health` powinien zwrócić `{"status":"ok",...}`

---

## ⚙️ Zmienne środowiskowe

### Backend (`smartquote-backend/.env`)

| Zmienna                 | Wymagana | Opis                                                        | Przykład                                           |
|-------------------------|----------|-------------------------------------------------------------|----------------------------------------------------|
| `DATABASE_URL`          | ✅       | Connection string PostgreSQL                                | `postgresql://user:pass@localhost:5432/smartquote` |
| `JWT_SECRET`            | ✅       | Sekret podpisujący JWT, **min. 32 znaki**                   | `super-secret-jwt-key-minimum-32-chars-long`       |
| `GEMINI_API_KEY`        | ✅       | Klucz API Google Gemini                                     | `AIzaSy...`                                        |
| `GEMINI_MODEL`          | ❌       | Identyfikator modelu Gemini                                 | `gemini-2.5-flash` (domyślnie)                     |
| `PORT`                  | ❌       | Port HTTP                                                   | `8080` (domyślnie)                                 |
| `NODE_ENV`              | ❌       | Środowisko uruchomienia                                     | `development` / `production` / `test`              |
| `FRONTEND_URL`          | ✅       | Dozwolony origin CORS (URL frontendu)                       | `http://localhost:3000`                            |
| `CLIENT_URL`            | ✅       | Dodatkowy dozwolony origin CORS                             | `http://localhost:3000`                            |
| `ENCRYPTION_KEY`        | ❌       | 32-znakowy klucz do szyfrowania kluczy API w bazie          | `32-char-encryption-key-here`                      |
| `SMTP_HOST`             | ❌       | Hostname serwera SMTP                                       | `smtp.gmail.com`                                   |
| `SMTP_PORT`             | ❌       | Port serwera SMTP                                           | `587`                                              |
| `SMTP_USER`             | ❌       | Nazwa użytkownika SMTP                                      | `ty@gmail.com`                                     |
| `SMTP_PASS`             | ❌       | Hasło SMTP / hasło aplikacji                                | `app-password`                                     |
| `SMTP_FROM`             | ❌       | Domyślny nagłówek `From:`                                   | `SmartQuote AI <noreply@smartquote.ai>`            |
| `MAILERSEND_API_KEY`    | ❌       | Klucz API MailerSend (alternatywa dla SMTP)                 | `mlsn....`                                         |
| `MAILERSEND_FROM_EMAIL` | ❌       | Email nadawcy MailerSend                                    | `noreply@trial-xxx.mailersend.net`                 |
| `MAILERSEND_FROM_NAME`  | ❌       | Nazwa nadawcy MailerSend                                    | `SmartQuote AI`                                    |
| `KSEF_MASTER_URL`       | ❌       | URL zewnętrznego API KSeF / e-fakturowania                  | `http://localhost:5000`                            |
| `KSEF_MASTER_API_KEY`   | ❌       | Klucz API mostu KSeF                                        | `sk_smartquote_ksef_bridge_secret`                 |
| `CRON_SECRET`           | ❌       | Bearer token uwierzytelniający wywołania `/cron/reminders`  | `random-cron-secret`                               |

Pełny szablon dostępny w [`smartquote-backend/.env.example`](smartquote-backend/.env).

### Frontend (`smartquote-frontend/.env.local`)

| Zmienna                   | Wymagana | Opis                                                       | Przykład                  |
|---------------------------|----------|------------------------------------------------------------|---------------------------|
| `NEXT_PUBLIC_BACKEND_URL` | ✅       | Bazowy URL API backendu                                    | `http://localhost:8080`   |
| `NEXTAUTH_URL`            | ✅       | Publiczny URL frontendu (używany przez NextAuth.js)        | `http://localhost:3000`   |
| `NEXTAUTH_SECRET`         | ✅       | Sekret podpisujący JWT w NextAuth.js, **min. 32 znaki**    | `openssl rand -base64 32` |

---

## 📁 Struktura projektu

```
SmartQuote/
├── .github/
│   └── workflows/
│       ├── frontend-ci.yml          ← CI frontendu (lint, typecheck, build, Playwright E2E)
│       └── backend-ci.yml           ← CI backendu (typecheck, Jest, npm audit, smoke test)
│
├── smartquote-frontend/             ← Aplikacja Next.js 16
│   ├── src/
│   │   ├── app/                     ← Strony App Router (dashboard, strony publiczne, API routes)
│   │   ├── components/              ← Współdzielone komponenty UI
│   │   ├── contexts/                ← Providery React Context (czat AI, toast)
│   │   ├── hooks/                   ← Reużywalne custom hooks
│   │   ├── lib/                     ← Klient API, narzędzia
│   │   └── types/                   ← Współdzielone typy TypeScript
│   ├── tests/e2e/                   ← Testy E2E Playwright
│   ├── docs/                        ← Dokumentacja frontendowa
│   ├── public/                      ← Zasoby statyczne, manifest PWA, service worker
│   ├── vercel.json                  ← Konfiguracja buildu Vercel
│   ├── next.config.ts               ← Konfiguracja Next.js
│   ├── playwright.config.ts         ← Konfiguracja Playwright
│   └── package.json
│
├── smartquote-backend/              ← REST API Express.js
│   ├── src/
│   │   ├── controllers/             ← Handlery HTTP — 14 kontrolerów
│   │   ├── services/
│   │   │   ├── ai/                  ← Modułowe serwisy AI
│   │   │   ├── pdf/                 ← Silnik renderowania PDF
│   │   │   ├── email/               ← Wysyłka emaili, szablony, załączniki
│   │   │   ├── public-offer/        ← Kalkulacje i notyfikacje ofert publicznych
│   │   │   └── shared/              ← Współdzielone kalkulacje
│   │   ├── repositories/            ← Zapytania Prisma — 7 repozytoriów
│   │   ├── routes/                  ← Trasy Express — 14 plików route
│   │   ├── middleware/              ← Auth, walidacja, error handler
│   │   ├── validators/              ← Schematy Zod — 11 walidatorów
│   │   ├── lib/                     ← Klient Prisma, logger Pino, cache auth
│   │   ├── types/                   ← Współdzielone typy
│   │   ├── utils/                   ← Helpery (kalkulacje, kryptografia, kształt response)
│   │   ├── errors/                  ← Własne klasy błędów
│   │   ├── config/                  ← Konfiguracja env walidowana przez Zod
│   │   ├── __tests__/               ← Testy jednostkowe Jest
│   │   └── index.ts                 ← Punkt wejścia
│   ├── prisma/
│   │   ├── schema.prisma            ← 22 modele
│   │   └── migrations/              ← 20 migracji
│   ├── fonts/                       ← DejaVu Sans TTF
│   ├── scripts/seed.ts              ← Seeder przykładowych danych
│   └── package.json
│
├── README.md                        ← Dokumentacja angielska
├── README-PL.md                     ← Dokumentacja polska (ten plik)
└── .gitignore
```

---

## 🔌 Dokumentacja API

**Base URL:** `<host-backendu>/api`
**Autoryzacja:** Bearer JWT — `Authorization: Bearer <token>` (uzyskany z `POST /api/auth/login`)

### Kluczowe endpointy

| Metoda | Endpoint                       | Opis                                                          | Auth |
|--------|--------------------------------|---------------------------------------------------------------|:----:|
| GET    | `/health`                      | Health check + status bazy danych                             |  ❌  |
| POST   | `/auth/login`                  | Logowanie, zwraca JWT                                         |  ❌  |
| POST   | `/auth/register`               | Utworzenie nowego konta użytkownika                           |  ❌  |
| GET    | `/clients`                     | Lista klientów                                                |  ✅  |
| POST   | `/clients`                     | Utworzenie klienta                                            |  ✅  |
| PUT    | `/clients/:id`                 | Aktualizacja klienta                                          |  ✅  |
| DELETE | `/clients/:id`                 | Usunięcie klienta                                             |  ✅  |
| GET    | `/offers`                      | Lista ofert                                                   |  ✅  |
| POST   | `/offers`                      | Utworzenie oferty                                             |  ✅  |
| GET    | `/offers/:id/pdf`              | Wyrenderowanie PDF oferty                                     |  ✅  |
| GET    | `/offers/:id/analytics`        | Wyświetlenia, interakcje, komentarze                          |  ✅  |
| GET    | `/contracts`                   | Lista umów                                                    |  ✅  |
| GET    | `/contracts/:id/pdf`           | Wyrenderowanie PDF umowy (z blokiem podpisu)                  |  ✅  |
| GET    | `/followups`                   | Lista follow-upów                                             |  ✅  |
| POST   | `/ai/chat`                     | Czat z asystentem AI                                          |  ✅  |
| POST   | `/ai/generate-offer`           | Wygenerowanie oferty z opisu                                  |  ✅  |
| POST   | `/ai/price-insight`            | Rekomendacja cenowa                                           |  ✅  |
| GET    | `/ai/insights`                 | Lista analiz post-mortem                                      |  ✅  |
| GET    | `/emails`                      | Logi emaili                                                   |  ✅  |
| POST   | `/emails`                      | Stworzenie i wysyłka emaila                                   |  ✅  |
| GET    | `/offer-templates`             | Lista wielokrotnych szablonów ofert                           |  ✅  |
| POST   | `/ksef`                        | Wywołanie zewnętrznej e-faktury                               |  ✅  |
| GET    | `/settings`                    | Ustawienia użytkownika, dane firmy, klucze API                |  ✅  |
| GET    | `/notifications`               | Powiadomienia in-app                                          |  ✅  |
| GET    | `/public/offers/:token`        | Publiczny widok oferty (token, bez auth)                      |  ❌  |
| POST   | `/public/offers/:token`        | Akceptacja/podpisanie oferty publicznej                       |  ❌  |
| GET    | `/public/contracts/:token`     | Publiczny widok umowy (token, bez auth)                       |  ❌  |
| POST   | `/public/contracts/:token`     | Podpisanie publicznej umowy                                   |  ❌  |
| POST   | `/cron/reminders`              | Wywołanie crona przypomnień follow-up (wymaga CRON_SECRET)    |  🔑  |

### Format odpowiedzi

```json
{
  "success": true,
  "data": {},
  "meta": { "page": 1, "limit": 10, "total": 50 }
}
```

### Middleware bezpieczeństwa

- **CORS** — allow-list oparta na `FRONTEND_URL` / `CLIENT_URL`
- **Helmet** — bezpieczne nagłówki HTTP
- **Rate limiting** — 500 żądań/15 min globalnie; 20 żądań/15 min dla `/auth/*`; 30 żądań/15 min per-user dla `/ai/*`; 100 żądań/15 min dla publicznych stron ofert/umów
- **Walidacja Zod** — każde body, query i param sprawdzane schematem
- **Cache auth** — TTL 5 minut w pamięci, redukuje obciążenie DB o ~80% na żądaniach z autoryzacją

---

## 🧪 Testowanie

### Backend — testy jednostkowe Jest

```bash
cd smartquote-backend
npm test                    # uruchom wszystkie testy jednostkowe
npm run test:watch          # tryb watch
npm run test:coverage       # raport pokrycia (HTML w coverage/)
```

Pliki testów znajdują się w `smartquote-backend/src/__tests__/`.

### Frontend — testy E2E Playwright

```bash
cd smartquote-frontend
npm run test:e2e            # uruchomienie headless
npm run test:e2e:ui         # tryb Playwright UI
npm run test:e2e:headed     # uruchomienie z widocznym browserem
```

Pliki testów znajdują się w `smartquote-frontend/tests/e2e/`.
Testy E2E w CI uruchamiają się przeciwko wdrożonemu produkcyjnemu frontendowi
(`PLAYWRIGHT_BASE_URL`) po każdym pushu do `main`.

### TypeScript i linting

```bash
# Backend
cd smartquote-backend && npm run typecheck

# Frontend
cd smartquote-frontend && npx tsc --noEmit
cd smartquote-frontend && npm run lint
```

### Pipeline'y CI

| Workflow                            | Uruchamia się przy zmianach w | Joby                                                                                              |
|-------------------------------------|-------------------------------|---------------------------------------------------------------------------------------------------|
| `.github/workflows/frontend-ci.yml` | `smartquote-frontend/**`      | Lint + TypeScript → Build → E2E (tylko push do `main`)                                            |
| `.github/workflows/backend-ci.yml`  | `smartquote-backend/**`       | TypeScript → Jest + coverage → `npm audit` (nieblokujący) → smoke test (tylko push do `main`)     |

---

## 🚢 Wdrożenie

Monorepo wdraża oba projekty niezależnie — nie ma konfiguracji Docker.

### Frontend — Vercel

- Wdrożony przez Vercel z natywnym wsparciem Next.js App Router
- Zmienne środowiskowe ustaw w **Vercel → Project → Settings → Environment Variables**
- Połącz Vercel z repozytorium GitHub, ustaw root directory na `smartquote-frontend/`

### Backend — Render

- Render automatycznie wykryje projekt Node.js; ustaw root directory na `smartquote-backend/`
- Build command: `npm install && npx prisma generate && npm run build`
- Start command: `npm start`
- Dodaj add-on PostgreSQL — `DATABASE_URL` zostanie wstrzyknięty automatycznie
- Migracje przy pierwszym wdrożeniu uruchom z shella Render: `npx prisma migrate deploy`

### Wymagane GitHub Secrets dla CI

Aby pełne CI (z E2E i smoke testami) działało, skonfiguruj poniższe sekrety repozytorium w
**Settings → Secrets and variables → Actions**:

- **Backend:** `DATABASE_URL`, `JWT_SECRET`, `GEMINI_API_KEY`, `BACKEND_HEALTH_URL`
- **Frontend:** `NEXT_PUBLIC_BACKEND_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`,
  `PLAYWRIGHT_BASE_URL`, `TEST_EMAIL`, `TEST_PASSWORD`

---

## 🤝 Współpraca

### Model gałęzi

- `main` — produkcyjna, chroniona
- Branche feature: `feat/<krótki-opis>`
- Naprawy błędów: `fix/<krótki-opis>`
- Refaktory: `refactor/<scope>`
- Dokumentacja: `docs/<scope>`
- Utrzymanie: `chore/<scope>`

### Workflow pull-requestów

1. Odbij gałąź od `main`
2. Wprowadzaj zmiany **w jednym subprojekcie** kiedy to możliwe — CI jest filtrowane po ścieżkach
3. Przed pushem uruchom lokalnie `npm run lint`, `npm test` (backend) i `npm run test:e2e` (frontend)
4. Otwórz PR targetujący `main`, uzupełnij opis i odwołaj się do powiązanego issue
5. Poczekaj na zielony CI w odpowiednim workflow
6. Poproś o review; po akceptacji squash-merge

### Styl kodu

- **TypeScript strict mode** jest włączony w obu projektach — nie osłabiaj `tsconfig.json`
- **Backend** — controllery są chude (`try/catch + next(err)`), logika biznesowa w serwisach,
  dostęp do danych wyłącznie w repozytoriach
- **Frontend** — preferuj Server Components; przechodź na Client Components dopiero gdy
  potrzebujesz interaktywności
- Uruchom linter przed commitowaniem — CI zafailuje na błędach lintu
- Waliduj każde przychodzące żądanie przez Zod (backend) — żadne nieufne dane nie trafią do serwisów

### Wiadomości commitów

Stosuj styl Conventional Commits — przykłady: `feat(offers): add public token preview`,
`fix(ai): handle empty Gemini response`, `chore(ci): bump Node to 20.x`.

---

## 📄 Licencja

**Proprietary** — wszelkie prawa zastrzeżone, Shellty-IT.
Kod jest prywatny i nie jest licencjonowany do redystrybucji. Wykorzystanie komercyjne pozostaje
w gestii właściciela projektu.

---

## 👥 Autorzy i kontakt

- **Maintainer / Właściciel:** [Shellty-IT](https://github.com/Shellty-IT)
- **Repozytorium:** [github.com/Shellty-IT/SmartQuote](https://github.com/Shellty-IT/SmartQuote)
- **Issues:** [github.com/Shellty-IT/SmartQuote/issues](https://github.com/Shellty-IT/SmartQuote/issues)

W sprawach komercyjnych prosimy o otwarcie issue na GitHubie lub kontakt bezpośredni z maintainerem.

---

<div align="center">

Zbudowane w **TypeScript** · **Next.js** · **Express.js** · **PostgreSQL** · **Google Gemini AI**

</div>

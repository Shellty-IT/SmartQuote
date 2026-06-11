# Raport Audytu SmartQuote — 2026-06-11

**Branch:** `fix/june-bugs` | **Model:** claude-sonnet-4-6 | **Audytor:** Claude Code

---

## 1. Weryfikacja wykonanych prac

### 1.1 Core CRM

| # | Funkcja | Status | Komentarz |
|---|---|---|---|
| 1 | Zarządzanie klientami (CRUD) | ✅ DONE | `clients.repository.ts` + service + controller, walidator z `preprocess` dla URL |
| 2 | Zarządzanie ofertami (CRUD) | ✅ DONE | `offers.repository` pełny CRUD, retry P2002 |
| 3 | Zarządzanie umowami (CRUD) | ✅ DONE | `contracts.repository` pełny CRUD |
| 4 | Lifecycle ofert | ✅ DONE | enum `OfferStatus` 7 stanów + automatyczne timestampy |
| 5 | Lifecycle umów | ✅ DONE | enum `ContractStatus` 6 stanów |
| 6 | Numeracja `OFF/{ROK}/{NNN}` | ✅ DONE | `MAX CAST` + retry P2002, 16 testów jednostkowych |
| 7 | Publiczne oferty | ✅ DONE | token 128-bit (`randomBytes(16).base64url`) |
| 8 | Publiczne umowy + canvas | ✅ DONE | token 256-bit (`randomBytes(32).hex`) |
| 9 | OfferView + OfferInteraction tracking | ✅ DONE | osobne tabele z indeksami |

### 1.2 PDF i Szablony

| # | Funkcja | Status |
|---|---|---|
| 10 | PDF klasyczny (React-PDF) | ✅ DONE — test `pdf.service.test.ts` |
| 11 | PDF "Strona internetowa" (Puppeteer/Vercel) | ✅ DONE |
| 12 | PDF umowy klasycznej | ✅ DONE |
| 13 | PDF umowy "Strona internetowa" | ✅ DONE — `vercel.json` 1024MB/30s |
| 14 | Embedded fonts WOFF2 base64 | ✅ DONE — `embedded-fonts.ts` (294KB) |
| 15 | Block editor 8 sekcji | ✅ DONE — `SectionKey` w `proposal-blocks.ts` |
| 16 | SectionManager (reorder/move/delete) | ✅ DONE — `SectionManagerPanel` |
| 17 | Block editor umowy (9 sekcji) | ✅ DONE — `ContractSectionKey` |
| 18 | Domyślne szablony (localStorage) | ✅ DONE |
| 19 | Preview modal HTML+PDF | ✅ DONE — `PdfPreviewModal` |
| 20 | Auto-save w `ContractTemplateTab` | ✅ DONE |
| 21 | `priceOverride` w `pricingExtra` | ✅ DONE — backend syncuje totals |

### 1.3 AI Funkcje

| # | Funkcja | Status |
|---|---|---|
| 22 | Global AI Chat FAB | ✅ DONE — z `pageContext` i `executeAction` |
| 23 | AI offer-description (generate/polish) | ✅ DONE |
| 24 | AI generate section | ✅ DONE — `POST /ai/generate-section` |
| 25 | AI offer-fill (Marek) | ✅ DONE — `[[FILL_COMPLETE]]` marker |
| 26 | OfferAIDrawer + animacje | ✅ DONE — Framer Motion |
| 27 | `hideGlobalFab` flag | ✅ DONE — w `AIChatContext` |
| 28 | Price insight / Observer / Closing / PostMortem | ✅ DONE |
| 29 | MemoryCache z TTL per typ | ✅ DONE — `src/lib/cache.ts` |
| 30 | **AI Price Check** (P2) | ✅ DONE — endpoint + badge w `ItemsTable` |
| 31 | **AI Agent z action dispatcher** | ✅ DONE — 7 typów akcji |

### 1.4 Email i KSeF

| # | Funkcja | Status |
|---|---|---|
| 32 | Wysyłka SMTP/MailerSend | ✅ DONE |
| 33 | Per-user SMTP (zaszyfrowane) | ⚠️ PARTIAL — patrz bug C1 (klucz fallback) |
| 34 | Fallback do globalnych env | ✅ DONE |
| 35 | Follow-up cron `/cron/reminders` | ✅ DONE — autoryzacja `CRON_SECRET` |
| 36 | KSeF send/availability/draft | ✅ DONE — `ksef-bridge.service.ts` |
| 37 | Webhook HMAC + timestamp ±5min | ✅ DONE — `crypto.timingSafeEqual` |
| 38 | NIP regex `^\d{10}$` | ✅ DONE |

### 1.5 Auth i Bezpieczeństwo

| # | Funkcja | Status |
|---|---|---|
| 39 | JWT HS256, 7-dni / NextAuth 24h | ✅ DONE |
| 40 | bcryptjs 12 rounds | ✅ DONE — `config.saltRounds: 12` |
| 41 | Rate limiting global/auth | ✅ DONE — brak osobnego limitu na AI (bug C3) |
| 42 | CORS strict allow-list (Set) | ✅ DONE |
| 43 | JWT secret min 32 znaki | ✅ DONE — Zod enforcement przy starcie |
| 44 | OfferAcceptance audit hash SHA-256 | ✅ DONE — `contentHash` w `OfferAcceptanceLog` |
| 45 | SMTP password encryption (AES-256-GCM) | ⚠️ PARTIAL — bug C1 (fallback key) |
| 46 | Auth cache 5-min | ✅ DONE — `auth-cache.ts` |

### 1.6 Nowo dodane funkcje (P1–P9 + AI Agent)

| # | Funkcja | Status |
|---|---|---|
| 47 | **P1 Global Search (Ctrl+K)** | ✅ DONE — cmdk, debounce 300ms, cache 30s |
| 48 | **P3 Lead Module** (model+CRUD+convert) | ✅ DONE |
| 49 | **P4 Widok 360° klienta** | ✅ DONE — win rate, lastContact, contracts list |
| 50 | **P5 Notes (4 encje)** | ✅ DONE — `NotesFeed` polimorficzny |
| 51 | **P6 useAutoSave + InlineEdit** | ⚠️ PARTIAL — bug I3 (silent errors) |
| 52 | **P7 Kalendarz + @schedule-x** | ⚠️ PARTIAL — bug I5 (`@ts-ignore`) |
| 53 | **P8 Smart Alerts** | ✅ DONE — 5 typów alertów |
| 54 | **P9 Mobile UX** | ⚠️ PARTIAL — bug I6 (tylko leady, nie wszystkie listy) |

### 1.7 i18n, Testy, Deployment

| # | Funkcja | Status |
|---|---|---|
| 55 | pl.ts/en.ts pokrycie | ✅ DONE — wszystkie nowe sekcje dopisane |
| 56 | Migracje 20260604/20260608 | ✅ DONE — applied na bazie |
| 57 | Vercel: 1024MB/30s dla 3 PDF routes | ✅ DONE — `vercel.json` |
| 58 | CI backend (typecheck + 50% coverage) | ✅ DONE — `.github/workflows/backend-ci.yml` |
| 59 | CI frontend | ✅ DONE — `.github/workflows/frontend-ci.yml` |
| 60 | E2E Playwright | ⚠️ PARTIAL — 7 spec files (offer/contract), brak nowych features |
| 61 | Branch `fix/june-bugs` NIE zmergowany | ✅ Zgodnie z założeniem |

---

## 2. Audyt

### 2.1 Bezpieczeństwo — 6.5/10

**Pozytywy:**
- Wszystkie endpointy poza `/public/*` mają `authenticate` middleware
- Zod validation middleware używany konsekwentnie
- bcrypt 12 rounds, JWT secret enforced (32 char min via Zod)
- HMAC z `crypto.timingSafeEqual`, okno ±5 min — chroni przed replay attacks
- AES-256-GCM dla SMTP passwords z auth tag
- Public tokens: 128–256 bit entropii
- Pino loguje hashe requestów bez payload
- helmet + CSP `frame-ancestors 'none'` + HSTS preload
- Repository pattern z ownership check przez `existsForUser` w service layer

**Znalezione problemy:**

#### C1 — KRYTYCZNY: Predykowalny fallback klucza szyfrowania
**Plik:** `smartquote-backend/src/utils/crypto.ts:13`
```typescript
return Buffer.from(envKey.padEnd(32, '0'), 'utf-8'); // klucz = '0000...0000'
```
Jeśli `ENCRYPTION_KEY` nie jest ustawiona, klucz to 32 zera — każdy z dostępem do DB odszyfrowuje SMTP hasła.
**Naprawa:** Wymuś zmienną w `config/index.ts` jako `z.string().min(32)` (wyrzuć przy starcie, nie paduj).

#### C2 — KRYTYCZNY: Nodemailer 6.9.16 CVE (CRLF injection)
**Plik:** `smartquote-backend/package.json:37`
CVE GHSA-9h6g-pr5r-wfg2 — niska eksploatowalność w SmartQuote (atakujący nie kontroluje opcji transportu), ale `npm audit` w CI jest `|| true` — nie blokuje deploymentu.
**Naprawa:** `npm install nodemailer@^7.0.0`

#### C3 — WYSOKI: Brak rate-limitingu dla `/api/ai/*`
**Plik:** `smartquote-backend/src/app.ts:41–70` — tylko `globalLimiter` (500/15min) + `authLimiter`.
Jeden złośliwy użytkownik: 500 wywołań Gemini × ~0.15 PLN = **75 PLN / 15 min**.
**Naprawa:** Dodaj `aiLimiter` (30 req/15min per user) na `router.use('/ai', aiLimiter)`.

#### C4 — WYSOKI: Repository `update/delete` bez `userId` w `where` (TOCTOU)
**Plik:** wszystkie `*.repository.ts` — `update({ where: { id } })` bez userId.
Ownership check w service przez `existsForUser` jest oddzielnym zapytaniem — race condition (TOCTOU) jest teoretycznie możliwy.
**Naprawa:** `updateMany({ where: { id, userId }, data })` jako atomowa operacja.

#### C5 — ŚREDNI: Tokeny publiczne widoczne w logach
**Plik:** `smartquote-backend/src/app.ts:80–100` — `req.originalUrl` loguje ścieżki `/api/public/offers/{token}/accept`.
**Naprawa:** Maskuj wzorzec `/:token` w logger middleware.

---

### 2.2 Wydajność — 6/10

**Pozytywy:**
- Schema dobrze zindeksowana: `userId`, `userId+status`, `userId+createdAt`, `clientId`, `publicToken`, indeksy kompozytowe
- Wszystkie list queries używają `Promise.all([find, count])` — paralelizm
- MemoryCache stosowany w KSeF availability, AI results, search (30s), price-check (15min)
- `embedded-fonts.ts` (294KB) importowany tylko przez PDF handlers — NIE wchodzi do client bundle
- Puppeteer/Chromium w osobnych Vercel function bundlach
- Auth cache 5-min eliminuje ~95% queries do `users` na każdy request

**Znalezione problemy:**

#### W1 — WYSOKI: Brak React Query / SWR
Frontend używa custom hooks z `useState + useEffect`. Każde montowanie komponentu = fresh fetch. Brak cachowania między komponentami, auto-refetch on focus, optimistic updates, deduplication w locie.
**Naprawa:** Wprowadź TanStack Query — zaczyna dawać efekty po migracji 5 najczęstszych hooków.

#### W2 — ŚREDNI: N+1 ryzyko w `search.service.ts`
Czterotorowe `Promise.all` z `mode: 'insensitive'` bez ograniczenia długości szukanego ciągu — pełny scan na 4 tabelach.
**Naprawa:** Dodaj `maxLength` na input (Zod), rozważ `pg_trgm` / FTS przy >100k rekordów.

#### W3 — ŚREDNI: In-memory caches nie skalowalne
Auth cache, MemoryCache, KSeF availability — wszystko w `Map`. Skaluje się do 1 instancji.
**Naprawa:** Redis (gdy >1 instancja — na razie OK).

#### W4 — ŚREDNI: Render free 512MB z Prisma + brak monitoringu pamięci
Bazowy footprint ~150–200 MB. Pod obciążeniem możliwy OOM. Brak alertów na memory usage.

#### W5 — WYSOKI: Brak connection pooler dla DB
Prisma w trybie default = każdy request może otwierać nowe połączenie. Render Postgres free = limit 97 połączeń.
**Naprawa:** Włącz PgBouncer (transaction pooling) — Render daje `DATABASE_URL_POOLING`.

---

### 2.3 Jakość kodu — 7.5/10

**Pozytywy:**
- Czysta architektura: controller → service → repository, konsekwentna w całej bazie
- DomainError hierarchy (NotFoundError, ValidationError, ConflictError, UnauthorizedError, ExternalServiceError)
- TypeScript: **0 błędów** na obu projektach (`tsc --noEmit --skipLibCheck`)
- `any` w backendzie: 25 wystąpień / 9 plików — głównie utility/transport (akceptowalne)
- `any` w frontendzie: 2 wystąpienia / 1 plik — bardzo czysto
- Walidacja Zod przed service layer wszędzie
- Zero duplikacji kodu w nowych modułach (leads/notes/calendar — identyczny wzorzec)

**Znalezione problemy:**

#### Q1 — WYSOKI: Typy nie są współdzielone między backend/frontend
`ProposalBlocks`, `LeadStatus`, `AIAction` zdefiniowane DWA RAZY. Ryzyko driftu po aktualizacji modelu.
**Naprawa:** Pakiet `@smartquote/shared-types` lub przynajmniej skrypt sync.

#### Q2 — WYSOKI: Empty catch blocks (silent fails)
```
NotesFeed.tsx:50    — catch { /* silently fail */ }
InlineEdit.tsx      — catch { /* ignore */ }
OfferAIDrawer.tsx   — catch { /* ignore */ }
```
Użytkownik traci dane bez powiadomienia.
**Naprawa:** Centralny helper `handleApiError(err, toast, fallback)` z toast.error.

#### Q3 — NISKI: `@ts-ignore` w `calendar/page.tsx`
3× `@ts-ignore` na importach `@schedule-x/*`. Traci type safety.
**Naprawa:** Dodaj `types/schedule-x.d.ts` z `declare module`.

#### Q4 — ŚREDNI: `pricingExtra.priceType` parsing robiony 3× ręcznie
W `offers.service`, `DetailsTab`, PDF renderer — brak wspólnego helpera.
**Naprawa:** Wyciągnąć `extractPricing(blocks)` do `utils/pricing.ts`.

---

### 2.4 UX / Użyteczność — 6.5/10

**Pozytywy:**
- Sidebar z aktywnym stanem + collapse + mobile drawer
- Loading skeletons w wielu miejscach
- Toast system używany w settings, offers
- Empty states z CTA
- Status badges z kolorami konsekwentne
- KPI cards z trendami, dashboard dark gradient
- Page context badge w AI chat
- CommandPalette (Ctrl+K) — szybka nawigacja

**Znalezione problemy:**

#### UX1 — KRYTYCZNY: Brak globalnego Error Boundary
Crash w dowolnym komponencie → biały ekran. Brak `app/error.tsx` per route.
**Naprawa:** Dodaj `error.tsx` i `global-error.tsx` w Next.js 16 route hierarchy.

#### UX2 — KRYTYCZNY: Silent fails w NotesFeed/InlineEdit
Patrz Q2 — użytkownik edytuje notatkę, traci ją bez ostrzeżenia.
**Naprawa:** Toast + retry (część Q2).

#### UX3 — NISKI: Brak wskaźnika "kontekstu AI" na FAB
Page context wysyłany do AI, ale użytkownik nie widzi że AI go ma (badge tylko w otwartym chacie).
**Naprawa:** Delikatny pulsujący dot na FAB gdy `pageContext.type !== 'other'`.

#### UX4 — ŚREDNI: Brak breadcrumbs
Nawigacja offer → client → offer jest zagubiona — tylko przycisk "Wróć".

#### UX5 — ŚREDNI: Smart Alerts tylko na `/dashboard`
Alert "Oferta wygasa za 1 dzień" powinien być widoczny też na liście ofert.
**Naprawa:** Mały persistent bar z alertami w dashboard layout, nie tylko na home.

---

### 2.5 Infrastruktura — 5/10

**Pozytywy:**
- `vercel.json`: 1024MB / 30s dla 3 PDF routes
- GitHub Actions: backend (typecheck + 50% coverage + smoke test) + frontend
- CSP / HSTS / X-Frame-Options ustawione
- CORS strict allow-list z env vars
- Helmet enabled

**Znalezione problemy:**

#### I1 — KRYTYCZNY: Render free tier (512MB) + zimne starty 50s+
Czas zimnego startu na public offer link → timeout dla end-użytkownika.
**Naprawa:** Upgrade do Render Starter ($7/mo) lub Railway/Fly z always-on.

#### I2 — WYSOKI: Brak agregacji logów
Pino loguje do stdout, brak Sentry / Logtail / Better Stack. Render free retencja ~7 dni.
**Naprawa:** Sentry SDK (free 5k events/mo) na backend + frontend.

#### I3 — ŚREDNI: Brak monitoringu wydajności
Brak metryk: response time p95, memory usage, DB connection pool.

#### I4 — NISKI: Monorepo bez workspace manager
Brak `pnpm-workspace.yaml`. PR przy aktualizacji modelu Prisma wymaga ręcznej synchronizacji frontu.

#### I5 — WYSOKI: Security audit w CI nie blokuje deploymentu
**Plik:** `.github/workflows/backend-ci.yml:112` — `npm audit ... || true`.
**Naprawa:** `npm audit --audit-level=high` bez `|| true` dla critical/high CVE.

#### I6 — KRYTYCZNY: Brak strategii backupu DB
Render Postgres free backup retention: 24h. Brak `pg_dump` cron do S3/R2.
**Naprawa:** Cron `pg_dump` co 6h + upload do Cloudflare R2 (free 10GB).

---

### 2.6 Testy — 5/10

**Pozytywy:**
- 16 plików Jest / **79 test cases** w backendzie
- Pokryte: offer number, AI prompts, calculations, content hash, public offer calculator, crypto, email templates
- E2E Playwright: 7 spec files (offer audit-trail, comments, reject, variants, contract lifecycle, signature)
- CI z 50% coverage threshold (line+statement+function)

**Znalezione problemy:**

#### T1 — KRYTYCZNY: Brak testów dla auth flow
`auth.service.ts` (login, register, hash compare, JWT sign) — **0 testów**.

#### T2 — WYSOKI: Brak testów dla nowych modułów (P1–P9)
- `leads.service.ts` — 0 testów (CRUD + convert)
- `notes.service.ts` — 0 testów (polymorphic ownership)
- `calendar.service.ts` — 0 testów
- `search.service.ts` — 0 testów
- `alerts.service.ts` — 0 testów

#### T3 — KRYTYCZNY: Brak testów dla KSeF HMAC verification
`verifyWebhookHmac` w `ksef-bridge.service.ts:63` — krytyczna funkcja bezpieczeństwa, **0 testów**.
Brakuje: valid signature passes, invalid fails, expired timestamp fails, malformed, length mismatch, timing attack resistance.

#### T4 — WYSOKI: Brak testów dla repository ownership
Nie ma testu który sprawdza że `clientsService.update('foreign-id', 'user-1', ...)` rzuca NotFoundError.

#### T5 — ŚREDNI: E2E nie pokrywa lead/notes/calendar/search

#### T6 — WYSOKI: `npm audit` w CI report-only
Patrz I5.

---

## 3. Raport Końcowy

### 3.1 Executive Summary

SmartQuote ma **solidny rdzeń architektoniczny** — separacja warstw jest konsekwentna, walidacja Zod kompletna, schema dobrze zindeksowana, JWT i bcrypt poprawnie skonfigurowane. Wszystkie 9 priorytetów z roadmapy (P1–P9 + AI Agent) zostały zaimplementowane i przechodzą `tsc --noEmit` bez błędów.

**Aplikacja NIE jest gotowa do produkcji** z trzech głównych powodów:

1. **C1 — Luka kryptograficzna:** przy braku `ENCRYPTION_KEY` używany jest klucz `'0000...0000'` — szyfrowanie SMTP staje się fasadą
2. **C3 — Brak rate-limitingu AI:** jeden użytkownik może wygenerować 500 wywołań Gemini w 15 minut (~75 PLN / 15 min)
3. **T1+T3 — Brak testów:** auth flow i KSeF HMAC verification pokryte zerem testów

Po naprawieniu 4 błędów krytycznych (C1–C4) i napisaniu podstawowych testów (T1–T4) aplikacja będzie production-ready w ciągu **3–5 dni roboczych**.

---

### 3.2 Macierz ocen

| Obszar | Ocena | Status |
|---|---|---|
| Bezpieczeństwo | **6.5 / 10** | Wymaga uwagi |
| Wydajność | **6.0 / 10** | Wymaga uwagi |
| Jakość kodu | **7.5 / 10** | Dobra |
| UX / Użyteczność | **6.5 / 10** | Wymaga uwagi |
| Infrastruktura | **5.0 / 10** | Krytyczna |
| Testy | **5.0 / 10** | Krytyczna |
| **Ogółem** | **6.1 / 10** | Wymaga uwagi |

---

### 3.3 Lista krytycznych błędów (MUST FIX)

| # | Problem | Plik | Naprawa | Szacowany czas |
|---|---|---|---|---|
| C1 | Fallback klucza szyfrowania `padEnd(32, '0')` | `crypto.ts:13` | Wymuś `ENCRYPTION_KEY` w Zod config jako required min 32, usuń fallback | 30 min |
| C2 | Nodemailer 6.9.16 CVE (CRLF injection) | `package.json:37` | `npm install nodemailer@^7.0.0` | 1 h |
| C3 | Brak rate-limitingu AI | `app.ts:41` | `aiLimiter` 30 req/15min per user na `/api/ai/*` | 30 min |
| C4 | Repository update/delete bez `userId` (TOCTOU) | wszystkie `*.repository.ts` | `updateMany({ where: { id, userId } })` | 3 h |
| I1 | Render free tier + zimne starty 50s+ | infrastruktura | Upgrade do Render Starter lub Railway/Fly | 2 h |
| I6 | Brak backupów DB | infrastruktura | Cron `pg_dump` co 6h → R2 / S3 | 2 h |
| T1 | Brak testów auth flow | `__tests__/auth.test.ts` | 8+ test cases (login, register, invalid pw, JWT verify) | 3 h |
| T3 | Brak testów KSeF HMAC | `__tests__/ksef-hmac.test.ts` | 6 test cases (valid/invalid/expired/malformed/replay) | 2 h |

**Łącznie: ~14 godzin = ~2 dni robocze**

---

### 3.4 Ważne poprawki (SHOULD FIX)

| # | Problem | Plik | Naprawa | Szacowany czas |
|---|---|---|---|---|
| C5 | Tokeny publiczne w logach | `app.ts:90` | Maskuj wzorzec `/:token` w logger middleware | 1 h |
| W1 | Brak React Query | frontend hooks | Wprowadź TanStack Query, migruj 5 hooków | 4 h |
| W5 | Brak connection poolera | `DATABASE_URL` | Włącz PgBouncer w Render Postgres | 1 h |
| I2 | Brak Sentry | frontend + backend | Setup Sentry SDK (free plan) | 2 h |
| I5 | Security audit nie blokuje | `backend-ci.yml:112` | Usuń `|| true` dla `--audit-level=high` | 30 min |
| Q1 | Duplikacja typów backend↔frontend | typy w obu projektach | `packages/shared-types` lub codegen | 4 h |
| Q2 | Silent error catches | `NotesFeed`, `InlineEdit`, `OfferAIDrawer` | Centralny `handleApiError(err, toast)` | 2 h |
| UX1 | Brak Error Boundary | `app/error.tsx` per route | Dodaj 4 pliki | 1 h |
| T2 | Brak testów nowych modułów | `__tests__/` | 5 plików × ~8 testów | 8 h |
| T4 | Brak testów ownership IDOR | `__tests__/repository-ownership.test.ts` | Test dla każdej encji | 2 h |

**Łącznie: ~26 godzin = ~3 dni robocze**

---

### 3.5 Nice to Have

- **W2:** PostgreSQL FTS / `pg_trgm` dla `search` przy >100k rekordów
- **W3:** Redis dla cache (przy >1 instancji)
- **W6:** `useMemo`/`useCallback` w listach (drobna optymalizacja)
- **UX3:** Pulsujący dot na FAB gdy `pageContext.type !== 'other'`
- **UX4:** Breadcrumbs w nawigacji
- **UX5:** Smart Alerts globalny topbar zamiast tylko na `/dashboard`
- **Q3:** `declare module` dla `@schedule-x/*` zamiast `@ts-ignore`
- **Q4:** Helper `extractPricing(blocks)` zamiast duplikacji 3×
- **I3:** Metryki Render + Vercel Analytics
- **I4:** pnpm workspaces

---

### 3.6 Rekomendacja gotowości do produkcji

**Nie gotowa — wymaga naprawy 8 pozycji z sekcji 3.3.**

Aplikacja jest architektonicznie solidna i funkcjonalnie kompletna (wszystkie P1–P9 + AI Agent zaimplementowane, 0 błędów TypeScript), ale trzy klasy ryzyka blokują go live:

| Blokada | Co grozi |
|---|---|
| C1 — fallback key | Wyciek SMTP credentials każdego użytkownika |
| C3 — brak AI rate-limit | Dowolny koszt Gemini API jedną sesją |
| T1+T3 — brak testów auth/HMAC | Regresja w bezpieczeństwie niezauważona |

---

### 3.7 Plan naprawczy — 5 dni roboczych

**Dzień 1 — Bezpieczeństwo (blokery)**
- C1: wymusz `ENCRYPTION_KEY` w Zod config (30 min)
- C2: `nodemailer@^7.0.0` + smoke test email (1 h)
- C3: `aiLimiter` na `/api/ai/*` (30 min)
- C4: atomic `updateMany` z `userId` we wszystkich repozytoriach (3 h)
- C5: maskowanie tokenów w logach (1 h)
- I5: usuń `|| true` w `backend-ci.yml` (30 min)
- Smoke test wszystkich zmian (2 h)

**Dzień 2 — Testy krytyczne**
- T1: `auth.service.test.ts` — login, register, bcrypt, JWT (3 h)
- T3: `ksef-hmac.test.ts` — 6 scenariuszy HMAC (2 h)
- T4: `repository-ownership.test.ts` — IDOR prevention per encja (2 h)

**Dzień 3 — Infrastruktura**
- I1: decyzja + migracja Render Starter lub Railway (2 h)
- W5: connection pooler PgBouncer (1 h)
- I6: cron `pg_dump` → R2 (2 h)
- I2: Sentry SDK frontend + backend (2 h)

**Dzień 4 — UX i jakość kodu**
- UX1 + UX2 + Q2: `error.tsx` + `handleApiError` helper + toasty (3 h)
- W1: TanStack Query — migracja 5 kluczowych hooków (4 h)

**Dzień 5 — Testy nowych modułów + E2E**
- T2: testy dla leads/notes/calendar/search/alerts (8 h)

**Po dniu 5:** uruchom production beta z 5 pilotażowymi klientami przez tydzień, monitoring przez Sentry, dopiero potem GA.

---

### Procedura mergowania (po zakończeniu planu naprawczego)

```
1. Code review przez drugiego programistę
2. git merge fix/june-bugs → main (squash)
3. npx prisma migrate deploy  # na Render production
4. Vercel deploy main
5. Smoke test: offer creation → PDF → email → public link → sign
6. Playwright E2E na produkcji: npx playwright test --project=chromium
```

---

*Raport wygenerowany automatycznie na podstawie analizy kodu źródłowego. Nie commitować bez jawnej instrukcji.*

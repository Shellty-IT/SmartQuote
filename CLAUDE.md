# SmartQuote — CLAUDE.md

## What is SmartQuote

SmartQuote is an AI-powered sales CRM for generating and managing commercial offers,
contracts, and client follow-ups. Key features: AI-assisted offer generation (Google
Gemini), PDF rendering, public shareable offer/contract pages, e-mail delivery, and
integration with an external e-invoicing service (KSeF Master).

## Repository

- Hosting: GitHub — `Shellty-IT/SmartQuote`
- Deployments: backend on Render, frontend on Netlify
- Monorepo — two independent projects, no workspace manager

## Stack

### Backend (`smartquote-backend/`)

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js ≥ 18, TypeScript 5.5 |
| Framework | Express.js |
| ORM / DB | Prisma 5.22 + PostgreSQL |
| Auth | JWT (jsonwebtoken, HS256, 7-day), bcryptjs (12 rounds) |
| Validation | Zod (middleware-level, before service layer) |
| AI | Google Gemini 2.5 Flash (`@google/genai`) |
| PDF | PDFKit + DejaVu Sans (UTF-8 / Polish) |
| Email | Nodemailer SMTP or MailerSend API (per-user settings) |
| Logging | Pino (`createModuleLogger`) |
| Testing | Jest + ts-jest |
| DI | Lightweight custom container (`src/lib/di-container.ts`) |

### Frontend (`smartquote-frontend/`)

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1, React 19.2, TypeScript 5 |
| Auth | NextAuth.js 4.24 (JWT session, 24 h) |
| UI | Radix UI primitives, Tailwind CSS 4, Framer Motion 12 |
| Rich text | TipTap 3 |
| Charts | Recharts 2 |
| Forms | react-hook-form + Zod |
| i18n | Custom LanguageProvider (pl/en), localStorage key `smartquote-lang` |
| E2E tests | Playwright (chromium, mobile-chrome, mobile-safari) |

## Integration: KSeF Master

SmartQuote talks to **KSeF Master** — a separate service we do not own — over REST API.
KSeF Master is located at `C:\Users\Tomek\Desktop\Projekty\KSeF-Master`.

Communication flow:
1. SmartQuote backend → `POST /api/v1/import/smartquote` — submit invoice data
2. KSeF Master → SmartQuote webhook — delivery status callback (approved / rejected)
3. SmartQuote backend → `GET /api/v1/import/companies/exists?nip=...` — availability check
4. SmartQuote backend → `GET /api/v1/import/drafts/by-smartquote/{id}` — idempotent draft lookup

Key files:
- `smartquote-backend/src/services/ksef-bridge.service.ts`
- `smartquote-backend/src/controllers/ksef-bridge.controller.ts`
- `smartquote-backend/src/routes/ksef-bridge.routes.ts`
- `smartquote-backend/src/validators/ksef-bridge.validator.ts`
- `smartquote-frontend/src/lib/api/ksef.api.ts`

## Key Technical Decisions

### Security

- **HMAC-SHA256 webhook verification** — incoming KSeF callbacks are authenticated with
  `X-API-Key`, `X-Timestamp`, `X-Signature` headers. Timestamp window: ±5 minutes
  (replay-attack prevention). Constant-time comparison via `crypto.timingSafeEqual()`.
  → `ksef-bridge.service.ts:verifyWebhookHmac()`

- **JWT secret minimum length** — enforced at startup by Zod config schema (32 chars).
  Server refuses to start if the constraint is violated.

- **Offer acceptance audit trail** — SHA-256 content hash stored in `OfferAcceptanceLog`
  alongside `acceptedData` JSON, IP, and user-agent. Rendered as a certificate PDF.

- **Sensitive data encryption** — SMTP passwords in `UserSettings` encrypted/decrypted via
  `src/utils/crypto.ts` (`encrypt`/`decrypt`). Key: `ENCRYPTION_KEY` (32 chars).

- **Rate limiting** — global 500 req/15 min, auth endpoints 20 req/15 min (express-rate-limit).

- **CORS** — strict allow-list from `FRONTEND_URL` / `CLIENT_URL` env vars.

### Caching

- **Auth cache** — 5-minute in-memory user cache avoids repeated DB lookups per request.
  → `src/lib/auth-cache.ts`

- **AI result cache** — `MemoryCache` (max 200 entries, TTL-based eviction):
  price insight 15 min, observer/closing strategy 5 min, client analysis 10 min.
  → `src/lib/cache.ts`

- **KSeF availability cache** — bounded Map (max 2 000 entries), TTL configurable via
  `KSEF_AVAILABILITY_CACHE_TTL_MS` (default 5 min), eviction on size > 1 000.
  → `ksef-bridge.service.ts`

### Resilience

- **Idempotent KSeF send** — before submitting an invoice, the service calls
  `lookupExistingDraftId()` to check if a draft already exists, preventing duplicate sends.

- **NIP format validation** — regex `/^\d{10}$/` before any KSeF API call.

- **DomainError hierarchy** — `NotFoundError`, `ValidationError`, `ConflictError`,
  `UnauthorizedError`, `ExternalServiceError` all extend `DomainError`.
  Centralized error handler maps them to HTTP status codes.
  → `src/errors/domain.errors.ts`, `src/middleware/errorHandler.ts`

### Email

- Per-user SMTP config stored in `UserSettings` (passwords encrypted).
- Falls back to global `MAILERSEND_*` / `SMTP_*` env vars if user has no personal config.

### Cron

- Follow-up reminders triggered via `POST /cron/reminders` authenticated by
  `CRON_SECRET` header — suitable for Render Cron Jobs or similar schedulers.

## Key Files

### Backend

| File | Role |
|------|------|
| `src/index.ts` | Entry point, graceful shutdown |
| `src/app.ts` | Express setup: helmet, CORS, rate-limit, routes |
| `src/config/index.ts` | Zod-validated config, all env vars in one place |
| `src/middleware/auth.ts` | JWT verification + 5-min user cache |
| `src/middleware/errorHandler.ts` | Centralized error → HTTP response mapping |
| `src/services/ksef-bridge.service.ts` | KSeF REST calls, HMAC, availability cache |
| `src/services/ai/index.ts` | Gemini facade (chat, offers, insights) |
| `src/services/pdf/offer-pdf-renderer.ts` | PDFKit offer PDF entry point |
| `src/services/email/index.ts` | Email orchestrator (SMTP / MailerSend) |
| `src/lib/auth-cache.ts` | 5-min auth cache |
| `src/lib/cache.ts` | Generic TTL MemoryCache |
| `src/lib/di-container.ts` | Dependency injection container |
| `src/utils/crypto.ts` | `encrypt`/`decrypt` for sensitive fields |
| `src/errors/domain.errors.ts` | DomainError subclass hierarchy |
| `prisma/schema.prisma` | 22 models, 20 migrations |

### Frontend

| File | Role |
|------|------|
| `src/app/layout.tsx` | Root layout, providers stack, PWA registration |
| `src/app/providers.tsx` | Session, Theme, Language, Toast, AIChat providers |
| `src/lib/auth.ts` | NextAuth config (CredentialsProvider → backend login) |
| `src/lib/api/client.ts` | HTTP client (JWT bearer) |
| `src/lib/api/ksef.api.ts` | KSeF bridge API calls from frontend |
| `next.config.ts` | Security headers (CSP, HSTS, X-Frame-Options) |
| `playwright.config.ts` | E2E config (pl-PL locale, 3 browser projects) |

## Environment Variables

### Backend (`.env.example`)

```
# Core
DATABASE_URL=postgresql://...
JWT_SECRET=...                        # min 32 chars
ENCRYPTION_KEY=...                    # optional, 32 chars — for SMTP password encryption
NODE_ENV=development
PORT=5000

# Frontend origin (CORS)
FRONTEND_URL=http://localhost:3000

# AI
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash

# Email (global fallback)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
# -- OR --
MAILERSEND_API_KEY=
MAILERSEND_FROM_EMAIL=

# KSeF Master integration
KSEF_MASTER_URL=http://localhost:5000
KSEF_MASTER_API_KEY=...
KSEF_AVAILABILITY_CACHE_TTL_MS=300000 # default 5 min

# Cron
CRON_SECRET=...
```

### Frontend (`.env.local`)

```
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...   # min 32 chars — generate: openssl rand -base64 32
```

## Project Status (detected from code)

- Core CRM: clients, offers, contracts — complete
- Offer lifecycle (DRAFT → SENT → VIEWED → NEGOTIATION → ACCEPTED → REJECTED → EXPIRED) — complete
- Contract lifecycle (DRAFT → PENDING_SIGNATURE → ACTIVE → COMPLETED → TERMINATED → EXPIRED) — complete
- Public offer pages (token-based, variant selection, interaction tracking) — complete
- Public contract pages (token-based, signature canvas) — complete
- AI features (chat, offer gen, price insight, observer, closing strategy, post-mortem) — complete
- PDF rendering (offers, contracts, acceptance certificate) — complete
- Email delivery (SMTP + MailerSend, templates, attachments) — complete
- Follow-up / reminder system with cron — complete
- In-app notification center — complete
- KSeF Master integration (send, availability, webhook + HMAC) — complete
- i18n EN/PL (next-intl) — in progress (merged PR #5, ongoing)
- E2E tests (Playwright) — scaffolded, coverage unknown

## Pending

<!-- Fill in manually -->

## Git & Commit Rules

- Agent does **not** commit, push, create PRs, or merge without an explicit instruction.
- After finishing work the agent always asks: "Commit and push?"
- Commit messages: short, plain English, describe what and why.
  Example: `fix replay attack window in ksef webhook verification`
- No `Co-Authored-By`, no AI mentions, no emoji in commits or branch names.
- Branch names: short, lowercase, English, hyphens.
  Example: `fix-ksef-hmac`, `add-offer-pdf-watermark`

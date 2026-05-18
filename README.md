<div align="center">

# SmartQuote

**AI-powered sales CRM platform — client management, intelligent offer generation, contract workflow,
and automated follow-ups powered by Google Gemini.**

[![Frontend CI](https://github.com/Shellty-IT/SmartQuote/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/Shellty-IT/SmartQuote/actions/workflows/frontend-ci.yml)
[![Backend CI](https://github.com/Shellty-IT/SmartQuote/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/Shellty-IT/SmartQuote/actions/workflows/backend-ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node-%3E%3D18.0-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-Proprietary-red)](#-license)

**[🚀 Live Demo](https://smartquote-ai.netlify.app)** &nbsp;·&nbsp; [🇵🇱 Polska wersja](./README-PL.md)

</div>

---

## 📑 Table of Contents

- [About the Project](#-about-the-project)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)
- [Authors & Contact](#-authors--contact)

---

## 🎯 About the Project

SmartQuote is a full-stack sales CRM that automates the repetitive parts of B2B selling. It combines client
relationship management with AI-assisted offer generation, contract workflows, PDF document rendering and
post-mortem analytics — so sales teams spend less time on paperwork and more on closing deals.

The repository is a **monorepo** containing two independent applications:

- **`smartquote-frontend/`** — Next.js 16 web application (dashboard, public offer/contract pages)
- **`smartquote-backend/`** — Express.js REST API with PostgreSQL, Prisma ORM and Google Gemini integration

Both projects keep separate dependency trees, separate CI pipelines and separate deployments
(Netlify for the frontend, Render for the backend).

---

## ✨ Features

### Core CRM
- 👥 **Client management** — companies and individuals with full contact history
- 📄 **Offer lifecycle** — seven statuses: `DRAFT → SENT → VIEWED → ACCEPTED / REJECTED`
- ✍️ **Contract workflow** — `DRAFT → PENDING_SIGNATURE → ACTIVE → COMPLETED`
- 📅 **Follow-up reminders** — cron-driven automated email reminders for overdue tasks
- 📊 **Dashboard analytics** — real-time KPIs, conversion rates and pipeline metrics
- 🔔 **Notifications** — in-app notification center per user

### AI Features (Google Gemini 2.5 Flash)
- 🤖 **Chat assistant** — natural-language interface to CRM operations
- ✏️ **Offer generator** — structured offers from free-text descriptions
- 💰 **Price insight** — market-based pricing recommendations
- 👁️ **Observer mode** — real-time offer performance analysis
- 🎯 **Closing strategy** — AI suggestions for deal finalization
- 🔁 **Feedback loop** — post-mortem analysis of won/lost deals

### Documents & Communication
- 🖨️ **PDF engine** — custom renderer with DejaVu Sans font (full UTF-8 / Polish character support)
- 🎨 **Dynamic branding** — per-user logo and primary color embedded in PDFs
- 🧾 **VAT calculations** — automatic per-line tax computation
- 🔏 **Acceptance certificates** — SHA-256 signed audit trail embedded in offer PDFs
- 📨 **Email composer** — HTML emails with PDF attachments (Nodemailer / MailerSend)
- 🧰 **Offer templates** — reusable offer scaffolding

### Public-facing & Integrations
- 🔗 **Public offer pages** — shareable token-based links with variant selection
- ✒️ **Electronic signatures** — canvas-based signing with cryptographic verification
- 🧮 **KSeF bridge** — webhook to external Polish e-invoicing system

---

## 🛠 Tech Stack

### Frontend (`smartquote-frontend/`)

| Layer            | Technology                                          |
|------------------|-----------------------------------------------------|
| Framework        | Next.js 16.1 (App Router, Server Components)        |
| UI               | React 19.2, Tailwind CSS 4                          |
| Auth             | NextAuth.js 4.24 (JWT sessions)                     |
| Rich text editor | TipTap 3 (StarterKit, Link, Placeholder, Underline) |
| Animations       | Framer Motion 12                                    |
| Markdown         | react-markdown                                      |
| Language         | TypeScript 5                                        |
| Linting          | ESLint 9 + eslint-config-next                       |
| E2E testing      | Playwright 1.58                                     |
| Deployment       | Netlify (`@netlify/plugin-nextjs`)                  |

### Backend (`smartquote-backend/`)

| Layer            | Technology                                           |
|------------------|------------------------------------------------------|
| Runtime          | Node.js ≥18                                          |
| Language         | TypeScript 5.5                                       |
| Framework        | Express.js 4.21                                      |
| Database         | PostgreSQL                                           |
| ORM              | Prisma 5.22 (22 models, 20 migrations)               |
| AI               | Google Gemini 2.5 Flash (`@google/genai`)            |
| Auth             | JWT (`jsonwebtoken`) + bcryptjs, 5-minute auth cache |
| Validation       | Zod 3.23                                             |
| Logging          | Pino 8 + pino-pretty                                 |
| Security         | Helmet, CORS allow-list, `express-rate-limit`        |
| PDF              | PDFKit + DejaVu Sans (UTF-8)                         |
| Email            | Nodemailer 6 (SMTP / MailerSend)                     |
| Testing          | Jest 29 + ts-jest                                    |
| Deployment       | Render                                               |

### DevOps

- **CI/CD**: GitHub Actions (separate workflows for frontend and backend, path-filtered)
- **Monorepo layout**: filesystem-based, no workspace manager — each subproject has its own `package.json`

---

## 📋 Prerequisites

- **Node.js** ≥ 18.0 (20.x recommended)
- **npm** ≥ 9.0 (ships with Node 18+)
- **PostgreSQL** ≥ 14 (for the backend; you can use a managed instance such as Render, Supabase or Neon)
- **Git** ≥ 2.30
- **Google Gemini API key** — obtain one at [Google AI Studio](https://aistudio.google.com/app/apikey)

Optional:
- **SMTP credentials** or **MailerSend API key** if you want to send real emails

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Shellty-IT/SmartQuote.git
cd SmartQuote
```

### 2. Backend setup

```bash
cd smartquote-backend
npm install

# Configure environment
cp .env.example .env
# Edit .env — fill in DATABASE_URL, JWT_SECRET (min. 32 chars), GEMINI_API_KEY

# Database setup
npx prisma generate
npx prisma migrate dev
npm run seed              # optional: load sample data

# Start dev server
npm run dev
# → http://localhost:8080
```

### 3. Frontend setup

In a new terminal:

```bash
cd smartquote-frontend
npm install

# Configure environment — create .env.local in smartquote-frontend/
# (see the Environment Variables section below for the full list)

# Start dev server
npm run dev
# → http://localhost:3000
```

### 4. Verify

- Frontend: open `http://localhost:3000`
- Backend health: `curl http://localhost:8080/api/health` should return `{"status":"ok",...}`

---

## ⚙️ Environment Variables

### Backend (`smartquote-backend/.env`)

| Variable                | Required | Description                                                | Example                                            |
|-------------------------|----------|------------------------------------------------------------|----------------------------------------------------|
| `DATABASE_URL`          | ✅       | PostgreSQL connection string                               | `postgresql://user:pass@localhost:5432/smartquote` |
| `JWT_SECRET`            | ✅       | JWT signing secret, **min. 32 characters**                 | `super-secret-jwt-key-minimum-32-chars-long`       |
| `GEMINI_API_KEY`        | ✅       | Google Gemini API key                                      | `AIzaSy...`                                        |
| `GEMINI_MODEL`          | ❌       | Gemini model identifier                                    | `gemini-2.5-flash` (default)                       |
| `PORT`                  | ❌       | HTTP port                                                  | `8080` (default)                                   |
| `NODE_ENV`              | ❌       | Runtime environment                                        | `development` / `production` / `test`              |
| `FRONTEND_URL`          | ✅       | Allowed CORS origin (frontend URL)                         | `http://localhost:3000`                            |
| `CLIENT_URL`            | ✅       | Additional allowed CORS origin                             | `http://localhost:3000`                            |
| `ENCRYPTION_KEY`        | ❌       | 32-character key for encrypting stored API keys            | `32-char-encryption-key-here`                      |
| `SMTP_HOST`             | ❌       | SMTP server hostname                                       | `smtp.gmail.com`                                   |
| `SMTP_PORT`             | ❌       | SMTP server port                                           | `587`                                              |
| `SMTP_USER`             | ❌       | SMTP username                                              | `you@gmail.com`                                    |
| `SMTP_PASS`             | ❌       | SMTP password / app password                               | `app-password`                                     |
| `SMTP_FROM`             | ❌       | Default `From:` header                                     | `SmartQuote AI <noreply@smartquote.ai>`            |
| `MAILERSEND_API_KEY`    | ❌       | MailerSend API key (alternative to SMTP)                   | `mlsn....`                                         |
| `MAILERSEND_FROM_EMAIL` | ❌       | MailerSend sender email                                    | `noreply@trial-xxx.mailersend.net`                 |
| `MAILERSEND_FROM_NAME`  | ❌       | MailerSend sender name                                     | `SmartQuote AI`                                    |
| `KSEF_MASTER_URL`       | ❌       | External KSeF / e-invoicing API URL                        | `http://localhost:5000`                            |
| `KSEF_MASTER_API_KEY`   | ❌       | API key for KSeF bridge                                    | `sk_smartquote_ksef_bridge_secret`                 |
| `CRON_SECRET`           | ❌       | Bearer token used to authenticate `/cron/reminders` calls  | `random-cron-secret`                               |

A full template is available in [`smartquote-backend/.env.example`](./smartquote-backend/.env.example).

### Frontend (`smartquote-frontend/.env.local`)

| Variable                  | Required | Description                                            | Example                   |
|---------------------------|----------|--------------------------------------------------------|---------------------------|
| `NEXT_PUBLIC_BACKEND_URL` | ✅       | Base URL of the backend API                            | `http://localhost:8080`   |
| `NEXTAUTH_URL`            | ✅       | Public URL of the frontend (used by NextAuth.js)       | `http://localhost:3000`   |
| `NEXTAUTH_SECRET`         | ✅       | NextAuth.js JWT signing secret, **min. 32 characters** | `openssl rand -base64 32` |

---

## 📁 Project Structure

```
SmartQuote/
├── .github/
│   └── workflows/
│       ├── frontend-ci.yml          ← Frontend CI (lint, typecheck, build, Playwright E2E)
│       └── backend-ci.yml           ← Backend CI (typecheck, Jest, npm audit, smoke test)
│
├── smartquote-frontend/             ← Next.js 16 application
│   ├── src/
│   │   ├── app/                     ← App Router pages (dashboard, public pages, API routes)
│   │   ├── components/              ← Shared UI components
│   │   ├── contexts/                ← React Context providers (AI chat, toast)
│   │   ├── hooks/                   ← Reusable custom hooks
│   │   ├── lib/                     ← API client, utilities
│   │   └── types/                   ← Shared TypeScript types
│   ├── tests/e2e/                   ← Playwright E2E tests
│   ├── docs/                        ← Frontend-specific docs
│   ├── public/                      ← Static assets, PWA manifest, service worker
│   ├── netlify.toml                 ← Netlify build config
│   ├── next.config.ts               ← Next.js configuration
│   ├── playwright.config.ts         ← Playwright configuration
│   └── package.json
│
├── smartquote-backend/              ← Express.js REST API
│   ├── src/
│   │   ├── controllers/             ← HTTP handlers — 14 controllers
│   │   ├── services/
│   │   │   ├── ai/                  ← Modular AI services
│   │   │   ├── pdf/                 ← PDF rendering engine
│   │   │   ├── email/               ← Email senders, templates, attachments
│   │   │   ├── public-offer/        ← Public offer calculations & notifiers
│   │   │   └── shared/              ← Shared calculations
│   │   ├── repositories/            ← Prisma queries — 7 repositories
│   │   ├── routes/                  ← Express routes — 14 route files
│   │   ├── middleware/              ← Auth, validation, error handler
│   │   ├── validators/              ← Zod schemas — 11 validators
│   │   ├── lib/                     ← Prisma client, Pino logger, auth cache
│   │   ├── types/                   ← Shared types
│   │   ├── utils/                   ← Helpers (calculations, crypto, response shape)
│   │   ├── errors/                  ← Custom error classes
│   │   ├── config/                  ← Zod-validated env config
│   │   ├── __tests__/               ← Jest unit tests
│   │   └── index.ts                 ← Entry point
│   ├── prisma/
│   │   ├── schema.prisma            ← 22 models
│   │   └── migrations/              ← 20 migrations
│   ├── fonts/                       ← DejaVu Sans TTF
│   ├── scripts/seed.ts              ← Sample data seeder
│   └── package.json
│
├── README.md                        ← English documentation (this file)
├── README-PL.md                     ← Polish documentation
└── .gitignore
```

---

## 🔌 API Documentation

**Base URL:** `<backend-host>/api`
**Authentication:** Bearer JWT — `Authorization: Bearer <token>` (obtained from `POST /api/auth/login`)

### Key endpoints

| Method | Endpoint                       | Description                                            | Auth |
|--------|--------------------------------|--------------------------------------------------------|:----:|
| GET    | `/health`                      | Health check + database status                         |  ❌  |
| POST   | `/auth/login`                  | Login, returns JWT                                     |  ❌  |
| POST   | `/auth/register`               | Create a new user account                              |  ❌  |
| GET    | `/clients`                     | List clients                                           |  ✅  |
| POST   | `/clients`                     | Create a client                                        |  ✅  |
| PUT    | `/clients/:id`                 | Update a client                                        |  ✅  |
| DELETE | `/clients/:id`                 | Delete a client                                        |  ✅  |
| GET    | `/offers`                      | List offers                                            |  ✅  |
| POST   | `/offers`                      | Create an offer                                        |  ✅  |
| GET    | `/offers/:id/pdf`              | Render offer PDF                                       |  ✅  |
| GET    | `/offers/:id/analytics`        | Views, interactions, comments                          |  ✅  |
| GET    | `/contracts`                   | List contracts                                         |  ✅  |
| GET    | `/contracts/:id/pdf`           | Render contract PDF (with signature block)             |  ✅  |
| GET    | `/followups`                   | List follow-ups                                        |  ✅  |
| POST   | `/ai/chat`                     | Chat with AI assistant                                 |  ✅  |
| POST   | `/ai/generate-offer`           | Generate an offer from a description                   |  ✅  |
| POST   | `/ai/price-insight`            | Pricing recommendation                                 |  ✅  |
| GET    | `/ai/insights`                 | List post-mortem analyses                              |  ✅  |
| GET    | `/emails`                      | Email logs                                             |  ✅  |
| POST   | `/emails`                      | Compose and send email                                 |  ✅  |
| GET    | `/offer-templates`             | List reusable offer templates                          |  ✅  |
| POST   | `/ksef`                        | Trigger external e-invoice                             |  ✅  |
| GET    | `/settings`                    | User settings, company info, API keys                  |  ✅  |
| GET    | `/notifications`               | In-app notifications                                   |  ✅  |
| GET    | `/public/offers/:token`        | Public offer view (token-based, no auth)               |  ❌  |
| POST   | `/public/offers/:token`        | Accept/sign public offer                               |  ❌  |
| GET    | `/public/contracts/:token`     | Public contract view (token-based, no auth)            |  ❌  |
| POST   | `/public/contracts/:token`     | Sign public contract                                   |  ❌  |
| POST   | `/cron/reminders`              | Trigger follow-up reminder cron (requires CRON_SECRET) |  🔑  |

### Response envelope

```json
{
  "success": true,
  "data": {},
  "meta": { "page": 1, "limit": 10, "total": 50 }
}
```

### Security middleware

- **CORS** — allow-list based on `FRONTEND_URL` / `CLIENT_URL`
- **Helmet** — secure HTTP headers
- **Rate limiting** — 500 requests / 15 min globally, 20 requests / 15 min for `/auth/*`
- **Zod validation** — every request body, query and param schema-checked
- **Auth cache** — 5-minute TTL in-memory cache, reduces DB load by ~80% on authenticated requests

---

## 🧪 Testing

### Backend — Jest unit tests

```bash
cd smartquote-backend
npm test                    # run all unit tests
npm run test:watch          # watch mode
npm run test:coverage       # generate coverage report (HTML in coverage/)
```

Test files live in `smartquote-backend/src/__tests__/`.

### Frontend — Playwright E2E

```bash
cd smartquote-frontend
npm run test:e2e            # headless run
npm run test:e2e:ui         # Playwright UI mode
npm run test:e2e:headed     # run with visible browser
```

Test files live in `smartquote-frontend/tests/e2e/`.
E2E tests in CI run against the deployed production frontend
(`PLAYWRIGHT_BASE_URL`) after each push to `main`.

### TypeScript & linting

```bash
# Backend
cd smartquote-backend && npm run typecheck

# Frontend
cd smartquote-frontend && npx tsc --noEmit
cd smartquote-frontend && npm run lint
```

### CI pipelines

| Workflow                            | Triggers on changes in   | Jobs                                                                                         |
|-------------------------------------|--------------------------|----------------------------------------------------------------------------------------------|
| `.github/workflows/frontend-ci.yml` | `smartquote-frontend/**` | Lint + TypeScript → Build → E2E (push to `main` only)                                        |
| `.github/workflows/backend-ci.yml`  | `smartquote-backend/**`  | TypeScript → Jest + coverage → `npm audit` (non-blocking) → smoke test (push to `main` only) |

---

## 🚢 Deployment

The monorepo deploys both projects independently — there is no Docker setup.

### Frontend — Netlify

- Build configuration lives in [`smartquote-frontend/netlify.toml`](./smartquote-frontend/netlify.toml)
- Uses `@netlify/plugin-nextjs` for Next.js App Router support
- Set environment variables in **Netlify → Site configuration → Environment variables**
- Recommended: connect Netlify to the GitHub repo, set the base directory to `smartquote-frontend/`

### Backend — Render

- Render auto-detects the Node.js project; set the root directory to `smartquote-backend/`
- Build command: `npm install && npx prisma generate && npm run build`
- Start command: `npm start`
- Provision a PostgreSQL add-on and inject `DATABASE_URL` automatically
- Run migrations on first deploy with the Render shell: `npx prisma migrate deploy`

### Required GitHub Secrets for CI

For full CI (including E2E and smoke tests), configure these repository secrets at
**Settings → Secrets and variables → Actions**:

- **Backend:** `DATABASE_URL`, `JWT_SECRET`, `GEMINI_API_KEY`, `BACKEND_HEALTH_URL`
- **Frontend:** `NEXT_PUBLIC_BACKEND_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`,
  `PLAYWRIGHT_BASE_URL`, `TEST_EMAIL`, `TEST_PASSWORD`

---

## 🤝 Contributing

### Branching model

- `main` — production, protected
- Feature branches: `feat/<short-description>`
- Bug fixes: `fix/<short-description>`
- Refactors: `refactor/<scope>`
- Documentation: `docs/<scope>`
- Maintenance: `chore/<scope>`

### Pull-request workflow

1. Branch off `main`
2. Make changes inside **a single subproject** when possible — CI is path-filtered
3. Run `npm run lint`, `npm test` (backend) and `npm run test:e2e` (frontend) locally before pushing
4. Open a PR targeting `main`, fill in the description and reference any related issue
5. Wait for CI to pass on the relevant workflow
6. Request a review; squash-merge after approval

### Code style

- **TypeScript strict mode** is enabled in both projects — do not weaken `tsconfig.json`
- **Backend** — controllers stay thin (`try/catch + next(err)`), business logic in services,
  data access only in repositories
- **Frontend** — prefer Server Components; promote to Client Components only when interactivity is needed
- Run the linter before committing — CI will fail on lint errors
- Validate every incoming request with Zod (backend) — no untrusted input reaches services

### Commit messages

Use Conventional Commits style — examples: `feat(offers): add public token preview`,
`fix(ai): handle empty Gemini response`, `chore(ci): bump Node to 20.x`.

---

## 📄 License

**Proprietary** — All rights reserved by Shellty-IT.
The codebase is private and not licensed for redistribution. Commercial use is reserved for the project owner.

---

## 👥 Authors & Contact

- **Maintainer / Owner:** [Shellty-IT](https://github.com/Shellty-IT)
- **Repository:** [github.com/Shellty-IT/SmartQuote](https://github.com/Shellty-IT/SmartQuote)
- **Issues:** [github.com/Shellty-IT/SmartQuote/issues](https://github.com/Shellty-IT/SmartQuote/issues)

For commercial inquiries, please open a GitHub issue or contact the maintainer directly.

---

<div align="center">

Built with **TypeScript** · **Next.js** · **Express.js** · **PostgreSQL** · **Google Gemini AI**

</div>

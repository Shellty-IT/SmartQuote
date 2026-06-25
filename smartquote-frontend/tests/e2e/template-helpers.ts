// tests/e2e/template-helpers.ts
// Shared utilities for offer-template E2E tests.
//
// Strategy:
//   1. Login via Playwright (sets session cookie on the test page)
//   2. GET /api/auth/session to extract the backend JWT (accessToken)
//   3. Seed offer via backend REST API using the JWT — bypasses UI wizard
//   4. For each template: assert preview HTML + PDF bytes + in-page render

import type { Page, APIRequestContext, ConsoleMessage, Browser } from '@playwright/test'
import { expect } from '@playwright/test'
import { login } from './helpers'

// ─── Auth ─────────────────────────────────────────────────────────────────────

/**
 * Returns the backend JWT stored in the NextAuth session.
 * Requires the page to already be logged in (call login() first).
 */
export async function getAccessToken(page: Page): Promise<string> {
    const res = await page.request.get('/api/auth/session')
    expect(res.ok(), `GET /api/auth/session returned ${res.status()}`).toBeTruthy()
    const body = await res.json()
    const token = body?.accessToken as string | undefined
    if (!token) {
        throw new Error(`accessToken missing in NextAuth session: ${JSON.stringify(body).slice(0, 200)}`)
    }
    return token
}

// ─── Backend helpers ───────────────────────────────────────────────────────────

function authHeaders(token: string): Record<string, string> {
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

function backendBaseUrl(): string {
    return (process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8080').replace(/\/$/, '')
}

/**
 * Returns the first available clientId for the authenticated user.
 * Creates a minimal test client if the account has none yet.
 */
export async function ensureClientId(
    token: string,
    request: APIRequestContext,
): Promise<string> {
    const baseUrl = backendBaseUrl()
    const res = await request.get(`${baseUrl}/api/clients?limit=1`, {
        headers: authHeaders(token),
    })
    expect(res.ok(), `GET /api/clients returned ${res.status()}`).toBeTruthy()
    const body = await res.json()
    const clients: Array<{ id: string }> = body?.data?.items ?? body?.data ?? []
    if (clients.length > 0) return clients[0].id

    // Create a minimal client for tests
    const createRes = await request.post(`${baseUrl}/api/clients`, {
        headers: authHeaders(token),
        data: {
            name: 'E2E Test Client',
            type: 'COMPANY',
            company: 'E2E Sp. z o.o.',
        },
    })
    expect(createRes.ok(), `POST /api/clients returned ${createRes.status()}`).toBeTruthy()
    const created = await createRes.json()
    return created.data.id as string
}

export interface SeedOfferOptions {
    templateType: string
    blocks?: unknown
    title?: string
    clientId: string
}

/**
 * Creates an offer via the backend REST API and returns its id.
 * Uses a minimal item list (required by the schema validator).
 */
export async function seedOffer(
    token: string,
    request: APIRequestContext,
    opts: SeedOfferOptions,
): Promise<string> {
    const { templateType, blocks, clientId } = opts
    const title = opts.title ?? `E2E-${templateType}-${Date.now()}`
    const baseUrl = backendBaseUrl()

    const res = await request.post(`${baseUrl}/api/offers`, {
        headers: authHeaders(token),
        data: {
            clientId,
            title,
            templateType,
            blocks: blocks ?? null,
            items: [
                {
                    name: 'Usługa testowa E2E',
                    quantity: 1,
                    unitPrice: 5000,
                    vatRate: 23,
                    unit: 'szt.',
                },
            ],
            paymentDays: 14,
        },
    })

    if (!res.ok()) {
        const text = await res.text()
        throw new Error(`seedOffer(${templateType}) [${res.status()}]: ${text.slice(0, 400)}`)
    }
    const body = await res.json()
    const id = body?.data?.id as string | undefined
    if (!id) throw new Error(`seedOffer: no id in response: ${JSON.stringify(body).slice(0, 200)}`)
    return id
}

/**
 * Deletes a previously seeded offer. Call in afterAll cleanup.
 */
export async function deleteOffer(
    token: string,
    request: APIRequestContext,
    offerId: string,
): Promise<void> {
    const baseUrl = backendBaseUrl()
    await request.delete(`${baseUrl}/api/offers/${offerId}`, {
        headers: authHeaders(token),
    })
}

// ─── Login + seed convenience ─────────────────────────────────────────────────

/**
 * Logs in on a temporary page, extracts the JWT, seeds an offer,
 * and closes the page.  Returns { token, offerId }.
 *
 * Usage in test.beforeAll:
 *   const { token, offerId } = await loginAndSeed(browser, opts)
 */
export async function loginAndSeed(
    browser: Browser,
    opts: SeedOfferOptions,
): Promise<{ token: string; offerId: string }> {
    const page = await browser.newPage()
    try {
        await login(page)
        const token = await getAccessToken(page)
        const clientId = opts.clientId
            ? opts.clientId
            : await ensureClientId(token, page.request)
        const offerId = await seedOffer(token, page.request, { ...opts, clientId })
        return { token, offerId }
    } finally {
        await page.close()
    }
}

// ─── PDF assertions ────────────────────────────────────────────────────────────

/**
 * Fetches the PDF endpoint via the page's session-authenticated request context
 * and asserts:
 *   - HTTP 200 with content-type application/pdf
 *   - Starts with %PDF- (valid PDF header)
 *   - Ends with %%EOF (file not truncated)
 *   - Exceeds the minimum byte size threshold
 */
export async function assertValidPdf(
    page: Page,
    pdfPath: string,
    opts: { minBytes?: number } = {},
): Promise<void> {
    const minBytes = opts.minBytes ?? 20_000

    const res = await page.request.get(pdfPath)
    if (res.status() !== 200) {
        const body = await res.text()
        throw new Error(`PDF ${pdfPath} returned [${res.status()}]: ${body.slice(0, 400)}`)
    }

    const ct = res.headers()['content-type'] ?? ''
    expect(ct, `content-type for ${pdfPath}`).toContain('application/pdf')

    const buf = await res.body()
    expect(buf.byteLength, `PDF too small (${buf.byteLength} B) at ${pdfPath}`).toBeGreaterThan(minBytes)

    const header = buf.slice(0, 8).toString('ascii')
    expect(header, `PDF header missing at ${pdfPath}`).toContain('%PDF-')

    const tail = buf.slice(Math.max(0, buf.byteLength - 1024)).toString('ascii')
    expect(tail, `PDF missing %%EOF at ${pdfPath}`).toContain('%%EOF')
}

// ─── HTML preview assertions ───────────────────────────────────────────────────

// 'undefined' and 'NaN' are intentionally absent — both appear in base64
// font data (EMBEDDED_FONTS_CSS ~630 KB) embedded in offer preview HTML.
// '[object Object]' is safe because '[' is not in the base64 alphabet.
const DEFAULT_FORBIDDEN_PATTERNS = [
    '[object Object]',
    'HTML build failed',
    'PDF generation failed',
    'Template mismatch',
]

/**
 * Fetches the preview HTML endpoint and asserts:
 *   - HTTP 200, content-type text/html
 *   - HTML is at least 500 chars with a proper <html> tag
 *   - Required sentinels (section markers) are present
 *   - Forbidden garbage patterns are absent
 *
 * Returns the HTML string for further assertions if needed.
 */
export async function assertPreviewHtml(
    page: Page,
    previewPath: string,
    opts: {
        requiredSentinels?: string[]
        forbiddenPatterns?: string[]
    } = {},
): Promise<string> {
    const res = await page.request.get(previewPath)
    if (res.status() !== 200) {
        const body = await res.text()
        throw new Error(`Preview ${previewPath} returned [${res.status()}]: ${body.slice(0, 400)}`)
    }

    const ct = res.headers()['content-type'] ?? ''
    expect(ct, `content-type for ${previewPath}`).toContain('text/html')

    const html = await res.text()
    expect(html.length, `HTML too short at ${previewPath}`).toBeGreaterThan(500)
    expect(html.toLowerCase(), `No <html> tag at ${previewPath}`).toContain('<html')

    const forbidden = opts.forbiddenPatterns ?? DEFAULT_FORBIDDEN_PATTERNS
    for (const pat of forbidden) {
        expect(html, `Forbidden pattern "${pat}" in ${previewPath}`).not.toContain(pat)
    }

    for (const sentinel of opts.requiredSentinels ?? []) {
        expect(html, `Required sentinel "${sentinel}" missing in ${previewPath}`).toContain(sentinel)
    }

    return html
}

// ─── Browser render check ──────────────────────────────────────────────────────

/**
 * Navigates the Playwright page to the preview URL and asserts:
 *   - HTTP < 500 response
 *   - Non-empty body text
 *   - No significant JavaScript console errors
 *
 * Fonts are embedded as base64, so failed network requests for fonts
 * are not expected and would be flagged.
 */
export async function assertPreviewRenders(
    page: Page,
    previewPath: string,
    opts: { allowedConsoleErrors?: number } = {},
): Promise<void> {
    const consoleErrors: string[] = []

    const onConsole = (msg: ConsoleMessage) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text())
    }
    page.on('console', onConsole)

    try {
        const response = await page.goto(previewPath, { waitUntil: 'networkidle', timeout: 30_000 })
        expect(response?.status() ?? 0, `goto ${previewPath} failed`).toBeLessThan(500)

        const bodyText = await page.evaluate(() => document.body?.innerText ?? '')
        expect(bodyText.length, `Page body is empty at ${previewPath}`).toBeGreaterThan(50)

        const allowedErrors = opts.allowedConsoleErrors ?? 0
        const significant = consoleErrors.filter(
            (e) => !e.includes('favicon') && !e.includes('404'),
        )
        expect(
            significant.length,
            `Console errors at ${previewPath}: ${significant.slice(0, 3).join(' | ')}`,
        ).toBeLessThanOrEqual(allowedErrors)
    } finally {
        page.off('console', onConsole)
    }
}

// Re-export login for convenience in test files
export { login }

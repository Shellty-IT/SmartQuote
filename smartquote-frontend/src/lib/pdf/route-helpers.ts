// src/lib/pdf/route-helpers.ts
// Shared plumbing for the offer/contract PDF and HTML-preview API routes:
// backend URL resolution, session auth, and the build/render/respond error
// handling that used to be copy-pasted (with drifting error shapes) across
// every route in src/app/api/{offers,contracts,public}.
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { htmlToPdfBuffer } from './puppeteer'

export function getBackendUrl(): string {
    return (process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8080').replace(/\/$/, '')
}

interface SessionWithToken {
    accessToken?: string
}

function jsonError(message: string, status: number): Response {
    return new Response(JSON.stringify({ error: message }), {
        status,
        headers: { 'Content-Type': 'application/json' },
    })
}

/** Resolves the signed-in user's backend bearer token, or a 401 Response if absent. */
export async function requireAccessToken(): Promise<string | Response> {
    const session = (await getServerSession(authOptions)) as SessionWithToken | null
    if (!session?.accessToken) return jsonError('Unauthorized', 401)
    return session.accessToken
}

/** Fetches a `{ data }`-wrapped backend resource, or a standardized error Response on failure. */
export async function fetchJsonOrRespond<T>(
    url: string,
    init: RequestInit,
    notFoundMessage: string,
): Promise<T | Response> {
    const res = await fetch(url, init)
    if (!res.ok) return jsonError(notFoundMessage, res.status === 404 ? 404 : 502)
    const { data } = (await res.json()) as { data: T }
    return data
}

/**
 * Runs an HTML builder, returning the markup or a standardized 500 Response.
 * The full error (with stack) is always logged server-side; only surfaced to
 * the client outside production so anonymous callers on public routes can
 * never read internal file paths or stack frames.
 */
export function buildHtmlOrRespond(logTag: string, build: () => string): string | Response {
    try {
        return build()
    } catch (err) {
        const detail = err instanceof Error ? `${err.message}\n${err.stack}` : String(err)
        console.error(`[${logTag}] HTML build failed:`, detail)
        return new Response(
            JSON.stringify({ error: 'HTML build failed', ...(process.env.NODE_ENV === 'development' ? { detail } : {}) }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
        )
    }
}

/**
 * Same as buildHtmlOrRespond, but for routes whose success response is itself
 * text/html (public preview iframes) — the error body matches that content
 * type instead of switching to JSON, so a broken template still renders as a
 * readable message inside the iframe rather than raw JSON text.
 */
export function buildHtmlPreviewOrRespond(logTag: string, build: () => string): string | Response {
    try {
        return build()
    } catch (err) {
        const detail = err instanceof Error ? err.message : String(err)
        console.error(`[${logTag}] HTML build failed:`, detail)
        const body = process.env.NODE_ENV === 'development'
            ? `<pre>Error: ${detail}</pre>`
            : '<pre>Wystąpił błąd podczas generowania podglądu</pre>'
        return new Response(body, { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
    }
}

/** Renders HTML to a PDF buffer via Puppeteer, or a standardized 500 Response on failure. */
export async function renderPdfOrRespond(logTag: string, html: string): Promise<Buffer | Response> {
    try {
        return await htmlToPdfBuffer(html)
    } catch (err) {
        const detail = err instanceof Error ? `${err.message}\n${err.stack}` : String(err)
        console.error(`[${logTag}] Puppeteer error:`, detail)
        return new Response(
            JSON.stringify({ error: 'PDF generation failed', ...(process.env.NODE_ENV === 'development' ? { detail } : {}) }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
        )
    }
}

/** Builds the application/pdf download Response with a Content-Disposition filename. */
export function pdfResponse(buffer: Buffer, filename: string): Response {
    return new Response(new Uint8Array(buffer), {
        status: 200,
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': String(buffer.length),
        },
    })
}

/** Builds a text/html preview Response. */
export function htmlResponse(html: string): Response {
    return new Response(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
}

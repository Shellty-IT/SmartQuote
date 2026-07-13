// src/lib/pdf/puppeteer.ts
// Thin wrapper around puppeteer-core + @sparticuz/chromium.
// Works on Vercel (downloads chromium to /tmp) and locally
// when PUPPETEER_EXECUTABLE_PATH points to a local Chrome installation.

import type { Browser } from 'puppeteer-core'
import { applyPrintPagination } from './print-preview'

const SET_CONTENT_TIMEOUT_MS = Number(process.env.PDF_SET_CONTENT_TIMEOUT_MS ?? 15_000)
const FONT_READY_TIMEOUT_MS = Number(process.env.PDF_FONT_READY_TIMEOUT_MS ?? 3_000)
const IMAGE_READY_TIMEOUT_MS = Number(process.env.PDF_IMAGE_READY_TIMEOUT_MS ?? 5_000)
const PDF_RENDER_TIMEOUT_MS = Number(process.env.PDF_RENDER_TIMEOUT_MS ?? 15_000)

function elapsed(startedAt: number): number {
    return Date.now() - startedAt
}

export function isPdfResourceUrlAllowed(rawUrl: string): boolean {
    try {
        const protocol = new URL(rawUrl).protocol
        return protocol === 'data:' || protocol === 'blob:' || protocol === 'about:'
    } catch {
        return false
    }
}

// Launches a fresh, unshared browser per call. A module-level cached instance
// previously raced across concurrent invocations sharing one lambda: whichever
// request finished first closed the browser out from under the other.
async function launchBrowser(): Promise<Browser> {
    const puppeteer = await import('puppeteer-core')

    let executablePath: string
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        executablePath = process.env.PUPPETEER_EXECUTABLE_PATH
    } else {
        const chromium = await import('@sparticuz/chromium')
        executablePath = await chromium.default.executablePath()
    }

    const chromiumArgs = process.env.PUPPETEER_EXECUTABLE_PATH
        ? []
        : (await import('@sparticuz/chromium')).default.args

    return puppeteer.default.launch({
        args: [
            ...chromiumArgs,
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
        ],
        executablePath,
        headless: true,
    })
}

export async function htmlToPdfBuffer(html: string): Promise<Buffer> {
    html = applyPrintPagination(html)
    const totalStartedAt = Date.now()
    const browserStartedAt = Date.now()
    const browser = await launchBrowser()
    const browserMs = elapsed(browserStartedAt)
    const pageStartedAt = Date.now()
    const page = await browser.newPage()
    const pageMs = elapsed(pageStartedAt)
    let contentMs = 0
    let imagesMs = 0
    let fontsMs = 0
    let pdfMs = 0
    let imageStatus: 'ready' | 'timeout' = 'ready'
    let fontStatus: 'ready' | 'timeout' = 'ready'

    try {
        await page.setRequestInterception(true)
        page.on('request', (request) => {
            if (isPdfResourceUrlAllowed(request.url())) {
                void request.continue()
            } else {
                void request.abort('blockedbyclient')
            }
        })

        // Emulate print media before content loads. The pagination script
        // measures DOM boxes on DOMContentLoaded, so it must see print layout.
        await page.emulateMediaType('print')

        // Parse the DOM but do not block on load: one slow logo or thumbnail
        // should not hang the whole PDF request.
        const contentStartedAt = Date.now()
        await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: SET_CONTENT_TIMEOUT_MS })
        contentMs = elapsed(contentStartedAt)

        const imagesStartedAt = Date.now()
        imageStatus = await Promise.race([
            page.evaluate(() =>
                Promise.all(
                    Array.from(document.images)
                        .filter((img) => !img.complete)
                        .map(
                            (img) =>
                                new Promise<void>((resolve) => {
                                    img.addEventListener('load', () => resolve(), { once: true })
                                    img.addEventListener('error', () => resolve(), { once: true })
                                }),
                        ),
                ).then(() => 'ready' as const),
            ),
            new Promise<'timeout'>((resolve) => setTimeout(() => resolve('timeout'), IMAGE_READY_TIMEOUT_MS)),
        ])
        imagesMs = elapsed(imagesStartedAt)

        if (imageStatus === 'timeout') {
            console.warn('[pdf-render] image wait timed out', {
                imageTimeoutMs: IMAGE_READY_TIMEOUT_MS,
                htmlBytes: Buffer.byteLength(html, 'utf8'),
            })
        }

        const fontsStartedAt = Date.now()
        fontStatus = await Promise.race([
            page.evaluate(() => document.fonts.ready.then(() => 'ready' as const)),
            new Promise<'timeout'>((resolve) => setTimeout(() => resolve('timeout'), FONT_READY_TIMEOUT_MS)),
        ])
        fontsMs = elapsed(fontsStartedAt)

        if (fontStatus === 'timeout') {
            console.warn('[pdf-render] font wait timed out', {
                fontTimeoutMs: FONT_READY_TIMEOUT_MS,
                htmlBytes: Buffer.byteLength(html, 'utf8'),
            })
        }

        const pdfStartedAt = Date.now()
        const pdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '0', right: '0', bottom: '0', left: '0' },
            timeout: PDF_RENDER_TIMEOUT_MS,
        })
        pdfMs = elapsed(pdfStartedAt)

        console.info('[pdf-render] success', {
            totalMs: elapsed(totalStartedAt),
            browserMs,
            pageMs,
            contentMs,
            imagesMs,
            imageStatus,
            fontsMs,
            fontStatus,
            pdfMs,
            htmlBytes: Buffer.byteLength(html, 'utf8'),
            pdfBytes: pdf.length,
            memory: process.memoryUsage(),
        })

        return Buffer.from(pdf)
    } catch (error) {
        console.error('[pdf-render] failed', {
            totalMs: elapsed(totalStartedAt),
            browserMs,
            pageMs,
            contentMs,
            imagesMs,
            imageStatus,
            fontsMs,
            fontStatus,
            pdfMs,
            htmlBytes: Buffer.byteLength(html, 'utf8'),
            error: error instanceof Error ? error.message : String(error),
            memory: process.memoryUsage(),
        })
        throw error
    } finally {
        await page.close()
        try { await browser.close() } catch { /* ignore */ }
    }
}

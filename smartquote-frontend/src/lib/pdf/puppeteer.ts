// src/lib/pdf/puppeteer.ts
// Thin wrapper around puppeteer-core + @sparticuz/chromium.
// Works on Vercel (downloads chromium to /tmp) and locally
// when PUPPETEER_EXECUTABLE_PATH points to a local Chrome installation.

import type { Browser } from 'puppeteer-core'

let _browser: Browser | null = null

async function getBrowser(): Promise<Browser> {
    // Re-use an existing browser instance within a single lambda invocation.
    if (_browser) return _browser

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

    _browser = await puppeteer.default.launch({
        args: [
            ...chromiumArgs,
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
        ],
        executablePath,
        headless: true,
    })

    return _browser
}

export async function htmlToPdfBuffer(html: string): Promise<Buffer> {
    const browser = await getBrowser()
    const page = await browser.newPage()

    try {
        await page.setContent(html, { waitUntil: 'load', timeout: 15_000 })
        // Wait for all @font-face fonts to finish loading before printing
        await page.evaluate(() => document.fonts.ready)

        const pdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '0', right: '0', bottom: '0', left: '0' },
        })

        return Buffer.from(pdf)
    } finally {
        await page.close()
        // Close browser to free memory in serverless environment.
        // The next request gets a fresh instance via getBrowser().
        try { await browser.close() } catch { /* ignore */ }
        _browser = null
    }
}

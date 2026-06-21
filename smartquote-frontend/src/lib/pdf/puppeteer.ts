// src/lib/pdf/puppeteer.ts
// Thin wrapper around puppeteer-core + @sparticuz/chromium.
// Works on Vercel (downloads chromium to /tmp) and locally
// when PUPPETEER_EXECUTABLE_PATH points to a local Chrome installation.

import type { Browser } from 'puppeteer-core'

let _browser: Browser | null = null

const SET_CONTENT_TIMEOUT_MS = Number(process.env.PDF_SET_CONTENT_TIMEOUT_MS ?? 15_000)
const FONT_READY_TIMEOUT_MS = Number(process.env.PDF_FONT_READY_TIMEOUT_MS ?? 3_000)
const PDF_RENDER_TIMEOUT_MS = Number(process.env.PDF_RENDER_TIMEOUT_MS ?? 15_000)

function elapsed(startedAt: number): number {
    return Date.now() - startedAt
}

const PRINT_PAGINATION_STYLES = `<style data-smartquote-print-pagination>
@media print {
  html, body { max-width: 100% !important; overflow-x: hidden !important; }
  *, *::before, *::after { min-width: 0; overflow-wrap: anywhere; }
  [style*="white-space:nowrap"], [style*="white-space: nowrap"] { white-space: normal !important; }
  section, article, .section, .sec { break-inside: auto !important; page-break-inside: auto !important; }
  .sq-keep-together {
    break-inside: avoid-page !important;
    page-break-inside: avoid !important;
  }
  table tr {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }
  h1, h2, h3, h4, h5, h6 {
    break-after: avoid-page !important;
    page-break-after: avoid !important;
  }
  p, li { orphans: 3; widows: 3; }
}
</style>
<script data-smartquote-print-pagination-script>
(function(){
  function preparePagination(){
    var maxHeight = 1030;
    var nodes = document.querySelectorAll('section,article,.section,.sec,.card,.pkg-card,.prio-card,.avoid-break,.print-keep,.sig-wrap,.signature,.summary,.totals,.grid > *,[class*="grid"] > *');
    for(var i=0;i<nodes.length;i++){
      var node=nodes[i];
      node.classList.toggle('sq-keep-together', node.getBoundingClientRect().height <= maxHeight);
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',preparePagination);
  else preparePagination();
  window.addEventListener('beforeprint',preparePagination);
})();
</script>`

export function applyPrintPagination(html: string): string {
    if (html.includes('data-smartquote-print-pagination')) return html
    return html.includes('</head>')
        ? html.replace('</head>', `${PRINT_PAGINATION_STYLES}</head>`)
        : `${PRINT_PAGINATION_STYLES}${html}`
}

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
    html = applyPrintPagination(html)
    const totalStartedAt = Date.now()
    const browserStartedAt = Date.now()
    const browser = await getBrowser()
    const browserMs = elapsed(browserStartedAt)
    const pageStartedAt = Date.now()
    const page = await browser.newPage()
    const pageMs = elapsed(pageStartedAt)
    let contentMs = 0
    let fontsMs = 0
    let pdfMs = 0
    let fontStatus: 'ready' | 'timeout' = 'ready'

    try {
        const contentStartedAt = Date.now()
        await page.setContent(html, { waitUntil: 'load', timeout: SET_CONTENT_TIMEOUT_MS })
        contentMs = elapsed(contentStartedAt)

        // Wait for all @font-face fonts to finish loading before printing.
        // Race against a hard cap so a font that never parses cannot hang the lambda.
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
        // Close browser to free memory in serverless environment.
        // The next request gets a fresh instance via getBrowser().
        try { await browser.close() } catch { /* ignore */ }
        _browser = null
    }
}

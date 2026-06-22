// src/lib/pdf/puppeteer.ts
// Thin wrapper around puppeteer-core + @sparticuz/chromium.
// Works on Vercel (downloads chromium to /tmp) and locally
// when PUPPETEER_EXECUTABLE_PATH points to a local Chrome installation.

import type { Browser } from 'puppeteer-core'

let _browser: Browser | null = null

const SET_CONTENT_TIMEOUT_MS = Number(process.env.PDF_SET_CONTENT_TIMEOUT_MS ?? 15_000)
const FONT_READY_TIMEOUT_MS = Number(process.env.PDF_FONT_READY_TIMEOUT_MS ?? 3_000)
const IMAGE_READY_TIMEOUT_MS = Number(process.env.PDF_IMAGE_READY_TIMEOUT_MS ?? 5_000)
const PDF_RENDER_TIMEOUT_MS = Number(process.env.PDF_RENDER_TIMEOUT_MS ?? 15_000)

function elapsed(startedAt: number): number {
    return Date.now() - startedAt
}

const PRINT_PAGINATION_STYLES = `<style data-smartquote-print-pagination>
@media print {
  html, body { max-width: 100% !important; overflow-x: hidden !important; }
  *, *::before, *::after { min-width: 0; overflow-wrap: anywhere; }
  [style*="white-space:nowrap"], [style*="white-space: nowrap"] { white-space: normal !important; }

  /* Sections flow and split freely across pages. They must NOT be forced
     atomic — doing so made a medium-height section jump whole to the next
     page and leave a large blank gap behind it. The explicit pdf-splittable
     hook documents the same intent for templates that opt in. */
  section, article, .section, .sec, .pdf-splittable {
    break-inside: auto !important; page-break-inside: auto !important;
  }

  /* A heading, eyebrow or section label must never be the last thing on a
     page: it stays with the content block that follows it. Real headings
     (h1-h6) plus the div-based section labels used by some templates and the
     explicit pdf-heading-group hook. */
  h1, h2, h3, h4, h5, h6,
  .sec-label, .sec-rule, .pdf-heading-group,
  [class*="eyebrow"], [class*="kicker"] {
    break-after: avoid-page !important;
    page-break-after: avoid !important;
  }

  /* Self-contained sub-blocks the layout script measured as fitting on one
     page (cards, tiles, rows, grid cells, signatures) never split across a
     page break. Blocks taller than the printable area keep break-inside:auto
     so they degrade by splitting instead of being clipped or vanishing. */
  .sq-keep-together {
    break-inside: avoid-page !important;
    page-break-inside: avoid !important;
  }

  /* Tables: header repeats on every page, rows never split mid-row. */
  table tr, .pdf-table tr { break-inside: avoid !important; page-break-inside: avoid !important; }
  thead, .pdf-table thead { display: table-header-group; }

  p, li { orphans: 3; widows: 3; }
}

/* Full-bleed page: a section/cover/footer that must reach every paper edge.
   Templates opt in with class="pdf-full-bleed" and set their own main @page
   margin; this named page guarantees the edge-to-edge area regardless. */
@page sq-full-bleed { size: A4; margin: 0; }
.pdf-full-bleed { page: sq-full-bleed; }
</style>
<script data-smartquote-print-pagination-script>
(function(){
  // Printable height budget in CSS px. A4 at 96dpi is ~1122.5px; we subtract a
  // conservative vertical margin so a block marked "keep together" still fits
  // on pages that carry a content margin (e.g. @page{margin:10mm 0}). Templates
  // can override via :root{--pdf-page-content-px:NNN}.
  var DEFAULT_CONTENT_PX = 1040;
  function pageBudget(){
    try {
      var raw = getComputedStyle(document.documentElement).getPropertyValue('--pdf-page-content-px');
      var parsed = parseFloat(raw);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    } catch (e) { /* ignore */ }
    return DEFAULT_CONTENT_PX;
  }
  function preparePagination(){
    var maxHeight = pageBudget();
    // Mark self-contained sub-blocks (cards, tiles, rows, grid cells, signature
    // blocks) as "keep together" only while they fit on a single page. Whole
    // sections stay splittable on purpose so they fill the page instead of
    // leaving a gap; oversized atomic blocks also stay splittable so they
    // degrade gracefully rather than being clipped.
    var nodes = document.querySelectorAll('.card,[class*="-card"],[class*="-tile"],.pkg-card,.prio-card,.avoid,.avoid-break,.print-keep,.pdf-keep,.pdf-signatures,.sig-wrap,.sig-row,.sig-cols,.signature,.summary,.totals,.tl-step,.extra-item,.pay-cell,.grid > *,[class*="grid"] > *');
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
    let imagesMs = 0
    let fontsMs = 0
    let pdfMs = 0
    let imageStatus: 'ready' | 'timeout' = 'ready'
    let fontStatus: 'ready' | 'timeout' = 'ready'

    try {
        // Parse the DOM but do NOT block on 'load' — a single slow or unreachable
        // remote image (logo, avatar, portfolio thumbnail) would otherwise keep
        // the 'load' event from ever firing and hang setContent until timeout.
        const contentStartedAt = Date.now()
        await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: SET_CONTENT_TIMEOUT_MS })
        contentMs = elapsed(contentStartedAt)

        // Give images a bounded budget to load. Broken or slow URLs resolve
        // (error counts as done) so they can never stall the render.
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
        // Close browser to free memory in serverless environment.
        // The next request gets a fresh instance via getBrowser().
        try { await browser.close() } catch { /* ignore */ }
        _browser = null
    }
}

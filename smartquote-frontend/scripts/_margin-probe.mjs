import fs from 'node:fs/promises'
import puppeteer from 'puppeteer-core'

const executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'

// Two full-bleed colored sections, tall enough to force a page break inside the
// second one. @page rules: 10mm top/bottom on every page, but NO top margin on
// the first page (cover should bleed to the very top edge).
const html = `<!DOCTYPE html><html lang="pl"><head><meta charset="utf-8">
<style>
*{box-sizing:border-box;margin:0;padding:0;}
@page{size:A4;margin:10mm 0;}
@page :first{margin-top:0;}
.cover{background:#1E1B4B;color:#fff;height:240mm;padding:40px;font-family:sans-serif;font-size:40px;}
.section{background:#EFF6FF;color:#1E293B;padding:40px;font-family:sans-serif;}
.tall{height:160mm;background:#DBEAFE;}
.footer{background:#0F172A;color:#fff;padding:40px;font-family:sans-serif;font-size:30px;break-inside:avoid-page;}
</style></head><body>
<div class="cover">COVER — should touch top edge of page 1</div>
<div class="section"><div class="tall">SECTION A — flows across the page break; where it continues on the next page there should be ~1cm white safe zone at the top.</div></div>
<div class="footer">FOOTER — kept together, sits near bottom</div>
</body></html>`

const browser = await puppeteer.launch({ executablePath, headless: true, args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setContent(html, { waitUntil: 'load' })

const pdfCss = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true })
await fs.writeFile('test-results/_probe-css-page.pdf', pdfCss)

const pdfMargin0 = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '0', right: '0', bottom: '0', left: '0' } })
await fs.writeFile('test-results/_probe-margin0.pdf', pdfMargin0)

await browser.close()
console.log('done')

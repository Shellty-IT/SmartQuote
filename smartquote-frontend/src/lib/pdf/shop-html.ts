// src/lib/pdf/shop-html.ts
// Generates a full HTML string for the "Sklep internetowy" offer template.
// Used by: Puppeteer PDF route + HTML preview route.

import { mergeShopWithDefaults, type ShopBlocks, type ShopSectionKey } from './shop-blocks'
import { buildHtmlDocument } from './html-shell'

export interface ShopOfferData {
    number: string
    title: string
    totalGross: number
    totalNet?: number
    currency: string
    paymentDays: number
    createdAt: string | Date
    client: {
        name: string
        company?: string | null
    }
    user?: {
        name?: string | null
        email: string
        companyInfo?: {
            name?: string | null
            website?: string | null
            logo?: string | null
            logoLight?: string | null
            logoDark?: string | null
            phone?: string | null
            email?: string | null
        } | null
    } | null
    blocks?: unknown | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function esc(s: string | null | undefined): string {
    if (!s) return ''
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}

function formatDate(d: string | Date): string {
    const dt = typeof d === 'string' ? new Date(d) : d
    return dt.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })
}

function addDays(d: string | Date, days: number): string {
    const dt = typeof d === 'string' ? new Date(d) : new Date(d)
    dt.setDate(dt.getDate() + days)
    return dt.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ── Editor-mode click wrapper ─────────────────────────────────────────────────

function editorWrap(key: string, html: string, label: string, editorMode: boolean): string {
    if (!editorMode) return html
    return `<div
  class="sq-editable"
  data-block="${key}"
  onclick="event.stopPropagation();window.parent.postMessage({type:'sq:editBlock',blockKey:'${key}'},'*')"
  title="Edytuj: ${label}"
  style="position:relative;cursor:pointer;outline:none;transition:box-shadow .15s"
  onmouseenter="this.style.boxShadow='inset 0 0 0 2px #F4A261'"
  onmouseleave="this.style.boxShadow=''"
>${html}</div>`
}

// ── CSS ────────────────────────────────────────────────────────────────────────

function buildCss(): string {
    return `

* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: 'Outfit', -apple-system, sans-serif;
  color: #1A1A2A;
  background: #E9EBF2;
  -webkit-font-smoothing: antialiased;
}
a { color: inherit; text-decoration: none; }

/* ── layout ── */
.doc { max-width: 1040px; margin: 0 auto; background: #fff; box-shadow: 0 8px 40px rgba(13,27,75,.12); }
.sec { position: relative; padding: 72px 56px; }

/* ── section numbers ── */
.sec-num {
  position: absolute; top: 28px; right: 40px;
  font-size: 54px; font-weight: 800;
  color: #F4A261; opacity: .18;
  letter-spacing: -2px; line-height: 1;
  pointer-events: none;
}

/* ── section headers ── */
.sec-label {
  font-size: 13px; font-weight: 700;
  letter-spacing: 2px; text-transform: uppercase;
  color: #6B7280; margin-bottom: 8px;
}
.sec-rule { width: 56px; height: 3px; background: #F4A261; margin-bottom: 44px; }

/* ── cover ── */
.cover {
  padding: 64px 56px 56px;
  background: #0D1B4B; color: #fff; overflow: hidden;
}
.cover-deco1 {
  position: absolute; top: -120px; right: -140px;
  width: 460px; height: 460px; border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, rgba(244,162,97,.30), rgba(244,162,97,0) 65%);
  pointer-events: none;
}
.cover-deco2 {
  position: absolute; bottom: -80px; left: -100px;
  width: 360px; height: 360px;
  background: linear-gradient(135deg, rgba(244,162,97,.14), rgba(255,255,255,0));
  transform: skewY(-8deg); border-radius: 24px;
  pointer-events: none;
}
.cover-h1 {
  font-size: 64px; font-weight: 800;
  line-height: 1.02; letter-spacing: -2px; margin: 0 0 32px;
}
.cover-logo-box {
  width: 56px; height: 56px;
  border: 2px solid rgba(244,162,97,.7);
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
}
.cover-logo-box img { width: 100%; height: 100%; object-fit: contain; }

/* ── cards ── */
.card {
  background: #fff; border-radius: 12px; padding: 28px 26px;
  box-shadow: 0 4px 18px rgba(13,27,75,.06);
  border: 1px solid #EEF0F6;
}
.grid-3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 24px; }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; }
.grid-3opt { display: grid; grid-template-columns: repeat(3,1fr); gap: 22px; align-items: stretch; }

/* ── platform cards ── */
.plat-recommended {
  background: #0D1B4B; color: #fff;
  border-radius: 14px; padding: 30px 26px;
  box-shadow: 0 14px 36px rgba(13,27,75,.22);
}
.plat-regular {
  background: #fff; border: 1px solid #E5E8F0;
  border-radius: 14px; padding: 30px 26px;
}
.plat-badge {
  position: absolute; top: -13px; left: 50%; transform: translateX(-50%);
  background: #F4A261; color: #0D1B4B;
  font-size: 11px; font-weight: 800;
  letter-spacing: 1px; padding: 5px 14px;
  border-radius: 999px; white-space: nowrap;
}
.plat-label {
  font-size: 11px; font-weight: 700;
  letter-spacing: 1px; text-transform: uppercase;
  color: #F4A261; margin-bottom: 6px;
}

/* ── timeline ── */
.timeline { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
.tl-step { flex: 1; display: flex; flex-direction: column; align-items: center; text-align: center; }
.tl-num {
  width: 52px; height: 52px; border-radius: 50%;
  background: #0D1B4B; color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; font-weight: 800; flex-shrink: 0;
}
.tl-num-last { background: #F4A261; color: #0D1B4B; }
.tl-connector { flex: 0 0 auto; height: 3px; width: 40px; background: #F4A261; margin-top: 25px; }

/* ── pricing table ── */
.price-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.price-thead tr { background: #0D1B4B; color: #fff; }
.price-thead th {
  text-align: left; padding: 16px 22px;
  font-weight: 700; font-size: 12px;
  letter-spacing: 1px; text-transform: uppercase;
}
.price-thead th:last-child { text-align: right; white-space: nowrap; }
.price-row td { padding: 15px 22px; }
.price-row-alt { background: #F8F9FC; }
.price-name { font-weight: 600; color: #1A1A2A; }
.price-desc { color: #6B7280; }
.price-amount { text-align: right; font-weight: 700; white-space: nowrap; }
.highlight { color: inherit; font-weight: 600; }
.price-summary { background: #F8F9FC; padding: 8px 22px; border-top: 1px solid #E5E8F0; }
.price-summary-row {
  display: flex; justify-content: space-between;
  padding: 8px 0; font-size: 14px; color: #6B7280;
}
.price-total {
  display: flex; justify-content: space-between;
  padding: 14px 0 6px; font-size: 18px; font-weight: 800; color: #0D1B4B;
}
.price-total-badge { background: #F4A261; color: #0D1B4B; padding: 3px 12px; border-radius: 6px; }

/* ── extras ── */
.extra-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 18px; background: #F8F9FC;
  border-radius: 8px; border: 1px solid #EEF0F6;
  font-size: 14px; color: #1A1A2A;
}
.extra-check {
  width: 18px; height: 18px; border: 2px solid #0D1B4B;
  border-radius: 4px; display: inline-block; flex-shrink: 0; margin-right: 12px;
}

/* ── payment schedule ── */
.pay-row { display: flex; gap: 16px; }
.pay-cell {
  flex: 1; background: #0D1B4B; color: #fff;
  border-radius: 10px; padding: 22px;
}
.pay-percent { font-size: 32px; font-weight: 800; color: #F4A261; }
.pay-desc { font-size: 13px; color: rgba(255,255,255,.8); margin-top: 4px; }

/* ── tech tags ── */
.tag {
  background: #0D1B4B; color: #fff;
  font-size: 14px; font-weight: 600;
  padding: 10px 20px; border-radius: 999px;
}
.tags-wrap { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 28px; }

/* ── warranty ── */
.warranty-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 28px; margin-bottom: 44px; }
.warranty-cta {
  background: #0D1B4B; border-radius: 14px; padding: 32px 40px;
  display: flex; align-items: center; justify-content: space-between;
  gap: 24px; flex-wrap: wrap;
}
.warranty-cta-btn {
  background: #F4A261; color: #0D1B4B;
  font-size: 14px; font-weight: 700;
  padding: 13px 26px; border-radius: 999px;
  text-decoration: none; white-space: nowrap;
}

/* ── about ── */
.about-stats { display: flex; flex-direction: column; gap: 22px; }
.about-stat-val { font-size: 44px; font-weight: 800; color: #F4A261; line-height: 1; }

/* ── footer ── */
.shop-footer {
  padding: 56px 56px 40px;
  background: #0D1B4B; color: #fff; overflow: hidden;
}
.footer-deco {
  position: absolute; top: -100px; right: -120px;
  width: 360px; height: 360px; border-radius: 50%;
  background: radial-gradient(circle at 40% 40%, rgba(244,162,97,.20), rgba(244,162,97,0) 65%);
  pointer-events: none;
}
.footer-grid {
  display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px;
  padding: 32px 0;
  border-top: 1px solid rgba(255,255,255,.14);
  border-bottom: 1px solid rgba(255,255,255,.14);
}
.footer-logo-box {
  width: 44px; height: 44px;
  border: 2px solid rgba(244,162,97,.7); border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
}
.footer-logo-box img { width: 100%; height: 100%; object-fit: contain; }
.cta-btn {
  background: #F4A261; color: #0D1B4B;
  font-size: 16px; font-weight: 800; letter-spacing: .5px;
  padding: 16px 40px; border-radius: 999px;
  text-decoration: none;
  box-shadow: 0 10px 24px rgba(244,162,97,.3);
  display: inline-block;
}

/* ── disabled overlay (editor mode) ── */
.sec-disabled { opacity: .45; filter: grayscale(.5); }

/* ── print ── */
@media print {
  body { background: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .doc { box-shadow: none !important; }
  .cover-deco1, .cover-deco2, .footer-deco { display: none !important; }
  .sec { padding: 36px 40px !important; }
  .cover { page-break-after: always; min-height: 100vh; }
  /* Reduce rule's bottom margin so its break-after:avoid reliably glues it to the first content row */
  .sec-rule { margin-bottom: 10px !important; }
  /* Prevent a page break immediately before the main content grid of each section */
  .grid-3, .grid-2, .grid-3opt, .timeline, .tags-wrap, .warranty-grid, .about-stats { break-before: avoid-page; page-break-before: avoid; }
  @page { size: A4; margin: 10mm 0; }
}

/* ── responsive ── */
@media (max-width: 768px) {
  .sec { padding: 48px 24px !important; }
  .cover { padding: 48px 24px 40px !important; }
  .grid-3, .grid-2, .grid-3opt, .warranty-grid { grid-template-columns: 1fr !important; }
  .timeline { flex-direction: column !important; align-items: stretch !important; }
  .tl-connector { display: none !important; }
  .tl-step { flex-direction: row !important; text-align: left !important; align-items: flex-start !important; gap: 16px !important; }
  .cover-h1 { font-size: 38px !important; }
  .pay-row { flex-direction: column !important; }
  .footer-grid { grid-template-columns: 1fr !important; }
  .sec-num { font-size: 36px !important; }
}
`
}

// ── Section renderers ─────────────────────────────────────────────────────────

function renderCover(data: ShopOfferData, blocks: ShopBlocks, editorMode: boolean): string {
    const co = data.user?.companyInfo
    const logo = co?.logoDark || co?.logoLight || co?.logo
    const logoHtml = logo
        ? `<img src="${esc(logo)}" alt="logo" />`
        : `<span style="font-size:10px;font-weight:800;letter-spacing:1px;color:#F4A261;">LOGO</span>`
    const website = co?.website ?? ''
    const clientDisplay = data.client.company || data.client.name

    const offerDate = formatDate(data.createdAt)
    const validUntil = addDays(data.createdAt, blocks.cover.validityDays)
    const offerNumber = esc(data.number)

    const inner = `
  <section class="sec cover pdf-full-bleed" style="position:relative;">
    <div class="cover-deco1"></div>
    <div class="cover-deco2"></div>
    <div style="position:relative;">
      <!-- top bar -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:96px;">
        <div style="display:flex;align-items:center;gap:14px;">
          <div class="cover-logo-box">${logoHtml}</div>
          ${website ? `<span style="font-size:14px;font-weight:600;color:rgba(255,255,255,.85);">${esc(website.replace(/^https?:\/\//, ''))}</span>` : ''}
        </div>
        <span style="font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.5);">Oferta handlowa</span>
      </div>
      <!-- heading -->
      <div style="font-size:13px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#F4A261;margin-bottom:20px;">${esc(blocks.cover.tag)}</div>
      <h1 class="cover-h1">${esc(blocks.cover.subtitle).replace(/(\S+)$/, `<span style="color:#F4A261;">$1</span>`)}</h1>
      <div style="font-size:17px;color:rgba(255,255,255,.8);margin-bottom:8px;">Przygotowana dla:</div>
      <div style="font-size:26px;font-weight:700;margin-bottom:110px;">
        <span style="color:inherit;font-weight:700;">${esc(clientDisplay)}</span>
      </div>
      <!-- bottom bar -->
      <div style="display:flex;flex-wrap:wrap;gap:40px;padding-top:24px;border-top:1px solid rgba(255,255,255,.14);">
        <div>
          <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.5);margin-bottom:6px;">Numer oferty</div>
          <div style="font-size:15px;font-weight:600;"><span class="highlight">${offerNumber}</span></div>
        </div>
        <div>
          <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.5);margin-bottom:6px;">Data</div>
          <div style="font-size:15px;font-weight:600;"><span class="highlight">${offerDate}</span></div>
        </div>
        <div>
          <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.5);margin-bottom:6px;">Ważność oferty</div>
          <div style="font-size:15px;font-weight:600;"><span class="highlight">${esc(String(blocks.cover.validityDays))} dni (do ${validUntil})</span></div>
        </div>
      </div>
    </div>
  </section>`
    return editorWrap('cover', inner, 'Okładka', editorMode)
}

function renderSummary(blocks: ShopBlocks, editorMode: boolean, num: number): string {
    const b = blocks.summary
    if (!b.enabled && !editorMode) return ''
    const cols = b.columns.map(col => `
      <div>
        <h3 style="font-size:22px;font-weight:800;color:#0D1B4B;margin:0 0 18px;padding-left:16px;border-left:4px solid #F4A261;">${esc(col.title)}</h3>
        <p style="font-size:15px;line-height:1.7;color:#6B7280;margin:0;">${esc(col.body)}</p>
      </div>`).join('')
    const inner = `
    <span class="sec-num">${String(num).padStart(2, '0')}</span>
    <div class="sec-label">Streszczenie projektu</div>
    <div class="sec-rule"></div>
    <div class="grid-2">${cols}</div>`
    return `<section class="sec${b.enabled ? '' : ' sec-disabled'}" style="background:#fff;">
    ${editorWrap('summary', inner, 'Streszczenie', editorMode)}
    </section>`
}

function renderScope(blocks: ShopBlocks, editorMode: boolean, num: number): string {
    const b = blocks.scope
    if (!b.enabled && !editorMode) return ''
    const cards = b.items.map(item => `
        <div class="card avoid" style="transition:transform .2s,box-shadow .2s;">
          <div style="font-size:30px;margin-bottom:16px;">${esc(item.icon)}</div>
          <h4 style="font-size:17px;font-weight:700;color:#0D1B4B;margin:0 0 10px;">${esc(item.title)}</h4>
          <p style="font-size:14px;line-height:1.65;color:#6B7280;margin:0;">${esc(item.description)}</p>
        </div>`).join('')
    const inner = `
    <span class="sec-num">${String(num).padStart(2, '0')}</span>
    <div class="sec-label">${esc(b.title)}</div>
    <div class="sec-rule"></div>
    <div class="grid-3">${cards}</div>`
    return `<section class="sec${b.enabled ? '' : ' sec-disabled'}" style="background:#F8F9FC;">
    ${editorWrap('scope', inner, 'Zakres prac', editorMode)}
    </section>`
}

function renderPlatforms(blocks: ShopBlocks, editorMode: boolean, num: number): string {
    const b = blocks.platforms
    if (!b.enabled && !editorMode) return ''
    const cards = b.options.map(opt => {
        if (opt.recommended) {
            return `<div class="avoid" style="position:relative;">
          <div class="plat-recommended">
            <div class="plat-badge">REKOMENDOWANA</div>
            <h4 style="font-size:21px;font-weight:800;margin:8px 0 16px;">${esc(opt.name)}</h4>
            <div class="plat-label">Zalety</div>
            <p style="font-size:13.5px;line-height:1.6;color:rgba(255,255,255,.82);margin:0 0 16px;">${esc(opt.pros)}</p>
            <div class="plat-label">Wady</div>
            <p style="font-size:13.5px;line-height:1.6;color:rgba(255,255,255,.82);margin:0 0 16px;">${esc(opt.cons)}</p>
            <div class="plat-label">Dla kogo</div>
            <p style="font-size:13.5px;line-height:1.6;color:rgba(255,255,255,.82);margin:0 0 20px;">${esc(opt.forWho)}</p>
            <div style="padding-top:16px;border-top:1px solid rgba(255,255,255,.16);">
              <span style="font-size:12px;color:rgba(255,255,255,.6);">od</span>
              <span class="highlight" style="font-weight:700;font-size:18px;margin-left:4px;">${esc(opt.priceFrom)}</span>
            </div>
          </div>
        </div>`
        }
        return `<div class="avoid plat-regular">
          <h4 style="font-size:21px;font-weight:800;color:#0D1B4B;margin:8px 0 16px;">${esc(opt.name)}</h4>
          <div class="plat-label">Zalety</div>
          <p style="font-size:13.5px;line-height:1.6;color:#6B7280;margin:0 0 16px;">${esc(opt.pros)}</p>
          <div class="plat-label">Wady</div>
          <p style="font-size:13.5px;line-height:1.6;color:#6B7280;margin:0 0 16px;">${esc(opt.cons)}</p>
          <div class="plat-label">Dla kogo</div>
          <p style="font-size:13.5px;line-height:1.6;color:#6B7280;margin:0 0 20px;">${esc(opt.forWho)}</p>
          <div style="padding-top:16px;border-top:1px solid #EEF0F6;">
            <span style="font-size:12px;color:#9AA1B0;">od</span>
            <span class="highlight" style="font-weight:700;font-size:18px;margin-left:4px;">${esc(opt.priceFrom)}</span>
          </div>
        </div>`
    }).join('')
    const inner = `
    <span class="sec-num">${String(num).padStart(2, '0')}</span>
    <div class="sec-label">${esc(b.title)}</div>
    <div class="sec-rule"></div>
    <div class="grid-3opt">${cards}</div>`
    return `<section class="sec${b.enabled ? '' : ' sec-disabled'}" style="background:#fff;">
    ${editorWrap('platforms', inner, 'Opcje platformy', editorMode)}
    </section>`
}

function renderTimeline(blocks: ShopBlocks, editorMode: boolean, num: number): string {
    const b = blocks.timeline
    if (!b.enabled && !editorMode) return ''
    const lastIdx = b.steps.length - 1
    const stepsHtml = b.steps.flatMap((step, i) => {
        const numClass = i === lastIdx ? 'tl-num tl-num-last' : 'tl-num'
        const parts: string[] = [`
      <div class="tl-step">
        <div class="${numClass}">${i + 1}</div>
        <div style="margin-top:16px;">
          <div style="font-size:15px;font-weight:700;color:#0D1B4B;margin-bottom:4px;">${esc(step.title)}</div>
          <div style="font-size:12px;font-weight:700;color:#F4A261;margin-bottom:8px;">${esc(step.duration)}</div>
          <p style="font-size:12.5px;line-height:1.55;color:#6B7280;margin:0;">${esc(step.description)}</p>
        </div>
      </div>`]
        if (i < lastIdx) {
            parts.push(`<div class="tl-connector"></div>`)
        }
        return parts
    }).join('')
    const inner = `
    <span class="sec-num">${String(num).padStart(2, '0')}</span>
    <div class="sec-label">${esc(b.title)}</div>
    <div class="sec-rule" style="margin-bottom:52px;"></div>
    <div class="timeline">${stepsHtml}</div>`
    return `<section class="sec${b.enabled ? '' : ' sec-disabled'}" style="background:#F8F9FC;">
    ${editorWrap('timeline', inner, 'Harmonogram', editorMode)}
    </section>`
}

function renderPricing(data: ShopOfferData, blocks: ShopBlocks, editorMode: boolean, num: number): string {
    const b = blocks.pricing
    if (!b.enabled && !editorMode) return ''

    const rows = b.items.map((item, i) => `
          <tr class="price-row${i % 2 === 1 ? ' price-row-alt' : ''}" style="border-bottom:1px solid #EEF0F6;">
            <td class="price-name">${esc(item.name)}</td>
            <td class="price-desc">${esc(item.description)}</td>
            <td class="price-amount"><span class="highlight">${esc(item.price)}</span></td>
          </tr>`).join('')

    const extrasHtml = b.extras.length > 0 ? `
      <div class="avoid" style="margin-top:32px;">
        <h4 style="font-size:16px;font-weight:800;color:#0D1B4B;margin:0 0 16px;">Opcje dodatkowe</h4>
        <div style="display:flex;flex-direction:column;gap:10px;">
          ${b.extras.map(ex => `
          <div class="extra-item">
            <span style="display:flex;align-items:center;gap:12px;">
              <span class="extra-check"></span>${esc(ex.name)}
            </span>
            <span style="font-weight:700;"><span class="highlight">${esc(ex.price)}</span></span>
          </div>`).join('')}
        </div>
      </div>` : ''

    const scheduleHtml = b.paymentSchedule.length > 0 ? `
      <div class="pay-row avoid" style="margin-top:32px;">
        ${b.paymentSchedule.map(p => `
        <div class="pay-cell">
          <div class="pay-percent">${esc(p.percent)}</div>
          <div class="pay-desc">${esc(p.description)}</div>
        </div>`).join('')}
      </div>` : ''

    // Price summary — a manual override (interpreted per priceType) wins, otherwise
    // the offer's computed total for that type is used. Both net and gross are always
    // shown, so we derive whichever figure is missing from the chosen one.
    const VAT = 1.23
    let net: number
    let totalGross: number
    if (b.priceType === 'net') {
        net = b.priceOverride !== null ? b.priceOverride : (data.totalNet ?? data.totalGross / VAT)
        totalGross = net * VAT
    } else {
        totalGross = b.priceOverride !== null ? b.priceOverride : data.totalGross
        net = totalGross / VAT
    }
    const vat = totalGross - net

    const inner = `
    <span class="sec-num">${String(num).padStart(2, '0')}</span>
    <div class="sec-label">${esc(b.title)}</div>
    <div class="sec-rule"></div>
    <div class="avoid" style="border:1px solid #E5E8F0;border-radius:12px;overflow:hidden;">
      <table class="price-table">
        <thead class="price-thead">
          <tr>
            <th>Pozycja</th>
            <th>Opis</th>
            <th style="text-align:right;">Cena netto</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="price-summary">
        <div class="price-summary-row">
          <span>Razem netto</span>
          <span style="font-weight:600;color:#1A1A2A;">
            <span class="highlight">${net.toFixed(0)} ${esc(data.currency)}</span>
          </span>
        </div>
        <div class="price-summary-row" style="border-bottom:1px solid #E5E8F0;">
          <span>VAT 23%</span>
          <span style="font-weight:600;color:#1A1A2A;">
            <span class="highlight">${vat.toFixed(0)} ${esc(data.currency)}</span>
          </span>
        </div>
        <div class="price-total">
          <span>Razem brutto</span>
          <span><span class="price-total-badge">${totalGross.toFixed(0)} ${esc(data.currency)}</span></span>
        </div>
      </div>
    </div>
    ${extrasHtml}
    ${scheduleHtml}`

    return `<section class="sec${b.enabled ? '' : ' sec-disabled'}" style="background:#fff;">
    ${editorWrap('pricing', inner, 'Wycena', editorMode)}
    </section>`
}

function renderTechStack(blocks: ShopBlocks, editorMode: boolean, num: number): string {
    const b = blocks.techStack
    if (!b.enabled && !editorMode) return ''
    const tags = b.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')
    const inner = `
    <span class="sec-num">${String(num).padStart(2, '0')}</span>
    <div class="sec-label">${esc(b.title)}</div>
    <div class="sec-rule"></div>
    <div class="tags-wrap">${tags}</div>
    <p style="font-size:14px;line-height:1.7;color:#6B7280;max-width:720px;margin:0;">${esc(b.description)}</p>`
    return `<section class="sec${b.enabled ? '' : ' sec-disabled'}" style="background:#F8F9FC;">
    ${editorWrap('techStack', inner, 'Stack technologiczny', editorMode)}
    </section>`
}

function renderWarranty(blocks: ShopBlocks, editorMode: boolean, num: number): string {
    const b = blocks.warranty
    if (!b.enabled && !editorMode) return ''
    const items = b.items.map(item => `
        <div style="text-align:center;">
          <div style="font-size:42px;margin-bottom:14px;">${esc(item.icon)}</div>
          <h4 style="font-size:17px;font-weight:700;color:#0D1B4B;margin:0 0 8px;">${esc(item.title)}</h4>
          <p style="font-size:13.5px;line-height:1.6;color:#6B7280;margin:0;">${esc(item.description)}</p>
        </div>`).join('')
    const inner = `
    <span class="sec-num">${String(num).padStart(2, '0')}</span>
    <div class="sec-label">${esc(b.title)}</div>
    <div class="sec-rule"></div>
    <div class="warranty-grid">${items}</div>
    <div class="warranty-cta">
      <div>
        <div style="font-size:19px;font-weight:800;color:#fff;margin-bottom:4px;">${esc(b.ctaTitle)}</div>
        <div style="font-size:14px;color:rgba(255,255,255,.75);">${esc(b.ctaSubtitle)}</div>
      </div>
      <span class="warranty-cta-btn">${esc(b.ctaButtonText)}</span>
    </div>`
    return `<section class="sec${b.enabled ? '' : ' sec-disabled'}" style="background:#fff;">
    ${editorWrap('warranty', inner, 'Gwarancja i wsparcie', editorMode)}
    </section>`
}

function renderAbout(data: ShopOfferData, blocks: ShopBlocks, editorMode: boolean, num: number): string {
    const b = blocks.about
    if (!b.enabled && !editorMode) return ''
    const authorName = data.user?.companyInfo?.name ?? data.user?.name ?? ''
    const stats = b.stats.map(s => `
        <div style="display:flex;align-items:baseline;gap:14px;">
          <span class="about-stat-val">${esc(s.value)}</span>
          <span style="font-size:14px;color:#6B7280;">${esc(s.label)}</span>
        </div>`).join('')
    const inner = `
    <span class="sec-num">${String(num).padStart(2, '0')}</span>
    <div class="sec-label">${esc(b.title)}</div>
    <div class="sec-rule"></div>
    <div class="grid-2" style="grid-template-columns:1.2fr 1fr;align-items:center;">
      <div>
        ${authorName ? `<h3 style="font-size:24px;font-weight:800;color:#0D1B4B;margin:0 0 16px;">${esc(authorName)}</h3>` : ''}
        <p style="font-size:15px;line-height:1.7;color:#6B7280;margin:0;">${esc(b.description)}</p>
      </div>
      <div class="about-stats">${stats}</div>
    </div>`
    return `<section class="sec${b.enabled ? '' : ' sec-disabled'}" style="background:#F8F9FC;">
    ${editorWrap('about', inner, 'O wykonawcy', editorMode)}
    </section>`
}

function renderFooter(data: ShopOfferData, blocks: ShopBlocks, editorMode: boolean): string {
    const co = data.user?.companyInfo
    const logo = co?.logoDark || co?.logoLight || co?.logo
    const logoHtml = logo
        ? `<img src="${esc(logo)}" alt="logo" />`
        : `<span style="font-size:10px;font-weight:800;letter-spacing:1px;color:#F4A261;">LOGO</span>`
    const website = co?.website ?? ''
    const email = co?.email ?? data.user?.email ?? ''
    const phone = co?.phone ?? ''
    const companyName = co?.name ?? data.user?.name ?? ''
    const validUntil = addDays(data.createdAt, blocks.cover.validityDays)
    const f = blocks.footer

    const inner = `
  <section class="sec shop-footer pdf-full-bleed" style="position:relative;">
    <div class="footer-deco"></div>
    <div style="position:relative;">
      <div style="display:flex;flex-direction:column;align-items:center;text-align:center;margin-bottom:40px;">
        <div style="font-size:22px;font-weight:800;margin-bottom:8px;">${esc(f.ctaTitle)}</div>
        <p style="font-size:14px;color:rgba(255,255,255,.7);max-width:440px;margin:0 0 24px;">${esc(f.ctaSubtitle)}</p>
        <span class="cta-btn" data-sq-action="accept">${esc(f.ctaButtonText)}</span>
      </div>
      <div class="footer-grid">
        <div style="display:flex;align-items:center;gap:12px;">
          <div class="footer-logo-box">${logoHtml}</div>
          ${website ? `<span style="font-size:14px;font-weight:600;color:#fff;">${esc(website.replace(/^https?:\/\//, ''))}</span>` : ''}
        </div>
        <div style="font-size:13.5px;line-height:1.8;color:rgba(255,255,255,.8);">
          ${email ? `<div>Email: <span class="highlight">${esc(email)}</span></div>` : ''}
          ${phone ? `<div>Telefon: <span class="highlight">${esc(phone)}</span></div>` : ''}
        </div>
        <div style="font-size:13.5px;line-height:1.8;color:rgba(255,255,255,.8);">
          <div>Oferta nr: <span class="highlight">${esc(data.number)}</span></div>
          <div>Ważna do: <span class="highlight">${validUntil}</span></div>
        </div>
      </div>
      <p style="font-size:11px;line-height:1.6;color:rgba(255,255,255,.45);text-align:center;margin:24px 0 0;">
        © ${new Date().getFullYear()} ${companyName ? `<span class="highlight">${esc(companyName)}</span>` : ''}. Wszelkie prawa zastrzeżone.
        Niniejsza oferta ma charakter poufny i jest przeznaczona wyłącznie dla wskazanego adresata.
      </p>
    </div>
  </section>`
    return editorWrap('footer', inner, 'Stopka', editorMode)
}

// ── Section dispatcher ────────────────────────────────────────────────────────

function renderSection(
    key: ShopSectionKey,
    data: ShopOfferData,
    blocks: ShopBlocks,
    editorMode: boolean,
    sectionNumber: number,
): string {
    switch (key) {
        case 'summary': return renderSummary(blocks, editorMode, sectionNumber)
        case 'scope': return renderScope(blocks, editorMode, sectionNumber)
        case 'platforms': return renderPlatforms(blocks, editorMode, sectionNumber)
        case 'timeline': return renderTimeline(blocks, editorMode, sectionNumber)
        case 'pricing': return renderPricing(data, blocks, editorMode, sectionNumber)
        case 'techStack': return renderTechStack(blocks, editorMode, sectionNumber)
        case 'warranty': return renderWarranty(blocks, editorMode, sectionNumber)
        case 'about': return renderAbout(data, blocks, editorMode, sectionNumber)
        default: return ''
    }
}

// ── Main export ───────────────────────────────────────────────────────────────

export interface BuildShopHtmlOptions {
    editorMode?: boolean
    zoom?: number
}

export function buildShopHtml(
    data: ShopOfferData,
    options: BuildShopHtmlOptions = {},
): string {
    const { editorMode = false, zoom = 1 } = options

    const blocks = mergeShopWithDefaults(data.blocks as Partial<ShopBlocks> | null)

    // In editorMode, render all sections; otherwise skip disabled ones
    const sectionsHtml = blocks.sections.map((key, idx) =>
        renderSection(key, data, blocks, editorMode, idx + 2),
    ).join('\n')

    const editorScript = editorMode ? `
  <script>
    document.querySelectorAll('.sq-editable').forEach(function(el) {
      el.addEventListener('click', function(e) {
        e.stopPropagation();
        var key = el.getAttribute('data-block');
        window.parent.postMessage({type: 'sq:editBlock', blockKey: key}, '*');
      });
    });
  </script>` : ''

    const zoomStyle = zoom !== 1
        ? `<style>
  .doc { transform: scale(${zoom}); transform-origin: top center; margin-bottom: ${(zoom - 1) * -100}%; }
  body { padding: 20px 0; }
</style>`
        : ''

    return buildHtmlDocument({
        title: esc(data.title),
        css: buildCss(),
        extraHead: zoomStyle,
        body: `<div class="doc">
  ${renderCover(data, blocks, editorMode)}
  ${sectionsHtml}
  ${renderFooter(data, blocks, editorMode)}
</div>
${editorScript}`,
    })
}

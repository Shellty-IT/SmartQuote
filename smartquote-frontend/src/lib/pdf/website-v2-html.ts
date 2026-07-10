// src/lib/pdf/website-v2-html.ts
// HTML generator for the "Strona internetowa v2" offer template.
// Pure function — no side effects, no imports of React/server utilities.

import { buildHtmlDocument, escapeHtml as esc } from './html-shell'
import { withPageBreakAfter } from './section-layout'
import { mergeWebsiteV2WithDefaults, type WebsiteV2Blocks, type WebsiteV2SectionKey } from './website-v2-blocks'

// ── Offer data interface ──────────────────────────────────────────────────────

export interface WebsiteV2OfferData {
    number: string
    title: string
    totalGross: number
    currency: string
    paymentDays: number
    createdAt: string
    client: { name: string; company: string | null }
    user: {
        name: string | null
        email: string
        avatar?: string | null
        companyInfo: {
            name: string | null
            website: string | null
            logo: string | null
            logoLight?: string | null
            logoDark?: string | null
            phone: string | null
            email: string | null
        } | null
    }
    blocks?: unknown
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// Guard against placeholder / hallucinated image URLs. The AI offer-fill agent
// used to invent addresses like https://example.com/foo.jpg for portfolio
// screenshots; those 404 and render as broken-image icons. Treat such URLs (and
// empty/"#" values) as "no image" so the dashed placeholder shows instead.
function isUsableImageUrl(url: string | null | undefined): boolean {
    const u = (url ?? '').trim()
    if (!u || u === '#') return false
    if (u.startsWith('data:')) return true
    try {
        const host = new URL(u).hostname.toLowerCase()
        return !/(^|\.)(example|test|localhost)\.(com|org|net)$/.test(host) && host !== 'localhost'
    } catch {
        // Relative path or malformed — keep it, the browser will resolve or fail gracefully.
        return true
    }
}

function formatDate(iso: string): string {
    try {
        return new Date(iso).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' })
    } catch { return iso }
}

function addDays(iso: string, days: number): string {
    try {
        const d = new Date(iso)
        d.setDate(d.getDate() + days)
        return d.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' })
    } catch { return iso }
}

function ph(text: string): string {
    return `<span style="color:inherit; font-weight:700; white-space:nowrap;">${esc(text)}</span>`
}

function secnum(n: string): string {
    return `<span aria-hidden="true" style="position:absolute; top:8px; right:34px; font-size:180px; font-weight:700; opacity:0.04; color:#2563EB; line-height:1; z-index:0; pointer-events:none;">${n}</span>`
}

function editorWrap(key: string, html: string, label: string, editorMode: boolean): string {
    if (!editorMode) return html
    return `<div data-sq-block="${key}" onclick="(function(e){e.stopPropagation();window.parent.postMessage({type:'sq:editBlock',blockKey:'${key}'},'*');})(event)" title="Edytuj: ${label}" style="cursor:pointer; outline:2px solid transparent; outline-offset:4px; border-radius:8px; transition:outline-color 0.15s;" onmouseenter="this.style.outlineColor='#2563EB'" onmouseleave="this.style.outlineColor='transparent'">${html}</div>`
}

// ── CSS ───────────────────────────────────────────────────────────────────────

function buildCss(): string {
    return `*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  font-family: 'Outfit', -apple-system, system-ui, sans-serif;
  color: #1E293B;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
  background: #FFFFFF;
}
a { color: inherit; text-decoration: none; }

@media (max-width: 768px) {
  .inner { padding: 48px 22px !important; }
  .cover-grid, .tech-secondary, .checklist-grid, .footer-grid, .price-wrap, .about-grid, .work-grid, .faq-grid, .costs-grid { grid-template-columns: 1fr !important; }
  .cover-top { flex-direction: column !important; align-items: flex-start !important; gap: 16px !important; }
  .stepper { flex-direction: column !important; gap: 36px !important; }
  .stepper-line { display: none !important; }
  .headline { font-size: 40px !important; }
  .phone-mock { display: none !important; }
}

@media print {
  .dot-grid { background: #FFFFFF !important; }
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  section { break-inside: auto; overflow:visible !important; }
  .inner { width:100% !important; max-width:100% !important; padding:36px 44px !important; }
  /* Cap large headings so stress-length text doesn't consume an entire page */
  .inner h2 { font-size: 26px !important; line-height: 1.35 !important; margin-bottom: 22px !important; }
  .print-keep.print-keep-active { break-inside:avoid-page !important; page-break-inside:avoid !important; }
  .price-wrap { grid-template-columns:minmax(0,1fr) !important; align-items:start !important; }
  .price-wrap > div { width:100% !important; max-width:100% !important; }
  .price-wrap > div:last-child { display:grid !important; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px !important; }
  .price-wrap > div:last-child > div { padding:14px !important; align-items:flex-start !important; }
  .price-wrap > div:last-child span { min-width:0 !important; overflow-wrap:anywhere !important; }
  .work-grid > div, .faq-grid > div, .costs-grid > div, .checklist-grid > div { break-inside: avoid; }
  footer { break-inside:avoid-page !important; page-break-inside:avoid !important; }
  footer .inner { padding:28px 44px 20px !important; }
  footer .footer-grid + div { margin:20px 0 12px !important; }
  @page{size:A4;margin:10mm 0;}
}`
}

// ── Section renderers ─────────────────────────────────────────────────────────

function renderCover(data: WebsiteV2OfferData, blocks: WebsiteV2Blocks, editorMode: boolean): string {
    const c = blocks.cover
    const ci = data.user.companyInfo
    const clientName = c.recipientName.trim() || data.client.company || data.client.name || 'NAZWA FIRMY'
    const lightLogo = ci?.logoLight || ci?.logo
    const logoHtml = lightLogo
        ? `<img src="${esc(lightLogo)}" alt="logo" style="max-width:196px; max-height:78px; object-fit:contain;" />`
        : `<div style="width:196px; height:78px; border:1.5px dashed #BFDBFE; border-radius:10px; display:flex; align-items:center; justify-content:center; font-weight:700; letter-spacing:2px; color:#94A3B8; font-size:13px; background:rgba(255,255,255,0.7);">LOGO</div>`
    const website = ci?.website ? `<a href="${esc(ci.website)}" style="color:#2563EB; font-weight:600; font-size:14px;">${esc(ci.website.replace(/^https?:\/\//, ''))}</a>` : ''
    const priceText = blocks.pricing.priceOverride != null
        ? `${blocks.pricing.priceOverride.toLocaleString('pl-PL')} zł`
        : (data.totalGross > 0 ? `${data.totalGross.toLocaleString('pl-PL')} zł` : 'do wyceny')

    const inner = `
  <section class="dot-grid pdf-full-bleed" style="position:relative; background:#FFFFFF; background-image:radial-gradient(#DBEAFE 1.4px, transparent 1.4px); background-size:26px 26px;">
    <div class="inner" style="max-width:1180px; margin:0 auto; padding:56px 48px 92px; position:relative; z-index:1;">
      <div class="cover-top" style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div style="display:flex; flex-direction:column; gap:8px;">
          ${logoHtml}
          ${website}
        </div>
        <div style="text-align:right; color:#64748B; font-size:13.5px; line-height:1.7;">
          <div>Oferta nr <strong style="color:#334155;">${esc(data.number)}</strong></div>
          <div>${formatDate(data.createdAt)}</div>
        </div>
      </div>

      <div class="cover-grid" style="display:grid; grid-template-columns:1.05fr 0.95fr; gap:56px; align-items:center; margin-top:64px;">
        <div>
          <div style="text-transform:uppercase; letter-spacing:4px; color:#2563EB; font-weight:700; font-size:13px; margin-bottom:18px;">Oferta</div>
          <h1 class="headline" style="margin:0; font-size:58px; line-height:1.04; font-weight:700; letter-spacing:-1.5px;">
            <span style="color:#1E293B;">${esc(c.title)}</span><br>
            <span style="color:#2563EB;">dla ${esc(clientName)}</span>
          </h1>
          <p style="margin:26px 0 0; font-size:19px; color:#64748B; max-width:460px;">${esc(c.subtitle)}</p>
          <div style="display:flex; flex-wrap:wrap; gap:10px; margin-top:34px;">
            <span style="display:inline-flex; align-items:center; gap:7px; background:#EFF6FF; color:#2563EB; border:1px solid #BFDBFE; border-radius:999px; padding:9px 16px; font-size:14px; font-weight:600;"><span style="color:#16A34A;">✓</span> Realizacja do ${ph(String(c.deadlineDays))} dni</span>
            <span style="display:inline-flex; align-items:center; gap:7px; background:#EFF6FF; color:#2563EB; border:1px solid #BFDBFE; border-radius:999px; padding:9px 16px; font-size:14px; font-weight:600;"><span style="color:#16A34A;">✓</span> ${esc(c.knowledgePill)}</span>
            <span style="display:inline-flex; align-items:center; gap:7px; background:#EFF6FF; color:#2563EB; border:1px solid #BFDBFE; border-radius:999px; padding:9px 16px; font-size:14px; font-weight:600;"><span style="color:#16A34A;">✓</span> Cena: ${ph(priceText)}</span>
          </div>
        </div>

        <!-- browser + phone mockup -->
        <div style="position:relative; padding-bottom:18px;">
          <div style="background:#FFFFFF; border-radius:12px; box-shadow:0 12px 40px rgba(37,99,235,0.14); overflow:hidden; border:1px solid #E2E8F0;">
            <div style="background:#1E293B; height:40px; display:flex; align-items:center; gap:8px; padding:0 16px;">
              <span style="width:11px; height:11px; border-radius:50%; background:#EF4444;"></span>
              <span style="width:11px; height:11px; border-radius:50%; background:#F59E0B;"></span>
              <span style="width:11px; height:11px; border-radius:50%; background:#22C55E;"></span>
              <span style="margin-left:14px; height:18px; flex:1; max-width:200px; background:#334155; border-radius:999px;"></span>
            </div>
            <div style="padding:18px;">
              <div style="height:46px; background:#2563EB; border-radius:8px; margin-bottom:14px;"></div>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
                <div style="display:flex; flex-direction:column; gap:8px;">
                  <span style="height:12px; background:#CBD5E1; border-radius:4px; width:80%;"></span>
                  <span style="height:9px; background:#E2E8F0; border-radius:4px;"></span>
                  <span style="height:9px; background:#E2E8F0; border-radius:4px; width:70%;"></span>
                  <span style="height:30px; background:#F59E0B; border-radius:999px; width:60%; margin-top:6px;"></span>
                </div>
                <div style="height:120px; border-radius:8px; background:repeating-linear-gradient(45deg,#EFF6FF,#EFF6FF 11px,#F8FAFC 11px,#F8FAFC 22px); border:1px dashed #BFDBFE;"></div>
              </div>
              <div style="height:30px; background:#F1F5F9; border-radius:8px; margin-top:16px;"></div>
            </div>
          </div>
          <div class="phone-mock" style="position:absolute; right:-14px; bottom:-26px; width:108px; height:206px; background:#1E293B; border-radius:22px; padding:7px; box-shadow:0 16px 36px rgba(15,23,42,0.22); border:1px solid #334155;">
            <div style="position:relative; height:100%; background:#FFFFFF; border-radius:16px; overflow:hidden;">
              <span style="position:absolute; top:7px; left:50%; transform:translateX(-50%); width:34px; height:5px; background:#1E293B; border-radius:999px;"></span>
              <div style="padding:18px 9px 9px;">
                <div style="height:22px; background:#2563EB; border-radius:5px; margin-bottom:8px;"></div>
                <div style="height:44px; border-radius:5px; background:repeating-linear-gradient(45deg,#EFF6FF,#EFF6FF 6px,#F8FAFC 6px,#F8FAFC 12px); border:1px dashed #BFDBFE;"></div>
                <div style="display:flex; flex-direction:column; gap:5px; margin-top:8px;">
                  <span style="height:6px; background:#E2E8F0; border-radius:3px;"></span>
                  <span style="height:16px; background:#F59E0B; border-radius:999px; width:66%; margin-top:4px;"></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    ${secnum('01')}
  </section>`
    return editorWrap('cover', inner, 'Okładka', editorMode)
}

function renderProblem(blocks: WebsiteV2Blocks, editorMode: boolean): string {
    const b = blocks.problem
    if (!b.enabled) return ''
    const inner = `
  <section style="position:relative; background:#EFF6FF; overflow:hidden;">
    <div class="inner" style="max-width:920px; margin:0 auto; padding:80px 48px; position:relative; z-index:1;">
      <div class="print-keep">
      <h2 style="margin:0 0 36px; font-size:40px; font-weight:700; letter-spacing:-1px; color:#1E293B;">${esc(b.title)}</h2>
      <div style="display:flex; flex-direction:column; gap:16px;">
        ${b.painPoints.map(p => `
        <div style="background:#FFFFFF; border-left:4px solid #F59E0B; border-radius:8px; padding:20px 24px; box-shadow:0 4px 24px rgba(37,99,235,0.08); display:flex; align-items:center; gap:18px;">
          <span style="font-size:30px; line-height:1;">${esc(p.emoji)}</span>
          <span style="font-size:17px; color:#1E293B;">${esc(p.text)}</span>
        </div>`).join('')}
      </div>
      </div>
      <p style="text-align:center; margin:44px 0 0; font-size:26px; font-weight:700; color:#2563EB; letter-spacing:-0.5px;">${esc(b.punchline)}</p>
    </div>
    ${secnum('02')}
  </section>`
    return editorWrap('problem', inner, 'Problem', editorMode)
}

function renderAbout(data: WebsiteV2OfferData, blocks: WebsiteV2Blocks, editorMode: boolean): string {
    const b = blocks.about
    if (!b.enabled) return ''
    const logoHtml = data.user.avatar
        ? `<img src="${esc(data.user.avatar)}" alt="Zdjęcie wykonawcy" style="width:220px; height:220px; object-fit:cover; border-radius:16px;" />`
        : `<div style="width:220px; height:220px; background:repeating-linear-gradient(45deg,#EFF6FF,#EFF6FF 11px,#F8FAFC 11px,#F8FAFC 22px); border:1px dashed #BFDBFE; border-radius:16px; display:flex; align-items:center; justify-content:center; color:#94A3B8; font-size:13px; text-align:center;">zdjęcie<br>wykonawcy</div>`
    const inner = `
  <section style="position:relative; background:#FFFFFF; overflow:hidden;">
    <div class="inner" style="max-width:1080px; margin:0 auto; padding:80px 48px; position:relative; z-index:1;">
      <div class="print-keep">
      <h2 style="margin:0 0 40px; font-size:40px; font-weight:700; letter-spacing:-1px; color:#1E293B;">${esc(b.title)}</h2>
      <div class="about-grid" style="display:grid; grid-template-columns:220px minmax(0,1fr); gap:44px; align-items:center;">
        ${logoHtml}
        <div>
          <div style="font-size:22px; font-weight:700; color:#1E293B;">${esc(b.name)}</div>
          <div style="color:#2563EB; font-weight:600; font-size:14px; margin:4px 0 16px;">${esc(b.role)}</div>
          <p style="margin:0 0 24px; font-size:17px; color:#64748B; max-width:560px;">${esc(b.bio)}</p>
          <div style="display:flex; flex-wrap:wrap; gap:14px;">
            ${b.stats.map(s => `
            <div style="background:#EFF6FF; border:1px solid #BFDBFE; border-radius:12px; padding:14px 20px;">
              <div style="font-size:24px; font-weight:700; color:#2563EB;">${esc(s.value)}</div>
              <div style="font-size:13px; color:#64748B;">${esc(s.label)}</div>
            </div>`).join('')}
          </div>
        </div>
      </div>
      </div>
    </div>
    ${secnum('03')}
  </section>`
    return editorWrap('about', inner, 'O mnie', editorMode)
}

function renderFeatures(blocks: WebsiteV2Blocks, editorMode: boolean): string {
    const b = blocks.features
    if (!b.enabled) return ''
    const inner = `
  <section style="position:relative; background:#EFF6FF; overflow:hidden;">
    <div class="inner" style="max-width:1080px; margin:0 auto; padding:80px 48px; position:relative; z-index:1;">
      <div class="print-keep">
      <h2 style="margin:0 0 8px; font-size:40px; font-weight:700; letter-spacing:-1px; color:#1E293B;">${esc(b.title)}</h2>
      <p style="margin:0 0 40px; font-size:17px; color:#64748B;">${esc(b.subtitle)}</p>
      <div class="checklist-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:24px 48px;">
        ${b.items.map(item => `
        <div style="display:flex; gap:14px;">
          <span style="color:#16A34A; font-size:22px; font-weight:700; line-height:1.2; flex-shrink:0;">✓</span>
          <div>
            <div style="font-weight:600; font-size:17px;">${esc(item.title)}</div>
            <div style="color:#64748B; font-size:14.5px; margin-top:2px;">${esc(item.description)}</div>
          </div>
        </div>`).join('')}
      </div>
      </div>
      ${b.extras.length ? `
      <div style="margin-top:44px; padding-top:28px; border-top:1px solid #BFDBFE;">
        <span style="display:inline-block; background:#FFFFFF; color:#B45309; border:1px solid #B45309; border-radius:999px; padding:5px 14px; font-size:12.5px; font-weight:700; letter-spacing:0.5px; text-transform:uppercase;">Dostępne za dopłatą</span>
        <div style="display:flex; flex-wrap:wrap; gap:10px 28px; margin-top:16px;">
          ${b.extras.map(e => `<span style="font-size:14.5px; color:#64748B;"><span style="color:#B45309; font-weight:700;">+</span> ${esc(e)}</span>`).join('')}
        </div>
      </div>` : ''}
    </div>
    ${secnum('04')}
  </section>`
    return editorWrap('features', inner, 'Co zawiera strona', editorMode)
}

function renderPortfolio(blocks: WebsiteV2Blocks, editorMode: boolean, sectionNum: number): string {
    const b = blocks.portfolio
    if (!b.enabled) return ''
    const inner = `
  <section style="position:relative; background:#FFFFFF; overflow:hidden;">
    <div class="inner" style="max-width:1080px; margin:0 auto; padding:80px 48px; position:relative; z-index:1;">
      <div class="print-keep">
      <h2 style="margin:0 0 8px; font-size:40px; font-weight:700; letter-spacing:-1px; color:#1E293B;">${esc(b.title)}</h2>
      <p style="margin:0 0 36px; font-size:17px; color:#64748B;">${esc(b.subtitle)}</p>
      <div class="work-grid" style="display:grid; grid-template-columns:repeat(3,1fr); gap:24px;">
        ${b.works.map(w => `
        <div style="border:1px solid #E2E8F0; border-radius:12px; overflow:hidden; box-shadow:0 4px 24px rgba(37,99,235,0.08);">
          ${isUsableImageUrl(w.imageUrl)
            ? `<img src="${esc(w.imageUrl)}" alt="${esc(w.name)}" onerror="this.style.display='none'" style="display:block;width:100%;height:180px;object-fit:cover;border-bottom:1px solid #E2E8F0;" />`
            : `<div style="height:180px; background:repeating-linear-gradient(45deg,#EFF6FF,#EFF6FF 11px,#F8FAFC 11px,#F8FAFC 22px); border-bottom:1px dashed #BFDBFE; display:flex; align-items:center; justify-content:center; color:#94A3B8; font-size:12px;">screenshot realizacji</div>`}
          <div style="padding:16px 18px;">
            <div style="font-weight:600; font-size:15px;">${esc(w.name)}</div>
            ${w.url && w.url !== '#' ? `<a href="${esc(w.url)}" style="color:#2563EB; font-size:13.5px; font-weight:600;">zobacz stronę →</a>` : `<span style="color:#2563EB; font-size:13.5px; font-weight:600;">zobacz stronę →</span>`}
          </div>
        </div>`).join('')}
      </div>
      </div>
      ${b.testimonials.length ? `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-top:36px;">
        ${b.testimonials.map(t => `
        <div style="background:#EFF6FF; border-radius:12px; padding:26px 28px;">
          <div style="color:#F59E0B; font-size:22px; margin-bottom:8px;">${'★'.repeat(t.stars)}</div>
          <p style="margin:0 0 16px; font-size:16px; color:#1E293B; font-style:italic;">„${esc(t.text)}"</p>
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="width:40px; height:40px; border-radius:50%; background:repeating-linear-gradient(45deg,#EFF6FF,#EFF6FF 5px,#F8FAFC 5px,#F8FAFC 10px); border:1px dashed #BFDBFE;"></div>
            <div>
              <div style="font-weight:600; font-size:14px;">${esc(t.name)}</div>
              <div style="color:#64748B; font-size:13px;">${esc(t.company)}</div>
            </div>
          </div>
        </div>`).join('')}
      </div>` : ''}
    </div>
    ${secnum(String(sectionNum).padStart(2, '0'))}
  </section>`
    return editorWrap('portfolio', inner, 'Realizacje', editorMode)
}

function renderProcess(blocks: WebsiteV2Blocks, editorMode: boolean, sectionNum: number): string {
    const b = blocks.process
    if (!b.enabled) return ''
    const inner = `
  <section style="position:relative; background:#EFF6FF; overflow:hidden;">
    <div class="inner" style="max-width:1080px; margin:0 auto; padding:80px 48px; position:relative; z-index:1;">
      <div class="print-keep">
      <h2 style="margin:0 0 48px; font-size:40px; font-weight:700; letter-spacing:-1px; color:#1E293B;">${esc(b.title)}</h2>
      <div class="stepper" style="position:relative; display:flex; justify-content:space-between; gap:24px;">
        <div class="stepper-line" style="position:absolute; top:28px; left:12%; right:12%; border-top:2px dashed #BFDBFE; z-index:0;"></div>
        ${b.steps.map((s, i) => `
        <div class="print-keep" style="position:relative; z-index:1; flex:1; text-align:center;">
          <div style="width:56px; height:56px; border-radius:50%; background:#2563EB; color:#FFFFFF; font-size:24px; font-weight:700; display:flex; align-items:center; justify-content:center; margin:0 auto 16px;">${i + 1}</div>
          <div style="font-weight:700; font-size:18px; margin-bottom:8px;">${esc(s.title)}</div>
          <p style="margin:0; color:#64748B; font-size:14.5px;">${esc(s.description)}</p>
        </div>`).join('')}
      </div>
      </div>
      ${b.timelineNote ? `
      <div class="print-keep" style="margin-top:48px; background:#FFFFFF; border:1px solid #BFDBFE; border-radius:12px; padding:22px 28px; display:flex; align-items:center; gap:14px; justify-content:center;">
        <span style="font-size:24px;">⏱</span>
        <span style="color:#2563EB; font-weight:600; font-size:17px;">${esc(b.timelineNote)}</span>
      </div>` : ''}
    </div>
    ${secnum(String(sectionNum).padStart(2, '0'))}
  </section>`
    return editorWrap('process', inner, 'Proces', editorMode)
}

function renderTechnology(blocks: WebsiteV2Blocks, editorMode: boolean, sectionNum: number): string {
    const b = blocks.technology
    if (!b.enabled) return ''
    const r = b.recommended
    const inner = `
  <section class="pb-tech" style="position:relative; background:#FFFFFF; overflow:hidden;">
    <div class="inner" style="max-width:1080px; margin:0 auto; padding:80px 48px; position:relative; z-index:1;">
      <div class="print-keep">
      <h2 style="margin:0 0 6px; font-size:40px; font-weight:700; letter-spacing:-1px; color:#1E293B;">${esc(b.title)}</h2>
      <p style="margin:0 0 36px; font-size:16px; color:#64748B; max-width:680px;">${esc(b.subtitle)}</p>

      <div style="position:relative; display:grid; grid-template-columns:auto minmax(0,1fr); gap:28px; align-items:start; background:#FFFFFF; border:2px solid #2563EB; border-radius:12px; padding:32px 30px; box-shadow:0 8px 32px rgba(37,99,235,0.15);">
        <span style="position:absolute; top:-13px; left:30px; background:#2563EB; color:#FFFFFF; border-radius:999px; padding:6px 16px; font-size:12px; font-weight:700; letter-spacing:0.5px;">★ MOJA REKOMENDACJA DLA CIEBIE</span>
        <div style="width:64px; height:64px; border-radius:50%; background:${esc(r.iconBg)}; color:#FFFFFF; display:flex; align-items:center; justify-content:center; font-size:32px; font-weight:700; margin-top:6px;">${esc(r.iconChar)}</div>
        <div>
          <div style="font-size:24px; font-weight:700;">${esc(r.name)}</div>
          <p style="margin:8px 0 18px; color:#64748B; font-size:15.5px; max-width:640px;">${esc(r.description)}</p>
          <div style="display:flex; flex-wrap:wrap; gap:10px 28px;">
            ${r.pros.map(pro => `<span style="font-size:14.5px; display:flex; gap:9px;"><span style="color:#16A34A; font-weight:700;">✓</span> ${esc(pro)}</span>`).join('')}
          </div>
        </div>
      </div>
      </div>

      ${b.alternatives.length ? `
      <div class="sec-label" style="font-weight:600; color:#64748B; font-size:14px; margin:34px 0 16px; text-transform:uppercase; letter-spacing:1px;">Mogę też pracować na:</div>
      <div class="tech-secondary" style="display:grid; grid-template-columns:1fr 1fr; gap:24px;">
        ${b.alternatives.map(a => `
        <div class="print-keep" style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:24px 26px;">
          <div style="display:flex; align-items:center; gap:14px; margin-bottom:12px;">
            <div style="width:44px; height:44px; border-radius:50%; background:#1E293B; color:#FFFFFF; display:flex; align-items:center; justify-content:center; font-size:18px;">▲</div>
            <div>
              <div style="font-size:18px; font-weight:700;">${esc(a.name)}</div>
              <div style="color:#2563EB; font-weight:600; font-size:13.5px;">${esc(a.subtitle)}</div>
            </div>
            <span style="margin-left:auto; background:#F59E0B; color:#1E293B; border-radius:999px; padding:4px 11px; font-size:11px; font-weight:700;">${esc(a.badge)}</span>
          </div>
          <p style="margin:0 0 14px; color:#64748B; font-size:14px;">${esc(a.description)}</p>
          <div style="display:flex; flex-direction:column; gap:8px;">
            ${a.pros.map(p => `<span style="font-size:13.5px; display:flex; gap:9px;"><span style="color:#16A34A; font-weight:700;">✓</span> ${esc(p)}</span>`).join('')}
          </div>
        </div>`).join('')}
      </div>` : ''}

      ${b.footer ? `<p style="text-align:center; margin:34px 0 0; font-style:italic; color:#64748B; font-size:15.5px;">${esc(b.footer)}</p>` : ''}
    </div>
    ${secnum(String(sectionNum).padStart(2, '0'))}
  </section>`
    return editorWrap('technology', inner, 'Technologia', editorMode)
}

function renderPricing(data: WebsiteV2OfferData, blocks: WebsiteV2Blocks, editorMode: boolean, sectionNum: number): string {
    const b = blocks.pricing
    if (!b.enabled) return ''

    const priceGross = b.priceOverride ?? (data.totalGross > 0 ? data.totalGross : 0)
    const priceNet = priceGross > 0 ? Math.round(priceGross / 1.23) : 0
    const validDate = addDays(data.createdAt, blocks.cover.validityDays ?? 14)
    const ci = data.user.companyInfo

    const inner = `
  <section class="pb-price" style="position:relative; background:#EFF6FF; overflow:hidden;">
    <div class="inner" style="max-width:1080px; margin:0 auto; padding:80px 48px; position:relative; z-index:1;">
      <div class="print-keep">
      <h2 style="margin:0 0 44px; font-size:40px; font-weight:700; letter-spacing:-1px; color:#1E293B; text-align:center;">Ile to kosztuje</h2>

      <div class="price-wrap" style="display:grid; grid-template-columns:minmax(0,600px) minmax(0,1fr); gap:32px; align-items:center; justify-content:center;">
        <div style="background:#FFFFFF; border-radius:12px; box-shadow:0 12px 40px rgba(37,99,235,0.14); overflow:hidden; border:1px solid #E2E8F0;">
          <div style="background:#2563EB; color:#FFFFFF; text-align:center; padding:14px; font-weight:700; letter-spacing:2px; font-size:14px;">TWOJA INWESTYCJA</div>
          <div style="padding:36px 40px;">
            <div style="text-align:center;">
              <div style="font-size:64px; font-weight:700; letter-spacing:-2px; color:#1E293B; line-height:1;">${priceNet > 0 ? `${ph(priceNet.toLocaleString('pl-PL'))} zł` : ph('do wyceny')}</div>
              <div style="color:#64748B; font-size:14px; margin-top:8px;">netto · <span style="color:#1E293B; font-weight:600;">${priceGross > 0 ? `${ph(priceGross.toLocaleString('pl-PL'))} zł brutto` : '—'}</span> (z VAT 23%)</div>
              <div style="color:#94A3B8; font-size:13px; margin-top:4px;">płatne jednorazowo za wykonanie strony</div>
            </div>

            ${b.includes.length ? `
            <div style="height:1px; background:#E2E8F0; margin:28px 0;"></div>
            <div style="font-weight:700; font-size:15px; margin-bottom:14px;">Co zawiera ta kwota</div>
            <div style="display:flex; flex-direction:column; gap:10px;">
              ${b.includes.map(inc => `<span style="font-size:15px; display:flex; gap:10px;"><span style="color:#16A34A; font-weight:700;">✓</span> ${esc(inc)}</span>`).join('')}
            </div>` : ''}

            ${b.paymentSchedule.length ? `
            <div style="height:1px; background:#E2E8F0; margin:28px 0;"></div>
            <div style="font-weight:700; font-size:15px; margin-bottom:14px;">Harmonogram płatności</div>
            <div style="display:flex; flex-direction:column; gap:12px;">
              ${b.paymentSchedule.map(ps => {
                  const amt = priceGross > 0 ? Math.round(priceGross * ps.percent / 100) : 0
                  return `<div style="display:flex; justify-content:space-between; align-items:center; background:#F8FAFC; border-radius:8px; padding:12px 16px;">
                  <span style="font-size:14.5px; color:#1E293B;">→ ${ph(String(ps.percent))}% ${esc(ps.label)}</span>
                  <span style="font-weight:700; color:#2563EB;">${amt > 0 ? `${amt.toLocaleString('pl-PL')} zł` : '—'}</span>
                </div>`
              }).join('')}
            </div>` : ''}

            <div style="height:1px; background:#E2E8F0; margin:28px 0;"></div>
            ${ci?.email
                ? `<a data-sq-action="accept" href="mailto:${esc(ci.email)}?subject=Akceptuję%20ofertę%20nr%20${encodeURIComponent(data.number)}" style="display:block; text-align:center; background:#2563EB; color:#FFFFFF; font-weight:700; font-size:18px; border-radius:999px; padding:16px; text-decoration:none; letter-spacing:0.5px;">AKCEPTUJĘ OFERTĘ</a>`
                : `<div data-sq-action="accept" style="display:block; text-align:center; background:#2563EB; color:#FFFFFF; font-weight:700; font-size:18px; border-radius:999px; padding:16px; letter-spacing:0.5px;">AKCEPTUJĘ OFERTĘ</div>`
            }
            <div style="text-align:center; color:#64748B; font-style:italic; font-size:13.5px; margin-top:12px;">Oferta ważna do ${ph(validDate)}</div>
          </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:16px;">
          ${b.guarantees.map(g => `
          <div style="background:#FFFFFF; border-radius:12px; padding:20px 22px; box-shadow:0 4px 24px rgba(37,99,235,0.08); display:flex; align-items:center; gap:14px;">
            <span style="font-size:26px;">${esc(g.emoji)}</span>
            <span style="font-size:15px; font-weight:600;">${esc(g.text)}</span>
          </div>`).join('')}
        </div>
      </div>
      </div>

      ${b.costs.length ? `
      <div class="print-keep" style="margin-top:36px; background:#FFFFFF; border:1px solid #BFDBFE; border-radius:12px; padding:30px 32px;">
        <div style="font-weight:700; font-size:18px; margin-bottom:4px;">Koszty jednorazowe i roczne — wszystko jawnie</div>
        <p style="margin:0 0 22px; color:#64748B; font-size:14.5px;">Nie ukrywam żadnych opłat. Poza wykonaniem strony są tylko niewielkie koszty roczne za jej działanie.</p>
        <div class="costs-grid" style="display:grid; grid-template-columns:${b.costs.length === 1 ? '1fr' : '1fr 1fr'}; gap:20px;">
          ${b.costs.map((cost, i) => `
          <div style="background:${i === 0 ? '#EFF6FF' : '#FFF7ED'}; border:${i === 0 ? 'none' : '1px solid #FED7AA'}; border-radius:10px; padding:20px 22px;">
            <div style="font-size:12px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:${i === 0 ? '#2563EB' : '#B45309'}; margin-bottom:8px;">${esc(cost.type)}</div>
            <div style="font-size:28px; font-weight:700; color:#1E293B;">${ph(cost.amount)}</div>
            <div style="color:#64748B; font-size:13.5px; margin-top:4px;">${esc(cost.description)}</div>
          </div>`).join('')}
        </div>
      </div>` : ''}
    </div>
    ${secnum(String(sectionNum).padStart(2, '0'))}
  </section>`
    return editorWrap('pricing', inner, 'Cena', editorMode)
}

function renderFaq(blocks: WebsiteV2Blocks, editorMode: boolean, sectionNum: number): string {
    const b = blocks.faq
    if (!b.enabled) return ''
    const inner = `
  <section style="position:relative; background:#FFFFFF; overflow:hidden;">
    <div class="inner" style="max-width:1080px; margin:0 auto; padding:80px 48px; position:relative; z-index:1;">
      <div class="print-keep">
      <h2 style="margin:0 0 8px; font-size:40px; font-weight:700; letter-spacing:-1px; color:#1E293B;">${esc(b.title)}</h2>
      <p style="margin:0 0 40px; font-size:17px; color:#64748B;">${esc(b.subtitle)}</p>
      <div class="faq-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
        ${b.items.map(item => `
        <div style="border:1px solid #E2E8F0; border-radius:12px; padding:22px 24px;">
          <div style="font-weight:700; font-size:16px; color:#1E293B; margin-bottom:8px;">${esc(item.question)}</div>
          <p style="margin:0; color:#64748B; font-size:14.5px;">${esc(item.answer)}</p>
        </div>`).join('')}
      </div>
      </div>
    </div>
    ${secnum(String(sectionNum).padStart(2, '0'))}
  </section>`
    return editorWrap('faq', inner, 'FAQ', editorMode)
}

function renderFooter(data: WebsiteV2OfferData, blocks: WebsiteV2Blocks, editorMode: boolean): string {
    const b = blocks.footer
    const ci = data.user.companyInfo
    const darkLogo = ci?.logoDark || ci?.logoLight || ci?.logo
    const logoHtml = darkLogo
        ? `<img src="${esc(darkLogo)}" alt="logo" style="max-width:160px; max-height:64px; object-fit:contain;" />`
        : `<div style="width:128px; height:52px; border:1.5px dashed #475569; border-radius:10px; display:flex; align-items:center; justify-content:center; font-weight:700; letter-spacing:2px; color:#94A3B8; font-size:13px; margin-bottom:16px;">LOGO</div>`
    const validDate = addDays(data.createdAt, blocks.cover.validityDays ?? 14)

    const inner = `
  <footer style="background:#1E293B; color:#FFFFFF;">
    <div class="inner" style="max-width:1080px; margin:0 auto; padding:56px 48px 40px;">
      <div class="footer-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:32px; align-items:start;">
        <div>
          <div style="margin-bottom:16px;">${logoHtml}</div>
          <p style="margin:0; color:#94A3B8; font-size:15px; max-width:320px;">${esc(b.tagline)}</p>
        </div>
        <div>
          <div style="color:#64748B; font-size:12px; letter-spacing:1.5px; text-transform:uppercase; margin-bottom:14px;">Kontakt</div>
          <div style="display:flex; flex-direction:column; gap:8px; font-size:15px;">
            ${ci?.email ? `<a href="mailto:${esc(ci.email)}" style="color:#FFFFFF;">${esc(ci.email)}</a>` : ''}
            ${ci?.phone ? `<a href="tel:${esc(ci.phone)}" style="color:#FFFFFF;">${esc(ci.phone)}</a>` : ''}
            ${ci?.website ? `<a href="${esc(ci.website)}" style="color:#F59E0B; font-weight:600;">${esc(ci.website.replace(/^https?:\/\//, ''))}</a>` : ''}
          </div>
        </div>
      </div>
      <div style="height:1px; background:#334155; margin:36px 0 20px;"></div>
      <div style="color:#64748B; font-size:13px; display:flex; flex-wrap:wrap; gap:6px 14px;">
        <span>Oferta nr ${esc(data.number)}</span><span>·</span>
        <span>Przygotowana ${formatDate(data.createdAt)}</span><span>·</span>
        <span>Ważna do ${ph(validDate)}</span><span>·</span>
        <span>Dokument poufny</span>
      </div>
    </div>
  </footer>`
    return editorWrap('footer', inner, 'Stopka', editorMode)
}

// ── Section dispatcher ────────────────────────────────────────────────────────

function renderSection(
    key: WebsiteV2SectionKey,
    data: WebsiteV2OfferData,
    blocks: WebsiteV2Blocks,
    editorMode: boolean,
    sectionNum: number,
): string {
    switch (key) {
        case 'problem':    return renderProblem(blocks, editorMode)
        case 'about':      return renderAbout(data, blocks, editorMode)
        case 'features':   return renderFeatures(blocks, editorMode)
        case 'portfolio':  return renderPortfolio(blocks, editorMode, sectionNum)
        case 'process':    return renderProcess(blocks, editorMode, sectionNum)
        case 'technology': return renderTechnology(blocks, editorMode, sectionNum)
        case 'pricing':    return renderPricing(data, blocks, editorMode, sectionNum)
        case 'faq':        return renderFaq(blocks, editorMode, sectionNum)
        default:           return ''
    }
}

// ── Main export ───────────────────────────────────────────────────────────────

export function buildWebsiteV2Html(
    data: WebsiteV2OfferData,
    options: { editorMode?: boolean; zoom?: number } = {},
): string {
    const { editorMode = false, zoom = 1 } = options
    const blocks = mergeWebsiteV2WithDefaults(data.blocks as Partial<WebsiteV2Blocks> | null)

    // Assign section numbers starting at 02 (01 = cover)
    let sectionCounter = 2
    const body = blocks.sections.map((key) => {
        const html = renderSection(key, data, blocks, editorMode, sectionCounter)
        if (html) sectionCounter++
        return withPageBreakAfter(html, blocks.pageBreakAfter.includes(key))
    }).join('\n')

    const zoomStyle = zoom !== 1
        ? `<style>body { transform: scale(${zoom}); transform-origin: top left; width: ${(100 / zoom).toFixed(2)}%; }</style>`
        : ''

    const paginationScript = `<script data-smartquote-template-pagination>
(function () {
  function updatePrintKeeps() {
    var nodes = document.querySelectorAll('.print-keep');
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].classList.toggle('print-keep-active', nodes[i].getBoundingClientRect().height <= 1030);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', updatePrintKeeps);
  else updatePrintKeeps();
  window.addEventListener('beforeprint', updatePrintKeeps);
}());
</script>`

    return buildHtmlDocument({
        title: 'Oferta — Strona internetowa',
        css: buildCss(),
        extraHead: [zoomStyle, paginationScript].filter(Boolean).join('\n'),
        body: `<div>
${withPageBreakAfter(renderCover(data, blocks, editorMode), blocks.pageBreakAfter.includes('cover'))}
${body}
${renderFooter(data, blocks, editorMode)}
</div>`,
    })
}

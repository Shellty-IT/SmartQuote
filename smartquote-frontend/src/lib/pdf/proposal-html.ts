// src/lib/pdf/proposal-html.ts
// Generates a full HTML string for the proposal template.
// Used by: Puppeteer PDF route + HTML preview route.

import { mergeWithDefaults, type ProposalBlocks } from './proposal-blocks'

export interface ProposalOfferData {
    number: string
    title: string
    totalGross: number
    currency: string
    paymentDays: number
    createdAt: string | Date
    client: {
        name: string
        company?: string | null
    }
    user: {
        name?: string | null
        email: string
        companyInfo?: {
            name?: string | null
            website?: string | null
            logo?: string | null
            phone?: string | null
        } | null
    }
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

function formatMoney(amount: number, currency = 'PLN'): string {
    return (
        amount
            .toFixed(2)
            .replace(/\B(?=(\d{3})+(?!\d))/g, ' ') +
        ' ' +
        currency
    )
}

const SVG_CHECK = `<svg viewBox="0 0 10 10" fill="none"><path d="M2 5.2l2.2 2.2 3.6-4" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`

// ── Section renderers ─────────────────────────────────────────────────────────

function renderIntro(blocks: ProposalBlocks): string {
    if (!blocks.intro.enabled) return ''
    const paragraphs = blocks.intro.paragraphs
        .filter(Boolean)
        .map((p) => `<p>${p}</p>`)
        .join('\n      ')
    return `
    <div class="intro">
      ${paragraphs}
    </div>`
}

function renderDemo(blocks: ProposalBlocks): string {
    const d = blocks.demo
    if (!d.enabled) return ''
    const urls = d.urls
        .filter((u) => u.href && u.href !== 'https://')
        .map(
            (u) => `
      <div class="demo-url-row">
        <span class="arrow">👉</span>
        <a href="${esc(u.href)}">${esc(u.href.replace(/^https?:\/\//, ''))}</a>
        <span style="font-size:9px;color:#697080;margin-left:4px;">— ${esc(u.label)}</span>
      </div>`,
        )
        .join('')
    const warning = d.warning
        ? `<div class="demo-warn">⚠️ ${esc(d.warning)}</div>`
        : ''
    const note = d.note ? `<p class="demo-note">${esc(d.note)}</p>` : ''

    return `
    <div class="demo-block">
      <div class="sec"><span class="ico">💻</span><h2>${esc(d.title)}</h2></div>
      <p class="demo-body">${esc(d.body)}</p>
      ${urls}
      ${warning}
      ${note}
    </div>`
}

function renderStructure(blocks: ProposalBlocks): string {
    const s = blocks.structure
    if (!s.enabled || !s.items.length) return ''
    const items = s.items
        .map(
            (item) => `
        <div class="struct-item">
          <span class="si">${item.icon}</span>
          <div>
            <div class="sn">${esc(item.name)}</div>
            <div class="sd">${esc(item.description)}</div>
          </div>
        </div>`,
        )
        .join('')
    const note = s.note ? `<p class="struct-note">${esc(s.note)}</p>` : ''
    return `
    <div>
      <div class="sec"><span class="ico">🗂️</span><h2>${esc(s.title)}</h2></div>
      <div class="struct-grid">
        ${items}
      </div>
      ${note}
    </div>`
}

function renderScope(blocks: ProposalBlocks): string {
    const s = blocks.scope
    if (!s.enabled || !s.items.length) return ''
    const items = s.items
        .map(
            (item) => `
        <div class="scope-item">
          <span class="chk">${SVG_CHECK}</span>
          <span>${item.html}</span>
        </div>`,
        )
        .join('')
    return `
    <div style="margin-bottom:6mm;">
      <div class="sec"><span class="ico">📦</span><h2>${esc(s.title)}</h2></div>
      <div class="scope-grid">
        ${items}
      </div>
    </div>`
}

function renderTesting(blocks: ProposalBlocks): string {
    const t = blocks.testing
    if (!t.enabled || !t.cards.length) return ''
    const cards = t.cards
        .map(
            (c) => `
          <div class="test-item">
            <span class="ti">${c.icon}</span>
            <div class="tt"><span class="ts">${esc(c.title)}</span> — ${esc(c.description)}</div>
          </div>`,
        )
        .join('')
    const note = t.note ? `<p class="test-note">${esc(t.note)}</p>` : ''
    return `
      <div>
        <div class="sec"><span class="ico">🔬</span><h2>Środowisko testowe</h2></div>
        <p class="test-intro">${esc(t.intro)}</p>
        <div class="test-grid">
          ${cards}
        </div>
        ${note}
      </div>`
}

function renderTechnology(blocks: ProposalBlocks): string {
    const t = blocks.technology
    if (!t.enabled) return ''
    const options = t.options
        .map(
            (opt) => `
          <div class="tech-card prime">
            <div class="tc-title">${opt.icon} ${esc(opt.title)}</div>
            ${opt.urls
                .filter((u) => u.href && u.href !== 'https://')
                .map(
                    (u) =>
                        `<div class="tc-url"><span>👉</span><a href="${esc(u.href)}">${esc(u.href.replace(/^https?:\/\//, ''))}</a></div>`,
                )
                .join('')}
          </div>`,
        )
        .join('')
    const note = t.note ? `<p class="tech-note">${esc(t.note)}</p>` : ''
    return `
      <div>
        <div class="sec"><span class="ico">💻</span><h2>Technologia</h2></div>
        <p class="tech-body">${t.body}</p>
        <div class="tech-cols">
          ${options}
        </div>
        ${note}
      </div>`
}

function renderPricingBox(
    offer: ProposalOfferData,
    blocks: ProposalBlocks,
): string {
    const pe = blocks.pricingExtra
    const timelineCard = pe.enabled
        ? `
        <div class="p-card">
          <div class="pc-label">⏱️ Czas realizacji</div>
          <div class="pc-val">${esc(pe.timeline)}</div>
          <div class="pc-sub">${esc(pe.timelineSub)}</div>
        </div>`
        : ''
    const contractCard = pe.enabled
        ? `
        <div class="p-card">
          <div class="pc-label">🧾 Forma współpracy</div>
          <div class="pc-val">${esc(pe.contractType)}</div>
          <div class="pc-sub">${esc(pe.contractSub)}</div>
        </div>`
        : ''
    return `
    <div class="pricing">
      <div class="pricing-header">
        <div class="ph-label">💰 Wycena i termin realizacji</div>
      </div>
      <div class="pricing-cards">
        <div class="p-card hot">
          <div class="pc-label">💵 Cena</div>
          <div class="pc-val">${formatMoney(offer.totalGross, offer.currency)}</div>
          <div class="pc-sub">brutto · płatność ${offer.paymentDays} dni</div>
        </div>
        ${timelineCard}
        ${contractCard}
      </div>
    </div>`
}

function renderAbout(
    offer: ProposalOfferData,
    blocks: ProposalBlocks,
): string {
    const a = blocks.about
    if (!a.enabled) return ''
    const website = offer.user.companyInfo?.website
    const aboutBox = website
        ? `
      <div class="about-box">
        <div class="sec"><span class="ico">🗂️</span><h2>Więcej o nas i naszych realizacjach</h2></div>
        <a class="about-url" href="${esc(website)}">👉 ${esc(website.replace(/^https?:\/\//, ''))}</a>
      </div>`
        : ''
    return `
    <div class="bottom-row" style="${!website ? 'grid-template-columns:1fr;' : ''}">
      ${aboutBox}
      <div class="cta-box">
        <p>${esc(a.ctaText)}</p>
      </div>
    </div>`
}

// ── Page split logic ──────────────────────────────────────────────────────────
// Page 1: header + intro + demo + structure
// Page 2: scope + (testing+technology) + pricing + about

// ── Full HTML ─────────────────────────────────────────────────────────────────

export function buildProposalHtml(offer: ProposalOfferData): string {
    const blocks = mergeWithDefaults(
        offer.blocks as Partial<ProposalBlocks> | null,
        offer.client.name,
    )

    const sellerName = offer.user.companyInfo?.name ?? offer.user.name ?? offer.user.email
    const clientLabel = offer.client.company
        ? `${offer.client.name} · ${offer.client.company}`
        : offer.client.name
    const website = offer.user.companyInfo?.website ?? ''
    const logo = offer.user.companyInfo?.logo ?? ''
    const dateStr = formatDate(offer.createdAt)

    const logoHtml = logo
        ? `<img src="${esc(logo)}" alt="${esc(sellerName)} logo" class="header-logo">`
        : `<div class="header-logo-placeholder">${esc(sellerName)}</div>`

    const hasTestingOrTech = blocks.testing.enabled || blocks.technology.enabled
    const testingTechSection = hasTestingOrTech
        ? `
    <div style="display:grid;grid-template-columns:${blocks.testing.enabled && blocks.technology.enabled ? '1fr 1fr' : '1fr'};gap:6mm;margin-bottom:6mm;">
      ${renderTesting(blocks)}
      ${renderTechnology(blocks)}
    </div>`
        : ''

    return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Oferta ${esc(offer.number)} — ${esc(offer.title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --navy:       #0C1D56;
      --navy-mid:   #172A78;
      --orange:     #E8711A;
      --orange-dim: rgba(232,113,26,0.09);
      --orange-border: rgba(232,113,26,0.22);
      --grey-bg:    #F3F5FA;
      --grey-line:  #DDE1EE;
      --grey-text:  #697080;
      --text:       #101929;
      --white:      #FFFFFF;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #CDD2E2;
      font-family: 'Outfit', sans-serif;
      color: var(--text);
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      background: var(--white);
      margin: 16px auto;
      display: flex;
      flex-direction: column;
      box-shadow: 0 4px 32px rgba(0,0,0,0.18);
    }
    @media print {
      body { background: none; }
      .page { margin: 0; break-after: page; box-shadow: none; }
    }
    /* ── HEADER ── */
    .header {
      background: var(--navy); padding: 11mm 16mm 10mm;
      position: relative; overflow: hidden; flex-shrink: 0;
    }
    .header::after {
      content: ''; position: absolute; top: 0; right: 0; bottom: 0;
      width: 52mm; background: var(--navy-mid);
      clip-path: polygon(18% 0, 100% 0, 100% 100%, 0% 100%);
    }
    .header-decor {
      position: absolute; bottom: -8mm; right: 8mm;
      width: 28mm; height: 28mm;
      border: 6px solid rgba(255,255,255,0.04); border-radius: 50%; z-index: 1;
    }
    .header-decor2 {
      position: absolute; top: -6mm; right: 22mm;
      width: 16mm; height: 16mm;
      background: var(--orange); opacity: 0.12; border-radius: 50%; z-index: 1;
    }
    .header-left { position: relative; z-index: 2; }
    .header-tag {
      display: inline-flex; align-items: center; gap: 5px;
      background: var(--orange); color: white;
      font-size: 8.5px; font-weight: 700; letter-spacing: 1.8px;
      text-transform: uppercase; padding: 3px 10px; border-radius: 2px; margin-bottom: 8px;
    }
    .header-title { color: white; font-size: 25px; font-weight: 800; line-height: 1.15; }
    .header-subtitle { color: rgba(255,255,255,0.45); font-size: 10.5px; font-weight: 400; margin-top: 5px; }
    .header-meta { position: absolute; top: 11mm; right: 16mm; text-align: right; z-index: 3; }
    .header-meta .lbl { color: rgba(255,255,255,0.38); font-size: 7.5px; letter-spacing: 1.2px; text-transform: uppercase; }
    .header-meta .val { color: white; font-size: 12px; font-weight: 600; margin-top: 2px; }
    .header-meta .site { color: var(--orange); font-size: 9px; font-weight: 500; margin-top: 5px; opacity: 0.9; }
    .header-logo { display: block; height: 54px; width: auto; margin-bottom: 6px; margin-left: auto; }
    .header-logo-placeholder {
      display: block; height: 54px; line-height: 54px; text-align: right;
      color: white; font-size: 14px; font-weight: 700; margin-bottom: 6px;
    }
    /* ── BODY ── */
    .body { padding: 7mm 16mm; flex: 1; }
    /* Intro */
    .intro { padding-bottom: 5mm; border-bottom: 1px solid var(--grey-line); margin-bottom: 6mm; }
    .intro p { font-size: 11px; line-height: 1.78; color: var(--text); }
    .intro p + p { margin-top: 5px; }
    /* Section label */
    .sec { display: flex; align-items: center; gap: 7px; margin-bottom: 5px; }
    .sec .ico { font-size: 13px; line-height: 1; flex-shrink: 0; }
    .sec h2 {
      font-size: 11px; font-weight: 700; color: var(--navy);
      letter-spacing: 0.9px; text-transform: uppercase; white-space: nowrap;
    }
    .sec::after {
      content: ''; flex: 1; height: 1.5px;
      background: linear-gradient(to right, var(--orange) 0%, transparent 100%);
      opacity: 0.4; min-width: 10mm;
    }
    /* Demo */
    .demo-block {
      background: var(--grey-bg); border-left: 3px solid var(--orange);
      border-radius: 0 4px 4px 0; padding: 5mm 6mm; margin-bottom: 6mm;
    }
    .demo-body { font-size: 10.5px; line-height: 1.65; color: var(--text); margin-bottom: 5px; }
    .demo-url-row {
      display: flex; align-items: center; gap: 7px;
      background: white; border: 1px solid var(--grey-line); border-radius: 3px;
      padding: 4px 9px; margin: 4px 0;
    }
    .demo-url-row .arrow { font-size: 11px; flex-shrink: 0; }
    .demo-url-row a { font-family: 'Courier New', monospace; font-size: 9.5px; font-weight: 600; color: var(--navy); text-decoration: none; }
    .demo-warn {
      background: rgba(232,113,26,0.07); border: 1px solid rgba(232,113,26,0.2);
      border-radius: 3px; padding: 4px 8px; font-size: 9px; color: #7B3F0A; line-height: 1.55; margin: 5px 0;
    }
    .demo-note { font-size: 10px; color: var(--grey-text); line-height: 1.6; margin-top: 4px; font-style: italic; }
    /* Structure */
    .struct-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 3px; margin-bottom: 4px; }
    .struct-item { display: flex; align-items: flex-start; gap: 6px; background: var(--grey-bg); border-radius: 3px; padding: 4px 6px; }
    .struct-item .si { font-size: 11px; flex-shrink: 0; margin-top: 2px; }
    .struct-item .sn { font-size: 9.5px; font-weight: 600; color: var(--navy); }
    .struct-item .sd { font-size: 8px; color: var(--grey-text); margin-top: 1px; line-height: 1.35; }
    .struct-note { font-size: 9px; color: var(--grey-text); font-style: italic; margin-top: 4px; line-height: 1.5; }
    /* Scope */
    .scope-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3px; margin-top: 5px; }
    .scope-item {
      display: flex; align-items: flex-start; gap: 7px;
      background: var(--grey-bg); border-radius: 3px; padding: 4px 7px;
      font-size: 9.5px; line-height: 1.4; color: var(--text);
    }
    .scope-item.full { grid-column: span 2; }
    .chk {
      width: 14px; height: 14px; background: var(--orange);
      border-radius: 50%; flex-shrink: 0; margin-top: 1px;
      display: flex; align-items: center; justify-content: center;
    }
    .chk svg { width: 8px; height: 8px; }
    /* Testing */
    .test-intro { font-size: 10px; color: var(--text); line-height: 1.6; margin: 4px 0 5px; }
    .test-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3px; }
    .test-item { background: var(--navy); border-radius: 3px; padding: 5px 8px; display: flex; gap: 6px; align-items: flex-start; }
    .test-item .ti { font-size: 11px; flex-shrink: 0; margin-top: 1px; }
    .test-item .tt { font-size: 9.5px; color: rgba(255,255,255,0.75); line-height: 1.5; }
    .test-item .ts { font-weight: 600; color: white; }
    .test-note { font-size: 9px; color: var(--grey-text); font-style: italic; margin-top: 5px; line-height: 1.5; }
    /* Technology */
    .tech-body { font-size: 10px; line-height: 1.65; color: var(--text); margin: 4px 0 5px; }
    .tech-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
    .tech-card { border: 1px solid var(--grey-line); border-radius: 4px; padding: 5px 8px; }
    .tech-card.prime { border-color: rgba(12,29,86,0.3); background: rgba(12,29,86,0.02); }
    .tech-card .tc-title { font-size: 9.5px; font-weight: 700; color: var(--navy); margin-bottom: 4px; }
    .tech-card .tc-url { display: flex; gap: 4px; font-size: 8.5px; color: var(--grey-text); margin-top: 2px; align-items: baseline; }
    .tech-card .tc-url a { font-family: 'Courier New', monospace; font-size: 8px; color: var(--navy-mid); font-weight: 600; text-decoration: none; }
    /* Pricing */
    .pricing {
      background: var(--navy); border-radius: 6px; padding: 6mm 7mm 5mm;
      margin: 6mm 0 5mm; position: relative; overflow: hidden;
    }
    .pricing::after {
      content: ''; position: absolute; top: 0; right: 0; bottom: 0;
      width: 38%; background: var(--navy-mid);
      clip-path: polygon(22% 0, 100% 0, 100% 100%, 0% 100%);
    }
    .pricing-header {
      display: flex; align-items: center; gap: 8px; margin-bottom: 4mm;
      position: relative; z-index: 1;
    }
    .pricing-header .ph-label {
      font-size: 9.5px; font-weight: 700; letter-spacing: 1.5px;
      text-transform: uppercase; color: rgba(255,255,255,0.45);
    }
    .pricing-header::before {
      content: ''; display: block; width: 3px; height: 14px;
      background: var(--orange); border-radius: 2px; flex-shrink: 0;
    }
    .pricing-cards { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4mm; position: relative; z-index: 1; }
    .p-card {
      background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.09);
      border-radius: 4px; padding: 4mm;
    }
    .p-card.hot { background: var(--orange); border-color: var(--orange); }
    .p-card .pc-label { font-size: 8px; font-weight: 600; letter-spacing: 1.1px; text-transform: uppercase; color: rgba(255,255,255,0.45); margin-bottom: 6px; }
    .p-card.hot .pc-label { color: rgba(255,255,255,0.7); }
    .p-card .pc-val { font-size: 12px; font-weight: 700; color: white; line-height: 1.2; }
    .p-card.hot .pc-val { font-size: 28px; font-weight: 800; line-height: 1; }
    .p-card .pc-sub { font-size: 9px; color: rgba(255,255,255,0.5); margin-top: 4px; line-height: 1.45; }
    .p-card.hot .pc-sub { color: rgba(255,255,255,0.8); font-weight: 600; font-size: 10px; }
    /* About + CTA */
    .bottom-row { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; }
    .about-box { background: var(--grey-bg); border-radius: 4px; padding: 5mm; }
    .about-url { display: block; font-family: 'Courier New', monospace; font-size: 10.5px; font-weight: 700; color: var(--navy); text-decoration: none; margin-top: 4px; }
    .cta-box {
      background: var(--orange-dim); border: 1px solid var(--orange-border);
      border-radius: 4px; padding: 5mm; display: flex; align-items: center;
    }
    .cta-box p { font-size: 11px; line-height: 1.7; color: var(--text); }
    /* Footer */
    .footer {
      background: var(--navy); padding: 3.5mm 16mm;
      display: flex; align-items: center; gap: 5mm; flex-shrink: 0;
    }
    .footer-left { font-size: 8.5px; color: rgba(255,255,255,0.38); flex: 1; }
    .footer-left strong { color: rgba(255,255,255,0.65); font-weight: 500; }
    .footer-divider { width: 1px; height: 14px; background: rgba(255,255,255,0.15); flex-shrink: 0; }
    .footer-right { font-size: 8.5px; color: rgba(255,255,255,0.38); text-align: right; }
    .footer-right strong { color: var(--orange); font-weight: 600; }
    .page-strip { height: 4px; background: var(--navy); flex-shrink: 0; position: relative; }
    .page-strip::after {
      content: ''; position: absolute; bottom: 0; left: 0;
      width: 28mm; height: 2px; background: var(--orange);
    }
  </style>
</head>
<body>

<!-- PAGE 1 -->
<div class="page">
  <header class="header">
    <div class="header-decor"></div>
    <div class="header-decor2"></div>
    <div class="header-left">
      <div class="header-tag">Oferta handlowa</div>
      <h1 class="header-title">${esc(offer.title)}</h1>
      <div class="header-subtitle">${esc(clientLabel)}</div>
    </div>
    <div class="header-meta">
      ${logoHtml}
      <div class="lbl">Data oferty</div>
      <div class="val">${dateStr}</div>
      ${website ? `<div class="site">${esc(website.replace(/^https?:\/\//, ''))}</div>` : ''}
    </div>
  </header>

  <div class="body">
    ${renderIntro(blocks)}
    ${renderDemo(blocks)}
    ${renderStructure(blocks)}
  </div>

  <footer class="footer">
    <div class="footer-left">Oferta ${esc(offer.number)} przygotowana dla: <strong>${esc(offer.client.name)}</strong> · <strong>Strona 1 / 2</strong></div>
    <div class="footer-divider"></div>
    <div class="footer-right">${website ? `<strong>${esc(website.replace(/^https?:\/\//, ''))}</strong> · ` : ''}Dokument poufny</div>
  </footer>
</div>

<!-- PAGE 2 -->
<div class="page">
  <div class="page-strip"></div>

  <div class="body" style="padding-top:6mm;">
    ${renderScope(blocks)}
    ${testingTechSection}
    ${renderPricingBox(offer, blocks)}
    ${renderAbout(offer, blocks)}
  </div>

  <footer class="footer">
    <div class="footer-left">Oferta ${esc(offer.number)} · <strong>Strona 2 / 2</strong></div>
    <div class="footer-divider"></div>
    <div class="footer-right">${website ? `<strong>${esc(website.replace(/^https?:\/\//, ''))}</strong> · ` : ''}Wszystkie ceny brutto · ${new Date().getFullYear()}</div>
  </footer>
</div>

</body>
</html>`
}

// src/lib/pdf/support-html.ts
// Faithfully reproduces the "Wsparcie" (IT Support / SLA) template.
// Design: ocean navy #0F4C75 + emerald #10B981, Outfit font, mint backgrounds.

import { buildHtmlDocument, escapeHtml as esc } from './html-shell'
import { withPageBreakAfter } from './section-layout'
import type { SupportBlocks } from './support-blocks'

export interface SupportOfferData {
    offerNumber?: string
    offerDate?: string
    validUntil?: string
    clientName?: string
    userLogoUrl?: string
    userLogoDarkUrl?: string
    userCompanyName?: string
    userEmail?: string
    userPhone?: string
    userWebsite?: string
}

// ── Utility ───────────────────────────────────────────────────────────────────

function editorWrap(editorMode: boolean, key: string, inner: string): string {
    if (!editorMode) return inner
    return `<div class="sq-block" data-block-key="${key}" onclick="window.parent.postMessage({type:'sq:editBlock',blockKey:'${key}'},\'*\')" title="Kliknij, aby edytować">${inner}</div>`
}

// ── Base CSS ──────────────────────────────────────────────────────────────────

function baseCss(editorMode: boolean): string {
    return `
*{box-sizing:border-box;}
body{margin:0;background:#E2E8F0;font-family:'Outfit Variable','Outfit',system-ui,sans-serif;color:#0F172A;-webkit-font-smoothing:antialiased;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
.lnk{color:#10B981;text-decoration:none;font-weight:600;}
.lnk:hover{text-decoration:underline;}
.badge{display:inline-flex;align-items:center;gap:7px;padding:5px 12px;border-radius:999px;font-size:13px;font-weight:600;white-space:nowrap;}
.badge::before{content:'';width:8px;height:8px;border-radius:999px;background:currentColor;flex:none;}
.status-critical{background:#FEE2E2;color:#DC2626;}
.status-high{background:#FFEDD5;color:#EA580C;}
.status-medium{background:#FEF9C3;color:#CA8A04;}
.status-ok{background:#DCFCE7;color:#16A34A;}
.wm{position:absolute;top:18px;right:34px;font-size:120px;font-weight:700;line-height:1;color:#0F4C75;opacity:0.04;pointer-events:none;z-index:0;letter-spacing:-4px;}
.wm-l{color:#fff;opacity:0.05;}
.mono{font-family:ui-monospace,'SF Mono',Menlo,monospace;}
@media (max-width:768px){
  .page{padding:0 !important;}
  .doc{box-shadow:none !important;}
  .sec{padding:36px 22px !important;}
  .two-col,.pkg-grid,.cover-grid,.flow-grid,.terms-grid,.cover-top,.foot-grid{grid-template-columns:1fr !important;}
  .pkg-feat{transform:none !important;}
  .sla-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;}
  .sla-table{min-width:680px;}
  .wm{font-size:80px;top:10px;right:18px;}
  .cover-mon{margin-top:8px;}
}
@media print{
  body{background:#fff;}
  .page{padding:0 !important;}
  .doc{box-shadow:none !important;max-width:100% !important;border-radius:0 !important;overflow:visible !important;}
  .cover-pattern{display:none !important;}
  .page-break{page-break-before:always;}
  /* Sections are allowed to flow across pages; only individual cards/rows stay atomic */
  .pkg-card,.prio-card,.sla-table tr{break-inside:avoid;}
  /* Cap large headings so stress-filled text doesn't take up an entire page */
  .sec h2, .cover h1 { font-size: 24px !important; line-height: 1.35 !important; }
  thead{display:table-header-group;}
  @page{size:A4;margin:10mm 0;}
  .cover{min-height:100vh;}
}
${editorMode ? `
.sq-block{cursor:pointer;position:relative;transition:outline .15s;}
.sq-block:hover{outline:2px solid #0F4C75;outline-offset:2px;border-radius:4px;}
.sq-block:hover::after{content:'\\2712 Edytuj';position:absolute;top:8px;right:8px;background:#0F4C75;color:#fff;font-size:11px;font-weight:600;padding:3px 9px;border-radius:4px;z-index:99;pointer-events:none;}
` : ''}
`
}

// ── S1 — Cover ────────────────────────────────────────────────────────────────

function renderCover(b: SupportBlocks, offer: SupportOfferData, editorMode: boolean): string {
    const offerNum = esc(offer.offerNumber ?? '2025/SLA/001')
    const offerDate = esc(offer.offerDate ?? '')
    const clientName = esc(offer.clientName ?? 'NAZWA FIRMY')
    const website = esc(b.cover.websiteUrl || offer.userWebsite || 'www.twoja-strona.pl')
    const logoUrl = offer.userLogoDarkUrl || offer.userLogoUrl

    const rows = b.cover.monitorRows.map(r =>
        `<div style="display:flex;align-items:baseline;gap:8px;"><span style="color:#10B981;">&#9679;</span><span>${esc(r.label)}</span><span style="flex:1;border-bottom:1.5px dotted rgba(255,255,255,0.18);"></span><span style="color:#10B981;font-weight:600;">${esc(r.status)}</span></div>`
    ).join('')

    const pills = b.cover.pills.map(p =>
        `<div style="display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.14);padding:9px 18px;border-radius:999px;font-size:14px;font-weight:500;">${esc(p)}</div>`
    ).join('')

    const logoEl = logoUrl
        ? `<img src="${esc(logoUrl)}" alt="logo" style="width:46px;height:46px;border-radius:10px;object-fit:contain;">`
        : `<div style="width:46px;height:46px;border-radius:10px;border:1.5px dashed rgba(255,255,255,0.4);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;letter-spacing:1px;color:rgba(255,255,255,0.85);">LOGO</div>`

    const inner = `
<section class="cover pdf-full-bleed" style="position:relative;background:#0F4C75;color:#fff;padding:40px 48px 44px;overflow:hidden;">
  <div class="cover-pattern" style="position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,0.05) 1.4px,transparent 1.4px);background-size:22px 22px;z-index:0;"></div>
  <div style="position:relative;z-index:1;">
    <div class="cover-top" style="display:grid;grid-template-columns:1fr auto;align-items:center;gap:16px;margin-bottom:44px;">
      <div style="display:flex;align-items:center;gap:14px;">${logoEl}<a href="https://${website}" class="lnk" style="font-size:14px;">${website}</a></div>
      <div style="display:inline-flex;align-items:center;gap:12px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.16);padding:8px 16px;border-radius:999px;font-size:13px;"><span style="opacity:.7;">Oferta nr</span><span style="font-weight:600;">${offerNum}</span><span style="opacity:.35;">&#183;</span><span style="opacity:.7;">${offerDate}</span></div>
    </div>
    <div class="cover-grid" style="display:grid;grid-template-columns:1.05fr 0.95fr;gap:40px;align-items:center;">
      <div>
        <div style="font-size:13px;font-weight:600;letter-spacing:3px;color:#10B981;margin-bottom:18px;">${esc(b.cover.heroTagline)}</div>
        <h1 style="margin:0;font-size:46px;line-height:1.06;font-weight:700;letter-spacing:-1px;">${esc(b.cover.heroTitle)}<br><span style="color:#10B981;">${esc(b.cover.heroTitleSuffix)}</span></h1>
        <p style="margin:20px 0 0;font-style:italic;color:rgba(255,255,255,0.7);font-size:16px;">Dla: <strong>${clientName}</strong></p>
        <p style="margin:18px 0 0;color:rgba(255,255,255,0.88);font-size:18px;line-height:1.5;max-width:30ch;">${esc(b.cover.heroSubtitle)}</p>
      </div>
      <div class="cover-mon" style="background:#0A3A5C;border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:20px;box-shadow:0 20px 40px rgba(0,0,0,0.25);">
        <div style="display:flex;gap:6px;margin-bottom:16px;">
          <span style="width:10px;height:10px;border-radius:999px;background:#EF4444;"></span>
          <span style="width:10px;height:10px;border-radius:999px;background:#F59E0B;"></span>
          <span style="width:10px;height:10px;border-radius:999px;background:#10B981;"></span>
          <span style="margin-left:auto;font-size:11px;color:rgba(255,255,255,0.4);letter-spacing:1px;">${esc(b.cover.monitorLabel)}</span>
        </div>
        <div class="mono" style="display:flex;flex-direction:column;gap:11px;font-size:13px;color:rgba(255,255,255,0.85);">${rows}</div>
        <div style="margin-top:18px;">
          <div style="display:flex;justify-content:space-between;font-size:12px;color:rgba(255,255,255,0.6);margin-bottom:6px;"><span>${esc(b.cover.availabilityLabel)}</span><span style="color:#10B981;font-weight:600;">${esc(b.cover.availabilityValue)}</span></div>
          <div style="height:7px;border-radius:999px;background:rgba(255,255,255,0.1);overflow:hidden;"><div style="height:100%;width:99%;background:#10B981;border-radius:999px;"></div></div>
        </div>
      </div>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:40px;">${pills}</div>
  </div>
</section>`
    return editorWrap(editorMode, 'cover', inner)
}

// ── S2 — Benefits ─────────────────────────────────────────────────────────────

function renderBenefits(b: SupportBlocks['benefits'], editorMode: boolean): string {
    const withoutRows = b.withoutItems.map(it =>
        `<div style="display:flex;gap:12px;align-items:flex-start;"><span style="color:#EF4444;font-weight:700;font-size:18px;line-height:1.3;flex:none;">&#10007;</span><div><div style="font-weight:600;color:#0F172A;">${esc(it.title)}</div><div style="font-size:14px;color:#475569;">${esc(it.description)}</div></div></div>`
    ).join('')

    const withRows = b.withItems.map(it =>
        `<div style="display:flex;gap:12px;align-items:flex-start;"><span style="color:#16A34A;font-weight:700;font-size:18px;line-height:1.3;flex:none;">&#10003;</span><div><div style="font-weight:600;color:#0F172A;">${esc(it.title)}</div><div style="font-size:14px;color:#475569;">${esc(it.description)}</div></div></div>`
    ).join('')

    const inner = `
<section class="sec" style="position:relative;background:#F0FDF9;padding:56px 48px;overflow:hidden;">
  <span class="wm">02</span>
  <div style="position:relative;z-index:1;">
    <h2 style="margin:0 0 6px;font-size:30px;font-weight:700;letter-spacing:-0.5px;color:#0F172A;">${esc(b.sectionTitle)}</h2>
    <p style="margin:0 0 32px;color:#475569;font-size:16px;">${esc(b.sectionLead)}</p>
    <div class="two-col" style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
      <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:12px;padding:26px;">
        <div style="font-weight:700;font-size:17px;color:#0F172A;margin-bottom:18px;">${esc(b.withoutTitle)}</div>
        <div style="display:flex;flex-direction:column;gap:16px;">${withoutRows}</div>
      </div>
      <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:26px;">
        <div style="font-weight:700;font-size:17px;color:#0F172A;margin-bottom:18px;">${esc(b.withTitle)}</div>
        <div style="display:flex;flex-direction:column;gap:16px;">${withRows}</div>
      </div>
    </div>
    <div style="margin-top:24px;background:#0F4C75;color:#fff;border-radius:12px;padding:32px 36px;text-align:center;">
      <p style="margin:0 auto;font-style:italic;font-size:21px;line-height:1.5;font-weight:500;max-width:60ch;">${esc(b.quote)}</p>
    </div>
  </div>
</section>`
    return editorWrap(editorMode, 'benefits', inner)
}

// ── S3 — Packages ─────────────────────────────────────────────────────────────

function renderPlan(plan: SupportBlocks['packages']['plans'][0]): string {
    const features = plan.features.map(f =>
        f.included
            ? `<div style="display:flex;gap:10px;color:#0F172A;"><span style="color:#16A34A;font-weight:700;">&#10003;</span><span>${esc(f.label)}</span></div>`
            : `<div style="display:flex;gap:10px;color:#94A3B8;"><span style="font-weight:700;">&#8212;</span><span>${esc(f.label)}</span></div>`
    ).join('')

    const isPremium = plan.name.toUpperCase().includes('PREMIUM')

    if (plan.highlighted) {
        return `
<div class="pkg-card pkg-feat" style="position:relative;border:2px solid #0F4C75;border-radius:12px;overflow:hidden;box-shadow:0 12px 40px rgba(15,76,117,0.2);transform:scale(1.03);">
  <div style="position:absolute;top:14px;left:50%;transform:translateX(-50%);background:#10B981;color:#fff;font-size:11px;font-weight:700;letter-spacing:0.5px;padding:5px 14px;border-radius:999px;white-space:nowrap;z-index:2;box-shadow:0 4px 12px rgba(16,185,129,0.4);">&#9733; NAJPOPULARNIEJSZY</div>
  <div style="background:linear-gradient(135deg,#0F4C75,#1a6a9a);padding:34px 22px 20px;color:#fff;">
    <div style="font-weight:700;letter-spacing:1px;font-size:15px;">${esc(plan.name)}</div>
    <div style="font-size:13px;color:rgba(255,255,255,0.75);margin-top:4px;min-height:34px;">${esc(plan.tagline)}</div>
    <div style="margin-top:14px;font-size:30px;font-weight:700;">${esc(plan.price)}</div>
    <div style="font-size:12px;color:rgba(255,255,255,0.55);margin-top:2px;">netto + VAT</div>
  </div>
  <div style="padding:22px;background:#fff;">
    <div style="display:flex;flex-direction:column;gap:11px;font-size:14px;">${features}</div>
    <a class="btn" style="display:block;margin-top:22px;background:#0F4C75;color:#fff;box-shadow:0 6px 18px rgba(15,76,117,0.25);text-align:center;padding:13px 18px;border-radius:8px;font-weight:600;font-size:15px;text-decoration:none;">${esc(plan.ctaLabel)}</a>
  </div>
</div>`
    }

    if (isPremium) {
        return `
<div class="pkg-card" style="border:1px solid #E2E8F0;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(15,76,117,0.06);">
  <div style="background:#0F172A;padding:22px 22px 20px;color:#fff;">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
      <div style="font-weight:700;letter-spacing:1px;font-size:15px;">${esc(plan.name)}</div>
      <span style="font-size:10px;font-weight:700;letter-spacing:0.5px;color:#0F172A;background:#FCD34D;padding:4px 10px;border-radius:999px;white-space:nowrap;">&#9670; PE&#321;NA OCHRONA</span>
    </div>
    <div style="font-size:13px;color:rgba(255,255,255,0.7);margin-top:6px;min-height:34px;">${esc(plan.tagline)}</div>
    <div style="margin-top:14px;font-size:30px;font-weight:700;color:#FCD34D;">${esc(plan.price)}</div>
    <div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:2px;">netto + VAT</div>
  </div>
  <div style="padding:22px;">
    <div style="display:flex;flex-direction:column;gap:11px;font-size:14px;">${features}</div>
    <a class="btn" style="display:block;margin-top:22px;background:#0F172A;color:#fff;text-align:center;padding:13px 18px;border-radius:8px;font-weight:600;font-size:15px;text-decoration:none;">${esc(plan.ctaLabel)}</a>
  </div>
</div>`
    }

    return `
<div class="pkg-card" style="border:1px solid #E2E8F0;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(15,76,117,0.06);">
  <div style="background:#F8FAFC;padding:22px 22px 20px;border-bottom:1px solid #E2E8F0;">
    <div style="font-weight:700;letter-spacing:1px;font-size:15px;color:#0F172A;">${esc(plan.name)}</div>
    <div style="font-size:13px;color:#475569;margin-top:4px;min-height:34px;">${esc(plan.tagline)}</div>
    <div style="margin-top:14px;font-size:30px;font-weight:700;color:#0F4C75;">${esc(plan.price)}</div>
    <div style="font-size:12px;color:#94A3B8;margin-top:2px;">netto + VAT</div>
  </div>
  <div style="padding:22px;">
    <div style="display:flex;flex-direction:column;gap:11px;font-size:14px;">${features}</div>
    <a class="btn" style="display:block;margin-top:22px;background:#fff;color:#0F4C75;border:1.5px solid #0F4C75;text-align:center;padding:13px 18px;border-radius:8px;font-weight:600;font-size:15px;text-decoration:none;">${esc(plan.ctaLabel)}</a>
  </div>
</div>`
}

function renderPackages(b: SupportBlocks['packages'], editorMode: boolean): string {
    const plansHtml = b.plans.map(p => renderPlan(p)).join('')
    const inner = `
<section class="sec page-break" style="position:relative;background:#fff;padding:60px 48px;overflow:hidden;">
  <span class="wm">03</span>
  <div style="position:relative;z-index:1;">
    <h2 style="margin:0 0 6px;font-size:30px;font-weight:700;letter-spacing:-0.5px;color:#0F172A;">${esc(b.sectionTitle)}</h2>
    <p style="margin:0 0 38px;color:#475569;font-size:16px;">${esc(b.sectionLead)}</p>
    <div class="pkg-grid" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:18px;align-items:start;">${plansHtml}</div>
    <p style="margin:28px 0 0;text-align:center;font-style:italic;color:#475569;font-size:14px;">Nie wiesz kt&#243;ry wybra&#263;? <a href="mailto:${esc(b.contactEmail)}" class="lnk">${esc(b.contactEmail)}</a> &#8212; pomo&#380;e dobrze dobra&#263; pakiet.</p>
  </div>
</section>`
    return editorWrap(editorMode, 'packages', inner)
}

// ── S4 — Scope ────────────────────────────────────────────────────────────────

function renderScope(b: SupportBlocks['scope'], editorMode: boolean): string {
    const includedRows = b.included.map(it =>
        `<div style="display:flex;gap:11px;"><span style="color:#16A34A;font-weight:700;flex:none;">&#10003;</span><div><div style="font-weight:600;color:#0F172A;font-size:15px;">${esc(it.title)}</div><div style="font-size:13px;color:#475569;">${esc(it.description)}</div></div></div>`
    ).join('')

    const excludedRows = b.excluded.map(it =>
        `<div style="display:flex;gap:11px;"><span style="color:#94A3B8;font-weight:700;flex:none;">&#10007;</span><div><div style="font-weight:600;color:#0F172A;font-size:15px;">${esc(it.title)}</div><div style="font-size:13px;color:#475569;">${esc(it.description)}</div></div></div>`
    ).join('')

    const inner = `
<section class="sec" style="position:relative;background:#F0FDF9;padding:56px 48px;overflow:hidden;">
  <span class="wm">04</span>
  <div style="position:relative;z-index:1;">
    <h2 style="margin:0 0 6px;font-size:30px;font-weight:700;letter-spacing:-0.5px;color:#0F172A;">${esc(b.sectionTitle)}</h2>
    <p style="margin:0 0 32px;color:#475569;font-size:16px;">${esc(b.sectionLead)}</p>
    <div class="two-col" style="display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start;">
      <div style="background:#fff;border:1px solid #E2E8F0;border-radius:12px;padding:26px;box-shadow:0 4px 20px rgba(15,76,117,0.06);">
        <div style="font-weight:700;font-size:16px;color:#16A34A;margin-bottom:18px;">${esc(b.includedTitle)}</div>
        <div style="display:flex;flex-direction:column;gap:15px;">${includedRows}</div>
      </div>
      <div style="background:#fff;border:1px solid #E2E8F0;border-radius:12px;padding:26px;box-shadow:0 4px 20px rgba(15,76,117,0.06);">
        <div style="font-weight:700;font-size:16px;color:#EF4444;margin-bottom:18px;">${esc(b.excludedTitle)}</div>
        <div style="display:flex;flex-direction:column;gap:15px;">${excludedRows}</div>
        <div style="margin-top:20px;background:#FFFBEB;border-left:4px solid #F59E0B;border-radius:0 8px 8px 0;padding:14px 16px;font-style:italic;color:#475569;font-size:13px;">${esc(b.extraNote)}</div>
      </div>
    </div>
  </div>
</section>`
    return editorWrap(editorMode, 'scope', inner)
}

// ── S5 — SLA ─────────────────────────────────────────────────────────────────

const SLA_COLORS: Record<string, string> = {
    critical: '#EF4444',
    high: '#F59E0B',
    medium: '#EAB308',
    low: '#16A34A',
}
const SLA_BADGE_CLASS: Record<string, string> = {
    critical: 'status-critical',
    high: 'status-high',
    medium: 'status-medium',
    low: 'status-ok',
}

function renderSla(b: SupportBlocks['sla'], editorMode: boolean): string {
    const priorityCards = b.rows.map(row =>
        `<div class="prio-card" style="border:1px solid #E2E8F0;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(15,76,117,0.05);">
          <div style="height:6px;background:${SLA_COLORS[row.colorClass] ?? '#94A3B8'};"></div>
          <div style="padding:18px 20px;">
            <div style="font-weight:700;color:#0F172A;font-size:15px;">${esc(row.icon)} ${esc(row.priority.toUpperCase())}</div>
            <div style="font-size:14px;color:#475569;margin-top:6px;">${esc(row.description)}</div>
            <div style="font-size:12.5px;color:#94A3B8;margin-top:8px;">${esc(row.examples)}</div>
          </div>
        </div>`
    ).join('')

    const tableRows = b.rows.map((row, i) =>
        `<tr style="background:${i % 2 === 0 ? '#fff' : '#F8FAFC'};border-top:1px solid #EEF2F6;">
          <td style="padding:13px 16px;"><span class="badge ${SLA_BADGE_CLASS[row.colorClass] ?? ''}">${esc(row.priority)}</span></td>
          <td style="padding:13px 16px;color:#475569;">${esc(row.basic)}</td>
          <td style="padding:13px 16px;color:#475569;">${esc(row.standard)}</td>
          <td style="padding:13px 16px;color:#475569;">${esc(row.premium)}</td>
          <td style="padding:13px 16px;color:#475569;">${esc(row.resolution)}</td>
        </tr>`
    ).join('')

    const inner = `
<section class="sec page-break" style="position:relative;background:#fff;padding:60px 48px;overflow:hidden;">
  <span class="wm">05</span>
  <div style="position:relative;z-index:1;">
    <h2 style="margin:0 0 6px;font-size:30px;font-weight:700;letter-spacing:-0.5px;color:#0F172A;">${esc(b.sectionTitle)}</h2>
    <p style="margin:0 0 30px;color:#475569;font-size:16px;max-width:70ch;">${esc(b.sectionLead)}</p>
    <div class="two-col" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:30px;">${priorityCards}</div>
    <div class="sla-wrap" style="border:1px solid #E2E8F0;border-radius:8px;overflow:hidden;">
      <table class="sla-table" style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#0F4C75;color:#fff;text-align:left;">
            <th style="padding:14px 16px;font-weight:600;">Priorytet</th>
            <th style="padding:14px 16px;font-weight:600;">Reakcja &#8212; Basic</th>
            <th style="padding:14px 16px;font-weight:600;">Reakcja &#8212; Standard</th>
            <th style="padding:14px 16px;font-weight:600;">Reakcja &#8212; Premium</th>
            <th style="padding:14px 16px;font-weight:600;">Cel rozwi&#261;zania</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
      <div style="background:#F8FAFC;border-top:1px solid #EEF2F6;padding:11px 16px;font-size:12.5px;color:#94A3B8;">${esc(b.footnote)}</div>
    </div>
    <div style="margin-top:22px;background:#EFF6FF;border-left:4px solid #0F4C75;border-radius:0 8px 8px 0;padding:16px 18px;font-size:14px;color:#334155;">&#8505;&#65039; ${esc(b.workingHoursNote)}</div>
  </div>
</section>`
    return editorWrap(editorMode, 'sla', inner)
}

// ── S6 — Process ─────────────────────────────────────────────────────────────

function renderProcess(b: SupportBlocks['process'], editorMode: boolean): string {
    const stepColors = ['#0F4C75', '#10B981', '#0F4C75', '#0F4C75', '#10B981']
    const steps = b.steps.map((step, i) => {
        const isLast = i === b.steps.length - 1
        const circleColor = stepColors[i] ?? '#0F4C75'
        const connector = isLast ? '' : `<div style="flex:1;width:2px;border-left:2px dashed #10B981;min-height:24px;"></div>`
        return `
<div style="display:flex;gap:18px;">
  <div style="display:flex;flex-direction:column;align-items:center;flex:none;">
    <div style="width:42px;height:42px;border-radius:999px;background:${circleColor};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px;">${i + 1}</div>
    ${connector}
  </div>
  <div style="padding-bottom:${isLast ? '0' : '26px'};">
    <div style="font-weight:700;color:#0F172A;font-size:16px;">${esc(step.emoji)} ${esc(step.title)}</div>
    <div style="font-size:14px;color:#475569;margin-top:4px;">${esc(step.description)}</div>
  </div>
</div>`
    }).join('')

    const channelRows = b.channels.map(ch =>
        `<tr style="border-top:1px solid #EEF2F6;"><td style="padding:11px 8px 11px 0;font-weight:600;">${esc(ch.name)}</td><td style="padding:11px 8px;">${esc(ch.availability)}</td><td style="padding:11px 0;">${esc(ch.priority)}</td></tr>`
    ).join('')

    const inner = `
<section class="sec" style="position:relative;background:#F0FDF9;padding:56px 48px;overflow:hidden;">
  <span class="wm">06</span>
  <div style="position:relative;z-index:1;">
    <h2 style="margin:0 0 32px;font-size:30px;font-weight:700;letter-spacing:-0.5px;color:#0F172A;">${esc(b.sectionTitle)}</h2>
    <div class="flow-grid" style="display:grid;grid-template-columns:1.5fr 1fr;gap:32px;align-items:start;">
      <div style="display:flex;flex-direction:column;">${steps}</div>
      <div style="background:#fff;border:1px solid #E2E8F0;border-radius:12px;padding:22px;box-shadow:0 4px 20px rgba(15,76,117,0.06);">
        <div style="font-weight:700;color:#0F172A;font-size:16px;margin-bottom:16px;">Kana&#322;y zg&#322;osze&#324;</div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead><tr style="text-align:left;color:#94A3B8;"><th style="padding:0 0 10px;font-weight:600;">Kana&#322;</th><th style="padding:0 0 10px;font-weight:600;">Dost&#281;pno&#347;&#263;</th><th style="padding:0 0 10px;font-weight:600;">Priorytet</th></tr></thead>
          <tbody style="color:#334155;">${channelRows}</tbody>
        </table>
        <div style="margin-top:16px;background:#F0FDF9;border-radius:8px;padding:14px;font-size:13px;color:#0F4C75;">${esc(b.channelsNote)}</div>
      </div>
    </div>
  </div>
</section>`
    return editorWrap(editorMode, 'process', inner)
}

// ── S7 — Pricing ─────────────────────────────────────────────────────────────

function renderPricing(b: SupportBlocks['pricing'], editorMode: boolean): string {
    const pkgs = [b.basicPricing, b.standardPricing, b.premiumPricing]

    const rows7a = [
        { label: 'Cena miesi&#281;czna', vals: pkgs.map(p => p.monthlyPrice) },
        { label: 'Godziny w puli', vals: pkgs.map(p => p.hours) },
        { label: 'Dodatkowa godzina poza pul&#261;', vals: pkgs.map(p => p.extraHourRate) },
        { label: 'Okres wypowiedzenia', vals: pkgs.map(p => p.noticePeriod) },
        { label: 'Dost&#281;pno&#347;&#263; weekendowa', vals: pkgs.map(p => p.weekendAvailability ? '&#10003; Tak' : '&#8212;') },
    ]

    const tableRows = rows7a.map((row, ri) => {
        const tds = row.vals.map((v, ci) => {
            const isStd = ci === 1
            const isNo = v === '&#8212;'
            const isYes = v === '&#10003; Tak'
            const color = isNo ? '#94A3B8' : isYes ? '#16A34A' : '#334155'
            return `<td style="padding:13px 16px;${isStd ? 'background:#F0FDF9;font-weight:600;' : ''}color:${color};">${v}</td>`
        }).join('')
        const bg = ri % 2 !== 0 ? 'background:#F8FAFC;' : ''
        return `<tr style="${bg}border-top:1px solid #EEF2F6;"><td style="padding:13px 16px;font-weight:600;color:#0F172A;">${row.label}</td>${tds}</tr>`
    }).join('')

    const termsGrid = b.terms.map(t =>
        `<div style="display:flex;gap:14px;"><div style="font-size:24px;line-height:1;flex:none;">${esc(t.icon)}</div><div><div style="font-weight:600;color:#0F172A;">${esc(t.title)}</div><div style="font-size:14px;color:#475569;">${esc(t.value)}</div></div></div>`
    ).join('')

    const reportItems = b.reportItems.map(item =>
        `<div style="display:flex;gap:10px;font-size:14px;color:#334155;"><span style="color:#10B981;font-weight:700;">&#10003;</span>${esc(item)}</div>`
    ).join('')

    const inner = `
<section class="sec page-break" style="position:relative;background:#fff;padding:60px 48px;overflow:hidden;">
  <span class="wm">07</span>
  <div style="position:relative;z-index:1;">
    <h2 style="margin:0 0 30px;font-size:30px;font-weight:700;letter-spacing:-0.5px;color:#0F172A;">${esc(b.sectionTitle)}</h2>

    <div style="font-size:13px;font-weight:700;letter-spacing:1.5px;color:#0F4C75;margin-bottom:14px;">7A &#183; ZESTAWIENIE CEN</div>
    <div class="sla-wrap" style="border:1px solid #E2E8F0;border-radius:8px;overflow:hidden;margin-bottom:14px;">
      <table class="sla-table" style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#0F4C75;color:#fff;text-align:left;">
            <th style="padding:14px 16px;font-weight:600;"></th>
            <th style="padding:14px 16px;font-weight:600;">Basic</th>
            <th style="padding:14px 16px;font-weight:600;background:#0d4368;">Standard &#9733;</th>
            <th style="padding:14px 16px;font-weight:600;">Premium</th>
          </tr>
        </thead>
        <tbody style="color:#334155;">${tableRows}</tbody>
      </table>
    </div>
    <p style="margin:0 0 36px;font-size:13px;color:#94A3B8;">Faktury wystawiane do ${esc(b.invoiceDay)} dnia ka&#380;dego miesi&#261;ca. Forma p&#322;atno&#347;ci: przelew.</p>

    <div style="font-size:13px;font-weight:700;letter-spacing:1.5px;color:#0F4C75;margin-bottom:18px;">7B &#183; WARUNKI UMOWY</div>
    <div class="terms-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:18px 28px;margin-bottom:38px;">${termsGrid}</div>

    <div style="font-size:13px;font-weight:700;letter-spacing:1.5px;color:#0F4C75;margin-bottom:14px;">7C &#183; RAPORTOWANIE MIESI&#280;CZNE</div>
    <div style="background:#F8FAFC;border-left:4px solid #10B981;border-radius:0 12px 12px 0;padding:24px 26px;">
      <div style="font-weight:700;color:#0F172A;font-size:17px;margin-bottom:16px;">Co otrzymujesz co miesi&#261;c</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">${reportItems}</div>
      <div style="margin-top:18px;font-style:italic;color:#94A3B8;font-size:13px;">Raport wysy&#322;any do ${esc(b.reportDay)} dnia nast&#281;pnego miesi&#261;ca na adres ${esc(b.reportEmail)}.</div>
    </div>
  </div>
</section>`
    return editorWrap(editorMode, 'pricing', inner)
}

// ── S8 — Footer ───────────────────────────────────────────────────────────────

function renderFooter(b: SupportBlocks, offer: SupportOfferData, editorMode: boolean): string {
    const foot = b.footer
    const offerNum = esc(offer.offerNumber ?? '2025/SLA/001')
    const offerDate = esc(offer.offerDate ?? '')
    const validUntil = esc(offer.validUntil ?? foot.validityDate)
    const logoUrl = offer.userLogoDarkUrl || offer.userLogoUrl

    const logoEl = logoUrl
        ? `<img src="${esc(logoUrl)}" alt="logo" style="width:40px;height:40px;border-radius:9px;object-fit:contain;">`
        : `<div style="width:40px;height:40px;border-radius:9px;border:1.5px dashed rgba(255,255,255,0.35);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;letter-spacing:1px;color:rgba(255,255,255,0.8);">LOGO</div>`

    const inner = `
<footer class="foot pdf-full-bleed" style="position:relative;background:#0F172A;color:#fff;padding:56px 48px 40px;overflow:hidden;">
  <span class="wm wm-l">08</span>
  <div style="position:relative;z-index:1;">
    <div style="text-align:center;max-width:60ch;margin:0 auto;">
      <h2 style="margin:0;font-size:32px;font-weight:700;letter-spacing:-0.5px;line-height:1.15;">${esc(foot.ctaHeadline)}</h2>
      <p style="margin:16px 0 28px;color:rgba(255,255,255,0.7);font-size:16px;">${esc(foot.ctaLead)} <strong>${esc(foot.startDate)}</strong>.</p>
      <a href="#" data-sq-action="accept" style="display:inline-block;background:#10B981;color:#0F172A;font-weight:700;font-size:16px;padding:16px 38px;border-radius:999px;text-decoration:none;box-shadow:0 8px 24px rgba(16,185,129,0.3);">${esc(foot.ctaButtonLabel)}</a>
      <div style="margin-top:16px;font-size:13px;color:rgba(255,255,255,0.5);">Oferta wa&#380;na do ${validUntil}</div>
    </div>
    <div style="height:1px;background:rgba(255,255,255,0.1);margin:40px 0 32px;"></div>
    <div class="foot-grid" style="display:grid;grid-template-columns:1.2fr 1fr 1fr;gap:28px;align-items:start;">
      <div>
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">${logoEl}</div>
        <div style="font-size:14px;color:rgba(255,255,255,0.65);line-height:1.5;max-width:30ch;">${esc(foot.companyTagline)}</div>
      </div>
      <div>
        <div style="font-size:12px;font-weight:600;letter-spacing:1px;color:rgba(255,255,255,0.4);margin-bottom:12px;">KONTAKT</div>
        <div style="display:flex;flex-direction:column;gap:8px;font-size:14px;color:rgba(255,255,255,0.8);">
          <a href="mailto:${esc(foot.contactEmail)}" class="lnk">${esc(foot.contactEmail)}</a>
          <span>${esc(foot.contactPhone)}</span>
          <a href="https://${esc(foot.websiteUrl)}" class="lnk">${esc(foot.websiteUrl)}</a>
        </div>
      </div>
      <div>
        <div style="font-size:12px;font-weight:600;letter-spacing:1px;color:rgba(255,255,255,0.4);margin-bottom:12px;">WYBRANY PAKIET</div>
        <div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:16px;">
          <div style="font-size:18px;font-weight:700;color:#10B981;">${esc(foot.selectedPackageName)}</div>
          <div style="font-size:14px;color:rgba(255,255,255,0.7);margin-top:4px;">${esc(foot.selectedPackagePrice)} / miesi&#261;c</div>
        </div>
      </div>
    </div>
    <div style="margin-top:34px;padding-top:18px;border-top:1px solid rgba(255,255,255,0.08);font-size:12px;color:rgba(255,255,255,0.4);text-align:center;">Oferta nr ${offerNum} &#183; Przygotowana ${offerDate} &#183; Wa&#380;na do ${validUntil} &#183; Dokument poufny &#8212; nie do rozpowszechniania</div>
  </div>
</footer>`
    return editorWrap(editorMode, 'footer', inner)
}

// ── Section dispatcher ────────────────────────────────────────────────────────

function renderSection(
    key: SupportBlocks['sections'][0],
    blocks: SupportBlocks,
    editorMode: boolean,
): string {
    switch (key) {
        case 'benefits': return renderBenefits(blocks.benefits, editorMode)
        case 'packages': return renderPackages(blocks.packages, editorMode)
        case 'scope':    return renderScope(blocks.scope, editorMode)
        case 'sla':      return renderSla(blocks.sla, editorMode)
        case 'process':  return renderProcess(blocks.process, editorMode)
        case 'pricing':  return renderPricing(blocks.pricing, editorMode)
        default:         return ''
    }
}

// ── Main export ───────────────────────────────────────────────────────────────

export function buildSupportHtml(
    blocks: SupportBlocks,
    offer: SupportOfferData,
    options?: { editorMode?: boolean },
): string {
    const editorMode = options?.editorMode ?? false
    const sectionsHtml = blocks.sections
        .map(k => withPageBreakAfter(
            renderSection(k, blocks, editorMode),
            blocks.pageBreakAfter.includes(k),
        ))
        .join('\n')

    return buildHtmlDocument({
        title: 'Opieka techniczna IT — Oferta',
        css: baseCss(editorMode),
        body: `<div class="page" style="padding:28px 18px;min-height:100vh;">
  <div class="doc" style="max-width:840px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 18px 60px rgba(15,76,117,0.14);">
    ${withPageBreakAfter(renderCover(blocks, offer, editorMode), blocks.pageBreakAfter.includes('cover'))}
    ${sectionsHtml}
    ${renderFooter(blocks, offer, editorMode)}
  </div>
</div>`,
    })
}

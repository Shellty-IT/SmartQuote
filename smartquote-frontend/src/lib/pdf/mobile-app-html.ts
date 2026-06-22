// src/lib/pdf/mobile-app-html.ts
// Faithfully reproduces the "Aplikacja mobilna - zaawansowana" template.
// Design: deep indigo #1E1B4B + rose #F43F5E + indigo-light #818CF8, Outfit font.

import { buildHtmlDocument } from './html-shell'
import type {
    MobileAppBlocks,
    MobileAppSectionKey,
    MobileAppFeatureStatus,
    MobileAppFeatureComplexity,
    MobileAppBadgeStyle,
    MobileAppBackendStatus,
} from './mobile-app-blocks'

export interface MobileAppOfferData {
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

function esc(s: string | number | undefined | null): string {
    if (s == null) return ''
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}

function editorWrap(editorMode: boolean, key: string, inner: string): string {
    if (!editorMode) return inner
    return `<div class="sq-block" data-block-key="${key}" onclick="window.parent.postMessage({type:'sq:editBlock',blockKey:'${key}'},\'*\')" title="Kliknij, aby edytować">${inner}</div>`
}

// ── CSS ───────────────────────────────────────────────────────────────────────

function baseCss(editorMode: boolean): string {
    return `
*{box-sizing:border-box;}
html,body{margin:0;padding:0;}
body{font-family:'Outfit Variable','Outfit',-apple-system,sans-serif;color:#0F172A;background:#fff;-webkit-font-smoothing:antialiased;line-height:1.55;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
a{color:inherit;text-decoration:none;}
.lift{transition:transform .25s ease,box-shadow .25s ease;}
.wm{position:absolute;top:20px;right:40px;font-size:140px;font-weight:800;color:#1E1B4B;opacity:0.03;pointer-events:none;line-height:1;}
.pad{max-width:1080px;margin:0 auto;padding:88px 48px;}
.scroll-x{overflow-x:auto;}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:22px;}
.g3{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;}
.g4{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;}
.badge-rec{padding:6px 14px;border-radius:999px;background:#1E1B4B;color:#fff;font-size:11px;font-weight:700;letter-spacing:.5px;}
.badge-perf{padding:6px 14px;border-radius:999px;background:#EEF0FF;color:#4F46E5;font-size:11px;font-weight:700;}
.badge-prem{padding:6px 14px;border-radius:999px;background:#F43F5E;color:#fff;font-size:11px;font-weight:700;}
.badge-budg{padding:6px 14px;border-radius:999px;background:transparent;border:1px solid #F59E0B;color:#B45309;font-size:11px;font-weight:700;}
.tag-pill{display:inline-block;margin-top:8px;padding:4px 12px;border-radius:999px;background:#EEF0FF;color:#4F46E5;font-size:11px;font-weight:700;}
.tag-pill-muted{display:inline-block;margin-top:8px;padding:4px 12px;border-radius:999px;background:#EEEDF2;color:#64748B;font-size:11px;font-weight:700;}
@media (max-width:768px){
  .g2,.g3,.g4,.cover-grid,.why-grid,.col-split{grid-template-columns:1fr !important;}
  .pad{padding:56px 22px !important;}
  .cover-pad{padding:28px 22px 40px !important;}
  .scroll-x{overflow-x:auto !important;}
  .promise-bar{flex-wrap:wrap !important;gap:14px !important;}
  .footer-btns{flex-direction:column !important;}
  .wm{font-size:90px !important;}
}
@media print{
  @page{size:A4;margin:10mm 0;}
  @page sq-full-bleed{size:A4;margin:0;}
  .orb,.no-print{display:none !important;}
  body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  .pb{page-break-before:always;}
  .sq-full-bleed-page{page:sq-full-bleed;}
  .sq-cover{break-after:page;page-break-after:always;}
  .sq-footer{break-before:page;page-break-before:always;break-inside:avoid-page !important;page-break-inside:avoid !important;}
  .scroll-x{overflow-x:visible !important;max-width:100% !important;}
  .scroll-x table{width:100% !important;min-width:0 !important;table-layout:fixed !important;}
  .scroll-x td,.scroll-x th{overflow-wrap:anywhere !important;}
  section{break-inside:auto;max-width:100% !important;}
  .g2,.g3,.g4{grid-template-columns:minmax(0,1fr) minmax(0,1fr) !important;}
  /* Reduce large top/bottom padding so sections don't waste page space */
  .pad{max-width:100% !important;padding:44px 44px !important;}
  .cover-pad{max-width:100% !important;padding-left:44px !important;padding-right:44px !important;}
  /* Cap headings so stress-length text doesn't consume a full page */
  section h2, section h1 { font-size: 24px !important; line-height: 1.35 !important; }
  .doc{box-shadow:none !important;}
}
${editorMode ? `
.sq-block{cursor:pointer;position:relative;transition:outline .15s;}
.sq-block:hover{outline:2px solid #818CF8;outline-offset:2px;border-radius:4px;}
.sq-block:hover::after{content:'\\2712 Edytuj';position:absolute;top:8px;right:8px;background:#1E1B4B;color:#fff;font-size:11px;font-weight:600;padding:3px 9px;border-radius:4px;z-index:99;pointer-events:none;}
` : ''}
`
}

// ── S1 — Cover ────────────────────────────────────────────────────────────────

function renderCover(b: MobileAppBlocks, offer: MobileAppOfferData, editorMode: boolean): string {
    const offerNum = esc(offer.offerNumber ?? '2025/APP/001')
    const offerDate = esc(offer.offerDate ?? '')
    const website = esc(b.cover ? offer.userWebsite || b.footer.websiteUrl || 'www.twoja-strona.pl' : 'www.twoja-strona.pl')
    const logoUrl = offer.userLogoDarkUrl || offer.userLogoUrl

    const logoEl = logoUrl
        ? `<img src="${esc(logoUrl)}" alt="logo" style="width:54px;height:54px;border-radius:14px;object-fit:contain;">`
        : `<div style="display:flex;align-items:center;justify-content:center;width:54px;height:54px;border-radius:14px;border:1.5px solid rgba(255,255,255,0.22);background:rgba(255,255,255,0.06);font-weight:800;font-size:13px;letter-spacing:1px;">LOGO</div>`

    const promises = b.cover.promises.map(p =>
        `<span style="display:flex;align-items:center;gap:9px;"><span style="color:#F43F5E;">&#10022;</span> ${esc(p)}</span>`
    ).join('')

    const inner = `
<section class="sq-full-bleed-page sq-cover" style="position:relative;background:#1E1B4B;color:#fff;overflow:hidden;">
  <div class="orb" style="position:absolute;width:520px;height:520px;border-radius:50%;background:radial-gradient(circle,#F43F5E,transparent 70%);filter:blur(60px);opacity:0.18;top:-160px;right:-120px;pointer-events:none;"></div>
  <div class="orb" style="position:absolute;width:460px;height:460px;border-radius:50%;background:radial-gradient(circle,#818CF8,transparent 70%);filter:blur(60px);opacity:0.20;bottom:-180px;left:-140px;pointer-events:none;"></div>
  <div class="orb" style="position:absolute;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,#818CF8,transparent 70%);filter:blur(60px);opacity:0.12;top:40%;left:45%;pointer-events:none;"></div>
  <div class="cover-pad" style="position:relative;max-width:1180px;margin:0 auto;padding:32px 48px 56px;">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:64px;">
      <div style="display:flex;align-items:center;gap:14px;">${logoEl}<a href="https://${website}" style="color:#818CF8;text-decoration:none;font-size:14px;font-weight:600;">${website}</a></div>
      <div style="display:flex;align-items:center;gap:8px;padding:9px 18px;border-radius:999px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.16);font-size:13px;"><span style="opacity:.6;">Oferta</span><span style="font-weight:700;">#${offerNum}</span><span style="opacity:.3;">&#183;</span><span style="opacity:.85;">${offerDate}</span></div>
    </div>
    <div class="cover-grid" style="display:grid;grid-template-columns:1.5fr 1fr;gap:48px;align-items:center;">
      <div>
        <div style="text-transform:uppercase;letter-spacing:3px;color:#F43F5E;font-size:11px;font-weight:700;margin-bottom:22px;">${esc(b.cover.eyebrow)}</div>
        <h1 style="margin:0;line-height:1.02;">
          <span style="display:block;font-weight:300;color:#fff;font-size:28px;letter-spacing:0.5px;">${esc(b.cover.titlePrefix)}</span>
          <span style="display:block;font-weight:800;font-size:64px;background:linear-gradient(135deg,#F43F5E,#818CF8);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;">${esc(b.cover.titleAccent)}</span>
          <span style="display:block;font-weight:400;font-size:28px;margin-top:8px;color:#fff;">${esc(b.cover.projectName)}</span>
        </h1>
        <p style="margin:18px 0 30px;color:rgba(255,255,255,0.6);font-style:italic;font-size:16px;">Dla: <strong style="color:#fff;">${esc(b.cover.clientName || offer.clientName || 'Nazwa firmy / klienta')}</strong></p>
        <div style="display:flex;flex-wrap:wrap;gap:12px;">
          <span style="display:inline-flex;align-items:center;gap:7px;padding:10px 18px;border-radius:999px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);font-size:14px;font-weight:600;">&#128241; ${esc(b.cover.platformPill)}</span>
          <span style="display:inline-flex;align-items:center;gap:7px;padding:10px 18px;border-radius:999px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);font-size:14px;font-weight:600;">&#128640; MVP od ${esc(b.cover.mvpWeeks)} tyg.</span>
          <span style="display:inline-flex;align-items:center;gap:7px;padding:10px 18px;border-radius:999px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);font-size:14px;font-weight:600;">&#128176; Od ${esc(b.cover.priceFrom)} z&#322;</span>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;">
        <div style="position:relative;width:218px;height:436px;border-radius:38px;border:3px solid rgba(255,255,255,0.2);background:#0F0E1A;box-shadow:0 24px 60px rgba(0,0,0,0.5),inset 0 0 0 2px rgba(255,255,255,0.05);padding:10px;">
          <div style="position:absolute;top:16px;left:50%;transform:translateX(-50%);width:78px;height:22px;border-radius:999px;background:#000;z-index:5;"></div>
          <div style="width:100%;height:100%;border-radius:28px;overflow:hidden;background:#15132B;display:flex;flex-direction:column;">
            <div style="background:#1E1B4B;padding:34px 16px 14px;display:flex;align-items:center;justify-content:space-between;"><span style="color:#fff;font-size:15px;">&#8249;</span><span style="color:#fff;font-size:12px;font-weight:700;">Dashboard</span><span style="color:#fff;font-size:14px;">&#8801;</span></div>
            <div style="padding:12px;display:flex;flex-direction:column;gap:10px;flex:1;">
              <div style="border-radius:14px;padding:14px;background:linear-gradient(135deg,#F43F5E,#818CF8);color:#fff;"><div style="font-size:9px;opacity:.85;letter-spacing:.5px;">WITAJ Z POWROTEM</div><div style="font-size:13px;font-weight:700;margin-top:3px;">Tw&#243;j pulpit</div><div style="height:5px;width:70%;background:rgba(255,255,255,.5);border-radius:999px;margin-top:9px;"></div></div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;"><div style="background:#211E3D;border-radius:11px;padding:11px 8px;text-align:center;font-size:16px;">&#128276;</div><div style="background:#211E3D;border-radius:11px;padding:11px 8px;text-align:center;font-size:16px;">&#128179;</div><div style="background:#211E3D;border-radius:11px;padding:11px 8px;text-align:center;font-size:16px;">&#128205;</div><div style="background:#211E3D;border-radius:11px;padding:11px 8px;text-align:center;font-size:16px;">&#128172;</div></div>
            </div>
            <div style="background:#1E1B4B;padding:9px 14px;display:flex;align-items:center;justify-content:space-between;"><span style="font-size:13px;opacity:.5;">&#127968;</span><span style="font-size:13px;opacity:.5;">&#128269;</span><span style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:#F43F5E;font-size:14px;margin-top:-18px;box-shadow:0 6px 14px rgba(244,63,94,.5);">&#65291;</span><span style="font-size:13px;opacity:.5;">&#11088;</span><span style="font-size:13px;opacity:.5;">&#128100;</span></div>
          </div>
        </div>
        <div style="width:150px;height:24px;border-radius:50%;background:#000;filter:blur(16px);opacity:.5;margin-top:-2px;"></div>
      </div>
    </div>
    <div class="promise-bar" style="display:flex;align-items:center;justify-content:space-between;gap:24px;margin-top:48px;padding:20px 28px;border-radius:18px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);font-size:14px;">${promises}</div>
  </div>
</section>`
    return editorWrap(editorMode, 'cover', inner)
}

// ── S2 — Vision ───────────────────────────────────────────────────────────────

const ACCENT_COLORS: Record<string, string> = { rose: '#F43F5E', indigo: '#818CF8', green: '#16A34A' }

function renderVision(b: MobileAppBlocks['vision'], editorMode: boolean): string {
    const cards = b.cards.map(c => {
        const color = ACCENT_COLORS[c.accent] ?? '#818CF8'
        return `
<div class="lift" style="background:#fff;border-radius:12px;border-left:4px solid ${color};box-shadow:0 8px 30px rgba(30,27,75,0.08);padding:28px 32px;display:flex;gap:20px;align-items:flex-start;">
  <div style="font-size:30px;line-height:1;">${esc(c.emoji)}</div>
  <div><div style="font-weight:700;font-size:18px;color:#0F172A;">${esc(c.title)}</div><p style="margin:6px 0 0;color:#475569;font-size:15px;">${esc(c.description)}</p></div>
</div>`
    }).join('')

    const inner = `
<section style="position:relative;background:#fff;overflow:hidden;">
  <div class="wm">02</div>
  <div class="pad" style="position:relative;">
    <div style="text-align:center;max-width:740px;margin:0 auto;">
      <h2 style="margin:0;font-size:38px;font-weight:800;color:#0F172A;">${esc(b.sectionTitle)}</h2>
      <p style="color:#475569;font-size:17px;margin:14px 0 0;">${esc(b.sectionLead)}</p>
      <p style="color:#1E1B4B;font-size:20px;font-weight:400;line-height:1.6;margin:36px auto 0;max-width:700px;">${esc(b.projectDescription)}</p>
    </div>
    <div style="display:flex;flex-direction:column;gap:18px;margin-top:52px;">${cards}</div>
  </div>
</section>`
    return editorWrap(editorMode, 'vision', inner)
}

// ── S3 — Platform ─────────────────────────────────────────────────────────────

const BADGE_CLASS: Record<MobileAppBadgeStyle, string> = {
    recommended: 'badge-rec',
    performance: 'badge-perf',
    premium: 'badge-prem',
    budget: 'badge-budg',
}

function renderPlatformCard(card: MobileAppBlocks['platform']['cards'][0], idx: number): string {
    const isRec = card.badgeStyle === 'recommended'
    const isBudget = card.badgeStyle === 'budget'
    const borderStyle = isRec ? 'border:2px solid #1E1B4B;box-shadow:0 8px 40px rgba(30,27,75,0.15);' : isBudget ? 'border:1px dashed #C7C2DE;box-shadow:0 4px 18px rgba(30,27,75,0.05);' : 'border:1px solid #E5E1F5;box-shadow:0 8px 30px rgba(30,27,75,0.08);'
    const bgStyle = isBudget ? 'background:#FAFAFC;' : 'background:#fff;'
    const tagClass = isBudget ? 'tag-pill-muted' : 'tag-pill'
    const iconStyle = idx === 0 ? 'font-size:34px;color:#61DAFB;' : idx === 1 ? 'font-size:34px;color:#02569B;font-weight:800;' : idx === 2 ? 'font-size:22px;font-weight:700;' : 'font-size:34px;'
    const pros = card.pros.map(p => `<span style="color:#16A34A;">&#10003; ${esc(p)}</span>`).join('')
    const warns = card.warnings.map(w => `<span style="color:#F59E0B;">&#9888; ${esc(w)}</span>`).join('')

    return `
<div class="lift" style="position:relative;${bgStyle}border-radius:16px;${borderStyle}padding:30px;">
  <div style="position:absolute;top:18px;right:18px;" class="${BADGE_CLASS[card.badgeStyle]}">${esc(card.badge)}</div>
  <div style="${iconStyle}">${esc(card.icon)}</div>
  <h3 style="margin:14px 0 0;font-size:22px;font-weight:700;color:#0F172A;">${esc(card.title)}</h3>
  <span class="${tagClass}">${esc(card.tag)}</span>
  <p style="color:#475569;font-size:14.5px;margin:16px 0 16px;">${esc(card.description)}</p>
  <div style="display:flex;flex-direction:column;gap:7px;font-size:13.5px;">${pros}${warns}</div>
</div>`
}

function renderPlatform(b: MobileAppBlocks['platform'], editorMode: boolean): string {
    const cards = b.cards.map((c, i) => renderPlatformCard(c, i)).join('')
    const tableRows = [
        { label: 'Koszt', vals: ['&#9733;&#9733; Niski', '&#9733;&#9733; Niski', '&#9733;&#9733;&#9733;&#9733; Wysoki', '&#9733; Najni&#380;szy'], colors: ['#16A34A', '#16A34A', '#F43F5E', '#16A34A'] },
        { label: 'Czas realizacji', vals: ['Kr&#243;tki', 'Kr&#243;tki', 'D&#322;ugi', 'Najkr&#243;tszy'], colors: ['#16A34A', '#16A34A', '#F43F5E', '#16A34A'] },
        { label: 'Wydajno&#347;&#263;', vals: ['Bardzo dobra', '&#346;wietna', 'Maksymalna', '&#346;rednia'], colors: ['#334155', '#16A34A', '#16A34A', '#F59E0B'] },
        { label: 'Dost&#281;p do funkcji telefonu', vals: ['95%', '95%', '100%', 'Ograniczony'], colors: ['#334155', '#334155', '#16A34A', '#F59E0B'] },
        { label: 'Aktualizacje', vals: ['&#322;atwe (OTA)', '&#322;atwe', 'Przez sklepy', 'Natychmiast'], colors: ['#16A34A', '#16A34A', '#334155', '#16A34A'] },
    ]
    const headerNames = (b.cards.map(c => esc(c.title))).join('</th><th style="padding:16px 14px;font-weight:600;">')
    const tbody = tableRows.map((row, ri) => {
        const cells = row.vals.map((v, ci) => `<td style="text-align:center;padding:14px;color:${row.colors[ci]};">${v}</td>`).join('')
        return `<tr style="${ri % 2 === 1 ? 'background:#F8F7FF;' : ''}border-bottom:1px solid #EDE9FE;"><td style="padding:14px 18px;font-weight:600;">${row.label}</td>${cells}</tr>`
    }).join('')

    const inner = `
<section class="pb" style="position:relative;background:#F5F3FF;overflow:hidden;">
  <div class="wm">03</div>
  <div class="pad" style="position:relative;">
    <div style="max-width:760px;">
      <h2 style="margin:0;font-size:38px;font-weight:800;color:#0F172A;">${esc(b.sectionTitle)}</h2>
      <p style="color:#475569;font-size:17px;margin:14px 0 0;">${esc(b.sectionLead)}</p>
    </div>
    <div class="g2" style="display:grid;grid-template-columns:1fr 1fr;gap:22px;margin-top:44px;">${cards}</div>
    <div class="scroll-x" style="margin-top:40px;border-radius:12px;overflow:hidden;box-shadow:0 8px 30px rgba(30,27,75,0.08);background:#fff;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;min-width:640px;">
        <thead><tr style="background:#1E1B4B;color:#fff;"><th style="text-align:left;padding:16px 18px;font-weight:600;">Kryterium</th><th style="padding:16px 14px;font-weight:600;">${headerNames}</th></tr></thead>
        <tbody style="color:#334155;">${tbody}</tbody>
      </table>
    </div>
    <p style="text-align:center;color:#475569;font-style:italic;font-size:14.5px;margin-top:22px;">${esc(b.footerNote)}</p>
  </div>
</section>`
    return editorWrap(editorMode, 'platform', inner)
}

// ── S4 — Scope ────────────────────────────────────────────────────────────────

const COMPLEXITY_LABEL: Record<MobileAppFeatureComplexity, string> = { low: '&#9679;&#9675;&#9675; NISKA', medium: '&#9679;&#9679;&#9675; &#346;REDNIA', high: '&#9679;&#9679;&#9679; WYSOKA' }
const COMPLEXITY_COLOR: Record<MobileAppFeatureComplexity, string> = { low: '#16A34A', medium: '#16A34A', high: '#DC2626' }
const STATUS_LABEL: Record<MobileAppFeatureStatus, string> = { included: '&#9745; UWZGL&#280;DNIONE', tbd: '&#9744; DO USTALENIA', optional: '+ OPCJA' }
const STATUS_COLOR: Record<MobileAppFeatureStatus, string> = { included: '#16A34A', tbd: '#64748B', optional: '#B45309' }

function renderScope(b: MobileAppBlocks['scope'], editorMode: boolean): string {
    const mvpFeats = b.mvpFeatures.map(f => `<span>&#10003; ${esc(f)}</span>`).join('')
    const fullFeats = b.fullFeatures.map(f => `<span>&#10003; ${esc(f)}</span>`).join('')

    const featureCards = b.features.map(f => `
<div class="lift" style="background:#fff;border-radius:12px;border:1px solid #EDE9FE;box-shadow:0 6px 24px rgba(30,27,75,0.06);padding:24px;">
  <div style="font-size:30px;">${esc(f.emoji)}</div>
  <div style="font-weight:700;font-size:16px;color:#0F172A;margin-top:10px;">${esc(f.title)}</div>
  <p style="margin:8px 0 16px;color:#475569;font-size:13.5px;">${esc(f.description)}</p>
  <div style="display:flex;align-items:center;justify-content:space-between;">
    <span style="font-size:11px;color:${COMPLEXITY_COLOR[f.complexity]};font-weight:700;">${COMPLEXITY_LABEL[f.complexity]}</span>
    <span style="font-size:11px;color:${STATUS_COLOR[f.status]};font-weight:700;">${STATUS_LABEL[f.status]}</span>
  </div>
</div>`).join('')

    const inner = `
<section style="position:relative;background:#fff;overflow:hidden;">
  <div class="wm">04</div>
  <div class="pad" style="position:relative;">
    <div style="max-width:760px;">
      <h2 style="margin:0;font-size:38px;font-weight:800;color:#0F172A;">${esc(b.sectionTitle)}</h2>
      <p style="color:#475569;font-size:17px;margin:14px 0 0;">MVP (Minimum Viable Product) to wersja aplikacji z kluczowymi funkcjami — wystarczaj&#261;ca &#380;eby sprawdzi&#263; pomys&#322; na rynku i zdoby&#263; pierwszych u&#380;ytkownik&#243;w.</p>
    </div>
    <div class="g2" style="display:grid;grid-template-columns:1fr 1fr;gap:22px;margin-top:40px;">
      <div class="lift" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(30,27,75,0.12);">
        <div style="background:linear-gradient(135deg,#1E1B4B,#312E81);color:#fff;padding:26px 28px;">
          <div style="display:flex;justify-content:space-between;align-items:center;"><h3 style="margin:0;font-size:24px;font-weight:700;">MVP</h3><span style="padding:6px 14px;border-radius:999px;background:rgba(255,255,255,0.15);font-size:11px;font-weight:700;">&#128640; SZYBKI START</span></div>
          <div style="margin-top:14px;font-size:13px;opacity:.7;">Czas realizacji</div>
          <div style="font-size:16px;font-weight:600;">${esc(b.mvpTimeline)}</div>
          <div style="margin-top:12px;font-size:13px;opacity:.7;">Cena</div>
          <div style="font-size:22px;font-weight:800;">Od ${esc(b.mvpPriceFrom)} z&#322;</div>
        </div>
        <div style="padding:24px 28px;">
          <div style="display:flex;flex-direction:column;gap:9px;font-size:14.5px;color:#334155;">${mvpFeats}</div>
          <p style="margin:18px 0 0;color:#475569;font-size:14px;">${esc(b.mvpNote)}</p>
        </div>
      </div>
      <div class="lift" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(30,27,75,0.12);">
        <div style="background:linear-gradient(135deg,#F43F5E,#818CF8);color:#fff;padding:26px 28px;">
          <div style="display:flex;justify-content:space-between;align-items:center;"><h3 style="margin:0;font-size:24px;font-weight:700;">Pe&#322;na Aplikacja</h3><span style="padding:6px 14px;border-radius:999px;background:rgba(255,255,255,0.18);font-size:11px;font-weight:700;">&#128142; KOMPLETNA</span></div>
          <div style="margin-top:14px;font-size:13px;opacity:.85;">Czas realizacji</div>
          <div style="font-size:16px;font-weight:600;">${esc(b.fullTimeline)}</div>
          <div style="margin-top:12px;font-size:13px;opacity:.85;">Cena</div>
          <div style="font-size:22px;font-weight:800;">Od ${esc(b.fullPriceFrom)} z&#322;</div>
        </div>
        <div style="padding:24px 28px;">
          <div style="display:flex;flex-direction:column;gap:9px;font-size:14.5px;color:#334155;">${fullFeats}</div>
          <p style="margin:18px 0 0;color:#475569;font-size:14px;">${esc(b.fullNote)}</p>
        </div>
      </div>
    </div>
    <div style="margin-top:24px;padding:20px 26px;border-radius:12px;background:#F5F3FF;border-left:4px solid #818CF8;color:#334155;font-size:15px;">&#128161; <strong>Rekomendacja:</strong> ${esc(b.recommendationNote)}</div>
    <div style="margin-top:72px;">
      <h3 style="margin:0;font-size:30px;font-weight:800;color:#0F172A;">${esc(b.featuresTitle)}</h3>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:30px;">${featureCards}</div>
      <p style="margin-top:24px;color:#475569;font-style:italic;font-size:14.5px;">${esc(b.footerNote)}</p>
    </div>
  </div>
</section>`
    return editorWrap(editorMode, 'scope', inner)
}

// ── S5 — Architecture ─────────────────────────────────────────────────────────

const BACKEND_STATUS_LABEL: Record<MobileAppBackendStatus, string> = {
    selected: '&#10003; WYBRANA',
    option: '&#9744; Opcja',
    alternative: '&#9744; Alternatywa',
}
const BACKEND_STATUS_BG: Record<MobileAppBackendStatus, string> = {
    selected: '#E0F2FE',
    option: '#EEF0FF',
    alternative: '#DCFCE7',
}
const BACKEND_STATUS_COLOR: Record<MobileAppBackendStatus, string> = {
    selected: '#0369A1',
    option: '#4F46E5',
    alternative: '#15803D',
}

function renderArchitecture(b: MobileAppBlocks['architecture'], editorMode: boolean): string {
    const backendOpts = b.backendOptions.map(opt => `
<div class="lift" style="background:#fff;border-radius:12px;border-left:4px solid ${esc(opt.accentColor)};box-shadow:0 6px 24px rgba(30,27,75,0.06);padding:22px 26px;display:flex;gap:18px;align-items:flex-start;">
  <div style="font-size:26px;">${esc(opt.icon)}</div>
  <div style="flex:1;"><div style="font-weight:700;font-size:16px;">${esc(opt.title)}</div><p style="margin:5px 0 0;color:#475569;font-size:14px;">${esc(opt.description)}</p></div>
  <span style="white-space:nowrap;padding:6px 12px;border-radius:999px;background:${BACKEND_STATUS_BG[opt.status]};color:${BACKEND_STATUS_COLOR[opt.status]};font-size:11px;font-weight:700;">${BACKEND_STATUS_LABEL[opt.status]}</span>
</div>`).join('')

    const serverRows = b.serverCostRows.map((row, ri) => `
<tr style="${ri % 2 === 1 ? 'background:#F8F7FF;' : ''}border-bottom:1px solid #EDE9FE;">
  <td style="padding:13px 18px;font-weight:600;">${esc(row.name)}</td>
  <td style="padding:13px 18px;color:${row.cost === 'Darmowy' || row.cost.toLowerCase().includes('darmowy') ? '#16A34A' : '#334155'};">${esc(row.cost)}</td>
  <td style="padding:13px 18px;">${esc(row.target)}</td>
</tr>`).join('')

    const inner = `
<section class="pb" style="position:relative;background:#F5F3FF;overflow:hidden;">
  <div class="wm">05</div>
  <div class="pad" style="position:relative;">
    <div style="max-width:760px;">
      <h2 style="margin:0;font-size:38px;font-weight:800;color:#0F172A;">${esc(b.sectionTitle)}</h2>
      <p style="color:#475569;font-size:17px;margin:14px 0 0;">${esc(b.sectionLead)}</p>
    </div>
    <div style="margin-top:44px;background:#fff;border-radius:16px;box-shadow:0 8px 30px rgba(30,27,75,0.08);padding:40px 32px;">
      <div style="display:grid;grid-template-columns:1fr auto 1fr auto 1fr;gap:14px;align-items:center;justify-items:center;">
        <div style="width:100%;max-width:240px;background:#1E1B4B;color:#fff;border-radius:14px;padding:22px;text-align:center;"><div style="font-size:30px;">&#128241;</div><div style="font-weight:700;margin-top:8px;">Aplikacja</div><div style="font-size:12.5px;opacity:.7;margin-top:4px;">Interfejs, kt&#243;ry widzi i dotyka u&#380;ytkownik.</div></div>
        <div style="color:#818CF8;font-weight:800;font-size:13px;text-align:center;white-space:nowrap;">&#8592;API&#8594;</div>
        <div style="width:100%;max-width:240px;background:#312E81;color:#fff;border-radius:14px;padding:22px;text-align:center;"><div style="font-size:30px;">&#9881;&#65039;</div><div style="font-weight:700;margin-top:8px;">Backend / Serwer</div><div style="font-size:12.5px;opacity:.7;margin-top:4px;">Logika biznesowa, autoryzacja, regu&#322;y.</div></div>
        <div style="color:#818CF8;font-weight:800;font-size:18px;text-align:center;">&#8596;</div>
        <div style="width:100%;max-width:240px;background:#4C1D95;color:#fff;border-radius:14px;padding:22px;text-align:center;"><div style="font-size:30px;">&#128452;&#65039;</div><div style="font-weight:700;margin-top:8px;">Baza danych</div><div style="font-size:12.5px;opacity:.7;margin-top:4px;">Trwa&#322;e przechowywanie danych u&#380;ytkownik&#243;w.</div></div>
      </div>
      <div class="g2" style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:18px;max-width:520px;">
        <div style="background:#F5F3FF;border:1px solid #EDE9FE;border-radius:12px;padding:14px 18px;text-align:center;color:#475569;font-size:13.5px;"><span style="font-size:18px;">&#128276;</span> &nbsp;Push notifications</div>
        <div style="background:#F5F3FF;border:1px solid #EDE9FE;border-radius:12px;padding:14px 18px;text-align:center;color:#475569;font-size:13.5px;"><span style="font-size:18px;">&#128231;</span> &nbsp;Email / SMS</div>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:14px;margin-top:30px;">${backendOpts}</div>
    <div style="margin-top:26px;padding:20px 24px;border-radius:12px;background:#FFFBEB;border:1px solid #F59E0B;color:#92400E;font-size:14.5px;">&#9888;&#65039; <strong>Aplikacja mobilna to tylko frontend.</strong> ${esc(b.warningNote)}</div>
    <div style="margin-top:26px;">
      <div style="font-weight:700;font-size:15px;color:#0F172A;margin-bottom:10px;">Szacowane koszty serwera (miesi&#281;cznie)</div>
      <div class="scroll-x" style="border-radius:12px;overflow:hidden;box-shadow:0 6px 24px rgba(30,27,75,0.06);background:#fff;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;min-width:520px;">
          <thead><tr style="background:#1E1B4B;color:#fff;"><th style="text-align:left;padding:14px 18px;font-weight:600;">Opcja</th><th style="text-align:left;padding:14px 18px;font-weight:600;">Koszt</th><th style="text-align:left;padding:14px 18px;font-weight:600;">Dla kogo</th></tr></thead>
          <tbody style="color:#334155;">${serverRows}</tbody>
        </table>
      </div>
      <p style="margin-top:12px;color:#475569;font-style:italic;font-size:13.5px;">To koszty po stronie klienta (zewn&#281;trzni dostawcy), nie po stronie wykonawcy.</p>
    </div>
  </div>
</section>`
    return editorWrap(editorMode, 'architecture', inner)
}

// ── S6 — Timeline ─────────────────────────────────────────────────────────────

const STAGE_GRADIENTS = ['#1E1B4B,#F43F5E', '#1E1B4B,#F43F5E', '#1E1B4B,#F43F5E', '#1E1B4B,#F43F5E', '#1E1B4B,#F43F5E']
const PAYMENT_DOT_BG = ['#1E1B4B', '#3730A3', '#6D28D9', '#BE185D', '#F43F5E']

function renderTimeline(b: MobileAppBlocks['timeline'], editorMode: boolean): string {
    const stages = b.stages.map((stage, i) => {
        const isLast = i === b.stages.length - 1
        const grad = STAGE_GRADIENTS[i] ?? '#1E1B4B,#F43F5E'
        const connector = isLast ? '' : `<div style="flex:1;width:2px;background:#EDE9FE;margin-top:8px;"></div>`
        return `
<div style="display:flex;gap:0;">
  <div style="width:20%;min-width:120px;display:flex;flex-direction:column;align-items:center;position:relative;">
    <div style="display:flex;align-items:center;justify-content:center;width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,${grad});color:#fff;font-size:24px;font-weight:800;">${i + 1}</div>
    <div style="margin-top:8px;font-size:12.5px;color:#475569;text-align:center;">${esc(stage.weeks)}</div>
    ${connector}
  </div>
  <div class="lift" style="flex:1;background:#fff;border-radius:12px;box-shadow:0 6px 24px rgba(30,27,75,0.07);padding:24px 28px;margin-bottom:24px;">
    <div style="font-weight:700;font-size:18px;color:#0F172A;">${esc(stage.title)}</div>
    <p style="margin:4px 0 12px;color:#64748B;font-size:14px;">${esc(stage.description)}</p>
    <div style="color:#475569;font-size:14px;">&#8594; Deliverable: ${esc(stage.deliverable)}</div>
    <span style="display:inline-block;margin-top:14px;padding:8px 16px;border-radius:999px;background:#F5F3FF;border:1px solid #818CF8;color:#1E1B4B;font-size:13px;font-weight:600;">&#128179; P&#322;atno&#347;&#263;: ${esc(stage.paymentPercent)} &#8212; ${esc(stage.paymentAmount)} z&#322;</span>
  </div>
</div>`
    }).join('')

    const paymentRows = b.stages.map(s => {
        const milestone = s.title.replace(/^Etap \d+ — /, '')
        return `<tr style="border-bottom:1px solid #EDE9FE;"><td style="padding:13px 18px;font-weight:600;">${esc(s.title.replace(/^(Etap \d+).*$/, '$1'))}</td><td style="padding:13px 18px;">${esc(milestone)}</td><td style="padding:13px 18px;text-align:right;">${esc(s.paymentAmount)} z&#322;</td></tr>`
    }).join('')

    const inner = `
<section style="position:relative;background:#fff;overflow:hidden;">
  <div class="wm">06</div>
  <div class="pad" style="position:relative;">
    <div style="max-width:760px;">
      <h2 style="margin:0;font-size:38px;font-weight:800;color:#0F172A;">${esc(b.sectionTitle)}</h2>
      <p style="color:#475569;font-size:17px;margin:14px 0 0;">${esc(b.sectionLead)}</p>
    </div>
    <div style="position:relative;margin-top:44px;display:flex;flex-direction:column;gap:0;">${stages}</div>
    <div class="scroll-x" style="margin-top:40px;border-radius:12px;overflow:hidden;box-shadow:0 8px 30px rgba(30,27,75,0.08);background:#fff;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;min-width:560px;">
        <thead><tr style="background:#1E1B4B;color:#fff;"><th style="text-align:left;padding:15px 18px;font-weight:600;">Etap</th><th style="text-align:left;padding:15px 18px;font-weight:600;">Milestone uruchamiaj&#261;cy p&#322;atno&#347;&#263;</th><th style="text-align:right;padding:15px 18px;font-weight:600;">Kwota</th></tr></thead>
        <tbody style="color:#334155;">${paymentRows}</tbody>
      </table>
    </div>
  </div>
</section>`
    return editorWrap(editorMode, 'timeline', inner)
}

// ── S7 — Pricing ─────────────────────────────────────────────────────────────

function renderPricing(b: MobileAppBlocks['pricing'], editorMode: boolean): string {
    const phaseRows = b.phases.map(phase => {
        const header = `<tr style="background:#EDE9FE;"><td colspan="4" style="padding:10px 18px;text-transform:uppercase;letter-spacing:1px;font-size:11px;font-weight:800;color:#1E1B4B;">${esc(phase.label)}</td></tr>`
        const items = phase.items.map((item, ii) => `
<tr style="${ii % 2 === 1 ? 'background:#F8F7FF;' : ''}border-bottom:1px solid #EDE9FE;">
  <td style="padding:13px 18px;font-weight:600;">${esc(item.name)}</td>
  <td style="padding:13px 18px;">${esc(item.scope)}</td>
  <td style="padding:13px 18px;text-align:center;">${esc(item.weeks)}</td>
  <td style="padding:13px 18px;text-align:right;font-weight:600;">${esc(item.price)} z&#322;</td>
</tr>`).join('')
        return header + items
    }).join('')

    const vatNum = b.vat ?? 23
    const addonRows = b.addons.map(a => `
<tr style="border-bottom:1px solid #EDE9FE;">
  <td style="padding:13px 18px;"><span style="display:inline-block;padding:3px 9px;border-radius:999px;background:#FEF3C7;color:#B45309;font-size:10px;font-weight:800;margin-right:8px;">OPT</span>${esc(a.name)}</td>
  <td style="padding:13px 18px;text-align:right;font-weight:600;">${esc(a.price)} z&#322;</td>
</tr>`).join('')

    const paymentDots = ['Start', 'Makiety', 'TestFlight', 'Testy', 'Premiera'].map((label, i) => {
        const bg = PAYMENT_DOT_BG[i] ?? '#1E1B4B'
        const pcts = ['20%', '15%', '40%', '15%', '10%']
        return `<div style="position:relative;display:flex;flex-direction:column;align-items:center;width:20%;text-align:center;"><div style="width:38px;height:38px;border-radius:50%;background:${bg};color:#fff;display:flex;align-items:center;justify-content:center;font-size:15px;z-index:1;">&#128179;</div><div style="font-size:11px;font-weight:700;color:#1E1B4B;margin-top:8px;">${label}</div><div style="font-size:11px;color:#64748B;">${pcts[i]}</div></div>`
    }).join('')

    const inner = `
<section class="pb" style="position:relative;background:#F5F3FF;overflow:hidden;">
  <div class="wm">07</div>
  <div class="pad" style="position:relative;">
    <div style="max-width:760px;">
      <h2 style="margin:0;font-size:38px;font-weight:800;color:#0F172A;">${esc(b.sectionTitle)}</h2>
      <p style="color:#475569;font-size:17px;margin:14px 0 0;">${esc(b.sectionLead)}</p>
    </div>
    <div class="scroll-x" style="margin-top:40px;border-radius:12px;overflow:hidden;box-shadow:0 8px 40px rgba(30,27,75,0.12);background:#fff;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;min-width:680px;">
        <thead><tr style="background:linear-gradient(135deg,#1E1B4B,#312E81);color:#fff;"><th style="text-align:left;padding:16px 18px;font-weight:600;">Etap / Modu&#322;</th><th style="text-align:left;padding:16px 18px;font-weight:600;">Zakres prac</th><th style="text-align:center;padding:16px 18px;font-weight:600;">Czas</th><th style="text-align:right;padding:16px 18px;font-weight:600;">Cena netto</th></tr></thead>
        <tbody style="color:#334155;">
          ${phaseRows}
          <tr style="background:#1E1B4B;color:#fff;"><td colspan="2" style="padding:18px;font-weight:700;font-size:16px;">RAZEM (netto)</td><td style="padding:18px;text-align:center;">${esc(b.totalWeeks)}</td><td style="padding:18px;text-align:right;font-weight:800;font-size:22px;">${esc(b.totalNet)} z&#322;</td></tr>
        </tbody>
      </table>
    </div>
    <div style="margin-top:22px;">
      <div style="font-weight:700;font-size:15px;color:#0F172A;margin-bottom:10px;">Opcje dodatkowe</div>
      <div class="scroll-x" style="border-radius:12px;overflow:hidden;box-shadow:0 6px 24px rgba(30,27,75,0.06);background:#fff;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;min-width:560px;"><tbody style="color:#334155;">${addonRows}</tbody></table>
      </div>
    </div>
    <div style="display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:14px;margin-top:36px;">
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:150px;height:150px;border-radius:50%;background:#fff;box-shadow:0 8px 30px rgba(30,27,75,0.08);"><span style="font-size:12px;color:#64748B;">Netto</span><span style="font-size:18px;font-weight:800;color:#0F172A;">${esc(b.totalNet)}</span><span style="font-size:11px;color:#94a3b8;">z&#322;</span></div>
      <span style="font-size:26px;color:#818CF8;font-weight:800;">+</span>
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:150px;height:150px;border-radius:50%;background:#fff;box-shadow:0 8px 30px rgba(30,27,75,0.08);"><span style="font-size:12px;color:#64748B;">VAT ${vatNum}%</span><span style="font-size:11px;color:#94a3b8;">z&#322;</span></div>
      <span style="font-size:26px;color:#818CF8;font-weight:800;">=</span>
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:160px;height:160px;border-radius:50%;background:linear-gradient(135deg,#F43F5E,#818CF8);color:#fff;box-shadow:0 12px 40px rgba(244,63,94,0.3);"><span style="font-size:12px;opacity:.85;">Brutto</span><span style="font-size:20px;font-weight:800;">${esc(b.totalNet)}</span><span style="font-size:11px;opacity:.85;">z&#322;</span></div>
    </div>
    <div style="max-width:640px;margin:48px auto 0;background:#fff;border-radius:16px;box-shadow:0 8px 30px rgba(30,27,75,0.1);padding:30px;">
      <div style="text-align:center;font-weight:700;font-size:18px;color:#0F172A;margin-bottom:24px;">Harmonogram p&#322;atno&#347;ci</div>
      <div style="display:flex;align-items:flex-start;justify-content:space-between;position:relative;">
        <div style="position:absolute;top:18px;left:8%;right:8%;height:2px;background:linear-gradient(90deg,#1E1B4B,#F43F5E);"></div>
        ${paymentDots}
      </div>
      <p style="text-align:center;color:#64748B;font-style:italic;font-size:13px;margin:22px 0 0;">Ka&#380;da p&#322;atno&#347;&#263; nast&#281;puje po zatwierdzeniu przez Ciebie deliverable z danego etapu.</p>
    </div>
  </div>
</section>`
    return editorWrap(editorMode, 'pricing', inner)
}

// ── S8 — Post-launch ─────────────────────────────────────────────────────────

function renderPostLaunch(b: MobileAppBlocks['postlaunch'], editorMode: boolean): string {
    const maintenancePlans = b.maintenancePlans.map(plan => {
        const isHighlighted = plan.highlighted
        const border = isHighlighted ? 'border:2px solid #818CF8;box-shadow:0 8px 30px rgba(30,27,75,0.1);' : 'border:1px solid #EDE9FE;box-shadow:0 6px 24px rgba(30,27,75,0.07);'
        const isIndividual = plan.price.toLowerCase().includes('indywidual') || plan.price.toLowerCase().includes('wycena')
        const priceEl = isIndividual
            ? `<div style="font-size:16px;font-weight:800;color:#F43F5E;">${esc(plan.price)}</div>`
            : `<div style="font-size:20px;font-weight:800;color:#1E1B4B;">${esc(plan.price)} <span style="font-size:13px;color:#64748B;font-weight:600;">z&#322;/mies</span></div>`
        return `
<div class="lift" style="background:#fff;border-radius:14px;${border}padding:26px;">
  <div style="font-size:28px;">${esc(plan.emoji)}</div>
  <div style="font-weight:700;font-size:17px;margin-top:10px;color:#0F172A;">${esc(plan.title)}</div>
  <p style="margin:8px 0 14px;color:#475569;font-size:13.5px;">${esc(plan.description)}</p>
  ${priceEl}
</div>`
    }).join('')

    const costRows = b.maintenanceCosts.map((row, ri) => `
<tr style="${ri % 2 === 1 ? 'background:#F8F7FF;' : ''}border-bottom:1px solid #EDE9FE;">
  <td style="padding:13px 18px;font-weight:600;">${esc(row.service)}</td>
  <td style="padding:13px 18px;">${esc(row.cost)}</td>
  <td style="padding:13px 18px;">${esc(row.notes)}</td>
</tr>`).join('')

    const inner = `
<section class="pb" style="position:relative;background:#fff;overflow:hidden;">
  <div class="wm">08</div>
  <div class="pad" style="position:relative;">
    <div style="max-width:760px;">
      <h2 style="margin:0;font-size:38px;font-weight:800;color:#0F172A;">${esc(b.sectionTitle)}</h2>
      <p style="color:#475569;font-size:17px;margin:14px 0 0;">${esc(b.sectionLead)}</p>
    </div>
    <h3 style="margin:44px 0 18px;font-size:22px;font-weight:700;color:#1E1B4B;">Publikacja w sklepach</h3>
    <div class="g2" style="display:grid;grid-template-columns:1fr 1fr;gap:22px;">
      <div class="lift" style="background:#fff;border-radius:14px;border:1px solid #EDE9FE;box-shadow:0 6px 24px rgba(30,27,75,0.07);padding:28px;">
        <div style="font-size:30px;">&#127822;</div>
        <div style="font-weight:700;font-size:18px;margin-top:10px;color:#0F172A;">App Store (Apple)</div>
        <div style="display:flex;flex-direction:column;gap:8px;margin-top:14px;font-size:14px;color:#475569;">
          <span>&#8226; Konto Apple Developer &#8212; <strong>99 USD / rok</strong></span>
          <span>&#8226; Czas review: <strong>5&#8211;7 dni</strong></span>
          <span>&#8226; Wymagania: ikony, screenshoty, polityka prywatno&#347;ci, ATS</span>
          <span>&#8226; Ryzyko odrzucenia przy braku zgodno&#347;ci z wytycznymi</span>
        </div>
      </div>
      <div class="lift" style="background:#fff;border-radius:14px;border:1px solid #EDE9FE;box-shadow:0 6px 24px rgba(30,27,75,0.07);padding:28px;">
        <div style="font-size:30px;">&#129302;</div>
        <div style="font-weight:700;font-size:18px;margin-top:10px;color:#0F172A;">Google Play</div>
        <div style="display:flex;flex-direction:column;gap:8px;margin-top:14px;font-size:14px;color:#475569;">
          <span>&#8226; Konto Google Play &#8212; <strong>25 USD jednorazowo</strong></span>
          <span>&#8226; Czas review: <strong>kilka godzin&#8211;dni</strong></span>
          <span>&#8226; Polityki Google dot. tre&#347;ci i uprawnie&#324;</span>
          <span>&#8226; &#321;atwiejszy proces ni&#380; w App Store</span>
        </div>
      </div>
    </div>
    <div style="margin-top:18px;padding:16px 22px;border-radius:12px;background:#F0FDF4;border:1px solid #16A34A;color:#15803D;font-size:14.5px;">&#10003; Przygotowanie i submission do obu sklep&#243;w jest wliczone w projekt.</div>
    <h3 style="margin:48px 0 18px;font-size:22px;font-weight:700;color:#1E1B4B;">Koszty utrzymania (miesi&#281;czne &#8212; po stronie klienta)</h3>
    <div class="scroll-x" style="border-radius:12px;overflow:hidden;box-shadow:0 6px 24px rgba(30,27,75,0.06);background:#fff;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;min-width:560px;">
        <thead><tr style="background:#1E1B4B;color:#fff;"><th style="text-align:left;padding:14px 18px;font-weight:600;">Us&#322;uga</th><th style="text-align:left;padding:14px 18px;font-weight:600;">Orientacyjny koszt</th><th style="text-align:left;padding:14px 18px;font-weight:600;">Uwagi</th></tr></thead>
        <tbody style="color:#334155;">${costRows}</tbody>
      </table>
    </div>
    <p style="margin-top:12px;color:#475569;font-style:italic;font-size:13.5px;">To koszty zewn&#281;trznych dostawc&#243;w, ponoszone bezpo&#347;rednio przez Ciebie. Nie ma w nich mojej mar&#380;y.</p>
    <h3 style="margin:48px 0 18px;font-size:22px;font-weight:700;color:#1E1B4B;">Pakiety utrzymania i rozwoju</h3>
    <div class="g3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px;">${maintenancePlans}</div>
    <div style="margin-top:18px;padding:16px 22px;border-radius:12px;background:#FFFBEB;border:1px solid #F59E0B;color:#92400E;font-size:14.5px;">&#9888;&#65039; ${esc(b.warningNote)}</div>
  </div>
</section>`
    return editorWrap(editorMode, 'postlaunch', inner)
}

// ── S9 — About ────────────────────────────────────────────────────────────────

function renderAbout(b: MobileAppBlocks['about'], editorMode: boolean): string {
    const techPills = b.techStack.map(t =>
        `<span style="padding:7px 14px;border-radius:999px;background:#1E1B4B;color:#fff;font-size:12.5px;font-weight:600;">${esc(t)}</span>`
    ).join('')

    const stats = b.stats.map(s =>
        `<div><div style="font-size:40px;font-weight:800;color:#F43F5E;line-height:1;">${esc(s.value)}</div><div style="font-size:11.5px;color:#64748B;margin-top:6px;">${esc(s.label)}</div></div>`
    ).join('')

    const portfolioCards = b.portfolioCards.map(card => `
<div class="lift" style="background:#fff;border-radius:14px;box-shadow:0 6px 24px rgba(30,27,75,0.07);padding:18px;display:flex;gap:16px;align-items:center;margin-bottom:14px;">
  <div style="width:62px;height:120px;border-radius:14px;border:2px solid #EDE9FE;background:linear-gradient(160deg,${esc(card.gradientFrom)},${esc(card.gradientTo)});flex-shrink:0;padding:6px;"><div style="width:100%;height:100%;border-radius:9px;background:rgba(255,255,255,0.18);"></div></div>
  <div>
    <div style="font-weight:700;font-size:15px;color:#0F172A;">${esc(card.title)}</div>
    <p style="margin:6px 0 10px;color:#475569;font-size:13px;">${esc(card.description)}</p>
    <span style="display:inline-block;padding:4px 10px;border-radius:999px;background:#EEF0FF;color:#4F46E5;font-size:10.5px;font-weight:700;">${esc(card.tag)}</span>
    <a href="#" style="color:#818CF8;font-size:11px;text-decoration:none;margin-left:8px;">${esc(card.storeLabel)}</a>
  </div>
</div>`).join('')

    const inner = `
<section style="position:relative;background:#F5F3FF;overflow:hidden;">
  <div class="wm">09</div>
  <div class="pad" style="position:relative;">
    <h2 style="margin:0 0 36px;font-size:38px;font-weight:800;color:#0F172A;">${esc(b.sectionTitle)}</h2>
    <div class="why-grid" style="display:grid;grid-template-columns:1.2fr 1fr;gap:40px;align-items:start;">
      <div>
        <p style="color:#334155;font-size:16px;line-height:1.7;margin:0 0 22px;">${esc(b.bio)}</p>
        <div style="font-weight:700;font-size:14px;color:#0F172A;margin-bottom:12px;">Stack technologiczny</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;">${techPills}</div>
        <div style="display:flex;gap:10px;margin-top:24px;flex-wrap:wrap;">
          <a href="${esc(b.linkedinUrl)}" style="padding:10px 20px;border-radius:999px;border:1px solid #C7C2DE;color:#1E1B4B;text-decoration:none;font-size:13px;font-weight:600;">LinkedIn</a>
          <a href="${esc(b.githubUrl)}" style="padding:10px 20px;border-radius:999px;border:1px solid #C7C2DE;color:#1E1B4B;text-decoration:none;font-size:13px;font-weight:600;">GitHub</a>
          <a href="${esc(b.portfolioUrl)}" style="padding:10px 20px;border-radius:999px;border:1px solid #C7C2DE;color:#1E1B4B;text-decoration:none;font-size:13px;font-weight:600;">Portfolio</a>
        </div>
      </div>
      <div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;text-align:center;margin-bottom:24px;">${stats}</div>
        ${portfolioCards}
      </div>
    </div>
  </div>
</section>`
    return editorWrap(editorMode, 'about', inner)
}

// ── S10 — Footer ──────────────────────────────────────────────────────────────

function renderFooter(b: MobileAppBlocks, offer: MobileAppOfferData, editorMode: boolean): string {
    const foot = b.footer
    const offerNum = esc(offer.offerNumber ?? '')
    const offerDate = esc(offer.offerDate ?? '')
    const validUntil = esc(offer.validUntil ?? foot.validityDate ?? '')
    const logoUrl = offer.userLogoDarkUrl || offer.userLogoUrl

    const logoEl = logoUrl
        ? `<img src="${esc(logoUrl)}" alt="logo" style="width:54px;height:54px;border-radius:14px;object-fit:contain;">`
        : `<div style="display:flex;align-items:center;justify-content:center;width:54px;height:54px;border-radius:14px;border:1.5px solid rgba(255,255,255,0.22);background:rgba(255,255,255,0.06);font-weight:800;font-size:13px;letter-spacing:1px;">LOGO</div>`

    const inner = `
<section class="pb sq-full-bleed-page sq-footer" style="position:relative;background:#1E1B4B;color:#fff;overflow:hidden;">
  <div class="orb" style="position:absolute;width:480px;height:480px;border-radius:50%;background:radial-gradient(circle,#F43F5E,transparent 70%);filter:blur(60px);opacity:0.18;top:-160px;left:-120px;pointer-events:none;"></div>
  <div class="orb" style="position:absolute;width:420px;height:420px;border-radius:50%;background:radial-gradient(circle,#818CF8,transparent 70%);filter:blur(60px);opacity:0.20;bottom:-160px;right:-120px;pointer-events:none;"></div>
  <div class="pad" style="position:relative;">
    <div style="text-align:center;max-width:680px;margin:0 auto;">
      <h2 style="margin:0;font-size:40px;font-weight:800;line-height:1.15;">${esc(foot.ctaHeadline)}</h2>
      <p style="color:rgba(255,255,255,0.7);font-size:16px;margin:18px 0 32px;">${esc(foot.ctaLead)}</p>
      <div class="footer-btns" style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap;">
        <a href="#" class="lift" style="padding:16px 32px;border-radius:999px;background:#F43F5E;color:#fff;text-decoration:none;font-weight:700;font-size:15px;box-shadow:0 10px 30px rgba(244,63,94,0.4);">UM&#211;W BEZP&#321;ATN&#260; KONSULTACJ&#280;</a>
        <a href="#" data-sq-action="accept" style="padding:16px 32px;border-radius:999px;background:rgba(255,255,255,0.1);color:#fff;text-decoration:none;font-weight:700;font-size:15px;border:1px solid rgba(255,255,255,0.3);">AKCEPTUJ&#280; OFERT&#280;</a>
      </div>
      ${validUntil ? `<div style="margin-top:18px;font-size:12px;color:rgba(255,255,255,0.4);">Oferta wa&#380;na do ${validUntil}</div>` : ''}
    </div>
    <div style="height:1px;background:rgba(255,255,255,0.08);margin:48px 0;"></div>
    <div class="g3" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:32px;">
      <div>${logoEl}<p style="margin:14px 0 0;color:rgba(255,255,255,0.6);font-size:13.5px;max-width:220px;">${esc(foot.companyTagline)}</p></div>
      <div>
        <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#818CF8;font-weight:700;margin-bottom:14px;">Kontakt</div>
        <div style="display:flex;flex-direction:column;gap:9px;font-size:14px;">
          <a href="mailto:${esc(foot.contactEmail)}" style="color:#fff;text-decoration:none;">&#9993;&#65039; ${esc(foot.contactEmail)}</a>
          <span style="color:rgba(255,255,255,0.8);">&#128222; ${esc(foot.contactPhone)}</span>
          <a href="https://${esc(foot.websiteUrl)}" style="color:#818CF8;text-decoration:none;">&#127760; ${esc(foot.websiteUrl)}</a>
        </div>
      </div>
      <div>
        <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#818CF8;font-weight:700;margin-bottom:14px;">Podsumowanie projektu</div>
        <div style="display:flex;flex-direction:column;gap:8px;font-size:13.5px;color:rgba(255,255,255,0.85);">
          <div style="display:flex;justify-content:space-between;gap:12px;"><span style="opacity:.6;">Platforma</span><span>${esc(foot.summaryPlatform)}</span></div>
          <div style="display:flex;justify-content:space-between;gap:12px;"><span style="opacity:.6;">Zakres</span><span>${esc(foot.summaryScope)}</span></div>
          <div style="display:flex;justify-content:space-between;gap:12px;"><span style="opacity:.6;">Szac. czas</span><span>${esc(foot.summaryTime)}</span></div>
          <div style="display:flex;justify-content:space-between;gap:12px;"><span style="opacity:.6;">Warto&#347;&#263;</span><span>${esc(foot.summaryValue)} z&#322;</span></div>
        </div>
      </div>
    </div>
    ${offerNum || offerDate ? `<div style="margin-top:40px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.08);text-align:center;font-size:12px;color:rgba(255,255,255,0.4);">Oferta nr ${offerNum} &#183; Przygotowana: ${offerDate} &#183; Wa&#380;na do: ${validUntil} &#183; Dokument poufny</div>` : ''}
  </div>
</section>`
    return editorWrap(editorMode, 'footer', inner)
}

// ── Section dispatcher ────────────────────────────────────────────────────────

function renderSection(key: MobileAppSectionKey, blocks: MobileAppBlocks, editorMode: boolean): string {
    switch (key) {
        case 'vision':       return renderVision(blocks.vision, editorMode)
        case 'platform':     return renderPlatform(blocks.platform, editorMode)
        case 'scope':        return renderScope(blocks.scope, editorMode)
        case 'architecture': return renderArchitecture(blocks.architecture, editorMode)
        case 'timeline':     return renderTimeline(blocks.timeline, editorMode)
        case 'pricing':      return renderPricing(blocks.pricing, editorMode)
        case 'postlaunch':   return renderPostLaunch(blocks.postlaunch, editorMode)
        case 'about':        return renderAbout(blocks.about, editorMode)
        default:             return ''
    }
}

// ── Main export ───────────────────────────────────────────────────────────────

export function buildMobileAppHtml(
    blocks: MobileAppBlocks,
    offer: MobileAppOfferData,
    options?: { editorMode?: boolean },
): string {
    const editorMode = options?.editorMode ?? false
    const sectionsHtml = blocks.sections.map(k => renderSection(k, blocks, editorMode)).join('\n')

    return buildHtmlDocument({
        title: 'Aplikacja mobilna — Propozycja',
        css: baseCss(editorMode),
        body: `<div style="width:100%;overflow-x:hidden;">
${renderCover(blocks, offer, editorMode)}
${sectionsHtml}
${renderFooter(blocks, offer, editorMode)}
</div>`,
    })
}

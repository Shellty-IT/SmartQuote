// src/lib/pdf/website-v3-html.ts
// HTML generator for the "Strona internetowa v3" offer template.
// Pure function — no side effects, no imports of React/server utilities.

import { EMBEDDED_FONTS_CSS } from './embedded-fonts'
import { mergeWebsiteV3WithDefaults, type WebsiteV3Blocks, type WebsiteV3SectionKey } from './website-v3-blocks'

// ── Offer data interface ──────────────────────────────────────────────────────

export interface WebsiteV3OfferData {
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

function esc(s: string | number | null | undefined): string {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
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
    return `<span style="color:inherit;font-weight:600;white-space:nowrap;">${esc(text)}</span>`
}

function secNum(n: string): string {
    return `<div style="position:absolute;top:24px;right:40px;font-size:120px;font-weight:800;line-height:1;color:#7C3AED;opacity:0.04;pointer-events:none;">${n}</div>`
}

function editorWrap(key: string, html: string, label: string, editorMode: boolean): string {
    if (!editorMode) return html
    return `<div
        data-sq-block="${esc(key)}"
        style="position:relative;cursor:pointer;outline:2px solid transparent;outline-offset:2px;border-radius:4px;transition:outline 0.15s;"
        onmouseenter="this.style.outline='2px solid #7C3AED'"
        onmouseleave="this.style.outline='2px solid transparent'"
        onclick="window.parent.postMessage({type:'sq:editBlock',blockKey:'${esc(key)}'},'*')"
        title="Edytuj: ${esc(label)}"
    >${html}<div style="position:absolute;top:8px;right:8px;padding:3px 10px;border-radius:999px;background:#7C3AED;color:#fff;font-size:11px;font-weight:700;pointer-events:none;opacity:0;transition:opacity 0.15s;" class="sq-edit-hint">✏ ${esc(label)}</div></div>
    <style>.sq-edit-hint{opacity:0!important;}[data-sq-block]:hover .sq-edit-hint{opacity:1!important;}</style>`
}

// ── CSS ───────────────────────────────────────────────────────────────────────

function buildCss(zoom: number): string {
    return `
${EMBEDDED_FONTS_CSS}
*,*::before,*::after{box-sizing:border-box;}
html,body{margin:0;padding:0;}
body{font-family:'Outfit',system-ui,sans-serif;color:#0F172A;background:#fff;-webkit-font-smoothing:antialiased;}
:root{
  --primary:#0F172A;--violet:#7C3AED;--cyan:#06B6D4;
  --grad:linear-gradient(135deg,#7C3AED 0%,#06B6D4 100%);
  --bg:#FFFFFF;--bg-alt:#F8FAFC;--text:#0F172A;--muted:#64748B;
}
a{color:inherit;text-decoration:none;}
.gradient-text{background:var(--grad);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;}
${zoom !== 1 ? `body{zoom:${zoom};}` : ''}
@media (max-width:768px){
  .grid-2,.grid-3,.pkg-grid,.stepper,.port-card{grid-template-columns:1fr !important;flex-direction:column !important;}
  .stepper-line{display:none !important;}
  .port-thumb{height:160px !important;}
  .cover-h1{font-size:44px !important;}
  .sec-num{font-size:72px !important;}
}
@media print{
  .no-print{display:none !important;}
  *{-webkit-print-color-adjust:exact !important;print-color-adjust:exact !important;}
  section{max-width:100% !important;overflow:visible !important;}
  section > div{max-width:100% !important;}
  .grid-2,.grid-3,.pkg-grid{grid-template-columns:minmax(0,1fr) !important;}
  .port-card{grid-template-columns:minmax(0,1fr) !important;}
  .stepper{flex-wrap:wrap !important;justify-content:center !important;}
  .stepper > *{flex:0 1 30% !important;min-width:150px !important;}
  table{width:100% !important;table-layout:fixed !important;}
  td,th{overflow-wrap:anywhere !important;}
  .pagebreak{break-before:page;page-break-before:always;}
  @page{size:A4;margin:0;}
}
`
}

// ── Section renderers ─────────────────────────────────────────────────────────

function renderCover(data: WebsiteV3OfferData, blocks: WebsiteV3Blocks, editorMode: boolean): string {
    const c = blocks.cover
    const ci = data.user.companyInfo
    const clientName = data.client.company || data.client.name || 'NAZWA FIRMY'
    const logo = ci?.logoDark || ci?.logoLight || ci?.logo
    const logoHtml = logo
        ? `<img src="${esc(logo)}" alt="logo" style="max-width:72px;max-height:52px;object-fit:contain;" />`
        : `<div style="display:flex;align-items:center;justify-content:center;width:48px;height:48px;border:1.5px solid rgba(255,255,255,0.25);border-radius:12px;font-weight:800;font-size:13px;letter-spacing:0.05em;background:rgba(255,255,255,0.06);">${ci?.name ? esc(ci.name.slice(0, 3).toUpperCase()) : 'LOGO'}</div>`
    const website = ci?.website ?? ''
    const websiteDisplay = website.replace(/^https?:\/\//, '')
    const offerDate = formatDate(data.createdAt)
    const validUntil = addDays(data.createdAt, c.validityDays)

    const pills = c.promisePills.map((p) =>
        `<div style="display:flex;align-items:center;gap:9px;padding:11px 22px;border-radius:999px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.16);font-size:14px;font-weight:500;"><span style="color:var(--cyan);">✦</span> ${esc(p)}</div>`
    ).join('')

    const inner = `
<section style="position:relative;padding:0;background:#0F172A;color:#fff;overflow:hidden;">
  <div style="position:absolute;inset:0;background:radial-gradient(60% 55% at 18% 12%,rgba(124,58,237,0.55) 0%,rgba(124,58,237,0) 60%),radial-gradient(55% 60% at 88% 92%,rgba(6,182,212,0.45) 0%,rgba(6,182,212,0) 60%);"></div>
  <div style="position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px);background-size:48px 48px;"></div>
  <div style="position:relative;z-index:2;padding:32px 48px 72px;">
    <nav style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;">
      <div style="display:flex;align-items:center;gap:14px;">
        ${logoHtml}
        ${website ? `<a href="${esc(website)}" style="font-size:15px;font-weight:600;color:rgba(255,255,255,0.85);border-bottom:1px solid rgba(255,255,255,0.25);padding-bottom:1px;">${esc(websiteDisplay)}</a>` : `<span style="font-size:15px;font-weight:600;color:rgba(255,255,255,0.7);">${esc(ci?.name ?? '')}</span>`}
      </div>
      <div style="display:flex;align-items:center;gap:10px;padding:9px 18px;border-radius:999px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.18);font-size:13px;font-weight:500;letter-spacing:0.02em;">
        <span style="opacity:0.7;">Oferta nr</span><span style="font-weight:700;">${ph(data.number)}</span>
        <span style="opacity:0.35;">·</span>
        <span style="opacity:0.7;">${ph(offerDate)}</span>
      </div>
    </nav>
    <div style="text-align:center;padding:88px 0 0;">
      <div style="display:inline-flex;align-items:center;gap:8px;padding:7px 16px;border-radius:999px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.16);font-size:12px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.75);margin-bottom:28px;">✦ ${esc(c.badgeLabel)}</div>
      <h1 class="cover-h1" style="margin:0;font-weight:300;font-size:72px;line-height:1.04;letter-spacing:-0.02em;">
        ${esc(c.subtitle)}<br>
        <span class="gradient-text" style="font-weight:800;">${esc(data.title || 'STRONA INTERNETOWA')}</span>
      </h1>
      <p style="margin:32px 0 0;font-size:13px;font-weight:600;letter-spacing:0.28em;text-transform:uppercase;color:rgba(255,255,255,0.6);">
        Przygotowana dla: ${ph(clientName)}
      </p>
    </div>
    <div style="max-width:760px;margin:56px auto 0;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.14);box-shadow:0 30px 80px rgba(0,0,0,0.45),0 0 60px rgba(124,58,237,0.25);">
      <div style="display:flex;align-items:center;gap:14px;padding:13px 18px;background:rgba(255,255,255,0.07);border-bottom:1px solid rgba(255,255,255,0.1);">
        <div style="display:flex;gap:8px;">
          <span style="width:12px;height:12px;border-radius:50%;background:#ff5f57;"></span>
          <span style="width:12px;height:12px;border-radius:50%;background:#febc2e;"></span>
          <span style="width:12px;height:12px;border-radius:50%;background:#28c840;"></span>
        </div>
        <div style="flex:1;display:flex;align-items:center;gap:8px;padding:7px 14px;border-radius:7px;background:rgba(0,0,0,0.25);font-size:12px;color:rgba(255,255,255,0.55);">
          <span style="color:var(--cyan);">🔒</span> ${website ? esc(websiteDisplay) : 'www.twoja-nowa-strona.pl'}
        </div>
      </div>
      <div style="height:280px;background:linear-gradient(135deg,#1e1b4b 0%,#0F172A 45%,#0c4a6e 100%);position:relative;overflow:hidden;">
        <div style="position:absolute;inset:0;background:radial-gradient(40% 60% at 25% 20%,rgba(124,58,237,0.6),transparent 60%),radial-gradient(45% 55% at 80% 85%,rgba(6,182,212,0.55),transparent 60%);"></div>
        <div style="position:absolute;top:36px;left:40px;right:40px;">
          <div style="width:42%;height:18px;border-radius:6px;background:rgba(255,255,255,0.85);"></div>
          <div style="width:64%;height:18px;border-radius:6px;background:rgba(255,255,255,0.55);margin-top:12px;"></div>
          <div style="width:120px;height:38px;border-radius:8px;background:var(--grad);margin-top:24px;"></div>
        </div>
        <div style="position:absolute;bottom:34px;left:40px;right:40px;display:flex;gap:16px;">
          <div style="flex:1;height:64px;border-radius:12px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.14);"></div>
          <div style="flex:1;height:64px;border-radius:12px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.14);"></div>
          <div style="flex:1;height:64px;border-radius:12px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.14);"></div>
        </div>
      </div>
    </div>
    <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:14px;margin-top:48px;">
      ${pills}
    </div>
    <div style="text-align:center;margin-top:24px;font-size:12px;color:rgba(255,255,255,0.45);">
      Oferta ważna do: ${ph(validUntil)} · Termin realizacji: ${ph(String(c.deadlineDays))} dni roboczych
    </div>
  </div>
</section>`
    return editorWrap('cover', inner, 'Okładka', editorMode)
}

function renderNeeds(blocks: WebsiteV3Blocks, editorMode: boolean, num: number): string {
    const b = blocks.needs
    const challengeItems = b.challengeItems.map((i) =>
        `<div style="display:flex;gap:12px;font-size:16px;line-height:1.55;"><span style="color:var(--violet);flex-shrink:0;">●</span><span>${esc(i)}</span></div>`
    ).join('')
    const responseItems = b.responseItems.map((i) =>
        `<div style="display:flex;gap:12px;font-size:16px;line-height:1.55;"><span style="color:var(--cyan);flex-shrink:0;">✦</span><span>${esc(i)}</span></div>`
    ).join('')
    const inner = `
<section style="position:relative;padding:96px 48px;background:#fff;overflow:hidden;">
  ${secNum(String(num).padStart(2, '0'))}
  <div style="max-width:1040px;margin:0 auto;position:relative;z-index:1;">
    <div style="font-size:13px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:var(--violet);">Wstęp</div>
    <h2 style="margin:12px 0 36px;font-size:40px;font-weight:700;letter-spacing:-0.02em;">${esc(b.title)}</h2>
    <p style="font-size:24px;line-height:1.5;font-weight:400;color:var(--violet);max-width:880px;margin:0 0 48px;">
      ${esc(b.intro)}
    </p>
    <div class="grid-2" style="display:grid;grid-template-columns:1fr 1fr;gap:28px;">
      <div style="padding:32px;border-radius:16px;background:var(--bg-alt);border-left:4px solid var(--violet);">
        <h3 style="margin:0 0 18px;font-size:20px;font-weight:700;">${esc(b.challengeTitle)}</h3>
        <div style="display:flex;flex-direction:column;gap:14px;">${challengeItems}</div>
      </div>
      <div style="padding:32px;border-radius:16px;background:var(--bg-alt);border-left:4px solid var(--cyan);">
        <h3 style="margin:0 0 18px;font-size:20px;font-weight:700;">${esc(b.responseTitle)}</h3>
        <div style="display:flex;flex-direction:column;gap:14px;">${responseItems}</div>
      </div>
    </div>
  </div>
</section>`
    return editorWrap('needs', inner, 'Rozumienie potrzeb', editorMode)
}

function renderPackages(blocks: WebsiteV3Blocks, editorMode: boolean, num: number): string {
    const b = blocks.packages
    const cards = b.packages.map((pkg) => {
        const features = pkg.features.map((f) =>
            f.included
                ? `<div style="display:flex;gap:10px;"><span style="color:${pkg.highlighted ? '#22d3ee' : '#16a34a'};font-weight:700;">✓</span> ${esc(f.label)}</div>`
                : `<div style="display:flex;gap:10px;color:${pkg.highlighted ? 'rgba(255,255,255,0.4)' : '#94A3B8'};"><span style="font-weight:700;">✕</span> ${esc(f.label)}</div>`
        ).join('')
        if (pkg.highlighted) {
            return `
<div style="display:flex;flex-direction:column;padding:34px 28px;border-radius:16px;background:#0F172A;color:#fff;position:relative;box-shadow:0 0 40px rgba(124,58,237,0.4);transform:translateY(-12px);">
  <div style="position:absolute;top:-14px;left:50%;transform:translateX(-50%);padding:7px 18px;border-radius:999px;background:var(--violet);font-size:11.5px;font-weight:700;letter-spacing:0.1em;white-space:nowrap;box-shadow:0 6px 18px rgba(124,58,237,0.5);">★ NAJPOPULARNIEJSZY</div>
  <div style="font-size:13px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--cyan);margin-top:6px;">${esc(pkg.name)}</div>
  <div style="margin:14px 0 4px;font-size:42px;font-weight:800;letter-spacing:-0.02em;color:var(--cyan);">${ph(pkg.price)}</div>
  <div style="font-size:14px;color:rgba(255,255,255,0.6);">${esc(pkg.tagline)}</div>
  <div style="height:1px;background:rgba(255,255,255,0.12);margin:24px 0;"></div>
  <div style="display:flex;flex-direction:column;gap:13px;flex:1;font-size:14.5px;line-height:1.4;">${features}</div>
  <div style="display:block;text-align:center;margin-top:26px;padding:14px;border-radius:8px;background:var(--grad);color:#fff;font-weight:700;font-size:15px;box-shadow:0 8px 24px rgba(124,58,237,0.4);">${esc(pkg.ctaLabel)}</div>
</div>`
        }
        return `
<div style="display:flex;flex-direction:column;padding:34px 28px;border-radius:16px;background:#fff;border:1px solid #E2E8F0;box-shadow:0 4px 18px rgba(15,23,42,0.05);">
  <div style="font-size:13px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--muted);">${esc(pkg.name)}</div>
  <div style="margin:14px 0 4px;font-size:42px;font-weight:800;color:var(--violet);letter-spacing:-0.02em;">${ph(pkg.price)} <span style="font-size:18px;font-weight:600;color:var(--muted);">zł netto</span></div>
  <div style="font-size:14px;color:var(--muted);">${esc(pkg.tagline)}</div>
  <div style="height:1px;background:#E2E8F0;margin:24px 0;"></div>
  <div style="display:flex;flex-direction:column;gap:13px;flex:1;font-size:14.5px;line-height:1.4;">${features}</div>
  <div style="display:block;text-align:center;margin-top:26px;padding:14px;border-radius:8px;border:1.5px solid var(--violet);color:var(--violet);font-weight:700;font-size:15px;">${esc(pkg.ctaLabel)}</div>
</div>`
    }).join('')
    const inner = `
<section style="position:relative;padding:96px 48px;background:var(--bg-alt);overflow:hidden;">
  ${secNum(String(num).padStart(2, '0'))}
  <div style="max-width:1160px;margin:0 auto;position:relative;z-index:1;">
    <div style="text-align:center;margin-bottom:48px;">
      <div style="font-size:13px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:var(--violet);">${esc(b.subtitle)}</div>
      <h2 style="margin:12px 0 0;font-size:40px;font-weight:700;letter-spacing:-0.02em;">${esc(b.title)}</h2>
    </div>
    <div class="pkg-grid" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px;align-items:stretch;">${cards}</div>
  </div>
</section>`
    return editorWrap('packages', inner, 'Pakiety', editorMode)
}

function renderProcess(blocks: WebsiteV3Blocks, editorMode: boolean, num: number): string {
    const b = blocks.process
    const steps = b.steps.map((s, i) => `
<div style="flex:1;text-align:center;display:flex;flex-direction:column;align-items:center;gap:10px;">
  <div style="width:54px;height:54px;border-radius:50%;background:var(--grad);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:18px;box-shadow:0 8px 20px rgba(124,58,237,0.3);">${i + 1}</div>
  <div style="font-weight:700;font-size:16px;">${esc(s.label)}</div>
  <div style="font-size:12.5px;font-weight:600;color:var(--violet);">${esc(s.duration)}</div>
  <div style="font-size:13px;color:var(--muted);line-height:1.5;max-width:160px;">${esc(s.description)}</div>
</div>`).join('')
    const inner = `
<section style="position:relative;padding:96px 48px;background:var(--bg-alt);overflow:hidden;">
  <div style="position:absolute;top:36px;left:40px;font-size:200px;font-weight:800;line-height:1;color:var(--violet);opacity:0.05;pointer-events:none;">${String(num).padStart(2, '0')}</div>
  <div style="max-width:1160px;margin:0 auto;position:relative;z-index:1;">
    <div style="text-align:center;margin-bottom:56px;">
      <div style="font-size:13px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:var(--violet);">Jak pracuję</div>
      <h2 style="margin:12px 0 0;font-size:40px;font-weight:700;letter-spacing:-0.02em;">${esc(b.title)}</h2>
    </div>
    <div style="position:relative;">
      <div class="stepper-line" style="position:absolute;top:26px;left:8%;right:8%;height:3px;background:var(--grad);border-radius:3px;z-index:0;"></div>
      <div class="stepper" style="display:flex;justify-content:space-between;gap:14px;position:relative;z-index:1;">${steps}</div>
    </div>
    <div style="margin-top:48px;padding:20px 26px;border-radius:12px;background:rgba(124,58,237,0.08);border-left:4px solid var(--violet);font-size:16px;font-weight:500;">
      ℹ️ <strong>${esc(b.timelineNote)}</strong>
    </div>
  </div>
</section>`
    return editorWrap('process', inner, 'Proces realizacji', editorMode)
}

function renderScope(blocks: WebsiteV3Blocks, editorMode: boolean, num: number): string {
    const b = blocks.scope
    const OPTIONAL_BADGE = `<span style="display:inline-block;padding:1px 8px;margin-left:4px;border-radius:999px;border:1px solid var(--cyan);color:var(--cyan);font-size:10.5px;font-weight:700;letter-spacing:0.05em;vertical-align:middle;">OPCJONALNIE</span>`
    const half = Math.ceil(b.categories.length / 2)
    const left = b.categories.slice(0, half)
    const right = b.categories.slice(half)

    function renderCat(cats: typeof b.categories) {
        return cats.map((cat) => {
            const items = cat.items.map((item) => `
<div style="display:flex;gap:12px;">
  <span style="color:var(--violet);font-weight:700;flex-shrink:0;">✓</span>
  <div>
    <div style="font-weight:600;">${esc(item.label)}${item.optional ? OPTIONAL_BADGE : ''}</div>
    ${item.description ? `<div style="font-size:13.5px;color:var(--muted);">${esc(item.description)}</div>` : ''}
  </div>
</div>`).join('')
            return `
<div>
  <h3 style="margin:0 0 16px;font-size:15px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--violet);">${esc(cat.title)}</h3>
  <div style="display:flex;flex-direction:column;gap:14px;">${items}</div>
</div>`
        }).join('')
    }

    const inner = `
<section style="position:relative;padding:96px 48px;background:#fff;overflow:hidden;">
  ${secNum(String(num).padStart(2, '0'))}
  <div style="max-width:1100px;margin:0 auto;position:relative;z-index:1;">
    <div style="font-size:13px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:var(--violet);">Co dokładnie dostajesz</div>
    <h2 style="margin:12px 0 44px;font-size:40px;font-weight:700;letter-spacing:-0.02em;">${esc(b.title)}</h2>
    <div class="grid-2" style="display:grid;grid-template-columns:1fr 1fr;gap:44px;">
      <div style="display:flex;flex-direction:column;gap:30px;">${renderCat(left)}</div>
      <div style="display:flex;flex-direction:column;gap:30px;">${renderCat(right)}</div>
    </div>
  </div>
</section>`
    return editorWrap('scope', inner, 'Zakres prac', editorMode)
}

function renderTimeline(blocks: WebsiteV3Blocks, editorMode: boolean, num: number): string {
    const b = blocks.timeline
    const headerCols = b.columnLabels.map((l) =>
        `<th style="padding:14px 8px;font-weight:600;color:var(--muted);border-bottom:1px solid #E2E8F0;">${esc(l)}</th>`
    ).join('')
    const rows = b.rows.map((r) => {
        const cells = r.fills.map((fill) => {
            const bg = fill === 1 ? 'var(--violet)' : fill === 0.5 ? 'rgba(124,58,237,0.35)' : 'transparent'
            return `<td style="padding:10px 8px;border-bottom:1px solid #F1F5F9;">${fill > 0 ? `<div style="height:18px;border-radius:5px;background:${bg};"></div>` : ''}</td>`
        }).join('')
        return `<tr><td style="padding:14px 18px;font-weight:600;border-bottom:1px solid #F1F5F9;">${esc(r.label)}</td>${cells}</tr>`
    }).join('')
    const dateNote = b.estimatedCompletion
        ? `<p style="margin:28px 0 0;font-size:18px;font-weight:600;">📅 Szacowany termin uruchomienia: ${ph(b.estimatedCompletion)}</p>`
        : ''
    const inner = `
<section style="position:relative;padding:96px 48px;background:var(--bg-alt);overflow:hidden;">
  ${secNum(String(num).padStart(2, '0'))}
  <div style="max-width:1060px;margin:0 auto;position:relative;z-index:1;">
    <div style="font-size:13px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:var(--violet);">Oś czasu</div>
    <h2 style="margin:12px 0 40px;font-size:40px;font-weight:700;letter-spacing:-0.02em;">${esc(b.title)}</h2>
    <div style="background:#fff;border-radius:16px;border:1px solid #E2E8F0;overflow:hidden;box-shadow:0 4px 18px rgba(15,23,42,0.05);">
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead><tr style="background:var(--bg-alt);">
          <th style="text-align:left;padding:14px 18px;font-weight:700;color:var(--text);border-bottom:1px solid #E2E8F0;">Etap</th>
          ${headerCols}
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    ${dateNote}
  </div>
</section>`
    return editorWrap('timeline', inner, 'Harmonogram', editorMode)
}

function renderPricing(data: WebsiteV3OfferData, blocks: WebsiteV3Blocks, editorMode: boolean, num: number): string {
    const b = blocks.pricing
    const mainItems = b.items.filter((i) => !i.isExtra).map((i) => `
<tr>
  <td style="padding:15px 20px;font-weight:600;border-bottom:1px solid #F1F5F9;">${ph(i.label)}</td>
  <td style="padding:15px 20px;color:var(--muted);border-bottom:1px solid #F1F5F9;">${ph(i.details)}</td>
  <td style="padding:15px 20px;text-align:right;font-weight:600;border-bottom:1px solid #F1F5F9;white-space:nowrap;">${ph(i.price)} zł</td>
</tr>`).join('')
    const extraItems = b.items.filter((i) => i.isExtra).map((i) => `
<tr>
  <td style="padding:15px 20px;border-bottom:1px solid #F1F5F9;">${esc(i.label)}</td>
  <td style="padding:15px 20px;color:var(--muted);border-bottom:1px solid #F1F5F9;">${esc(i.details)}</td>
  <td style="padding:15px 20px;text-align:right;border-bottom:1px solid #F1F5F9;white-space:nowrap;">${ph(i.price)} zł</td>
</tr>`).join('')

    const gross = b.priceOverride ?? data.totalGross
    const net = Math.round(gross / 1.23)
    const vat = gross - net

    const paymentSteps = b.paymentSteps.map((s) => `
<div style="flex:1;display:flex;flex-direction:column;align-items:center;text-align:center;position:relative;">
  <div style="width:44px;height:44px;border-radius:50%;background:var(--grad);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:15px;z-index:1;">${s.percent}%</div>
  <div style="font-weight:600;margin-top:12px;">${esc(s.label)}</div>
  <div style="font-size:13px;color:var(--muted);">${esc(s.description)}</div>
</div>`).join('<div style="flex:0 0 80px;height:3px;background:var(--grad);margin-top:21px;border-radius:3px;"></div>')

    const inner = `
<section style="position:relative;padding:96px 48px;background:#fff;overflow:hidden;">
  ${secNum(String(num).padStart(2, '0'))}
  <div style="max-width:1040px;margin:0 auto;position:relative;z-index:1;">
    <div style="font-size:13px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:var(--violet);">Inwestycja</div>
    <h2 style="margin:12px 0 40px;font-size:40px;font-weight:700;letter-spacing:-0.02em;">${esc(b.title)}</h2>
    <div style="border-radius:16px;overflow:hidden;border:1px solid #E2E8F0;box-shadow:0 8px 32px rgba(124,58,237,0.1);">
      <table style="width:100%;border-collapse:collapse;font-size:15px;">
        <thead><tr style="background:var(--grad);color:#fff;">
          <th style="text-align:left;padding:16px 20px;font-weight:700;">Pozycja</th>
          <th style="text-align:left;padding:16px 20px;font-weight:700;">Szczegóły</th>
          <th style="text-align:right;padding:16px 20px;font-weight:700;white-space:nowrap;">Cena netto</th>
        </tr></thead>
        <tbody>
          ${mainItems}
          <tr style="background:var(--bg-alt);">
            <td colspan="3" style="padding:12px 20px;font-size:12.5px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted);">Opcje dodatkowe</td>
          </tr>
          ${extraItems}
        </tbody>
        <tfoot>
          <tr style="background:var(--bg-alt);">
            <td colspan="2" style="padding:13px 20px;text-align:right;font-weight:600;color:var(--muted);">Netto</td>
            <td style="padding:13px 20px;text-align:right;font-weight:700;white-space:nowrap;">${ph(net.toLocaleString('pl-PL'))} zł</td>
          </tr>
          <tr style="background:var(--bg-alt);">
            <td colspan="2" style="padding:13px 20px;text-align:right;font-weight:600;color:var(--muted);">VAT 23%</td>
            <td style="padding:13px 20px;text-align:right;font-weight:700;white-space:nowrap;">${ph(vat.toLocaleString('pl-PL'))} zł</td>
          </tr>
          <tr style="background:#0F172A;color:#fff;">
            <td colspan="2" style="padding:20px;text-align:right;font-weight:700;font-size:18px;">Brutto do zapłaty</td>
            <td style="padding:20px;text-align:right;font-weight:800;font-size:26px;white-space:nowrap;color:var(--cyan);">${ph(gross.toLocaleString('pl-PL'))} zł</td>
          </tr>
        </tfoot>
      </table>
    </div>
    <div style="margin-top:40px;padding:30px;border-radius:16px;background:var(--bg-alt);border:1px solid #E2E8F0;">
      <div style="font-size:15px;font-weight:700;margin-bottom:24px;">Harmonogram płatności</div>
      <div style="display:flex;align-items:flex-start;gap:0;">${paymentSteps}</div>
    </div>
  </div>
</section>`
    return editorWrap('pricing', inner, 'Wycena', editorMode)
}

function renderPortfolio(blocks: WebsiteV3Blocks, editorMode: boolean, num: number): string {
    const b = blocks.portfolio
    const THUMB_GRADIENTS: Record<string, string> = {
        violet: 'linear-gradient(135deg,#7C3AED,#a855f7)',
        cyan: 'linear-gradient(135deg,#06B6D4,#0ea5e9)',
        dark: 'linear-gradient(135deg,#0F172A,#334155)',
    }
    const cards = b.items.map((item) => {
        const grad = THUMB_GRADIENTS[item.thumbColor] ?? THUMB_GRADIENTS.violet
        return `
<div class="port-card" style="display:grid;grid-template-columns:300px 1fr;gap:0;border-radius:16px;overflow:hidden;background:#fff;border:1px solid #E2E8F0;box-shadow:0 4px 18px rgba(15,23,42,0.05);">
  <div class="port-thumb" style="background:${grad};position:relative;min-height:200px;">
    <div style="position:absolute;inset:0;background:radial-gradient(50% 50% at 70% 30%,rgba(255,255,255,0.25),transparent);"></div>
    <div style="position:absolute;top:24px;left:24px;right:24px;height:14px;border-radius:4px;background:rgba(255,255,255,0.85);"></div>
    <div style="position:absolute;top:48px;left:24px;width:60%;height:14px;border-radius:4px;background:rgba(255,255,255,0.5);"></div>
    <div style="position:absolute;bottom:24px;left:24px;width:90px;height:30px;border-radius:6px;background:rgba(255,255,255,0.9);"></div>
  </div>
  <div style="padding:28px 32px;">
    <h3 style="margin:0 0 4px;font-size:21px;font-weight:700;">${ph(item.name)}</h3>
    <div style="font-size:13px;font-weight:600;color:var(--cyan);letter-spacing:0.04em;text-transform:uppercase;margin-bottom:14px;">${ph(item.industry)}</div>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:var(--muted);">${ph(item.description)}</p>
    <span style="display:inline-block;padding:6px 14px;border-radius:999px;background:rgba(124,58,237,0.1);color:var(--violet);font-size:12.5px;font-weight:700;">${ph(item.tech)}</span>
  </div>
</div>`
    }).join('')
    const portfolioLink = b.portfolioUrl
        ? `<div style="text-align:center;margin-top:36px;"><a href="${esc(b.portfolioUrl)}" style="display:inline-block;padding:13px 30px;border-radius:8px;border:1.5px solid var(--violet);color:var(--violet);font-weight:700;font-size:15px;">Zobacz pełne portfolio →</a></div>`
        : ''
    const inner = `
<section style="position:relative;padding:96px 48px;background:var(--bg-alt);overflow:hidden;">
  ${secNum(String(num).padStart(2, '0'))}
  <div style="max-width:1060px;margin:0 auto;position:relative;z-index:1;">
    <div style="font-size:13px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:var(--violet);">Realizacje</div>
    <h2 style="margin:12px 0 40px;font-size:40px;font-weight:700;letter-spacing:-0.02em;">${esc(b.title)}</h2>
    <div style="display:flex;flex-direction:column;gap:24px;">${cards}</div>
    ${portfolioLink}
  </div>
</section>`
    return editorWrap('portfolio', inner, 'Portfolio', editorMode)
}

function renderTestimonials(blocks: WebsiteV3Blocks, editorMode: boolean, num: number): string {
    const b = blocks.testimonials
    const cards = b.items.map((t) => `
<div style="position:relative;padding:36px 32px 32px;border-radius:16px;background:rgba(124,58,237,0.04);border:1px solid rgba(124,58,237,0.12);">
  <div style="font-size:64px;font-weight:800;line-height:0.6;color:var(--violet);opacity:0.5;font-family:Georgia,serif;">&ldquo;</div>
  <p style="margin:8px 0 24px;font-size:17px;line-height:1.6;">${ph(t.quote)}</p>
  <div style="display:flex;align-items:center;gap:14px;">
    <div style="width:46px;height:46px;border-radius:50%;background:var(--grad);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:15px;">${ph(t.initials)}</div>
    <div><div style="font-weight:700;font-size:15px;">${ph(t.name)}</div><div style="font-size:13px;color:var(--muted);">${ph(t.position)}</div></div>
  </div>
</div>`).join('')
    const inner = `
<section style="position:relative;padding:96px 48px;background:#fff;overflow:hidden;">
  ${secNum(String(num).padStart(2, '0'))}
  <div style="max-width:1000px;margin:0 auto;position:relative;z-index:1;">
    <div style="font-size:13px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:var(--violet);">Opinie klientów</div>
    <h2 style="margin:12px 0 40px;font-size:40px;font-weight:700;letter-spacing:-0.02em;">${esc(b.title)}</h2>
    <div class="grid-2" style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">${cards}</div>
  </div>
</section>`
    return editorWrap('testimonials', inner, 'Referencje', editorMode)
}

function renderAbout(blocks: WebsiteV3Blocks, editorMode: boolean, num: number): string {
    const b = blocks.about
    const stats = b.stats.map((s) => `
<div style="padding:22px 26px;border-radius:14px;background:#fff;border:1px solid #E2E8F0;">
  <div style="font-size:40px;font-weight:800;color:var(--violet);line-height:1;">${ph(s.value)}+</div>
  <div style="font-size:13px;color:var(--muted);margin-top:4px;">${esc(s.label)}</div>
</div>`).join('')
    const inner = `
<section style="position:relative;padding:96px 48px;background:var(--bg-alt);overflow:hidden;">
  ${secNum(String(num).padStart(2, '0'))}
  <div style="max-width:1040px;margin:0 auto;position:relative;z-index:1;">
    <div style="font-size:13px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:var(--violet);">Kto to zrobi</div>
    <h2 style="margin:12px 0 40px;font-size:40px;font-weight:700;letter-spacing:-0.02em;">${esc(b.title)}</h2>
    <div class="about-grid" style="display:grid;grid-template-columns:1.4fr 1fr;gap:44px;align-items:center;">
      <div>
        <p style="margin:0 0 18px;font-size:17px;line-height:1.65;">${ph(b.bio1)}</p>
        <p style="margin:0 0 26px;font-size:16px;line-height:1.65;color:var(--muted);">${ph(b.bio2)}</p>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;">${stats}</div>
    </div>
  </div>
</section>`
    return editorWrap('about', inner, 'O wykonawcy', editorMode)
}

function renderStack(blocks: WebsiteV3Blocks, editorMode: boolean): string {
    const b = blocks.stack
    const pills = b.technologies.map((t) =>
        `<span style="padding:11px 22px;border-radius:999px;border:1px solid rgba(124,58,237,0.5);color:var(--cyan);font-weight:600;font-size:15px;">${esc(t)}</span>`
    ).join('')
    const inner = `
<section style="position:relative;padding:88px 48px;background:#0F172A;color:#fff;overflow:hidden;">
  <div style="position:absolute;inset:0;background:radial-gradient(50% 60% at 80% 10%,rgba(124,58,237,0.25),transparent 60%),radial-gradient(50% 60% at 10% 90%,rgba(6,182,212,0.2),transparent 60%);"></div>
  <div style="max-width:1000px;margin:0 auto;position:relative;z-index:1;text-align:center;">
    <div style="font-size:13px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:var(--cyan);">Technologie</div>
    <h2 style="margin:12px 0 40px;font-size:40px;font-weight:700;letter-spacing:-0.02em;color:#fff;">${esc(b.title)}</h2>
    <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:14px;">${pills}</div>
  </div>
</section>`
    return editorWrap('stack', inner, 'Technologie', editorMode)
}

function renderTerms(blocks: WebsiteV3Blocks, editorMode: boolean, num: number): string {
    const b = blocks.terms
    const cards = b.guarantees.map((g) => `
<div style="text-align:center;padding:34px 24px;border-radius:16px;background:var(--bg-alt);border:1px solid #E2E8F0;">
  <div style="font-size:42px;line-height:1;">${g.emoji}</div>
  <div style="font-weight:700;font-size:18px;margin:16px 0 8px;">${esc(g.title)}</div>
  <p style="margin:0;font-size:14px;color:var(--muted);line-height:1.55;">${esc(g.description)}</p>
</div>`).join('')
    const inner = `
<section style="position:relative;padding:96px 48px;background:#fff;overflow:hidden;">
  ${secNum(String(num).padStart(2, '0'))}
  <div style="max-width:1040px;margin:0 auto;position:relative;z-index:1;">
    <div style="font-size:13px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:var(--violet);">Spokój i bezpieczeństwo</div>
    <h2 style="margin:12px 0 44px;font-size:40px;font-weight:700;letter-spacing:-0.02em;">${esc(b.title)}</h2>
    <div class="grid-3" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px;">${cards}</div>
    <div style="margin-top:32px;padding:26px 30px;border-radius:12px;background:rgba(124,58,237,0.08);border-left:4px solid var(--violet);">
      <div style="font-weight:700;margin-bottom:12px;">Warunki formalne</div>
      <div style="display:flex;flex-direction:column;gap:10px;font-size:15px;line-height:1.5;">
        <div><strong>Płatność:</strong> ${ph(b.paymentTerms)}</div>
        <div><strong>Forma umowy:</strong> ${ph(b.contractForm)}</div>
        <div><strong>Prawa autorskie:</strong> ${ph(b.copyrightTerms)}</div>
      </div>
    </div>
  </div>
</section>`
    return editorWrap('terms', inner, 'Warunki', editorMode)
}

function renderFooter(data: WebsiteV3OfferData, blocks: WebsiteV3Blocks, editorMode: boolean): string {
    const b = blocks.footer
    const ci = data.user.companyInfo
    const website = ci?.website ?? ''
    const websiteDisplay = website.replace(/^https?:\/\//, '')
    const logo = ci?.logoDark || ci?.logoLight || ci?.logo
    const logoHtml = logo
        ? `<img src="${esc(logo)}" alt="logo" style="max-width:72px;max-height:52px;object-fit:contain;" />`
        : `<div style="display:flex;align-items:center;justify-content:center;width:44px;height:44px;border:1.5px solid rgba(255,255,255,0.4);border-radius:11px;font-weight:800;font-size:12px;">${ci?.name ? esc(ci.name.slice(0, 3).toUpperCase()) : 'LOGO'}</div>`
    const validUntil = addDays(data.createdAt, blocks.cover.validityDays)
    const inner = `
<section id="cta" style="position:relative;padding:88px 48px 56px;background:var(--grad);color:#fff;overflow:hidden;text-align:center;">
  <div style="position:absolute;inset:0;background:radial-gradient(40% 60% at 50% 0%,rgba(255,255,255,0.18),transparent 60%);"></div>
  <div style="max-width:760px;margin:0 auto;position:relative;z-index:1;">
    <h2 style="margin:0;font-size:52px;font-weight:800;letter-spacing:-0.02em;line-height:1.05;">${esc(b.ctaHeadline)}</h2>
    <p style="margin:18px 0 36px;font-size:18px;color:rgba(255,255,255,0.9);">${esc(b.ctaSubtitle)}</p>
    <div class="no-print" data-sq-action="accept" style="display:inline-block;padding:18px 44px;border-radius:999px;background:#fff;color:var(--violet);font-weight:800;font-size:17px;letter-spacing:0.01em;box-shadow:0 14px 40px rgba(0,0,0,0.2);">AKCEPTUJĘ OFERTĘ I CHCĘ ZACZĄĆ →</div>
    <div style="margin-top:48px;padding-top:32px;border-top:1px solid rgba(255,255,255,0.2);display:flex;flex-direction:column;align-items:center;gap:14px;">
      <div style="display:flex;align-items:center;gap:12px;">
        ${logoHtml}
        ${website ? `<a href="${esc(website)}" style="font-weight:600;border-bottom:1px solid rgba(255,255,255,0.4);">${esc(websiteDisplay)}</a>` : ''}
      </div>
      <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:8px 24px;font-size:15px;color:rgba(255,255,255,0.92);">
        ${data.user.email ? `<span>✉ ${esc(data.user.email)}</span>` : ''}
        ${ci?.phone ? `<span>☎ ${esc(ci.phone)}</span>` : ''}
      </div>
      <div style="font-size:12px;color:rgba(255,255,255,0.65);margin-top:8px;">
        Oferta nr ${ph(data.number)} · ważna do ${ph(validUntil)} · Dokument poufny — przeznaczony wyłącznie dla adresata.
      </div>
    </div>
  </div>
</section>`
    return editorWrap('footer', inner, 'Stopka / CTA', editorMode)
}

// ── Section dispatcher ────────────────────────────────────────────────────────

function renderSection(
    key: WebsiteV3SectionKey,
    data: WebsiteV3OfferData,
    blocks: WebsiteV3Blocks,
    editorMode: boolean,
    sectionNum: number,
): string {
    switch (key) {
        case 'needs':        return renderNeeds(blocks, editorMode, sectionNum)
        case 'packages':     return renderPackages(blocks, editorMode, sectionNum)
        case 'process':      return renderProcess(blocks, editorMode, sectionNum)
        case 'scope':        return renderScope(blocks, editorMode, sectionNum)
        case 'timeline':     return renderTimeline(blocks, editorMode, sectionNum)
        case 'pricing':      return renderPricing(data, blocks, editorMode, sectionNum)
        case 'portfolio':    return renderPortfolio(blocks, editorMode, sectionNum)
        case 'testimonials': return renderTestimonials(blocks, editorMode, sectionNum)
        case 'about':        return renderAbout(blocks, editorMode, sectionNum)
        case 'stack':        return renderStack(blocks, editorMode)
        case 'terms':        return renderTerms(blocks, editorMode, sectionNum)
        default:             return ''
    }
}

// ── Main export ───────────────────────────────────────────────────────────────

export function buildWebsiteV3Html(
    data: WebsiteV3OfferData,
    options?: { editorMode?: boolean; zoom?: number },
): string {
    const editorMode = options?.editorMode ?? false
    const zoom = options?.zoom ?? 1
    const blocks = mergeWebsiteV3WithDefaults(data.blocks as Partial<WebsiteV3Blocks> | null)

    let sectionNum = 2
    const sectionsHtml = blocks.sections
        .filter((key) => blocks[key]?.enabled !== false)
        .map((key) => {
            const html = renderSection(key, data, blocks, editorMode, sectionNum)
            if (key !== 'stack') sectionNum++
            return html
        })
        .join('\n')

    return `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>${buildCss(zoom)}</style>
</head>
<body>
<div style="max-width:1280px;margin:0 auto;background:#fff;box-shadow:0 0 80px rgba(15,23,42,0.06);">
${renderCover(data, blocks, editorMode)}
${sectionsHtml}
${renderFooter(data, blocks, editorMode)}
</div>
</body>
</html>`
}

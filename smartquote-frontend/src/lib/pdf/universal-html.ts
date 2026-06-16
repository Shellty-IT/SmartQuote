// src/lib/pdf/universal-html.ts
// HTML generator for the "Szablon uniwersalny" offer template.
// Design: navy #1B3A5C + gold #C9A84C, Outfit Variable font (no external network).

import { EMBEDDED_FONTS_CSS } from './embedded-fonts'
import type { UniversalBlocks, UniversalSectionKey } from './universal-blocks'

export interface UniversalOfferData {
    offerNumber?: string
    offerDate?: string
    clientName?: string
    userLogoUrl?: string
    userCompanyName?: string
    userEmail?: string
    userPhone?: string
    userWebsite?: string
}

function esc(s: string | undefined | null): string {
    if (!s) return ''
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}

function editorWrap(editorMode: boolean, key: string, inner: string): string {
    if (!editorMode) return inner
    return `<div class="sq-block" data-key="${key}" style="cursor:pointer;outline-offset:2px;" onclick="window.parent.postMessage({type:'sq:editBlock',blockKey:'${key}'},\\"*\\")">${inner}</div>`
}

// ── Cover ─────────────────────────────────────────────────────────────────────

function renderCover(blocks: UniversalBlocks, offer: UniversalOfferData, editorMode: boolean): string {
    const c = blocks.cover
    const offerDate = c.offerDate || offer.offerDate || ''
    const validUntil = c.validUntil || ''
    const logoUrl = offer.userLogoUrl || ''
    const websiteUrl = c.websiteUrl || offer.userWebsite || ''

    const logoImg = logoUrl
        ? `<img src="${esc(logoUrl)}" alt="Logo" style="max-height:56px;max-width:180px;object-fit:contain;filter:brightness(0) invert(1);" />`
        : `<span style="font-size:1.35rem;font-weight:700;letter-spacing:.03em;color:#fff;">${esc(c.contractorName)}</span>`

    const inner = `
<div style="background:#1B3A5C;color:#fff;min-height:100vh;position:relative;font-family:'Outfit Variable',sans-serif;display:flex;flex-direction:column;">

  <!-- top bar -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;padding:40px 56px 0;">
    <div style="display:flex;flex-direction:column;gap:6px;">
      ${logoImg}
      <span style="font-size:.8rem;opacity:.7;margin-top:4px;">${esc(websiteUrl)}</span>
    </div>
    <div style="text-align:right;opacity:.7;">
      <div style="font-size:.75rem;letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px;">Nr oferty</div>
      <div style="font-size:.9rem;font-weight:600;">${esc(offer.offerNumber || 'OFF/2026/001')}</div>
      ${offerDate ? `<div style="font-size:.78rem;margin-top:6px;">${esc(offerDate)}</div>` : ''}
    </div>
  </div>

  <!-- accent line + title area -->
  <div style="flex:1;display:flex;align-items:center;padding:60px 56px;">
    <div style="display:flex;gap:32px;align-items:flex-start;max-width:700px;">
      <!-- gold vertical deco -->
      <div style="width:5px;background:#C9A84C;border-radius:3px;min-height:120px;flex-shrink:0;margin-top:6px;"></div>
      <div>
        <div style="font-size:.8rem;letter-spacing:.18em;text-transform:uppercase;color:#C9A84C;font-weight:600;margin-bottom:20px;">Oferta handlowa</div>
        <h1 style="font-size:2.8rem;font-weight:800;line-height:1.15;margin:0 0 28px;letter-spacing:-.01em;">${esc(c.serviceTitle)}</h1>
        <div style="height:2px;background:linear-gradient(90deg,#C9A84C 0%,transparent 70%);width:160px;margin-bottom:24px;"></div>
        <div style="font-size:.85rem;opacity:.7;margin-bottom:6px;letter-spacing:.06em;text-transform:uppercase;">Przygotowana dla</div>
        <div style="font-size:1.5rem;font-weight:700;">${esc(c.clientName)}</div>
      </div>
    </div>
  </div>

  <!-- contractor info bottom-right -->
  <div style="padding:0 56px 40px;display:flex;justify-content:flex-end;">
    <div style="text-align:right;opacity:.85;">
      <div style="font-size:1rem;font-weight:700;">${esc(c.contractorName)}</div>
      <div style="font-size:.82rem;color:#C9A84C;margin-bottom:8px;">${esc(c.contractorRole)}</div>
      <div style="font-size:.8rem;opacity:.75;">${esc(c.contractorEmail)}</div>
      <div style="font-size:.8rem;opacity:.75;">${esc(c.contractorPhone)}</div>
    </div>
  </div>

  <!-- footer bar -->
  <div style="background:rgba(0,0,0,.25);padding:12px 56px;display:flex;justify-content:space-between;align-items:center;font-size:.75rem;opacity:.8;">
    <span>${offerDate ? `Data wystawienia: ${esc(offerDate)}` : 'Oferta handlowa'}</span>
    ${validUntil ? `<span>Ważna do: ${esc(validUntil)}</span>` : '<span>Poufne — wyłącznie dla adresata</span>'}
  </div>
</div>`
    return editorWrap(editorMode, 'cover', inner)
}

// ── Summary ───────────────────────────────────────────────────────────────────

function renderSummary(blocks: UniversalBlocks, editorMode: boolean): string {
    const s = blocks.summary
    const inner = `
<section style="padding:64px 56px;background:#fff;">
  <div style="max-width:900px;margin:0 auto;">
    <div style="font-size:.72rem;letter-spacing:.18em;text-transform:uppercase;color:#C9A84C;font-weight:700;margin-bottom:10px;">${esc(s.eyebrow)}</div>
    <h2 style="font-size:1.9rem;font-weight:800;color:#1B3A5C;margin:0 0 40px;">${esc(s.title)}</h2>
    <div style="display:grid;grid-template-columns:3fr 2fr;gap:40px;align-items:start;">
      <!-- lead text with gold left-border -->
      <div style="border-left:4px solid #C9A84C;padding-left:24px;">
        <p style="font-size:1rem;line-height:1.75;color:#0F172A;margin:0;white-space:pre-line;">${esc(s.leadText)}</p>
      </div>
      <!-- fact cards -->
      <div style="display:flex;flex-direction:column;gap:16px;">
        <div style="background:#F1F5F9;border-radius:12px;padding:18px 20px;">
          <div style="font-size:.68rem;letter-spacing:.12em;text-transform:uppercase;color:#475569;font-weight:600;margin-bottom:6px;">Zakres projektu</div>
          <div style="font-size:.95rem;font-weight:700;color:#1B3A5C;">${esc(s.scopeFact)}</div>
        </div>
        <div style="background:#F1F5F9;border-radius:12px;padding:18px 20px;">
          <div style="font-size:.68rem;letter-spacing:.12em;text-transform:uppercase;color:#475569;font-weight:600;margin-bottom:6px;">Szacowany czas</div>
          <div style="font-size:.95rem;font-weight:700;color:#1B3A5C;">${esc(s.timelineFact)}</div>
        </div>
        <div style="background:#1B3A5C;border-radius:12px;padding:18px 20px;">
          <div style="font-size:.68rem;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.65);font-weight:600;margin-bottom:6px;">Wartość inwestycji</div>
          <div style="font-size:1.15rem;font-weight:800;color:#C9A84C;">${esc(s.valueFact)} PLN netto</div>
        </div>
      </div>
    </div>
  </div>
</section>`
    return editorWrap(editorMode, 'summary', inner)
}

// ── Needs ─────────────────────────────────────────────────────────────────────

function renderNeeds(blocks: UniversalBlocks, editorMode: boolean): string {
    const n = blocks.needs
    const inner = `
<section style="padding:64px 56px;background:#F1F5F9;">
  <div style="max-width:900px;margin:0 auto;">
    <div style="font-size:.72rem;letter-spacing:.18em;text-transform:uppercase;color:#C9A84C;font-weight:700;margin-bottom:10px;">Analiza potrzeb</div>
    <h2 style="font-size:1.9rem;font-weight:800;color:#1B3A5C;margin:0 0 12px;">Dlaczego ten projekt?</h2>
    ${n.sourceNote ? `<p style="font-size:.82rem;color:#475569;margin:0 0 36px;">Na podstawie: ${esc(n.sourceNote)}</p>` : '<div style="margin-bottom:36px;"></div>'}
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;">
      <div style="background:#fff;border-radius:14px;padding:24px;border-top:4px solid #EF4444;">
        <div style="font-size:.7rem;letter-spacing:.12em;text-transform:uppercase;color:#EF4444;font-weight:700;margin-bottom:10px;">🔥 Wyzwanie</div>
        <p style="font-size:.9rem;line-height:1.65;color:#0F172A;margin:0;white-space:pre-line;">${esc(n.challengeText)}</p>
      </div>
      <div style="background:#fff;border-radius:14px;padding:24px;border-top:4px solid #1B3A5C;">
        <div style="font-size:.7rem;letter-spacing:.12em;text-transform:uppercase;color:#1B3A5C;font-weight:700;margin-bottom:10px;">🎯 Cel</div>
        <p style="font-size:.9rem;line-height:1.65;color:#0F172A;margin:0;white-space:pre-line;">${esc(n.goalText)}</p>
      </div>
      <div style="background:#fff;border-radius:14px;padding:24px;border-top:4px solid #C9A84C;">
        <div style="font-size:.7rem;letter-spacing:.12em;text-transform:uppercase;color:#C9A84C;font-weight:700;margin-bottom:10px;">✅ Oczekiwany rezultat</div>
        <p style="font-size:.9rem;line-height:1.65;color:#0F172A;margin:0;white-space:pre-line;">${esc(n.resultText)}</p>
      </div>
    </div>
  </div>
</section>`
    return editorWrap(editorMode, 'needs', inner)
}

// ── Scope ─────────────────────────────────────────────────────────────────────

function renderScope(blocks: UniversalBlocks, editorMode: boolean): string {
    const s = blocks.scope
    const inner = `
<section style="padding:64px 56px;background:#fff;">
  <div style="max-width:900px;margin:0 auto;">
    <div style="font-size:.72rem;letter-spacing:.18em;text-transform:uppercase;color:#C9A84C;font-weight:700;margin-bottom:10px;">Zakres prac</div>
    <h2 style="font-size:1.9rem;font-weight:800;color:#1B3A5C;margin:0 0 32px;">Co realizujemy?</h2>

    <!-- deliverables table -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:36px;font-size:.88rem;">
      <thead>
        <tr style="background:#1B3A5C;color:#fff;">
          <th style="padding:12px 16px;text-align:left;font-weight:600;width:40px;border-radius:8px 0 0 0;">Lp.</th>
          <th style="padding:12px 16px;text-align:left;font-weight:600;">Nazwa</th>
          <th style="padding:12px 16px;text-align:left;font-weight:600;border-radius:0 8px 0 0;">Opis</th>
        </tr>
      </thead>
      <tbody>
        ${s.items.map((item, i) => `
        <tr style="border-bottom:1px solid #E2E8F0;${i % 2 === 1 ? 'background:#F8FAFC;' : ''}">
          <td style="padding:12px 16px;color:#475569;vertical-align:top;">${i + 1}.</td>
          <td style="padding:12px 16px;font-weight:600;color:#0F172A;vertical-align:top;">
            ${esc(item.name)}
            ${item.optional ? '<span style="display:inline-block;margin-left:6px;background:#C9A84C;color:#fff;font-size:.62rem;padding:1px 6px;border-radius:4px;font-weight:700;letter-spacing:.06em;vertical-align:middle;">OPT</span>' : ''}
          </td>
          <td style="padding:12px 16px;color:#475569;vertical-align:top;">${esc(item.description)}</td>
        </tr>`).join('')}
      </tbody>
    </table>

    <!-- exclusions -->
    ${s.excludes.length > 0 ? `
    <div style="margin-bottom:24px;">
      <div style="font-size:.8rem;font-weight:700;color:#1B3A5C;margin-bottom:10px;">Poza zakresem oferty:</div>
      <ul style="list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px;">
        ${s.excludes.map(e => `<li style="font-size:.85rem;color:#475569;padding-left:16px;position:relative;">— ${esc(e)}</li>`).join('')}
      </ul>
    </div>` : ''}

    <!-- assumptions infobox -->
    ${s.assumptionText ? `
    <div style="background:#FFF9EC;border-left:4px solid #C9A84C;border-radius:0 8px 8px 0;padding:16px 20px;">
      <div style="font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#C9A84C;margin-bottom:6px;">⚠️ Założenia i warunki realizacji</div>
      <p style="font-size:.85rem;line-height:1.65;color:#0F172A;margin:0;">${esc(s.assumptionText)}</p>
    </div>` : ''}
  </div>
</section>`
    return editorWrap(editorMode, 'scope', inner)
}

// ── Timeline ──────────────────────────────────────────────────────────────────

function renderTimeline(blocks: UniversalBlocks, editorMode: boolean): string {
    const t = blocks.timeline
    const inner = `
<section style="padding:64px 56px;background:#F1F5F9;">
  <div style="max-width:900px;margin:0 auto;">
    <div style="font-size:.72rem;letter-spacing:.18em;text-transform:uppercase;color:#C9A84C;font-weight:700;margin-bottom:10px;">Harmonogram</div>
    <h2 style="font-size:1.9rem;font-weight:800;color:#1B3A5C;margin:0 0 48px;">Plan pracy</h2>

    <!-- horizontal timeline -->
    <div style="position:relative;padding-bottom:20px;">
      <!-- connector line -->
      <div style="position:absolute;top:28px;left:calc(100% / ${t.steps.length} / 2);right:calc(100% / ${t.steps.length} / 2);height:2px;background:linear-gradient(90deg,#C9A84C,#1B3A5C);z-index:0;"></div>

      <div style="display:grid;grid-template-columns:repeat(${t.steps.length},1fr);gap:0;position:relative;z-index:1;">
        ${t.steps.map((step, i) => `
        <div style="display:flex;flex-direction:column;align-items:center;text-align:center;padding:0 8px;">
          <!-- circle -->
          <div style="width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:1rem;margin-bottom:16px;position:relative;z-index:2;
            ${step.active
                ? 'background:#C9A84C;color:#fff;box-shadow:0 0 0 4px rgba(201,168,76,.3);'
                : 'background:#fff;color:#1B3A5C;border:2px solid #CBD5E1;'}">
            ${i + 1}
          </div>
          <div style="font-size:.82rem;font-weight:700;color:#1B3A5C;margin-bottom:4px;">${esc(step.name)}</div>
          <div style="font-size:.72rem;color:#C9A84C;font-weight:600;margin-bottom:6px;">${esc(step.duration)}</div>
          <div style="font-size:.75rem;color:#475569;line-height:1.5;">${esc(step.description)}</div>
        </div>`).join('')}
      </div>
    </div>

    <!-- date boxes -->
    ${(t.startDate || t.endDate) ? `
    <div style="display:flex;gap:16px;margin-top:36px;">
      ${t.startDate ? `
      <div style="background:#fff;border-radius:10px;padding:14px 20px;border-left:3px solid #C9A84C;flex:1;">
        <div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.1em;color:#475569;margin-bottom:4px;">Planowany start</div>
        <div style="font-size:.95rem;font-weight:700;color:#1B3A5C;">${esc(t.startDate)}</div>
      </div>` : ''}
      ${t.endDate ? `
      <div style="background:#fff;border-radius:10px;padding:14px 20px;border-left:3px solid #1B3A5C;flex:1;">
        <div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.1em;color:#475569;margin-bottom:4px;">Planowane zakończenie</div>
        <div style="font-size:.95rem;font-weight:700;color:#1B3A5C;">${esc(t.endDate)}</div>
      </div>` : ''}
    </div>` : ''}
  </div>
</section>`
    return editorWrap(editorMode, 'timeline', inner)
}

// ── Pricing ───────────────────────────────────────────────────────────────────

function renderPricing(blocks: UniversalBlocks, editorMode: boolean): string {
    const p = blocks.pricing
    const inner = p.pricingMode === 'simple'
        ? renderPricingSimple(p)
        : renderPricingDetailed(p)
    return editorWrap(editorMode, 'pricing', inner)
}

function renderPricingSimple(p: UniversalBlocks['pricing']): string {
    return `
<section style="padding:64px 56px;background:#fff;">
  <div style="max-width:900px;margin:0 auto;">
    <div style="font-size:.72rem;letter-spacing:.18em;text-transform:uppercase;color:#C9A84C;font-weight:700;margin-bottom:10px;">Wycena</div>
    <h2 style="font-size:1.9rem;font-weight:800;color:#1B3A5C;margin:0 0 36px;">Inwestycja</h2>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;align-items:start;">
      <!-- price card -->
      <div style="background:#1B3A5C;border-radius:16px;padding:36px;">
        <div style="font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.65);margin-bottom:16px;">Łączna wartość projektu</div>
        <div style="font-size:2.8rem;font-weight:800;color:#C9A84C;line-height:1;">${esc(p.simplePrice)}</div>
        <div style="font-size:.85rem;color:rgba(255,255,255,.6);margin-top:6px;">PLN netto</div>
        <div style="height:1px;background:rgba(255,255,255,.15);margin:24px 0;"></div>
        <ul style="list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px;">
          ${p.simpleIncludes.map(item => `
          <li style="display:flex;align-items:flex-start;gap:8px;font-size:.85rem;color:rgba(255,255,255,.85);">
            <span style="color:#C9A84C;font-weight:700;flex-shrink:0;">✓</span>
            <span>${esc(item)}</span>
          </li>`).join('')}
        </ul>
      </div>
      <!-- payment schedule -->
      <div>
        <div style="font-size:.8rem;font-weight:700;color:#1B3A5C;margin-bottom:16px;">Harmonogram płatności</div>
        <div style="display:flex;flex-direction:column;gap:12px;">
          ${p.payments.map(row => `
          <div style="border-left:3px solid #C9A84C;padding-left:16px;padding:14px 16px;border-radius:0 8px 8px 0;background:#F8FAFC;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
              <span style="font-size:.82rem;font-weight:600;color:#0F172A;">${esc(row.when)}</span>
              <span style="font-size:.82rem;font-weight:700;color:#1B3A5C;">${esc(row.percent)}%</span>
            </div>
            ${row.amount && row.amount !== '0' ? `<div style="font-size:.75rem;color:#475569;">${esc(row.amount)} PLN netto</div>` : ''}
          </div>`).join('')}
        </div>
        ${p.paymentNote ? `<p style="font-size:.78rem;color:#475569;margin-top:16px;line-height:1.6;">${esc(p.paymentNote)}</p>` : ''}
      </div>
    </div>
  </div>
</section>`
}

function renderPricingDetailed(p: UniversalBlocks['pricing']): string {
    return `
<section style="padding:64px 56px;background:#fff;">
  <div style="max-width:900px;margin:0 auto;">
    <div style="font-size:.72rem;letter-spacing:.18em;text-transform:uppercase;color:#C9A84C;font-weight:700;margin-bottom:10px;">Wycena szczegółowa</div>
    <h2 style="font-size:1.9rem;font-weight:800;color:#1B3A5C;margin:0 0 32px;">Zestawienie kosztów</h2>

    ${p.categories.map(cat => `
    <div style="margin-bottom:28px;">
      <div style="font-size:.78rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#1B3A5C;padding:8px 0;margin-bottom:0;border-bottom:2px solid #1B3A5C;">${esc(cat.name)}</div>
      <table style="width:100%;border-collapse:collapse;font-size:.85rem;">
        <tbody>
          ${cat.items.map((item, i) => `
          <tr style="border-bottom:1px solid #E2E8F0;${i % 2 === 1 ? 'background:#F8FAFC;' : ''}">
            <td style="padding:11px 12px;font-weight:600;color:#0F172A;">
              ${esc(item.name)}
              ${item.optional ? '<span style="display:inline-block;margin-left:6px;background:#C9A84C;color:#fff;font-size:.6rem;padding:1px 5px;border-radius:4px;font-weight:700;letter-spacing:.06em;">OPT</span>' : ''}
              <div style="font-size:.75rem;font-weight:400;color:#475569;">${esc(item.description)}</div>
            </td>
            <td style="padding:11px 12px;color:#475569;text-align:center;white-space:nowrap;">${esc(item.qty)} ${esc(item.unit)}</td>
            <td style="padding:11px 12px;color:#475569;text-align:right;white-space:nowrap;">${esc(item.unitPrice)} PLN</td>
            <td style="padding:11px 12px;font-weight:700;color:#1B3A5C;text-align:right;white-space:nowrap;">${esc(item.value)} PLN</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`).join('')}

    <!-- payment schedule -->
    <div style="margin-top:36px;display:grid;grid-template-columns:1fr 1fr;gap:32px;align-items:start;">
      <div>
        <div style="font-size:.8rem;font-weight:700;color:#1B3A5C;margin-bottom:14px;">Harmonogram płatności</div>
        <div style="display:flex;flex-direction:column;gap:10px;">
          ${p.payments.map(row => `
          <div style="display:flex;align-items:center;gap:12px;border-left:3px solid #C9A84C;padding:12px 14px;background:#F8FAFC;border-radius:0 8px 8px 0;">
            <span style="font-weight:800;color:#1B3A5C;min-width:36px;">${esc(row.percent)}%</span>
            <span style="font-size:.82rem;color:#0F172A;flex:1;">${esc(row.when)}</span>
            ${row.amount && row.amount !== '0' ? `<span style="font-size:.78rem;color:#475569;">${esc(row.amount)} PLN</span>` : ''}
          </div>`).join('')}
        </div>
      </div>
      ${p.paymentNote ? `
      <div style="background:#F1F5F9;border-radius:12px;padding:20px 22px;">
        <div style="font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#475569;margin-bottom:8px;">Warunki płatności</div>
        <p style="font-size:.82rem;line-height:1.65;color:#0F172A;margin:0;">${esc(p.paymentNote)}</p>
      </div>` : ''}
    </div>
  </div>
</section>`
}

// ── Terms ─────────────────────────────────────────────────────────────────────

function renderTerms(blocks: UniversalBlocks, editorMode: boolean): string {
    const t = blocks.terms
    const inner = `
<section style="padding:64px 56px;background:#F1F5F9;">
  <div style="max-width:900px;margin:0 auto;">
    <div style="font-size:.72rem;letter-spacing:.18em;text-transform:uppercase;color:#C9A84C;font-weight:700;margin-bottom:10px;">Warunki współpracy</div>
    <h2 style="font-size:1.9rem;font-weight:800;color:#1B3A5C;margin:0 0 36px;">Zasady i reguły</h2>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;">
      ${t.cards.map(card => `
      <div style="background:#fff;border-radius:12px;padding:22px 20px;">
        <div style="font-size:1.4rem;margin-bottom:10px;">${esc(card.icon)}</div>
        <div style="font-size:.85rem;font-weight:700;color:#1B3A5C;margin-bottom:8px;">${esc(card.title)}</div>
        <p style="font-size:.8rem;line-height:1.65;color:#475569;margin:0;">${esc(card.text)}</p>
      </div>`).join('')}
    </div>
  </div>
</section>`
    return editorWrap(editorMode, 'terms', inner)
}

// ── Footer / CTA ──────────────────────────────────────────────────────────────

function renderFooter(
    blocks: UniversalBlocks,
    offer: UniversalOfferData,
    editorMode: boolean,
): string {
    const f = blocks.footer
    const logoUrl = offer.userLogoUrl || ''

    const logoImg = logoUrl
        ? `<img src="${esc(logoUrl)}" alt="Logo" style="max-height:44px;max-width:140px;object-fit:contain;filter:brightness(0) invert(1);margin-bottom:10px;" />`
        : `<div style="font-size:1.1rem;font-weight:700;color:#fff;margin-bottom:10px;">${esc(offer.userCompanyName || blocks.cover.contractorName)}</div>`

    const inner = `
<footer>
  <!-- CTA band -->
  <div style="background:#C9A84C;padding:56px;text-align:center;">
    <h2 style="font-size:2.2rem;font-weight:800;color:#fff;margin:0 0 14px;">${esc(f.ctaTitle)}</h2>
    <p style="font-size:1rem;color:rgba(255,255,255,.9);margin:0 0 32px;">${esc(f.ctaSubtitle)} <strong>${esc(f.responseHours)}h</strong>.</p>
    <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap;">
      <a href="mailto:${esc(f.footerEmail)}" style="background:#1B3A5C;color:#fff;padding:14px 32px;border-radius:8px;font-weight:700;font-size:.9rem;text-decoration:none;display:inline-block;">
        Napisz teraz
      </a>
      <a href="tel:${esc(f.footerPhone)}" style="background:transparent;color:#fff;padding:14px 32px;border-radius:8px;font-weight:700;font-size:.9rem;text-decoration:none;border:2px solid rgba(255,255,255,.8);display:inline-block;">
        Zadzwoń
      </a>
    </div>
  </div>

  <!-- 3-col footer -->
  <div style="background:#1B3A5C;color:#fff;padding:48px 56px;">
    <div style="max-width:900px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr 1fr;gap:48px;">
      <!-- col 1: logo + tagline + links -->
      <div>
        ${logoImg}
        <p style="font-size:.8rem;color:rgba(255,255,255,.65);line-height:1.6;margin:0 0 16px;">${esc(f.tagline)}</p>
        <div style="display:flex;gap:12px;">
          ${f.linkedinUrl && f.linkedinUrl !== '#' ? `<a href="${esc(f.linkedinUrl)}" style="font-size:.75rem;color:rgba(255,255,255,.55);text-decoration:none;">LinkedIn</a>` : ''}
          ${f.githubUrl && f.githubUrl !== '#' ? `<a href="${esc(f.githubUrl)}" style="font-size:.75rem;color:rgba(255,255,255,.55);text-decoration:none;">GitHub</a>` : ''}
        </div>
      </div>
      <!-- col 2: contact -->
      <div>
        <div style="font-size:.72rem;text-transform:uppercase;letter-spacing:.1em;color:rgba(255,255,255,.5);margin-bottom:14px;">Kontakt</div>
        <div style="font-size:.85rem;color:rgba(255,255,255,.85);margin-bottom:8px;">📧 ${esc(f.footerEmail)}</div>
        <div style="font-size:.85rem;color:rgba(255,255,255,.85);margin-bottom:8px;">📞 ${esc(f.footerPhone)}</div>
        <div style="font-size:.85rem;color:rgba(255,255,255,.85);">🌐 ${esc(f.footerWebsite)}</div>
      </div>
      <!-- col 3: offer summary box -->
      <div>
        <div style="font-size:.72rem;text-transform:uppercase;letter-spacing:.1em;color:rgba(255,255,255,.5);margin-bottom:14px;">Podsumowanie oferty</div>
        <div style="display:flex;flex-direction:column;gap:8px;font-size:.82rem;">
          <div style="display:flex;justify-content:space-between;"><span style="color:rgba(255,255,255,.55);">Nr oferty</span><span style="color:#fff;font-weight:600;">${esc(offer.offerNumber || '')}</span></div>
          <div style="display:flex;justify-content:space-between;"><span style="color:rgba(255,255,255,.55);">Klient</span><span style="color:#fff;font-weight:600;">${esc(offer.clientName || blocks.cover.clientName)}</span></div>
        </div>
      </div>
    </div>
  </div>

  <!-- bottom bar -->
  <div style="background:#132B46;padding:12px 56px;display:flex;justify-content:space-between;align-items:center;font-size:.72rem;color:rgba(255,255,255,.4);">
    <span>© ${new Date().getFullYear()} ${esc(offer.userCompanyName || blocks.cover.contractorName)} — Dokument poufny</span>
    <span>Szablon: SmartQuote</span>
  </div>
</footer>`
    return editorWrap(editorMode, 'footer', inner)
}

// ── Section dispatcher ────────────────────────────────────────────────────────

function renderSection(key: UniversalSectionKey, blocks: UniversalBlocks, editorMode: boolean): string {
    switch (key) {
        case 'summary':  return renderSummary(blocks, editorMode)
        case 'needs':    return renderNeeds(blocks, editorMode)
        case 'scope':    return renderScope(blocks, editorMode)
        case 'timeline': return renderTimeline(blocks, editorMode)
        case 'pricing':  return renderPricing(blocks, editorMode)
        case 'terms':    return renderTerms(blocks, editorMode)
    }
}

// ── Main export ───────────────────────────────────────────────────────────────

export function buildUniversalHtml(
    blocks: UniversalBlocks,
    offer: UniversalOfferData,
    options?: { editorMode?: boolean },
): string {
    const editorMode = options?.editorMode ?? false

    const editorCss = editorMode ? `
  .sq-block:hover { outline: 2px dashed #C9A84C !important; outline-offset: 2px; }` : ''

    const sections = blocks.sections.map(key => renderSection(key, blocks, editorMode)).join('\n')

    return `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${esc(blocks.cover.serviceTitle)} — Oferta</title>
<style>
${EMBEDDED_FONTS_CSS}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html,body{font-family:'Outfit Variable','Outfit',sans-serif;background:#fff;color:#0F172A;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
a{color:inherit;text-decoration:none;}
img{display:block;}
${editorCss}
</style>
</head>
<body>
${renderCover(blocks, offer, editorMode)}
${sections}
${renderFooter(blocks, offer, editorMode)}
</body>
</html>`
}

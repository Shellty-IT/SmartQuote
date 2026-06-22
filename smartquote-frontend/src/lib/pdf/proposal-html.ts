// src/lib/pdf/proposal-html.ts
// Generates a full HTML string for the proposal template.
// Used by: Puppeteer PDF route + HTML preview route.

import { mergeWithDefaults, type ProposalBlocks, type SectionKey } from './proposal-blocks'
import { EMBEDDED_FONTS_CSS } from './embedded-fonts'

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

/**
 * Returns an HTML-escaped href only if it uses a safe scheme (http/https) or is
 * a protocol-relative/relative URL. Blocks javascript:, data:, vbscript: etc.
 * Returns '' for anything unsafe so callers can drop the link.
 */
export function safeUrl(href: string | null | undefined): string {
    if (!href) return ''
    const trimmed = href.trim()
    // Allow only absolute http(s) or relative URLs (no scheme, or //host).
    if (/^https?:\/\//i.test(trimmed) || /^\/\//.test(trimmed) || /^\/(?!\/)/.test(trimmed)) {
        return esc(trimmed)
    }
    return ''
}

function formatDate(d: string | Date): string {
    const dt = typeof d === 'string' ? new Date(d) : d
    return dt.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatMoney(amount: number, currency = 'PLN'): string {
    return (
        amount
            .toFixed(2)
            .replace(/\B(?=(\d{3})+(?!\d))/g, ' ') +
        ' ' +
        currency
    )
}

const SVG_CHECK = `<svg viewBox="0 0 10 10" fill="none"><path d="M2 5.2l2.2 2.2 3.6-4" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`

const INLINE_HTML_TAGS = new Set(['strong', 'b', 'em', 'i', 'u', 'br'])

/** Allow only a tiny safe subset of inline tags in AI-authored paragraph text. */
export function sanitizeInlineHtml(s: string): string {
    let out = ''
    let i = 0

    while (i < s.length) {
        const lt = s.indexOf('<', i)
        if (lt === -1) {
            out += s.slice(i)
            break
        }

        out += s.slice(i, lt)
        const gt = s.indexOf('>', lt + 1)

        if (gt === -1) {
            out += '&lt;'
            i = lt + 1
            continue
        }

        const rawTag = s.slice(lt + 1, gt).trim()
        const isClosing = rawTag.startsWith('/')
        const tagBody = (isClosing ? rawTag.slice(1) : rawTag).trim()
        const tagMatch = tagBody.match(/^([a-z][a-z0-9]*)(?=$|[\s/>])/i)
        const tagName = tagMatch?.[1]?.toLowerCase()

        if (tagName && INLINE_HTML_TAGS.has(tagName)) {
            if (tagName === 'br') {
                out += '<br>'
            } else {
                out += isClosing ? `</${tagName}>` : `<${tagName}>`
            }
        }

        i = gt + 1
    }

    return out
}

// ── Section renderers (editorMode = always render for inline preview) ─────────

function renderIntro(blocks: ProposalBlocks, editorMode = false): string {
    if (!blocks.intro.enabled && !editorMode) return ''
    const paragraphs = blocks.intro.paragraphs
        .filter(Boolean)
        .map((p, i) => `<p class="${i === 0 ? 'intro-lead' : ''}">${sanitizeInlineHtml(p)}</p>`)
        .join('\n      ')
    return `
    <div class="intro">
      ${paragraphs || '<p><em>Brak tekstu wprowadzającego</em></p>'}
    </div>`
}

function renderDemo(blocks: ProposalBlocks, editorMode = false): string {
    const d = blocks.demo
    if (!d.enabled && !editorMode) return ''
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

function renderStructure(blocks: ProposalBlocks, editorMode = false): string {
    const s = blocks.structure
    if (!s.enabled && !editorMode) return ''
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

function renderScope(blocks: ProposalBlocks, editorMode = false): string {
    const s = blocks.scope
    if (!s.enabled && !editorMode) return ''
    const items = s.items
        .map(
            (item) => `
        <div class="scope-item">
          <span class="chk">${SVG_CHECK}</span>
          <span>${sanitizeInlineHtml(item.html)}</span>
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

function renderTesting(blocks: ProposalBlocks, editorMode = false): string {
    const t = blocks.testing
    if (!t.enabled && !editorMode) return ''
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

function renderTechnology(blocks: ProposalBlocks, editorMode = false): string {
    const t = blocks.technology
    if (!t.enabled && !editorMode) return ''
    const options = t.options
        .map(
            (opt) => `
          <div class="tech-card prime">
            <div class="tc-title">${opt.icon} ${esc(opt.title)}</div>
            ${opt.urls
                .map((u) => ({ raw: u.href, safe: safeUrl(u.href) }))
                .filter((u) => u.safe && u.raw !== 'https://')
                .map(
                    (u) =>
                        `<div class="tc-url"><span>👉</span><a href="${u.safe}">${esc(u.raw.replace(/^https?:\/\//, ''))}</a></div>`,
                )
                .join('')}
          </div>`,
        )
        .join('')
    const note = t.note ? `<p class="tech-note">${esc(t.note)}</p>` : ''
    return `
      <div>
        <div class="sec"><span class="ico">💻</span><h2>Technologia</h2></div>
        <p class="tech-body">${sanitizeInlineHtml(t.body)}</p>
        <div class="tech-cols">
          ${options}
        </div>
        ${note}
      </div>`
}

function renderPricingBox(
    offer: ProposalOfferData,
    blocks: ProposalBlocks,
    editorMode = false,
): string {
    const pe = blocks.pricingExtra
    const isNet = (pe.priceType ?? 'gross') === 'net'

    // When priceOverride is set to a positive value, derive both gross and net
    // (assuming 23% VAT). Zero is treated the same as null — falls back to
    // offer.totalGross — matching the backend guard in syncTotalsFromBlocks
    // (override <= 0 → return null). This prevents a 0.00 PLN display from
    // an accidentally cleared input that stored 0 instead of null.
    let grossPrice: number
    let netPrice: number | null = null
    if (pe.priceOverride != null && pe.priceOverride > 0) {
        if (isNet) {
            netPrice = pe.priceOverride
            grossPrice = Math.round(pe.priceOverride * 1.23 * 100) / 100
        } else {
            grossPrice = pe.priceOverride
            netPrice = Math.round((pe.priceOverride / 1.23) * 100) / 100
        }
    } else {
        grossPrice = offer.totalGross
    }

    const netSub = netPrice !== null ? `${formatMoney(netPrice, offer.currency)} netto · ` : ''

    const showExtra = pe.enabled || editorMode
    const timelineCard = showExtra
        ? `
        <div class="p-card">
          <div class="pc-label">⏱️ Czas realizacji</div>
          <div class="pc-val">${esc(pe.timeline)}</div>
          <div class="pc-sub">${esc(pe.timelineSub)}</div>
        </div>`
        : ''
    const contractCard = showExtra
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
          <div class="pc-label">💵 Cena (brutto)</div>
          <div class="pc-val">${formatMoney(grossPrice, offer.currency)}</div>
          <div class="pc-sub">${netSub}płatność ${offer.paymentDays} dni</div>
        </div>
        ${timelineCard}
        ${contractCard}
      </div>
    </div>`
}

function renderAbout(
    offer: ProposalOfferData,
    blocks: ProposalBlocks,
    editorMode = false,
): string {
    const a = blocks.about
    if (!a.enabled && !editorMode) return ''
    const website = offer.user?.companyInfo?.website
    const aboutBox = (website || editorMode)
        ? `
      <div class="about-box">
        <div class="sec"><span class="ico">🗂️</span><h2>${esc(a.aboutBoxTitle ?? 'Więcej o nas i naszych realizacjach')}</h2></div>
        ${website
            ? `<a class="about-url" href="${esc(website)}">👉 ${esc(website.replace(/^https?:\/\//, ''))}</a>`
            : `<p style="font-size:9px;color:#999;font-style:italic;">Ustaw witrynę w ustawieniach firmy</p>`}
      </div>`
        : ''
    const hasAboutBox = website || editorMode
    return `
    <div class="bottom-row" style="${!hasAboutBox ? 'grid-template-columns:1fr;' : ''}">
      ${aboutBox}
      <div class="cta-box">
        <p>${esc(a.ctaText)}</p>
      </div>
    </div>`
}

function renderBenefits(blocks: ProposalBlocks, editorMode = false): string {
    const b = blocks.benefits
    if (!b.enabled && !editorMode) return ''
    const items = b.items
        .map(
            (it) => `
        <div class="benefit-card">
          <span class="benefit-ico">${it.icon}</span>
          <div class="benefit-title">${esc(it.title)}</div>
          <div class="benefit-desc">${esc(it.description)}</div>
        </div>`,
        )
        .join('')
    return `
    <div style="margin-bottom:6mm;">
      <div class="sec"><span class="ico">⭐</span><h2>${esc(b.title)}</h2></div>
      <div class="benefit-grid">
        ${items}
      </div>
    </div>`
}

function renderProcess(blocks: ProposalBlocks, editorMode = false): string {
    const p = blocks.process
    if (!p.enabled && !editorMode) return ''
    const steps = p.steps
        .map(
            (st, i) => `
        <div class="proc-step">
          <div class="proc-num">${i + 1}</div>
          <div class="proc-title">${esc(st.title)}</div>
          <div class="proc-desc">${esc(st.description)}</div>
        </div>`,
        )
        .join('')
    return `
    <div style="margin-bottom:6mm;">
      <div class="sec"><span class="ico">🧭</span><h2>${esc(p.title)}</h2></div>
      <div class="proc-grid">
        ${steps}
      </div>
    </div>`
}

function renderStats(blocks: ProposalBlocks, editorMode = false): string {
    const s = blocks.stats
    if (!s.enabled && !editorMode) return ''
    const items = s.items
        .map(
            (it) => `
        <div class="stat-cell">
          <div class="stat-val">${esc(it.value)}</div>
          <div class="stat-label">${esc(it.label)}</div>
        </div>`,
        )
        .join('')
    return `
    <div class="stats-band">
      ${items}
    </div>`
}

// ── Editor mode helpers ───────────────────────────────────────────────────────

function editorCss(): string {
    return `
    /* ── EDITOR MODE ── */
    .header-editor-wrap {
      position: relative;
      flex-shrink: 0;
      cursor: pointer;
    }
    [data-block] {
      position: relative;
      cursor: pointer;
      transition: box-shadow 0.15s, outline 0.15s;
      border-radius: 3px;
    }
    [data-block]:hover {
      outline: 2px solid #E8711A;
      outline-offset: 3px;
    }
    /* Tooltip badge — inside bottom-right corner of the block, no overflow conflict */
    [data-block]::after {
      content: '✏️  Kliknij aby edytować';
      position: absolute;
      bottom: 4px; right: 6px;
      background: #E8711A;
      color: white;
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 0.5px;
      padding: 2px 8px;
      border-radius: 2px;
      opacity: 0;
      transition: opacity 0.15s;
      pointer-events: none;
      z-index: 100;
      white-space: nowrap;
    }
    [data-block]:hover::after { opacity: 1; }
    /* header wrapper: tooltip at top-right so it doesn't overlap header content bottom */
    .header-editor-wrap::after {
      top: 8px; right: 10px;
      bottom: auto;
    }
    [data-block].sq-disabled {
      opacity: 0.4;
      position: relative;
    }
    [data-block].sq-disabled::before {
      content: '👁️ Sekcja ukryta — kliknij aby włączyć';
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%,-50%);
      background: rgba(0,0,0,0.65);
      color: white;
      font-size: 9px;
      font-weight: 600;
      padding: 4px 12px;
      border-radius: 4px;
      z-index: 10;
      white-space: nowrap;
      pointer-events: none;
    }
    [data-block].sq-active {
      outline: 2.5px solid #E8711A;
      outline-offset: 3px;
      box-shadow: 0 0 0 4px rgba(232,113,26,0.12);
    }
    `
}

function editorScript(): string {
    return `
    <script>
      document.querySelectorAll('[data-block]').forEach(function(el) {
        el.addEventListener('click', function(e) {
          e.stopPropagation();
          var blockKey = el.getAttribute('data-block');
          document.querySelectorAll('[data-block]').forEach(function(b) {
            b.classList.remove('sq-active');
          });
          el.classList.add('sq-active');
          window.parent.postMessage({ type: 'sq:editBlock', blockKey: blockKey }, '*');
        });
      });
    </script>
    `
}

function wrapEditable(html: string, blockKey: string, enabled: boolean): string {
    return `<div data-block="${blockKey}"${!enabled ? ' class="sq-disabled"' : ''}>${html}</div>`
}

/** Renders a single body section (dispatcher). Returns '' for unknown keys. */
function renderSection(
    key: SectionKey,
    blocks: ProposalBlocks,
    offer: ProposalOfferData,
    editorMode: boolean,
): string {
    if (editorMode) {
        switch (key) {
            case 'intro':       return wrapEditable(renderIntro(blocks, true), 'intro', blocks.intro.enabled)
            case 'demo':        return wrapEditable(renderDemo(blocks, true), 'demo', blocks.demo.enabled)
            case 'structure':   return wrapEditable(renderStructure(blocks, true), 'structure', blocks.structure.enabled)
            case 'scope':       return wrapEditable(renderScope(blocks, true), 'scope', blocks.scope.enabled)
            case 'testing':     return wrapEditable(renderTesting(blocks, true), 'testing', blocks.testing.enabled)
            case 'technology':  return wrapEditable(renderTechnology(blocks, true), 'technology', blocks.technology.enabled)
            case 'pricingExtra':return wrapEditable(renderPricingBox(offer, blocks, true), 'pricingExtra', blocks.pricingExtra.enabled)
            case 'about':       return wrapEditable(renderAbout(offer, blocks, true), 'about', blocks.about.enabled)
            case 'benefits':    return wrapEditable(renderBenefits(blocks, true), 'benefits', blocks.benefits.enabled)
            case 'process':     return wrapEditable(renderProcess(blocks, true), 'process', blocks.process.enabled)
            case 'stats':       return wrapEditable(renderStats(blocks, true), 'stats', blocks.stats.enabled)
            default:            return ''
        }
    } else {
        switch (key) {
            case 'intro':       return renderIntro(blocks)
            case 'demo':        return renderDemo(blocks)
            case 'structure':   return renderStructure(blocks)
            case 'scope':       return renderScope(blocks)
            case 'testing':     return renderTesting(blocks)
            case 'technology':  return renderTechnology(blocks)
            case 'pricingExtra':return renderPricingBox(offer, blocks)
            case 'about':       return renderAbout(offer, blocks)
            case 'benefits':    return renderBenefits(blocks)
            case 'process':     return renderProcess(blocks)
            case 'stats':       return renderStats(blocks)
            default:            return ''
        }
    }
}

// ── Full HTML ─────────────────────────────────────────────────────────────────

export interface BuildProposalHtmlOptions {
    /** When true, sections get data-block attributes + hover edit UI. Used in the document editor, NOT for PDF. */
    editorMode?: boolean
    /** Zoom level 0.5–1.5, applied as CSS zoom on the body. Default 1. */
    zoom?: number
}

export function buildProposalHtml(offer: ProposalOfferData, options: BuildProposalHtmlOptions = {}): string {
    const { editorMode = false, zoom = 1 } = options
    const blocks = mergeWithDefaults(
        offer.blocks as Partial<ProposalBlocks> | null,
        offer.client.name,
    )

    // Defensive: user may be missing when backend doesn't include it yet
    const user = offer.user ?? { name: null, email: '', companyInfo: null }
    const sellerName = user.companyInfo?.name ?? user.name ?? user.email ?? ''
    const clientLabel = offer.client.company
        ? `${offer.client.name} · ${offer.client.company}`
        : offer.client.name
    const headerTitle = blocks.header.titleOverride?.trim() || offer.title
    const headerClientLabel = blocks.header.clientLabelOverride?.trim() || clientLabel
    const website = user.companyInfo?.website ?? ''
    const logo = user.companyInfo?.logoDark || user.companyInfo?.logoLight || user.companyInfo?.logo || ''
    const dateStr = formatDate(offer.createdAt)

    const logoHtml = logo
        ? `<img src="${esc(logo)}" alt="${esc(sellerName)} logo" class="header-logo">`
        : `<div class="header-logo-placeholder">${esc(sellerName || 'LOGO')}</div>`

    // Footer texts
    const footerCustomNote = blocks.footer.customNote ? `${esc(blocks.footer.customNote)} ` : ''
    const authorSuffix = blocks.footer.showAuthor && sellerName ? ` · <strong>${esc(sellerName)}</strong>` : ''
    const footerRight = website
        ? `<strong>${esc(website.replace(/^https?:\/\//, ''))}</strong> · Dokument poufny`
        : `Dokument poufny`

    // Build page bodies — testing+technology are rendered side-by-side when adjacent on the same page
    function buildPageBody(sections: SectionKey[]): string {
        const parts: string[] = []
        let i = 0
        while (i < sections.length) {
            const cur = sections[i]
            const next = sections[i + 1]
            // Side-by-side when testing & technology are consecutive (in either order).
            // Only pair them when BOTH actually render — otherwise the disabled side
            // returns '' and the survivor would be squeezed into a half-width column
            // with an empty cell next to it. In editorMode both always render.
            const bothRender = editorMode || (blocks.testing.enabled && blocks.technology.enabled)
            const isTT = bothRender && (
                (cur === 'testing' && next === 'technology') ||
                (cur === 'technology' && next === 'testing')
            )
            if (isTT) {
                const leftHtml = renderSection(cur, blocks, offer, editorMode)
                const rightHtml = renderSection(next, blocks, offer, editorMode)
                parts.push(`<div style="display:grid;grid-template-columns:1fr 1fr;gap:6mm;margin-bottom:0;">${leftHtml}${rightHtml}</div>`)
                i += 2
            } else {
                parts.push(renderSection(cur, blocks, offer, editorMode))
                i++
            }
        }
        return parts.join('\n    ')
    }

    const page1Body = buildPageBody(blocks.page1Sections)
    const page2Body = buildPageBody(blocks.page2Sections)

    return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Oferta ${esc(offer.number)} — ${esc(offer.title)}</title>
  <style>${EMBEDDED_FONTS_CSS}
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
    html { zoom: ${zoom}; }
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
    .header-meta { position: absolute; top: 5mm; right: 16mm; text-align: right; z-index: 3; }
    .header-meta .lbl { color: rgba(255,255,255,0.38); font-size: 7.5px; letter-spacing: 1.2px; text-transform: uppercase; }
    .header-meta .val { color: white; font-size: 12px; font-weight: 600; margin-top: 2px; }
    .header-meta .site { color: var(--orange); font-size: 9px; font-weight: 500; margin-top: 5px; opacity: 0.9; }
    .header-logo { display: block; height: 72px; width: auto; max-width: 160px; margin-bottom: 6px; margin-left: auto; object-fit: contain; }
    .header-logo-placeholder {
      display: block; height: 72px; line-height: 72px; text-align: right;
      color: white; font-size: 16px; font-weight: 700; margin-bottom: 6px;
    }
    /* ── BODY ── */
    .body { padding: 7mm 16mm; flex: 1; }
    /* Intro */
    .intro { padding: 1mm 0 5mm 5mm; border-left: 3px solid var(--orange); border-bottom: 1px solid var(--grey-line); margin-bottom: 6mm; }
    .intro p { font-size: 11px; line-height: 1.78; color: var(--text); }
    .intro p + p { margin-top: 6px; }
    .intro p.intro-lead { font-size: 12.5px; font-weight: 600; color: var(--navy); line-height: 1.6; }
    .intro p strong { color: var(--navy); font-weight: 700; }
    /* Section label */
    .sec { display: flex; align-items: center; gap: 7px; margin-bottom: 5px; }
    .sec .ico { font-size: 13px; line-height: 1; flex-shrink: 0; }
    .sec h2 {
      font-size: 11px; font-weight: 700; color: var(--navy);
      letter-spacing: 0.9px; text-transform: uppercase;
      overflow-wrap: anywhere; min-width: 0;
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
    .tech-note { font-size: 9px; color: var(--grey-text); font-style: italic; margin-top: 5px; line-height: 1.5; }
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
    .about-box { background: var(--grey-bg); border-radius: 4px; padding: 5mm; min-width: 0; overflow: hidden; }
    .about-url { display: block; font-family: 'Courier New', monospace; font-size: 10.5px; font-weight: 700; color: var(--navy); text-decoration: none; margin-top: 4px; word-break: break-all; overflow-wrap: anywhere; }
    .cta-box {
      background: var(--orange-dim); border: 1px solid var(--orange-border);
      border-radius: 4px; padding: 5mm; display: flex; align-items: center; min-width: 0;
    }
    .cta-box p { font-size: 11px; line-height: 1.7; color: var(--text); }
    /* Benefits */
    .benefit-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; margin-top: 5px; }
    .benefit-card {
      background: var(--grey-bg); border-top: 2.5px solid var(--orange);
      border-radius: 0 0 4px 4px; padding: 4mm 4mm 4.5mm;
    }
    .benefit-ico { font-size: 18px; line-height: 1; display: block; margin-bottom: 5px; }
    .benefit-title { font-size: 10.5px; font-weight: 700; color: var(--navy); margin-bottom: 3px; }
    .benefit-desc { font-size: 9px; color: var(--grey-text); line-height: 1.5; }
    /* Process */
    .proc-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; margin-top: 6px; }
    .proc-step {
      position: relative; background: var(--grey-bg); border-radius: 4px;
      padding: 7mm 3mm 4mm; text-align: center;
    }
    .proc-num {
      position: absolute; top: -9px; left: 50%; transform: translateX(-50%);
      width: 20px; height: 20px; border-radius: 50%; background: var(--orange);
      color: white; font-size: 10px; font-weight: 800; line-height: 20px;
      box-shadow: 0 2px 6px rgba(232,113,26,0.35);
    }
    .proc-title { font-size: 10px; font-weight: 700; color: var(--navy); margin-bottom: 3px; }
    .proc-desc { font-size: 8.5px; color: var(--grey-text); line-height: 1.45; }
    /* Stats band */
    .stats-band {
      display: grid; grid-auto-flow: column; grid-auto-columns: 1fr;
      background: var(--navy); border-radius: 6px; padding: 5mm 6mm;
      margin: 0 0 6mm; position: relative; overflow: hidden;
    }
    .stats-band::after {
      content: ''; position: absolute; top: 0; right: 0; bottom: 0;
      width: 34%; background: var(--navy-mid);
      clip-path: polygon(24% 0, 100% 0, 100% 100%, 0% 100%);
    }
    .stat-cell { text-align: center; position: relative; z-index: 1; }
    .stat-cell + .stat-cell { border-left: 1px solid rgba(255,255,255,0.1); }
    .stat-val { font-size: 22px; font-weight: 800; color: var(--orange); line-height: 1; }
    .stat-label { font-size: 8.5px; color: rgba(255,255,255,0.6); margin-top: 4px; line-height: 1.4; }
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
    /* ── PAGE-BREAK HYGIENE (print only) ──
       Only compact, sub-page blocks get break-inside:avoid. Blanket avoid on a
       whole section (or the testing|technology grid) backfires when it is taller
       than a page — Chromium pushes it to a fresh page leaving a large gap, then
       breaks it anyway. Tall content therefore relies on per-card avoid below. */
    @media print {
      /* keep a section header glued to the content that follows it */
      .sec { break-after: avoid; page-break-after: avoid; }
      /* never split these compact blocks across a page boundary */
      .pricing, .stats-band, .demo-block, .about-box, .cta-box {
        break-inside: avoid; page-break-inside: avoid;
      }
      /* keep individual cards / rows / steps whole */
      .p-card, .struct-item, .scope-item, .test-item, .tech-card,
      .benefit-card, .proc-step, .demo-url-row {
        break-inside: avoid; page-break-inside: avoid;
      }
      /* orphan / widow control for running text */
      .intro p, .demo-body, .test-intro, .tech-body, .cta-box p {
        orphans: 3; widows: 3;
      }
    }
    ${editorMode ? editorCss() : ''}
  </style>
</head>
<body>

<!-- PAGE 1 -->
<div class="page">
  ${editorMode ? '<div data-block="header" class="header-editor-wrap">' : ''}
  <header class="header">
    <div class="header-decor"></div>
    <div class="header-decor2"></div>
    <div class="header-left">
      <div class="header-tag">${esc(blocks.header.tag)}</div>
      <h1 class="header-title">${esc(headerTitle)}</h1>
      <div class="header-subtitle">${esc(headerClientLabel)}</div>
    </div>
    <div class="header-meta">
      ${logoHtml}
      <div class="lbl">Data oferty</div>
      <div class="val">${dateStr}</div>
      ${website ? `<div class="site">${esc(website.replace(/^https?:\/\//, ''))}</div>` : ''}
    </div>
  </header>
  ${editorMode ? '</div>' : ''}

  <div class="body">
    ${page1Body}
  </div>

  <footer class="footer"${editorMode ? ' data-block="footer"' : ''}>
    <div class="footer-left">Oferta przygotowana ${footerCustomNote}dla: <strong>${esc(offer.client.name)}</strong> · <strong>Strona 1</strong>${authorSuffix}</div>
    <div class="footer-divider"></div>
    <div class="footer-right">${footerRight}</div>
  </footer>
</div>

<!-- PAGE 2 -->
<div class="page">
  <div class="page-strip"></div>

  <div class="body" style="padding-top:6mm;">
    ${page2Body}
  </div>

  <footer class="footer"${editorMode ? ' data-block="footer"' : ''}>
    <div class="footer-left">Oferta ${esc(offer.number)} · <strong>Strona 2</strong>${authorSuffix}</div>
    <div class="footer-divider"></div>
    <div class="footer-right">${footerRight}</div>
  </footer>
</div>

${editorMode ? editorScript() : ''}
</body>
</html>`
}

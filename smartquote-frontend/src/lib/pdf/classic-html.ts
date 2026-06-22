// src/lib/pdf/classic-html.ts
// HTML generator for the "Klasyczny" offer template.
// Replicates the react-pdf OfferDocument layout in pure HTML/CSS for Puppeteer.
// Design: teal #0891b2 header + slate body — formal business offer.

import { buildHtmlDocument } from './html-shell'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ClassicOfferItem {
    name: string
    description: string | null
    quantity: number
    unit: string
    unitPrice: number
    vatRate: number
    discount: number
    totalNet: number
    variantName: string | null
}

export interface ClassicOfferData {
    number: string
    title: string
    description: string | null
    terms: string | null
    status: string
    totalNet: number
    totalVat: number
    totalGross: number
    currency: string
    validUntil: string | null
    paymentDays: number
    createdAt: string
    client: {
        type: string
        name: string
        company: string | null
        nip: string | null
        email: string | null
        phone: string | null
        address: string | null
        city: string | null
        postalCode: string | null
    }
    user: {
        name: string | null
        email: string
        company: string | null
        nip: string | null
        phone: string | null
        address: string | null
        city: string | null
        postalCode: string | null
        logo: string | null
        website: string | null
    }
    items: ClassicOfferItem[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function esc(s: string | number | null | undefined): string {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}

function money(n: number, cur = ''): string {
    return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (cur ? ' ' + cur : '')
}

function fmtDate(iso: string | null | undefined): string {
    if (!iso) return '-'
    const d = new Date(iso)
    const day = String(d.getDate()).padStart(2, '0')
    const mon = String(d.getMonth() + 1).padStart(2, '0')
    return `${day}.${mon}.${d.getFullYear()}`
}

const STATUS_MAP: Record<string, string> = {
    DRAFT: 'Szkic',
    SENT: 'Wysłana',
    VIEWED: 'Wyświetlona',
    NEGOTIATION: 'Negocjacje',
    ACCEPTED: 'Zaakceptowana',
    REJECTED: 'Odrzucona',
    EXPIRED: 'Wygasła',
}

interface VariantGroup {
    name: string | null
    items: ClassicOfferItem[]
    totalNet: number
    totalVat: number
    totalGross: number
}

function groupByVariant(items: ClassicOfferItem[]): VariantGroup[] {
    const hasVariants = items.some(i => i.variantName)
    if (!hasVariants) {
        return [{
            name: null,
            items,
            totalNet: items.reduce((s, i) => s + i.totalNet, 0),
            totalVat: items.reduce((s, i) => s + i.totalNet * (i.vatRate / 100), 0),
            totalGross: items.reduce((s, i) => s + i.totalNet * (1 + i.vatRate / 100), 0),
        }]
    }

    const groups: VariantGroup[] = []
    const baseItems = items.filter(i => !i.variantName)
    if (baseItems.length > 0) {
        groups.push({
            name: null,
            items: baseItems,
            totalNet: baseItems.reduce((s, i) => s + i.totalNet, 0),
            totalVat: baseItems.reduce((s, i) => s + i.totalNet * (i.vatRate / 100), 0),
            totalGross: baseItems.reduce((s, i) => s + i.totalNet * (1 + i.vatRate / 100), 0),
        })
    }
    const variantNames = [...new Set(items.filter(i => i.variantName).map(i => i.variantName!))]
    for (const vName of variantNames) {
        const vItems = items.filter(i => i.variantName === vName)
        groups.push({
            name: vName,
            items: vItems,
            totalNet: vItems.reduce((s, i) => s + i.totalNet, 0),
            totalVat: vItems.reduce((s, i) => s + i.totalNet * (i.vatRate / 100), 0),
            totalGross: vItems.reduce((s, i) => s + i.totalNet * (1 + i.vatRate / 100), 0),
        })
    }
    return groups
}

// ── HTML sections ─────────────────────────────────────────────────────────────

function renderHeader(d: ClassicOfferData): string {
    const company = d.user.company || d.user.name || d.user.email
    const website = d.user.website?.replace(/^https?:\/\//, '') ?? null

    const logoHtml = d.user.logo
        ? `<img src="${esc(d.user.logo)}" alt="Logo" style="max-height:36px;max-width:130px;object-fit:contain;object-position:right center;display:block;margin-bottom:3px;" />`
        : ''

    return `
<header style="background:#0891b2;padding:12px 40px;display:flex;justify-content:space-between;align-items:center;gap:16px;">
  <div>
    <div style="color:#fff;font-size:14pt;font-weight:700;letter-spacing:0.03em;">OFERTA HANDLOWA</div>
    <div style="color:#bae6fd;font-size:8.5pt;margin-top:2px;">Nr: ${esc(d.number)}</div>
  </div>
  <div style="text-align:right;">
    ${logoHtml}
    <div style="color:#fff;font-size:9pt;font-weight:700;">${esc(company)}</div>
    ${d.user.nip ? `<div style="color:#e0f2fe;font-size:7.5pt;margin-top:1px;">NIP: ${esc(d.user.nip)}</div>` : ''}
    ${d.user.email ? `<div style="color:#e0f2fe;font-size:7.5pt;margin-top:1px;">${esc(d.user.email)}</div>` : ''}
    ${d.user.phone ? `<div style="color:#e0f2fe;font-size:7.5pt;margin-top:1px;">${esc(d.user.phone)}</div>` : ''}
    ${website ? `<div style="color:#bae6fd;font-size:7.5pt;margin-top:1px;">${esc(website)}</div>` : ''}
  </div>
</header>`
}

function renderParties(d: ClassicOfferData): string {
    const clientName = d.client.type === 'COMPANY'
        ? (d.client.company || d.client.name)
        : d.client.name
    const sellerAddr = [d.user.address, d.user.postalCode, d.user.city].filter(Boolean).join(', ')
    const buyerAddr = [d.client.postalCode, d.client.city].filter(Boolean).join(' ')

    function box(label: string, rows: string[]): string {
        return `
<div style="flex:1;background:#f1f5f9;">
  <div style="background:#0891b2;padding:4px 8px;">
    <span style="color:#fff;font-size:8pt;font-weight:700;">${label}</span>
  </div>
  <div style="padding:8px;display:flex;flex-direction:column;gap:2px;">
    ${rows.filter(Boolean).join('')}
  </div>
</div>`
    }

    const sellerRows = [
        `<div style="font-size:9pt;font-weight:700;color:#1e293b;margin-bottom:2px;">${esc(d.user.company || d.user.name || d.user.email)}</div>`,
        d.user.nip ? `<div style="font-size:7.5pt;color:#475569;">NIP: ${esc(d.user.nip)}</div>` : '',
        sellerAddr ? `<div style="font-size:7.5pt;color:#475569;">${esc(sellerAddr)}</div>` : '',
        d.user.email ? `<div style="font-size:7.5pt;color:#475569;">${esc(d.user.email)}</div>` : '',
        d.user.phone ? `<div style="font-size:7.5pt;color:#475569;">${esc(d.user.phone)}</div>` : '',
    ]

    const buyerRows = [
        `<div style="font-size:9pt;font-weight:700;color:#1e293b;margin-bottom:2px;">${esc(clientName)}</div>`,
        d.client.nip ? `<div style="font-size:7.5pt;color:#475569;">NIP: ${esc(d.client.nip)}</div>` : '',
        d.client.address ? `<div style="font-size:7.5pt;color:#475569;">${esc(d.client.address)}</div>` : '',
        buyerAddr ? `<div style="font-size:7.5pt;color:#475569;">${esc(buyerAddr)}</div>` : '',
        d.client.email ? `<div style="font-size:7.5pt;color:#475569;">${esc(d.client.email)}</div>` : '',
    ]

    return `
<div style="display:flex;gap:19px;margin-bottom:8px;">
  ${box('SPRZEDAWCA', sellerRows)}
  ${box('NABYWCA', buyerRows)}
</div>`
}

function renderMetaBar(d: ClassicOfferData): string {
    const cells: [string, string][] = [
        ['Data', fmtDate(d.createdAt)],
        ['Ważna do', fmtDate(d.validUntil)],
        ['Status', STATUS_MAP[d.status] ?? d.status],
        ['Płatność', `${d.paymentDays} dni`],
    ]
    const cellsHtml = cells.map(([label, value]) => `
<div style="flex:1;padding:0 6px;">
  <div style="font-size:7pt;color:#64748b;margin-bottom:1px;">${esc(label)}</div>
  <div style="font-size:9pt;font-weight:700;color:#1e293b;">${esc(value)}</div>
</div>`).join('')

    return `<div style="display:flex;background:#f1f5f9;padding:6px;margin-bottom:10px;">${cellsHtml}</div>`
}

function renderTableHeader(): string {
    const cols: [string, string][] = [
        ['4%', 'Lp'],
        ['40%', 'Nazwa'],
        ['7%', 'Ilość'],
        ['6%', 'Jm'],
        ['11%', 'Cena netto'],
        ['7%', 'VAT'],
        ['7%', 'Rabat'],
        ['18%', 'Wartość netto'],
    ]
    const th = cols.map(([w, t]) =>
        `<th style="width:${w};padding:3px 2px;text-align:${t === 'Lp' ? 'center' : t === 'Wartość netto' || t === 'Cena netto' || t === 'Ilość' || t === 'VAT' || t === 'Rabat' ? 'right' : 'left'};color:#fff;font-size:7pt;font-weight:700;">${t}</th>`
    ).join('')
    return `<thead><tr style="background:#0891b2;border:0.4px solid #000;">${th}</tr></thead>`
}

function renderItemRow(item: ClassicOfferItem, idx: number): string {
    const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc'
    const cells: [string, string, string][] = [
        ['4%', 'center', String(idx + 1)],
        ['40%', 'left', esc(item.name) + (item.description ? `<br><span style="font-size:6.5pt;color:#64748b;">${esc(item.description)}</span>` : '')],
        ['7%', 'right', String(item.quantity)],
        ['6%', 'right', item.unit],
        ['11%', 'right', money(item.unitPrice)],
        ['7%', 'right', `${item.vatRate}%`],
        ['7%', 'right', item.discount > 0 ? `${item.discount}%` : '-'],
        ['18%', 'right', money(item.totalNet)],
    ]
    const tds = cells.map(([w, align, val]) =>
        `<td style="width:${w};padding:3px 2px;text-align:${align};font-size:7pt;color:#1e293b;border:0.3px solid #000;">${val}</td>`
    ).join('')
    return `<tr style="background:${bg};">${tds}</tr>`
}

function renderItemsTable(d: ClassicOfferData): string {
    const groups = groupByVariant(d.items)
    const hasVariants = groups.some(g => g.name !== null)

    let rowIndex = 0
    const groupHtml = groups.map((group) => {
        let html = ''

        if (hasVariants) {
            if (group.name !== null) {
                html += `<tr><td colspan="8" style="background:#e0f2fe;padding:4px 8px;font-size:9pt;font-weight:700;color:#0891b2;">Wariant: ${esc(group.name)}</td></tr>`
            } else {
                html += `<tr><td colspan="8" style="background:#f1f5f9;padding:4px 8px;font-size:9pt;font-weight:700;color:#475569;">Pozycje wspólne</td></tr>`
            }
        }

        html += renderTableHeader().replace('<thead>', '').replace('</thead>', '')

        for (const item of group.items) {
            html += renderItemRow(item, rowIndex++)
        }

        if (hasVariants) {
            html += `
<tr>
  <td colspan="6"></td>
  <td colspan="2" style="padding:3px 6px;text-align:right;font-size:8pt;">
    <div style="color:#64748b;">Netto sekcji: <strong style="color:#1e293b;">${money(group.totalNet, d.currency)}</strong></div>
    <div style="color:#64748b;margin-top:2px;">Brutto sekcji: <strong style="color:#1e293b;">${money(group.totalGross, d.currency)}</strong></div>
  </td>
</tr>`
        }

        return html
    }).join('')

    return `
<div style="margin-bottom:10px;">
  <table style="width:100%;border-collapse:collapse;font-size:7pt;">
    ${hasVariants ? '' : renderTableHeader()}
    <tbody>
      ${groupHtml}
    </tbody>
  </table>
</div>`
}

function renderTotals(d: ClassicOfferData): string {
    return `
<div style="display:flex;flex-direction:column;align-items:flex-end;margin-bottom:12px;">
  <div style="display:flex;gap:8px;align-items:center;margin-bottom:3px;">
    <span style="font-size:9pt;color:#1e293b;min-width:60px;">Netto:</span>
    <span style="font-size:9pt;font-weight:700;color:#1e293b;min-width:100px;text-align:right;">${money(d.totalNet, d.currency)}</span>
  </div>
  <div style="display:flex;gap:8px;align-items:center;margin-bottom:3px;">
    <span style="font-size:9pt;color:#1e293b;min-width:60px;">VAT:</span>
    <span style="font-size:9pt;font-weight:700;color:#1e293b;min-width:100px;text-align:right;">${money(d.totalVat, d.currency)}</span>
  </div>
  <div style="background:#0891b2;padding:6px 12px;margin-top:4px;display:flex;gap:8px;align-items:center;min-width:280px;">
    <span style="color:#fff;font-size:8pt;font-weight:700;flex:1;">Razem do zapłaty:</span>
    <span style="color:#fff;font-size:8pt;font-weight:700;min-width:100px;text-align:right;">${money(d.totalGross, d.currency)}</span>
  </div>
</div>`
}

// ── Main export ───────────────────────────────────────────────────────────────

export function buildClassicHtml(data: ClassicOfferData): string {
    const today = fmtDate(new Date().toISOString())
    const company = data.user.company || data.user.name || null
    const website = data.user.website?.replace(/^https?:\/\//, '') ?? null
    const footerParts = [company, website, today].filter(Boolean).join(' · ')

    const css = `*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html,body{
  font-family:'Outfit Variable','Outfit',system-ui,sans-serif;
  font-size:9pt;
  color:#1e293b;
  background:#fff;
  -webkit-print-color-adjust:exact;
  print-color-adjust:exact;
}
a{color:inherit;text-decoration:none;}
img{display:block;}
.content{padding:10px 40px 60px;}
@media print{
  *{-webkit-print-color-adjust:exact !important;print-color-adjust:exact !important;}
  .doc-footer{position:fixed;bottom:0;left:0;right:0;}
  thead{display:table-header-group;}
  tr{break-inside:avoid;}
  @page{size:A4;margin:0;}
}`

    return buildHtmlDocument({
        title: `Oferta ${esc(data.number)}`,
        css,
        body: `${renderHeader(data)}
<div class="content">
  ${renderParties(data)}
  ${renderMetaBar(data)}
  ${data.title ? `<div style="font-size:11pt;font-weight:700;color:#1e293b;margin-bottom:4px;">${esc(data.title)}</div>` : ''}
  ${data.description ? `<div style="font-size:8pt;color:#64748b;line-height:1.6;margin-bottom:8px;white-space:pre-line;">${esc(data.description)}</div>` : ''}
  ${renderItemsTable(data)}
  ${renderTotals(data)}
  ${data.terms ? `
  <div style="margin-bottom:12px;">
    <div style="font-size:9pt;font-weight:700;color:#1e293b;margin-bottom:4px;">Warunki:</div>
    <div style="font-size:8pt;color:#64748b;line-height:1.6;white-space:pre-line;">${esc(data.terms)}</div>
  </div>` : ''}
  <div style="display:flex;flex-direction:column;align-items:flex-end;margin-top:16px;">
    <div style="border-top:0.5px solid #e2e8f0;width:175px;margin-bottom:3px;"></div>
    <div style="font-size:7pt;color:#94a3b8;width:175px;text-align:center;">Podpis</div>
  </div>
</div>
<div class="doc-footer" style="position:fixed;bottom:0;left:0;right:0;padding:6px 40px 15px;border-top:0.5px solid #e2e8f0;background:#fff;">
  <div style="font-size:7pt;color:#94a3b8;text-align:center;">${esc(footerParts)}</div>
</div>`,
    })
}

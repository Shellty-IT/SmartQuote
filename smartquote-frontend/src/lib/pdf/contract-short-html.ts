// src/lib/pdf/contract-short-html.ts
// Generates a full HTML string for the "Umowa — Krótka" contract template.
// Visual design matches the Umowa - Krótka standalone HTML file exactly.

import {
    buildDefaultContractBlocks,
    mergeContractWithDefaults,
    type ContractShortBlocks,
    type ContractSectionKey,
} from './contract-short-blocks'
import { buildHtmlDocument, buildContractPageRule, escapeHtml as esc } from './html-shell'
import { withPageBreakAfter } from './section-layout'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Pass-through for pre-sanitised HTML (e.g. items with <strong> tags) */
function rawHtml(s: string | null | undefined): string {
    return s ?? ''
}

function blankField(value: string, minWidth = '28mm'): string {
    const style = minWidth !== '28mm' ? ` style="min-width:${minWidth}"` : ''
    return `<span class="bl"${style}>${esc(value)}</span>`
}

// ── CSS ───────────────────────────────────────────────────────────────────────

function buildCss(editorMode: boolean, zoom: number): string {
    const zoomStyle = editorMode
        ? `html { zoom: ${zoom}; } body { min-height: ${Math.ceil(100 / zoom)}vh; }`
        : ''

    const editorStyles = editorMode
        ? `
    /* ── Editor mode — clickable sections ── */
    [data-sq-section] {
      cursor: pointer;
      border-radius: 4px;
      transition: outline 0.12s, background 0.12s;
      outline: 2px solid transparent;
      outline-offset: 2px;
    }
    [data-sq-section]:hover {
      outline: 2px solid rgba(76,175,80,0.55);
      background: rgba(76,175,80,0.04);
    }
    [data-sq-section].sq-active {
      outline: 2px solid #4CAF50;
      background: rgba(76,175,80,0.06);
    }
    [data-sq-section][data-sq-disabled] {
      opacity: 0.35;
      cursor: pointer;
    }
    [data-sq-section][data-sq-disabled]:hover {
      opacity: 0.5;
      outline: 2px solid rgba(76,175,80,0.3);
    }
    .sq-edit-hint {
      position: fixed;
      top: 8px; right: 8px;
      font: 11px/1 -apple-system, system-ui, sans-serif;
      color: #555;
      background: rgba(255,255,255,0.92);
      padding: 4px 10px;
      border-radius: 12px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.12);
      pointer-events: none;
      z-index: 100;
    }
    .c-header[data-sq-section]:hover { background: rgba(76,175,80,0.04) !important; }
    .sig-wrap[data-sq-section]:hover { background: rgba(76,175,80,0.04) !important; }
    `
        : ''

    return `
    ${zoomStyle}
    :root {
      --gd:  #1B5E20;
      --gm:  #4CAF50;
      --gl:  rgba(76,175,80,0.07);
      --gbg: #F5F5F5;
      --wh:  #FFFFFF;
      --tx:  #212121;
      --txl: #757575;
      --brd: #E0E0E0;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--gbg);
      font-family: 'Source Sans 3', 'Segoe UI', system-ui, sans-serif;
      color: var(--tx);
      font-size: 9.5pt;
      line-height: 1.58;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page {
      width: 210mm;
      background: var(--wh);
      margin: 12px auto;
      padding: 16mm 17mm 28mm;
      box-shadow: 0 2px 20px rgba(0,0,0,0.13);
    }
    @media print {
      body { background: none; }
      .page { margin: 0; box-shadow: none; padding-bottom: 24mm; }
    }
    ${buildContractPageRule({ margins: '16mm 17mm 24mm 17mm', bottomLeft: 'shellty-it.github.io', counterColor: '#9E9E9E', counterSize: '7pt' })}
    .screen-footer {
      width: 210mm; margin: 0 auto;
      border-top: 1.5px solid var(--gm);
      padding: 2mm 0;
      display: flex; justify-content: space-between; align-items: center;
      font-size: 7.5pt; color: var(--txl);
    }
    .screen-footer .sf-l { font-weight: 600; color: var(--tx); }
    .screen-footer .sf-c { font-weight: 700; color: var(--gd); letter-spacing: 1px; }
    .screen-footer .sf-r { font-weight: 600; color: var(--tx); }
    @media print { .screen-footer { display: none; } }

    /* ── HEADER ── */
    .c-header {
      position: relative;
      text-align: center;
      padding-bottom: 6mm;
      border-bottom: 2px solid var(--gd);
      margin-bottom: 6mm;
    }
    .c-header-logo { position: absolute; left: 0; top: 0; display: block; max-width: 34mm; max-height: 14mm; object-fit: contain; object-position: left top; }
    .c-kicker { font-size: 7.5pt; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: var(--gm); margin-bottom: 2.5mm; }
    .c-title { font-size: 13.5pt; font-weight: 700; color: var(--gd); text-transform: uppercase; letter-spacing: 0.4px; line-height: 1.2; }
    .c-meta { margin-top: 4.5mm; display: flex; justify-content: center; gap: 7mm; flex-wrap: wrap; }
    .c-mf { display: flex; flex-direction: column; align-items: center; gap: 2px; }
    .c-ml { font-size: 7pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; color: var(--txl); }
    .c-mv { font-size: 10pt; font-weight: 600; border-bottom: 1.5px solid var(--gm); min-width: 40mm; text-align: center; padding-bottom: 1px; min-height: 16px; }

    /* ── SECTIONS ── */
    .sec { margin-bottom: 5mm; }
    .sec-h { display: flex; align-items: baseline; gap: 5px; border-bottom: 1.5px solid var(--gm); padding-bottom: 1.5mm; margin-bottom: 3mm; break-after: avoid; page-break-after: avoid; }
    .sec-sym { font-size: 10pt; font-weight: 700; color: var(--gm); flex-shrink: 0; }
    .sec-title { font-size: 9.5pt; font-weight: 700; color: var(--gd); text-transform: uppercase; letter-spacing: 0.8px; }

    /* ── PARTIES ── */
    .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 3.5mm; }
    .party { border: 1px solid var(--brd); border-left: 3px solid var(--gm); border-radius: 0 3px 3px 0; padding: 3mm 3.5mm; background: var(--gl); }
    .party-role { font-size: 7.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--gd); margin-bottom: 2mm; }
    .pf { display: flex; align-items: baseline; gap: 3px; margin-bottom: 1.5mm; }
    .pf-l { font-size: 8pt; color: var(--txl); min-width: 18mm; flex-shrink: 0; }
    .pf-v { border-bottom: 1px solid #BDBDBD; flex: 1; min-height: 13px; padding-bottom: 1px; font-size: 9pt; }

    /* ── TEXT ── */
    p { font-size: 9.5pt; line-height: 1.6; margin-bottom: 1.5mm; orphans: 3; widows: 3; }
    strong { font-weight: 700; }

    /* ── LISTS ── */
    ol.leg { padding-left: 5mm; margin: 1mm 0 2mm; }
    ol.leg li { font-size: 9.5pt; line-height: 1.58; margin-bottom: 1.2mm; padding-left: 1mm; orphans: 3; widows: 3; }
    ul.leg { padding-left: 4.5mm; margin: 1mm 0 1.5mm; list-style: none; }
    ul.leg li { font-size: 9.5pt; line-height: 1.55; margin-bottom: 0.8mm; padding-left: 3.5mm; position: relative; orphans: 3; widows: 3; }
    ul.leg li::before { content: '–'; position: absolute; left: 0; color: var(--gm); font-weight: 700; }

    /* ── CHECKBOXES ── */
    .chk-row { display: flex; gap: 5mm; flex-wrap: wrap; margin: 1.5mm 0 2mm; }
    .chk-item { display: flex; align-items: center; gap: 2.5mm; font-size: 9.5pt; }
    .chk-box { width: 3.5mm; height: 3.5mm; border: 1.5px solid var(--gd); border-radius: 1px; flex-shrink: 0; background: white; }
    .chk-box.checked { background: var(--gm); border-color: var(--gm); position: relative; }
    .chk-box.checked::after { content: '✓'; position: absolute; top: -1px; left: 0.5px; font-size: 7px; color: white; font-weight: 700; }

    /* ── PRICING BOX ── */
    .price-box { border: 2px solid var(--gm); border-radius: 4px; overflow: hidden; margin: 2.5mm 0 3mm; }
    .price-hd { background: var(--gd); color: white; padding: 1.8mm 5mm; font-size: 8.5pt; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
    .price-row { display: flex; align-items: center; padding: 1.8mm 5mm; border-bottom: 1px solid rgba(76,175,80,0.18); gap: 3mm; }
    .price-row:last-child { border-bottom: none; }
    .price-row.tot { background: rgba(76,175,80,0.07); }
    .price-row .pl { font-size: 9pt; color: var(--txl); min-width: 48mm; }
    .price-row.tot .pl { color: var(--tx); font-weight: 600; }
    .price-row .pln { border-bottom: 1.5px solid var(--gm); flex: 1; min-height: 14px; padding-bottom: 1px; font-size: 9pt; font-weight: 600; }
    .price-row .pu { font-size: 9pt; font-weight: 600; color: var(--gd); flex-shrink: 0; }
    .price-row.tot .pu { font-size: 10.5pt; }

    /* ── PAYMENT ROW ── */
    .pay-row { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm; margin: 2mm 0; }
    .pay-item { border: 1px solid var(--brd); border-top: 2.5px solid var(--gm); border-radius: 0 0 3px 3px; padding: 2.5mm 3mm; }
    .pay-item .pi-l { font-size: 7.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--txl); margin-bottom: 1mm; }
    .pay-item .pi-v { font-size: 9pt; font-weight: 600; color: var(--gd); }

    /* ── BANK ── */
    .bank { background: var(--gbg); border: 1px solid var(--brd); border-radius: 3px; padding: 2mm 3.5mm; margin: 2mm 0; font-size: 9pt; }
    .bank .bk-l { font-size: 7.5pt; color: var(--txl); margin-bottom: 0.5mm; }

    /* ── INLINE BLANK ── */
    .bl { display: inline-block; border-bottom: 1px solid #BDBDBD; min-width: 28mm; min-height: 13px; vertical-align: bottom; }

    /* ── SIGNATURE ── */
    .sig-wrap { border: 2px solid var(--gm); border-radius: 4px; overflow: hidden; margin-top: 6mm; }
    .sig-hd { background: var(--gd); color: white; text-align: center; padding: 2mm; font-size: 8.5pt; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
    .sig-cols { display: grid; grid-template-columns: 1fr 1fr; }
    .sig-col { padding: 4mm 4.5mm; }
    .sig-col:first-child { border-right: 1.5px solid var(--gm); }
    .sig-col-title { font-size: 8pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--gd); margin-bottom: 2.5mm; text-align: center; }
    .sf { margin-bottom: 2mm; }
    .sf .sf-l { font-size: 7.5pt; color: var(--txl); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; margin-bottom: 0.5mm; }
    .sf .sf-ln { border-bottom: 1px solid #BDBDBD; min-height: 13px; font-size: 9pt; padding-bottom: 1px; }
    .sig-area { height: 14mm; border: 1px dashed #BDBDBD; border-radius: 2px; margin: 2.5mm 0 2mm; display: flex; align-items: center; justify-content: center; }
    .sig-area span { font-size: 7pt; color: #BDBDBD; letter-spacing: 0.5px; text-transform: uppercase; }
    .stamp-area { height: 11mm; border: 1px dashed #BDBDBD; border-radius: 50%; width: 22mm; display: flex; align-items: center; justify-content: center; margin: 0 auto; }
    .stamp-area span { font-size: 7pt; color: #BDBDBD; }

    hr.div { border: none; border-top: 1px solid var(--brd); margin: 4mm 0; }
    ${editorStyles}
    `
}

// ── Helpers for dynamic section numbering ────────────────────────────────────

/**
 * Returns the rendered §N number for a given section key, respecting editorMode
 * (disabled sections still count in editorMode since they are shown greyed-out).
 * Returns null if the section is not present in blocks.sections.
 */
function computeSectionNum(
    blocks: ContractShortBlocks,
    targetKey: ContractSectionKey,
    editorMode: boolean,
): number | null {
    let num = 0
    for (const key of blocks.sections) {
        const enabled = (blocks[key] as { enabled?: boolean })?.enabled !== false
        if (enabled || editorMode) {
            num++
            if (key === targetKey) return num
        }
    }
    return null
}

// ── Section renderers ─────────────────────────────────────────────────────────

function sectionAttr(key: ContractSectionKey, disabled: boolean, active: boolean, editorMode: boolean): string {
    if (!editorMode) return ''
    const cls = [disabled && 'sq-disabled', active && 'sq-active'].filter(Boolean).join(' ')
    return ` data-sq-section="${key}"${disabled ? ' data-sq-disabled=""' : ''}${cls ? ` class="${cls}"` : ''}`
}

function renderHeader(blocks: ContractShortBlocks, editorMode: boolean, activeSection: string | null): string {
    const h = blocks.header
    const logoUrl = h.logoDarkUrl || h.logoUrl
    const attr = editorMode
        ? ` data-sq-section="header"${activeSection === 'header' ? ' class="sq-active"' : ''}`
        : ''
    return `
  <div class="c-header"${attr}>
    ${logoUrl ? `<img class="c-header-logo" src="${esc(logoUrl)}" alt="Logo firmy" />` : ''}
    <div class="c-kicker">${esc(h.kicker)}</div>
    <div class="c-title">${esc(h.title)}</div>
    <div class="c-meta">
      <div class="c-mf">
        <div class="c-ml">Nr umowy</div>
        <div class="c-mv">${esc(h.contractNumber)}</div>
      </div>
      <div class="c-mf">
        <div class="c-ml">Miejscowość</div>
        <div class="c-mv">${esc(h.city)}</div>
      </div>
      <div class="c-mf">
        <div class="c-ml">Data zawarcia</div>
        <div class="c-mv">${esc(h.date)}</div>
      </div>
    </div>
  </div>`
}

function renderParties(
    blocks: ContractShortBlocks,
    sectionNum: number,
    editorMode: boolean,
    activeSection: string | null,
): string {
    const s = blocks.parties
    const disabled = !s.enabled
    const attr = sectionAttr('parties', disabled, activeSection === 'parties', editorMode)
    const num = `§${sectionNum}`

    return `
  <div class="sec"${attr}>
    <div class="sec-h">
      <span class="sec-sym">${num}</span>
      <span class="sec-title">${esc(s.sectionTitle)}</span>
    </div>
    <div class="parties">
      <div class="party">
        <div class="party-role">${esc(s.contractorRole)}</div>
        <div class="pf"><span class="pf-l">Firma:</span><span class="pf-v">${esc(s.contractor.firmName)}</span></div>
        <div class="pf"><span class="pf-l">Adres:</span><span class="pf-v">${esc(s.contractor.address)}</span></div>
        <div class="pf"><span class="pf-l">NIP:</span><span class="pf-v">${esc(s.contractor.nip)}</span></div>
        <div class="pf"><span class="pf-l">Reprezentuje:</span><span class="pf-v">${esc(s.contractor.representative)}</span></div>
      </div>
      <div class="party">
        <div class="party-role">${esc(s.clientRole)}</div>
        <div class="pf"><span class="pf-l">${esc(s.clientFirmLabel)}</span><span class="pf-v">${esc(s.client.firmName)}</span></div>
        <div class="pf"><span class="pf-l">Adres:</span><span class="pf-v">${esc(s.client.address)}</span></div>
        <div class="pf"><span class="pf-l">NIP:</span><span class="pf-v">${esc(s.client.nip)}</span></div>
        <div class="pf"><span class="pf-l">Reprezentuje:</span><span class="pf-v">${esc(s.client.representative)}</span></div>
      </div>
    </div>
  </div>`
}

function renderSubject(
    blocks: ContractShortBlocks,
    sectionNum: number,
    editorMode: boolean,
    activeSection: string | null,
): string {
    const s = blocks.subject
    const disabled = !s.enabled
    const attr = sectionAttr('subject', disabled, activeSection === 'subject', editorMode)
    const num = `§${sectionNum}`

    const scopeItems = s.scopeItems
        .map((item) => `<li>${rawHtml(item)}</li>`)
        .join('\n          ')

    return `
  <div class="sec"${attr}>
    <div class="sec-h">
      <span class="sec-sym">${num}</span>
      <span class="sec-title">${esc(s.sectionTitle)}</span>
    </div>
    <p>1. Przedmiotem umowy jest:</p>
    <div class="chk-row">
      <div class="chk-item">
        <span class="chk-box${s.isNewSite ? ' checked' : ''}"></span>
        wykonanie nowej strony internetowej od podstaw
      </div>
      <div class="chk-item">
        <span class="chk-box${s.isModernization ? ' checked' : ''}"></span>
        modernizacja istniejącej strony internetowej
      </div>
    </div>
    <p>2. Technologia realizacji: <span class="bl" style="min-width:50mm">${esc(s.technology)}</span></p>
    <p>3. Zakres prac obejmuje w szczególności:</p>
    <ul class="leg">
      ${scopeItems}
    </ul>
    <p>4. ${rawHtml(s.additionalNote)}</p>
  </div>`
}

function renderDeadline(
    blocks: ContractShortBlocks,
    sectionNum: number,
    editorMode: boolean,
    activeSection: string | null,
): string {
    const s = blocks.deadline
    const disabled = !s.enabled
    const attr = sectionAttr('deadline', disabled, activeSection === 'deadline', editorMode)
    const num = `§${sectionNum}`

    return `
  <div class="sec"${attr}>
    <div class="sec-h">
      <span class="sec-sym">${num}</span>
      <span class="sec-title">${esc(s.sectionTitle)}</span>
    </div>
    <p>1. Prace rozpoczną się w dniu: ${blankField(s.startDate)}</p>
    <p>2. Termin przekazania kompletnej strony gotowej do odbioru: ${blankField(s.endDate, '50mm')}</p>
    <p>3. Opóźnienie w dostarczeniu materiałów lub dostępów przez Zamawiającego przedłuża termin realizacji o odpowiadający okres.</p>
    <p>4. W dniu odbioru końcowego Wykonawca przekaże Zamawiającemu dane dostępowe do panelu administracyjnego, serwera i rejestru domeny (o ile dotyczy) oraz pliki źródłowe projektu.</p>
  </div>`
}

function renderPayment(
    blocks: ContractShortBlocks,
    sectionNum: number,
    editorMode: boolean,
    activeSection: string | null,
): string {
    const s = blocks.payment
    const disabled = !s.enabled
    const attr = sectionAttr('payment', disabled, activeSection === 'payment', editorMode)
    const num = `§${sectionNum}`

    return `
  <div class="sec"${attr}>
    <div class="sec-h">
      <span class="sec-sym">${num}</span>
      <span class="sec-title">${esc(s.sectionTitle)}</span>
    </div>
    <p>1. Za realizację przedmiotu umowy Strony ustalają wynagrodzenie ryczałtowe:</p>
    <div class="price-box">
      <div class="price-hd">💰 Wynagrodzenie</div>
      <div class="price-row">
        <span class="pl">Wartość netto</span>
        <span class="pln">${esc(s.netAmount)}</span>
        <span class="pu">zł</span>
      </div>
      <div class="price-row">
        <span class="pl">VAT (${esc(s.vatRate)}%)</span>
        <span class="pln">${esc(s.vatAmount)}</span>
        <span class="pu">zł</span>
      </div>
      <div class="price-row tot">
        <span class="pl">Wartość brutto (do zapłaty)</span>
        <span class="pln">${esc(s.grossAmount)}</span>
        <span class="pu">zł</span>
      </div>
    </div>
    <p>2. Harmonogram płatności:</p>
    <div class="pay-row">
      <div class="pay-item">
        <div class="pi-l">Zaliczka — przed rozpoczęciem prac</div>
        <div class="pi-v">${esc(s.advancePercent)}% wartości brutto — płatne przy podpisaniu umowy</div>
      </div>
      <div class="pay-item">
        <div class="pi-l">Płatność końcowa — po odbiorze</div>
        <div class="pi-v">${esc(s.finalPercent)}% wartości brutto — w ciągu ${esc(s.finalPaymentDays)} dni od odbioru</div>
      </div>
    </div>
    <div class="bank">
      <div class="bk-l">Rachunek bankowy Wykonawcy:</div>
      <div style="font-weight:600;min-height:14px;">${esc(s.bankAccount)}</div>
    </div>
    <p>3. Nieuregulowanie zaliczki w terminie upoważnia Wykonawcę do wstrzymania się z rozpoczęciem prac. Nieuregulowanie płatności końcowej upoważnia Wykonawcę do wstrzymania publikacji strony na serwerze docelowym.</p>
  </div>`
}

function renderObligations(
    blocks: ContractShortBlocks,
    sectionNum: number,
    editorMode: boolean,
    activeSection: string | null,
): string {
    const s = blocks.obligations
    const disabled = !s.enabled
    const attr = sectionAttr('obligations', disabled, activeSection === 'obligations', editorMode)
    const num = `§${sectionNum}`

    const paymentNum = computeSectionNum(blocks, 'payment', editorMode)
    const paymentRef = paymentNum !== null ? `§${paymentNum}` : 'odpowiednim paragrafem'

    return `
  <div class="sec"${attr}>
    <div class="sec-h">
      <span class="sec-sym">${num}</span>
      <span class="sec-title">${esc(s.sectionTitle)}</span>
    </div>
    <p>Zamawiający zobowiązuje się do:</p>
    <ol class="leg">
      <li>dostarczenia wszelkich niezbędnych materiałów (teksty, zdjęcia, logo, dane firmowe) w terminie ${blankField(s.materialsDays, '12mm')} dni od podpisania umowy,</li>
      <li>udzielenia dostępu do hostingu i panelu domeny w terminie ${blankField(s.accessDays, '12mm')} dni od podpisania umowy,</li>
      <li>udzielania odpowiedzi i akceptacji na przedstawione propozycje w ciągu <strong>${blankField(s.responseDays, '8mm')} dni roboczych</strong> od ich przekazania,</li>
      <li>terminowego regulowania płatności zgodnie z ${paymentRef},</li>
      <li>zapewnienia, że dostarczone materiały nie naruszają praw osób trzecich — odpowiedzialność za treści spoczywa wyłącznie na Zamawiającym.</li>
    </ol>
  </div>`
}

function renderAcceptance(
    blocks: ContractShortBlocks,
    sectionNum: number,
    editorMode: boolean,
    activeSection: string | null,
): string {
    const s = blocks.acceptance
    const disabled = !s.enabled
    const attr = sectionAttr('acceptance', disabled, activeSection === 'acceptance', editorMode)
    const num = `§${sectionNum}`

    return `
  <div class="sec"${attr}>
    <div class="sec-h">
      <span class="sec-sym">${num}</span>
      <span class="sec-title">${esc(s.sectionTitle)}</span>
    </div>
    <ol class="leg">
      <li>W ramach wynagrodzenia Wykonawca uwzględnia <strong>${blankField(s.revisionRounds, '10mm')} rundy poprawek</strong>. Poprawka dotyczy modyfikacji w ramach uzgodnionego zakresu — zmiany koncepcji lub zakresu są rozliczane osobno.</li>
      <li>Zamawiający ma <strong>${blankField(s.reviewDays, '10mm')} dni roboczych</strong> od udostępnienia strony na środowisku testowym na zgłoszenie uwag.</li>
      <li>Brak odpowiedzi w powyższym terminie oznacza <strong>akceptację domniemaną</strong> — strona uznana jest za odebraną.</li>
      <li>Dodatkowe poprawki poza zakresem rund, o których mowa w ust. 1, rozliczane są według stawki <strong>${blankField(s.hourlyRate, '20mm')} zł netto/godz.</strong></li>
    </ol>
  </div>`
}

function renderCopyright(
    blocks: ContractShortBlocks,
    sectionNum: number,
    editorMode: boolean,
    activeSection: string | null,
): string {
    const s = blocks.copyright
    const disabled = !s.enabled
    const attr = sectionAttr('copyright', disabled, activeSection === 'copyright', editorMode)
    const num = `§${sectionNum}`

    const items = s.items
        .map((item) => `<li>${rawHtml(item)}</li>`)
        .join('\n      ')

    return `
  <div class="sec"${attr}>
    <div class="sec-h">
      <span class="sec-sym">${num}</span>
      <span class="sec-title">${esc(s.sectionTitle)}</span>
    </div>
    <ol class="leg">
      ${items}
    </ol>
  </div>`
}

function renderWarranty(
    blocks: ContractShortBlocks,
    sectionNum: number,
    editorMode: boolean,
    activeSection: string | null,
): string {
    const s = blocks.warranty
    const disabled = !s.enabled
    const attr = sectionAttr('warranty', disabled, activeSection === 'warranty', editorMode)
    const num = `§${sectionNum}`

    return `
  <div class="sec"${attr}>
    <div class="sec-h">
      <span class="sec-sym">${num}</span>
      <span class="sec-title">${esc(s.sectionTitle)}</span>
    </div>
    <ol class="leg">
      <li>Wykonawca udziela gwarancji na prawidłowe działanie stworzonego oprogramowania przez okres <strong>${blankField(s.warrantyMonths, '12mm')} miesięcy</strong> od daty odbioru końcowego.</li>
      <li>W ramach gwarancji Wykonawca bezpłatnie usunie błędy wynikające z wad kodu lub błędów implementacji w ciągu ${blankField(s.fixDays, '10mm')} dni roboczych od zgłoszenia.</li>
      <li>Gwarancja nie obejmuje: zmian wprowadzonych samodzielnie przez Zamawiającego lub osoby trzecie, problemów z hostingiem i domeną, aktualizacji wtyczek/oprogramowania osób trzecich.</li>
    </ol>
  </div>`
}

function renderConfidentiality(
    blocks: ContractShortBlocks,
    sectionNum: number,
    editorMode: boolean,
    activeSection: string | null,
): string {
    const s = blocks.confidentiality
    const disabled = !s.enabled
    const attr = sectionAttr('confidentiality', disabled, activeSection === 'confidentiality', editorMode)
    const num = `§${sectionNum}`

    const items = s.items
        .map((item) => `<li>${rawHtml(item)}</li>`)
        .join('\n      ')

    return `
  <div class="sec"${attr}>
    <div class="sec-h">
      <span class="sec-sym">${num}</span>
      <span class="sec-title">${esc(s.sectionTitle)}</span>
    </div>
    <ol class="leg">
      ${items}
    </ol>
  </div>`
}

function renderFinalProvisions(
    blocks: ContractShortBlocks,
    sectionNum: number,
    editorMode: boolean,
    activeSection: string | null,
): string {
    const s = blocks.finalProvisions
    const disabled = !s.enabled
    const attr = sectionAttr('finalProvisions', disabled, activeSection === 'finalProvisions', editorMode)
    const num = `§${sectionNum}`

    const items = s.items
        .map((item) => `<li>${rawHtml(item)}</li>`)
        .join('\n      ')

    return `
  <div class="sec"${attr}>
    <div class="sec-h">
      <span class="sec-sym">${num}</span>
      <span class="sec-title">${esc(s.sectionTitle)}</span>
    </div>
    <ol class="leg">
      ${items}
    </ol>
  </div>`
}

function renderSignatures(blocks: ContractShortBlocks, editorMode: boolean, activeSection: string | null): string {
    const s = blocks.signatures
    const attr = editorMode
        ? ` data-sq-section="signatures"${activeSection === 'signatures' ? ' class="sq-active"' : ''}`
        : ''

    return `
  <hr class="div">
  <div class="sig-wrap"${attr}>
    <div class="sig-hd">Podpisy Stron</div>
    <div class="sig-cols">
      <div class="sig-col">
        <div class="sig-col-title">${esc(s.contractorTitle)}</div>
        <div class="sf"><div class="sf-l">Firma / imię i nazwisko</div><div class="sf-ln">${esc(s.contractorFirm)}</div></div>
        <div class="sf"><div class="sf-l">Reprezentowany przez</div><div class="sf-ln">${esc(s.contractorRepresentative)}</div></div>
        <div class="sf"><div class="sf-l">Data</div><div class="sf-ln" style="max-width:32mm;">${esc(s.contractorDate)}</div></div>
        <div class="sig-area"><span>Podpis</span></div>
        <div style="text-align:center;"><div class="stamp-area"><span>Pieczęć</span></div></div>
      </div>
      <div class="sig-col">
        <div class="sig-col-title">${esc(s.clientTitle)}</div>
        <div class="sf"><div class="sf-l">Firma / imię i nazwisko</div><div class="sf-ln">${esc(s.clientFirm)}</div></div>
        <div class="sf"><div class="sf-l">Reprezentowany przez</div><div class="sf-ln">${esc(s.clientRepresentative)}</div></div>
        <div class="sf"><div class="sf-l">Data</div><div class="sf-ln" style="max-width:32mm;">${esc(s.clientDate)}</div></div>
        <div class="sig-area"><span>Podpis</span></div>
        <div style="text-align:center;"><div class="stamp-area"><span>Pieczęć</span></div></div>
      </div>
    </div>
  </div>`
}

// ── Section dispatcher ────────────────────────────────────────────────────────

function renderSection(
    key: ContractSectionKey,
    blocks: ContractShortBlocks,
    sectionNum: number,
    editorMode: boolean,
    activeSection: string | null,
): string {
    switch (key) {
        case 'parties': return renderParties(blocks, sectionNum, editorMode, activeSection)
        case 'subject': return renderSubject(blocks, sectionNum, editorMode, activeSection)
        case 'deadline': return renderDeadline(blocks, sectionNum, editorMode, activeSection)
        case 'payment': return renderPayment(blocks, sectionNum, editorMode, activeSection)
        case 'obligations': return renderObligations(blocks, sectionNum, editorMode, activeSection)
        case 'acceptance': return renderAcceptance(blocks, sectionNum, editorMode, activeSection)
        case 'copyright': return renderCopyright(blocks, sectionNum, editorMode, activeSection)
        case 'warranty': return renderWarranty(blocks, sectionNum, editorMode, activeSection)
        case 'confidentiality': return renderConfidentiality(blocks, sectionNum, editorMode, activeSection)
        case 'finalProvisions': return renderFinalProvisions(blocks, sectionNum, editorMode, activeSection)
    }
}

// ── Editor postMessage script ─────────────────────────────────────────────────

function buildEditorScript(): string {
    return `
<script>
(function() {
  var active = null;
  document.addEventListener('click', function(e) {
    var el = e.target;
    while (el && el !== document) {
      if (el.dataset && el.dataset.sqSection) {
        if (active) active.classList.remove('sq-active');
        active = el;
        active.classList.add('sq-active');
        window.parent.postMessage({ type: 'sq:editSection', sectionKey: el.dataset.sqSection }, '*');
        return;
      }
      el = el.parentElement;
    }
  });
})();
<\/script>`
}

// ── Main export ───────────────────────────────────────────────────────────────

export interface ContractHtmlOptions {
    editorMode?: boolean
    zoom?: number
    activeSection?: string | null
}

export function buildContractShortHtml(
    blocksInput: Partial<ContractShortBlocks> | null | undefined,
    options: ContractHtmlOptions = {},
): string {
    const blocks = mergeContractWithDefaults(blocksInput)
    const editorMode = options.editorMode ?? false
    const zoom = options.zoom ?? 1.0
    const activeSection = options.activeSection ?? null

    // Build ordered section HTML — sections array controls which sections appear
    // Sections not in blocks.sections are excluded from rendering
    const allSectionKeys = blocks.sections
    let sectionNum = 0
    const sectionsHtml = allSectionKeys
        .map((key) => {
            const blockEnabled = (blocks[key] as { enabled?: boolean })?.enabled !== false
            if (!blockEnabled && !editorMode) return ''
            sectionNum++
            return withPageBreakAfter(
                renderSection(key, blocks, sectionNum, editorMode, activeSection),
                blocks.pageBreakAfter.includes(key),
            )
        })
        .join('\n')

    const footerContractNum = blocks.header.contractNumber
        ? `Nr umowy: ${esc(blocks.header.contractNumber)}`
        : 'Nr umowy: ___/____'

    return buildHtmlDocument({
        title: esc(blocks.header.title),
        css: buildCss(editorMode, zoom),
        body: `${editorMode ? '<div class="sq-edit-hint">Kliknij sekcję aby edytować</div>' : ''}

<div class="page">

  ${withPageBreakAfter(renderHeader(blocks, editorMode, activeSection), blocks.pageBreakAfter.includes('header'))}

${sectionsHtml}

  ${renderSignatures(blocks, editorMode, activeSection)}

</div>

<div class="screen-footer">
  <span class="sf-l">${footerContractNum}</span>
  <span class="sf-c">POUFNE</span>
  <span class="sf-r">${esc(blocks.header.footerWebsite || blocks.header.kicker.split('·')[0]?.trim() || '')}</span>
</div>

${editorMode ? buildEditorScript() : ''}`,
    })
}

/** Convenience: build from raw (possibly partial) saved blocks object */
export function buildContractShortHtmlFromSaved(
    savedBlocks: unknown,
    options: ContractHtmlOptions = {},
): string {
    const parsed =
        savedBlocks && typeof savedBlocks === 'object'
            ? (savedBlocks as Partial<ContractShortBlocks>)
            : null
    return buildContractShortHtml(parsed, options)
}

/** Build default blocks for use in template previews */
export function buildContractShortHtmlDefault(options: ContractHtmlOptions = {}): string {
    return buildContractShortHtml(buildDefaultContractBlocks(), options)
}

// src/lib/pdf/contract-services-html.ts
// Generates a full HTML string for the "Sklep internetowy" contract template.
// Design: navy #1B3A5C header + gold #C9A84C accent, light-gray #EEF1F5 background.

import {
    mergeServicesWithDefaults,
    type ContractServicesBlocks,
    type ContractServicesSectionKey,
} from './contract-services-blocks'
import { buildHtmlDocument, buildContractPageRule } from './html-shell'

// ── Helpers ───────────────────────────────────────────────────────────────────

function esc(s: string | null | undefined): string {
    if (!s) return ''
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}

function blank(value: string, label = ''): string {
    const inner = value ? esc(value) : (label ? `<span class="ph">${label}</span>` : '<span class="ph">…</span>')
    return inner
}

function sectionAttr(
    key: string,
    disabled: boolean,
    active: boolean,
    editorMode: boolean,
): string {
    if (!editorMode) return ''
    let cls = ''
    if (active) cls = ' sq-active'
    const disabledAttr = disabled ? ' data-sq-disabled="1"' : ''
    return ` data-sq-section="${key}"${disabledAttr} class="sq-sec${cls}"`
}

// ── CSS ───────────────────────────────────────────────────────────────────────

function buildCss(editorMode: boolean, zoom: number): string {
    const zoomStyle = editorMode
        ? `html { zoom: ${zoom}; } body { min-height: ${Math.ceil(100 / zoom)}vh; }`
        : ''

    const editorStyles = editorMode
        ? `
    [data-sq-section] {
      cursor: pointer;
      border-radius: 3px;
      transition: outline 0.12s, background 0.12s;
      outline: 2px solid transparent;
      outline-offset: 2px;
    }
    [data-sq-section]:hover {
      outline: 2px solid rgba(201,168,76,0.55);
      background: rgba(201,168,76,0.04);
    }
    [data-sq-section].sq-active {
      outline: 2px solid #C9A84C;
      background: rgba(201,168,76,0.06);
    }
    [data-sq-section][data-sq-disabled] {
      opacity: 0.35;
      cursor: pointer;
    }
    [data-sq-section][data-sq-disabled]:hover {
      opacity: 0.5;
      outline: 2px solid rgba(201,168,76,0.3);
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
    .c-header[data-sq-section]:hover { background: rgba(201,168,76,0.04) !important; }
    .sig-row[data-sq-section]:hover { background: rgba(201,168,76,0.04) !important; }
    `
        : ''

    return `
    ${zoomStyle}
    :root {
      --nd: #1B3A5C;
      --nm: #2A5882;
      --gd: #C9A84C;
      --gl: rgba(201,168,76,0.06);
      --bg: #EEF1F5;
      --wh: #FFFFFF;
      --tx: #0F172A;
      --txl: #475569;
      --brd: #E2E8F0;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      font-family: 'Source Sans 3', 'Segoe UI', system-ui, sans-serif;
      color: var(--tx);
      font-size: 9.5pt;
      line-height: 1.6;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .sheet {
      max-width: 800px;
      background: var(--wh);
      margin: 20px auto 48px;
      box-shadow: 0 1px 3px rgba(15,23,42,0.08), 0 8px 28px rgba(15,23,42,0.10);
    }
    ${buildContractPageRule({ margins: '14mm 14mm 22mm' })}
    .pad > div { break-inside: auto; page-break-inside: auto; }
    .sec-h { break-after: avoid; page-break-after: avoid; }
    p { orphans: 3; widows: 3; }
    @media print {
      body { background: #fff; }
      .sheet { margin: 0; max-width: none; box-shadow: none; }
      .page-break { page-break-before: always; }
      .avoid-break { page-break-inside: avoid; }
    }

    /* ── HEADER BAR ── */
    .c-header {
      background: var(--nd);
      padding: 14px 44px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }
    .c-logo-box {
      display: flex; align-items: center; gap: 12px;
    }
    .c-logo-label {
      border: 1px solid rgba(201,168,76,0.55);
      color: var(--gd);
      font-weight: 700;
      font-size: 10px;
      letter-spacing: 2px;
      padding: 6px 10px;
    }
    .c-logo-img { display: block; max-width: 120px; max-height: 48px; object-fit: contain; object-position: left center; }
    .c-url { color: var(--gd); font-size: 11px; letter-spacing: 0.3px; }
    .c-meta-right {
      text-align: right;
      color: #FFFFFF;
      font-size: 10.5px;
      line-height: 1.7;
      letter-spacing: 0.2px;
    }

    /* ── BODY PAD ── */
    .pad { padding: 40px 44px 36px; }

    /* ── TITLE ── */
    .c-title-block { text-align: center; margin: 4px 0 36px; }
    .c-title { color: var(--nd); font-size: 18px; font-weight: 700; letter-spacing: 0.8px; line-height: 1.3; }
    .c-subtitle { margin-top: 12px; color: var(--txl); font-style: italic; font-size: 12px; }

    /* ── SECTION HEADERS ── */
    .sec-h {
      margin: 28px 0 14px;
      color: var(--nd);
      font-size: 12.5px;
      font-weight: 600;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--brd);
    }
    .sec-num { font-weight: 700; }

    /* ── PARTIES GRID ── */
    .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 4px; }
    @media (max-width: 680px) { .parties { grid-template-columns: 1fr; } }
    .party-card { border: 1px solid var(--brd); padding: 18px; }
    .party-role { font-size: 9px; font-weight: 600; letter-spacing: 1px; color: var(--nd); text-transform: uppercase; margin-bottom: 12px; }
    .pf { margin-bottom: 6px; }
    .pf-label { color: var(--txl); font-size: 10px; }
    .pf-val { font-size: 11.5px; line-height: 1.5; min-height: 16px; }
    .party-footer { margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--brd); font-size: 11.5px; }
    .party-footer strong { color: var(--nd); }

    /* ── CLAUSE LIST ── */
    ol.clause { padding-left: 22px; font-size: 12.5px; line-height: 1.65; color: var(--tx); }
    ol.clause > li { margin-bottom: 9px; orphans: 3; widows: 3; }
    ol.clause > li:last-child { margin-bottom: 0; }
    ol.sub { margin: 7px 0 3px; padding-left: 20px; list-style-type: lower-latin; }
    ol.sub > li { margin-bottom: 4px; line-height: 1.6; font-size: 12px; }

    /* ── SCOPE ITEMS ── */
    .scope-items { margin: 9px 0 4px; display: flex; flex-direction: column; gap: 5px; }
    .scope-item { display: flex; gap: 8px; font-size: 12.5px; }
    .scope-bullet { color: var(--gd); font-weight: 700; flex-shrink: 0; }

    /* ── PAYMENT TABLE ── */
    .pay-table { width: 100%; border-collapse: collapse; margin: 10px 0 3px; font-size: 12px; }
    .pay-table thead th {
      text-align: left;
      background: #F8FAFC;
      color: var(--nd);
      font-weight: 600;
      font-size: 9.5px;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      padding: 8px 11px;
      border: 1px solid var(--brd);
    }
    .pay-table tbody td { padding: 9px 11px; border: 1px solid var(--brd); }

    /* ── SIGNATURES ── */
    .sig-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 28px;
      margin-top: 44px;
      padding-top: 26px;
      border-top: 1px solid var(--brd);
    }
    @media (max-width: 680px) { .sig-row { grid-template-columns: 1fr; } }
    .sig-col { text-align: center; }
    .sig-role { font-size: 9px; font-weight: 600; letter-spacing: 1px; color: var(--nd); text-transform: uppercase; margin-bottom: 48px; }
    .sig-line { width: 200px; max-width: 100%; margin: 0 auto; border-bottom: 1px solid var(--tx); }
    .sig-name { margin-top: 9px; font-size: 11px; color: var(--tx); min-height: 15px; }
    .sig-date { margin-top: 3px; font-size: 10px; color: var(--txl); }

    /* ── FOOTER BAR ── */
    .c-footer { background: #F8FAFC; border-top: 1px solid var(--brd); padding: 12px 44px; text-align: center; }
    .c-footer-line { font-size: 10.5px; color: var(--txl); line-height: 1.7; }
    .c-footer-num { margin-top: 3px; font-size: 9.5px; color: #94A3B8; }

    ${editorStyles}
    `
}

// ── Section renderers ─────────────────────────────────────────────────────────

function sectionHeader(num: number, title: string): string {
    return `<div class="sec-h"><span class="sec-num">§ ${num}</span>&nbsp;&nbsp;${esc(title)}</div>`
}

function renderParties(blocks: ContractServicesBlocks, secNum: number, editorMode: boolean, activeSection: string | null): string {
    const s = blocks.parties
    const attr = sectionAttr('parties', !s.enabled, activeSection === 'parties', editorMode)
    const c = s.contractor
    const cl = s.client

    function partyCard(role: string, data: typeof c, alias: string): string {
        return `<div class="party-card">
        <div class="party-role">${esc(role)}</div>
        <div class="pf"><div class="pf-label">Imię i nazwisko / Nazwa firmy</div><div class="pf-val">${blank(data.firmName, 'PEŁNA NAZWA')}</div></div>
        <div class="pf"><div class="pf-label">Adres</div><div class="pf-val">${blank(data.address, 'ULICA, KOD, MIASTO')}</div></div>
        <div class="pf"><div class="pf-label">NIP (jeśli dotyczy)</div><div class="pf-val">${blank(data.nip, 'NIP')}</div></div>
        <div class="pf"><div class="pf-label">Email</div><div class="pf-val">${blank(data.email, 'EMAIL')}</div></div>
        <div class="pf"><div class="pf-label">Telefon</div><div class="pf-val">${blank(data.phone, 'TELEFON')}</div></div>
        ${data.representative ? `<div class="pf"><div class="pf-label">Reprezentowany przez</div><div class="pf-val">${esc(data.representative)}</div></div>` : ''}
        <div class="party-footer">zwany dalej <strong>${esc(alias)}</strong></div>
      </div>`
    }

    return `<div${attr}>
    ${sectionHeader(secNum, s.sectionTitle)}
    <div class="parties">
      ${partyCard(s.contractorRole, c, s.contractorRole)}
      ${partyCard(s.clientRole, cl, s.clientRole)}
    </div>
  </div>`
}

function renderSubject(blocks: ContractServicesBlocks, secNum: number, editorMode: boolean, activeSection: string | null): string {
    const s = blocks.subject
    const attr = sectionAttr('subject', !s.enabled, activeSection === 'subject', editorMode)
    const graphicPhrase = s.graphicBy === 'client'
        ? 'dostarczony przez Zamawiającego'
        : 'wykonany przez Wykonawcę'

    return `<div${attr}>
    ${sectionHeader(secNum, s.sectionTitle)}
    <ol class="clause">
      <li>Wykonawca zobowiązuje się do wykonania strony internetowej zgodnie z zakresem określonym w § 3 niniejszej umowy.</li>
      <li>Strona internetowa zostanie wykonana dla domeny: ${blank(s.domain, 'ADRES DOMENY')}</li>
      <li>Technologia realizacji: ${blank(s.technology, 'np. WordPress / Next.js / inna')}</li>
      <li>Projekt graficzny strony zostanie ${graphicPhrase} przed rozpoczęciem prac.</li>
    </ol>
  </div>`
}

function renderScope(blocks: ContractServicesBlocks, secNum: number, editorMode: boolean, activeSection: string | null): string {
    const s = blocks.scope
    const attr = sectionAttr('scope', !s.enabled, activeSection === 'scope', editorMode)

    const itemsHtml = s.items.map((item, idx) =>
        `<div class="scope-item"><span class="scope-bullet">${idx + 1}.</span><span>${esc(item.text)}</span></div>`
    ).join('\n          ')

    return `<div${attr}>
    ${sectionHeader(secNum, s.sectionTitle)}
    <ol class="clause">
      <li>W ramach niniejszej umowy Wykonawca zrealizuje następujące prace:
        <div class="scope-items">
          ${itemsHtml}
        </div>
      </li>
      <li>Zakres prac nie obejmuje: ${blank(s.exclusions, 'np. tworzenie treści, zdjęcia, SEO')}</li>
      <li>Wszelkie prace wykraczające poza zakres określony w ust. 1 wymagają pisemnego aneksu i odrębnej wyceny.</li>
    </ol>
  </div>`
}

function renderObligations(blocks: ContractServicesBlocks, secNum: number, editorMode: boolean, activeSection: string | null): string {
    const s = blocks.obligations
    const attr = sectionAttr('obligations', !s.enabled, activeSection === 'obligations', editorMode)

    const materialsItems = s.additionalItems.map(item => `<li>${esc(item)}</li>`).join('\n          ')

    return `<div${attr}>
    ${sectionHeader(secNum, s.sectionTitle)}
    <ol class="clause">
      <li>Zamawiający zobowiązuje się dostarczyć Wykonawcy następujące materiały${s.materialsDeadline ? ` w terminie do <strong>${esc(s.materialsDeadline)}</strong>` : ''}:
        <ol class="sub">
          ${materialsItems}
        </ol>
      </li>
      <li>Niedostarczenie materiałów w terminie może skutkować przesunięciem terminu realizacji proporcjonalnie do czasu opóźnienia.</li>
      <li>Zamawiający zobowiązuje się do udzielania odpowiedzi na pytania Wykonawcy w terminie <strong>${esc(s.responseBusinessDays)}</strong> dni roboczych.</li>
      <li>Zamawiający zobowiązuje się do terminowego zatwierdzania kolejnych etapów projektu.</li>
    </ol>
  </div>`
}

function renderTimeline(blocks: ContractServicesBlocks, secNum: number, editorMode: boolean, activeSection: string | null): string {
    const s = blocks.timeline
    const attr = sectionAttr('timeline', !s.enabled, activeSection === 'timeline', editorMode)

    return `<div${attr}>
    ${sectionHeader(secNum, s.sectionTitle)}
    <ol class="clause">
      <li>Wykonawca zobowiązuje się do wykonania przedmiotu umowy w terminie do: <strong>${blank(s.endDate, 'DATA ZAKOŃCZENIA')}</strong></li>
      <li>Termin rozpoczęcia prac: ${s.startDate ? `<strong>${esc(s.startDate)}</strong> lub po` : 'w ciągu'} <strong>${esc(s.startBusinessDays)}</strong> dni roboczych od daty podpisania umowy i zaksięgowania zaliczki.</li>
      <li>Termin realizacji może ulec zmianie w przypadku:
        <ol class="sub">
          <li>niedostarczenia materiałów przez Zamawiającego w terminie;</li>
          <li>zgłoszenia zmian wykraczających poza zakres umowy;</li>
          <li>działania siły wyższej.</li>
        </ol>
      </li>
      <li>O każdej zmianie terminu Wykonawca poinformuje Zamawiającego niezwłocznie.</li>
    </ol>
  </div>`
}

function renderPayment(blocks: ContractServicesBlocks, secNum: number, editorMode: boolean, activeSection: string | null): string {
    const s = blocks.payment
    const attr = sectionAttr('payment', !s.enabled, activeSection === 'payment', editorMode)

    const rowsHtml = s.rows.map(row => `<tr>
              <td>${esc(row.label)}</td>
              <td>${esc(row.amount)}</td>
              <td>${esc(row.condition)}</td>
            </tr>`).join('\n            ')

    const vatLabel = s.vatRate === '0' ? 'zwolniony' : `+ VAT ${esc(s.vatRate)}%`

    return `<div${attr}>
    ${sectionHeader(secNum, s.sectionTitle)}
    <ol class="clause">
      <li>Strony ustalają wynagrodzenie w wysokości: <strong>${blank(s.netAmount, 'KWOTA')} zł netto</strong> ${vatLabel}.</li>
      <li>Wynagrodzenie płatne będzie w następujący sposób:
        <table class="pay-table">
          <thead>
            <tr>
              <th>Płatność</th>
              <th>Kwota</th>
              <th>Termin / Warunek</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </li>
      <li>Płatności dokonywane są przelewem na rachunek bankowy Wykonawcy: ${blank(s.bankAccount, 'NUMER KONTA')}</li>
      <li>Termin płatności każdej faktury wynosi <strong>${esc(s.invoiceDays)}</strong> dni od daty wystawienia.</li>
      <li>W przypadku opóźnienia w płatnościach Wykonawca ma prawo wstrzymać prace do czasu uregulowania zaległości.</li>
      <li>Uruchomienie strony na docelowej domenie nastąpi po zaksięgowaniu pełnego wynagrodzenia.</li>
    </ol>
  </div>`
}

function renderRevisions(blocks: ContractServicesBlocks, secNum: number, editorMode: boolean, activeSection: string | null): string {
    const s = blocks.revisions
    const attr = sectionAttr('revisions', !s.enabled, activeSection === 'revisions', editorMode)

    return `<div${attr}>
    ${sectionHeader(secNum, s.sectionTitle)}
    <ol class="clause">
      <li>W ramach wynagrodzenia Zamawiającemu przysługują <strong>${esc(s.graphicRounds)}</strong> rundy poprawek do projektu graficznego oraz <strong>${esc(s.siteRounds)}</strong> rundy poprawek do gotowej strony.</li>
      <li>Przez rundę poprawek rozumie się zestaw uwag zgłoszonych w jednej wiadomości email lub podczas jednego spotkania.</li>
      <li>Każda dodatkowa runda poprawek poza limitem wyceniana jest w wysokości ${blank(s.hourlyRate, 'KWOTA')} zł netto za godzinę pracy.</li>
      <li>Zmiany merytoryczne (dodanie podstron, zmiana funkcjonalności) wymagają aneksu i mogą wpłynąć na termin i wynagrodzenie.</li>
    </ol>
  </div>`
}

function renderAcceptance(blocks: ContractServicesBlocks, secNum: number, editorMode: boolean, activeSection: string | null): string {
    const s = blocks.acceptance
    const attr = sectionAttr('acceptance', !s.enabled, activeSection === 'acceptance', editorMode)

    const delivItems = s.deliverables.map(d => `<li>${esc(d)};</li>`).join('\n          ')

    return `<div${attr}>
    ${sectionHeader(secNum, s.sectionTitle)}
    <ol class="clause">
      <li>Po wykonaniu przedmiotu umowy Wykonawca przekaże Zamawiającemu dostęp do strony w środowisku testowym w celu weryfikacji.</li>
      <li>Zamawiający zobowiązuje się do weryfikacji i zgłoszenia ewentualnych uwag w terminie <strong>${esc(s.reviewBusinessDays)}</strong> dni roboczych od przekazania dostępu.</li>
      <li>Brak zgłoszenia uwag w terminie oznacza akceptację strony i upoważnia Wykonawcę do wystawienia faktury końcowej.</li>
      <li>Po odbiorze i zaksięgowaniu płatności końcowej Wykonawca przekaże Zamawiającemu:
        <ol class="sub">
          ${delivItems}
        </ol>
      </li>
    </ol>
  </div>`
}

function renderCopyright(blocks: ContractServicesBlocks, secNum: number, editorMode: boolean, activeSection: string | null): string {
    const s = blocks.copyright
    const attr = sectionAttr('copyright', !s.enabled, activeSection === 'copyright', editorMode)
    const itemsHtml = s.items.map(item => `<li>${esc(item)}</li>`).join('\n      ')

    return `<div${attr}>
    ${sectionHeader(secNum, s.sectionTitle)}
    <ol class="clause">
      ${itemsHtml}
    </ol>
  </div>`
}

function renderConfidentiality(blocks: ContractServicesBlocks, secNum: number, editorMode: boolean, activeSection: string | null): string {
    const s = blocks.confidentiality
    const attr = sectionAttr('confidentiality', !s.enabled, activeSection === 'confidentiality', editorMode)

    return `<div${attr}>
    ${sectionHeader(secNum, s.sectionTitle)}
    <ol class="clause">
      <li>Strony zobowiązują się do zachowania w tajemnicy wszelkich informacji uzyskanych w związku z realizacją niniejszej umowy.</li>
      <li>Obowiązek poufności obowiązuje przez czas trwania umowy oraz przez <strong>${esc(s.years)}</strong> lata po jej zakończeniu.</li>
      <li>Obowiązek poufności nie dotyczy informacji powszechnie dostępnych ani tych, których ujawnienie wymagane jest przez przepisy prawa.</li>
    </ol>
  </div>`
}

function renderLiability(blocks: ContractServicesBlocks, secNum: number, editorMode: boolean, activeSection: string | null): string {
    const s = blocks.liability
    const attr = sectionAttr('liability', !s.enabled, activeSection === 'liability', editorMode)
    const itemsHtml = s.items.map(item => `<li>${esc(item)}</li>`).join('\n      ')

    return `<div${attr}>
    ${sectionHeader(secNum, s.sectionTitle)}
    <ol class="clause">
      ${itemsHtml}
    </ol>
  </div>`
}

function renderWarranty(blocks: ContractServicesBlocks, secNum: number, editorMode: boolean, activeSection: string | null): string {
    const s = blocks.warranty
    const attr = sectionAttr('warranty', !s.enabled, activeSection === 'warranty', editorMode)

    return `<div${attr}>
    ${sectionHeader(secNum, s.sectionTitle)}
    <ol class="clause">
      <li>Wykonawca udziela gwarancji na wykonaną stronę internetową na okres <strong>${esc(s.months)} miesięcy</strong> od daty odbioru.</li>
      <li>Gwarancja obejmuje usunięcie błędów i usterek wynikających z wykonania strony przez Wykonawcę.</li>
      <li>Gwarancja nie obejmuje:
        <ol class="sub">
          <li>awarii wynikających z działań Zamawiającego lub osób trzecich;</li>
          <li>problemów wynikających z nieaktualnego oprogramowania hostingu;</li>
          <li>zmian wprowadzonych przez Zamawiającego po odbiorze.</li>
        </ol>
      </li>
      <li>Zgłoszenia gwarancyjne należy kierować na adres: ${blank(s.contactEmail, 'EMAIL')}</li>
      <li>Wykonawca zobowiązuje się do usunięcia usterek w terminie <strong>${esc(s.fixBusinessDays)}</strong> dni roboczych od zgłoszenia.</li>
    </ol>
  </div>`
}

function renderTermination(blocks: ContractServicesBlocks, secNum: number, editorMode: boolean, activeSection: string | null): string {
    const s = blocks.termination
    const attr = sectionAttr('termination', !s.enabled, activeSection === 'termination', editorMode)

    return `<div${attr}>
    ${sectionHeader(secNum, s.sectionTitle)}
    <ol class="clause">
      <li>Każda ze Stron ma prawo rozwiązać umowę za pisemnym wypowiedzeniem z zachowaniem <strong>${esc(s.noticeDays)}-dniowego</strong> okresu wypowiedzenia.</li>
      <li>W przypadku rozwiązania umowy przez Zamawiającego z przyczyn niezależnych od Wykonawcy, Zamawiający zobowiązany jest do zapłaty wynagrodzenia za prace już wykonane.</li>
      <li>W przypadku rozwiązania umowy przez Wykonawcę z jego winy, Wykonawca zwróci Zamawiającemu zaliczkę proporcjonalnie do niewykonanych prac.</li>
      <li>Wykonawca ma prawo do natychmiastowego rozwiązania umowy w przypadku:
        <ol class="sub">
          <li>opóźnienia w płatności przekraczającego <strong>${esc(s.paymentDelayDays)}</strong> dni;</li>
          <li>braku współpracy ze strony Zamawiającego przez okres dłuższy niż <strong>${esc(s.inactivityDays)}</strong> dni.</li>
        </ol>
      </li>
    </ol>
  </div>`
}

function renderGeneral(blocks: ContractServicesBlocks, secNum: number, editorMode: boolean, activeSection: string | null): string {
    const s = blocks.general
    const attr = sectionAttr('general', !s.enabled, activeSection === 'general', editorMode)
    const itemsHtml = s.items.map(item => `<li>${esc(item)}</li>`).join('\n      ')

    return `<div${attr}>
    ${sectionHeader(secNum, s.sectionTitle)}
    <ol class="clause">
      ${itemsHtml}
    </ol>
  </div>`
}

function renderSignatures(blocks: ContractServicesBlocks, editorMode: boolean, activeSection: string | null): string {
    const s = blocks.signatures
    const attr = sectionAttr('signatures', false, activeSection === 'signatures', editorMode)

    function sigCol(title: string, name: string, date: string): string {
        return `<div class="sig-col">
      <div class="sig-role">${esc(title)}</div>
      <div class="sig-line"></div>
      <div class="sig-name">${name ? esc(name) : ''}</div>
      <div class="sig-date">data: ${date ? esc(date) : ''}</div>
    </div>`
    }

    return `<div class="sig-row"${attr}>
    ${sigCol(s.contractorTitle, s.contractorName, s.contractorDate)}
    ${sigCol(s.clientTitle, s.clientName, s.clientDate)}
  </div>`
}

function renderSection(
    key: ContractServicesSectionKey,
    blocks: ContractServicesBlocks,
    secNum: number,
    editorMode: boolean,
    activeSection: string | null,
): string {
    switch (key) {
        case 'parties': return renderParties(blocks, secNum, editorMode, activeSection)
        case 'subject': return renderSubject(blocks, secNum, editorMode, activeSection)
        case 'scope': return renderScope(blocks, secNum, editorMode, activeSection)
        case 'obligations': return renderObligations(blocks, secNum, editorMode, activeSection)
        case 'timeline': return renderTimeline(blocks, secNum, editorMode, activeSection)
        case 'payment': return renderPayment(blocks, secNum, editorMode, activeSection)
        case 'revisions': return renderRevisions(blocks, secNum, editorMode, activeSection)
        case 'acceptance': return renderAcceptance(blocks, secNum, editorMode, activeSection)
        case 'copyright': return renderCopyright(blocks, secNum, editorMode, activeSection)
        case 'confidentiality': return renderConfidentiality(blocks, secNum, editorMode, activeSection)
        case 'liability': return renderLiability(blocks, secNum, editorMode, activeSection)
        case 'warranty': return renderWarranty(blocks, secNum, editorMode, activeSection)
        case 'termination': return renderTermination(blocks, secNum, editorMode, activeSection)
        case 'general': return renderGeneral(blocks, secNum, editorMode, activeSection)
        default: return ''
    }
}

// ── Editor click script ───────────────────────────────────────────────────────

function buildEditorScript(): string {
    return `<script>
(function () {
  var active = null;
  document.addEventListener('click', function (e) {
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

export interface ContractServicesHtmlOptions {
    editorMode?: boolean
    zoom?: number
    activeSection?: string | null
}

export function buildContractServicesHtml(
    blocksInput: Partial<ContractServicesBlocks> | null | undefined,
    options: ContractServicesHtmlOptions = {},
): string {
    const blocks = mergeServicesWithDefaults(blocksInput)
    const editorMode = options.editorMode ?? false
    const zoom = options.zoom ?? 1.0
    const activeSection = options.activeSection ?? null

    let secNum = 0
    const sectionsHtml = blocks.sections
        .map((key) => {
            const sectionBlock = blocks[key] as { enabled?: boolean } | undefined
            const blockEnabled = sectionBlock?.enabled !== false
            if (!blockEnabled && !editorMode) return ''
            secNum++
            return renderSection(key, blocks, secNum, editorMode, activeSection)
        })
        .join('\n')

    const h = blocks.header
    const logoUrl = h.logoDarkUrl || h.logoUrl
    const logo = logoUrl
        ? `<img class="c-logo-img" src="${esc(logoUrl)}" alt="Logo firmy" />`
        : '<div class="c-logo-label">LOGO</div>'
    const contractorName = blocks.parties.contractor.firmName || blocks.parties.contractor.representative
    const contractorEmail = blocks.parties.contractor.email
    const contractorPhone = blocks.parties.contractor.phone

    const footerParts = [contractorName, contractorEmail, contractorPhone, h.websiteUrl]
        .filter(Boolean)
        .map(esc)
        .join(' · ')

    const headerAttr = editorMode
        ? ` data-sq-section="header" class="c-header${activeSection === 'header' ? ' sq-active' : ''}"`
        : ' class="c-header"'

    return buildHtmlDocument({
        title: esc(h.contractTitle || 'Umowa o wykonanie strony internetowej'),
        css: buildCss(editorMode, zoom),
        body: `${editorMode ? '<div class="sq-edit-hint">Kliknij sekcję aby edytować</div>' : ''}

<div class="sheet">

  <div${headerAttr}>
    <div class="c-logo-box">
      ${logo}
      ${h.websiteUrl ? `<span class="c-url">${esc(h.websiteUrl)}</span>` : '<span class="c-url"><span style="color:rgba(201,168,76,0.5)">www.twoja-strona.pl</span></span>'}
    </div>
    <div class="c-meta-right">
      <div>Nr umowy: ${h.contractNumber ? esc(h.contractNumber) : '<span style="opacity:0.5">NR / ROK</span>'}</div>
      <div>Data: ${h.date ? esc(h.date) : '<span style="opacity:0.5">DD.MM.RRRR</span>'}</div>
    </div>
  </div>

  <div class="pad">

    <div class="c-title-block">
      <h1 class="c-title">${esc(h.contractTitle || 'UMOWA O WYKONANIE STRONY INTERNETOWEJ')}</h1>
      <p class="c-subtitle">zawarta dnia ${h.date ? esc(h.date) : '…'} ${h.place ? `w ${esc(h.place)}` : ''}</p>
    </div>

    ${sectionsHtml}

    ${renderSignatures(blocks, editorMode, activeSection)}

  </div>

  <div class="c-footer">
    <div class="c-footer-line">${footerParts || '…'}</div>
    ${h.contractNumber ? `<div class="c-footer-num">Nr umowy: ${esc(h.contractNumber)}</div>` : ''}
  </div>

</div>

${editorMode ? buildEditorScript() : ''}`,
    })
}

export function buildContractServicesHtmlFromSaved(
    savedBlocks: unknown,
    options: ContractServicesHtmlOptions = {},
): string {
    return buildContractServicesHtml(
        savedBlocks as Partial<ContractServicesBlocks> | null | undefined,
        options,
    )
}

// src/lib/pdf/contract-dedicated-html.ts
// HTML generator for the "System dedykowany" contract template.
// Navy #1B3A5C / Gold #C9A84C design — same as services template.
import { buildHtmlDocument, buildContractPageRule, CONTRACT_ORPHANS_CSS } from './html-shell'
import { withPageBreakAfter } from './section-layout'
import {
    type ContractDedicatedBlocks,
    type DedicatedSectionKey,
    mergeDedicatedWithDefaults,
} from './contract-dedicated-blocks'

export interface ContractDedicatedHtmlOptions {
    editorMode?: boolean
    zoom?: number
    activeSection?: string | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function esc(s: string | undefined | null): string {
    return (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function blank(val: string | undefined | null, label: string): string {
    const v = (val ?? '').trim()
    return v
        ? `<span>${esc(v)}</span>`
        : `<span style="color:inherit;font-weight:500;">${esc(label)}</span>`
}

function sectionAttr(key: string, editorMode: boolean, activeSection?: string | null): string {
    if (!editorMode) return ''
    const isActive = activeSection === key
    return ` data-sq-section="${key}" style="cursor:pointer;border-radius:4px;transition:outline 0.1s;${isActive ? 'outline:2px solid #C9A84C;outline-offset:2px;' : ''}"`
}

// ── CSS ───────────────────────────────────────────────────────────────────────

function buildCss(editorMode: boolean, zoom: number): string {
    return `*{box-sizing:border-box;}
html,body{margin:0;padding:0;}
body{background:#EEF1F5;font-family:'Source Sans 3',system-ui,sans-serif;color:#0F172A;font-size:${zoom < 0.8 ? 13 : 13.5}px;line-height:1.65;-webkit-font-smoothing:antialiased;}
.doc{max-width:800px;margin:0 auto;background:#fff;box-shadow:0 1px 8px rgba(15,23,42,0.12);}
.bar-inner{max-width:800px;margin:0 auto;padding:18px 48px;}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
table{border-collapse:collapse;width:100%;}
th,td{text-align:left;}
p{margin:6px 0;}
@media(max-width:768px){.two-col{grid-template-columns:1fr!important;}.bar-inner,.content,.titlebar,.footerbar{padding-left:20px!important;padding-right:20px!important;}}
${buildContractPageRule()}
${CONTRACT_ORPHANS_CSS}
.content>div{break-inside:auto;page-break-inside:auto;}
h2{break-after:avoid;page-break-after:avoid;}
@media print{body{font-size:11pt;background:#fff;}.doc{box-shadow:none;}.page-break{page-break-before:always;}}
${editorMode ? `[data-sq-section]:hover{outline:2px solid #C9A84C;outline-offset:2px;}` : ''}`
}

function buildEditorScript(): string {
    return `<script>
(function(){
  document.querySelectorAll('[data-sq-section]').forEach(function(el){
    el.addEventListener('click',function(e){
      e.stopPropagation();
      var key=el.getAttribute('data-sq-section');
      window.parent.postMessage({type:'sq:editSection',sectionKey:key},'*');
    });
  });
})();
</script>`
}

// ── Section renderers ─────────────────────────────────────────────────────────

function renderHeader(b: ContractDedicatedBlocks): string {
    const logoUrl = b.header.logoDarkUrl || b.header.logoUrl
    const logo = logoUrl
        ? `<img src="${esc(logoUrl)}" alt="Logo firmy" style="display:block;max-width:120px;max-height:48px;object-fit:contain;object-position:left center;" />`
        : `<div style="width:68px;height:40px;border:1px solid rgba(201,168,76,.6);display:flex;align-items:center;justify-content:center;color:#C9A84C;font-size:10px;font-weight:600;letter-spacing:2px;">LOGO</div>`
    return `
<div style="width:100%;background:#1B3A5C;">
  <div class="bar-inner" style="display:flex;justify-content:space-between;align-items:center;gap:16px;">
    <div style="display:flex;align-items:center;gap:14px;">
      ${logo}
      <span style="color:#C9A84C;font-size:13px;font-weight:500;">${esc(b.header.website || 'www.twoja-strona.pl')}</span>
    </div>
    <div style="text-align:right;color:#fff;font-size:11px;line-height:1.8;">
      <div>Nr umowy: <span style="color:#C9A84C;font-weight:600;">${esc(b.header.contractNumber)}</span></div>
      <div>Data: ${blank(b.header.date, 'DD.MM.RRRR')}</div>
    </div>
  </div>
</div>`
}

function renderTitle(b: ContractDedicatedBlocks): string {
    return `
<div class="titlebar" style="padding:34px 48px 0;">
  <h1 style="text-align:center;color:#1B3A5C;font-size:22px;font-weight:700;margin:0;letter-spacing:.3px;line-height:1.35;">UMOWA O WYKONANIE DEDYKOWANEGO SYSTEMU INFORMATYCZNEGO</h1>
  <p style="text-align:center;color:#475569;font-style:italic;font-size:13px;margin:12px 0 0;">zawarta dnia ${blank(b.header.date, 'DD.MM.RRRR')} w ${blank(b.header.city, 'MIEJSCOWOŚĆ')}</p>
</div>`
}

function renderParties(b: ContractDedicatedBlocks, editorMode: boolean, activeSection?: string | null): string {
    const attr = sectionAttr('parties', editorMode, activeSection)
    const { contractor: c, client: cl } = b.parties
    const row = (label: string, val: string, ph: string) =>
        `<div style="margin-bottom:7px;"><span style="color:#475569;">${label}:</span> ${blank(val, ph)}</div>`
    return `
<div${attr}>
  <h2 style="color:#1B3A5C;font-size:14px;font-weight:700;margin:28px 0 14px;padding-bottom:6px;border-bottom:1px solid #E2E8F0;letter-spacing:.3px;">§ 1 — STRONY UMOWY</h2>
  <div class="two-col">
    <div style="border:1px solid #E2E8F0;padding:20px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:1px;color:#1B3A5C;text-transform:uppercase;margin-bottom:12px;">Wykonawca</div>
      ${row('Imię i nazwisko / Firma', c.name, 'NAZWA')}
      ${row('Adres', c.address, 'ADRES')}
      ${row('NIP', c.nip, 'NIP')}
      ${row('Email', c.email, 'EMAIL')}
      <div style="margin-top:10px;">Zwany dalej: <strong>Wykonawcą</strong></div>
    </div>
    <div style="border:1px solid #E2E8F0;padding:20px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:1px;color:#1B3A5C;text-transform:uppercase;margin-bottom:12px;">Zamawiający</div>
      ${row('Imię i nazwisko / Firma', cl.name, 'NAZWA')}
      ${row('Adres', cl.address, 'ADRES')}
      ${row('NIP', cl.nip, 'NIP')}
      ${row('Email', cl.email, 'EMAIL')}
      <div style="margin-top:10px;">Zwany dalej: <strong>Zamawiającym</strong></div>
    </div>
  </div>
</div>`
}

function renderSubject(b: ContractDedicatedBlocks, editorMode: boolean, activeSection?: string | null): string {
    const attr = sectionAttr('subject', editorMode, activeSection)
    const s = b.subject
    return `
<div${attr}>
  <h2 style="color:#1B3A5C;font-size:14px;font-weight:700;margin:28px 0 12px;padding-bottom:6px;border-bottom:1px solid #E2E8F0;letter-spacing:.3px;">§ 2 — PRZEDMIOT UMOWY</h2>
  <ol style="margin:0;padding-left:20px;font-size:13px;line-height:1.75;color:#0F172A;">
    <li>Wykonawca zobowiązuje się do zaprojektowania i wykonania dedykowanego systemu informatycznego zgodnie z zakresem określonym w § 3 oraz Specyfikacją Techniczną stanowiącą Załącznik nr 1.</li>
    <li>Nazwa systemu: ${blank(s.systemName, 'NAZWA SYSTEMU')}</li>
    <li>Cel systemu: ${blank(s.goal, 'np. system zarządzania zamówieniami / platforma B2B')}</li>
    <li>Technologia realizacji: ${blank(s.technology, 'np. React + Node.js / Laravel + Vue')}</li>
    <li>System będzie dostępny jako: ${blank(s.accessType, 'aplikacja webowa / API / inne')}</li>
    <li>Środowiska: Wykonawca dostarczy system w środowiskach: testowym (staging) oraz produkcyjnym.</li>
  </ol>
</div>`
}

function renderPhases(b: ContractDedicatedBlocks, editorMode: boolean, activeSection?: string | null): string {
    const attr = sectionAttr('phases', editorMode, activeSection)
    const phaseRows = b.phases.phases.map((p, i) => `
    <tr style="border-bottom:1px solid #E2E8F0;">
      <td style="padding:9px 10px;font-weight:600;">${i + 1}</td>
      <td style="padding:9px 10px;">${esc(p.name)}</td>
      <td style="padding:9px 10px;">${esc(p.description) || '<span style="color:#94A3B8;">—</span>'}</td>
      <td style="padding:9px 10px;">${blank(p.date, 'DATA')}</td>
    </tr>`).join('')
    const exclusionItems = b.phases.exclusions.map(e => `<li>${esc(e)}</li>`).join('')
    return `
<div${attr}>
  <h2 style="color:#1B3A5C;font-size:14px;font-weight:700;margin:28px 0 12px;padding-bottom:6px;border-bottom:1px solid #E2E8F0;letter-spacing:.3px;">§ 3 — ZAKRES PRAC I ETAPY</h2>
  <ol style="margin:0;padding-left:20px;font-size:13px;line-height:1.75;color:#0F172A;"><li>Realizacja przedmiotu umowy podzielona jest na następujące etapy:</li></ol>
  <div style="overflow-x:auto;margin:12px 0 4px;">
    <table style="font-size:12px;">
      <thead><tr style="background:#1B3A5C;color:#fff;">
        <th style="padding:9px 10px;width:48px;">Etap</th>
        <th style="padding:9px 10px;width:160px;">Nazwa</th>
        <th style="padding:9px 10px;">Opis / Deliverable</th>
        <th style="padding:9px 10px;width:100px;">Termin</th>
      </tr></thead>
      <tbody>${phaseRows}</tbody>
    </table>
  </div>
  <ol start="2" style="margin:12px 0 0;padding-left:20px;font-size:13px;line-height:1.75;color:#0F172A;">
    <li>Szczegółowy opis funkcjonalności każdego etapu zawarty jest w Specyfikacji Technicznej (Załącznik nr 1).</li>
    <li>Zakres prac nie obejmuje: <ol type="a" style="margin:6px 0 0;padding-left:20px;">${exclusionItems}</ol></li>
    <li>Wszelkie prace wykraczające poza zakres Specyfikacji Technicznej wymagają pisemnego aneksu do umowy i odrębnej wyceny.</li>
  </ol>
</div>`
}

function renderSpec(b: ContractDedicatedBlocks, editorMode: boolean, activeSection?: string | null): string {
    const attr = sectionAttr('spec', editorMode, activeSection)
    return `
<div${attr}>
  <h2 style="color:#1B3A5C;font-size:14px;font-weight:700;margin:28px 0 12px;padding-bottom:6px;border-bottom:1px solid #E2E8F0;letter-spacing:.3px;">§ 4 — SPECYFIKACJA TECHNICZNA</h2>
  <ol style="margin:0;padding-left:20px;font-size:13px;line-height:1.75;color:#0F172A;">
    <li>Specyfikacja Techniczna zostanie przygotowana przez Wykonawcę w terminie określonym w § 3 ust. 1 (Etap 1) i przedłożona Zamawiającemu do zatwierdzenia.</li>
    <li>Zamawiający zobowiązuje się do weryfikacji i zatwierdzenia Specyfikacji Technicznej lub zgłoszenia uwag w terminie ${blank(b.spec.approvalDays, 'X')} dni roboczych od jej otrzymania.</li>
    <li>Zatwierdzona przez obie Strony Specyfikacja Techniczna stanowi Załącznik nr 1 do niniejszej umowy i jest jej integralną częścią.</li>
    <li>Zmiany w Specyfikacji Technicznej po jej zatwierdzeniu wymagają pisemnego aneksu do umowy i mogą wpłynąć na termin realizacji oraz wynagrodzenie.</li>
    <li>Brak zatwierdzenia Specyfikacji Technicznej lub zgłoszenia uwag w terminie, o którym mowa w ust. 2, oznacza jej akceptację.</li>
  </ol>
</div>`
}

function renderObligations(b: ContractDedicatedBlocks, editorMode: boolean, activeSection?: string | null): string {
    const attr = sectionAttr('obligations', editorMode, activeSection)
    return `
<div${attr}>
  <h2 style="color:#1B3A5C;font-size:14px;font-weight:700;margin:28px 0 12px;padding-bottom:6px;border-bottom:1px solid #E2E8F0;letter-spacing:.3px;">§ 5 — OBOWIĄZKI ZAMAWIAJĄCEGO</h2>
  <ol style="margin:0;padding-left:20px;font-size:13px;line-height:1.75;color:#0F172A;">
    <li>Zamawiający zobowiązuje się do:
      <ol type="a" style="margin:6px 0 0;padding-left:20px;">
        <li>Aktywnego udziału w procesie zbierania wymagań — dostępności do konsultacji w terminie ${blank(b.obligations.availabilityDays, 'X')} dni roboczych od wezwania</li>
        <li>Dostarczenia niezbędnych materiałów (logotyp, treści, dane) w terminach uzgodnionych z Wykonawcą</li>
        <li>Terminowego zatwierdzania deliverables każdego etapu</li>
        <li>Zapewnienia środowiska serwerowego przed Etapem 6 — zgodnie ze specyfikacją wymagań technicznych</li>
        <li>Wyznaczenia osoby odpowiedzialnej za kontakt z Wykonawcą</li>
        <li>Udzielania odpowiedzi na pytania Wykonawcy w terminie ${blank(b.obligations.responseDays, 'X')} dni roboczych</li>
      </ol>
    </li>
    <li>Niedopełnienie obowiązków określonych w ust. 1 może skutkować przesunięciem terminu realizacji proporcjonalnie do czasu opóźnienia.</li>
  </ol>
</div>`
}

function renderTimeline(b: ContractDedicatedBlocks, editorMode: boolean, activeSection?: string | null): string {
    const attr = sectionAttr('timeline', editorMode, activeSection)
    return `
<div${attr}>
  <h2 style="color:#1B3A5C;font-size:14px;font-weight:700;margin:28px 0 12px;padding-bottom:6px;border-bottom:1px solid #E2E8F0;letter-spacing:.3px;">§ 6 — TERMINY REALIZACJI</h2>
  <ol style="margin:0;padding-left:20px;font-size:13px;line-height:1.75;color:#0F172A;">
    <li>Termin rozpoczęcia prac: ${blank(b.timeline.startDate, 'DATA')} lub w ciągu ${blank(b.timeline.startDays, 'X')} dni od podpisania umowy i zaksięgowania zaliczki.</li>
    <li>Termin zakończenia i odbioru końcowego: ${blank(b.timeline.endDate, 'DATA')}</li>
    <li>Szczegółowe terminy etapów określone są w § 3 ust. 1.</li>
    <li>Termin może ulec zmianie w przypadku: niedopełnienia obowiązków przez Zamawiającego (§ 5), zmian zakresu wymagających aneksu lub działania siły wyższej.</li>
    <li>O każdym przesunięciu terminu Wykonawca poinformuje Zamawiającego niezwłocznie w formie pisemnej.</li>
  </ol>
</div>`
}

function renderPayment(b: ContractDedicatedBlocks, editorMode: boolean, activeSection?: string | null): string {
    const attr = sectionAttr('payment', editorMode, activeSection)
    const rows = b.payment.payments.map(p => `
    <tr style="border-bottom:1px solid #E2E8F0;">
      <td style="padding:9px 10px;font-weight:600;">${esc(p.name)}</td>
      <td style="padding:9px 10px;">${esc(p.condition)}</td>
      <td style="padding:9px 10px;">${blank(p.amount, 'KWOTA')} zł</td>
      <td style="padding:9px 10px;">${blank(p.percent, 'X')}%</td>
    </tr>`).join('')
    return `
<div${attr}>
  <h2 style="color:#1B3A5C;font-size:14px;font-weight:700;margin:28px 0 12px;padding-bottom:6px;border-bottom:1px solid #E2E8F0;letter-spacing:.3px;">§ 7 — WYNAGRODZENIE I PŁATNOŚCI</h2>
  <ol style="margin:0;padding-left:20px;font-size:13px;line-height:1.75;color:#0F172A;">
    <li>Wynagrodzenie za wykonanie przedmiotu umowy wynosi: ${blank(b.payment.totalNet, 'KWOTA')} zł netto (słownie: ${blank(b.payment.totalWords, 'SŁOWNIE')}) + VAT ${blank(b.payment.vatRate, '23% / zwolniony')}.</li>
    <li>Wynagrodzenie płatne jest etapami, po zatwierdzeniu deliverable każdego etapu:</li>
  </ol>
  <div style="overflow-x:auto;margin:12px 0 4px;">
    <table style="font-size:12px;">
      <thead><tr style="background:#1B3A5C;color:#fff;">
        <th style="padding:9px 10px;width:130px;">Płatność</th>
        <th style="padding:9px 10px;">Etap / Warunek</th>
        <th style="padding:9px 10px;width:110px;">Kwota netto</th>
        <th style="padding:9px 10px;width:80px;">%</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
  <ol start="3" style="margin:12px 0 0;padding-left:20px;font-size:13px;line-height:1.75;color:#0F172A;">
    <li>Płatności przelewem na konto: ${blank(b.payment.accountNumber, 'NUMER KONTA')}</li>
    <li>Termin płatności faktury: ${blank(b.payment.paymentDays, 'X')} dni od wystawienia.</li>
    <li>Uruchomienie systemu na środowisku produkcyjnym nastąpi po zaksięgowaniu pełnego wynagrodzenia.</li>
    <li>W przypadku opóźnienia w płatności Wykonawca ma prawo do naliczania odsetek ustawowych i wstrzymania prac.</li>
  </ol>
</div>`
}

function renderScopeCreep(b: ContractDedicatedBlocks, editorMode: boolean, activeSection?: string | null): string {
    const attr = sectionAttr('scopeCreep', editorMode, activeSection)
    return `
<div${attr}>
  <h2 style="color:#1B3A5C;font-size:14px;font-weight:700;margin:28px 0 12px;padding-bottom:6px;border-bottom:1px solid #E2E8F0;letter-spacing:.3px;">§ 8 — ZMIANY ZAKRESU (SCOPE CREEP)</h2>
  <ol style="margin:0;padding-left:20px;font-size:13px;line-height:1.75;color:#0F172A;">
    <li>Wszelkie zmiany zakresu systemu wykraczające poza zatwierdzoną Specyfikację Techniczną wymagają pisemnego aneksu do umowy, podpisanego przez obie Strony.</li>
    <li>Wykonawca wyceni każdą zmianę zakresu w terminie ${blank(b.scopeCreep.evaluationDays, 'X')} dni roboczych od jej zgłoszenia.</li>
    <li>Aneks określa: opis zmiany, wpływ na harmonogram, dodatkowe wynagrodzenie.</li>
    <li>Prace związane ze zmianą zakresu rozpoczną się dopiero po podpisaniu aneksu i — jeśli dotyczy — zaksięgowaniu zaliczki na poczet dodatkowego wynagrodzenia.</li>
    <li>Drobne zmiany nieprzekraczające łącznie ${blank(b.scopeCreep.freeHoursLimit, 'X')} godzin pracy realizowane są bez aneksu, w ramach wynagrodzenia z § 7.</li>
  </ol>
</div>`
}

function renderAcceptance(b: ContractDedicatedBlocks, editorMode: boolean, activeSection?: string | null): string {
    const attr = sectionAttr('acceptance', editorMode, activeSection)
    return `
<div${attr}>
  <h2 style="color:#1B3A5C;font-size:14px;font-weight:700;margin:28px 0 12px;padding-bottom:6px;border-bottom:1px solid #E2E8F0;letter-spacing:.3px;">§ 9 — ODBIORY ETAPOWE I ODBIÓR KOŃCOWY</h2>
  <ol style="margin:0;padding-left:20px;font-size:13px;line-height:1.75;color:#0F172A;">
    <li>Po zakończeniu każdego etapu Wykonawca powiadomi Zamawiającego o gotowości deliverable do odbioru.</li>
    <li>Zamawiający zobowiązuje się do weryfikacji i zgłoszenia uwag w terminie ${blank(b.acceptance.reviewDays, 'X')} dni roboczych od powiadomienia.</li>
    <li>Brak zgłoszenia uwag w terminie oznacza akceptację etapu i upoważnia Wykonawcę do wystawienia faktury za dany etap.</li>
    <li>Odbiór końcowy następuje po uruchomieniu systemu na środowisku stagingowym i potwierdzeniu przez Zamawiającego poprawności działania wszystkich funkcjonalności.</li>
    <li>Po zaksięgowaniu płatności końcowej Wykonawca:
      <ol type="a" style="margin:6px 0 0;padding-left:20px;">
        <li>Uruchomi system na środowisku produkcyjnym</li>
        <li>Przekaże repozytorium Git z pełnym kodem źródłowym</li>
        <li>Przekaże dokumentację techniczną i użytkową</li>
        <li>Przekaże wszystkie dane dostępowe (serwer, baza danych, panel admina)</li>
        <li>Przeprowadzi szkolenie użytkowników — ${blank(b.acceptance.trainingHours, 'X')} godzin</li>
      </ol>
    </li>
  </ol>
</div>`
}

function renderInfrastructure(b: ContractDedicatedBlocks, editorMode: boolean, activeSection?: string | null): string {
    const attr = sectionAttr('infrastructure', editorMode, activeSection)
    return `
<div${attr}>
  <h2 style="color:#1B3A5C;font-size:14px;font-weight:700;margin:28px 0 12px;padding-bottom:6px;border-bottom:1px solid #E2E8F0;letter-spacing:.3px;">§ 10 — INFRASTRUKTURA I ŚRODOWISKA</h2>
  <ol style="margin:0;padding-left:20px;font-size:13px;line-height:1.75;color:#0F172A;">
    <li>Wykonawca zapewni środowisko stagingowe na czas realizacji projektu.</li>
    <li>Środowisko produkcyjne zapewnia ${blank(b.infrastructure.productionProvider, 'Wykonawca / Zamawiający')} zgodnie z wymaganiami technicznymi określonymi w Specyfikacji Technicznej.</li>
    <li>Zamawiający zobowiązuje się do zapewnienia serwera spełniającego wymagania techniczne przed Etapem 6 i przekazania Wykonawcy niezbędnych danych dostępowych.</li>
    <li>Koszty licencji na oprogramowanie zewnętrzne, API i usługi chmurowe po dacie odbioru ponosi Zamawiający.</li>
  </ol>
</div>`
}

function renderGdpr(b: ContractDedicatedBlocks, editorMode: boolean, activeSection?: string | null): string {
    const attr = sectionAttr('gdpr', editorMode, activeSection)
    return `
<div${attr}>
  <h2 style="color:#1B3A5C;font-size:14px;font-weight:700;margin:28px 0 12px;padding-bottom:6px;border-bottom:1px solid #E2E8F0;letter-spacing:.3px;">§ 11 — DANE OSOBOWE I RODO</h2>
  <ol style="margin:0;padding-left:20px;font-size:13px;line-height:1.75;color:#0F172A;">
    <li>Administratorem danych osobowych przetwarzanych w systemie jest Zamawiający.</li>
    <li>Zamawiający odpowiada za wdrożenie odpowiednich środków ochrony danych osobowych zgodnie z RODO.</li>
    <li>Jeżeli Wykonawca będzie miał dostęp do danych osobowych Zamawiającego w trakcie realizacji umowy, Strony zawrą odrębną umowę powierzenia przetwarzania danych osobowych.</li>
    ${b.gdpr.note ? `<li>${esc(b.gdpr.note)}</li>` : ''}
  </ol>
</div>`
}

function renderCopyright(b: ContractDedicatedBlocks, editorMode: boolean, activeSection?: string | null): string {
    const attr = sectionAttr('copyright', editorMode, activeSection)
    return `
<div${attr}>
  <h2 style="color:#1B3A5C;font-size:14px;font-weight:700;margin:28px 0 12px;padding-bottom:6px;border-bottom:1px solid #E2E8F0;letter-spacing:.3px;">§ 12 — PRAWA AUTORSKIE</h2>
  <ol style="margin:0;padding-left:20px;font-size:13px;line-height:1.75;color:#0F172A;">
    <li>Z chwilą zaksięgowania pełnego wynagrodzenia Wykonawca przenosi na Zamawiającego autorskie prawa majątkowe do wykonanego systemu, w tym do kodu źródłowego, projektu graficznego i dokumentacji, na polach eksploatacji: utrwalanie, zwielokrotnianie, modyfikowanie, rozpowszechnianie, publiczne udostępnianie.</li>
    <li>Przeniesienie praw nie obejmuje elementów objętych licencjami osób trzecich (biblioteki open-source, frameworki, komponenty zewnętrzne).</li>
    <li>Do czasu pełnej zapłaty wszelkie prawa do wykonanej pracy pozostają przy Wykonawcy.</li>
    <li>Zamawiający ma prawo do dalszego rozwijania systemu — samodzielnie lub przez osoby trzecie — po jego odbiorze.</li>
    <li>Wykonawca ma prawo umieścić informację o realizacji systemu w swoim portfolio.</li>
  </ol>
</div>`
}

function renderConfidentiality(b: ContractDedicatedBlocks, editorMode: boolean, activeSection?: string | null): string {
    const attr = sectionAttr('confidentiality', editorMode, activeSection)
    return `
<div${attr}>
  <h2 style="color:#1B3A5C;font-size:14px;font-weight:700;margin:28px 0 12px;padding-bottom:6px;border-bottom:1px solid #E2E8F0;letter-spacing:.3px;">§ 13 — POUFNOŚĆ</h2>
  <ol style="margin:0;padding-left:20px;font-size:13px;line-height:1.75;color:#0F172A;">
    <li>Strony zobowiązują się do zachowania poufności wszelkich informacji uzyskanych w trakcie realizacji umowy, w szczególności dotyczących procesów biznesowych, danych klientów i architektury systemu.</li>
    <li>Obowiązek poufności obowiązuje przez czas umowy oraz ${blank(b.confidentiality.years, 'X')} lata po jej zakończeniu.</li>
  </ol>
</div>`
}

function renderWarranty(b: ContractDedicatedBlocks, editorMode: boolean, activeSection?: string | null): string {
    const attr = sectionAttr('warranty', editorMode, activeSection)
    return `
<div${attr}>
  <h2 style="color:#1B3A5C;font-size:14px;font-weight:700;margin:28px 0 12px;padding-bottom:6px;border-bottom:1px solid #E2E8F0;letter-spacing:.3px;">§ 14 — ODPOWIEDZIALNOŚĆ I GWARANCJA</h2>
  <ol style="margin:0;padding-left:20px;font-size:13px;line-height:1.75;color:#0F172A;">
    <li>Wykonawca gwarantuje że system będzie działać zgodnie z zatwierdzoną Specyfikacją Techniczną.</li>
    <li>Wykonawca udziela gwarancji na okres ${blank(b.warranty.months, 'X')} miesięcy od odbioru końcowego.</li>
    <li>Gwarancja obejmuje usunięcie błędów wynikających z prac Wykonawcy w terminie ${blank(b.warranty.fixDays, 'X')} dni roboczych od zgłoszenia.</li>
    <li>Gwarancja nie obejmuje:
      <ol type="a" style="margin:6px 0 0;padding-left:20px;">
        <li>Zmian wprowadzonych przez Zamawiającego lub osoby trzecie po odbiorze</li>
        <li>Awarii infrastruktury serwerowej</li>
        <li>Problemów wynikających z integracji z systemami zewnętrznymi niezależnymi od Wykonawcy</li>
        <li>Nieprawidłowego użytkowania systemu</li>
      </ol>
    </li>
    <li>Łączna odpowiedzialność Wykonawcy ograniczona jest do wysokości wynagrodzenia z § 7.</li>
  </ol>
</div>`
}

function renderTermination(b: ContractDedicatedBlocks, editorMode: boolean, activeSection?: string | null): string {
    const attr = sectionAttr('termination', editorMode, activeSection)
    return `
<div${attr}>
  <h2 style="color:#1B3A5C;font-size:14px;font-weight:700;margin:28px 0 12px;padding-bottom:6px;border-bottom:1px solid #E2E8F0;letter-spacing:.3px;">§ 15 — ROZWIĄZANIE UMOWY</h2>
  <ol style="margin:0;padding-left:20px;font-size:13px;line-height:1.75;color:#0F172A;">
    <li>Każda ze Stron może rozwiązać umowę za ${blank(b.termination.noticeDays, 'X')}-dniowym pisemnym wypowiedzeniem.</li>
    <li>Rozwiązanie przez Zamawiającego z przyczyn niezależnych od Wykonawcy: Zamawiający zapłaci za prace wykonane do dnia rozwiązania proporcjonalnie do postępu, lecz nie mniej niż suma wpłaconych zaliczek.</li>
    <li>Wykonawca może rozwiązać umowę ze skutkiem natychmiastowym w przypadku opóźnienia w płatności powyżej ${blank(b.termination.immediatePaymentDays, 'X')} dni lub braku współpracy Zamawiającego przez ponad ${blank(b.termination.noCoopDays, 'X')} dni.</li>
    <li>W przypadku rozwiązania umowy Wykonawca przekaże Zamawiającemu kod źródłowy w stanie na dzień rozwiązania, po uregulowaniu wszystkich należności.</li>
  </ol>
</div>`
}

function renderGeneral(b: ContractDedicatedBlocks, editorMode: boolean, activeSection?: string | null): string {
    const attr = sectionAttr('general', editorMode, activeSection)
    return `
<div${attr}>
  <h2 style="color:#1B3A5C;font-size:14px;font-weight:700;margin:28px 0 12px;padding-bottom:6px;border-bottom:1px solid #E2E8F0;letter-spacing:.3px;">§ 16 — POSTANOWIENIA KOŃCOWE</h2>
  <ol style="margin:0;padding-left:20px;font-size:13px;line-height:1.75;color:#0F172A;">
    <li>W sprawach nieuregulowanych stosuje się Kodeks Cywilny.</li>
    <li>Zmiany umowy wymagają formy pisemnej pod rygorem nieważności.</li>
    <li>Spory rozstrzygane będą przez sąd właściwy dla siedziby Wykonawcy.</li>
    <li>Umowę sporządzono w dwóch jednobrzmiących egzemplarzach.</li>
    <li>Integralną częścią umowy jest Specyfikacja Techniczna (Załącznik nr 1) — zatwierdzona przez obie Strony po zakończeniu Etapu 1.</li>
  </ol>
</div>`
}

function renderSignatures(b: ContractDedicatedBlocks, editorMode: boolean, activeSection?: string | null): string {
    const attr = sectionAttr('signatures', editorMode, activeSection)
    return `
<div${attr}>
  <div style="border-top:1px solid #E2E8F0;margin-top:40px;padding-top:36px;">
    <div class="two-col" style="gap:48px;text-align:center;">
      <div>
        <div style="font-size:11px;font-weight:700;letter-spacing:1px;color:#1B3A5C;text-transform:uppercase;margin-bottom:48px;">Wykonawca</div>
        <div style="border-bottom:1px solid #0F172A;width:200px;margin:0 auto;"></div>
        <div style="margin-top:8px;font-size:12px;">${blank(b.signatures.contractorName, 'IMIĘ NAZWISKO')}</div>
        <div style="margin-top:4px;font-size:11px;color:#475569;">${blank(b.signatures.contractorDate, 'DATA')}</div>
      </div>
      <div>
        <div style="font-size:11px;font-weight:700;letter-spacing:1px;color:#1B3A5C;text-transform:uppercase;margin-bottom:48px;">Zamawiający</div>
        <div style="border-bottom:1px solid #0F172A;width:200px;margin:0 auto;"></div>
        <div style="margin-top:8px;font-size:12px;">${blank(b.signatures.clientName, 'IMIĘ NAZWISKO')}</div>
        <div style="margin-top:4px;font-size:11px;color:#475569;">${blank(b.signatures.clientDate, 'DATA')}</div>
      </div>
    </div>
    ${b.signatures.footerNote ? `<p style="text-align:center;font-size:11px;color:#475569;margin:24px auto 0;max-width:560px;line-height:1.6;">${esc(b.signatures.footerNote)}</p>` : ''}
  </div>
</div>`
}

function renderSection(
    key: DedicatedSectionKey | 'header' | 'signatures',
    b: ContractDedicatedBlocks,
    editorMode: boolean,
    activeSection?: string | null,
): string {
    switch (key) {
        case 'parties': return renderParties(b, editorMode, activeSection)
        case 'subject': return renderSubject(b, editorMode, activeSection)
        case 'phases': return renderPhases(b, editorMode, activeSection)
        case 'spec': return renderSpec(b, editorMode, activeSection)
        case 'obligations': return renderObligations(b, editorMode, activeSection)
        case 'timeline': return renderTimeline(b, editorMode, activeSection)
        case 'payment': return renderPayment(b, editorMode, activeSection)
        case 'scopeCreep': return renderScopeCreep(b, editorMode, activeSection)
        case 'acceptance': return renderAcceptance(b, editorMode, activeSection)
        case 'infrastructure': return renderInfrastructure(b, editorMode, activeSection)
        case 'gdpr': return renderGdpr(b, editorMode, activeSection)
        case 'copyright': return renderCopyright(b, editorMode, activeSection)
        case 'confidentiality': return renderConfidentiality(b, editorMode, activeSection)
        case 'warranty': return renderWarranty(b, editorMode, activeSection)
        case 'termination': return renderTermination(b, editorMode, activeSection)
        case 'general': return renderGeneral(b, editorMode, activeSection)
        default: return ''
    }
}

// ── Public API ─────────────────────────────────────────────────────────────────

export function buildContractDedicatedHtml(
    blocks: ContractDedicatedBlocks,
    options: ContractDedicatedHtmlOptions = {},
): string {
    const { editorMode = false, zoom = 1.0, activeSection = null } = options
    const b = blocks

    const headerAttr = editorMode
        ? ` data-sq-section="header" style="cursor:pointer;"` : ''
    const signaturesAttr = sectionAttr('signatures', editorMode, activeSection)

    const sectionsHtml = b.sections
        .map(key => withPageBreakAfter(
            renderSection(key, b, editorMode, activeSection),
            b.pageBreakAfter.includes(key),
        ))
        .join('\n')

    return buildHtmlDocument({
        title: 'Umowa IT — System dedykowany',
        css: buildCss(editorMode, zoom),
        body: `<div class="doc">
  ${withPageBreakAfter(`<div${headerAttr}>${renderHeader(b)}${renderTitle(b)}</div>`, b.pageBreakAfter.includes('header'))}
  <div class="content" style="padding:24px 48px 40px;">
    ${sectionsHtml}
    <div${signaturesAttr}>${renderSignatures(b, false)}</div>
  </div>
  <div style="background:#F8FAFC;border-top:1px solid #E2E8F0;padding:16px 48px;text-align:center;">
    <div style="color:#475569;font-size:11px;line-height:1.7;">${esc(b.parties.contractor.name || 'NAZWA WYKONAWCY')} · ${esc(b.parties.contractor.email || 'EMAIL')} · ${esc(b.header.website || 'www.twoja-strona.pl')}</div>
    <div style="color:#475569;font-size:11px;margin-top:4px;">Nr umowy: ${esc(b.header.contractNumber)}</div>
  </div>
</div>
${editorMode ? buildEditorScript() : ''}`,
    })
}

export function buildContractDedicatedHtmlFromSaved(
    savedBlocks: unknown,
    options: ContractDedicatedHtmlOptions = {},
): string {
    const blocks = mergeDedicatedWithDefaults(
        savedBlocks && typeof savedBlocks === 'object'
            ? (savedBlocks as Partial<ContractDedicatedBlocks>)
            : null,
    )
    return buildContractDedicatedHtml(blocks, options)
}

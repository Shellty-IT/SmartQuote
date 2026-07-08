// src/lib/pdf/contract-sla-html.ts
// HTML generator for the "Opieka IT" (SLA) contract template.
// Navy #1B3A5C / Gold #C9A84C design.
import { buildHtmlDocument, buildContractPageRule, CONTRACT_ORPHANS_CSS } from './html-shell'
import { withPageBreakAfter } from './section-layout'
import {
    type ContractSlaBlocks,
    type SlaSectionKey,
    mergeSlaWithDefaults,
} from './contract-sla-blocks'

export interface ContractSlaHtmlOptions {
    editorMode?: boolean
    zoom?: number
    activeSection?: string | null
}

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
    return ` data-sq-section="${key}" style="cursor:pointer;border-radius:4px;${isActive ? 'outline:2px solid #C9A84C;outline-offset:2px;' : ''}"`
}

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
@media(max-width:768px){.two-col{grid-template-columns:1fr!important;}.bar-inner,.content{padding-left:20px!important;padding-right:20px!important;}}
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

function renderHeader(b: ContractSlaBlocks): string {
    const logoUrl = b.header.logoDarkUrl || b.header.logoUrl
    const logo = logoUrl
        ? `<img src="${esc(logoUrl)}" alt="Logo firmy" style="display:block;max-width:120px;max-height:48px;object-fit:contain;object-position:left center;" />`
        : `<div style="width:68px;height:40px;border:1px solid rgba(201,168,76,.6);display:flex;align-items:center;justify-content:center;color:#C9A84C;font-size:10px;font-weight:600;letter-spacing:2px;">LOGO</div>`
    return `<div style="width:100%;background:#1B3A5C;">
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

function renderTitle(b: ContractSlaBlocks): string {
    return `<div style="padding:34px 48px 0;">
  <h1 style="text-align:center;color:#1B3A5C;font-size:22px;font-weight:700;margin:0;letter-spacing:.3px;line-height:1.35;">UMOWA O ŚWIADCZENIE USŁUG OPIEKI TECHNICZNEJ IT</h1>
  <p style="text-align:center;color:#475569;font-style:italic;font-size:13px;margin:12px 0 0;">zawarta dnia ${blank(b.header.date, 'DD.MM.RRRR')} w ${blank(b.header.city, 'MIEJSCOWOŚĆ')}</p>
</div>`
}

function h2(text: string): string {
    return `<h2 style="color:#1B3A5C;font-size:14px;font-weight:700;margin:28px 0 12px;padding-bottom:6px;border-bottom:1px solid #E2E8F0;letter-spacing:.3px;">${text}</h2>`
}

function renderParties(b: ContractSlaBlocks, editorMode: boolean, activeSection?: string | null): string {
    const attr = sectionAttr('parties', editorMode, activeSection)
    const row = (label: string, val: string, ph: string) =>
        `<div style="margin-bottom:7px;"><span style="color:#475569;">${label}:</span> ${blank(val, ph)}</div>`
    const side = (title: string, p: typeof b.parties.provider, alias: string) => `
    <div style="border:1px solid #E2E8F0;padding:20px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:1px;color:#1B3A5C;text-transform:uppercase;margin-bottom:12px;">${title}</div>
      ${row('Imię i nazwisko / Firma', p.name, 'NAZWA')}
      ${row('Adres', p.address, 'ADRES')}
      ${row('NIP', p.nip, 'NIP')}
      ${row('Email', p.email, 'EMAIL')}
      ${row('Telefon', p.phone, 'TELEFON')}
      <div style="margin-top:10px;padding-top:8px;border-top:1px solid #E2E8F0;">Zwany dalej: <strong>${alias}</strong></div>
    </div>`
    return `<div${attr}>${h2('§ 1 — STRONY UMOWY')}
  <div class="two-col">${side('Usługodawca', b.parties.provider, 'Usługodawcą')}${side('Usługobiorca', b.parties.client, 'Usługobiorcą')}</div>
</div>`
}

function renderSubject(b: ContractSlaBlocks, editorMode: boolean, activeSection?: string | null): string {
    const attr = sectionAttr('subject', editorMode, activeSection)
    const systemRows = b.subject.systems.map(s => `
    <tr><td style="border:1px solid #E2E8F0;padding:8px 12px;">${blank(s.name, 'NAZWA SYSTEMU')}</td><td style="border:1px solid #E2E8F0;padding:8px 12px;">${blank(s.address, 'URL / OPIS')}</td></tr>`).join('')
    return `<div${attr}>${h2('§ 2 — PRZEDMIOT UMOWY')}
  <p>1. Usługodawca zobowiązuje się do świadczenia usług stałej opieki technicznej IT dla Usługobiorcy, na warunkach określonych w niniejszej umowie.</p>
  <p>2. Opieka techniczna obejmuje systemy / strony / aplikacje Usługobiorcy wymienione poniżej:</p>
  <div style="margin:10px 0 10px 0;overflow-x:auto;">
    <table style="font-size:13px;">
      <thead><tr>
        <th style="background:#F8FAFC;color:#1B3A5C;padding:9px 12px;font-weight:600;border:1px solid #E2E8F0;width:42%;">System / Aplikacja</th>
        <th style="background:#F8FAFC;color:#1B3A5C;padding:9px 12px;font-weight:600;border:1px solid #E2E8F0;">Adres / Identyfikator</th>
      </tr></thead>
      <tbody>${systemRows}</tbody>
    </table>
  </div>
  <p>3. Rozszerzenie listy systemów objętych opieką wymaga pisemnego aneksu do umowy.</p>
</div>`
}

function renderPackage(b: ContractSlaBlocks, editorMode: boolean, activeSection?: string | null): string {
    const attr = sectionAttr('package', editorMode, activeSection)
    const pkg = b.package
    const row = (label: string, val: string, ph: string) =>
        `<tr><td style="border:1px solid #E2E8F0;padding:8px 12px;">${label}</td><td style="border:1px solid #E2E8F0;padding:8px 12px;">${blank(val, ph)}</td></tr>`
    return `<div${attr}>${h2('§ 3 — PAKIET I WYNAGRODZENIE')}
  <p>1. Strony ustalają następujące warunki abonamentu:</p>
  <div style="overflow-x:auto;margin:10px 0 10px 0;">
    <table style="font-size:13px;">
      <thead><tr>
        <th style="background:#F8FAFC;color:#1B3A5C;padding:9px 12px;font-weight:600;border:1px solid #E2E8F0;width:44%;">Parametr</th>
        <th style="background:#F8FAFC;color:#1B3A5C;padding:9px 12px;font-weight:600;border:1px solid #E2E8F0;">Wartość</th>
      </tr></thead>
      <tbody>
        ${row('Wybrany pakiet', pkg.packageName, 'BASIC / STANDARD / PREMIUM')}
        <tr><td style="border:1px solid #E2E8F0;padding:8px 12px;background:#F8FAFC;">Miesięczna opłata abonamentowa</td><td style="border:1px solid #E2E8F0;padding:8px 12px;background:#F8FAFC;">${blank(pkg.monthlyFee, 'KWOTA')} zł netto + VAT ${blank(pkg.vatRate, '23%')}</td></tr>
        ${row('Pula godzin wsparcia w miesiącu', pkg.supportHours, 'X')} zł netto / godzina (nadpisany przez blank) — <span style="display:none"></span>
        ${row('Stawka za godziny ponadabonamentowe', pkg.extraHourRate + ' zł netto / godz.', 'KWOTA')}
        ${row('Godziny świadczenia usług', pkg.serviceHours, 'np. pon–pt, 9:00–17:00')}
        ${row('Dostępność w nagłych przypadkach', pkg.emergencyAvailability, '24/7 dla KRYTYCZNYCH')}
      </tbody>
    </table>
  </div>
  <p>2. Pula godzin wsparcia w miesiącu: ${blank(pkg.supportHours, 'X')} godzin. Niewykorzystane godziny ${blank(pkg.unusedHours, 'nie przechodzą / przechodzą')} na kolejny miesiąc.</p>
  <p>3. Opłata abonamentowa płatna jest z góry, do ${blank(pkg.paymentDay, 'X')} dnia każdego miesiąca, przelewem na konto: ${blank(pkg.accountNumber, 'NUMER KONTA')}</p>
  <p>4. Termin płatności faktury: ${blank(pkg.paymentTermDays, 'X')} dni od wystawienia.</p>
  <p>5. W przypadku opóźnienia w płatności Usługodawca ma prawo do naliczania odsetek ustawowych oraz zawieszenia świadczenia usług do czasu uregulowania zaległości.</p>
  <p>6. Usługodawca ma prawo do zmiany wysokości wynagrodzenia z ${blank(pkg.priceNoticeMonths, 'X')}-miesięcznym wyprzedzeniem, w formie pisemnej.</p>
</div>`
}

function renderServices(b: ContractSlaBlocks, editorMode: boolean, activeSection?: string | null): string {
    const attr = sectionAttr('services', editorMode, activeSection)
    const includedItems = b.services.included.map(s => `<li>${esc(s)}</li>`).join('')
    const excludedItems = b.services.excluded.map(s => `<li>${esc(s)}</li>`).join('')
    return `<div${attr}>${h2('§ 4 — KATALOG USŁUG OBJĘTYCH OPIEKĄ')}
  <p>1. W ramach abonamentu Usługodawca świadczy następujące usługi:</p>
  <ul style="margin:6px 0 6px 20px;padding:0;font-size:13px;line-height:1.75;">${includedItems}</ul>
  <p>2. Usługi poza katalogiem realizowane są jako osobne zlecenia, wyceniane według stawki ${blank(b.services.hourRate, 'KWOTA')} zł netto / godzina lub na podstawie oddzielnej oferty:</p>
  <ul style="margin:6px 0 6px 20px;padding:0;font-size:13px;line-height:1.75;">${excludedItems}</ul>
</div>`
}

function renderPriorities(b: ContractSlaBlocks, editorMode: boolean, activeSection?: string | null): string {
    const attr = sectionAttr('priorities', editorMode, activeSection)
    const pRows = b.priorities.priorities.map(p => `
    <tr>
      <td style="border:1px solid #E2E8F0;padding:8px 10px;white-space:nowrap;"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${esc(p.color)};margin-right:8px;vertical-align:middle;"></span><strong>${esc(p.priority)}</strong></td>
      <td style="border:1px solid #E2E8F0;padding:8px 10px;">${esc(p.definition)}</td>
      <td style="border:1px solid #E2E8F0;padding:8px 10px;">${esc(p.reactionTime)}</td>
      <td style="border:1px solid #E2E8F0;padding:8px 10px;">${esc(p.resolutionTime)}</td>
    </tr>`).join('')
    return `<div${attr}>${h2('§ 5 — PRIORYTETY I CZASY REAKCJI')}
  <p>1. Zgłoszenia klasyfikowane są według następujących priorytetów:</p>
  <div style="overflow-x:auto;margin:10px 0;">
    <table style="font-size:12.5px;">
      <thead><tr style="background:#1B3A5C;color:#fff;">
        <th style="padding:9px 10px;border:1px solid #1B3A5C;">Priorytet</th>
        <th style="padding:9px 10px;border:1px solid #1B3A5C;">Definicja</th>
        <th style="padding:9px 10px;border:1px solid #1B3A5C;">Czas reakcji</th>
        <th style="padding:9px 10px;border:1px solid #1B3A5C;">Cel rozwiązania</th>
      </tr></thead>
      <tbody>${pRows}</tbody>
    </table>
  </div>
  <p>2. Przez czas reakcji rozumie się czas od otrzymania zgłoszenia do potwierdzenia jego przyjęcia i rozpoczęcia diagnozy.</p>
  <p>3. Czasy reakcji dotyczą godzin świadczenia usług określonych w § 3 ust. 1, chyba że umowa przewiduje inaczej dla priorytetów KRYTYCZNYCH.</p>
  <p>4. Usługodawca dołoży wszelkich starań aby dotrzymać czasów rozwiązania, jednak nie gwarantuje ich w przypadkach zależnych od czynników zewnętrznych.</p>
</div>`
}

function renderIncidents(b: ContractSlaBlocks, editorMode: boolean, activeSection?: string | null): string {
    const attr = sectionAttr('incidents', editorMode, activeSection)
    return `<div${attr}>${h2('§ 6 — ZGŁASZANIE I OBSŁUGA AWARII')}
  <p>1. Zgłoszenia przyjmowane są następującymi kanałami:</p>
  <ul style="margin:6px 0 6px 20px;padding:0;font-size:13px;line-height:1.75;">
    <li>Email: ${blank(b.incidents.email, 'EMAIL')} — dla wszystkich priorytetów</li>
    <li>Telefon: ${blank(b.incidents.phone, 'TELEFON')} — wyłącznie dla priorytetów KRYTYCZNYCH i WYSOKICH</li>
    ${b.incidents.ticketSystem ? `<li>System ticketowy: ${esc(b.incidents.ticketSystem)}</li>` : ''}
  </ul>
  <p>2. Każde zgłoszenie powinno zawierać: opis problemu, priorytet (wg klasyfikacji z § 5), zrzuty ekranu lub logi (jeśli dostępne).</p>
  <p>3. Usługodawca potwierdzi odbiór zgłoszenia w czasie określonym w § 5 i przypisze mu numer referencyjny.</p>
  <p>4. Usługodawca poinformuje Usługobiorcę o postępach w rozwiązywaniu zgłoszenia oraz o przewidywanym czasie naprawy.</p>
  <p>5. Po rozwiązaniu zgłoszenia Usługodawca powiadomi Usługobiorcę — brak sprzeciwu Usługobiorcy w ciągu ${blank(b.incidents.closureWorkDays, 'X')} dni roboczych oznacza akceptację rozwiązania.</p>
</div>`
}

function renderObligations(b: ContractSlaBlocks, editorMode: boolean, activeSection?: string | null): string {
    const attr = sectionAttr('obligations', editorMode, activeSection)
    return `<div${attr}>${h2('§ 7 — OBOWIĄZKI USŁUGOBIORCY')}
  <p>1. Usługobiorca zobowiązuje się do:</p>
  <ul style="margin:6px 0 6px 20px;padding:0;font-size:13px;line-height:1.75;">
    <li>Terminowego regulowania opłat abonamentowych</li>
    <li>Przekazania Usługodawcy niezbędnych danych dostępowych do systemów objętych opieką</li>
    <li>Niezwłocznego informowania Usługodawcy o planowanych zmianach w systemach mogących wpłynąć na ich działanie</li>
    <li>Nieudostępniania danych dostępowych przekazanych przez Usługodawcę osobom trzecim bez jego zgody</li>
    <li>Wyznaczenia osoby odpowiedzialnej za kontakt z Usługodawcą</li>
    <li>Udzielania odpowiedzi na pytania Usługodawcy w terminie ${blank(b.obligations.responseDays, 'X')} dni roboczych</li>
  </ul>
  <p>2. Usługobiorca przyjmuje do wiadomości że samodzielne lub zlecone osobom trzecim ingerencje w systemy objęte opieką bez wiedzy Usługodawcy mogą skutkować wyłączeniem gwarancji SLA dla dotkniętych elementów.</p>
</div>`
}

function renderReporting(b: ContractSlaBlocks, editorMode: boolean, activeSection?: string | null): string {
    const attr = sectionAttr('reporting', editorMode, activeSection)
    return `<div${attr}>${h2('§ 8 — RAPORTOWANIE')}
  <p>1. Usługodawca będzie przekazywał Usługobiorcy miesięczny raport zawierający:</p>
  <ul style="margin:6px 0 6px 20px;padding:0;font-size:13px;line-height:1.75;">
    <li>Wykaz obsłużonych zgłoszeń z czasami reakcji i rozwiązania</li>
    <li>Wykorzystanie puli godzin</li>
    <li>Wykonane aktualizacje i kopie zapasowe</li>
    <li>Status monitorowanych systemów — dostępność</li>
    <li>Rekomendacje techniczne na kolejny okres</li>
  </ul>
  <p>2. Raport przekazywany jest do ${blank(b.reporting.reportDay, 'X')} dnia miesiąca następującego po miesiącu rozliczeniowym, na adres email: ${blank(b.reporting.reportEmail, 'EMAIL USŁUGOBIORCY')}</p>
</div>`
}

function renderConfidentiality(b: ContractSlaBlocks, editorMode: boolean, activeSection?: string | null): string {
    const attr = sectionAttr('confidentiality', editorMode, activeSection)
    return `<div${attr}>${h2('§ 9 — POUFNOŚĆ I DANE OSOBOWE')}
  <p>1. Strony zobowiązują się do zachowania poufności wszelkich informacji uzyskanych w trakcie realizacji umowy.</p>
  <p>2. Obowiązek poufności obowiązuje przez czas umowy oraz ${blank(b.confidentiality.years, 'X')} lata po jej zakończeniu.</p>
  <p>3. Usługodawca może mieć dostęp do danych osobowych przetwarzanych przez systemy Usługobiorcy wyłącznie w zakresie niezbędnym do świadczenia usług. Jeśli zakres dostępu tego wymaga, Strony zawrą odrębną umowę powierzenia przetwarzania danych osobowych.</p>
</div>`
}

function renderLiability(b: ContractSlaBlocks, editorMode: boolean, activeSection?: string | null): string {
    const attr = sectionAttr('liability', editorMode, activeSection)
    return `<div${attr}>${h2('§ 10 — ODPOWIEDZIALNOŚĆ')}
  <p>1. Usługodawca ponosi odpowiedzialność za szkody wynikające bezpośrednio z nienależytego świadczenia usług objętych niniejszą umową.</p>
  <p>2. Usługodawca nie ponosi odpowiedzialności za:</p>
  <ul style="margin:6px 0 6px 20px;padding:0;font-size:13px;line-height:1.75;">
    <li>Awarie infrastruktury serwerowej niezależne od Usługodawcy</li>
    <li>Szkody wynikające z działań Usługobiorcy lub osób trzecich</li>
    <li>Utratę danych wynikającą z przyczyn leżących poza kontrolą Usługodawcy</li>
    <li>Niedostępność usług zewnętrznych (płatności, API, integracje)</li>
  </ul>
  <p>3. Łączna odpowiedzialność Usługodawcy ograniczona jest do wysokości wynagrodzenia miesięcznego z § 3.</p>
</div>`
}

function renderTermination(b: ContractSlaBlocks, editorMode: boolean, activeSection?: string | null): string {
    const attr = sectionAttr('termination', editorMode, activeSection)
    return `<div${attr}>${h2('§ 11 — CZAS TRWANIA I ROZWIĄZANIE UMOWY')}
  <p>1. Umowa zawarta jest na czas nieokreślony, ze skutkiem od dnia ${blank(b.termination.startDate, 'DATA STARTU')}.</p>
  <p>2. Każda ze Stron może wypowiedzieć umowę z zachowaniem ${blank(b.termination.noticeMonths, 'X')}-miesięcznego okresu wypowiedzenia, w formie pisemnej, ze skutkiem na koniec miesiąca kalendarzowego.</p>
  <p>3. Usługodawca może rozwiązać umowę ze skutkiem natychmiastowym w przypadku:</p>
  <ul style="margin:6px 0 6px 20px;padding:0;font-size:13px;line-height:1.75;">
    <li>Opóźnienia w płatności abonamentu przekraczającego ${blank(b.termination.immediatePaymentDays, 'X')} dni</li>
    <li>Rażącego naruszenia warunków umowy przez Usługobiorcę</li>
  </ul>
  <p>4. Po rozwiązaniu umowy Usługodawca przekaże Usługobiorcy wszystkie dane dostępowe do systemów oraz usunie ze swoich urządzeń wszelkie dane poufne Usługobiorcy w terminie ${blank(b.termination.handoverDays, 'X')} dni.</p>
</div>`
}

function renderGeneral(b: ContractSlaBlocks, editorMode: boolean, activeSection?: string | null): string {
    const attr = sectionAttr('general', editorMode, activeSection)
    return `<div${attr}>${h2('§ 12 — POSTANOWIENIA KOŃCOWE')}
  <p>1. W sprawach nieuregulowanych stosuje się Kodeks Cywilny.</p>
  <p>2. Zmiany umowy wymagają formy pisemnej pod rygorem nieważności.</p>
  <p>3. Spory rozstrzygane będą przez sąd właściwy dla siedziby Usługodawcy.</p>
  <p>4. Umowę sporządzono w dwóch jednobrzmiących egzemplarzach.</p>
</div>`
}

function renderSignatures(b: ContractSlaBlocks): string {
    return `<div style="margin-top:36px;padding-top:28px;border-top:1px solid #E2E8F0;">
  <div class="two-col" style="gap:48px;text-align:center;">
    <div>
      <div style="font-size:11px;font-weight:700;letter-spacing:1px;color:#1B3A5C;text-transform:uppercase;margin-bottom:54px;">Usługodawca</div>
      <div style="border-bottom:1px solid #0F172A;width:200px;margin:0 auto 10px;"></div>
      <div>${blank(b.signatures.providerName, 'IMIĘ NAZWISKO')}</div>
      <div style="margin-top:6px;color:#475569;">${blank(b.signatures.providerDate, 'DATA')}</div>
    </div>
    <div>
      <div style="font-size:11px;font-weight:700;letter-spacing:1px;color:#1B3A5C;text-transform:uppercase;margin-bottom:54px;">Usługobiorca</div>
      <div style="border-bottom:1px solid #0F172A;width:200px;margin:0 auto 10px;"></div>
      <div>${blank(b.signatures.clientName, 'IMIĘ NAZWISKO')}</div>
      <div style="margin-top:6px;color:#475569;">${blank(b.signatures.clientDate, 'DATA')}</div>
    </div>
  </div>
</div>`
}

function renderSection(
    key: SlaSectionKey,
    b: ContractSlaBlocks,
    editorMode: boolean,
    activeSection?: string | null,
): string {
    switch (key) {
        case 'parties': return renderParties(b, editorMode, activeSection)
        case 'subject': return renderSubject(b, editorMode, activeSection)
        case 'package': return renderPackage(b, editorMode, activeSection)
        case 'services': return renderServices(b, editorMode, activeSection)
        case 'priorities': return renderPriorities(b, editorMode, activeSection)
        case 'incidents': return renderIncidents(b, editorMode, activeSection)
        case 'obligations': return renderObligations(b, editorMode, activeSection)
        case 'reporting': return renderReporting(b, editorMode, activeSection)
        case 'confidentiality': return renderConfidentiality(b, editorMode, activeSection)
        case 'liability': return renderLiability(b, editorMode, activeSection)
        case 'termination': return renderTermination(b, editorMode, activeSection)
        case 'general': return renderGeneral(b, editorMode, activeSection)
        default: return ''
    }
}

export function buildContractSlaHtml(
    blocks: ContractSlaBlocks,
    options: ContractSlaHtmlOptions = {},
): string {
    const { editorMode = false, zoom = 1.0, activeSection = null } = options
    const b = blocks
    const headerAttr = editorMode ? ` data-sq-section="header" style="cursor:pointer;"` : ''
    const sigAttr = editorMode ? ` data-sq-section="signatures" style="cursor:pointer;border-radius:4px;"` : ''

    const sectionsHtml = b.sections.map(key => withPageBreakAfter(
        renderSection(key, b, editorMode, activeSection),
        b.pageBreakAfter.includes(key),
    )).join('\n')

    return buildHtmlDocument({
        title: 'Umowa IT — Opieka SLA',
        css: buildCss(editorMode, zoom),
        body: `<div class="doc">
  ${withPageBreakAfter(`<div${headerAttr}>${renderHeader(b)}${renderTitle(b)}</div>`, b.pageBreakAfter.includes('header'))}
  <div class="content" style="padding:24px 48px 40px;">
    ${sectionsHtml}
    <div${sigAttr}>${renderSignatures(b)}</div>
  </div>
  <div style="background:#F8FAFC;border-top:1px solid #E2E8F0;padding:16px 48px;text-align:center;">
    <div style="color:#475569;font-size:11px;line-height:1.7;">${esc(b.parties.provider.name || 'NAZWA USŁUGODAWCY')} · ${esc(b.parties.provider.email || 'EMAIL')} · ${esc(b.parties.provider.phone || 'TELEFON')} · ${esc(b.header.website || 'www.twoja-strona.pl')}</div>
    <div style="color:#475569;font-size:11px;margin-top:4px;">Nr umowy: ${esc(b.header.contractNumber)}</div>
  </div>
</div>
${editorMode ? buildEditorScript() : ''}`,
    })
}

export function buildContractSlaHtmlFromSaved(
    savedBlocks: unknown,
    options: ContractSlaHtmlOptions = {},
): string {
    const blocks = mergeSlaWithDefaults(
        savedBlocks && typeof savedBlocks === 'object'
            ? (savedBlocks as Partial<ContractSlaBlocks>)
            : null,
    )
    return buildContractSlaHtml(blocks, options)
}

// src/lib/pdf/contract-mobile-html.ts
// HTML generator for the "Aplikacja mobilna" contract template.
// Navy #1B3A5C / Gold #C9A84C design.
import { buildHtmlDocument, buildContractPageRule, CONTRACT_ORPHANS_CSS } from './html-shell'
import {
    type ContractMobileBlocks,
    type MobileSectionKey,
    mergeMobileWithDefaults,
} from './contract-mobile-blocks'

export interface ContractMobileHtmlOptions {
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
p{margin:7px 0;}
@media(max-width:768px){.two-col{grid-template-columns:1fr!important;}.bar-inner,.content{padding-left:20px!important;padding-right:20px!important;}}
${buildContractPageRule()}
${CONTRACT_ORPHANS_CSS}
.content>div{break-inside:avoid;page-break-inside:avoid;}
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

function h2(text: string): string {
    return `<h2 style="font-size:15px;font-weight:700;color:#1B3A5C;margin:30px 0 12px;padding-bottom:7px;border-bottom:1px solid #E2E8F0;letter-spacing:.3px;">${text}</h2>`
}

function renderHeader(b: ContractMobileBlocks): string {
    const logoUrl = b.header.logoDarkUrl || b.header.logoUrl
    const logo = logoUrl
        ? `<img src="${esc(logoUrl)}" alt="Logo firmy" style="display:block;max-width:120px;max-height:48px;object-fit:contain;object-position:left center;" />`
        : `<div style="width:68px;height:40px;border:1px solid rgba(201,168,76,.6);display:flex;align-items:center;justify-content:center;color:#C9A84C;font-size:10px;font-weight:600;letter-spacing:2px;">LOGO</div>`
    return `<div style="width:100%;background:#1B3A5C;">
  <div class="bar-inner" style="display:flex;justify-content:space-between;align-items:center;gap:16px;">
    <div style="display:flex;align-items:center;gap:14px;min-width:0;">
      ${logo}
      <span style="color:#C9A84C;font-size:13px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(b.header.website || 'www.twoja-strona.pl')}</span>
    </div>
    <div style="text-align:right;color:#fff;font-size:11px;line-height:1.8;white-space:nowrap;">
      <div>Nr umowy: <span style="color:#C9A84C;font-weight:600;">${esc(b.header.contractNumber)}</span></div>
      <div>Data: ${blank(b.header.date, 'DD.MM.RRRR')}</div>
    </div>
  </div>
</div>`
}

function renderTitle(b: ContractMobileBlocks): string {
    return `<div style="padding:36px 48px 0;">
  <h1 style="text-align:center;color:#1B3A5C;font-size:22px;font-weight:700;margin:0 0 8px;letter-spacing:.3px;">UMOWA O WYKONANIE APLIKACJI MOBILNEJ</h1>
  <p style="text-align:center;color:#475569;font-style:italic;font-size:13px;margin:0 0 8px;">zawarta dnia ${blank(b.header.date, 'DD.MM.RRRR')} w ${blank(b.header.city, 'MIEJSCOWOŚĆ')}</p>
</div>`
}

function renderParties(b: ContractMobileBlocks, editorMode: boolean, activeSection?: string | null): string {
    const attr = sectionAttr('parties', editorMode, activeSection)
    const row = (label: string, val: string, ph: string) =>
        `<p style="margin:5px 0;">${label}: ${blank(val, ph)}</p>`
    const side = (title: string, p: typeof b.parties.contractor, alias: string) => `
    <div style="border:1px solid #E2E8F0;padding:20px;">
      <div style="text-transform:uppercase;font-size:11px;font-weight:700;letter-spacing:1px;color:#475569;margin-bottom:12px;">${title}</div>
      ${row('Imię i nazwisko / Firma', p.name, 'NAZWA')}
      ${row('Adres', p.address, 'ADRES')}
      ${row('NIP', p.nip, 'NIP')}
      ${row('Email', p.email, 'EMAIL')}
      <p style="margin:10px 0 0;">Zwany dalej: <strong>${alias}</strong></p>
    </div>`
    return `<div${attr}>${h2('§ 1 — STRONY UMOWY')}
  <div class="two-col">${side('Wykonawca', b.parties.contractor, 'Wykonawcą')}${side('Zamawiający', b.parties.client, 'Zamawiającym')}</div>
</div>`
}

function renderSubject(b: ContractMobileBlocks, editorMode: boolean, activeSection?: string | null): string {
    const attr = sectionAttr('subject', editorMode, activeSection)
    const s = b.subject
    return `<div${attr}>${h2('§ 2 — PRZEDMIOT UMOWY')}
  <p>1. Wykonawca zobowiązuje się do zaprojektowania i wykonania aplikacji mobilnej zgodnie z zakresem określonym w § 3.</p>
  <p>2. Nazwa aplikacji: ${blank(s.appName, 'NAZWA APLIKACJI')}</p>
  <p>3. Technologia realizacji: ${blank(s.technology, 'React Native / Flutter / Swift + Kotlin')}</p>
  <p>4. Docelowe platformy: ${blank(s.platforms, 'iOS / Android / obie')}</p>
  <p>5. Minimalne wersje systemów: iOS ${blank(s.minIos, 'X')}+ / Android ${blank(s.minAndroid, 'X')}+</p>
  <p>6. Aplikacja będzie dostępna w: ${blank(s.stores, 'App Store / Google Play / obu sklepach')}</p>
</div>`
}

function renderScope(b: ContractMobileBlocks, editorMode: boolean, activeSection?: string | null): string {
    const attr = sectionAttr('scope', editorMode, activeSection)
    const featureItems = b.scope.features.map(f => `<p style="margin-left:22px;">• ${esc(f)}</p>`).join('')
    const exclusionItems = b.scope.exclusions.map((e, i) => `<p style="margin-left:22px;">${String.fromCharCode(97 + i)}) ${esc(e)}</p>`).join('')
    return `<div${attr}>${h2('§ 3 — ZAKRES PRAC')}
  <p>1. W ramach niniejszej umowy Wykonawca zrealizuje:</p>
  ${featureItems}
  <p>2. Zakres prac nie obejmuje:</p>
  ${exclusionItems}
  <p>3. Prace poza zakresem wymagają pisemnego aneksu i odrębnej wyceny.</p>
</div>`
}

function renderObligations(b: ContractMobileBlocks, editorMode: boolean, activeSection?: string | null): string {
    const attr = sectionAttr('obligations', editorMode, activeSection)
    return `<div${attr}>${h2('§ 4 — OBOWIĄZKI ZAMAWIAJĄCEGO')}
  <p>1. Zamawiający zobowiązuje się do dnia ${blank(b.obligations.materialsDeadline, 'DATA')} dostarczyć:</p>
  <p style="margin-left:22px;">a) Logotyp i identyfikację wizualną marki</p>
  <p style="margin-left:22px;">b) Treści tekstowe i materiały graficzne</p>
  <p style="margin-left:22px;">c) Aktywne konto Apple Developer (koszt: 99 USD/rok) z Wykonawcą dodanym jako członek zespołu</p>
  <p style="margin-left:22px;">d) Aktywne konto Google Play Console (koszt: 25 USD jednorazowo) z dostępem dla Wykonawcy</p>
  <p style="margin-left:22px;">e) Dane dostępowe do serwera / backendu (jeśli dotyczy)</p>
  <p>2. Zamawiający jest wyłącznie odpowiedzialny za założenie i opłacenie kont w sklepach Apple App Store i Google Play.</p>
  <p>3. Niedostarczenie materiałów lub dostępów w terminie skutkuje proporcjonalnym przesunięciem terminu realizacji.</p>
  <p>4. Zamawiający zobowiązuje się do udzielania odpowiedzi na pytania Wykonawcy w terminie ${blank(b.obligations.responseDays, 'X')} dni roboczych.</p>
</div>`
}

function renderTimeline(b: ContractMobileBlocks, editorMode: boolean, activeSection?: string | null): string {
    const attr = sectionAttr('timeline', editorMode, activeSection)
    return `<div${attr}>${h2('§ 5 — TERMIN REALIZACJI')}
  <p>1. Termin wykonania przedmiotu umowy: ${blank(b.timeline.endDate, 'DATA')}</p>
  <p>2. Termin rozpoczęcia prac: ${blank(b.timeline.startDate, 'DATA')} lub w ciągu ${blank(b.timeline.startDays, 'X')} dni od podpisania umowy i zaksięgowania zaliczki.</p>
  <p>3. Termin może ulec zmianie w przypadku: niedostarczenia materiałów przez Zamawiającego, zmian zakresu, opóźnień procesu review App Store / Google Play lub działania siły wyższej.</p>
  <p>4. Czas weryfikacji aplikacji przez Apple wynosi średnio 5–7 dni i jest niezależny od Wykonawcy — Wykonawca nie ponosi odpowiedzialności za opóźnienia wynikające z procesu review.</p>
</div>`
}

function renderPayment(b: ContractMobileBlocks, editorMode: boolean, activeSection?: string | null): string {
    const attr = sectionAttr('payment', editorMode, activeSection)
    const rows = b.payment.payments.map(p => `
    <tr>
      <td style="padding:9px 12px;border:1px solid #E2E8F0;">${esc(p.name)}</td>
      <td style="padding:9px 12px;border:1px solid #E2E8F0;">${blank(p.percent, 'X')}% — ${blank(p.amount, 'KWOTA')} zł</td>
      <td style="padding:9px 12px;border:1px solid #E2E8F0;">${esc(p.condition)}</td>
    </tr>`).join('')
    return `<div${attr}>${h2('§ 6 — WYNAGRODZENIE I PŁATNOŚCI')}
  <p>1. Wynagrodzenie za wykonanie przedmiotu umowy wynosi: ${blank(b.payment.totalNet, 'KWOTA')} zł netto (słownie: ${blank(b.payment.totalWords, 'SŁOWNIE')}) + VAT ${blank(b.payment.vatRate, '23% / zwolniony')}.</p>
  <p>2. Harmonogram płatności:</p>
  <div style="overflow-x:auto;margin:10px 0 4px;">
    <table style="font-size:13px;">
      <thead><tr style="background:#1B3A5C;color:#fff;">
        <th style="padding:9px 12px;border:1px solid #1B3A5C;">Płatność</th>
        <th style="padding:9px 12px;border:1px solid #1B3A5C;">Kwota</th>
        <th style="padding:9px 12px;border:1px solid #1B3A5C;">Termin / Warunek</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
  <p>3. Płatności przelewem na konto: ${blank(b.payment.accountNumber, 'NUMER KONTA')}</p>
  <p>4. Termin płatności faktury: ${blank(b.payment.paymentDays, 'X')} dni od wystawienia.</p>
  <p>5. Publikacja aplikacji w sklepach nastąpi po zaksięgowaniu pełnego wynagrodzenia.</p>
  <p>6. W przypadku opóźnienia w płatności Wykonawca ma prawo do naliczania odsetek ustawowych i wstrzymania prac.</p>
</div>`
}

function renderRevisions(b: ContractMobileBlocks, editorMode: boolean, activeSection?: string | null): string {
    const attr = sectionAttr('revisions', editorMode, activeSection)
    return `<div${attr}>${h2('§ 7 — POPRAWKI I ZMIANY')}
  <p>1. W ramach wynagrodzenia Zamawiającemu przysługują ${blank(b.revisions.uiRounds, 'X')} rundy poprawek do projektu UI/UX oraz ${blank(b.revisions.appRounds, 'X')} rundy poprawek do gotowej aplikacji.</p>
  <p>2. Przez rundę poprawek rozumie się zestaw uwag zgłoszonych w jednej wiadomości email.</p>
  <p>3. Dodatkowe rundy poprawek: ${blank(b.revisions.extraHourRate, 'KWOTA')} zł netto / godzina.</p>
  <p>4. Zmiany zakresu funkcjonalności wymagają aneksu do umowy i mogą wpłynąć na termin realizacji.</p>
</div>`
}

function renderAcceptance(b: ContractMobileBlocks, editorMode: boolean, activeSection?: string | null): string {
    const attr = sectionAttr('acceptance', editorMode, activeSection)
    return `<div${attr}>${h2('§ 8 — ODBIÓR I PRZEKAZANIE')}
  <p>1. Po wykonaniu prac Wykonawca udostępni aplikację Zamawiającemu w środowisku testowym (TestFlight dla iOS / Internal Track dla Android) w celu weryfikacji.</p>
  <p>2. Zamawiający zobowiązuje się do weryfikacji i zgłoszenia uwag w terminie ${blank(b.acceptance.reviewDays, 'X')} dni roboczych.</p>
  <p>3. Brak zgłoszenia uwag w terminie oznacza akceptację i upoważnia do wystawienia faktury końcowej.</p>
  <p>4. Po zaksięgowaniu pełnej płatności Wykonawca:</p>
  <p style="margin-left:22px;">a) Opublikuje aplikację w App Store i Google Play</p>
  <p style="margin-left:22px;">b) Przekaże Zamawiającemu repozytorium z kodem źródłowym (Git)</p>
  <p style="margin-left:22px;">c) Przekaże dane dostępowe do panelu administracyjnego (jeśli dotyczy)</p>
  <p style="margin-left:22px;">d) Przekaże dokumentację techniczną aplikacji</p>
</div>`
}

function renderRepository(b: ContractMobileBlocks, editorMode: boolean, activeSection?: string | null): string {
    const attr = sectionAttr('repository', editorMode, activeSection)
    return `<div${attr}>${h2('§ 9 — KOD ŹRÓDŁOWY I REPOZYTORIUM')}
  <p>1. Po zaksięgowaniu pełnego wynagrodzenia Wykonawca przekaże Zamawiającemu pełny kod źródłowy aplikacji w repozytorium Git (${esc(b.repository.note)}).</p>
  <p>2. Kod zostanie przekazany z historią commitów, plikiem README oraz instrukcją uruchomienia środowiska deweloperskiego.</p>
  <p>3. Zamawiający ma prawo do dalszego rozwijania aplikacji we własnym zakresie lub przez osoby trzecie po jej odbiorze.</p>
</div>`
}

function renderBackend(b: ContractMobileBlocks, editorMode: boolean, activeSection?: string | null): string {
    const attr = sectionAttr('backend', editorMode, activeSection)
    return `<div${attr}>${h2('§ 10 — BACKEND I KOSZTY ZEWNĘTRZNE')}
  <p>1. Koszty utrzymania infrastruktury serwerowej (serwer, baza danych, CDN, usługi zewnętrzne) po dacie odbioru aplikacji ponosi wyłącznie Zamawiający.</p>
  <p>2. Zamawiający przyjmuje do wiadomości orientacyjne miesięczne koszty utrzymania: ${blank(b.backend.monthlyCostsDesc, 'OPIS')}.</p>
  <p>3. Wykonawca ${blank(b.backend.hostingProvider, 'zapewnia / nie zapewnia')} hosting backendu w ramach niniejszej umowy.</p>
</div>`
}

function renderGdpr(b: ContractMobileBlocks, editorMode: boolean, activeSection?: string | null): string {
    const attr = sectionAttr('gdpr', editorMode, activeSection)
    return `<div${attr}>${h2('§ 11 — DANE OSOBOWE I RODO')}
  <p>1. Administratorem danych osobowych użytkowników aplikacji jest Zamawiający.</p>
  <p>2. Zamawiający odpowiada za wdrożenie polityki prywatności zgodnej z RODO — jej umieszczenie w aplikacji i w sklepach jest wymagane przez Apple i Google.</p>
  <p>3. Wykonawca wdroży w aplikacji mechanizmy techniczne umożliwiające realizację obowiązków wynikających z RODO, jednak nie ponosi odpowiedzialności za treść dokumentów prawnych dostarczonych przez Zamawiającego.</p>
</div>`
}

function renderCopyright(b: ContractMobileBlocks, editorMode: boolean, activeSection?: string | null): string {
    const attr = sectionAttr('copyright', editorMode, activeSection)
    return `<div${attr}>${h2('§ 12 — PRAWA AUTORSKIE')}
  <p>1. Z chwilą zaksięgowania pełnego wynagrodzenia Wykonawca przenosi na Zamawiającego autorskie prawa majątkowe do wykonanej aplikacji, w tym do kodu źródłowego i projektu graficznego, na polach eksploatacji: utrwalanie, zwielokrotnianie, rozpowszechnianie, publiczne udostępnianie.</p>
  <p>2. Przeniesienie praw nie obejmuje elementów objętych licencjami osób trzecich (biblioteki open-source, frameworki, wtyczki, zasoby graficzne).</p>
  <p>3. Do czasu pełnej zapłaty wszelkie prawa do wykonanej aplikacji pozostają przy Wykonawcy.</p>
  <p>4. Wykonawca ma prawo umieścić informację o realizacji aplikacji w swoim portfolio.</p>
</div>`
}

function renderConfidentiality(b: ContractMobileBlocks, editorMode: boolean, activeSection?: string | null): string {
    const attr = sectionAttr('confidentiality', editorMode, activeSection)
    return `<div${attr}>${h2('§ 13 — POUFNOŚĆ')}
  <p>1. Strony zobowiązują się do zachowania poufności wszelkich informacji uzyskanych w trakcie realizacji umowy.</p>
  <p>2. Obowiązek poufności obowiązuje przez czas umowy oraz ${blank(b.confidentiality.years, 'X')} lata po jej zakończeniu.</p>
</div>`
}

function renderWarranty(b: ContractMobileBlocks, editorMode: boolean, activeSection?: string | null): string {
    const attr = sectionAttr('warranty', editorMode, activeSection)
    return `<div${attr}>${h2('§ 14 — ODPOWIEDZIALNOŚĆ I GWARANCJA')}
  <p>1. Wykonawca gwarantuje poprawne działanie aplikacji na systemach iOS ${blank(b.warranty.iosMin, 'X')}+ i Android ${blank(b.warranty.androidMin, 'X')}+ w wersjach aktualnych na dzień odbioru.</p>
  <p>2. Wykonawca udziela gwarancji na okres ${blank(b.warranty.months, 'X')} miesięcy od odbioru.</p>
  <p>3. Gwarancja obejmuje usunięcie błędów wynikających z prac Wykonawcy w terminie ${blank(b.warranty.fixDays, 'X')} dni roboczych od zgłoszenia.</p>
  <p>4. Gwarancja nie obejmuje:</p>
  <p style="margin-left:22px;">a) Problemów wynikających z aktualizacji systemów iOS/Android wydanych po dacie odbioru</p>
  <p style="margin-left:22px;">b) Zmian wprowadzonych przez Zamawiającego lub osoby trzecie po odbiorze</p>
  <p style="margin-left:22px;">c) Awarii infrastruktury serwerowej</p>
  <p style="margin-left:22px;">d) Odrzucenia aplikacji przez App Store lub Google Play z przyczyn leżących po stronie Zamawiającego</p>
  <p>5. Łączna odpowiedzialność Wykonawcy ograniczona jest do wysokości wynagrodzenia z § 6.</p>
</div>`
}

function renderTermination(b: ContractMobileBlocks, editorMode: boolean, activeSection?: string | null): string {
    const attr = sectionAttr('termination', editorMode, activeSection)
    return `<div${attr}>${h2('§ 15 — ROZWIĄZANIE UMOWY')}
  <p>1. Każda ze Stron może rozwiązać umowę za ${blank(b.termination.noticeDays, 'X')}-dniowym pisemnym wypowiedzeniem.</p>
  <p>2. Rozwiązanie przez Zamawiającego z przyczyn niezależnych od Wykonawcy: Zamawiający zapłaci za prace już wykonane proporcjonalnie do postępu.</p>
  <p>3. Wykonawca może rozwiązać umowę ze skutkiem natychmiastowym w przypadku opóźnienia w płatności powyżej ${blank(b.termination.immediatePaymentDays, 'X')} dni lub braku współpracy Zamawiającego przez ponad ${blank(b.termination.noCoopDays, 'X')} dni.</p>
</div>`
}

function renderGeneral(b: ContractMobileBlocks, editorMode: boolean, activeSection?: string | null): string {
    const attr = sectionAttr('general', editorMode, activeSection)
    return `<div${attr}>${h2('§ 16 — POSTANOWIENIA KOŃCOWE')}
  <p>1. W sprawach nieuregulowanych stosuje się Kodeks Cywilny.</p>
  <p>2. Zmiany umowy wymagają formy pisemnej pod rygorem nieważności.</p>
  <p>3. Spory rozstrzygane będą przez sąd właściwy dla siedziby Wykonawcy.</p>
  <p>4. Umowę sporządzono w dwóch jednobrzmiących egzemplarzach.</p>
</div>`
}

function renderSignatures(b: ContractMobileBlocks): string {
    return `<div style="border-top:1px solid #E2E8F0;margin-top:40px;padding-top:48px;">
  <div class="two-col" style="gap:48px;text-align:center;">
    <div>
      <div style="text-transform:uppercase;font-size:11px;font-weight:700;letter-spacing:1px;color:#475569;margin-bottom:56px;">Wykonawca</div>
      <div style="width:200px;border-bottom:1px solid #0F172A;margin:0 auto 8px;"></div>
      <p style="margin:4px 0;">${blank(b.signatures.contractorName, 'IMIĘ NAZWISKO')}</p>
      <p style="margin:4px 0;color:#475569;">Data: ${blank(b.signatures.contractorDate, 'DATA')}</p>
    </div>
    <div>
      <div style="text-transform:uppercase;font-size:11px;font-weight:700;letter-spacing:1px;color:#475569;margin-bottom:56px;">Zamawiający</div>
      <div style="width:200px;border-bottom:1px solid #0F172A;margin:0 auto 8px;"></div>
      <p style="margin:4px 0;">${blank(b.signatures.clientName, 'IMIĘ NAZWISKO')}</p>
      <p style="margin:4px 0;color:#475569;">Data: ${blank(b.signatures.clientDate, 'DATA')}</p>
    </div>
  </div>
</div>`
}

function renderSection(
    key: MobileSectionKey,
    b: ContractMobileBlocks,
    editorMode: boolean,
    activeSection?: string | null,
): string {
    switch (key) {
        case 'parties': return renderParties(b, editorMode, activeSection)
        case 'subject': return renderSubject(b, editorMode, activeSection)
        case 'scope': return renderScope(b, editorMode, activeSection)
        case 'obligations': return renderObligations(b, editorMode, activeSection)
        case 'timeline': return renderTimeline(b, editorMode, activeSection)
        case 'payment': return renderPayment(b, editorMode, activeSection)
        case 'revisions': return renderRevisions(b, editorMode, activeSection)
        case 'acceptance': return renderAcceptance(b, editorMode, activeSection)
        case 'repository': return renderRepository(b, editorMode, activeSection)
        case 'backend': return renderBackend(b, editorMode, activeSection)
        case 'gdpr': return renderGdpr(b, editorMode, activeSection)
        case 'copyright': return renderCopyright(b, editorMode, activeSection)
        case 'confidentiality': return renderConfidentiality(b, editorMode, activeSection)
        case 'warranty': return renderWarranty(b, editorMode, activeSection)
        case 'termination': return renderTermination(b, editorMode, activeSection)
        case 'general': return renderGeneral(b, editorMode, activeSection)
        default: return ''
    }
}

export function buildContractMobileHtml(
    blocks: ContractMobileBlocks,
    options: ContractMobileHtmlOptions = {},
): string {
    const { editorMode = false, zoom = 1.0, activeSection = null } = options
    const b = blocks
    const headerAttr = editorMode ? ` data-sq-section="header" style="cursor:pointer;"` : ''
    const sigAttr = editorMode ? ` data-sq-section="signatures" style="cursor:pointer;border-radius:4px;"` : ''
    const sectionsHtml = b.sections.map(key => renderSection(key, b, editorMode, activeSection)).join('\n')

    return buildHtmlDocument({
        title: 'Umowa IT — Aplikacja mobilna',
        css: buildCss(editorMode, zoom),
        body: `<main class="doc">
  <div${headerAttr}>${renderHeader(b)}${renderTitle(b)}</div>
  <div class="content" style="padding:1px 48px 40px;">
    ${sectionsHtml}
    <div${sigAttr}>${renderSignatures(b)}</div>
  </div>
  <div style="background:#F8FAFC;border-top:1px solid #E2E8F0;">
    <div class="bar-inner" style="text-align:center;padding-top:14px;padding-bottom:14px;">
      <p style="margin:0;color:#475569;font-size:11px;">${esc(b.parties.contractor.name || 'NAZWA WYKONAWCY')} · ${esc(b.parties.contractor.email || 'EMAIL')} · ${esc(b.header.website || 'www.twoja-strona.pl')}</p>
      <p style="margin:6px 0 0;color:#475569;font-size:11px;">Nr umowy: ${esc(b.header.contractNumber)}</p>
    </div>
  </div>
</main>
${editorMode ? buildEditorScript() : ''}`,
    })
}

export function buildContractMobileHtmlFromSaved(
    savedBlocks: unknown,
    options: ContractMobileHtmlOptions = {},
): string {
    const blocks = mergeMobileWithDefaults(
        savedBlocks && typeof savedBlocks === 'object'
            ? (savedBlocks as Partial<ContractMobileBlocks>)
            : null,
    )
    return buildContractMobileHtml(blocks, options)
}

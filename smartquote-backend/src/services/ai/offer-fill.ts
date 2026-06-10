// src/services/ai/offer-fill.ts
// Conversational AI that collects project details and generates ProposalBlocks JSON.
import { GoogleGenAI } from '@google/genai'
import { callGemini, extractJson } from './core'
import { createModuleLogger } from '../../lib/logger'

const log = createModuleLogger('ai:offer-fill')

export interface OfferFillMessage {
    role: 'user' | 'assistant'
    content: string
}

export interface OfferFillContext {
    clientName: string
    offerTitle: string
    currentBlocks?: Record<string, unknown>
}

export interface OfferFillResult {
    message: string
    blocks: Record<string, unknown> | null
    isComplete: boolean
}

// Marker the AI embeds when it has collected enough info
const COMPLETE_MARKER = '[[FILL_COMPLETE]]'

function buildCurrentBlocksSummary(blocks: Record<string, unknown>): string {
    try {
        const intro = (blocks.intro as { paragraphs?: string[] })?.paragraphs ?? []
        const scope = (blocks.scope as { items?: Array<{ html: string }> })?.items ?? []
        const structure = (blocks.structure as { items?: Array<{ icon: string; name: string }> })?.items ?? []
        const pricing = blocks.pricingExtra as { timeline?: string; priceType?: string } | undefined
        const lines: string[] = ['AKTUALNY STAN SZABLONU:']
        if (intro.length) lines.push(`- Wstęp: "${intro[0]?.slice(0, 100)}..."`)
        if (scope.length) lines.push(`- Zakres (${scope.length} pozycji): ${scope.slice(0, 3).map(i => i.html?.slice(0, 50)).join(', ')}...`)
        if (structure.length) lines.push(`- Struktura (${structure.length} elementów): ${structure.map(i => i.icon + ' ' + i.name).join(', ')}`)
        if (pricing?.timeline) lines.push(`- Termin: ${pricing.timeline}, typ ceny: ${pricing.priceType ?? 'gross'}`)
        return lines.join('\n')
    } catch {
        return ''
    }
}

function buildOfferFillSystemPrompt(ctx: OfferFillContext): string {
    const hasBlocks = !!ctx.currentBlocks
    const blocksSummary = hasBlocks && ctx.currentBlocks
        ? buildCurrentBlocksSummary(ctx.currentBlocks)
        : ''

    const mode = hasBlocks
        ? `Szablon jest już częściowo wypełniony. Możesz go modyfikować, poprawiać i rozwijać na prośbę użytkownika.
Możesz zmienić dowolną sekcję: wstęp, zakres, strukturę, ikony, termin, CTA.
Jeśli użytkownik prosi o zmianę konkretnej sekcji (np. "dodaj ikony", "zmień zakres") — zrób to i zwróć pełny zaktualizowany JSON.`
        : `Przeprowadź krótką rozmowę (maksymalnie 4-5 pytań) aby zebrać:
1. Krótki opis projektu / branżę klienta
2. Główne funkcje/podstrony strony (lista 5-10 elementów)
3. Szacowany termin realizacji
4. Czy cena jest netto czy brutto
5. Ewentualne dodatkowe informacje (stack, CMS, integracje)`

    return `Jesteś Markiem — doświadczonym copywriterem i handlowcem B2B z 15 latami praktyki w sprzedaży usług IT i tworzeniu stron internetowych.
Twoje oferty wygrywają przetargi. Wiesz jak pisać, żeby klient czuł że to rozwiązanie jest stworzone specjalnie dla niego.

ZASADY TWOJEGO WARSZTATU:
- Piszesz językiem korzyści, nie cech (nie "robimy strony" → "Twoi klienci znajdą Cię w Google i zadzwonią sami")
- Unikasz ogólników ("profesjonalna strona") — zawsze konkretnie i branżowo
- Zakres prac opisujesz tak, żeby klient widział wartość każdej pozycji, nie tylko nazwę
- Struktura strony = propozycja wartości dla końcowego użytkownika klienta
- Ikony w liście zakresu dobierasz tematycznie i spójnie (np. 🏠 dla nieruchomości, ⚖️ dla prawnika)
- CTA piszesz ciepło ale asertywnie — bez "zachęcam", "proszę o kontakt", zamiast tego konkrety
- Intro oferty zaczyna się od empatii wobec potrzeby klienta, nie od przedstawiania siebie

AKTUALNY KONTEKST:
Klient: "${ctx.clientName}"
Tytuł oferty: "${ctx.offerTitle}"
${blocksSummary ? '\n' + blocksSummary + '\n' : ''}
${mode}

ZASADY ROZMOWY:
- Zadaj jedno, konkretne pytanie na raz
- Jeśli branża klienta jest znana — od razu sugeruj ikony i język branżowy bez pytania
- Gdy masz dość informacji lub użytkownik prosi o zmianę — działaj natychmiast, nie pytaj o potwierdzenie
- Nie pytaj o cenę — pobierana automatycznie
- Gdy generujesz/aktualizujesz szablon: napisz jedno zdanie co zmieniłeś i dlaczego, zakończ znacznikiem ${COMPLETE_MARKER}

Za znacznikiem ${COMPLETE_MARKER} umieść TYLKO poprawny JSON zgodny z poniższym schematem:

{
  "version": 1,
  "page1Sections": ["intro", "structure"],
  "page2Sections": ["scope", "pricingExtra", "about"],
  "header": { "enabled": true, "tag": "Oferta handlowa" },
  "footer": { "enabled": true, "customNote": "indywidualnie", "showAuthor": true },
  "intro": {
    "enabled": true,
    "paragraphs": ["Akapit powitalny 1-2 zdania.", "Akapit drugi 1-2 zdania o projekcie."]
  },
  "demo": { "enabled": false, "title": "", "body": "", "urls": [] },
  "structure": {
    "enabled": true,
    "title": "Proponowana struktura strony",
    "items": [
      { "icon": "📋", "name": "Nazwa podstrony", "description": "Krótki opis" }
    ],
    "note": ""
  },
  "scope": {
    "enabled": true,
    "title": "Pełny zakres realizacji",
    "items": [{ "html": "Opis pozycji zakresu" }]
  },
  "testing": { "enabled": false, "intro": "", "cards": [] },
  "technology": { "enabled": false, "body": "", "options": [] },
  "pricingExtra": {
    "enabled": true,
    "timeline": "X tygodnie/tygodni",
    "timelineSub": "od ustalenia szczegółów",
    "contractType": "Umowa, faktura VAT",
    "contractSub": "pełna transparentność",
    "priceOverride": null,
    "priceType": "net"
  },
  "about": {
    "enabled": true,
    "ctaText": "2-3 zdania zachęcające do podjęcia współpracy."
  }
}

Wypełnij JSON na podstawie zebranych informacji. JSON musi być kompletny i poprawny.`
}

function buildConversationPrompt(
    systemPrompt: string,
    history: OfferFillMessage[],
    userMessage: string,
): string {
    const lines: string[] = [systemPrompt, '', '--- HISTORIA ROZMOWY ---']
    for (const msg of history) {
        lines.push(`${msg.role === 'user' ? 'Użytkownik' : 'Asystent'}: ${msg.content}`)
    }
    lines.push(`Użytkownik: ${userMessage}`)
    lines.push('')
    lines.push('Asystent:')
    return lines.join('\n')
}

function parseResponse(raw: string): { message: string; blocks: Record<string, unknown> | null } {
    const markerIdx = raw.indexOf(COMPLETE_MARKER)
    if (markerIdx === -1) {
        return { message: raw.trim(), blocks: null }
    }

    const message = raw.slice(0, markerIdx).trim()
    const jsonPart = raw.slice(markerIdx + COMPLETE_MARKER.length).trim()
    const blocks = extractJson(jsonPart) as Record<string, unknown> | null

    return { message, blocks }
}

export async function offerFillChat(
    ai: GoogleGenAI | null,
    context: OfferFillContext,
    history: OfferFillMessage[],
    userMessage: string,
): Promise<OfferFillResult> {
    if (!ai) {
        return {
            message: '⚠️ AI nie jest skonfigurowane. Dodaj GEMINI_API_KEY.',
            blocks: null,
            isComplete: false,
        }
    }

    try {
        const systemPrompt = buildOfferFillSystemPrompt(context)
        const prompt = buildConversationPrompt(systemPrompt, history, userMessage)
        const raw = await callGemini(ai, prompt)
        const { message, blocks } = parseResponse(raw)

        return {
            message: message || 'Generuję ofertę...',
            blocks,
            isComplete: blocks !== null,
        }
    } catch (error) {
        log.error({ error }, 'offer-fill chat failed')
        return {
            message: '❌ Błąd komunikacji z AI. Spróbuj ponownie.',
            blocks: null,
            isComplete: false,
        }
    }
}

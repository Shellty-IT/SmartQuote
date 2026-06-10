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
}

export interface OfferFillResult {
    message: string
    blocks: Record<string, unknown> | null
    isComplete: boolean
}

// Marker the AI embeds when it has collected enough info
const COMPLETE_MARKER = '[[FILL_COMPLETE]]'

function buildOfferFillSystemPrompt(ctx: OfferFillContext): string {
    return `Jesteś asystentem pomagającym wypełnić szablon oferty na stronę internetową dla klienta "${ctx.clientName}".
Tytuł oferty: "${ctx.offerTitle}".

Twoim zadaniem jest przeprowadzić krótką rozmowę (maksymalnie 4-5 pytań) aby zebrać:
1. Krótki opis projektu / branżę klienta
2. Główne funkcje/podstrony strony (lista 5-10 elementów)
3. Szacowany termin realizacji
4. Czy cena jest netto czy brutto (jeśli user poda cenę)
5. Ewentualne dodatkowe informacje (stack, CMS, integracje)

Zasady rozmowy:
- Zadaj jedno pytanie na raz (nie bombarduj wieloma)
- Bądź konkretny i profesjonalny, pisz po polsku
- Gdy masz wystarczające informacje (min. opis + zakres prac), wygeneruj bloki i zakończ
- Nie pytaj o cenę — zostanie automatycznie pobrana z pozycji oferty
- Gdy masz dość info: powiedz "Świetnie, generuję ofertę..." i zakończ wiadomość znacznikiem ${COMPLETE_MARKER}

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

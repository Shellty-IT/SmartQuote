// src/services/ai/offer-fill.ts
// Conversational AI that collects project details and generates ProposalBlocks JSON.
import { GoogleGenAI } from '@google/genai'
import { extractJson } from './core'
import { config } from '../../config'
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

const COMPLETE_MARKER = '[[FILL_COMPLETE]]'

function buildCurrentBlocksSummary(blocks: Record<string, unknown>): string {
    try {
        const intro = (blocks.intro as { enabled?: boolean; paragraphs?: string[] } | undefined)
        const scope = (blocks.scope as { enabled?: boolean; items?: Array<{ html: string }> } | undefined)
        const structure = (blocks.structure as { enabled?: boolean; items?: Array<{ icon: string; name: string; description: string }> } | undefined)
        const pricing = blocks.pricingExtra as { enabled?: boolean; timeline?: string; priceType?: string } | undefined
        const about = blocks.about as { enabled?: boolean; ctaText?: string } | undefined

        const lines: string[] = ['=== AKTUALNY STAN SZABLONU ===']

        if (intro?.enabled && intro.paragraphs?.length) {
            lines.push(`WSTĘP (${intro.paragraphs.length} akapity):`)
            intro.paragraphs.forEach((p, i) => lines.push(`  [${i + 1}] ${p.slice(0, 200)}`))
        } else {
            lines.push('WSTĘP: wyłączony lub pusty')
        }

        if (structure?.enabled && structure.items?.length) {
            lines.push(`STRUKTURA STRONY (${structure.items.length} elementów):`)
            structure.items.forEach(item => lines.push(`  ${item.icon} ${item.name} — ${item.description?.slice(0, 80)}`))
        } else {
            lines.push('STRUKTURA: wyłączona lub pusta')
        }

        if (scope?.enabled && scope.items?.length) {
            lines.push(`ZAKRES PRAC (${scope.items.length} pozycji):`)
            scope.items.slice(0, 8).forEach((item, i) => lines.push(`  [${i + 1}] ${item.html?.slice(0, 120)}`))
            if (scope.items.length > 8) lines.push(`  ... i ${scope.items.length - 8} więcej`)
        } else {
            lines.push('ZAKRES: wyłączony lub pusty')
        }

        if (pricing?.enabled) {
            lines.push(`WYCENA: termin="${pricing.timeline}", typ ceny="${pricing.priceType ?? 'gross'}"`)
        }

        if (about?.enabled && about.ctaText) {
            lines.push(`CTA: "${about.ctaText.slice(0, 150)}"`)
        }

        lines.push('=== KONIEC STANU ===')
        return lines.join('\n')
    } catch {
        return ''
    }
}

function buildSystemPrompt(ctx: OfferFillContext): string {
    const hasContent = !!ctx.currentBlocks
    const blocksSummary = hasContent && ctx.currentBlocks
        ? '\n' + buildCurrentBlocksSummary(ctx.currentBlocks) + '\n'
        : ''

    const modeInstructions = hasContent
        ? `Szablon jest już częściowo wypełniony — widzisz jego aktualny stan powyżej.
Możesz modyfikować dowolną sekcję na prośbę użytkownika.
Gdy użytkownik pyta "co jest już wypełnione" — opisz mu aktualny stan z powyższego zestawienia.
Gdy prosi o zmianę (np. "dodaj ikony", "zmień zakres na prawnika") — wprowadź zmiany i zwróć pełny JSON.
Gdy prosi o wygenerowanie od zera — wygeneruj kompletny nowy szablon.`
        : `Przeprowadź krótką rozmowę (maksymalnie 3-4 pytania) aby zebrać:
1. Opis branży / działalności klienta
2. Główne podstrony / funkcje serwisu (5-10 elementów)
3. Przybliżony termin realizacji
Gdy masz te informacje — od razu generuj szablon. Nie pytaj o więcej.`

    return `Jesteś Markiem — doświadczonym copywriterem i handlowcem B2B z 15 latami praktyki w tworzeniu ofert na usługi IT i strony internetowe. Twoje oferty wygrywają przetargi.

KONTEKST:
Klient: "${ctx.clientName}"
Tytuł oferty: "${ctx.offerTitle}"
${blocksSummary}
TRYB PRACY:
${modeInstructions}

ZASADY PISANIA:
- Język korzyści, nie cech ("Twoi klienci znajdą Cię w Google" zamiast "SEO")
- Konkretnie i branżowo — zero ogólników jak "profesjonalna strona"
- Ikony w zakresie dobieraj tematycznie (🏠 nieruchomości, ⚖️ prawnik, 🍕 gastronomia)
- CTA ciepłe ale asertywne — bez "zachęcam", bez "proszę o kontakt"
- Wstęp zaczyna się od empatii wobec potrzeby klienta

ZASADY ROZMOWY:
- Jedno pytanie na raz, krótko i konkretnie
- Jeśli branża jest oczywista z nazwy klienta lub tytułu — zaproponuj ikony bez pytania
- Gdy masz wystarczające informacje — DZIAŁAJ natychmiast, nie pytaj o potwierdzenie
- Gdy użytkownik prosi o zmianę czegoś konkretnego — zrób to od razu
- NIE pytaj o cenę (pobierana z systemu automatycznie)

OCHRONA SEKCJI (KRYTYCZNE):
- Gdy użytkownik prosi o zmianę KONKRETNEJ sekcji (np. "wypełnij strukturę"), zmieniaj TYLKO tę sekcję.
- Wszystkie pozostałe sekcje SKOPIUJ DOKŁADNIE tak jak są w AKTUALNYM STANIE SZABLONU — bez żadnych modyfikacji.
- NIGDY nie usuwaj, nie czyść, nie "resetuj" sekcji których użytkownik nie wymienił.
- Jeśli sekcja ma enabled:true w aktualnym stanie — w JSON odpowiedzi też musi mieć enabled:true (chyba że user prosił o zmianę).
- page1Sections i page2Sections: zachowaj DOKŁADNIE tak jak są, chyba że user prosił o reorganizację.

KIEDY GENEROWAĆ/AKTUALIZOWAĆ SZABLON:
Gdy masz dane do wygenerowania lub gdy użytkownik prosi o zmianę:
1. Napisz jedno zdanie: co zmieniłeś/zrobiłeś i dlaczego
2. Dodaj znacznik ${COMPLETE_MARKER}
3. Bezpośrednio za znacznikiem (bez żadnego tekstu między) umieść TYLKO kompletny JSON

SCHEMAT JSON (wypełnij wszystkie pola):
{
  "version": 1,
  "page1Sections": ["intro", "structure"],
  "page2Sections": ["scope", "pricingExtra", "about"],
  "header": { "enabled": true, "tag": "Oferta handlowa" },
  "footer": { "enabled": true, "customNote": "indywidualnie", "showAuthor": true },
  "intro": {
    "enabled": true,
    "paragraphs": ["Akapit 1 — empatia wobec potrzeby klienta.", "Akapit 2 — co konkretnie dostarczasz."]
  },
  "demo": { "enabled": false, "title": "", "body": "", "urls": [] },
  "structure": {
    "enabled": true,
    "title": "Proponowana struktura strony",
    "items": [{ "icon": "📋", "name": "Nazwa podstrony", "description": "Wartość dla użytkownika końcowego" }],
    "note": ""
  },
  "scope": {
    "enabled": true,
    "title": "Pełny zakres realizacji",
    "items": [{ "html": "Pozycja zakresu — konkretna wartość, nie tylko nazwa" }]
  },
  "testing": { "enabled": false, "intro": "", "cards": [] },
  "technology": { "enabled": false, "body": "", "options": [] },
  "pricingExtra": {
    "enabled": true,
    "timeline": "X tygodnie",
    "timelineSub": "od ustalenia szczegółów i przekazania materiałów",
    "contractType": "Umowa, faktura VAT",
    "contractSub": "pełna transparentność",
    "priceOverride": null,
    "priceType": "gross"
  },
  "about": {
    "enabled": true,
    "ctaText": "2-3 zdania zachęcające do współpracy — ciepłe i konkretne.",
    "aboutBoxTitle": "Więcej o nas i naszych realizacjach"
  }
}`
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
        const systemPrompt = buildSystemPrompt(context)

        // Build proper multi-turn contents array (Gemini role: 'user' | 'model')
        type GeminiContent = { role: 'user' | 'model'; parts: Array<{ text: string }> }
        const contents: GeminiContent[] = [
            ...history.map((msg): GeminiContent => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }],
            })),
            { role: 'user', parts: [{ text: userMessage }] },
        ]

        const response = await ai.models.generateContent({
            model: config.gemini.model,
            contents,
            config: {
                systemInstruction: systemPrompt,
                temperature: 0.85,
                maxOutputTokens: 8192,
            },
        })

        const raw = response.text ?? ''
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

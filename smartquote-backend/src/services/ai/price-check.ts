// src/services/ai/price-check.ts
import { GoogleGenAI } from '@google/genai';
import * as crypto from 'crypto';
import { MemoryCache } from '../../lib/cache';
import { callGemini } from './core';
import { createModuleLogger } from '../../lib/logger';

const log = createModuleLogger('ai:price-check');

const PRICE_CHECK_TTL = 900; // 15 minutes

export const priceCheckCache = new MemoryCache(100);

export interface PriceCheckItemInput {
    name: string;
    description?: string | null;
    quantity: number;
    unit: string;
    unitPrice: number;
    vatRate: number;
}

export interface PriceCheckInput {
    items: PriceCheckItemInput[];
    currency: string;
    clientContext?: string | null;
}

export interface PriceCheckResult {
    itemIndex: number;
    verdict: 'low' | 'fair' | 'high';
    suggestion: string;
    suggestedRange?: { min: number; max: number } | null;
}

const SYSTEM_PROMPT = `Jesteś ekspertem od wyceny usług IT w Polsce (B2B, rynek 2024-2025).
Przeanalizuj podane pozycje oferty i oceń czy ceny są rynkowe.
Odpowiedz TYLKO w JSON, bez żadnego tekstu przed ani po.
Format: array obiektów { itemIndex, verdict, suggestion, suggestedRange }.
verdict: "low" (poniżej rynku), "fair" (w normie), "high" (powyżej rynku).
suggestion: krótkie jedno zdanie po polsku.
suggestedRange: { min, max } w tej samej walucie lub null.`;

function buildPriceCheckPrompt(input: PriceCheckInput): string {
    const itemLines = input.items
        .map(
            (item, idx) =>
                `${idx}. "${item.name}"${item.description ? ` (${item.description})` : ''} — ${item.quantity} ${item.unit} × ${item.unitPrice} ${input.currency} (VAT ${item.vatRate}%)`,
        )
        .join('\n');

    const contextPart = input.clientContext
        ? `\nKontekst branżowy klienta: ${input.clientContext}`
        : '';

    return `${SYSTEM_PROMPT}

Waluta: ${input.currency}${contextPart}

Pozycje oferty:
${itemLines}

Odpowiedź TYLKO jako JSON array:`;
}

function extractJsonArray(text: string): unknown | null {
    // Try to find a JSON array in the response
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return null;
    try {
        return JSON.parse(match[0]);
    } catch {
        return null;
    }
}

function buildHash(items: PriceCheckItemInput[]): string {
    return crypto.createHash('sha256').update(JSON.stringify(items)).digest('hex').slice(0, 16);
}

export async function priceCheck(
    ai: GoogleGenAI | null,
    userId: string,
    input: PriceCheckInput,
): Promise<PriceCheckResult[]> {
    if (!ai) throw new Error('AI nie jest skonfigurowany');

    const hash = buildHash(input.items);
    const cacheKey = `price-check:${userId}:${hash}`;

    const cached = priceCheckCache.get<PriceCheckResult[]>(cacheKey);
    if (cached) {
        log.info({ userId, cacheKey }, 'Price check cache hit');
        return cached;
    }

    const prompt = buildPriceCheckPrompt(input);
    const responseText = await callGemini(ai, prompt);
    const parsed = extractJsonArray(responseText);

    if (!Array.isArray(parsed)) {
        log.warn({ userId, responseText }, 'Price check returned non-array response');
        throw new Error('Nie udało się przeanalizować odpowiedzi AI');
    }

    const results: PriceCheckResult[] = (parsed as Array<Record<string, unknown>>).map((item) => ({
        itemIndex: typeof item.itemIndex === 'number' ? item.itemIndex : 0,
        verdict: (['low', 'fair', 'high'].includes(item.verdict as string)
            ? item.verdict
            : 'fair') as 'low' | 'fair' | 'high',
        suggestion: typeof item.suggestion === 'string' ? item.suggestion : '',
        suggestedRange:
            item.suggestedRange &&
            typeof item.suggestedRange === 'object' &&
            item.suggestedRange !== null &&
            'min' in item.suggestedRange &&
            'max' in item.suggestedRange
                ? {
                      min: Number((item.suggestedRange as Record<string, unknown>).min),
                      max: Number((item.suggestedRange as Record<string, unknown>).max),
                  }
                : null,
    }));

    priceCheckCache.set(cacheKey, results, PRICE_CHECK_TTL);
    return results;
}

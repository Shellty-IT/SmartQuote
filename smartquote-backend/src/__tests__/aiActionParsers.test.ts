// src/__tests__/aiActionParsers.test.ts
// Tests for parseResponse (offer-fill) — validates JSON parsing of structured AI output.
// Note: action parsing was previously done via [AKCJA:] text markers (parseActions).
// That approach has been replaced by Gemini function calling — the model now returns
// function call parts in the response instead of inline text markers.

jest.mock('../lib/prisma', () => ({ __esModule: true, default: {} }));
jest.mock('../config', () => ({
    config: { gemini: { model: 'gemini-2.5-flash', apiKey: 'test' } },
}));

import { parseResponse } from '../services/ai/offer-fill';

// ── parseResponse (offer-fill) ────────────────────────────────────────────────
// parseResponse is a legacy fallback used in unit tests.
// In production, Gemini structured output returns { message, isComplete, blocks }
// as JSON directly — no marker splitting needed.
// The function accepts either a JSON string or plain text.

const validBlocksObj = { version: 1, intro: { enabled: true, paragraphs: ['test'] } };
const validStructuredJson = (msg: string, blocks: unknown = null) =>
    JSON.stringify({ message: msg, isComplete: blocks !== null, blocks });

describe('parseResponse', () => {
    it('returns message and null blocks for plain text (non-JSON fallback)', () => {
        const result = parseResponse('Hej, jaką branżę reprezentuje klient?');
        expect(result.message).toBe('Hej, jaką branżę reprezentuje klient?');
        expect(result.blocks).toBeNull();
    });

    it('parses structured JSON response with blocks', () => {
        const raw = validStructuredJson('Wygenerowałem szablon.', validBlocksObj);
        const { message, blocks } = parseResponse(raw);
        expect(message).toBe('Wygenerowałem szablon.');
        expect(blocks).not.toBeNull();
        expect((blocks as Record<string, unknown>).version).toBe(1);
    });

    it('parses structured JSON response without blocks (question phase)', () => {
        const raw = validStructuredJson('Jaką branżę reprezentuje klient?');
        const { message, blocks } = parseResponse(raw);
        expect(message).toBe('Jaką branżę reprezentuje klient?');
        expect(blocks).toBeNull();
    });

    it('trims whitespace from plain text fallback', () => {
        const { message } = parseResponse('  Gotowe!  ');
        expect(message).toBe('Gotowe!');
    });

    it('returns plain text when JSON is malformed', () => {
        const raw = '{invalid json here';
        const { message, blocks } = parseResponse(raw);
        expect(message).toBe(raw.trim());
        expect(blocks).toBeNull();
    });

    it('returns null blocks when JSON has null blocks field', () => {
        const raw = JSON.stringify({ message: 'Gotowe.', isComplete: false, blocks: null });
        const { blocks } = parseResponse(raw);
        expect(blocks).toBeNull();
    });

    it('returns null blocks when JSON blocks field is an array (invalid)', () => {
        const raw = JSON.stringify({ message: 'X', isComplete: true, blocks: [1, 2, 3] });
        const { blocks } = parseResponse(raw);
        expect(blocks).toBeNull();
    });

    it('extracts deeply nested blocks correctly', () => {
        const deepBlocks = { version: 1, scope: { enabled: true, items: [{ html: '<strong>Item 1</strong>' }] } };
        const raw = validStructuredJson('Oto szablon.', deepBlocks);
        const { blocks } = parseResponse(raw);
        const typed = blocks as Record<string, unknown>;
        expect((typed.scope as Record<string, unknown>).enabled).toBe(true);
    });

    it('returns empty string as message when message field is empty', () => {
        const raw = JSON.stringify({ message: '', isComplete: false, blocks: null });
        const { message } = parseResponse(raw);
        expect(message).toBe('');
    });
});

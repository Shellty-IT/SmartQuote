// src/__tests__/sanitizeHtml.test.ts
import { sanitizeRichText } from '../utils/sanitizeHtml';

describe('sanitizeRichText', () => {
    it('passes through null and undefined unchanged', () => {
        expect(sanitizeRichText(null)).toBeNull();
        expect(sanitizeRichText(undefined)).toBeUndefined();
    });

    it('keeps tags produced by the TipTap editor', () => {
        const html = '<p>Cena <strong>netto</strong> to <em>100</em> <u>PLN</u>.</p>';
        expect(sanitizeRichText(html)).toBe(html);
    });

    it('keeps lists, headings, and blockquotes', () => {
        const html = '<h2>Warunki</h2><ul><li>Jeden</li><li>Dwa</li></ul><blockquote>Cytat</blockquote>';
        expect(sanitizeRichText(html)).toBe(html);
    });

    it('strips <script> tags entirely, including their content', () => {
        expect(sanitizeRichText('<p>Cena</p><script>alert(1)</script>')).toBe('<p>Cena</p>');
    });

    it('strips event handler attributes but keeps the element', () => {
        expect(sanitizeRichText('<p onclick="alert(1)">Tekst</p>')).toBe('<p>Tekst</p>');
    });

    it('strips img tags (onerror vector)', () => {
        expect(sanitizeRichText('<img src=x onerror="alert(1)">Tekst')).toBe('Tekst');
    });

    it('drops the href on javascript: scheme links but keeps the text', () => {
        const result = sanitizeRichText('<a href="javascript:alert(1)">klik</a>');
        expect(result).not.toContain('javascript:');
        expect(result).toContain('klik');
    });

    it('keeps http/https links and adds rel="noopener noreferrer"', () => {
        const result = sanitizeRichText('<a href="https://example.com">link</a>');
        expect(result).toContain('href="https://example.com"');
        expect(result).toContain('rel="noopener noreferrer"');
    });

    it('strips iframe and svg tags', () => {
        expect(sanitizeRichText('<iframe src="https://evil.com"></iframe>Tekst')).toBe('Tekst');
        expect(sanitizeRichText('<svg onload="alert(1)"></svg>Tekst')).toBe('Tekst');
    });
});

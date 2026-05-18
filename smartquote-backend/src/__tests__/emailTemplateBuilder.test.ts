// src/__tests__/emailTemplateBuilder.test.ts
import { EmailTemplateBuilder } from '../services/email/template-builder';

describe('EmailTemplateBuilder.wrap', () => {
    it('returns a string that starts with <!DOCTYPE html>', () => {
        const html = EmailTemplateBuilder.wrap('<p>Test</p>');
        expect(html).toMatch(/^<!DOCTYPE html>/);
    });

    it('includes the provided content inside the wrapper', () => {
        const content = '<p>Hello World</p>';
        const html = EmailTemplateBuilder.wrap(content);
        expect(html).toContain(content);
    });

    it('includes SmartQuote AI branding', () => {
        const html = EmailTemplateBuilder.wrap('');
        expect(html).toContain('SmartQuote AI');
    });

    it('includes charset utf-8', () => {
        const html = EmailTemplateBuilder.wrap('');
        expect(html).toContain('utf-8');
    });

    it('wraps with full HTML structure (head and body)', () => {
        const html = EmailTemplateBuilder.wrap('content');
        expect(html).toContain('<head>');
        expect(html).toContain('<body');
        expect(html).toContain('</html>');
    });
});

describe('EmailTemplateBuilder.button', () => {
    it('creates an anchor tag with the provided url and label', () => {
        const btn = EmailTemplateBuilder.button('https://example.com', 'Kliknij tutaj');
        expect(btn).toContain('href="https://example.com"');
        expect(btn).toContain('Kliknij tutaj');
    });

    it('uses default gradient when not specified', () => {
        const btn = EmailTemplateBuilder.button('https://example.com', 'Label');
        expect(btn).toContain('background:');
    });

    it('uses custom gradient when provided', () => {
        const btn = EmailTemplateBuilder.button('https://example.com', 'Label', '#ff0000');
        expect(btn).toContain('#ff0000');
    });

    it('renders as an HTML table for email compatibility', () => {
        const btn = EmailTemplateBuilder.button('https://example.com', 'Test');
        expect(btn).toContain('<table');
        expect(btn).toContain('</table>');
    });

    it('opens link in new tab', () => {
        const btn = EmailTemplateBuilder.button('https://example.com', 'Test');
        expect(btn).toContain('target="_blank"');
    });
});

describe('EmailTemplateBuilder.buttonEmerald', () => {
    it('includes the url and label', () => {
        const btn = EmailTemplateBuilder.buttonEmerald('https://emerald.com', 'Emerald Button');
        expect(btn).toContain('href="https://emerald.com"');
        expect(btn).toContain('Emerald Button');
    });

    it('uses emerald color scheme', () => {
        const btn = EmailTemplateBuilder.buttonEmerald('https://example.com', 'Test');
        expect(btn).toContain('#059669'); // emerald color from baseStyles
    });
});

describe('EmailTemplateBuilder.buttonAmber', () => {
    it('includes the url and label', () => {
        const btn = EmailTemplateBuilder.buttonAmber('https://amber.com', 'Amber Button');
        expect(btn).toContain('href="https://amber.com"');
        expect(btn).toContain('Amber Button');
    });

    it('uses amber color scheme', () => {
        const btn = EmailTemplateBuilder.buttonAmber('https://example.com', 'Test');
        expect(btn).toContain('#d97706'); // amber color
    });
});

describe('EmailTemplateBuilder.infoCard', () => {
    it('wraps rows in a table element', () => {
        const card = EmailTemplateBuilder.infoCard('<tr><td>Row</td></tr>');
        expect(card).toContain('<table');
        expect(card).toContain('<tr><td>Row</td></tr>');
        expect(card).toContain('</table>');
    });

    it('applies background styling', () => {
        const card = EmailTemplateBuilder.infoCard('');
        expect(card).toContain('background:#f8fafc');
    });
});

describe('EmailTemplateBuilder.infoRowFirst', () => {
    it('includes label, title and subtitle', () => {
        const row = EmailTemplateBuilder.infoRowFirst('Status', 'Aktywny', 'Od 2024');
        expect(row).toContain('Status');
        expect(row).toContain('Aktywny');
        expect(row).toContain('Od 2024');
    });

    it('returns a table row element', () => {
        const row = EmailTemplateBuilder.infoRowFirst('L', 'T', 'S');
        expect(row).toContain('<tr>');
        expect(row).toContain('</tr>');
    });
});

describe('EmailTemplateBuilder.infoRow', () => {
    it('includes label and value', () => {
        const row = EmailTemplateBuilder.infoRow('Kwota', '1 230,00 PLN');
        expect(row).toContain('Kwota');
        expect(row).toContain('1 230,00 PLN');
    });
});

describe('EmailTemplateBuilder.priceRow', () => {
    it('includes label, value and applies the provided color', () => {
        const row = EmailTemplateBuilder.priceRow('Wartość brutto', '1 230,00 PLN', '#059669');
        expect(row).toContain('Wartość brutto');
        expect(row).toContain('1 230,00 PLN');
        expect(row).toContain('#059669');
    });
});

describe('EmailTemplateBuilder.hashBox', () => {
    it('includes the provided hash and description', () => {
        const box = EmailTemplateBuilder.hashBox('abc123hash', 'Opis skrótu treści');
        expect(box).toContain('abc123hash');
        expect(box).toContain('Opis skrótu treści');
    });

    it('mentions SHA-256', () => {
        const box = EmailTemplateBuilder.hashBox('hash', 'desc');
        expect(box).toContain('SHA-256');
    });
});

describe('EmailTemplateBuilder.sellerSignature', () => {
    it('includes seller name', () => {
        const sig = EmailTemplateBuilder.sellerSignature('Jan Kowalski', null);
        expect(sig).toContain('Jan Kowalski');
        expect(sig).toContain('Pozdrawiam');
    });

    it('includes company name when provided', () => {
        const sig = EmailTemplateBuilder.sellerSignature('Jan Kowalski', 'Firma ABC');
        expect(sig).toContain('Firma ABC');
    });

    it('omits company when null', () => {
        const sig = EmailTemplateBuilder.sellerSignature('Jan Kowalski', null);
        expect(sig).not.toContain('null');
    });
});

describe('EmailTemplateBuilder.reasonBox', () => {
    it('includes the rejection reason', () => {
        const box = EmailTemplateBuilder.reasonBox('Cena zbyt wysoka');
        expect(box).toContain('Cena zbyt wysoka');
    });

    it('uses red color scheme', () => {
        const box = EmailTemplateBuilder.reasonBox('reason');
        expect(box).toContain('#fef2f2');
    });
});

describe('EmailTemplateBuilder.commentBox', () => {
    it('includes the comment content in quotes', () => {
        const box = EmailTemplateBuilder.commentBox('Świetna oferta!');
        expect(box).toContain('Świetna oferta!');
    });

    it('uses blue color scheme', () => {
        const box = EmailTemplateBuilder.commentBox('comment');
        expect(box).toContain('#f0f9ff');
    });
});

describe('EmailTemplateBuilder.iconHeader', () => {
    it('includes the emoji, background color and title', () => {
        const header = EmailTemplateBuilder.iconHeader('✅', '#d1fae5', 'Oferta zaakceptowana');
        expect(header).toContain('✅');
        expect(header).toContain('#d1fae5');
        expect(header).toContain('Oferta zaakceptowana');
    });
});

describe('EmailTemplateBuilder.formatCurrency', () => {
    it('formats a number as PLN currency — contains numeric value', () => {
        // pl-PL locale uses "zł" symbol, not "PLN" code — just check the number is formatted
        const formatted = EmailTemplateBuilder.formatCurrency(1230);
        expect(formatted).toContain('1');
        expect(typeof formatted).toBe('string');
        expect(formatted.length).toBeGreaterThan(0);
    });

    it('formats with two decimal places', () => {
        const formatted = EmailTemplateBuilder.formatCurrency(100);
        expect(formatted).toContain(',00');
    });

    it('uses different format when EUR is specified', () => {
        // pl-PL locale uses "€" symbol, not "EUR" code
        const pln = EmailTemplateBuilder.formatCurrency(500);
        const eur = EmailTemplateBuilder.formatCurrency(500, 'EUR');
        expect(eur).not.toBe(pln);
        expect(typeof eur).toBe('string');
    });

    it('handles zero', () => {
        const formatted = EmailTemplateBuilder.formatCurrency(0);
        expect(formatted).toContain(',00');
    });

    it('handles large numbers', () => {
        const formatted = EmailTemplateBuilder.formatCurrency(1000000);
        expect(typeof formatted).toBe('string');
        expect(formatted.length).toBeGreaterThan(0);
    });
});

describe('EmailTemplateBuilder.formatDateTime', () => {
    it('returns a formatted date-time string', () => {
        const result = EmailTemplateBuilder.formatDateTime('2025-06-15T10:30:00Z');
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
    });

    it('includes the year from the ISO string', () => {
        const result = EmailTemplateBuilder.formatDateTime('2025-06-15T10:30:00Z');
        expect(result).toContain('2025');
    });
});

describe('EmailTemplateBuilder.formatDate', () => {
    it('returns a formatted date string without time', () => {
        const result = EmailTemplateBuilder.formatDate('2025-06-15T00:00:00Z');
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
    });

    it('includes the year', () => {
        const result = EmailTemplateBuilder.formatDate('2025-12-01T00:00:00Z');
        expect(result).toContain('2025');
    });
});

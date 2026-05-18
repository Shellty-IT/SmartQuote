// src/__tests__/aiPrompts.test.ts
import {
    buildSystemPrompt,
    buildChatPrompt,
    buildOfferGenerationPrompt,
    buildEmailPrompt,
    buildClientAnalysisPrompt,
    buildPriceInsightPrompt,
    buildObserverPrompt,
    buildClosingStrategyPrompt,
    buildPostMortemPrompt,
} from '../services/ai/prompts';
import type { ClientAnalysisData } from '../services/ai/prompts';
import type { AIContext, EmailGenerationContext } from '../types';

// ── buildSystemPrompt ────────────────────────────────────────────────────────

describe('buildSystemPrompt', () => {
    const baseContext: AIContext = {
        userId: 'user-1',
        stats: { totalClients: 10, activeOffers: 5, pendingFollowUps: 3, monthlyRevenue: 12000 },
        clients: [],
        offers: [],
        followUps: [],
    };

    it('returns a non-empty string', () => {
        const result = buildSystemPrompt(baseContext);
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
    });

    it('includes client count from stats', () => {
        const result = buildSystemPrompt(baseContext);
        expect(result).toContain('10');
    });

    it('includes active offer count', () => {
        const result = buildSystemPrompt(baseContext);
        expect(result).toContain('5');
    });

    it('handles missing stats gracefully', () => {
        const ctx: AIContext = { userId: 'user-1' };
        const result = buildSystemPrompt(ctx);
        expect(result).toContain('0'); // defaults to 0
    });

    it('includes client names when present', () => {
        const ctx: AIContext = {
            userId: 'user-1',
            clients: [{ id: 'c1', name: 'Kowalski', company: 'ABC', email: null, type: 'PERSON', isActive: true }],
        };
        const result = buildSystemPrompt(ctx);
        expect(result).toContain('Kowalski');
    });

    it('shows "Brak klientów" when clients array is empty', () => {
        const result = buildSystemPrompt(baseContext);
        expect(result).toContain('Brak klientów');
    });

    it('includes follow-up info when present', () => {
        const ctx: AIContext = {
            userId: 'user-1',
            followUps: [
                {
                    id: 'f1',
                    title: 'Zadzwoń',
                    type: 'CALL',
                    status: 'PENDING',
                    priority: 'HIGH',
                    dueDate: new Date('2025-06-01'),
                    client: null,
                },
            ],
        };
        const result = buildSystemPrompt(ctx);
        expect(result).toContain('Zadzwoń');
    });
});

// ── buildChatPrompt ──────────────────────────────────────────────────────────

describe('buildChatPrompt', () => {
    it('appends the message after system prompt', () => {
        const result = buildChatPrompt('SYSTEM', [], 'Cześć!');
        expect(result).toContain('Cześć!');
        expect(result).toContain('SYSTEM');
    });

    it('includes conversation history when provided', () => {
        const history = [
            { role: 'user', content: 'Poprzednie pytanie' },
            { role: 'assistant', content: 'Poprzednia odpowiedź' },
        ];
        const result = buildChatPrompt('SYS', history, 'Nowe pytanie');
        expect(result).toContain('Poprzednie pytanie');
        expect(result).toContain('Poprzednia odpowiedź');
        expect(result).toContain('POPRZEDNIA ROZMOWA:');
    });

    it('does not include conversation section when history is empty', () => {
        const result = buildChatPrompt('SYS', [], 'Pytanie');
        expect(result).not.toContain('POPRZEDNIA ROZMOWA:');
    });

    it('ends with "Asystent:"', () => {
        const result = buildChatPrompt('SYS', [], 'Pytanie');
        expect(result.trim().endsWith('Asystent:')).toBe(true);
    });
});

// ── buildOfferGenerationPrompt ────────────────────────────────────────────────

describe('buildOfferGenerationPrompt', () => {
    it('includes the provided description', () => {
        const result = buildOfferGenerationPrompt('Oprogramowanie ERP dla firmy');
        expect(result).toContain('Oprogramowanie ERP dla firmy');
    });

    it('returns JSON structure instructions', () => {
        const result = buildOfferGenerationPrompt('desc');
        expect(result).toContain('"title"');
        expect(result).toContain('"items"');
    });

    it('mentions PLN currency', () => {
        const result = buildOfferGenerationPrompt('desc');
        expect(result).toContain('PLN');
    });
});

// ── buildEmailPrompt ──────────────────────────────────────────────────────────

describe('buildEmailPrompt', () => {
    const ctx: EmailGenerationContext = { clientName: 'Pan Nowak', offerTitle: 'Oferta Pro' };

    it('builds offer_send email prompt with client name', () => {
        const result = buildEmailPrompt('offer_send', ctx);
        expect(result).toContain('Pan Nowak');
        expect(result).toContain('Oferta Pro');
    });

    it('builds followup email prompt', () => {
        const result = buildEmailPrompt('followup', ctx);
        expect(result).toContain('Pan Nowak');
    });

    it('builds thank_you email prompt', () => {
        const result = buildEmailPrompt('thank_you', ctx);
        expect(result).toContain('Pan Nowak');
    });

    it('builds reminder email prompt', () => {
        const result = buildEmailPrompt('reminder', ctx);
        expect(result).toContain('Pan Nowak');
    });

    it('includes customContext when provided', () => {
        const ctxWithExtra: EmailGenerationContext = { ...ctx, customContext: 'klient jest VIP' };
        const result = buildEmailPrompt('offer_send', ctxWithExtra);
        expect(result).toContain('klient jest VIP');
    });

    it('returns a non-empty string for all email types', () => {
        const types = ['offer_send', 'followup', 'thank_you', 'reminder'] as const;
        types.forEach((t) => {
            const result = buildEmailPrompt(t, ctx);
            expect(result.length).toBeGreaterThan(0);
        });
    });
});

// ── buildClientAnalysisPrompt ─────────────────────────────────────────────────

describe('buildClientAnalysisPrompt', () => {
    const client: ClientAnalysisData = {
        name: 'Jan Kowalski',
        company: 'ABC Sp. z o.o.',
        type: 'COMPANY',
        email: 'jan@abc.pl',
        isActive: true,
        offers: [{ title: 'Oferta 1', status: 'SENT', totalGross: 1230 }],
        contracts: [{ title: 'Umowa 1', status: 'ACTIVE' }],
        followUps: [{ title: 'Follow-up 1', status: 'PENDING', type: 'CALL' }],
    };

    it('includes client name', () => {
        const result = buildClientAnalysisPrompt(client);
        expect(result).toContain('Jan Kowalski');
    });

    it('includes company name', () => {
        const result = buildClientAnalysisPrompt(client);
        expect(result).toContain('ABC Sp. z o.o.');
    });

    it('marks active client as "Aktywny"', () => {
        const result = buildClientAnalysisPrompt(client);
        expect(result).toContain('Aktywny');
    });

    it('marks inactive client as "Nieaktywny"', () => {
        const inactive = { ...client, isActive: false };
        const result = buildClientAnalysisPrompt(inactive);
        expect(result).toContain('Nieaktywny');
    });

    it('includes offer count', () => {
        const result = buildClientAnalysisPrompt(client);
        expect(result).toContain('1');
    });

    it('shows "Brak" when no offers', () => {
        const noOffers = { ...client, offers: [] };
        const result = buildClientAnalysisPrompt(noOffers);
        expect(result).toContain('Brak');
    });

    it('returns JSON format instructions', () => {
        const result = buildClientAnalysisPrompt(client);
        expect(result).toContain('"score"');
        expect(result).toContain('"potential"');
    });
});

// ── buildPriceInsightPrompt ───────────────────────────────────────────────────

describe('buildPriceInsightPrompt', () => {
    it('includes item name', () => {
        const result = buildPriceInsightPrompt('Usługa IT', 'IT', 'Dane historyczne', 'Wnioski');
        expect(result).toContain('Usługa IT');
    });

    it('includes category when provided', () => {
        const result = buildPriceInsightPrompt('Item', 'KATEGORIA', 'hist', 'legacy');
        expect(result).toContain('KATEGORIA');
    });

    it('handles undefined category', () => {
        const result = buildPriceInsightPrompt('Item', undefined, 'hist', 'legacy');
        expect(result).not.toContain('KATEGORIA:'); // line not included when undefined
    });

    it('includes historical summary', () => {
        const result = buildPriceInsightPrompt('Item', undefined, 'Dane XYZ', 'Wnioski ABC');
        expect(result).toContain('Dane XYZ');
        expect(result).toContain('Wnioski ABC');
    });

    it('returns JSON structure with confidence field', () => {
        const result = buildPriceInsightPrompt('Item', undefined, 'hist', 'legacy');
        expect(result).toContain('"confidence"');
        expect(result).toContain('"suggestedMin"');
    });
});

// ── buildObserverPrompt ────────────────────────────────────────────────────────

describe('buildObserverPrompt', () => {
    const data = {
        offerNumber: 'OFF/2025/001',
        offerTitle: 'Oferta testowa',
        clientName: 'Klient Testowy',
        clientCompany: 'Firma Testowa',
        clientType: 'COMPANY',
        totalGross: '1 230,00',
        statusLabel: 'Wysłana',
        itemsFormatted: '- Produkt A: 100 PLN',
        viewsFormatted: '- 2025-06-01 10:00',
        viewCount: 3,
        interactionsFormatted: '- Kliknął',
        interactionCount: 1,
        clientCommentsFormatted: 'Brak komentarzy',
        clientCommentCount: 0,
    };

    it('includes offer number', () => {
        const result = buildObserverPrompt(data);
        expect(result).toContain('OFF/2025/001');
    });

    it('includes client name', () => {
        const result = buildObserverPrompt(data);
        expect(result).toContain('Klient Testowy');
    });

    it('includes company when provided', () => {
        const result = buildObserverPrompt(data);
        expect(result).toContain('Firma Testowa');
    });

    it('includes view count', () => {
        const result = buildObserverPrompt(data);
        expect(result).toContain('3');
    });

    it('returns JSON structure with clientIntent', () => {
        const result = buildObserverPrompt(data);
        expect(result).toContain('"clientIntent"');
        expect(result).toContain('"engagementScore"');
    });

    it('handles null company', () => {
        const noCompany = { ...data, clientCompany: null };
        const result = buildObserverPrompt(noCompany);
        expect(result).not.toContain('null');
    });
});

// ── buildClosingStrategyPrompt ────────────────────────────────────────────────

describe('buildClosingStrategyPrompt', () => {
    const data = {
        offerNumber: 'OFF/001',
        offerTitle: 'Oferta',
        clientName: 'Klient',
        clientCompany: null,
        clientType: 'PERSON',
        totalGross: '500',
        itemsFormatted: '- Item 1',
        observerSummary: 'Klient jest zainteresowany',
        clientCommentsText: 'Pytanie o rabat',
        sellerCommentsText: 'Odpowiedź sprzedawcy',
    };

    it('includes offer number', () => {
        const result = buildClosingStrategyPrompt(data);
        expect(result).toContain('OFF/001');
    });

    it('includes observer summary', () => {
        const result = buildClosingStrategyPrompt(data);
        expect(result).toContain('Klient jest zainteresowany');
    });

    it('returns JSON with three strategies', () => {
        const result = buildClosingStrategyPrompt(data);
        expect(result).toContain('"aggressive"');
        expect(result).toContain('"partnership"');
        expect(result).toContain('"quickClose"');
    });
});

// ── buildPostMortemPrompt ─────────────────────────────────────────────────────

describe('buildPostMortemPrompt', () => {
    const data = {
        offerNumber: 'OFF/001',
        offerTitle: 'Oferta Testowa',
        outcome: 'ACCEPTED' as const,
        clientName: 'Klient',
        clientCompany: 'Firma',
        clientType: 'COMPANY',
        totalGross: '12 300',
        variantBlock: 'WARIANTOWANIE: brak wariantów',
        selectionSummary: '3/3 pozycje zaznaczone',
        itemsList: '- Produkt A',
        viewCount: 5,
        interactionTimeline: '- Kliknął 2 razy',
        interactionCount: 2,
        commentsText: 'Brak komentarzy',
    };

    it('includes offer number', () => {
        const result = buildPostMortemPrompt(data);
        expect(result).toContain('OFF/001');
    });

    it('shows ZAAKCEPTOWANA for ACCEPTED outcome', () => {
        const result = buildPostMortemPrompt(data);
        expect(result).toContain('ZAAKCEPTOWANA');
    });

    it('shows ODRZUCONA for REJECTED outcome', () => {
        const rejected = { ...data, outcome: 'REJECTED' as const };
        const result = buildPostMortemPrompt(rejected);
        expect(result).toContain('ODRZUCONA');
    });

    it('includes view count', () => {
        const result = buildPostMortemPrompt(data);
        expect(result).toContain('5');
    });

    it('returns JSON structure with keyLessons', () => {
        const result = buildPostMortemPrompt(data);
        expect(result).toContain('"keyLessons"');
        expect(result).toContain('"summary"');
    });

    it('handles null company', () => {
        const noCompany = { ...data, clientCompany: null };
        const result = buildPostMortemPrompt(noCompany);
        expect(result).not.toContain('(null)');
    });
});

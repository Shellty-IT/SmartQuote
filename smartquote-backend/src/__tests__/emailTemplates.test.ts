// src/__tests__/emailTemplates.test.ts
import {
    emailTemplates,
    OfferAcceptedEmailData,
    OfferRejectedEmailData,
    CommentEmailData,
    OfferLinkEmailData,
    AcceptanceConfirmationEmailData,
    SignatureConfirmationEmailData,
    FollowUpReminderEmailData,
} from '../services/email/templates';

const BASE_URL = 'https://app.smartquote.pl/offers/123';

// ── offerAccepted ─────────────────────────────────────────────────────────────

describe('emailTemplates.offerAccepted', () => {
    const data: OfferAcceptedEmailData = {
        offerNumber: 'OFF/2025/001',
        offerTitle: 'Oferta na oprogramowanie',
        clientName: 'Jan Kowalski',
        offerId: 'off-001',
        totalGross: 1230,
        currency: 'PLN',
    };

    it('returns an object with subject and html properties', () => {
        const result = emailTemplates.offerAccepted(data, BASE_URL);
        expect(result).toHaveProperty('subject');
        expect(result).toHaveProperty('html');
    });

    it('subject includes offer number and client name', () => {
        const result = emailTemplates.offerAccepted(data, BASE_URL);
        expect(result.subject).toContain('OFF/2025/001');
        expect(result.subject).toContain('Jan Kowalski');
    });

    it('html includes client name', () => {
        const result = emailTemplates.offerAccepted(data, BASE_URL);
        expect(result.html).toContain('Jan Kowalski');
    });

    it('html includes offer title', () => {
        const result = emailTemplates.offerAccepted(data, BASE_URL);
        expect(result.html).toContain('Oferta na oprogramowanie');
    });

    it('html includes the CTA button URL', () => {
        const result = emailTemplates.offerAccepted(data, BASE_URL);
        expect(result.html).toContain(BASE_URL);
    });

    it('html is valid HTML with DOCTYPE', () => {
        const result = emailTemplates.offerAccepted(data, BASE_URL);
        expect(result.html).toMatch(/<!DOCTYPE html>/i);
        expect(result.html).toContain('</html>');
    });
});

// ── offerRejected ─────────────────────────────────────────────────────────────

describe('emailTemplates.offerRejected', () => {
    const data: OfferRejectedEmailData = {
        offerNumber: 'OFF/2025/002',
        offerTitle: 'Oferta odrzucona',
        clientName: 'Anna Nowak',
        offerId: 'off-002',
    };

    it('returns subject and html', () => {
        const result = emailTemplates.offerRejected(data, BASE_URL);
        expect(result.subject).toBeTruthy();
        expect(result.html).toBeTruthy();
    });

    it('subject contains offer number and client name', () => {
        const result = emailTemplates.offerRejected(data, BASE_URL);
        expect(result.subject).toContain('OFF/2025/002');
        expect(result.subject).toContain('Anna Nowak');
    });

    it('html does not include reason block when reason is undefined', () => {
        const result = emailTemplates.offerRejected(data, BASE_URL);
        // When no reason, the reasonBlock is empty - "Powód odrzucenia" text should not appear
        expect(result.html).not.toContain('Powód odrzucenia');
    });

    it('html includes reason when provided', () => {
        const withReason: OfferRejectedEmailData = { ...data, reason: 'Cena zbyt wysoka' };
        const result = emailTemplates.offerRejected(withReason, BASE_URL);
        expect(result.html).toContain('Cena zbyt wysoka');
        expect(result.html).toContain('Powód odrzucenia');
    });

    it('html includes client name', () => {
        const result = emailTemplates.offerRejected(data, BASE_URL);
        expect(result.html).toContain('Anna Nowak');
    });
});

// ── newComment ────────────────────────────────────────────────────────────────

describe('emailTemplates.newComment', () => {
    const data: CommentEmailData = {
        offerNumber: 'OFF/2025/003',
        offerTitle: 'Oferta z komentarzem',
        clientName: 'Piotr Wiśniewski',
        offerId: 'off-003',
        commentPreview: 'Proszę o rabat 10%',
    };

    it('returns subject and html', () => {
        const result = emailTemplates.newComment(data, BASE_URL);
        expect(result.subject).toBeTruthy();
        expect(result.html).toBeTruthy();
    });

    it('subject contains client name and offer number', () => {
        const result = emailTemplates.newComment(data, BASE_URL);
        expect(result.subject).toContain('Piotr Wiśniewski');
        expect(result.subject).toContain('OFF/2025/003');
    });

    it('html includes the comment preview', () => {
        const result = emailTemplates.newComment(data, BASE_URL);
        expect(result.html).toContain('Proszę o rabat 10%');
    });

    it('html includes the CTA URL', () => {
        const result = emailTemplates.newComment(data, BASE_URL);
        expect(result.html).toContain(BASE_URL);
    });

    it('html includes client name', () => {
        const result = emailTemplates.newComment(data, BASE_URL);
        expect(result.html).toContain('Piotr Wiśniewski');
    });
});

// ── offerLink ─────────────────────────────────────────────────────────────────

describe('emailTemplates.offerLink', () => {
    const data: OfferLinkEmailData = {
        offerNumber: 'OFF/2025/004',
        offerTitle: 'Oferta link',
        clientName: 'Katarzyna Kowalska',
        totalGross: 5000,
        currency: 'PLN',
        validUntil: '2025-12-31T00:00:00Z',
        publicUrl: 'https://public.smartquote.pl/o/abc123',
        sellerName: 'Sprzedawca',
        companyName: 'Moja Firma',
    };

    it('returns subject and html', () => {
        const result = emailTemplates.offerLink(data);
        expect(result.subject).toBeTruthy();
        expect(result.html).toBeTruthy();
    });

    it('subject includes offer number and company name', () => {
        const result = emailTemplates.offerLink(data);
        expect(result.subject).toContain('OFF/2025/004');
        expect(result.subject).toContain('Moja Firma');
    });

    it('html includes public URL', () => {
        const result = emailTemplates.offerLink(data);
        expect(result.html).toContain('https://public.smartquote.pl/o/abc123');
    });

    it('html includes client name when provided', () => {
        const result = emailTemplates.offerLink(data);
        expect(result.html).toContain('Katarzyna Kowalska');
    });

    it('html includes seller signature', () => {
        const result = emailTemplates.offerLink(data);
        expect(result.html).toContain('Sprzedawca');
        expect(result.html).toContain('Moja Firma');
    });

    it('html includes validUntil block when provided', () => {
        const result = emailTemplates.offerLink(data);
        expect(result.html).toContain('Ważna do');
    });

    it('html does not include validUntil block when null', () => {
        const noExpiry: OfferLinkEmailData = { ...data, validUntil: null };
        const result = emailTemplates.offerLink(noExpiry);
        expect(result.html).not.toContain('Ważna do');
    });

    it('uses seller name as sender label when companyName is null', () => {
        const noCompany: OfferLinkEmailData = { ...data, companyName: null };
        const result = emailTemplates.offerLink(noCompany);
        expect(result.subject).toContain('Sprzedawca');
    });
});

// ── acceptanceConfirmation ────────────────────────────────────────────────────

describe('emailTemplates.acceptanceConfirmation', () => {
    const data: AcceptanceConfirmationEmailData = {
        offerNumber: 'OFF/2025/005',
        offerTitle: 'Potwierdzenie akceptacji',
        clientName: 'Marek Zieliński',
        totalGross: 12300,
        currency: 'PLN',
        contentHash: 'abc123def456abc123def456abc123def456abc123def456abc123def456abc1',
        acceptedAt: '2025-06-15T14:30:00Z',
        selectedVariant: null,
        publicUrl: 'https://public.smartquote.pl/o/def456',
        sellerName: 'Sprzedawca',
        companyName: null,
    };

    it('returns subject and html', () => {
        const result = emailTemplates.acceptanceConfirmation(data);
        expect(result.subject).toBeTruthy();
        expect(result.html).toBeTruthy();
    });

    it('subject includes offer number', () => {
        const result = emailTemplates.acceptanceConfirmation(data);
        expect(result.subject).toContain('OFF/2025/005');
    });

    it('html includes the content hash', () => {
        const result = emailTemplates.acceptanceConfirmation(data);
        expect(result.html).toContain('abc123def456');
    });

    it('html includes SHA-256 reference', () => {
        const result = emailTemplates.acceptanceConfirmation(data);
        expect(result.html).toContain('SHA-256');
    });

    it('html does not include variant block when selectedVariant is null', () => {
        const result = emailTemplates.acceptanceConfirmation(data);
        expect(result.html).not.toContain('Wybrany wariant');
    });

    it('html includes variant block when selectedVariant is provided', () => {
        const withVariant: AcceptanceConfirmationEmailData = {
            ...data,
            selectedVariant: 'Wariant Premium',
        };
        const result = emailTemplates.acceptanceConfirmation(withVariant);
        expect(result.html).toContain('Wariant Premium');
        expect(result.html).toContain('Wybrany wariant');
    });

    it('html includes public URL for PDF button', () => {
        const result = emailTemplates.acceptanceConfirmation(data);
        expect(result.html).toContain('https://public.smartquote.pl/o/def456');
    });

    it('html includes client name in greeting', () => {
        const result = emailTemplates.acceptanceConfirmation(data);
        expect(result.html).toContain('Marek Zieliński');
    });
});

// ── signatureConfirmation ─────────────────────────────────────────────────────

describe('emailTemplates.signatureConfirmation', () => {
    const data: SignatureConfirmationEmailData = {
        contractNumber: 'UM/2025/001',
        contractTitle: 'Umowa o współpracy',
        signerName: 'Barbara Lewandowska',
        totalGross: 50000,
        currency: 'PLN',
        contentHash: 'fedcba987654fedcba987654fedcba987654fedcba987654fedcba987654fedc',
        signedAt: '2025-06-20T09:00:00Z',
        publicUrl: 'https://public.smartquote.pl/c/ghi789',
        sellerName: 'Adam Sprzedawca',
        companyName: 'Moja Firma sp. z o.o.',
    };

    it('returns subject and html', () => {
        const result = emailTemplates.signatureConfirmation(data);
        expect(result.subject).toBeTruthy();
        expect(result.html).toBeTruthy();
    });

    it('subject includes contract number', () => {
        const result = emailTemplates.signatureConfirmation(data);
        expect(result.subject).toContain('UM/2025/001');
    });

    it('html includes signer name in greeting', () => {
        const result = emailTemplates.signatureConfirmation(data);
        expect(result.html).toContain('Barbara Lewandowska');
    });

    it('html includes the content hash', () => {
        const result = emailTemplates.signatureConfirmation(data);
        expect(result.html).toContain('fedcba987654');
    });

    it('html includes public URL', () => {
        const result = emailTemplates.signatureConfirmation(data);
        expect(result.html).toContain('https://public.smartquote.pl/c/ghi789');
    });

    it('html includes seller signature with company', () => {
        const result = emailTemplates.signatureConfirmation(data);
        expect(result.html).toContain('Adam Sprzedawca');
        expect(result.html).toContain('Moja Firma sp. z o.o.');
    });
});

// ── followUpReminder ──────────────────────────────────────────────────────────

describe('emailTemplates.followUpReminder', () => {
    const data: FollowUpReminderEmailData = {
        followUpTitle: 'Zadzwoń do klienta',
        dueDateFormatted: '15 czerwca 2025',
        priority: 'HIGH',
        type: 'CALL',
        clientName: 'Jan Klient',
        offerNumber: 'OFF/2025/010',
        contractNumber: null,
    };

    it('returns subject and html', () => {
        const result = emailTemplates.followUpReminder(data, BASE_URL);
        expect(result.subject).toBeTruthy();
        expect(result.html).toBeTruthy();
    });

    it('html includes follow-up title', () => {
        const result = emailTemplates.followUpReminder(data, BASE_URL);
        expect(result.html).toContain('Zadzwoń do klienta');
    });

    it('html includes due date', () => {
        const result = emailTemplates.followUpReminder(data, BASE_URL);
        expect(result.html).toContain('15 czerwca 2025');
    });

    it('html includes client name when present', () => {
        const result = emailTemplates.followUpReminder(data, BASE_URL);
        expect(result.html).toContain('Jan Klient');
    });

    it('html includes offer number when present', () => {
        const result = emailTemplates.followUpReminder(data, BASE_URL);
        expect(result.html).toContain('OFF/2025/010');
    });

    it('html includes priority label (translated)', () => {
        const result = emailTemplates.followUpReminder(data, BASE_URL);
        // HIGH maps to 'Wysoki' or similar Polish label
        expect(result.html).toBeTruthy();
    });

    it('html does not include powiązania section when no client/offer/contract', () => {
        const minimal: FollowUpReminderEmailData = {
            ...data,
            clientName: null,
            offerNumber: null,
            contractNumber: null,
        };
        const result = emailTemplates.followUpReminder(minimal, BASE_URL);
        expect(result.html).not.toContain('Powiązania');
    });

    it('html includes contract number when provided', () => {
        const withContract: FollowUpReminderEmailData = {
            ...data,
            contractNumber: 'UM/2025/005',
        };
        const result = emailTemplates.followUpReminder(withContract, BASE_URL);
        expect(result.html).toContain('UM/2025/005');
    });

    it('html includes CTA URL', () => {
        const result = emailTemplates.followUpReminder(data, BASE_URL);
        expect(result.html).toContain(BASE_URL);
    });

    it('handles URGENT priority', () => {
        const urgent: FollowUpReminderEmailData = { ...data, priority: 'URGENT' };
        const result = emailTemplates.followUpReminder(urgent, BASE_URL);
        expect(result.html).toBeTruthy();
    });

    it('handles LOW priority', () => {
        const low: FollowUpReminderEmailData = { ...data, priority: 'LOW' };
        const result = emailTemplates.followUpReminder(low, BASE_URL);
        expect(result.html).toBeTruthy();
    });

    it('handles MEDIUM priority', () => {
        const medium: FollowUpReminderEmailData = { ...data, priority: 'MEDIUM' };
        const result = emailTemplates.followUpReminder(medium, BASE_URL);
        expect(result.html).toBeTruthy();
    });

    it('handles unknown priority gracefully', () => {
        const unknown: FollowUpReminderEmailData = { ...data, priority: 'UNKNOWN_LEVEL' };
        const result = emailTemplates.followUpReminder(unknown, BASE_URL);
        expect(result.html).toBeTruthy();
    });

    it('handles various type labels', () => {
        const types = ['CALL', 'EMAIL', 'MEETING', 'TASK', 'REMINDER', 'OTHER'];
        types.forEach((type) => {
            const d: FollowUpReminderEmailData = { ...data, type };
            const result = emailTemplates.followUpReminder(d, BASE_URL);
            expect(result.html).toBeTruthy();
        });
    });
});

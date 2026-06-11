// src/__tests__/ksef-hmac.test.ts
import crypto from 'crypto';
import { verifyWebhookHmac } from '../services/ksef-bridge.service';

const SECRET = 'test-webhook-secret-key';
const SMART_QUOTE_ID = 'offer-abc-123';
const ACTION = 'INVOICE_APPROVED';

function nowSeconds(): number {
    return Math.floor(Date.now() / 1000);
}

function buildSignature(secret: string, timestamp: string, id: string, action: string): string {
    return crypto
        .createHmac('sha256', secret)
        .update(`${timestamp}.${id}.${action}`)
        .digest('hex');
}

describe('verifyWebhookHmac', () => {
    it('returns true for a valid signature with current timestamp', () => {
        const ts = String(nowSeconds());
        const sig = buildSignature(SECRET, ts, SMART_QUOTE_ID, ACTION);
        expect(verifyWebhookHmac(SECRET, ts, SMART_QUOTE_ID, ACTION, sig)).toBe(true);
    });

    it('returns false for an invalid signature', () => {
        const ts = String(nowSeconds());
        const sig = 'a'.repeat(64); // wrong signature
        expect(verifyWebhookHmac(SECRET, ts, SMART_QUOTE_ID, ACTION, sig)).toBe(false);
    });

    it('returns false for a tampered signature (one char changed)', () => {
        const ts = String(nowSeconds());
        const sig = buildSignature(SECRET, ts, SMART_QUOTE_ID, ACTION);
        const tampered = sig.slice(0, -1) + (sig.endsWith('a') ? 'b' : 'a');
        expect(verifyWebhookHmac(SECRET, ts, SMART_QUOTE_ID, ACTION, tampered)).toBe(false);
    });

    it('returns false for an expired timestamp (older than 5 minutes)', () => {
        const ts = String(nowSeconds() - 6 * 60); // 6 minutes ago
        const sig = buildSignature(SECRET, ts, SMART_QUOTE_ID, ACTION);
        expect(verifyWebhookHmac(SECRET, ts, SMART_QUOTE_ID, ACTION, sig)).toBe(false);
    });

    it('returns false for a future timestamp beyond 5 minutes', () => {
        const ts = String(nowSeconds() + 6 * 60); // 6 minutes in the future
        const sig = buildSignature(SECRET, ts, SMART_QUOTE_ID, ACTION);
        expect(verifyWebhookHmac(SECRET, ts, SMART_QUOTE_ID, ACTION, sig)).toBe(false);
    });

    it('accepts a timestamp at the edge of the 5-minute window', () => {
        const ts = String(nowSeconds() - 4 * 60 - 55); // just under 5 min
        const sig = buildSignature(SECRET, ts, SMART_QUOTE_ID, ACTION);
        expect(verifyWebhookHmac(SECRET, ts, SMART_QUOTE_ID, ACTION, sig)).toBe(true);
    });

    it('returns false for a malformed (non-numeric) timestamp', () => {
        const sig = buildSignature(SECRET, 'not-a-number', SMART_QUOTE_ID, ACTION);
        expect(verifyWebhookHmac(SECRET, 'not-a-number', SMART_QUOTE_ID, ACTION, sig)).toBe(false);
    });

    it('returns false for a signature with wrong length (length mismatch guard)', () => {
        const ts = String(nowSeconds());
        const shortSig = 'deadbeef'; // 8 chars, not 64
        expect(verifyWebhookHmac(SECRET, ts, SMART_QUOTE_ID, ACTION, shortSig)).toBe(false);
    });

    it('returns false when action is different from the one used to sign', () => {
        const ts = String(nowSeconds());
        const sig = buildSignature(SECRET, ts, SMART_QUOTE_ID, 'INVOICE_REJECTED');
        expect(verifyWebhookHmac(SECRET, ts, SMART_QUOTE_ID, ACTION, sig)).toBe(false);
    });

    it('returns false when smartQuoteId is different from the one used to sign', () => {
        const ts = String(nowSeconds());
        const sig = buildSignature(SECRET, ts, 'other-offer-id', ACTION);
        expect(verifyWebhookHmac(SECRET, ts, SMART_QUOTE_ID, ACTION, sig)).toBe(false);
    });
});

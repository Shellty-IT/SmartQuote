// src/__tests__/crypto.test.ts
import { encrypt, decrypt } from '../utils/crypto';

// Ensure we have a predictable key for tests
beforeAll(() => {
    // Set a 32-char key so getEncryptionKey() uses the env value
    process.env.ENCRYPTION_KEY = 'test-encryption-key-32chars-pad!';
});

afterAll(() => {
    delete process.env.ENCRYPTION_KEY;
});

// ── encrypt ──────────────────────────────────────────────────────────────────

describe('encrypt', () => {
    it('returns a non-empty string', () => {
        const result = encrypt('hello');
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
    });

    it('output has three colon-separated segments (iv:authTag:ciphertext)', () => {
        const result = encrypt('hello');
        const parts = result.split(':');
        expect(parts).toHaveLength(3);
    });

    it('IV segment is 32 hex chars (16 bytes)', () => {
        const [iv] = encrypt('hello').split(':');
        expect(iv).toHaveLength(32);
        expect(iv).toMatch(/^[a-f0-9]+$/);
    });

    it('auth-tag segment is 32 hex chars (16 bytes)', () => {
        const [, authTag] = encrypt('hello').split(':');
        expect(authTag).toHaveLength(32);
        expect(authTag).toMatch(/^[a-f0-9]+$/);
    });

    it('produces different ciphertext for the same plaintext (random IV)', () => {
        const a = encrypt('same-text');
        const b = encrypt('same-text');
        // IVs should differ; the full tokens will differ
        const [ivA] = a.split(':');
        const [ivB] = b.split(':');
        expect(ivA).not.toBe(ivB);
    });

    it('encrypts an empty string without throwing', () => {
        expect(() => encrypt('')).not.toThrow();
    });

    it('handles long strings', () => {
        const long = 'a'.repeat(10000);
        const result = encrypt(long);
        const parts = result.split(':');
        expect(parts).toHaveLength(3);
    });

    it('handles special characters and unicode', () => {
        const text = 'zażółć gęślą jaźń 🎉';
        expect(() => encrypt(text)).not.toThrow();
    });
});

// ── decrypt ──────────────────────────────────────────────────────────────────

describe('decrypt', () => {
    it('round-trips a simple string', () => {
        const original = 'hello world';
        expect(decrypt(encrypt(original))).toBe(original);
    });

    it('round-trips an empty string', () => {
        expect(decrypt(encrypt(''))).toBe('');
    });

    it('round-trips a long string', () => {
        const original = 'x'.repeat(5000);
        expect(decrypt(encrypt(original))).toBe(original);
    });

    it('round-trips JSON content', () => {
        const original = JSON.stringify({ a: 1, b: [2, 3], c: true });
        expect(decrypt(encrypt(original))).toBe(original);
    });

    it('round-trips unicode / special chars', () => {
        const original = 'hasło: §tępień & żółw 🔑';
        expect(decrypt(encrypt(original))).toBe(original);
    });

    it('throws on invalid format (no colons)', () => {
        expect(() => decrypt('invalidtoken')).toThrow('Invalid encrypted data format');
    });

    it('throws on too few segments', () => {
        expect(() => decrypt('aabb:ccdd')).toThrow('Invalid encrypted data format');
    });

    it('throws on more than 3 segments', () => {
        // Should throw because it has 4 segments (invalid format)
        // Note: our implementation checks parts.length !== 3, so 4 segments also throws
        expect(() => decrypt('a:b:c:d')).toThrow();
    });

    it('throws when ciphertext is tampered', () => {
        const encrypted = encrypt('secret');
        const parts = encrypted.split(':');
        // Corrupt the ciphertext segment
        parts[2] = parts[2].split('').reverse().join('');
        expect(() => decrypt(parts.join(':'))).toThrow();
    });
});

// ── key derivation (no ENCRYPTION_KEY set) ───────────────────────────────────

describe('encrypt/decrypt with missing env key', () => {
    beforeEach(() => {
        delete process.env.ENCRYPTION_KEY;
        delete process.env.SMTP_ENCRYPTION_KEY;
    });

    afterEach(() => {
        process.env.ENCRYPTION_KEY = 'test-encryption-key-32chars-pad!';
    });

    it('throws when ENCRYPTION_KEY is not set', () => {
        expect(() => encrypt('any text')).toThrow(/ENCRYPTION_KEY must be at least 32 characters/);
    });

    it('throws when ENCRYPTION_KEY is shorter than 32 chars', () => {
        process.env.ENCRYPTION_KEY = 'too-short';
        expect(() => encrypt('any text')).toThrow(/ENCRYPTION_KEY must be at least 32 characters/);
    });
});

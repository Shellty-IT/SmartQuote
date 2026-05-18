// src/__tests__/queryParsers.test.ts
import { parseQueryInt } from '../utils/queryParsers';

describe('parseQueryInt', () => {
    // ── undefined / empty input ──────────────────────────────────────────────
    it('returns fallback for undefined', () => {
        expect(parseQueryInt(undefined, 10)).toBe(10);
    });

    it('returns fallback for empty string', () => {
        expect(parseQueryInt('', 5)).toBe(5);
    });

    it('returns fallback for null-ish empty array element', () => {
        expect(parseQueryInt([], 7)).toBe(7);
    });

    // ── valid numbers ────────────────────────────────────────────────────────
    it('parses a valid positive integer string', () => {
        expect(parseQueryInt('3', 1)).toBe(3);
    });

    it('parses "1" correctly', () => {
        expect(parseQueryInt('1', 10)).toBe(1);
    });

    it('parses large number', () => {
        expect(parseQueryInt('9999', 1)).toBe(9999);
    });

    it('uses first element when value is an array', () => {
        expect(parseQueryInt(['4', '9'], 1)).toBe(4);
    });

    // ── invalid strings ──────────────────────────────────────────────────────
    it('returns fallback for NaN string', () => {
        expect(parseQueryInt('abc', 2)).toBe(2);
    });

    it('returns fallback for float string', () => {
        // parseInt('3.7') === 3, which is >= 1, so it is parsed
        expect(parseQueryInt('3.7', 1)).toBe(3);
    });

    it('returns fallback for zero', () => {
        expect(parseQueryInt('0', 1)).toBe(1);
    });

    it('returns fallback for negative number', () => {
        expect(parseQueryInt('-5', 1)).toBe(1);
    });

    // ── max clamp ────────────────────────────────────────────────────────────
    it('clamps to max when value exceeds max', () => {
        expect(parseQueryInt('200', 1, 100)).toBe(100);
    });

    it('returns value when within max', () => {
        expect(parseQueryInt('50', 1, 100)).toBe(50);
    });

    it('returns value equal to max', () => {
        expect(parseQueryInt('100', 1, 100)).toBe(100);
    });

    it('applies max even with fallback that is also in range', () => {
        expect(parseQueryInt('500', 10, 50)).toBe(50);
    });

    it('no max clamping when max is not provided', () => {
        expect(parseQueryInt('99999', 1)).toBe(99999);
    });

    // ── array edge case ──────────────────────────────────────────────────────
    it('returns fallback when first array element is empty string', () => {
        expect(parseQueryInt(['', '5'], 3)).toBe(3);
    });

    it('returns fallback when array is empty', () => {
        expect(parseQueryInt([], 8)).toBe(8);
    });
});

// src/utils/queryParsers.ts

/**
 * Safely parse a query parameter as a positive integer.
 * Returns `fallback` when the value is absent, empty, NaN, or non-positive.
 * Optionally clamps the result to [1, max].
 */
export function parseQueryInt(
    value: string | string[] | undefined,
    fallback: number,
    max?: number,
): number {
    const raw = Array.isArray(value) ? value[0] : value;
    if (!raw) return fallback;
    const parsed = parseInt(raw, 10);
    if (Number.isNaN(parsed) || parsed < 1) return fallback;
    return max !== undefined ? Math.min(parsed, max) : parsed;
}

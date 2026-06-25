// src/lib/pdf/money.ts
// Shared money helpers for PDF templates. Centralises currency formatting and the
// "which figure do we show?" decision so every template resolves the headline
// price the same way: a manual override wins, otherwise the offer's computed
// total for the chosen net/gross type is used.

export type PriceType = 'net' | 'gross'

export interface OfferTotals {
    totalNet?: number | null
    totalGross?: number | null
}

/** Polish-locale currency formatting, e.g. 12 300 PLN. */
export function formatMoney(amount: number, currency = 'PLN'): string {
    const n = Number.isFinite(amount) ? amount : 0
    return `${n.toLocaleString('pl-PL', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currency}`
}

export function priceTypeLabel(type: PriceType): string {
    return type === 'gross' ? 'brutto' : 'netto'
}

/**
 * Resolve the headline price for a single-total template.
 *
 * - `priceOverride` (when > 0) is the manual amount the user typed in the editor;
 *   it is interpreted as already being in the chosen `priceType`.
 * - Otherwise the offer's computed total for that type is used (so the price the
 *   user built from line items actually appears on the document).
 * - `amount` is null only when there is neither an override nor a usable offer
 *   total — callers fall back to any legacy free-text price field they hold.
 */
export function resolveHeadlinePrice(
    opts: { priceOverride?: number | null; priceType?: PriceType } & OfferTotals,
): { amount: number | null; type: PriceType; label: string } {
    const type: PriceType = opts.priceType === 'gross' ? 'gross' : 'net'
    const label = priceTypeLabel(type)

    if (opts.priceOverride != null && opts.priceOverride > 0) {
        return { amount: opts.priceOverride, type, label }
    }
    const fromOffer = type === 'gross' ? opts.totalGross : opts.totalNet
    return {
        amount: fromOffer != null && fromOffer > 0 ? fromOffer : null,
        type,
        label,
    }
}

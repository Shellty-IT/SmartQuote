// Mirrors a block-based offer's headline price override onto the offer totals
// (totalNet / totalVat / totalGross) so the list, details and PDF all agree.
//
// Document-template offers (proposal, shop, mobile_simple, universal, website*)
// are created WITHOUT line items — the price is typed into the block editor as a
// `priceOverride`. Each template keeps that override under a different block key,
// so the lookup is templateType-aware. Returns null when there is no usable
// override (then the caller keeps the line-item totals, which is correct for
// classic offers).

// templateType → block key holding `{ priceOverride, priceType? }`.
const PRICE_BLOCK_KEY: Record<string, string> = {
    proposal: 'pricingExtra',
    mobile_simple: 'process',
    universal: 'pricing',
    shop: 'pricing',
    website_v2: 'pricing',
    website_v3: 'pricing',
};

export function syncTotalsFromBlocks(
    blocks: Record<string, unknown>,
    templateType?: string | null,
): { totalGross: number; totalNet: number; totalVat: number } | null {
    try {
        // Fall back to the proposal path so existing callers that don't pass a
        // templateType keep their previous behaviour.
        const key = PRICE_BLOCK_KEY[templateType ?? 'proposal'];
        if (!key) return null;

        const block = blocks[key] as Record<string, unknown> | undefined;
        if (!block || block.priceOverride == null) return null;

        const override = Number(block.priceOverride);
        if (isNaN(override) || override <= 0) return null;

        // priceType is optional; templates without it treat the override as gross.
        const isNet = (block.priceType as string | undefined) === 'net';
        const totalGross = isNet ? Math.round(override * 1.23 * 100) / 100 : override;
        const totalNet = isNet ? override : Math.round((override / 1.23) * 100) / 100;
        const totalVat = Math.round((totalGross - totalNet) * 100) / 100;

        return { totalGross, totalNet, totalVat };
    } catch {
        return null;
    }
}

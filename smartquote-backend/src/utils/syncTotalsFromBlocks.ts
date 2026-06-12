// Reads pricingExtra.priceOverride from proposal blocks and returns the
// corresponding offer totals, or null when no override is set.
export function syncTotalsFromBlocks(
    blocks: Record<string, unknown>,
): { totalGross: number; totalNet: number; totalVat: number } | null {
    try {
        const pe = blocks.pricingExtra as Record<string, unknown> | undefined;
        if (!pe || pe.priceOverride == null) return null;

        const override = Number(pe.priceOverride);
        if (isNaN(override) || override <= 0) return null;

        const isNet = (pe.priceType as string | undefined) === 'net';
        const totalGross = isNet ? Math.round(override * 1.23 * 100) / 100 : override;
        const totalNet = isNet ? override : Math.round((override / 1.23) * 100) / 100;
        const totalVat = Math.round((totalGross - totalNet) * 100) / 100;

        return { totalGross, totalNet, totalVat };
    } catch {
        return null;
    }
}

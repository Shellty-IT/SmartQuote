// SmartQuote-AI/src/components/publicOffer/OfferCalculator.tsx
'use client';

interface OfferCalculatorProps {
    readonly totalNet: number;
    readonly totalVat: number;
    readonly totalGross: number;
    readonly currency: string;
    readonly selectedCount: number;
    readonly totalCount: number;
    readonly primaryColor?: string;
}

function formatPLN(amount: number): string {
    return new Intl.NumberFormat('pl-PL', {
        style: 'currency',
        currency: 'PLN',
        minimumFractionDigits: 2,
    }).format(amount);
}

export default function OfferCalculator({
                                            totalNet,
                                            totalVat,
                                            totalGross,
                                            selectedCount,
                                            totalCount,
                                            primaryColor = '#0891b2',
                                        }: OfferCalculatorProps) {
    return (
        <div className="bg-slate-900 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                    Podsumowanie
                </h3>
                {totalCount > selectedCount && (
                    <span className="text-xs text-slate-500">
                        {selectedCount} z {totalCount} pozycji
                    </span>
                )}
            </div>

            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <span className="text-slate-400">Suma netto</span>
                    <span className="text-lg font-semibold">{formatPLN(totalNet)}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-slate-400">VAT</span>
                    <span className="text-lg font-semibold">{formatPLN(totalVat)}</span>
                </div>
                <div className="border-t border-slate-700 pt-3">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-200 font-medium">Suma brutto</span>
                        <span
                            className="text-2xl font-bold"
                            style={{ color: primaryColor }}
                        >
                            {formatPLN(totalGross)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
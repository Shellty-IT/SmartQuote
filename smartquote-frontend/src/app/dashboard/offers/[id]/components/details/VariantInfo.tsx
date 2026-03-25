// src/app/dashboard/offers/[id]/components/details/VariantInfo.tsx
'use client';

import type { OfferItem } from '@/types';
import type { VariantData } from '../../utils';

interface VariantInfoProps {
    variantData: VariantData;
    items: OfferItem[];
}

export function VariantInfo({ variantData, items }: VariantInfoProps) {
    if (variantData.variantNames.length === 0) {
        return null;
    }

    return (
        <div className="p-4 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 border border-cyan-200 dark:border-cyan-800 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-cyan-600 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <h3 className="text-sm font-semibold text-cyan-800 dark:text-cyan-300">Warianty oferty</h3>
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
                {variantData.variantNames.map((v) => {
                    const count = items.filter((i) => i.variantName === v).length;
                    return (
                        <span
                            key={v}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 text-sm font-medium"
                        >
              {v}
                            <span className="text-xs text-cyan-500 dark:text-cyan-400">({count})</span>
            </span>
                    );
                })}
            </div>
            <p className="text-xs text-cyan-600 dark:text-cyan-400">
                Pozycje wspólne: {items.filter((i) => !i.variantName).length} • Klient wybierze jeden wariant na interaktywnej stronie oferty.
            </p>
        </div>
    );
}
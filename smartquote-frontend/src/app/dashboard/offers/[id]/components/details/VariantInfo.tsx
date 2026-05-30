// src/app/dashboard/offers/[id]/components/details/VariantInfo.tsx
'use client';

import type { OfferItem } from '@/types';
import type { VariantData } from '../../utils';
import { useTranslations } from '@/i18n';

interface VariantInfoProps {
    variantData: VariantData;
    items: OfferItem[];
}

export function VariantInfo({ variantData, items }: VariantInfoProps) {
    const tr = useTranslations('offerDetail');

    if (variantData.variantNames.length === 0) {
        return null;
    }

    return (
        <div className="p-4 bg-primary/8 border border-primary/25 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <h3 className="text-sm font-semibold text-primary">{tr.variantInfo.title}</h3>
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
                {variantData.variantNames.map((v) => {
                    const count = items.filter((i) => i.variantName === v).length;
                    return (
                        <span
                            key={v}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 text-primary text-sm font-medium"
                        >
              {v}
                            <span className="text-xs text-primary">({count})</span>
            </span>
                    );
                })}
            </div>
            <p className="text-xs text-primary">
                {tr.variantInfo.commonItems} {items.filter((i) => !i.variantName).length} • {tr.variantInfo.hint}
            </p>
        </div>
    );
}
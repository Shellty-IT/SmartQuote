// src/components/publicOffer/OfferItemsSection.tsx
'use client';

import type { PublicOfferItem } from '@/types';
import type { ItemState } from './utils';
import OfferItemRow from './OfferItemRow';

interface OfferItemsSectionProps {
    items: PublicOfferItem[];
    itemStates: Record<string, ItemState>;
    selectedVariant: string | null;
    onToggle: (id: string, selected: boolean) => void;
    onQuantityChange: (id: string, quantity: number) => void;
    disabled?: boolean;
    primaryColor: string;
}

export default function OfferItemsSection({
                                              items,
                                              itemStates,
                                              selectedVariant,
                                              onToggle,
                                              onQuantityChange,
                                              disabled = false,
                                              primaryColor,
                                          }: OfferItemsSectionProps) {
    const hasOptionalItems = items.some((i) => i.isOptional);

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">
                    Pozycje oferty
                    {selectedVariant && (
                        <span
                            className="ml-2 text-sm font-normal"
                            style={{ color: primaryColor }}
                        >
                            — {selectedVariant}
                        </span>
                    )}
                </h2>

                {hasOptionalItems && (
                    <p className="text-xs text-slate-400">
                        Pozycje opcjonalne możesz zaznaczyć lub odznaczyć
                    </p>
                )}
            </div>

            <div className="space-y-3">
                {items.map((item) => (
                    <OfferItemRow
                        key={item.id}
                        item={item}
                        isSelected={
                            item.isOptional
                                ? (itemStates[item.id]?.isSelected ?? item.isSelected)
                                : true
                        }
                        quantity={itemStates[item.id]?.quantity ?? Number(item.quantity)}
                        onToggle={onToggle}
                        onQuantityChange={onQuantityChange}
                        disabled={disabled}
                        primaryColor={primaryColor}
                    />
                ))}
            </div>
        </div>
    );
}
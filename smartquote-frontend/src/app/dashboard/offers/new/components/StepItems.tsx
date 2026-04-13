// src/app/dashboard/offers/new/components/StepItems.tsx

import { Button } from '@/components/ui';
import type { ExtendedOfferItem, OfferTotalsData } from '../types';
import { calculateItemTotal } from '../../hooks/useOfferForm';
import OfferItemForm from './OfferItemForm';
import OfferTotals from './OfferTotals';

interface StepItemsProps {
    items: ExtendedOfferItem[];
    totals: OfferTotalsData;
    uniqueVariants: string[];
    onAddItem: () => void;
    onRemoveItem: (index: number) => void;
    onUpdateItem: (index: number, field: keyof ExtendedOfferItem, value: string | number | boolean) => void;
}

export default function StepItems({
                                      items,
                                      totals,
                                      uniqueVariants,
                                      onAddItem,
                                      onRemoveItem,
                                      onUpdateItem,
                                  }: StepItemsProps) {
    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-themed">Pozycje oferty</h2>
                <Button variant="outline" size="sm" onClick={onAddItem}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Dodaj pozycję
                </Button>
            </div>

            {uniqueVariants.length > 0 && (
                <div className="mb-4 p-3 bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                        <svg className="w-4 h-4 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span className="text-sm font-medium text-cyan-800">
                            Warianty: {uniqueVariants.join(', ')}
                        </span>
                    </div>
                    <p className="text-xs text-cyan-600">
                        Pozycje bez wariantu są wspólne dla wszystkich wariantów. Klient wybierze jeden wariant.
                    </p>
                </div>
            )}

            <div className="space-y-4">
                {items.map((item, index) => (
                    <OfferItemForm
                        key={index}
                        item={item}
                        index={index}
                        itemTotals={calculateItemTotal(item)}
                        uniqueVariants={uniqueVariants}
                        canRemove={items.length > 1}
                        onUpdate={onUpdateItem}
                        onRemove={onRemoveItem}
                    />
                ))}
            </div>

            <div className="mt-6">
                <OfferTotals totals={totals} />
            </div>
        </div>
    );
}
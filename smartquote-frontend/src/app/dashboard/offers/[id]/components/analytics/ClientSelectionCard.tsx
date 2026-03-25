// src/app/dashboard/offers/[id]/components/analytics/ClientSelectionCard.tsx
'use client';

import { Card } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';

interface SelectedItem {
    name: string;
    isSelected: boolean;
    quantity: number;
    brutto: number;
}

interface ClientSelectionCardProps {
    items: SelectedItem[];
}

export function ClientSelectionCard({ items }: ClientSelectionCardProps) {
    if (items.length === 0) {
        return null;
    }

    return (
        <Card>
            <h2 className="text-lg font-semibold text-themed mb-4">Wybór klienta</h2>
            <div className="space-y-2">
                {items.map((item, index) => (
                    <div
                        key={index}
                        className={`flex justify-between items-center py-2 px-3 rounded-lg ${
                            item.isSelected ? 'bg-emerald-500/10' : 'section-themed'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            {item.isSelected ? (
                                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4 text-themed-muted opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            )}
                            <span className={`text-sm ${item.isSelected ? 'text-themed' : 'text-themed-muted line-through'}`}>
                {item.name} ×{item.quantity}
              </span>
                        </div>
                        <span className={`text-sm font-medium ${item.isSelected ? 'text-themed' : 'text-themed-muted opacity-40'}`}>
              {formatCurrency(item.brutto)}
            </span>
                    </div>
                ))}
            </div>
        </Card>
    );
}
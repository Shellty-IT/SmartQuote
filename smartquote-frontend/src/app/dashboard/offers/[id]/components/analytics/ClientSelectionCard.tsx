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
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="text-lg font-semibold text-foreground mb-4">Wybór klienta</h2>
            <div className="space-y-2">
                {items.map((item, index) => (
                    <div
                        key={index}
                        className={`flex justify-between items-center py-2 px-3 rounded-lg ${
                            item.isSelected ? 'bg-status-accepted/10' : 'bg-surface-subtle'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            {item.isSelected ? (
                                <svg className="w-4 h-4 text-status-accepted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4 text-muted-foreground opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            )}
                            <span className={`text-sm ${item.isSelected ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                {item.name} ×{item.quantity}
              </span>
                        </div>
                        <span className={`text-sm font-medium ${item.isSelected ? 'text-foreground' : 'text-muted-foreground opacity-40'}`}>
              {formatCurrency(item.brutto)}
            </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
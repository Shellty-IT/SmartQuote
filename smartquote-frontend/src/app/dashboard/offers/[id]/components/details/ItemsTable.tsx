// src/app/dashboard/offers/[id]/components/details/ItemsTable.tsx
'use client';

import { formatCurrency } from '@/lib/utils';
import type { OfferItem } from '@/types';

interface ItemsTableProps {
    items: OfferItem[];
}

export function ItemsTable({ items }: ItemsTableProps) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                <tr className="border-b divider-themed">
                    <th className="pb-3 text-left text-xs font-semibold text-themed-muted uppercase">Pozycja</th>
                    <th className="pb-3 text-right text-xs font-semibold text-themed-muted uppercase">Ilość</th>
                    <th className="pb-3 text-right text-xs font-semibold text-themed-muted uppercase">Cena</th>
                    <th className="pb-3 text-right text-xs font-semibold text-themed-muted uppercase">VAT</th>
                    <th className="pb-3 text-right text-xs font-semibold text-themed-muted uppercase">Wartość</th>
                </tr>
                </thead>
                <tbody>
                {items.map((item, index) => (
                    <tr key={item.id || index} className="border-b divider-themed last:border-0">
                        <td className="py-3">
                            <div className="flex items-center gap-2">
                                <p className="font-medium text-themed">{item.name}</p>
                                {item.isOptional && (
                                    <span className="text-xs px-1.5 py-0.5 rounded-full badge-info font-medium">
                      Opcjonalna
                    </span>
                                )}
                            </div>
                            {item.description && (
                                <p className="text-sm text-themed-muted mt-1">{item.description}</p>
                            )}
                        </td>
                        <td className="py-3 text-right text-themed-muted">
                            {Number(item.quantity)} {item.unit}
                        </td>
                        <td className="py-3 text-right text-themed-muted">
                            {formatCurrency(Number(item.unitPrice))}
                            {Number(item.discount) > 0 && (
                                <span className="text-xs text-emerald-600 dark:text-emerald-400 ml-1">
                    -{item.discount}%
                  </span>
                            )}
                        </td>
                        <td className="py-3 text-right text-themed-muted">
                            {item.vatRate}%
                        </td>
                        <td className="py-3 text-right font-semibold text-themed">
                            {formatCurrency(Number(item.totalGross))}
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}
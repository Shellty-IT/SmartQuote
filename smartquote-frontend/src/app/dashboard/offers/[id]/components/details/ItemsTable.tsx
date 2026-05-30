// src/app/dashboard/offers/[id]/components/details/ItemsTable.tsx
'use client';

import { formatCurrency } from '@/lib/utils';
import { useTranslations } from '@/i18n';
import type { OfferItem } from '@/types';

interface ItemsTableProps {
    items: OfferItem[];
}

export function ItemsTable({ items }: ItemsTableProps) {
    const tr = useTranslations('offerDetail');
    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                <tr className="border-b border-border">
                    <th className="pb-3 text-left text-xs font-semibold text-muted-foreground uppercase">{tr.items.name}</th>
                    <th className="pb-3 text-right text-xs font-semibold text-muted-foreground uppercase">{tr.items.qty}</th>
                    <th className="pb-3 text-right text-xs font-semibold text-muted-foreground uppercase">{tr.items.price}</th>
                    <th className="pb-3 text-right text-xs font-semibold text-muted-foreground uppercase">{tr.items.vat}</th>
                    <th className="pb-3 text-right text-xs font-semibold text-muted-foreground uppercase">{tr.items.value}</th>
                </tr>
                </thead>
                <tbody>
                {items.map((item, index) => (
                    <tr key={item.id || index} className="border-b border-border last:border-0">
                        <td className="py-3">
                            <div className="flex items-center gap-2">
                                <p className="font-medium text-foreground">{item.name}</p>
                                {item.isOptional && (
                                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                      {tr.items.optional}
                    </span>
                                )}
                            </div>
                            {item.description && (
                                <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                            )}
                        </td>
                        <td className="py-3 text-right text-muted-foreground">
                            {Number(item.quantity)} {item.unit}
                        </td>
                        <td className="py-3 text-right text-muted-foreground">
                            {formatCurrency(Number(item.unitPrice))}
                            {Number(item.discount) > 0 && (
                                <span className="text-xs text-status-accepted ml-1">
                    -{item.discount}%
                  </span>
                            )}
                        </td>
                        <td className="py-3 text-right text-muted-foreground">
                            {item.vatRate}%
                        </td>
                        <td className="py-3 text-right font-semibold text-foreground">
                            {formatCurrency(Number(item.totalGross))}
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}
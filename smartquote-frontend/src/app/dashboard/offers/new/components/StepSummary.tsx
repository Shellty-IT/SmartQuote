// src/app/dashboard/offers/new/components/StepSummary.tsx
'use client';

import { formatCurrency, getInitials } from '@/lib/utils';
import { useTranslations } from '@/i18n';
import type { Client } from '@/types';
import type { ExtendedOfferItem, OfferDetails, OfferTotalsData } from '../types';
import { calculateItemTotal } from '../../hooks/useOfferForm';
import OfferTotals from './OfferTotals';

interface StepSummaryProps {
    client: Client;
    details: OfferDetails;
    items: ExtendedOfferItem[];
    totals: OfferTotalsData;
    uniqueVariants: string[];
}

export default function StepSummary({ client, details, items, totals, uniqueVariants }: StepSummaryProps) {
    const tr = useTranslations('offerNew');
    const s = tr.summary;

    return (
        <div>
            <h2 className="text-lg font-semibold text-foreground mb-6">{s.title}</h2>
            <div className="space-y-6">
                <div className="p-4 bg-surface-subtle rounded-xl">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">{s.client}</h3>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white text-sm font-semibold">
                            {getInitials(client.name)}
                        </div>
                        <div>
                            <p className="font-medium text-foreground">{client.name}</p>
                            <p className="text-sm text-muted-foreground">{client.email}</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-surface-subtle rounded-xl">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">{s.details}</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground">{s.offerTitle}</p>
                            <p className="text-foreground">{details.title}</p>
                        </div>
                        {details.validUntil && (
                            <div>
                                <p className="text-sm text-muted-foreground">{s.validUntil}</p>
                                <p className="text-foreground">{details.validUntil}</p>
                            </div>
                        )}
                        <div>
                            <p className="text-sm text-muted-foreground">{s.paymentDays}</p>
                            <p className="text-foreground">{details.paymentDays}</p>
                        </div>
                    </div>
                    {details.description && (
                        <div className="mt-4">
                            <p className="text-sm text-muted-foreground">{s.description}</p>
                            <p className="text-foreground">{details.description}</p>
                        </div>
                    )}
                </div>

                {details.requireAuditTrail && (
                    <div className="p-4 rounded-xl border border-status-accepted/30 bg-status-accepted/10">
                        <div className="flex items-center gap-2 mb-1">
                            <svg className="w-4 h-4 text-status-accepted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <span className="text-sm font-medium text-status-accepted dark:text-emerald-300">{s.auditTrailOn}</span>
                        </div>
                        <p className="text-xs text-status-accepted">{s.auditTrailDesc}</p>
                    </div>
                )}

                {uniqueVariants.length > 0 && (
                    <div className="p-4 rounded-xl border border-primary/30 bg-primary/10">
                        <h3 className="text-sm font-medium text-primary mb-1">{s.variants}</h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {uniqueVariants.map((v) => (
                                <span key={v} className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium">{v}</span>
                            ))}
                        </div>
                        <p className="text-xs text-primary mt-2">
                            {s.variantsHint} ({items.filter((it) => !it.variantName.trim()).length}) {s.variantsHint2}
                        </p>
                    </div>
                )}

                <div className="p-4 bg-surface-subtle rounded-xl">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">{s.items} ({items.length})</h3>
                    <div className="space-y-2">
                        {items.map((item, index) => {
                            const itemTotals = calculateItemTotal(item);
                            return (
                                <div key={index} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-foreground">{item.name}</p>
                                            {item.isOptional && (
                                                <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{s.optional}</span>
                                            )}
                                            {item.variantName.trim() && (
                                                <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-medium">{item.variantName.trim()}</span>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {item.quantity} {item.unit} × {formatCurrency(item.unitPrice)}
                                            {item.discount ? ` (-${item.discount}%)` : ''}
                                        </p>
                                    </div>
                                    <p className="font-semibold text-foreground">{formatCurrency(itemTotals.totalGross)}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <OfferTotals totals={totals} />
            </div>
        </div>
    );
}

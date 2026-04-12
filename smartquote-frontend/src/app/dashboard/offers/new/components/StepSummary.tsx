// src/app/dashboard/offers/new/components/StepSummary.tsx

import { formatCurrency, getInitials } from '@/lib/utils';
import type { Client } from '@/types';
import type { ExtendedOfferItem, OfferDetails, OfferTotalsData } from '../types';
import { calculateItemTotal } from '../hooks/useOfferForm';
import OfferTotals from './OfferTotals';

interface StepSummaryProps {
    client: Client;
    details: OfferDetails;
    items: ExtendedOfferItem[];
    totals: OfferTotalsData;
    uniqueVariants: string[];
}

export default function StepSummary({
                                        client,
                                        details,
                                        items,
                                        totals,
                                        uniqueVariants,
                                    }: StepSummaryProps) {
    return (
        <div>
            <h2 className="text-lg font-semibold text-themed mb-6">Podsumowanie oferty</h2>
            <div className="space-y-6">
                <div className="p-4 section-themed rounded-xl">
                    <h3 className="text-sm font-medium text-themed-muted mb-2">Klient</h3>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white text-sm font-semibold">
                            {getInitials(client.name)}
                        </div>
                        <div>
                            <p className="font-medium text-themed">{client.name}</p>
                            <p className="text-sm text-themed-muted">{client.email}</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 section-themed rounded-xl">
                    <h3 className="text-sm font-medium text-themed-muted mb-2">Szczegóły</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-themed-muted">Tytuł</p>
                            <p className="text-themed">{details.title}</p>
                        </div>
                        {details.validUntil && (
                            <div>
                                <p className="text-sm text-themed-muted">Ważna do</p>
                                <p className="text-themed">{details.validUntil}</p>
                            </div>
                        )}
                        <div>
                            <p className="text-sm text-themed-muted">Termin płatności</p>
                            <p className="text-themed">{details.paymentDays} dni</p>
                        </div>
                    </div>
                    {details.description && (
                        <div className="mt-4">
                            <p className="text-sm text-themed-muted">Opis</p>
                            <p className="text-themed">{details.description}</p>
                        </div>
                    )}
                </div>

                {details.requireAuditTrail && (
                    <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-500/10">
                        <div className="flex items-center gap-2 mb-1">
                            <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                                Formalne potwierdzenie akceptacji włączone
                            </span>
                        </div>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400">
                            Przy akceptacji: zapis IP, przeglądarki, hash SHA-256, email z potwierdzeniem do klienta, certyfikat w PDF.
                        </p>
                    </div>
                )}

                {uniqueVariants.length > 0 && (
                    <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/10 dark:bg-cyan-500/10">
                        <h3 className="text-sm font-medium text-cyan-700 dark:text-cyan-300 mb-1">Warianty oferty</h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {uniqueVariants.map((v) => (
                                <span key={v} className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 text-sm font-medium">
                                    {v}
                                </span>
                            ))}
                        </div>
                        <p className="text-xs text-cyan-600 dark:text-cyan-400 mt-2">
                            Klient wybierze jeden wariant. Pozycje wspólne ({items.filter((i) => !i.variantName.trim()).length}) będą widoczne zawsze.
                        </p>
                    </div>
                )}

                <div className="p-4 section-themed rounded-xl">
                    <h3 className="text-sm font-medium text-themed-muted mb-2">Pozycje ({items.length})</h3>
                    <div className="space-y-2">
                        {items.map((item, index) => {
                            const itemTotals = calculateItemTotal(item);
                            return (
                                <div key={index} className="flex justify-between items-center py-2 border-b divider-themed last:border-0">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-themed">{item.name}</p>
                                            {item.isOptional && (
                                                <span className="text-xs px-1.5 py-0.5 rounded-full badge-info font-medium">
                                                    Opcjonalna
                                                </span>
                                            )}
                                            {item.variantName.trim() && (
                                                <span className="text-xs px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-medium">
                                                    {item.variantName.trim()}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-themed-muted">
                                            {item.quantity} {item.unit} × {formatCurrency(item.unitPrice)}
                                            {item.discount ? ` (-${item.discount}%)` : ''}
                                        </p>
                                    </div>
                                    <p className="font-semibold text-themed">
                                        {formatCurrency(itemTotals.totalGross)}
                                    </p>
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
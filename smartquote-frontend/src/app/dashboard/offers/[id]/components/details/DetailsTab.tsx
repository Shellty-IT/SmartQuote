// src/app/dashboard/offers/[id]/components/details/DetailsTab.tsx
'use client';

import { Card } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import type { Offer } from '@/types';
import type { VariantData } from '../../utils';
import { VariantInfo } from './VariantInfo';
import { ItemsTable } from './ItemsTable';
import { ClientCard } from './ClientCard';
import { DetailsCard } from './DetailsCard';
import { AuditTrailCard } from './AuditTrailCard';
import { ActionsCard } from './ActionsCard';

interface DetailsTabProps {
    offer: Offer;
    variantData: VariantData;
    isExpired: boolean;
    isDownloadingPDF: boolean;
    onDownloadPDF: () => void;
    onPublishClick: () => void;
    onDeleteClick: () => void;
    onCopyHash: (hash: string) => void;
}

export function DetailsTab({
                               offer,
                               variantData,
                               isExpired,
                               isDownloadingPDF,
                               onDownloadPDF,
                               onPublishClick,
                               onDeleteClick,
                               onCopyHash,
                           }: DetailsTabProps) {
    const auditLog = offer.acceptanceLog ?? null;

    const clientData = {
        id: offer.client.id,
        name: offer.client.name,
        email: offer.client.email || '',
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                {offer.description && (
                    <Card>
                        <h2 className="text-lg font-semibold text-themed mb-3">Opis</h2>
                        <p className="text-themed whitespace-pre-wrap">{offer.description}</p>
                    </Card>
                )}

                <VariantInfo variantData={variantData} items={offer.items} />

                <Card>
                    <h2 className="text-lg font-semibold text-themed mb-4">
                        Pozycje ({offer.items?.length || 0})
                    </h2>

                    {variantData.variantNames.length > 0 ? (
                        <div className="space-y-6">
                            {variantData.groups.map((group, gi) => (
                                <div key={gi}>
                                    <div className={`flex items-center gap-2 mb-3 pb-2 border-b ${group.name ? 'border-cyan-200 dark:border-cyan-800' : 'divider-themed'}`}>
                                        {group.name ? (
                                            <>
                                                <div className="w-1 h-5 rounded-full bg-cyan-400" />
                                                <h3 className="text-sm font-semibold text-cyan-700 dark:text-cyan-400">
                                                    Wariant: {group.name}
                                                </h3>
                                                <span className="text-xs text-themed-muted">({group.items.length} poz.)</span>
                                            </>
                                        ) : (
                                            <>
                                                <h3 className="text-sm font-semibold text-themed-muted">
                                                    Pozycje wspólne
                                                </h3>
                                                <span className="text-xs text-themed-muted">({group.items.length} poz.)</span>
                                            </>
                                        )}
                                    </div>
                                    <ItemsTable items={group.items} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <ItemsTable items={offer.items || []} />
                    )}

                    <div className="mt-4 pt-4 border-t divider-themed">
                        <div className="flex justify-end">
                            <div className="w-64 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-themed-muted">Suma netto:</span>
                                    <span className="font-medium text-themed">{formatCurrency(Number(offer.totalNet))}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-themed-muted">VAT:</span>
                                    <span className="font-medium text-themed">{formatCurrency(Number(offer.totalVat))}</span>
                                </div>
                                <div className="flex justify-between text-lg pt-2 border-t divider-themed">
                                    <span className="font-semibold text-themed">Suma brutto:</span>
                                    <span className="font-bold text-cyan-600 dark:text-cyan-400">{formatCurrency(Number(offer.totalGross))}</span>
                                </div>
                                {variantData.variantNames.length > 0 && (
                                    <p className="text-xs text-themed-muted text-right">
                                        * wspólne + pierwszy wariant
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>

                {offer.terms && (
                    <Card>
                        <h2 className="text-lg font-semibold text-themed mb-3">Warunki płatności</h2>
                        <p className="text-themed whitespace-pre-wrap">{offer.terms}</p>
                    </Card>
                )}

                {offer.notes && (
                    <Card>
                        <h2 className="text-lg font-semibold text-themed mb-3">
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Notatki wewnętrzne
              </span>
                        </h2>
                        <p className="text-themed whitespace-pre-wrap">{offer.notes}</p>
                    </Card>
                )}
            </div>

            <div className="space-y-6">
                <ClientCard client={clientData} />
                <DetailsCard offer={offer} isExpired={isExpired} />
                <AuditTrailCard
                    auditLog={auditLog}
                    requireAuditTrail={offer.requireAuditTrail ?? false}
                    onCopyHash={onCopyHash}
                />
                <ActionsCard
                    isInteractive={offer.isInteractive ?? false}
                    isDownloadingPDF={isDownloadingPDF}
                    onDownloadPDF={onDownloadPDF}
                    onPublishClick={onPublishClick}
                    onDeleteClick={onDeleteClick}
                />
            </div>
        </div>
    );
}
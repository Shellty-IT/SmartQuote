// src/app/dashboard/offers/[id]/components/details/DetailsTab.tsx
'use client';

import { formatCurrency } from '@/lib/utils';
import type { Offer } from '@/types';

// Extract template price override from proposal blocks (if set)
function getTemplatePrice(offer: Offer): { gross: number; net: number; type: 'net' | 'gross' } | null {
    if (offer.templateType !== 'proposal' || !offer.blocks) return null
    try {
        const blocks = offer.blocks as Record<string, unknown>
        const pe = blocks.pricingExtra as Record<string, unknown> | undefined
        if (!pe || pe.priceOverride == null) return null
        const override = Number(pe.priceOverride)
        const type = (pe.priceType as string | undefined) === 'net' ? 'net' : 'gross'
        if (isNaN(override) || override <= 0) return null
        return type === 'gross'
            ? { gross: override, net: Math.round((override / 1.23) * 100) / 100, type }
            : { gross: Math.round(override * 1.23 * 100) / 100, net: override, type }
    } catch {
        return null
    }
}
import type { VariantData } from '../../utils';
import { VariantInfo } from './VariantInfo';
import { ItemsTable } from './ItemsTable';
import { ClientCard } from './ClientCard';
import { DetailsCard } from './DetailsCard';
import { AuditTrailCard } from './AuditTrailCard';
import { ActionsCard } from './ActionsCard';
import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { useTranslations } from '@/i18n';
import { NotesFeed } from '@/components/notes/NotesFeed';
import { InlineEdit } from '@/components/ui';
import { offersApi } from '@/lib/api/offers.api';
import { ai } from '@/lib/api/ai.api';
import type { PriceCheckResult } from '@/types/ai';

interface DetailsTabProps {
    offer: Offer;
    variantData: VariantData;
    isExpired: boolean;
    isDownloadingPDF: boolean;
    isPreviewingPDF: boolean;
    onPreviewPDF: () => void;
    onDownloadPDF: () => void;
    onPublishClick: () => void;
    onDeleteClick: () => void;
    onCopyHash: (hash: string) => void;
    onSaved?: () => void;
}

export function DetailsTab({
                               offer,
                               variantData,
                               isExpired,
                               isDownloadingPDF,
                               isPreviewingPDF,
                               onPreviewPDF,
                               onDownloadPDF,
                               onPublishClick,
                               onDeleteClick,
                               onCopyHash,
                               onSaved,
                           }: DetailsTabProps) {
    const detailsTr = useTranslations('offerDetail').details;
    const auditLog = offer.acceptanceLog ?? null;
    const templatePrice = getTemplatePrice(offer);

    const [priceCheckResults, setPriceCheckResults] = useState<PriceCheckResult[] | null>(null);
    const [isCheckingPrices, setIsCheckingPrices] = useState(false);

    const handlePriceCheck = async () => {
        setIsCheckingPrices(true);
        try {
            const results = await ai.priceCheck(offer.items || [], offer.currency ?? 'PLN');
            setPriceCheckResults(results);
        } catch {
            // silently fail
        } finally {
            setIsCheckingPrices(false);
        }
    };

    const clientData = {
        id: offer.client.id,
        name: offer.client.name,
        email: offer.client.email || '',
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                {offer.description && (
                    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                        <h2 className="text-lg font-semibold text-foreground mb-3">{detailsTr.description}</h2>
                        <div
                            className="prose prose-sm max-w-none text-foreground [&_strong]:text-foreground [&_a]:text-primary"
                            dangerouslySetInnerHTML={{ __html: offer.description }}
                        />
                    </div>
                )}

                <VariantInfo variantData={variantData} items={offer.items} />

                <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-foreground">
                            {detailsTr.items} ({offer.items?.length || 0})
                        </h2>
                        <button
                            onClick={handlePriceCheck}
                            disabled={isCheckingPrices || !offer.items?.length}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:opacity-50"
                        >
                            {isCheckingPrices ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Sparkles className="h-3.5 w-3.5" />
                            )}
                            Sprawdź ceny AI
                        </button>
                    </div>

                    {variantData.variantNames.length > 0 ? (
                        <div className="space-y-6">
                            {variantData.groups.map((group, gi) => (
                                <div key={gi}>
                                    <div className={`flex items-center gap-2 mb-3 pb-2 border-b ${group.name ? 'border-primary/25 ' : 'border-border'}`}>
                                        {group.name ? (
                                            <>
                                                <div className="w-1 h-5 rounded-full bg-primary" />
                                                <h3 className="text-sm font-semibold text-primary">
                                                    Wariant: {group.name}
                                                </h3>
                                                <span className="text-xs text-muted-foreground">({group.items.length} poz.)</span>
                                            </>
                                        ) : (
                                            <>
                                                <h3 className="text-sm font-semibold text-muted-foreground">
                                                    {detailsTr.commonItems}
                                                </h3>
                                                <span className="text-xs text-muted-foreground">({group.items.length} poz.)</span>
                                            </>
                                        )}
                                    </div>
                                    <ItemsTable items={group.items} priceCheckResults={priceCheckResults} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <ItemsTable items={offer.items || []} priceCheckResults={priceCheckResults} />
                    )}

                    <div className="mt-4 pt-4 border-t border-border">
                        <div className="flex justify-end">
                            <div className="w-64 space-y-2">
                                {templatePrice ? (
                                    <>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Suma netto:</span>
                                            <span className="font-medium text-foreground">{formatCurrency(templatePrice.net)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">VAT (23%):</span>
                                            <span className="font-medium text-foreground">{formatCurrency(Math.round((templatePrice.gross - templatePrice.net) * 100) / 100)}</span>
                                        </div>
                                        <div className="flex justify-between text-lg pt-2 border-t border-border">
                                            <span className="font-semibold text-foreground">{detailsTr.total}</span>
                                            <span className="font-bold text-primary">{formatCurrency(templatePrice.gross)}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground text-right">
                                            * Cena z szablonu ({templatePrice.type === 'gross' ? 'brutto' : 'netto'})
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Suma netto:</span>
                                            <span className="font-medium text-foreground">{formatCurrency(Number(offer.totalNet))}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">VAT:</span>
                                            <span className="font-medium text-foreground">{formatCurrency(Number(offer.totalVat))}</span>
                                        </div>
                                        <div className="flex justify-between text-lg pt-2 border-t border-border">
                                            <span className="font-semibold text-foreground">{detailsTr.total}</span>
                                            <span className="font-bold text-primary">{formatCurrency(Number(offer.totalGross))}</span>
                                        </div>
                                    </>
                                )}
                                {variantData.variantNames.length > 0 && (
                                    <p className="text-xs text-muted-foreground text-right">
                                        * {detailsTr.sharedPlusFirst}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {offer.terms && (
                    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                        <h2 className="text-lg font-semibold text-foreground mb-3">{detailsTr.paymentTerms}</h2>
                        <div
                            className="prose prose-sm max-w-none text-foreground [&_strong]:text-foreground"
                            dangerouslySetInnerHTML={{ __html: offer.terms }}
                        />
                    </div>
                )}

                <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                    <h2 className="text-lg font-semibold text-foreground mb-3">
                        <span className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            {detailsTr.internalNotes}
                        </span>
                    </h2>
                    <InlineEdit
                        value={offer.notes ?? ''}
                        emptyText="Kliknij, aby dodać uwagi wewnętrzne..."
                        multiline
                        onSave={async (v) => { await offersApi.update(offer.id, { notes: v }); onSaved?.(); }}
                        displayClassName="whitespace-pre-wrap text-sm"
                    />
                </div>
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
                    isPreviewingPDF={isPreviewingPDF}
                    onPreviewPDF={onPreviewPDF}
                    onDownloadPDF={onDownloadPDF}
                    onPublishClick={onPublishClick}
                    onDeleteClick={onDeleteClick}
                />
                <NotesFeed entityId={offer.id} entityType="offer" />
            </div>
        </div>
    );
}

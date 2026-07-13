// src/app/dashboard/offers/[id]/components/details/DetailsTab.tsx
'use client';

import { formatCurrency } from '@/lib/utils';
import type { Offer } from '@/types';
import { resolveTemplatePrice, syncSingleDisplayItemToTemplatePrice } from '@/lib/offer-template-price';
import type { VariantData } from '../../utils';
import { VariantInfo } from './VariantInfo';
import { ItemsTable } from './ItemsTable';
import { ClientCard } from './ClientCard';
import { DetailsCard } from './DetailsCard';
import { AuditTrailCard } from './AuditTrailCard';
import { ActionsCard } from './ActionsCard';
import { useMemo, useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { useTranslations } from '@/i18n';
import { NotesFeed } from '@/components/notes/NotesFeed';
import { InlineEdit } from '@/components/ui';
import { offersApi } from '@/lib/api/offers.api';
import { ai } from '@/lib/api/ai.api';
import type { PriceCheckResult } from '@/types/ai';
import { richTextToPlainText } from '@/lib/rich-text';

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
    const templatePrice = resolveTemplatePrice(offer.blocks, offer.templateType);
    const displayItems = useMemo(
        () => syncSingleDisplayItemToTemplatePrice(offer.items, templatePrice),
        [offer.items, templatePrice],
    );
    const displayVariantData = useMemo(
        () => templatePrice ? { groups: [{ name: null, items: displayItems }], variantNames: [] } : variantData,
        [displayItems, templatePrice, variantData],
    );

    const [priceCheckResults, setPriceCheckResults] = useState<PriceCheckResult[] | null>(null);
    const [isCheckingPrices, setIsCheckingPrices] = useState(false);
    const description = useMemo(() => richTextToPlainText(offer.description ?? ''), [offer.description]);
    const terms = useMemo(() => richTextToPlainText(offer.terms ?? ''), [offer.terms]);

    const handlePriceCheck = async () => {
        setIsCheckingPrices(true);
        try {
            const results = await ai.priceCheck(displayItems, offer.currency ?? 'PLN');
            setPriceCheckResults(results);
        } catch {
            // silently fail
        } finally {
            setIsCheckingPrices(false);
        }
    };

    const recipient = offer.client ?? offer.lead;
    const recipientData = recipient ? {
        id: recipient.id,
        name: recipient.name,
        email: recipient.email || '',
        type: offer.client ? 'client' as const : 'lead' as const,
    } : null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                {description && (
                    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                        <h2 className="text-lg font-semibold text-foreground mb-3">{detailsTr.description}</h2>
                        <div className="whitespace-pre-wrap text-sm text-foreground">{description}</div>
                    </div>
                )}

                <VariantInfo variantData={variantData} items={offer.items} />

                <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-foreground">
                            {detailsTr.items} ({displayItems.length})
                        </h2>
                        <button
                            onClick={handlePriceCheck}
                            disabled={isCheckingPrices || !displayItems.length}
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

                    {displayVariantData.variantNames.length > 0 ? (
                        <div className="space-y-6">
                            {displayVariantData.groups.map((group, gi) => (
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
                        <ItemsTable items={displayItems} priceCheckResults={priceCheckResults} />
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
                                            <span className="text-muted-foreground">VAT ({templatePrice.vatRate}%):</span>
                                            <span className="font-medium text-foreground">{formatCurrency(templatePrice.vat)}</span>
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
                                {displayVariantData.variantNames.length > 0 && (
                                    <p className="text-xs text-muted-foreground text-right">
                                        * {detailsTr.sharedPlusFirst}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {terms && (
                    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                        <h2 className="text-lg font-semibold text-foreground mb-3">{detailsTr.paymentTerms}</h2>
                        <div className="whitespace-pre-wrap text-sm text-foreground">{terms}</div>
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
                {recipientData && <ClientCard recipient={recipientData} />}
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

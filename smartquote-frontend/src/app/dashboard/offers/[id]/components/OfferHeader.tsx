// src/app/dashboard/offers/[id]/components/OfferHeader.tsx
'use client';

import { useRouter } from 'next/navigation';
import { Button, Badge } from '@/components/ui';
import { getStatusConfig } from '@/lib/utils';
import type { Offer, OfferStatus } from '@/types';
import type { VariantData } from '../utils';

interface OfferHeaderProps {
    offer: Offer;
    variantData: VariantData;
    isExpired: boolean;
    availableTransitions: OfferStatus[];
    isUpdatingStatus: boolean;
    canGenerateInvoice: boolean;
    invoiceAlreadySent: boolean;
    onStatusChange: (status: OfferStatus) => void;
    onPublishClick: () => void;
    onDuplicate: () => void;
    onKsefClick: () => void;
}

export function OfferHeader({
                                offer,
                                variantData,
                                isExpired,
                                availableTransitions,
                                isUpdatingStatus,
                                canGenerateInvoice,
                                invoiceAlreadySent,
                                onStatusChange,
                                onPublishClick,
                                onDuplicate,
                                onKsefClick,
                            }: OfferHeaderProps) {
    const router = useRouter();
    const status = getStatusConfig(offer.status);

    return (
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.push('/dashboard/offers')}
                    className="p-2 text-themed-muted hover-themed rounded-lg"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
                <div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-2xl font-bold text-themed">{offer.title}</h1>
                        <Badge className={`${status.bgColor} ${status.color}`} size="md">
                            {status.label}
                        </Badge>
                        {isExpired && offer.status !== 'EXPIRED' && (
                            <Badge variant="danger" size="md">Wygasła</Badge>
                        )}
                        {offer.isInteractive && (
                            <Badge className="bg-cyan-500/15 text-cyan-600 dark:text-cyan-400" size="md">
                                Link aktywny
                            </Badge>
                        )}
                        {variantData.variantNames.length > 0 && (
                            <Badge className="bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300" size="md">
                                {variantData.variantNames.length} wariant{variantData.variantNames.length > 1 ? 'y' : ''}
                            </Badge>
                        )}
                        {offer.requireAuditTrail && (
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" size="md">
                                <svg className="w-3.5 h-3.5 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                </svg>
                                Audit Trail
                            </Badge>
                        )}
                        {invoiceAlreadySent && (
                            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" size="md">
                                <svg className="w-3.5 h-3.5 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Faktura wysłana
                            </Badge>
                        )}
                    </div>
                    <p className="text-themed-muted mt-1">{offer.number}</p>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                {canGenerateInvoice && (
                    <Button
                        variant="outline"
                        onClick={onKsefClick}
                        className="border-amber-500/50 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                    >
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Wystaw fakturę
                    </Button>
                )}

                <Button
                    variant="outline"
                    onClick={() => router.push(`/dashboard/emails/new?offerId=${offer.id}`)}
                    className="border-cyan-500/50 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10"
                >
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Wyślij email
                </Button>

                <Button variant="outline" onClick={onPublishClick}>
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    {offer.isInteractive ? 'Link' : 'Publikuj link'}
                </Button>

                {availableTransitions.length > 0 && (
                    <div className="relative group">
                        <Button variant="outline" disabled={isUpdatingStatus}>
                            Zmień status
                            <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </Button>
                        <div className="absolute right-0 mt-2 w-48 card-themed border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                            {availableTransitions.map((newStatus) => {
                                const statusConfig = getStatusConfig(newStatus);
                                return (
                                    <button
                                        key={newStatus}
                                        onClick={() => onStatusChange(newStatus)}
                                        className="w-full px-4 py-2 text-left text-sm hover-themed first:rounded-t-lg last:rounded-b-lg"
                                    >
                                        <Badge className={`${statusConfig.bgColor} ${statusConfig.color}`}>
                                            {statusConfig.label}
                                        </Badge>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                <Button variant="outline" onClick={onDuplicate}>
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Duplikuj
                </Button>

                <Button onClick={() => router.push(`/dashboard/offers/${offer.id}/edit`)}>
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Edytuj
                </Button>
            </div>
        </div>
    );
}
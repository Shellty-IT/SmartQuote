// src/app/dashboard/offers/components/OfferMobileCard.tsx

import { Card, Badge } from '@/components/ui';
import { formatDate, formatCurrency, getStatusConfig, getInitials } from '@/lib/utils';
import type { Offer } from '@/types';

interface OfferMobileCardProps {
    offer: Offer;
    onView: () => void;
    onEdit: () => void;
    onDuplicate: () => void;
    onDelete: () => void;
    onCopyLink: () => void;
}

export function OfferMobileCard({ offer, onView, onEdit, onDuplicate, onDelete, onCopyLink }: OfferMobileCardProps) {
    const statusConfig = getStatusConfig(offer.status);
    const isExpired =
        offer.validUntil &&
        new Date(offer.validUntil) < new Date() &&
        offer.status !== 'EXPIRED' &&
        offer.status !== 'ACCEPTED' &&
        offer.status !== 'REJECTED';

    const hasInvoice = !!offer.invoiceSentAt;

    return (
        <Card className="p-4" onClick={onView}>
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                        {getInitials(offer.client?.name || '?')}
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-themed truncate">{offer.title}</p>
                            {hasInvoice && (
                                <span
                                    className="shrink-0 w-4 h-4 rounded bg-amber-500/15 flex items-center justify-center"
                                    title="Faktura wysłana"
                                >
                                    <svg className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-themed-muted">{offer.number}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    <Badge className={`${statusConfig.bgColor} ${statusConfig.color}`}>
                        {statusConfig.label}
                    </Badge>
                    {isExpired && <Badge variant="danger" size="sm">!</Badge>}
                </div>
            </div>

            <div className="flex items-center justify-between mb-3">
                <div>
                    <p className="text-xs text-themed-muted">{offer.client?.name || 'Nieznany'}</p>
                    <p className="text-xs text-themed-muted opacity-70">
                        {offer.validUntil ? `do ${formatDate(offer.validUntil)}` : 'Bez terminu'}
                    </p>
                </div>
                <div className="text-right">
                    <p className="font-bold text-themed">{formatCurrency(Number(offer.totalGross))}</p>
                    <p className="text-xs text-themed-muted">netto: {formatCurrency(Number(offer.totalNet))}</p>
                </div>
            </div>

            <div className="flex items-center gap-2 mb-3">
                {offer.publicToken && (
                    <div onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={onCopyLink}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/25 hover:bg-cyan-500/25 transition-colors"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                            Link aktywny — kopiuj
                        </button>
                    </div>
                )}
                {hasInvoice && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Faktura
                    </span>
                )}
            </div>

            <div
                className="flex items-center gap-2 pt-3 border-t divider-themed"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onView}
                    className="flex-1 py-2 text-xs font-medium text-themed-muted section-themed hover-themed rounded-lg transition-colors"
                >
                    Szczegóły
                </button>
                <button
                    onClick={onEdit}
                    className="flex-1 py-2 text-xs font-medium text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 rounded-lg transition-colors"
                >
                    Edytuj
                </button>
                <button
                    onClick={onDuplicate}
                    className="py-2 px-3 text-themed-muted hover:text-themed hover-themed rounded-lg transition-colors"
                    title="Duplikuj"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                </button>
                <button
                    onClick={onDelete}
                    className="py-2 px-3 text-themed-muted hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Usuń"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
        </Card>
    );
}
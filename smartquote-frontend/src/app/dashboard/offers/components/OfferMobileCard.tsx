// src/app/dashboard/offers/components/OfferMobileCard.tsx
'use client';

import { Eye, Pencil, Copy, Trash2, Link as LinkIcon } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDate, formatCurrency, getInitials, cn } from '@/lib/utils';
import { useTranslations } from '@/i18n';
import type { Offer } from '@/types';
import { resolveTemplatePrice } from '@/lib/offer-template-price';

interface OfferMobileCardProps {
    offer: Offer;
    onView: () => void;
    onEdit: () => void;
    onDuplicate: () => void;
    onDelete: () => void;
    onCopyLink: () => void;
}

export function OfferMobileCard({ offer, onView, onEdit, onDuplicate, onDelete, onCopyLink }: OfferMobileCardProps) {
    const tr = useTranslations('offerDetail');
    const commonTr = useTranslations('common');
    const templatePrice = resolveTemplatePrice(offer.blocks, offer.templateType);
    const totalGross = templatePrice?.gross ?? Number(offer.totalGross);
    const totalNet = templatePrice?.net ?? Number(offer.totalNet);
    const recipient = offer.client ?? offer.lead;

    const isExpired =
        offer.validUntil &&
        new Date(offer.validUntil) < new Date() &&
        !['EXPIRED', 'ACCEPTED', 'REJECTED'].includes(offer.status);

    const hasInvoice = !!offer.invoiceSentAt;

    return (
        <div
            className="cursor-pointer rounded-2xl border border-border bg-card p-4 shadow-card transition hover:shadow-elevated"
            onClick={onView}
        >
            <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-primary text-[11px] font-bold text-white shadow-sm">
                        {getInitials(recipient?.name || '?')}
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                            <p className="truncate font-semibold leading-tight">{offer.title}</p>
                            {hasInvoice && (
                                <span className="shrink-0 rounded bg-[oklch(0.72_0.16_60)/15%] p-0.5">
                                    <svg className="h-2.5 w-2.5 text-[oklch(0.55_0.14_60)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </span>
                            )}
                        </div>
                        <p className="font-mono text-xs text-muted-foreground">{offer.number}</p>
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                    <StatusBadge status={offer.status} showDot={false} />
                    {isExpired && <StatusBadge status="EXPIRED" showDot={false} />}
                </div>
            </div>

            <div className="mb-3 flex items-center justify-between">
                <div className="space-y-0.5">
                    <p className="text-sm">{recipient?.name || commonTr.unknown}</p>
                    <p className={cn('text-xs', isExpired ? 'font-medium text-status-rejected' : 'text-muted-foreground')}>
                        {offer.validUntil ? formatDate(offer.validUntil) : '—'}
                    </p>
                </div>
                <div className="text-right">
                    <p className="font-bold tabular-nums">{formatCurrency(totalGross)}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">{formatCurrency(totalNet)}</p>
                </div>
            </div>

            {(offer.publicToken || hasInvoice) && (
                <div className="mb-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {offer.publicToken && (
                        <button
                            onClick={onCopyLink}
                            className="inline-flex items-center gap-1 rounded-full border border-status-open/25 bg-[color-mix(in_oklab,var(--status-open)_12%,transparent)] px-2 py-0.5 text-[11px] font-semibold text-status-open transition hover:bg-[color-mix(in_oklab,var(--status-open)_18%,transparent)]"
                        >
                            <LinkIcon className="h-3 w-3" />
                            {commonTr.copyLink}
                        </button>
                    )}
                    {hasInvoice && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-[oklch(0.72_0.16_60)/25%] bg-[oklch(0.72_0.16_60)/12%] px-2 py-0.5 text-[11px] font-semibold text-[oklch(0.55_0.14_60)]">
                            {tr.invoiceSent}
                        </span>
                    )}
                </div>
            )}

            <div className="flex items-center gap-2 border-t border-border pt-3" onClick={(e) => e.stopPropagation()}>
                <button onClick={onView} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-xs font-semibold text-muted-foreground transition hover:bg-secondary">
                    <Eye className="h-3.5 w-3.5" /> {tr.details.title}
                </button>
                <button onClick={onEdit} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary/10 py-2 text-xs font-semibold text-primary transition hover:bg-primary/15">
                    <Pencil className="h-3.5 w-3.5" /> {tr.edit}
                </button>
                <button onClick={onDuplicate} title={tr.duplicate} className="rounded-lg border border-border p-2 text-muted-foreground transition hover:bg-secondary">
                    <Copy className="h-4 w-4" />
                </button>
                <button onClick={onDelete} title={commonTr.delete} className="rounded-lg border border-border p-2 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

// src/app/dashboard/offers/[id]/components/OfferHeader.tsx
'use client';

import { useRouter } from 'next/navigation';
import { getOfferEditPath } from '@/lib/document-pdf';
import {
    ArrowLeft, Pencil, Copy, Link as LinkIcon,
    Mail, FileText, ChevronDown,
} from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import { useTranslations } from '@/i18n';
import type { Offer, OfferStatus } from '@/types';
import type { KsefAvailability, KsefAvailabilityReason } from '@/types/ksef.types';
import type { VariantData } from '../utils';

interface OfferHeaderProps {
    offer: Offer;
    variantData: VariantData;
    isExpired: boolean;
    availableTransitions: OfferStatus[];
    isUpdatingStatus: boolean;
    canGenerateInvoice: boolean;
    offerReadyForInvoice: boolean;
    invoiceAlreadySent: boolean;
    ksefAvailability: KsefAvailability | null;
    isCheckingKsef: boolean;
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
    offerReadyForInvoice,
    invoiceAlreadySent,
    ksefAvailability,
    isCheckingKsef,
    onStatusChange,
    onPublishClick,
    onDuplicate,
    onKsefClick,
}: OfferHeaderProps) {
    const router = useRouter();
    const tr = useTranslations('offerDetail');
    const statusesTr = useTranslations('statuses');

    const ksefBlockedReason = offerReadyForInvoice && ksefAvailability && !ksefAvailability.available
        ? tr.ksefReasons[ksefAvailability.reason as KsefAvailabilityReason ?? 'KSEF_UNREACHABLE']
        : null;
    const invoiceButtonTitle = isCheckingKsef
        ? tr.checkingKsef
        : ksefBlockedReason ?? tr.issueInvoiceTitle;

    return (
        <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.push('/dashboard/offers')}
                    className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition hover:text-foreground"
                    aria-label={tr.backBtn}
                >
                    <ArrowLeft className="h-4 w-4" />
                </button>
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{tr.offerLabel}</div>
                        <StatusBadge status={offer.status} />
                        {isExpired && offer.status !== 'EXPIRED' && <StatusBadge status="EXPIRED" />}
                        {offer.isInteractive && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-status-open/25 bg-[color-mix(in_oklab,var(--status-open)_12%,transparent)] px-2 py-0.5 text-[11px] font-semibold text-status-open">
                                {tr.activeLink}
                            </span>
                        )}
                        {variantData.variantNames.length > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                                {variantData.variantNames.length} {variantData.variantNames.length > 1 ? tr.variants : tr.variant}
                            </span>
                        )}
                        {offer.requireAuditTrail && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-status-accepted/25 bg-status-accepted/10 px-2 py-0.5 text-[11px] font-semibold text-status-accepted">
                                {tr.auditTrail}
                            </span>
                        )}
                        {invoiceAlreadySent && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-[oklch(0.72_0.16_60)/25%] bg-[oklch(0.72_0.16_60)/10%] px-2 py-0.5 text-[11px] font-semibold text-[oklch(0.55_0.14_60)]">
                                <FileText className="h-3 w-3" /> {tr.invoiceSent}
                            </span>
                        )}
                    </div>
                    <h1 className="mt-0.5 text-3xl font-bold tracking-tight">{offer.title}</h1>
                    <p className="mt-0.5 font-mono text-sm text-muted-foreground">{offer.number}</p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                {offerReadyForInvoice && (
                    <span title={invoiceButtonTitle} className="inline-flex">
                        <button
                            onClick={onKsefClick}
                            disabled={!canGenerateInvoice}
                            className="inline-flex h-10 items-center gap-2 rounded-xl border border-[oklch(0.72_0.16_60)/50%] bg-[oklch(0.72_0.16_60)/8%] px-4 text-sm font-semibold text-[oklch(0.55_0.14_60)] transition hover:bg-[oklch(0.72_0.16_60)/15%] disabled:pointer-events-none disabled:opacity-50 dark:text-[oklch(0.78_0.14_60)]"
                        >
                            <FileText className="h-4 w-4" /> {tr.issueInvoice}
                        </button>
                    </span>
                )}

                <button
                    onClick={() => router.push(`/dashboard/emails/new?offerId=${offer.id}`)}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-muted-foreground shadow-sm transition hover:bg-secondary hover:text-foreground"
                >
                    <Mail className="h-4 w-4" /> {tr.sendEmail}
                </button>

                <button
                    data-testid="offer-publish-button"
                    onClick={onPublishClick}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-muted-foreground shadow-sm transition hover:bg-secondary hover:text-foreground"
                >
                    <LinkIcon className="h-4 w-4" /> {offer.isInteractive ? tr.manageLink : tr.publishLink}
                </button>

                {availableTransitions.length > 0 && (
                    <div className="group relative">
                        <button
                            disabled={isUpdatingStatus}
                            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-muted-foreground shadow-sm transition hover:bg-secondary hover:text-foreground disabled:opacity-50"
                        >
                            {tr.changeStatus} <ChevronDown className="h-4 w-4" />
                        </button>
                        <div className="invisible absolute right-0 z-30 mt-1 w-48 overflow-hidden rounded-xl border border-border bg-popover shadow-elevated opacity-0 transition-all group-hover:visible group-hover:opacity-100">
                            {availableTransitions.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => onStatusChange(s)}
                                    className="flex w-full items-center gap-2 px-3 py-2.5 text-sm transition hover:bg-accent"
                                >
                                    <StatusBadge status={s} showDot />
                                    <span className="text-xs text-muted-foreground">{(statusesTr as Record<string, string>)[s]}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <button
                    onClick={onDuplicate}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-muted-foreground shadow-sm transition hover:bg-secondary hover:text-foreground"
                >
                    <Copy className="h-4 w-4" /> {tr.duplicate}
                </button>

                <button
                    onClick={() => router.push(getOfferEditPath(offer.id, offer.templateType))}
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-primary px-4 text-sm font-semibold text-white shadow-glow ring-1 ring-white/15 transition hover:brightness-110"
                >
                    <Pencil className="h-4 w-4" /> {tr.edit}
                </button>
            </div>
        </div>
    );
}

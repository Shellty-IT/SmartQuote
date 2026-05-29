// src/app/dashboard/offers/[id]/components/OfferHeader.tsx
'use client';

import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Pencil, Copy, Link as LinkIcon,
    Mail, FileText, ChevronDown,
} from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import { cn } from '@/lib/utils';
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

const KSEF_REASON_MESSAGES: Record<KsefAvailabilityReason, string> = {
    NO_SELLER_NIP: 'Uzupełnij NIP firmy w ustawieniach, aby wystawiać faktury.',
    KSEF_ACCOUNT_NOT_FOUND: 'Brak konta w KSeF Master z tym NIPem. Załóż konto w KSeF Master.',
    KSEF_NOT_CONFIGURED: 'Integracja z KSeF Master nie jest skonfigurowana.',
    KSEF_UNREACHABLE: 'KSeF Master jest chwilowo niedostępny. Spróbuj ponownie później.',
};

const STATUS_LABELS: Partial<Record<OfferStatus, string>> = {
    DRAFT: 'Szkic',
    SENT: 'Wysłana',
    VIEWED: 'Otwarta',
    NEGOTIATION: 'Negocjacje',
    ACCEPTED: 'Zaakceptowana',
    REJECTED: 'Odrzucona',
    EXPIRED: 'Wygasła',
};

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

    const ksefBlockedReason = offerReadyForInvoice && ksefAvailability && !ksefAvailability.available
        ? KSEF_REASON_MESSAGES[ksefAvailability.reason ?? 'KSEF_UNREACHABLE']
        : null;
    const invoiceButtonTitle = isCheckingKsef
        ? 'Sprawdzanie dostępności KSeF Master…'
        : ksefBlockedReason ?? 'Wystaw fakturę w KSeF Master';

    return (
        <div className="flex flex-wrap items-start justify-between gap-4">
            {/* Left: back + title */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.push('/dashboard/offers')}
                    className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition hover:text-foreground"
                    aria-label="Wróć do listy"
                >
                    <ArrowLeft className="h-4 w-4" />
                </button>
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Oferta</div>
                        <StatusBadge status={offer.status} />
                        {isExpired && offer.status !== 'EXPIRED' && <StatusBadge status="EXPIRED" />}
                        {offer.isInteractive && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-status-open/25 bg-[color-mix(in_oklab,var(--status-open)_12%,transparent)] px-2 py-0.5 text-[11px] font-semibold text-status-open">
                                Link aktywny
                            </span>
                        )}
                        {variantData.variantNames.length > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                                {variantData.variantNames.length} wariant{variantData.variantNames.length > 1 ? 'y' : ''}
                            </span>
                        )}
                        {offer.requireAuditTrail && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-status-accepted/25 bg-status-accepted/10 px-2 py-0.5 text-[11px] font-semibold text-status-accepted">
                                Audit Trail
                            </span>
                        )}
                        {invoiceAlreadySent && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-[oklch(0.72_0.16_60)/25%] bg-[oklch(0.72_0.16_60)/10%] px-2 py-0.5 text-[11px] font-semibold text-[oklch(0.55_0.14_60)]">
                                <FileText className="h-3 w-3" /> Faktura wysłana
                            </span>
                        )}
                    </div>
                    <h1 className="mt-0.5 text-3xl font-bold tracking-tight">{offer.title}</h1>
                    <p className="mt-0.5 font-mono text-sm text-muted-foreground">{offer.number}</p>
                </div>
            </div>

            {/* Right: actions */}
            <div className="flex flex-wrap items-center gap-2">
                {/* KSeF invoice */}
                {offerReadyForInvoice && (
                    <span title={invoiceButtonTitle} className="inline-flex">
                        <button
                            onClick={onKsefClick}
                            disabled={!canGenerateInvoice}
                            className="inline-flex h-10 items-center gap-2 rounded-xl border border-[oklch(0.72_0.16_60)/50%] bg-[oklch(0.72_0.16_60)/8%] px-4 text-sm font-semibold text-[oklch(0.55_0.14_60)] transition hover:bg-[oklch(0.72_0.16_60)/15%] disabled:pointer-events-none disabled:opacity-50 dark:text-[oklch(0.78_0.14_60)]"
                        >
                            <FileText className="h-4 w-4" /> Wystaw fakturę
                        </button>
                    </span>
                )}

                {/* Send email */}
                <button
                    onClick={() => router.push(`/dashboard/emails/new?offerId=${offer.id}`)}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-muted-foreground shadow-sm transition hover:bg-secondary hover:text-foreground"
                >
                    <Mail className="h-4 w-4" /> Wyślij e-mail
                </button>

                {/* Publish link */}
                <button
                    onClick={onPublishClick}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-muted-foreground shadow-sm transition hover:bg-secondary hover:text-foreground"
                >
                    <LinkIcon className="h-4 w-4" /> {offer.isInteractive ? 'Zarządzaj linkiem' : 'Publikuj link'}
                </button>

                {/* Status change dropdown */}
                {availableTransitions.length > 0 && (
                    <div className="group relative">
                        <button
                            disabled={isUpdatingStatus}
                            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-muted-foreground shadow-sm transition hover:bg-secondary hover:text-foreground disabled:opacity-50"
                        >
                            Zmień status <ChevronDown className="h-4 w-4" />
                        </button>
                        <div className="invisible absolute right-0 z-30 mt-1 w-48 overflow-hidden rounded-xl border border-border bg-popover shadow-elevated opacity-0 transition-all group-hover:visible group-hover:opacity-100">
                            {availableTransitions.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => onStatusChange(s)}
                                    className="flex w-full items-center gap-2 px-3 py-2.5 text-sm transition hover:bg-accent"
                                >
                                    <StatusBadge status={s} showDot />
                                    <span className="text-xs text-muted-foreground">{STATUS_LABELS[s]}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Duplicate */}
                <button
                    onClick={onDuplicate}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-muted-foreground shadow-sm transition hover:bg-secondary hover:text-foreground"
                >
                    <Copy className="h-4 w-4" /> Duplikuj
                </button>

                {/* Edit */}
                <button
                    onClick={() => router.push(`/dashboard/offers/${offer.id}/edit`)}
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-primary px-4 text-sm font-semibold text-white shadow-glow ring-1 ring-white/15 transition hover:brightness-110"
                >
                    <Pencil className="h-4 w-4" /> Edytuj
                </button>
            </div>
        </div>
    );
}

// src/app/dashboard/offers/[id]/components/details/DetailsCard.tsx
'use client';

import { formatDate, formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { Offer } from '@/types';

interface DetailsCardProps {
    offer: Offer;
    isExpired: boolean;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-4 rounded-lg bg-surface-subtle px-3 py-2.5">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="text-sm font-medium text-right">{children}</span>
        </div>
    );
}

export function DetailsCard({ offer, isExpired }: DetailsCardProps) {
    return (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="mb-4 text-lg font-semibold tracking-tight">Szczegóły</h2>
            <div className="space-y-2">
                <Row label="Numer"><span className="font-mono">{offer.number}</span></Row>
                <Row label="Utworzono">{formatDateTime(offer.createdAt)}</Row>
                {offer.validUntil && (
                    <Row label="Ważna do">
                        <span className={cn(isExpired && 'font-semibold text-status-rejected')}>
                            {formatDate(offer.validUntil)}
                        </span>
                    </Row>
                )}
                <Row label="Termin płatności">{offer.paymentDays} dni</Row>
                {offer.sentAt && <Row label="Wysłano">{formatDateTime(offer.sentAt)}</Row>}
                {offer.viewedAt && <Row label="Otwarto">{formatDateTime(offer.viewedAt)}</Row>}
                {offer.acceptedAt && (
                    <Row label="Zaakceptowano">
                        <span className="font-semibold text-status-accepted">
                            {formatDateTime(offer.acceptedAt)}
                        </span>
                    </Row>
                )}
                {offer.rejectedAt && (
                    <Row label="Odrzucono">
                        <span className="font-semibold text-status-rejected">
                            {formatDateTime(offer.rejectedAt)}
                        </span>
                    </Row>
                )}
                {offer.viewCount > 0 && <Row label="Wyświetlenia">{offer.viewCount}</Row>}
            </div>
        </div>
    );
}

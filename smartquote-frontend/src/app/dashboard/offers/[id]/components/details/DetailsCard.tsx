// src/app/dashboard/offers/[id]/components/details/DetailsCard.tsx
'use client';

import { formatDate, formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/i18n';
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
    const tr = useTranslations('offerDetail');
    const d = tr.details;

    return (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="mb-4 text-lg font-semibold tracking-tight">{d.title}</h2>
            <div className="space-y-2">
                <Row label={d.number}><span className="font-mono">{offer.number}</span></Row>
                <Row label={d.created}>{formatDateTime(offer.createdAt)}</Row>
                {offer.validUntil && (
                    <Row label={d.validUntil}>
                        <span className={cn(isExpired && 'font-semibold text-status-rejected')}>
                            {formatDate(offer.validUntil)}
                        </span>
                    </Row>
                )}
                <Row label={d.paymentDays}>{offer.paymentDays} {d.paymentDaysSuffix}</Row>
                {offer.sentAt && <Row label={d.sent}>{formatDateTime(offer.sentAt)}</Row>}
                {offer.viewedAt && <Row label={d.opened}>{formatDateTime(offer.viewedAt)}</Row>}
                {offer.acceptedAt && (
                    <Row label={d.accepted}>
                        <span className="font-semibold text-status-accepted">{formatDateTime(offer.acceptedAt)}</span>
                    </Row>
                )}
                {offer.rejectedAt && (
                    <Row label={d.rejected}>
                        <span className="font-semibold text-status-rejected">{formatDateTime(offer.rejectedAt)}</span>
                    </Row>
                )}
                {offer.viewCount > 0 && <Row label={d.views}>{offer.viewCount}</Row>}
            </div>
        </div>
    );
}

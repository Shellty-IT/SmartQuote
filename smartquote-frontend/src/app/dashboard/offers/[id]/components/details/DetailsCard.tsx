// src/app/dashboard/offers/[id]/components/details/DetailsCard.tsx
'use client';

import { Card } from '@/components/ui';
import { formatDate, formatDateTime } from '@/lib/utils';
import type { Offer } from '@/types';

interface DetailsCardProps {
    offer: Offer;
    isExpired: boolean;
}

export function DetailsCard({ offer, isExpired }: DetailsCardProps) {
    return (
        <Card>
            <h2 className="text-lg font-semibold text-themed mb-4">Szczegóły</h2>
            <div className="space-y-3">
                <div className="flex justify-between">
                    <span className="text-themed-muted">Numer</span>
                    <span className="font-medium text-themed">{offer.number}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-themed-muted">Utworzono</span>
                    <span className="text-themed">{formatDateTime(offer.createdAt)}</span>
                </div>
                {offer.validUntil && (
                    <div className="flex justify-between">
                        <span className="text-themed-muted">Ważna do</span>
                        <span className={isExpired ? 'text-red-600 dark:text-red-400 font-medium' : 'text-themed'}>
              {formatDate(offer.validUntil)}
            </span>
                    </div>
                )}
                <div className="flex justify-between">
                    <span className="text-themed-muted">Termin płatności</span>
                    <span className="text-themed">{offer.paymentDays} dni</span>
                </div>
                {offer.sentAt && (
                    <div className="flex justify-between">
                        <span className="text-themed-muted">Wysłano</span>
                        <span className="text-themed">{formatDateTime(offer.sentAt)}</span>
                    </div>
                )}
                {offer.viewedAt && (
                    <div className="flex justify-between">
                        <span className="text-themed-muted">Otwarto</span>
                        <span className="text-themed">{formatDateTime(offer.viewedAt)}</span>
                    </div>
                )}
                {offer.acceptedAt && (
                    <div className="flex justify-between">
                        <span className="text-themed-muted">Zaakceptowano</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              {formatDateTime(offer.acceptedAt)}
            </span>
                    </div>
                )}
                {offer.rejectedAt && (
                    <div className="flex justify-between">
                        <span className="text-themed-muted">Odrzucono</span>
                        <span className="text-red-600 dark:text-red-400 font-medium">
              {formatDateTime(offer.rejectedAt)}
            </span>
                    </div>
                )}
                {offer.viewCount > 0 && (
                    <div className="flex justify-between">
                        <span className="text-themed-muted">Wyświetlenia</span>
                        <span className="text-themed">{offer.viewCount}</span>
                    </div>
                )}
            </div>
        </Card>
    );
}
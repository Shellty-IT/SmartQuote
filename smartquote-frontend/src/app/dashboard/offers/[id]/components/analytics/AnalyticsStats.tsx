// src/app/dashboard/offers/[id]/components/analytics/AnalyticsStats.tsx
'use client';

import { Card, Badge } from '@/components/ui';
import { formatDateTime } from '@/lib/utils';

interface AnalyticsStatsProps {
    viewCount: number;
    uniqueVisitors: number;
    lastViewedAt: string | null;
    isInteractive: boolean;
}

export function AnalyticsStats({ viewCount, uniqueVisitors, lastViewedAt, isInteractive }: AnalyticsStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
                <p className="text-sm text-themed-muted">Wyświetlenia</p>
                <p className="text-3xl font-bold text-themed mt-1">{viewCount}</p>
            </Card>
            <Card>
                <p className="text-sm text-themed-muted">Unikalni odwiedzający</p>
                <p className="text-3xl font-bold text-themed mt-1">{uniqueVisitors}</p>
            </Card>
            <Card>
                <p className="text-sm text-themed-muted">Ostatnie otwarcie</p>
                <p className="text-lg font-semibold text-themed mt-1">
                    {lastViewedAt ? formatDateTime(lastViewedAt) : '—'}
                </p>
            </Card>
            <Card>
                <p className="text-sm text-themed-muted">Status linku</p>
                <div className="mt-1">
                    {isInteractive ? (
                        <Badge className="badge-success">Aktywny</Badge>
                    ) : (
                        <Badge className="badge-themed">Nieaktywny</Badge>
                    )}
                </div>
            </Card>
        </div>
    );
}
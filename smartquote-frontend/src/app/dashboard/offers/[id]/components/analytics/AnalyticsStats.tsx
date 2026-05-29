// src/app/dashboard/offers/[id]/components/analytics/AnalyticsStats.tsx
'use client';

import { Badge } from '@/components/ui';
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
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <p className="text-sm text-muted-foreground">Wyświetlenia</p>
                <p className="text-3xl font-bold text-foreground mt-1">{viewCount}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <p className="text-sm text-muted-foreground">Unikalni odwiedzający</p>
                <p className="text-3xl font-bold text-foreground mt-1">{uniqueVisitors}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <p className="text-sm text-muted-foreground">Ostatnie otwarcie</p>
                <p className="text-lg font-semibold text-foreground mt-1">
                    {lastViewedAt ? formatDateTime(lastViewedAt) : '—'}
                </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <p className="text-sm text-muted-foreground">Status linku</p>
                <div className="mt-1">
                    {isInteractive ? (
                        <Badge className="bg-status-accepted/10 text-status-accepted">Aktywny</Badge>
                    ) : (
                        <Badge className="bg-secondary text-secondary-foreground">Nieaktywny</Badge>
                    )}
                </div>
            </div>
        </div>
    );
}
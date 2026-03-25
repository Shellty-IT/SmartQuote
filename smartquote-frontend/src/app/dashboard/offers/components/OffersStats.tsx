// src/app/dashboard/offers/components/OffersStats.tsx

import { Card } from '@/components/ui';
import { SkeletonStatsCard } from '@/components/ui/Skeleton';
import { formatCurrency } from '@/lib/utils';
import type { OffersStats as OffersStatsData } from '@/types';

interface OffersStatsProps {
    stats: OffersStatsData | null;
    statsLoading: boolean;
    acceptedCount: number;
    pendingCount: number;
}

export function OffersStats({ stats, statsLoading, acceptedCount, pendingCount }: OffersStatsProps) {
    if (statsLoading) {
        return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
                {Array.from({ length: 4 }).map((_, i) => (
                    <SkeletonStatsCard key={i} />
                ))}
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
            <Card className="p-3 md:p-4">
                <p className="text-xs md:text-sm text-themed-muted">Wszystkie</p>
                <p className="text-xl md:text-2xl font-bold text-themed">{stats.total || 0}</p>
            </Card>
            <Card className="p-3 md:p-4">
                <p className="text-xs md:text-sm text-themed-muted">Zaakceptowane</p>
                <p className="text-xl md:text-2xl font-bold text-emerald-600 dark:text-emerald-400">{acceptedCount}</p>
            </Card>
            <Card className="p-3 md:p-4">
                <p className="text-xs md:text-sm text-themed-muted">Oczekujące</p>
                <p className="text-xl md:text-2xl font-bold text-amber-600 dark:text-amber-400">{pendingCount}</p>
            </Card>
            <Card className="p-3 md:p-4">
                <p className="text-xs md:text-sm text-themed-muted">Łączna wartość</p>
                <p className="text-lg md:text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                    {formatCurrency(Number(stats.totalValue) || 0)}
                </p>
            </Card>
        </div>
    );
}
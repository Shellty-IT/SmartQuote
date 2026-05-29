// src/app/dashboard/offers/components/OffersStats.tsx
'use client';

import { SkeletonKPICard } from '@/components/ui/Skeleton';
import { formatCurrency } from '@/lib/utils';
import { FileText, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/i18n';
import type { OffersStats as OffersStatsData } from '@/types';

interface OffersStatsProps {
    stats: OffersStatsData | null;
    statsLoading: boolean;
    acceptedCount: number;
    pendingCount: number;
}

export function OffersStats({ stats, statsLoading, acceptedCount, pendingCount }: OffersStatsProps) {
    const tr = useTranslations('offers');

    const STAT_CARDS = [
        { key: 'total',    label: tr.stats.all,        icon: FileText,    accent: 'from-[oklch(0.65_0.18_245)] to-[oklch(0.72_0.14_215)]' },
        { key: 'accepted', label: tr.stats.accepted,   icon: CheckCircle2, accent: 'from-[oklch(0.68_0.15_165)] to-[oklch(0.72_0.13_200)]' },
        { key: 'pending',  label: tr.stats.pending,    icon: Clock,       accent: 'from-[oklch(0.72_0.16_60)] to-[oklch(0.72_0.14_40)]' },
        { key: 'value',    label: tr.stats.totalValue, icon: TrendingUp,  accent: 'from-[oklch(0.7_0.15_50)] to-[oklch(0.72_0.16_25)]' },
    ] as const;

    if (statsLoading) {
        return (
            <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => <SkeletonKPICard key={i} />)}
            </div>
        );
    }

    if (!stats) return null;

    const values: Record<string, string> = {
        total: String(stats.total || 0),
        accepted: String(acceptedCount),
        pending: String(pendingCount),
        value: formatCurrency(Number(stats.totalValue) || 0).replace(/\s*PLN/, ''),
    };

    return (
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {STAT_CARDS.map(({ key, label, icon: Icon, accent }) => (
                <div
                    key={key}
                    className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-card"
                >
                    <div className={cn('absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br opacity-15 blur-2xl', accent)} />
                    <div className="relative">
                        <div className={cn('mb-4 grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br text-white shadow-sm', accent)}>
                            <Icon className="h-4 w-4" strokeWidth={2.2} />
                        </div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                            {label}
                        </p>
                        <p className="mt-1 text-2xl font-bold tracking-tight tabular-nums">
                            {values[key]}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}

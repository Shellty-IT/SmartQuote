// src/app/dashboard/components/StatsChart.tsx
'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface StatusData {
    label: string;
    value: number;
    color: string;   // bg-* class for the bar
    pctColor?: string; // bar color override for the mini bar
}

interface StatsChartProps {
    data: StatusData[];
    total: number;
}

export default function StatsChart({ data, total }: StatsChartProps) {
    const [hovered, setHovered] = useState<number | null>(null);

    return (
        <div className="space-y-5">
            {/* Stacked bar */}
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                {data.map((item, i) => {
                    const pct = total > 0 ? (item.value / total) * 100 : 0;
                    if (pct === 0) return null;
                    return (
                        <div
                            key={i}
                            className={cn('h-full transition-all', item.color, hovered === i ? 'brightness-110' : '')}
                            style={{ width: `${pct}%` }}
                            onMouseEnter={() => setHovered(i)}
                            onMouseLeave={() => setHovered(null)}
                        />
                    );
                })}
            </div>

            {/* Legend grid */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {data.map((item, i) => {
                    const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                    return (
                        <div
                            key={i}
                            className={cn(
                                'rounded-xl border border-border bg-surface-subtle p-3 transition-shadow',
                                hovered === i && 'shadow-card',
                            )}
                            onMouseEnter={() => setHovered(i)}
                            onMouseLeave={() => setHovered(null)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className={cn('h-2 w-2 shrink-0 rounded-full', item.color)} />
                                    <span className="text-sm font-medium">{item.label}</span>
                                </div>
                                <div className="flex items-baseline gap-1.5 tabular-nums">
                                    <span className="text-sm font-semibold">{item.value}</span>
                                    <span className="text-xs text-muted-foreground">{pct}%</span>
                                </div>
                            </div>
                            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                                <div
                                    className={cn('h-full rounded-full transition-all duration-500', item.color)}
                                    style={{ width: `${Math.max(pct, pct > 0 ? 2 : 0)}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

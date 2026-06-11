'use client';

import { useState } from 'react';
import { TrendingDown, TrendingUp, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PriceCheckBadgeProps {
    verdict: 'low' | 'fair' | 'high';
    suggestion: string;
    suggestedRange?: { min: number; max: number } | null;
}

const CONFIG = {
    low: {
        label: '↓ Poniżej rynku',
        Icon: TrendingDown,
        className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-amber-500/25',
        tooltipClass: 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-900/30 dark:border-amber-700/50 dark:text-amber-200',
    },
    fair: {
        label: '✓ Cena OK',
        Icon: Check,
        className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-emerald-500/25',
        tooltipClass: 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-900/30 dark:border-emerald-700/50 dark:text-emerald-200',
    },
    high: {
        label: '↑ Powyżej rynku',
        Icon: TrendingUp,
        className: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 ring-rose-500/25',
        tooltipClass: 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-900/30 dark:border-rose-700/50 dark:text-rose-200',
    },
} as const;

export function PriceCheckBadge({ verdict, suggestion, suggestedRange }: PriceCheckBadgeProps) {
    const [open, setOpen] = useState(false);
    const { label, className, tooltipClass } = CONFIG[verdict];

    return (
        <div className="relative inline-block">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                onBlur={() => setTimeout(() => setOpen(false), 150)}
                className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset transition hover:brightness-110',
                    className,
                )}
            >
                {label}
            </button>

            {open && (
                <div
                    className={cn(
                        'absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 rounded-xl border p-3 shadow-elevated text-xs',
                        tooltipClass,
                    )}
                >
                    <p className="font-medium leading-snug mb-1">{suggestion}</p>
                    {suggestedRange && (
                        <p className="opacity-75">
                            Sugerowany zakres: {suggestedRange.min.toLocaleString('pl-PL')} – {suggestedRange.max.toLocaleString('pl-PL')}
                        </p>
                    )}
                    <div
                        className="absolute left-1/2 top-full -translate-x-1/2 h-0 w-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent"
                        style={{ borderTopColor: 'currentColor', opacity: 0.3 }}
                    />
                </div>
            )}
        </div>
    );
}

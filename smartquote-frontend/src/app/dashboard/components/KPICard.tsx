// src/app/dashboard/components/KPICard.tsx
'use client';

import { cn } from '@/lib/utils';

interface KPICardProps {
    title: string;
    value: string;
    change: string;
    changeType: 'positive' | 'negative' | 'neutral';
    icon: React.ReactNode;
    accent: string; // tailwind gradient class pair, e.g. "from-[oklch(…)] to-[oklch(…)]"
    description?: string;
    onClick?: () => void;
}

export default function KPICard({
    title,
    value,
    change,
    changeType,
    icon,
    accent,
    description,
    onClick,
}: KPICardProps) {
    const deltaClasses = {
        positive:
            'bg-[color-mix(in_oklab,var(--status-accepted)_15%,transparent)] text-status-accepted ring-1 ring-inset ring-[color-mix(in_oklab,var(--status-accepted)_28%,transparent)]',
        negative:
            'bg-[color-mix(in_oklab,var(--status-rejected)_15%,transparent)] text-status-rejected ring-1 ring-inset ring-[color-mix(in_oklab,var(--status-rejected)_28%,transparent)]',
        neutral: 'bg-secondary text-muted-foreground ring-1 ring-inset ring-border',
    };

    return (
        <div
            onClick={onClick}
            className={cn(
                'group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-card transition-all',
                onClick && 'cursor-pointer hover:shadow-elevated',
            )}
        >
            {/* decorative glow blob */}
            <div
                className={cn(
                    'absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br opacity-20 blur-2xl transition-opacity group-hover:opacity-30',
                    accent,
                )}
            />

            <div className="relative flex items-start justify-between">
                <div
                    className={cn(
                        'grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br text-white shadow-lg',
                        accent,
                    )}
                >
                    {icon}
                </div>

                <span className={cn('rounded-full px-2 py-1 text-[10px] font-semibold', deltaClasses[changeType])}>
                    {change}
                </span>
            </div>

            <div className="relative mt-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {title}
                </div>
                <div className="mt-1.5 text-3xl font-bold tracking-tight tabular-nums">
                    {value}
                </div>
                {description && (
                    <div className="mt-1 text-xs text-muted-foreground">{description}</div>
                )}
            </div>
        </div>
    );
}

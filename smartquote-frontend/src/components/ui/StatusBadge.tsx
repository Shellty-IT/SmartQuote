'use client';

import { cn } from '@/lib/utils';

type StatusKey =
    | 'DRAFT' | 'SENT' | 'VIEWED' | 'NEGOTIATION' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'
    | 'PENDING_SIGNATURE' | 'ACTIVE' | 'COMPLETED' | 'TERMINATED'
    | 'WON' | 'LOST';

interface StatusConfig {
    label: string;
    dot: string;
    bg: string;
    text: string;
    ring: string;
}

const STATUS_MAP: Record<string, StatusConfig> = {
    DRAFT: {
        label: 'Szkic',
        dot: 'bg-status-draft',
        bg: 'bg-[color-mix(in_oklab,var(--status-draft)_12%,transparent)]',
        text: 'text-status-draft',
        ring: 'ring-[color-mix(in_oklab,var(--status-draft)_25%,transparent)]',
    },
    SENT: {
        label: 'Wysłana',
        dot: 'bg-status-open',
        bg: 'bg-[color-mix(in_oklab,var(--status-open)_12%,transparent)]',
        text: 'text-status-open',
        ring: 'ring-[color-mix(in_oklab,var(--status-open)_25%,transparent)]',
    },
    VIEWED: {
        label: 'Otwarta',
        dot: 'bg-[oklch(0.7_0.14_200)]',
        bg: 'bg-[color-mix(in_oklab,oklch(0.7_0.14_200)_12%,transparent)]',
        text: 'text-[oklch(0.55_0.14_200)] dark:text-[oklch(0.78_0.12_200)]',
        ring: 'ring-[color-mix(in_oklab,oklch(0.7_0.14_200)_25%,transparent)]',
    },
    NEGOTIATION: {
        label: 'Negocjacje',
        dot: 'bg-[oklch(0.72_0.16_60)]',
        bg: 'bg-[color-mix(in_oklab,oklch(0.72_0.16_60)_12%,transparent)]',
        text: 'text-[oklch(0.55_0.14_60)] dark:text-[oklch(0.78_0.14_60)]',
        ring: 'ring-[color-mix(in_oklab,oklch(0.72_0.16_60)_25%,transparent)]',
    },
    ACCEPTED: {
        label: 'Zaakceptowana',
        dot: 'bg-status-accepted',
        bg: 'bg-[color-mix(in_oklab,var(--status-accepted)_12%,transparent)]',
        text: 'text-status-accepted',
        ring: 'ring-[color-mix(in_oklab,var(--status-accepted)_25%,transparent)]',
    },
    REJECTED: {
        label: 'Odrzucona',
        dot: 'bg-status-rejected',
        bg: 'bg-[color-mix(in_oklab,var(--status-rejected)_12%,transparent)]',
        text: 'text-status-rejected',
        ring: 'ring-[color-mix(in_oklab,var(--status-rejected)_25%,transparent)]',
    },
    EXPIRED: {
        label: 'Wygasła',
        dot: 'bg-muted-foreground',
        bg: 'bg-muted',
        text: 'text-muted-foreground',
        ring: 'ring-border',
    },
    PENDING_SIGNATURE: {
        label: 'Do podpisu',
        dot: 'bg-[oklch(0.72_0.16_60)]',
        bg: 'bg-[color-mix(in_oklab,oklch(0.72_0.16_60)_12%,transparent)]',
        text: 'text-[oklch(0.55_0.14_60)] dark:text-[oklch(0.78_0.14_60)]',
        ring: 'ring-[color-mix(in_oklab,oklch(0.72_0.16_60)_25%,transparent)]',
    },
    ACTIVE: {
        label: 'Aktywna',
        dot: 'bg-status-accepted',
        bg: 'bg-[color-mix(in_oklab,var(--status-accepted)_12%,transparent)]',
        text: 'text-status-accepted',
        ring: 'ring-[color-mix(in_oklab,var(--status-accepted)_25%,transparent)]',
    },
    COMPLETED: {
        label: 'Zakończona',
        dot: 'bg-status-open',
        bg: 'bg-[color-mix(in_oklab,var(--status-open)_12%,transparent)]',
        text: 'text-status-open',
        ring: 'ring-[color-mix(in_oklab,var(--status-open)_25%,transparent)]',
    },
    TERMINATED: {
        label: 'Rozwiązana',
        dot: 'bg-status-rejected',
        bg: 'bg-[color-mix(in_oklab,var(--status-rejected)_12%,transparent)]',
        text: 'text-status-rejected',
        ring: 'ring-[color-mix(in_oklab,var(--status-rejected)_25%,transparent)]',
    },
    WON: {
        label: 'Wygrana',
        dot: 'bg-status-won',
        bg: 'bg-[color-mix(in_oklab,var(--status-won)_12%,transparent)]',
        text: 'text-status-won',
        ring: 'ring-[color-mix(in_oklab,var(--status-won)_25%,transparent)]',
    },
    LOST: {
        label: 'Przegrana',
        dot: 'bg-status-lost',
        bg: 'bg-[color-mix(in_oklab,var(--status-lost)_12%,transparent)]',
        text: 'text-status-lost',
        ring: 'ring-[color-mix(in_oklab,var(--status-lost)_25%,transparent)]',
    },
};

interface StatusBadgeProps {
    status: string;
    className?: string;
    showDot?: boolean;
}

export default function StatusBadge({ status, className, showDot = true }: StatusBadgeProps) {
    const cfg = STATUS_MAP[status] ?? {
        label: status,
        dot: 'bg-muted-foreground',
        bg: 'bg-muted',
        text: 'text-muted-foreground',
        ring: 'ring-border',
    };

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
                cfg.bg,
                cfg.text,
                cfg.ring,
                className,
            )}
        >
            {showDot && <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', cfg.dot)} />}
            {cfg.label}
        </span>
    );
}

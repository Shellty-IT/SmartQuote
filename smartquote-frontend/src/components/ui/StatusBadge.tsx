'use client';

import { cn } from '@/lib/utils';
import { useTranslations } from '@/i18n';

interface StatusStyle {
    dot: string;
    bg: string;
    text: string;
    ring: string;
}

const STATUS_STYLES: Record<string, StatusStyle> = {
    DRAFT: {
        dot: 'bg-status-draft',
        bg: 'bg-[color-mix(in_oklab,var(--status-draft)_12%,transparent)]',
        text: 'text-status-draft',
        ring: 'ring-[color-mix(in_oklab,var(--status-draft)_25%,transparent)]',
    },
    SENT: {
        dot: 'bg-status-open',
        bg: 'bg-[color-mix(in_oklab,var(--status-open)_12%,transparent)]',
        text: 'text-status-open',
        ring: 'ring-[color-mix(in_oklab,var(--status-open)_25%,transparent)]',
    },
    VIEWED: {
        dot: 'bg-[oklch(0.7_0.14_200)]',
        bg: 'bg-[color-mix(in_oklab,oklch(0.7_0.14_200)_12%,transparent)]',
        text: 'text-[oklch(0.55_0.14_200)] dark:text-[oklch(0.78_0.12_200)]',
        ring: 'ring-[color-mix(in_oklab,oklch(0.7_0.14_200)_25%,transparent)]',
    },
    NEGOTIATION: {
        dot: 'bg-[oklch(0.72_0.16_60)]',
        bg: 'bg-[color-mix(in_oklab,oklch(0.72_0.16_60)_12%,transparent)]',
        text: 'text-[oklch(0.55_0.14_60)] dark:text-[oklch(0.78_0.14_60)]',
        ring: 'ring-[color-mix(in_oklab,oklch(0.72_0.16_60)_25%,transparent)]',
    },
    ACCEPTED: {
        dot: 'bg-status-accepted',
        bg: 'bg-[color-mix(in_oklab,var(--status-accepted)_12%,transparent)]',
        text: 'text-status-accepted',
        ring: 'ring-[color-mix(in_oklab,var(--status-accepted)_25%,transparent)]',
    },
    REJECTED: {
        dot: 'bg-status-rejected',
        bg: 'bg-[color-mix(in_oklab,var(--status-rejected)_12%,transparent)]',
        text: 'text-status-rejected',
        ring: 'ring-[color-mix(in_oklab,var(--status-rejected)_25%,transparent)]',
    },
    EXPIRED: {
        dot: 'bg-muted-foreground',
        bg: 'bg-muted',
        text: 'text-muted-foreground',
        ring: 'ring-border',
    },
    PENDING_SIGNATURE: {
        dot: 'bg-[oklch(0.72_0.16_60)]',
        bg: 'bg-[color-mix(in_oklab,oklch(0.72_0.16_60)_12%,transparent)]',
        text: 'text-[oklch(0.55_0.14_60)] dark:text-[oklch(0.78_0.14_60)]',
        ring: 'ring-[color-mix(in_oklab,oklch(0.72_0.16_60)_25%,transparent)]',
    },
    ACTIVE: {
        dot: 'bg-status-accepted',
        bg: 'bg-[color-mix(in_oklab,var(--status-accepted)_12%,transparent)]',
        text: 'text-status-accepted',
        ring: 'ring-[color-mix(in_oklab,var(--status-accepted)_25%,transparent)]',
    },
    COMPLETED: {
        dot: 'bg-status-open',
        bg: 'bg-[color-mix(in_oklab,var(--status-open)_12%,transparent)]',
        text: 'text-status-open',
        ring: 'ring-[color-mix(in_oklab,var(--status-open)_25%,transparent)]',
    },
    TERMINATED: {
        dot: 'bg-status-rejected',
        bg: 'bg-[color-mix(in_oklab,var(--status-rejected)_12%,transparent)]',
        text: 'text-status-rejected',
        ring: 'ring-[color-mix(in_oklab,var(--status-rejected)_25%,transparent)]',
    },
    WON: {
        dot: 'bg-status-won',
        bg: 'bg-[color-mix(in_oklab,var(--status-won)_12%,transparent)]',
        text: 'text-status-won',
        ring: 'ring-[color-mix(in_oklab,var(--status-won)_25%,transparent)]',
    },
    LOST: {
        dot: 'bg-status-lost',
        bg: 'bg-[color-mix(in_oklab,var(--status-lost)_12%,transparent)]',
        text: 'text-status-lost',
        ring: 'ring-[color-mix(in_oklab,var(--status-lost)_25%,transparent)]',
    },
};

const FALLBACK_STYLE: StatusStyle = {
    dot: 'bg-muted-foreground',
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    ring: 'ring-border',
};

interface StatusBadgeProps {
    status: string;
    className?: string;
    showDot?: boolean;
}

export default function StatusBadge({ status, className, showDot = true }: StatusBadgeProps) {
    const tr = useTranslations('statuses');
    const style = STATUS_STYLES[status] ?? FALLBACK_STYLE;
    const label = (tr as Record<string, string>)[status] ?? status;

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
                style.bg,
                style.text,
                style.ring,
                className,
            )}
        >
            {showDot && <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', style.dot)} />}
            {label}
        </span>
    );
}

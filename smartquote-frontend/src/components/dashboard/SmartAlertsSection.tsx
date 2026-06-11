'use client';

import Link from 'next/link';
import { AlertTriangle, Clock, FileText, UserSearch, ScrollText, ChevronRight } from 'lucide-react';
import { useAlerts } from '@/hooks/useAlerts';
import { cn } from '@/lib/utils';
import type { Alert, AlertPriority } from '@/types/alert.types';

const PRIORITY_STYLES: Record<AlertPriority, { bg: string; border: string; icon: string }> = {
    high:   { bg: 'bg-rose-50 dark:bg-rose-950/20',   border: 'border-rose-200 dark:border-rose-800/40',   icon: 'text-rose-500' },
    medium: { bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-200 dark:border-amber-800/40', icon: 'text-amber-500' },
    low:    { bg: 'bg-blue-50 dark:bg-blue-950/20',   border: 'border-blue-200 dark:border-blue-800/40',   icon: 'text-blue-500'  },
};

const TYPE_ICONS: Record<string, React.ElementType> = {
    overdue_followup:  Clock,
    expiring_offer:    AlertTriangle,
    stale_draft:       FileText,
    new_lead:          UserSearch,
    unsigned_contract: ScrollText,
};

function AlertItem({ alert }: { alert: Alert }) {
    const style = PRIORITY_STYLES[alert.priority];
    const Icon = TYPE_ICONS[alert.type] ?? AlertTriangle;

    return (
        <Link
            href={alert.action.path}
            className={cn(
                'flex items-center gap-3 rounded-xl border p-3.5 transition hover:brightness-[0.97] dark:hover:brightness-110',
                style.bg, style.border,
            )}
        >
            <div className={cn('shrink-0', style.icon)}>
                <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{alert.title}</p>
                <p className="text-xs text-muted-foreground">{alert.message}</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />
        </Link>
    );
}

export function SmartAlertsSection() {
    const { alerts, isLoading } = useAlerts();

    if (isLoading) return null; // don't show skeleton — avoid layout shift
    if (alerts.length === 0) return null; // hide completely when nothing to show

    return (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <h2 className="text-base font-semibold tracking-tight">Wymaga uwagi</h2>
                <span className="ml-auto text-xs text-muted-foreground">{alerts.length} alertów</span>
            </div>
            <div className="space-y-2">
                {alerts.slice(0, 6).map(alert => <AlertItem key={alert.id} alert={alert} />)}
            </div>
        </div>
    );
}

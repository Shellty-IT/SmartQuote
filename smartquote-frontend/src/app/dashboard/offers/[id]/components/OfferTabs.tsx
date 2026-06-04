// src/app/dashboard/offers/[id]/components/OfferTabs.tsx
'use client';

import { cn } from '@/lib/utils';
import { useTranslations } from '@/i18n';
import type { Tab } from '../constants';
import { TAB_IDS } from '../constants';

interface OfferTabsProps {
    activeTab: Tab;
    onTabChange: (tab: Tab) => void;
    viewCount: number;
    commentsCount: number;
    emailsCount: number;
}

export function OfferTabs({ activeTab, onTabChange, viewCount, commentsCount, emailsCount }: OfferTabsProps) {
    const tr = useTranslations('offerDetail');

    const tabLabels: Record<Tab, string> = {
        details: tr.tabs.details,
        analytics: tr.tabs.analytics,
        comments: tr.tabs.comments,
        emails: tr.tabs.emails,
        template: tr.tabs.template,
    };

    const getCount = (id: Tab): number | undefined => {
        if (id === 'analytics') return viewCount || undefined;
        if (id === 'comments') return commentsCount || undefined;
        if (id === 'emails') return emailsCount || undefined;
        return undefined;
    };

    return (
        <div className="flex w-fit flex-wrap gap-1 rounded-xl border border-border bg-surface-subtle p-1">
            {TAB_IDS.map((id) => {
                const count = getCount(id);
                const active = activeTab === id;
                return (
                    <button
                        key={id}
                        onClick={() => onTabChange(id)}
                        className={cn(
                            'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all',
                            active
                                ? 'bg-card text-foreground shadow-sm'
                                : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
                        )}
                    >
                        {tabLabels[id]}
                        {count !== undefined && count > 0 && (
                            <span className={cn(
                                'rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
                                active ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground',
                            )}>
                                {count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

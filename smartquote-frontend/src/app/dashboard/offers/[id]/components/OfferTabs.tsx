// src/app/dashboard/offers/[id]/components/OfferTabs.tsx
'use client';

import { cn } from '@/lib/utils';
import type { Tab } from '../constants';
import { TABS_CONFIG } from '../constants';

interface OfferTabsProps {
    activeTab: Tab;
    onTabChange: (tab: Tab) => void;
    viewCount: number;
    commentsCount: number;
    emailsCount: number;
}

export function OfferTabs({ activeTab, onTabChange, viewCount, commentsCount, emailsCount }: OfferTabsProps) {
    const getCount = (id: Tab): number | undefined => {
        if (id === 'analytics') return viewCount || undefined;
        if (id === 'comments') return commentsCount || undefined;
        if (id === 'emails') return emailsCount || undefined;
        return undefined;
    };

    return (
        <div className="flex w-fit flex-wrap gap-1 rounded-xl border border-border bg-surface-subtle p-1">
            {TABS_CONFIG.map((tab) => {
                const count = getCount(tab.id);
                const active = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={cn(
                            'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all',
                            active
                                ? 'bg-card text-foreground shadow-sm'
                                : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
                        )}
                    >
                        {tab.label}
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

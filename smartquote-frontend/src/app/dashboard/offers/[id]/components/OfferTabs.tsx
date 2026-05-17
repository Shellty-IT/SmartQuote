// src/app/dashboard/offers/[id]/components/OfferTabs.tsx
'use client';

import type { Tab } from '../constants';
import { TABS_CONFIG } from '../constants';

interface OfferTabsProps {
    activeTab: Tab;
    onTabChange: (tab: Tab) => void;
    viewCount: number;
    commentsCount: number;
    emailsCount: number;
}

export function OfferTabs({
                              activeTab,
                              onTabChange,
                              viewCount,
                              commentsCount,
                              emailsCount,
                          }: OfferTabsProps) {
    const getTabCount = (tabId: Tab): number | undefined => {
        switch (tabId) {
            case 'analytics':
                return viewCount || undefined;
            case 'comments':
                return commentsCount || undefined;
            case 'emails':
                return emailsCount || undefined;
            default:
                return undefined;
        }
    };

    return (
        <div className="mb-6">
            <div className="flex gap-1 section-themed rounded-xl p-1 w-fit flex-wrap">
                {TABS_CONFIG.map((tab) => {
                    const count = getTabCount(tab.id);
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                                activeTab === tab.id
                                    ? 'card-themed text-themed shadow-sm'
                                    : 'text-themed-muted hover-themed'
                            }`}
                        >
                            {tab.label}
                            {count !== undefined && count > 0 && (
                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                    activeTab === tab.id
                                        ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400'
                                        : 'badge-themed'
                                }`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
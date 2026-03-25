// src/app/dashboard/offers/[id]/components/analytics/AnalyticsTab.tsx
'use client';

import type { OfferAnalytics } from '@/types';
import type { ObserverInsight } from '@/types/ai';
import { AnalyticsStats } from './AnalyticsStats';
import { ObserverSection } from './ObserverSection';
import { InteractionsLog } from './InteractionsLog';
import { ClientSelectionCard } from './ClientSelectionCard';

interface SelectedItem {
    name: string;
    isSelected: boolean;
    quantity: number;
    brutto: number;
}

function isSelectedItemArray(data: unknown): data is SelectedItem[] {
    if (!Array.isArray(data)) return false;
    if (data.length === 0) return true;
    const first = data[0];
    return (
        typeof first === 'object' &&
        first !== null &&
        'name' in first &&
        'isSelected' in first &&
        'quantity' in first &&
        'brutto' in first
    );
}

interface AnalyticsTabProps {
    analytics: OfferAnalytics | null;
    observerInsight: ObserverInsight | null;
    isLoadingObserver: boolean;
    observerError: string | null;
    onLoadObserver: () => void;
}

export function AnalyticsTab({
                                 analytics,
                                 observerInsight,
                                 isLoadingObserver,
                                 observerError,
                                 onLoadObserver,
                             }: AnalyticsTabProps) {
    const rawSelected = analytics?.clientSelectedData ?? null;
    const selectedItems = isSelectedItemArray(rawSelected) ? rawSelected : null;

    return (
        <div className="space-y-6">
            <AnalyticsStats
                viewCount={analytics?.viewCount || 0}
                uniqueVisitors={analytics?.uniqueVisitors || 0}
                lastViewedAt={analytics?.lastViewedAt || null}
                isInteractive={analytics?.isInteractive || false}
            />

            <ObserverSection
                observerInsight={observerInsight}
                isLoading={isLoadingObserver}
                error={observerError}
                onLoadObserver={onLoadObserver}
            />

            {analytics?.interactions && analytics.interactions.length > 0 && (
                <InteractionsLog interactions={analytics.interactions} />
            )}

            {selectedItems && selectedItems.length > 0 && (
                <ClientSelectionCard items={selectedItems} />
            )}
        </div>
    );
}
// src/app/dashboard/offers/[id]/components/analytics/InteractionsLog.tsx
'use client';

import { formatDateTime } from '@/lib/utils';
import { useTranslations } from '@/i18n';
import { INTERACTION_TYPE_CONFIG } from '../../constants';

interface Interaction {
    id: string;
    type: string;
    createdAt: string;
}

interface InteractionsLogProps {
    interactions: Interaction[];
}

export function InteractionsLog({ interactions }: InteractionsLogProps) {
    const tr = useTranslations('offerDetail');

    if (!interactions || interactions.length === 0) return null;

    return (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="text-lg font-semibold text-foreground mb-4">{tr.analytics.title}</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
                {interactions.map((interaction) => {
                    const config = INTERACTION_TYPE_CONFIG[interaction.type];
                    const label = config
                        ? (tr.analytics.events as Record<string, string>)[config.eventKey] ?? interaction.type
                        : interaction.type;
                    const icon = config?.icon ?? '•';
                    const color = config?.color ?? 'text-muted-foreground';

                    return (
                        <div key={interaction.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                            <span className="text-lg flex-shrink-0">{icon}</span>
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium ${color}`}>{label}</p>
                                <p className="text-xs text-muted-foreground">{formatDateTime(interaction.createdAt)}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

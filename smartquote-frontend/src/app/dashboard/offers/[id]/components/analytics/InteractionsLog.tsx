// src/app/dashboard/offers/[id]/components/analytics/InteractionsLog.tsx
'use client';

import { Card } from '@/components/ui';
import { formatDateTime } from '@/lib/utils';
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
    if (!interactions || interactions.length === 0) {
        return null;
    }

    return (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="text-lg font-semibold text-foreground mb-4">Aktywność klienta</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
                {interactions.map((interaction) => {
                    const config = INTERACTION_TYPE_CONFIG[interaction.type] || {
                        label: interaction.type,
                        icon: '•',
                        color: 'text-muted-foreground'
                    };

                    return (
                        <div key={interaction.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                            <span className="text-lg flex-shrink-0">{config.icon}</span>
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium ${config.color}`}>
                                    {config.label}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {formatDateTime(interaction.createdAt)}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
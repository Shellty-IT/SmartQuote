// src/components/ai/QuickActions.tsx
'use client';

import { useTranslations } from '@/i18n';

interface QuickActionsProps {
    onAction: (prompt: string) => void;
}

export function QuickActions({ onAction }: QuickActionsProps) {
    const tr = useTranslations('aiChat');

    const quickActions = [
        {
            icon: '📄',
            label: tr.quickActions.createOffer,
            prompt: tr.quickActions.createOfferDesc,
            color: 'bg-status-open',
        },
        {
            icon: '✉️',
            label: tr.quickActions.writeEmail,
            prompt: tr.quickActions.writeEmailDesc,
            color: 'bg-green-500',
        },
        {
            icon: '👥',
            label: tr.quickActions.analyzeClients,
            prompt: tr.quickActions.analyzeClientsDesc,
            color: 'bg-purple-500',
        },
        {
            icon: '📊',
            label: tr.quickActions.stats,
            prompt: tr.quickActions.statsDesc,
            color: 'bg-orange-500',
        },
        {
            icon: '📅',
            label: tr.quickActions.overdue,
            prompt: tr.quickActions.overdueDesc,
            color: 'bg-status-rejected',
        },
        {
            icon: '💡',
            label: tr.quickActions.salesTips,
            prompt: tr.quickActions.salesTipsDesc,
            color: 'bg-indigo-500',
        },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {quickActions.map((action, index) => (
                <button
                    key={index}
                    onClick={() => onAction(action.prompt)}
                    className="flex items-center gap-3 p-4 rounded-xl border bg-card border-border hover:border-primary hover:shadow-md transition-all group"
                >
                    <div className={`p-2 rounded-lg ${action.color} text-white text-lg group-hover:scale-110 transition-transform`}>
                        {action.icon}
                    </div>
                    <span className="text-sm font-medium text-foreground group-hover:text-primary">
                        {action.label}
                    </span>
                </button>
            ))}
        </div>
    );
}

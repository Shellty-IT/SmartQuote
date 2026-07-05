// src/app/dashboard/settings/components/EmailProviderTab.tsx
'use client';

import { useState } from 'react';
import { Zap, Server, Check, AlertTriangle } from 'lucide-react';
import { useTranslations } from '@/i18n';
import ResendSection from './ResendSection';
import SmtpSection from './SmtpSection';

interface EmailProviderTabProps {
    emailProvider: 'smtp' | 'resend';
    onProviderChange: (provider: 'smtp' | 'resend') => Promise<unknown>;
}

interface ProviderCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    selected: boolean;
    disabled: boolean;
    badge?: string;
    onSelect: () => void;
}

function ProviderCard({ icon, title, description, selected, disabled, badge, onSelect }: ProviderCardProps) {
    return (
        <button
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={onSelect}
            className={`group relative flex-1 text-left rounded-xl border p-4 transition-all disabled:cursor-not-allowed disabled:opacity-70 ${
                selected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/30 shadow-sm'
                    : 'border-border bg-card hover:border-primary/40 hover:bg-secondary/40'
            }`}
        >
            <div className="flex items-start gap-3">
                <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors ${
                    selected ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground group-hover:text-foreground'
                }`}>
                    {icon}
                </span>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{title}</span>
                        {badge && (
                            <span className="inline-flex items-center rounded-full bg-status-accepted/15 px-2 py-0.5 text-[11px] font-medium text-status-accepted">
                                {badge}
                            </span>
                        )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                </div>
                <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    selected ? 'border-primary bg-primary text-white' : 'border-border bg-transparent'
                }`}>
                    {selected && <Check className="h-3 w-3" strokeWidth={3} />}
                </span>
            </div>
        </button>
    );
}

export default function EmailProviderTab({ emailProvider, onProviderChange }: EmailProviderTabProps) {
    const tr = useTranslations('settings');
    const [isSwitching, setIsSwitching] = useState(false);

    const handleSelect = async (provider: 'smtp' | 'resend') => {
        if (provider === emailProvider || isSwitching) return;
        setIsSwitching(true);
        try {
            await onProviderChange(provider);
        } finally {
            setIsSwitching(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <h2 className="text-lg font-semibold text-foreground">{tr.emailProviderSelector.title}</h2>
                <p className="mb-5 text-sm text-muted-foreground">{tr.emailProviderSelector.subtitle}</p>

                <div className="flex flex-col gap-3 sm:flex-row" role="radiogroup">
                    <ProviderCard
                        icon={<Zap className="h-5 w-5" />}
                        title={tr.emailProviderSelector.resendOption}
                        description={tr.emailProviderSelector.resendOptionDesc}
                        badge={tr.emailProviderSelector.recommendedBadge}
                        selected={emailProvider === 'resend'}
                        disabled={isSwitching}
                        onSelect={() => handleSelect('resend')}
                    />
                    <ProviderCard
                        icon={<Server className="h-5 w-5" />}
                        title={tr.emailProviderSelector.smtpOption}
                        description={tr.emailProviderSelector.smtpOptionDesc}
                        selected={emailProvider === 'smtp'}
                        disabled={isSwitching}
                        onSelect={() => handleSelect('smtp')}
                    />
                </div>

                <div className="mt-5 flex items-start gap-3 rounded-xl border p-4" style={{ borderColor: 'rgba(217, 119, 6, 0.3)', backgroundColor: 'rgba(217, 119, 6, 0.08)' }}>
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" style={{ color: '#d97706' }} />
                    <p className="text-sm" style={{ color: '#b45309' }}>{tr.emailProviderSelector.renderWarning}</p>
                </div>
            </div>

            <ResendSection isActive={emailProvider === 'resend'} />
            <SmtpSection isActive={emailProvider === 'smtp'} />
        </div>
    );
}

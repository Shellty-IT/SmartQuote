// src/app/dashboard/settings/components/NotificationsSection.tsx
'use client';

import { useState } from 'react';
import { Card } from '@/components/ui';
import type { UserSettings, UpdateSettingsInput } from '@/types';

interface Props {
    settings: UserSettings;
    onUpdate: (data: UpdateSettingsInput) => Promise<UserSettings>;
}

interface ToggleProps {
    enabled: boolean;
    onChange: (enabled: boolean) => void;
    disabled?: boolean;
}

function Toggle({ enabled, onChange, disabled }: ToggleProps) {
    return (
        <button
            type="button"
            onClick={() => !disabled && onChange(!enabled)}
            disabled={disabled}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${
                enabled ? 'bg-cyan-500' : 'bg-slate-300'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${
                    enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
            />
        </button>
    );
}

export default function NotificationsSection({ settings, onUpdate }: Props) {
    const [isSaving, setIsSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [localSettings, setLocalSettings] = useState({
        emailNotifications: settings.emailNotifications,
        offerNotifications: settings.offerNotifications,
        followUpReminders: settings.followUpReminders,
        weeklyReport: settings.weeklyReport,
    });

    const handleToggle = async (key: keyof typeof localSettings, value: boolean) => {
        setLocalSettings(prev => ({ ...prev, [key]: value }));
        setIsSaving(true);
        setSuccess(false);

        try {
            await onUpdate({ [key]: value });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 2000);
        } catch (error: unknown) {
            setLocalSettings(prev => ({ ...prev, [key]: !value }));
            console.error('Failed to update notifications:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const notifications = [
        {
            key: 'emailNotifications' as const,
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            ),
            title: 'Powiadomienia email',
            description: 'Otrzymuj powiadomienia na adres email',
            enabled: localSettings.emailNotifications,
        },
        {
            key: 'offerNotifications' as const,
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
            title: 'Powiadomienia o ofertach',
            description: 'Informacje o zmianach statusu ofert',
            enabled: localSettings.offerNotifications,
        },
        {
            key: 'followUpReminders' as const,
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            ),
            title: 'Przypomnienia follow-up',
            description: 'Przypomnienia o zaplanowanych zadaniach',
            enabled: localSettings.followUpReminders,
        },
        {
            key: 'weeklyReport' as const,
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
            title: 'Raport tygodniowy',
            description: 'Podsumowanie aktywności co tydzień',
            enabled: localSettings.weeklyReport,
        },
    ];

    return (
        <Card>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-themed">Powiadomienia</h2>
                    <p className="text-sm text-themed-muted">Zarządzaj preferencjami powiadomień</p>
                </div>
                <div className="flex items-center gap-2">
                    {success && (
                        <div className="flex items-center gap-1.5 text-emerald-500 text-sm">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Zapisano</span>
                        </div>
                    )}
                    {isSaving && (
                        <svg className="w-4 h-4 animate-spin text-cyan-500" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                    )}
                </div>
            </div>

            <div className="space-y-1">
                {notifications.map((item, index) => (
                    <div
                        key={item.key}
                        className={`flex items-center justify-between p-4 rounded-xl hover-themed transition-colors ${
                            index !== notifications.length - 1 ? 'border-b divider-themed' : ''
                        }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500">
                                {item.icon}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-themed">{item.title}</p>
                                <p className="text-sm text-themed-muted">{item.description}</p>
                            </div>
                        </div>
                        <Toggle
                            enabled={item.enabled}
                            onChange={(value) => handleToggle(item.key, value)}
                            disabled={isSaving}
                        />
                    </div>
                ))}
            </div>

            <div className="mt-6 pt-6 border-t divider-themed">
                <div className="flex items-start gap-3 p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                    <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <div>
                        <p className="text-sm font-medium text-amber-700">Wskazówka</p>
                        <p className="text-sm text-amber-600">
                            Powiadomienia email są wysyłane tylko gdy jesteś offline.
                            Gdy korzystasz z aplikacji, zobaczysz powiadomienia w interfejsie.
                        </p>
                    </div>
                </div>
            </div>
        </Card>
    );
}
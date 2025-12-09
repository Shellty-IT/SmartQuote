// src/app/dashboard/settings/components/NotificationsSection.tsx

'use client';

import { useState } from 'react';
import { Bell, Mail, Calendar, FileText, BarChart3, Loader2, Check } from 'lucide-react';
import { Card } from '@/components/ui';
import Button from '@/components/ui/Button';
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
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                enabled ? 'bg-cyan-500' : 'bg-slate-200'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
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
        } catch (error) {
            // Revert on error
            setLocalSettings(prev => ({ ...prev, [key]: !value }));
            console.error('Failed to update notifications:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const notifications = [
        {
            key: 'emailNotifications' as const,
            icon: <Mail className="w-5 h-5" />,
            title: 'Powiadomienia email',
            description: 'Otrzymuj powiadomienia na adres email',
            enabled: localSettings.emailNotifications,
        },
        {
            key: 'offerNotifications' as const,
            icon: <FileText className="w-5 h-5" />,
            title: 'Powiadomienia o ofertach',
            description: 'Informacje o zmianach statusu ofert',
            enabled: localSettings.offerNotifications,
        },
        {
            key: 'followUpReminders' as const,
            icon: <Calendar className="w-5 h-5" />,
            title: 'Przypomnienia follow-up',
            description: 'Przypomnienia o zaplanowanych zadaniach',
            enabled: localSettings.followUpReminders,
        },
        {
            key: 'weeklyReport' as const,
            icon: <BarChart3 className="w-5 h-5" />,
            title: 'Raport tygodniowy',
            description: 'Podsumowanie aktywności co tydzień',
            enabled: localSettings.weeklyReport,
        },
    ];

    return (
        <Card>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">Powiadomienia</h2>
                    <p className="text-sm text-slate-500">Zarządzaj preferencjami powiadomień</p>
                </div>
                {success && (
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                        <Check className="w-4 h-4" />
                        Zapisano
                    </div>
                )}
                {isSaving && (
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-500" />
                )}
            </div>

            <div className="space-y-1">
                {notifications.map((item, index) => (
                    <div
                        key={item.key}
                        className={`flex items-center justify-between p-4 rounded-lg hover:bg-slate-50 transition-colors ${
                            index !== notifications.length - 1 ? 'border-b border-slate-100' : ''
                        }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center text-cyan-600">
                                {item.icon}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-900">{item.title}</p>
                                <p className="text-sm text-slate-500">{item.description}</p>
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

            <div className="mt-6 pt-6 border-t border-slate-100">
                <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg">
                    <Bell className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-amber-800">Wskazówka</p>
                        <p className="text-sm text-amber-700">
                            Powiadomienia email są wysyłane tylko gdy jesteś offline.
                            Gdy korzystasz z aplikacji, zobaczysz powiadomienia w interfejsie.
                        </p>
                    </div>
                </div>
            </div>
        </Card>
    );
}
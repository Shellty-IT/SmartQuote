// src/app/dashboard/settings/components/AppearanceSection.tsx
'use client';

import { useState } from 'react';
import { Sun, Moon, Languages, Loader2, Check } from 'lucide-react';
import { Card } from '@/components/ui';
import { useTheme } from '@/app/providers';
import type { UserSettings, UpdateSettingsInput } from '@/types';

interface Props {
    settings: UserSettings;
    onUpdate: (data: UpdateSettingsInput) => Promise<UserSettings>;
}

export default function AppearanceSection({ settings, onUpdate }: Props) {
    const { theme, setTheme } = useTheme();
    const [isSaving, setIsSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [localLanguage, setLocalLanguage] = useState(settings.language);

    const handleThemeChange = async (newTheme: 'light' | 'dark') => {
        setTheme(newTheme);
        setIsSaving(true);
        setSuccess(false);

        try {
            await onUpdate({ theme: newTheme } as UpdateSettingsInput);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 2000);
        } catch (error: unknown) {
            console.error('Failed to update theme:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleLanguageChange = async (value: 'pl' | 'en') => {
        const previousValue = localLanguage;
        setLocalLanguage(value);
        setIsSaving(true);
        setSuccess(false);

        try {
            await onUpdate({ language: value } as UpdateSettingsInput);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 2000);
        } catch (error: unknown) {
            setLocalLanguage(previousValue);
            console.error('Failed to update language:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const themes = [
        {
            id: 'light' as const,
            label: 'Jasny',
            icon: <Sun className="w-6 h-6" />,
            description: 'Klasyczny jasny motyw w odcieniach błękitu',
            preview: {
                bg: 'bg-gradient-to-br from-slate-50 to-cyan-50',
                sidebar: 'bg-slate-900',
                header: 'bg-white',
                card: 'bg-white border-slate-200',
                text: 'bg-slate-300',
                textSm: 'bg-slate-200',
                accent: 'bg-cyan-500',
            },
        },
        {
            id: 'dark' as const,
            label: 'Ciemny',
            icon: <Moon className="w-6 h-6" />,
            description: 'Elegancki ciemny motyw w odcieniach granatu',
            preview: {
                bg: 'bg-gradient-to-br from-[#0b1120] to-[#111827]',
                sidebar: 'bg-[#050a18]',
                header: 'bg-[#111827]',
                card: 'bg-[#111827] border-slate-700',
                text: 'bg-slate-600',
                textSm: 'bg-slate-700',
                accent: 'bg-cyan-500',
            },
        },
    ];

    const languages = [
        { id: 'pl', label: 'Polski', flag: '🇵🇱' },
        { id: 'en', label: 'English', flag: '🇬🇧' },
    ] as const;

    return (
        <div className="space-y-6">
            <Card>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-semibold text-themed">Motyw</h2>
                        <p className="text-sm text-themed-muted">Wybierz preferowany wygląd aplikacji</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {success && (
                            <div className="flex items-center gap-1.5 text-emerald-600 text-sm">
                                <Check className="w-4 h-4" />
                                <span>Zapisano</span>
                            </div>
                        )}
                        {isSaving && <Loader2 className="w-4 h-4 animate-spin text-cyan-500" />}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {themes.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => handleThemeChange(t.id)}
                            disabled={isSaving}
                            className={`relative rounded-2xl border-2 transition-all duration-300 text-left overflow-hidden group ${
                                theme === t.id
                                    ? 'border-cyan-500 shadow-lg shadow-cyan-500/20'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                            } ${isSaving ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            {theme === t.id && (
                                <div className="absolute top-3 right-3 z-10 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center">
                                    <Check className="w-3.5 h-3.5 text-white" />
                                </div>
                            )}

                            <div className={`p-3 ${t.preview.bg} relative overflow-hidden`}>
                                <div className="flex gap-2 h-24 rounded-lg overflow-hidden border border-black/10">
                                    <div className={`w-10 ${t.preview.sidebar} flex flex-col items-center pt-3 gap-2`}>
                                        <div className="w-5 h-5 rounded bg-cyan-500/30" />
                                        <div className="w-5 h-1 rounded bg-white/20" />
                                        <div className="w-5 h-1 rounded bg-white/20" />
                                        <div className="w-5 h-1 rounded bg-white/20" />
                                    </div>
                                    <div className="flex-1 flex flex-col">
                                        <div className={`h-6 ${t.preview.header} border-b border-black/5 flex items-center px-2`}>
                                            <div className={`w-12 h-1.5 rounded ${t.preview.text}`} />
                                        </div>
                                        <div className="flex-1 p-2 space-y-2">
                                            <div className="flex gap-2">
                                                <div className={`flex-1 h-8 rounded ${t.preview.card} border`} />
                                                <div className={`flex-1 h-8 rounded ${t.preview.card} border`} />
                                            </div>
                                            <div className={`h-12 rounded ${t.preview.card} border`} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                                        theme === t.id
                                            ? 'bg-cyan-500 text-white'
                                            : 'bg-slate-100 text-slate-500'
                                    }`}>
                                        {t.icon}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-themed">{t.label}</p>
                                        <p className="text-xs text-themed-muted">{t.description}</p>
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </Card>

            <Card>
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-themed">Język</h2>
                    <p className="text-sm text-themed-muted">Wybierz język interfejsu</p>
                </div>

                <div className="flex gap-4">
                    {languages.map((lang) => (
                        <button
                            key={lang.id}
                            onClick={() => handleLanguageChange(lang.id)}
                            disabled={isSaving}
                            className={`flex items-center gap-3 px-5 py-3.5 rounded-xl border-2 transition-all ${
                                localLanguage === lang.id
                                    ? 'border-cyan-500 bg-cyan-50'
                                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            } ${isSaving ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            <span className="text-2xl">{lang.flag}</span>
                            <span className="font-medium text-themed">{lang.label}</span>
                            {localLanguage === lang.id && (
                                <Check className="w-4 h-4 text-cyan-500 ml-1" />
                            )}
                        </button>
                    ))}
                </div>

                <div className="mt-4 flex items-start gap-2 text-sm text-themed-muted">
                    <Languages className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p>Zmiana języka wpłynie na cały interfejs aplikacji po odświeżeniu strony.</p>
                </div>
            </Card>
        </div>
    );
}
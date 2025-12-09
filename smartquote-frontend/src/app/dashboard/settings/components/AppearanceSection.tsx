// src/app/dashboard/settings/components/AppearanceSection.tsx

'use client';

import { useState } from 'react';
import { Sun, Moon, Monitor, Languages, Loader2, Check } from 'lucide-react';
import { Card } from '@/components/ui';
import type { UserSettings, UpdateSettingsInput } from '@/types';

interface Props {
    settings: UserSettings;
    onUpdate: (data: UpdateSettingsInput) => Promise<UserSettings>;
}

export default function AppearanceSection({ settings, onUpdate }: Props) {
    const [isSaving, setIsSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [localSettings, setLocalSettings] = useState({
        theme: settings.theme,
        language: settings.language,
    });

    const handleChange = async (key: 'theme' | 'language', value: string) => {
        const previousValue = localSettings[key];
        setLocalSettings(prev => ({ ...prev, [key]: value }));
        setIsSaving(true);
        setSuccess(false);

        try {
            await onUpdate({ [key]: value } as UpdateSettingsInput);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 2000);
        } catch (error) {
            setLocalSettings(prev => ({ ...prev, [key]: previousValue }));
            console.error('Failed to update appearance:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const themes = [
        { id: 'light', label: 'Jasny', icon: <Sun className="w-5 h-5" />, description: 'Klasyczny jasny motyw' },
        { id: 'dark', label: 'Ciemny', icon: <Moon className="w-5 h-5" />, description: 'Łagodny dla oczu w nocy' },
        { id: 'system', label: 'Systemowy', icon: <Monitor className="w-5 h-5" />, description: 'Dopasuj do systemu' },
    ];

    const languages = [
        { id: 'pl', label: 'Polski', flag: '🇵🇱' },
        { id: 'en', label: 'English', flag: '🇬🇧' },
    ];

    return (
        <div className="space-y-6">
            {/* Theme */}
            <Card>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Motyw</h2>
                        <p className="text-sm text-slate-500">Wybierz preferowany wygląd aplikacji</p>
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {themes.map((theme) => (
                        <button
                            key={theme.id}
                            onClick={() => handleChange('theme', theme.id)}
                            disabled={isSaving}
                            className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                                localSettings.theme === theme.id
                                    ? 'border-cyan-500 bg-cyan-50'
                                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            } ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            {localSettings.theme === theme.id && (
                                <div className="absolute top-2 right-2">
                                    <Check className="w-4 h-4 text-cyan-500" />
                                </div>
                            )}
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                                localSettings.theme === theme.id
                                    ? 'bg-cyan-500 text-white'
                                    : 'bg-slate-100 text-slate-600'
                            }`}>
                                {theme.icon}
                            </div>
                            <p className="font-medium text-slate-900">{theme.label}</p>
                            <p className="text-sm text-slate-500">{theme.description}</p>
                        </button>
                    ))}
                </div>

                {/* Preview */}
                <div className="mt-6 pt-6 border-t border-slate-100">
                    <p className="text-sm text-slate-500 mb-4">Podgląd</p>
                    <div className={`p-4 rounded-lg border ${
                        localSettings.theme === 'dark'
                            ? 'bg-slate-800 border-slate-700'
                            : 'bg-white border-slate-200'
                    }`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full ${
                                localSettings.theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'
                            }`} />
                            <div className="flex-1">
                                <div className={`h-3 w-32 rounded ${
                                    localSettings.theme === 'dark' ? 'bg-slate-600' : 'bg-slate-200'
                                }`} />
                                <div className={`h-2 w-48 rounded mt-2 ${
                                    localSettings.theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'
                                }`} />
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Language */}
            <Card>
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-slate-900">Język</h2>
                    <p className="text-sm text-slate-500">Wybierz język interfejsu</p>
                </div>

                <div className="flex gap-4">
                    {languages.map((lang) => (
                        <button
                            key={lang.id}
                            onClick={() => handleChange('language', lang.id)}
                            disabled={isSaving}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all ${
                                localSettings.language === lang.id
                                    ? 'border-cyan-500 bg-cyan-50'
                                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            } ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            <span className="text-2xl">{lang.flag}</span>
                            <span className="font-medium text-slate-900">{lang.label}</span>
                            {localSettings.language === lang.id && (
                                <Check className="w-4 h-4 text-cyan-500 ml-2" />
                            )}
                        </button>
                    ))}
                </div>

                <div className="mt-4 flex items-start gap-2 text-sm text-slate-500">
                    <Languages className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p>Zmiana języka wpłynie na cały interfejs aplikacji po odświeżeniu strony.</p>
                </div>
            </Card>
        </div>
    );
}
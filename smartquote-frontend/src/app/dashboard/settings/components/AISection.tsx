// src/app/dashboard/settings/components/AISection.tsx

'use client';

import { useState } from 'react';
import { Bot, Sparkles, MessageSquare, Loader2, Check } from 'lucide-react';
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

export default function AISection({ settings, onUpdate }: Props) {
    const [isSaving, setIsSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [localSettings, setLocalSettings] = useState({
        aiTone: settings.aiTone,
        aiAutoSuggestions: settings.aiAutoSuggestions,
    });

    const handleToneChange = async (tone: 'professional' | 'friendly' | 'formal') => {
        const previousTone = localSettings.aiTone;
        setLocalSettings(prev => ({ ...prev, aiTone: tone }));
        setIsSaving(true);
        setSuccess(false);

        try {
            await onUpdate({ aiTone: tone });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 2000);
        } catch (error) {
            setLocalSettings(prev => ({ ...prev, aiTone: previousTone }));
            console.error('Failed to update AI tone:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggle = async (value: boolean) => {
        setLocalSettings(prev => ({ ...prev, aiAutoSuggestions: value }));
        setIsSaving(true);
        setSuccess(false);

        try {
            await onUpdate({ aiAutoSuggestions: value });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 2000);
        } catch (error) {
            setLocalSettings(prev => ({ ...prev, aiAutoSuggestions: !value }));
            console.error('Failed to update AI suggestions:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const tones = [
        {
            id: 'professional' as const,
            label: 'Profesjonalny',
            description: 'Formalny i rzeczowy ton komunikacji',
            example: 'Szanowny Panie, w nawiązaniu do naszej rozmowy...',
        },
        {
            id: 'friendly' as const,
            label: 'Przyjazny',
            description: 'Ciepły i bezpośredni styl',
            example: 'Cześć! Cieszę się, że mogę Ci pomóc...',
        },
        {
            id: 'formal' as const,
            label: 'Formalny',
            description: 'Bardzo oficjalny, dla korporacji',
            example: 'Szanowni Państwo, uprzejmie informuję...',
        },
    ];

    return (
        <div className="space-y-6">
            {/* AI Tone */}
            <Card>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Ton AI Asystenta</h2>
                        <p className="text-sm text-slate-500">Jak AI powinien formułować odpowiedzi</p>
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

                <div className="space-y-3">
                    {tones.map((tone) => (
                        <button
                            key={tone.id}
                            onClick={() => handleToneChange(tone.id)}
                            disabled={isSaving}
                            className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                                localSettings.aiTone === tone.id
                                    ? 'border-cyan-500 bg-cyan-50'
                                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            } ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-slate-900">{tone.label}</span>
                                {localSettings.aiTone === tone.id && (
                                    <Check className="w-4 h-4 text-cyan-500" />
                                )}
                            </div>
                            <p className="text-sm text-slate-500 mb-3">{tone.description}</p>
                            <div className="flex items-start gap-2 p-3 bg-white rounded-lg border border-slate-100">
                                <MessageSquare className="w-4 h-4 text-cyan-500 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-slate-600 italic">&quot;{tone.example}&quot;</p>
                            </div>
                        </button>
                    ))}
                </div>
            </Card>

            {/* Auto Suggestions */}
            <Card>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-medium text-slate-900">Automatyczne sugestie AI</h3>
                            <p className="text-sm text-slate-500">
                                AI będzie proaktywnie sugerować akcje i ulepszenia
                            </p>
                        </div>
                    </div>
                    <Toggle
                        enabled={localSettings.aiAutoSuggestions}
                        onChange={handleToggle}
                        disabled={isSaving}
                    />
                </div>

                {localSettings.aiAutoSuggestions && (
                    <div className="mt-6 pt-6 border-t border-slate-100">
                        <p className="text-sm text-slate-500 mb-3">AI będzie sugerować:</p>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                'Ulepszenia treści ofert',
                                'Optymalne terminy follow-up',
                                'Podobnych klientów',
                                'Szablony emaili',
                            ].map((item) => (
                                <div key={item} className="flex items-center gap-2 text-sm text-slate-600">
                                    <Check className="w-4 h-4 text-green-500" />
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </Card>

            {/* AI Info */}
            <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-200">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center">
                        <Bot className="w-6 h-6 text-cyan-600" />
                    </div>
                    <div>
                        <h3 className="font-medium text-slate-900 mb-1">O AI Asystencie</h3>
                        <p className="text-sm text-slate-600">
                            AI Asystent wykorzystuje zaawansowane modele językowe do pomocy w tworzeniu
                            ofert, generowaniu emaili i analizie danych klientów. Twoje dane są bezpieczne
                            i nie są wykorzystywane do trenowania modeli.
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
}
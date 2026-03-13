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
        } catch (error: unknown) {
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
        } catch (error: unknown) {
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
            <Card>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-semibold text-themed">Ton AI Asystenta</h2>
                        <p className="text-sm text-themed-muted">Jak AI powinien formułować odpowiedzi</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {success && (
                            <div className="flex items-center gap-1.5 text-emerald-500 text-sm">
                                <Check className="w-4 h-4" />
                                <span>Zapisano</span>
                            </div>
                        )}
                        {isSaving && <Loader2 className="w-4 h-4 animate-spin text-cyan-500" />}
                    </div>
                </div>

                <div className="space-y-3">
                    {tones.map((tone) => (
                        <button
                            key={tone.id}
                            onClick={() => handleToneChange(tone.id)}
                            disabled={isSaving}
                            className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                                localSettings.aiTone === tone.id
                                    ? 'tone-active'
                                    : 'tone-hover'
                            } ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            style={{
                                borderColor: localSettings.aiTone === tone.id ? 'var(--tone-active-border)' : 'var(--card-border)',
                                backgroundColor: localSettings.aiTone === tone.id ? 'var(--tone-active-bg)' : 'transparent',
                            }}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-themed">{tone.label}</span>
                                {localSettings.aiTone === tone.id && (
                                    <Check className="w-4 h-4 text-cyan-500" />
                                )}
                            </div>
                            <p className="text-sm text-themed-muted mb-3">{tone.description}</p>
                            <div
                                className="flex items-start gap-2 p-3 rounded-lg border"
                                style={{
                                    backgroundColor: 'var(--ai-example-bg)',
                                    borderColor: 'var(--card-border)',
                                }}
                            >
                                <MessageSquare className="w-4 h-4 text-cyan-500 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-themed-muted italic">&quot;{tone.example}&quot;</p>
                            </div>
                        </button>
                    ))}
                </div>
            </Card>

            <Card>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-medium text-themed">Automatyczne sugestie AI</h3>
                            <p className="text-sm text-themed-muted">
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
                    <div className="mt-6 pt-6 border-t divider-themed">
                        <p className="text-sm text-themed-muted mb-3">AI będzie sugerować:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                                'Ulepszenia treści ofert',
                                'Optymalne terminy follow-up',
                                'Podobnych klientów',
                                'Szablony emaili',
                            ].map((item) => (
                                <div key={item} className="flex items-center gap-2 text-sm text-themed">
                                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </Card>

            <div
                className="rounded-2xl border p-6 transition-colors duration-300"
                style={{
                    background: `linear-gradient(135deg, var(--ai-info-from), var(--ai-info-to))`,
                    borderColor: 'var(--ai-card-border)',
                }}
            >
                <div className="flex items-start gap-4">
                    <div
                        className="w-12 h-12 rounded-xl shadow-sm flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'var(--card-bg)' }}
                    >
                        <Bot className="w-6 h-6 text-cyan-500" />
                    </div>
                    <div>
                        <h3 className="font-medium text-themed mb-1">O AI Asystencie</h3>
                        <p className="text-sm text-themed-muted leading-relaxed">
                            AI Asystent wykorzystuje zaawansowane modele językowe do pomocy w tworzeniu
                            ofert, generowaniu emaili i analizie danych klientów. Twoje dane są bezpieczne
                            i nie są wykorzystywane do trenowania modeli.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
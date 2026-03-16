// src/app/dashboard/settings/components/SmtpSection.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useSmtpConfig } from '@/hooks/useSettings';
import { Card } from '@/components/ui';
import { Mail, Shield, Loader2, Check, X, AlertTriangle, Wifi, Trash2 } from 'lucide-react';

const PRESETS: Record<string, { host: string; port: number; note: string }> = {
    gmail: { host: 'smtp.gmail.com', port: 587, note: 'Wymaga hasła aplikacji Google' },
    outlook: { host: 'smtp.office365.com', port: 587, note: 'Konto Microsoft 365 / Outlook' },
    wp: { host: 'smtp.wp.pl', port: 465, note: 'Konto WP Poczta' },
    onet: { host: 'smtp.poczta.onet.pl', port: 465, note: 'Konto Onet Poczta' },
    custom: { host: '', port: 587, note: 'Własny serwer SMTP' },
};

export default function SmtpSection() {
    const { config, isLoading, isSaving, isTesting, isDeleting, error, updateConfig, testConnection, deleteConfig } = useSmtpConfig();

    const [form, setForm] = useState({
        smtpHost: '',
        smtpPort: 587,
        smtpUser: '',
        smtpPass: '',
        smtpFrom: '',
    });

    const [selectedPreset, setSelectedPreset] = useState<string>('custom');
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);

    const configLoaded = useRef(false);

    useEffect(() => {
        if (!config || configLoaded.current) return;
        configLoaded.current = true;

        requestAnimationFrame(() => {
            setForm({
                smtpHost: config.smtpHost || '',
                smtpPort: config.smtpPort || 587,
                smtpUser: config.smtpUser || '',
                smtpPass: '',
                smtpFrom: config.smtpFrom || '',
            });

            if (config.smtpHost) {
                const found = Object.entries(PRESETS).find(([, p]) => p.host === config.smtpHost);
                setSelectedPreset(found ? found[0] : 'custom');
            }
        });
    }, [config]);

    const handlePresetChange = (key: string) => {
        setSelectedPreset(key);
        const p = PRESETS[key];
        if (key !== 'custom' && p) {
            setForm(prev => ({ ...prev, smtpHost: p.host, smtpPort: p.port }));
        }
        setTestResult(null);
    };

    const handleChange = (field: string, value: string | number) => {
        setForm(prev => ({ ...prev, [field]: value }));
        setTestResult(null);
        setSaveSuccess(false);
    };

    const handleTest = async () => {
        setTestResult(null);
        try {
            const password = form.smtpPass || (config?.smtpPass === '••••••••' ? '' : '');
            if (!form.smtpHost || !form.smtpUser || (!password && !config?.smtpConfigured)) {
                setTestResult({ success: false, message: 'Wypełnij host, użytkownika i hasło' });
                return;
            }

            const result = await testConnection({
                host: form.smtpHost,
                port: form.smtpPort,
                user: form.smtpUser,
                pass: password || 'placeholder',
                from: form.smtpFrom || form.smtpUser,
            });
            setTestResult({ success: result.connected, message: result.message });
        } catch (err: unknown) {
            setTestResult({ success: false, message: err instanceof Error ? err.message : 'Błąd testu' });
        }
    };

    const handleSave = async () => {
        setSaveSuccess(false);
        try {
            await updateConfig({
                smtpHost: form.smtpHost,
                smtpPort: form.smtpPort,
                smtpUser: form.smtpUser,
                smtpPass: form.smtpPass || undefined,
                smtpFrom: form.smtpFrom || undefined,
            });
            setSaveSuccess(true);
            setForm(prev => ({ ...prev, smtpPass: '' }));
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch {
        }
    };

    const handleDelete = async () => {
        try {
            await deleteConfig();
            setForm({ smtpHost: '', smtpPort: 587, smtpUser: '', smtpPass: '', smtpFrom: '' });
            setSelectedPreset('custom');
            setTestResult(null);
            setDeleteConfirm(false);
            configLoaded.current = false;
        } catch {
        }
    };

    const canSave = form.smtpHost && form.smtpUser && (form.smtpPass || config?.smtpConfigured);
    const canTest = form.smtpHost && form.smtpUser;

    if (isLoading) {
        return (
            <Card>
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
                </div>
            </Card>
        );
    }

    return (
        <Card>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-themed">Skrzynka pocztowa (SMTP)</h2>
                    <p className="text-sm text-themed-muted">Podłącz swoją skrzynkę do wysyłania maili z ofertami</p>
                </div>
                <div className="flex items-center gap-2">
                    {config?.smtpConfigured ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Skonfigurowano
            </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Nie skonfigurowano
            </span>
                    )}
                </div>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {error}
                </div>
            )}

            <div className="mb-6">
                <label className="block text-sm font-medium text-themed-label mb-2">Dostawca poczty</label>
                <div className="flex flex-wrap gap-2">
                    {Object.entries(PRESETS).map(([key]) => (
                        <button
                            key={key}
                            onClick={() => handlePresetChange(key)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                                selectedPreset === key
                                    ? 'bg-cyan-50 dark:bg-cyan-900/30 border-cyan-300 dark:border-cyan-700 text-cyan-700 dark:text-cyan-400'
                                    : 'card-themed text-themed-muted hover-themed'
                            }`}
                        >
                            {key === 'gmail' ? 'Gmail' :
                                key === 'outlook' ? 'Outlook / M365' :
                                    key === 'wp' ? 'WP' :
                                        key === 'onet' ? 'Onet' : 'Własny serwer'}
                        </button>
                    ))}
                </div>
                {selectedPreset !== 'custom' && (
                    <p className="mt-2 text-xs text-themed-muted">{PRESETS[selectedPreset]?.note}</p>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="block text-sm font-medium text-themed-label mb-1">Host SMTP</label>
                    <input
                        type="text"
                        value={form.smtpHost}
                        onChange={(e) => handleChange('smtpHost', e.target.value)}
                        placeholder="smtp.gmail.com"
                        className="w-full px-3 py-2.5 rounded-xl border input-themed focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-themed-label mb-1">Port</label>
                    <input
                        type="number"
                        value={form.smtpPort}
                        onChange={(e) => handleChange('smtpPort', parseInt(e.target.value) || 587)}
                        placeholder="587"
                        className="w-full px-3 py-2.5 rounded-xl border input-themed focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                    />
                    <p className="mt-1 text-xs text-themed-muted">587 (STARTTLS) lub 465 (SSL)</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-themed-label mb-1">Użytkownik (login)</label>
                    <input
                        type="text"
                        value={form.smtpUser}
                        onChange={(e) => handleChange('smtpUser', e.target.value)}
                        placeholder="twoj@email.com"
                        className="w-full px-3 py-2.5 rounded-xl border input-themed focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-themed-label mb-1">
                        Hasło {config?.smtpConfigured && <span className="text-themed-muted font-normal">(zostaw puste aby nie zmieniać)</span>}
                    </label>
                    <input
                        type="password"
                        value={form.smtpPass}
                        onChange={(e) => handleChange('smtpPass', e.target.value)}
                        placeholder={config?.smtpConfigured ? '••••••••' : 'Hasło lub hasło aplikacji'}
                        className="w-full px-3 py-2.5 rounded-xl border input-themed focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-themed-label mb-1">
                        Adres nadawcy <span className="text-themed-muted font-normal">(opcjonalny)</span>
                    </label>
                    <input
                        type="text"
                        value={form.smtpFrom}
                        onChange={(e) => handleChange('smtpFrom', e.target.value)}
                        placeholder="Firma <twoj@email.com>"
                        className="w-full px-3 py-2.5 rounded-xl border input-themed focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                    />
                    <p className="mt-1 text-xs text-themed-muted">Np. &quot;SmartQuote &lt;oferty@firma.pl&gt;&quot; — domyślnie używany login</p>
                </div>
            </div>

            {testResult && (
                <div className={`mb-4 p-3 rounded-xl text-sm flex items-start gap-2 ${
                    testResult.success
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                        : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
                }`}>
                    {testResult.success ? <Check className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <X className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                    {testResult.message}
                </div>
            )}

            <div className="flex flex-wrap items-center gap-3 mb-6">
                <button
                    onClick={handleTest}
                    disabled={!canTest || isTesting}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border card-themed text-themed font-medium text-sm hover-themed transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isTesting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Wifi className="w-4 h-4" />
                    )}
                    {isTesting ? 'Testuję...' : 'Testuj połączenie'}
                </button>
                <button
                    onClick={handleSave}
                    disabled={!canSave || isSaving}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 text-white font-medium text-sm hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : saveSuccess ? (
                        <Check className="w-4 h-4" />
                    ) : (
                        <Mail className="w-4 h-4" />
                    )}
                    {isSaving ? 'Zapisuję...' : saveSuccess ? 'Zapisano!' : 'Zapisz konfigurację'}
                </button>
                {config?.smtpConfigured && (
                    <>
                        {deleteConfirm ? (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-red-600 dark:text-red-400">Na pewno?</span>
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="px-3 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-50"
                                >
                                    {isDeleting ? 'Usuwam...' : 'Tak, usuń'}
                                </button>
                                <button
                                    onClick={() => setDeleteConfirm(false)}
                                    className="px-3 py-2 rounded-lg border card-themed text-themed-muted text-sm hover-themed"
                                >
                                    Anuluj
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setDeleteConfirm(true)}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-medium text-sm hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                Usuń
                            </button>
                        )}
                    </>
                )}
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Bezpieczeństwo</p>
                        <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                            Hasło jest szyfrowane algorytmem AES-256 i przechowywane w zaszyfrowanej formie.
                            Nigdy nie jest wyświetlane po zapisaniu. Połączenie z serwerem SMTP odbywa się
                            przez szyfrowany kanał TLS/SSL.
                        </p>
                    </div>
                </div>
            </div>

            {selectedPreset === 'gmail' && (
                <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Gmail — hasło aplikacji</p>
                            <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                                Gmail wymaga &quot;hasła aplikacji&quot; zamiast zwykłego hasła.
                                Wejdź na myaccount.google.com → Bezpieczeństwo → Weryfikacja dwuetapowa →
                                Hasła aplikacji, wygeneruj nowe hasło i wklej je tutaj.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
}
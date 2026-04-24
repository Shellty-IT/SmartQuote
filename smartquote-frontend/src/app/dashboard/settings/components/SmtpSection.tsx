// src/app/dashboard/settings/components/SmtpSection.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useSmtpConfig } from '@/hooks/useSettings';
import { Card } from '@/components/ui';

const PRESETS: Record<string, { host: string; port: number; note: string }> = {
    gmail: { host: 'smtp.gmail.com', port: 587, note: 'Wymaga hasła aplikacji Google' },
    outlook: { host: 'smtp.office365.com', port: 587, note: 'Konto Microsoft 365 / Outlook' },
    wp: { host: 'smtp.wp.pl', port: 465, note: 'Konto WP Poczta' },
    onet: { host: 'smtp.poczta.onet.pl', port: 465, note: 'Konto Onet Poczta' },
    custom: { host: '', port: 587, note: 'Własny serwer SMTP' },
};

export default function SmtpSection() {
    const {
        config,
        isLoading,
        isSaving,
        isTesting,
        isDeleting,
        error,
        updateConfig,
        testConnection,
        testSavedConnection,
        deleteConfig,
    } = useSmtpConfig();

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
            if (!form.smtpHost || !form.smtpUser) {
                setTestResult({ success: false, message: 'Wypełnij host i użytkownika' });
                return;
            }
            if (!form.smtpPass && config?.smtpConfigured) {
                const result = await testSavedConnection();
                setTestResult({ success: result.connected, message: result.message });
                return;
            }
            if (!form.smtpPass) {
                setTestResult({ success: false, message: 'Wypełnij hasło' });
                return;
            }
            const result = await testConnection({
                host: form.smtpHost,
                port: form.smtpPort,
                user: form.smtpUser,
                pass: form.smtpPass,
                from: form.smtpFrom || form.smtpUser,
            });
            setTestResult({ success: result.connected, message: result.message });
        } catch (err: unknown) {
            setTestResult({
                success: false,
                message: err instanceof Error ? err.message : 'Błąd testu',
            });
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
                    <svg className="w-6 h-6 animate-spin text-cyan-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
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
                    <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                    </svg>
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
                        onChange={e => handleChange('smtpHost', e.target.value)}
                        placeholder="smtp.gmail.com"
                        className="w-full px-3 py-2.5 rounded-xl border input-themed focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-themed-label mb-1">Port</label>
                    <input
                        type="number"
                        value={form.smtpPort}
                        onChange={e => handleChange('smtpPort', parseInt(e.target.value) || 587)}
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
                        onChange={e => handleChange('smtpUser', e.target.value)}
                        placeholder="twoj@email.com"
                        className="w-full px-3 py-2.5 rounded-xl border input-themed focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-themed-label mb-1">
                        Hasło{' '}
                        {config?.smtpConfigured && (
                            <span className="text-themed-muted font-normal">(zostaw puste aby nie zmieniać)</span>
                        )}
                    </label>
                    <input
                        type="password"
                        value={form.smtpPass}
                        onChange={e => handleChange('smtpPass', e.target.value)}
                        placeholder={config?.smtpConfigured ? '••••••••' : 'Hasło lub hasło aplikacji'}
                        className="w-full px-3 py-2.5 rounded-xl border input-themed focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-themed-label mb-1">
                        Nazwa nadawcy{' '}
                        <span className="text-themed-muted font-normal">(opcjonalna)</span>
                    </label>
                    <input
                        type="text"
                        value={form.smtpFrom}
                        onChange={e => handleChange('smtpFrom', e.target.value)}
                        placeholder="Tomek"
                        className="w-full px-3 py-2.5 rounded-xl border input-themed focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                    />
                    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                        <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                            <strong className="font-semibold">Jak to działa?</strong><br/>
                            Wpisz swoję <strong>imię</strong> lub <strong>nazwę firmy</strong> — np. <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900/40 rounded">Tomek</code> lub <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900/40 rounded">SmartQuote</code>.<br/>
                            Odbiorca zobaczy: <strong className="text-blue-800 dark:text-blue-300">Tomek &lt;{form.smtpUser || 'twoj@email.com'}&gt;</strong>
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-500 mt-2">
                            Możesz też wpisać pełny format: <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900/40 rounded">Tomek &lt;{form.smtpUser || 'twoj@email.com'}&gt;</code>
                        </p>
                    </div>
                </div>
            </div>

            {testResult && (
                <div className={`mb-4 p-3 rounded-xl text-sm flex items-start gap-2 ${
                    testResult.success
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                        : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
                }`}>
                    {testResult.success ? (
                        <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    )}
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
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                        </svg>
                    )}
                    {isTesting ? 'Testuję...' : 'Testuj połączenie'}
                </button>

                <button
                    onClick={handleSave}
                    disabled={!canSave || isSaving}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 text-white font-medium text-sm hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSaving ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                    ) : saveSuccess ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
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
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Usuń
                            </button>
                        )}
                    </>
                )}
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
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
                        <svg className="w-5 h-5 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                        </svg>
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
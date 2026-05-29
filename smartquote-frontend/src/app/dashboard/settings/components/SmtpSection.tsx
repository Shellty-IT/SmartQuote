// src/app/dashboard/settings/components/SmtpSection.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useSmtpConfig, useSenderEmail } from '@/hooks/useSettings';


const PRESETS: Record<string, { host: string; port: number; note: string }> = {
    gmail: { host: 'smtp.gmail.com', port: 587, note: 'Wymaga hasła aplikacji Google' },
    outlook: { host: 'smtp.office365.com', port: 587, note: 'Konto Microsoft 365 / Outlook' },
    wp: { host: 'smtp.wp.pl', port: 465, note: 'Konto WP Poczta' },
    onet: { host: 'smtp.poczta.onet.pl', port: 465, note: 'Konto Onet Poczta' },
    custom: { host: '', port: 587, note: 'Własny serwer SMTP' },
};

const PRESET_LABELS: Record<string, string> = {
    gmail: 'Gmail',
    outlook: 'Outlook / M365',
    wp: 'WP',
    onet: 'Onet',
    custom: 'Własny serwer',
};

export default function SmtpSection() {
    const {
        config,
        isLoading: smtpLoading,
        updateConfig,
        testConnection,
        testSavedConnection,
        deleteConfig,
    } = useSmtpConfig();

    const {
        senderEmail,
        isLoading: senderLoading,
        isSaving: senderSaving,
        error: senderError,
        updateEmail,
    } = useSenderEmail();

    const [senderEmailInput, setSenderEmailInput] = useState('');
    const [senderSaveSuccess, setSenderSaveSuccess] = useState(false);
    const senderLoaded = useRef(false);

    useEffect(() => {
        if (senderLoading || senderLoaded.current) return;
        senderLoaded.current = true;
        requestAnimationFrame(() => {
            setSenderEmailInput(senderEmail);
        });
    }, [senderEmail, senderLoading]);

    const handleSenderSave = async () => {
        setSenderSaveSuccess(false);
        try {
            await updateEmail(senderEmailInput.trim());
            setSenderSaveSuccess(true);
            setTimeout(() => setSenderSaveSuccess(false), 3000);
        } catch {
        }
    };

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
    const canSaveSender = senderEmailInput.trim().length > 0 && senderEmailInput.includes('@');

    if (smtpLoading || senderLoading) {
        return (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <div className="flex items-center justify-center py-12">
                    <svg className="w-6 h-6 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">

            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">Adres nadawcy</h2>
                        <p className="text-sm text-muted-foreground">Twój adres email widoczny dla odbiorców wiadomości</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-status-accepted/15 text-status-accepted text-xs font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-status-accepted" />
                        Aktywne
                    </span>
                </div>

                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/25 rounded-xl flex items-start gap-2">
                    <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-status-rejected" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-destructive">
                        Maile są wysyłane przez SmartQuote AI. Odbiorca zobaczy Twój adres jako nadawcę i może odpowiedzieć bezpośrednio na Twój email.
                    </span>
                </div>

                {senderError && (
                    <div className="mb-4 p-3 bg-destructive/10 border border-destructive/25 rounded-xl text-sm text-destructive">
                        {senderError}
                    </div>
                )}

                <div className="mb-6">
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Twój adres email</label>
                    <input
                        type="email"
                        value={senderEmailInput}
                        onChange={e => setSenderEmailInput(e.target.value)}
                        placeholder="twoj@email.com"
                        className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-transparent text-sm"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                        Np. skorupa7@o2.pl — odbiorca zobaczy ten adres jako nadawcę i będzie mógł odpowiedzieć.
                    </p>
                </div>

                <button
                    onClick={handleSenderSave}
                    disabled={!canSaveSender || senderSaving}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#0891b2' }}
                >
                    {senderSaving ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                    ) : senderSaveSuccess ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    )}
                    {senderSaving ? 'Zapisuję...' : senderSaveSuccess ? 'Zapisano!' : 'Zapisz adres'}
                </button>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div className="opacity-40">
                        <h2 className="text-lg font-semibold text-foreground">Własny serwer SMTP</h2>
                        <p className="text-sm text-muted-foreground">Podłącz własną skrzynkę pocztową do wysyłania maili</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-muted-foreground dark:text-muted-foreground text-xs font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                        Wymaga własnej domeny
                    </span>
                </div>

                <div className="mb-6 p-4 rounded-xl border border-destructive/25 bg-destructive/10">
                    <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-status-rejected flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <p className="text-sm font-bold text-destructive">Funkcja tymczasowo niedostępna</p>
                            <p className="text-sm mt-1 text-destructive">
                                Własny serwer SMTP wymaga zweryfikowanej domeny. Ta funkcja zostanie aktywowana gdy aplikacja będzie działać na dedykowanym serwerze z własną domeną. Do tego czasu maile są wysyłane przez SmartQuote AI.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="opacity-40 pointer-events-none select-none">
                    <div className="mb-6">
                        <label className="mb-1.5 block text-sm font-medium text-foreground">Dostawca poczty</label>
                        <div className="flex flex-wrap gap-2">
                            {Object.keys(PRESETS).map(key => (
                                <button
                                    key={key}
                                    onClick={() => handlePresetChange(key)}
                                    className="px-3 py-2 rounded-lg text-sm font-medium border"
                                    style={{
                                        backgroundColor: selectedPreset === key ? '#0891b2' : 'var(--card)',
                                        borderColor: selectedPreset === key ? '#0891b2' : 'var(--border)',
                                        color: selectedPreset === key ? '#fff' : 'var(--muted-foreground)',
                                    }}
                                >
                                    {PRESET_LABELS[key]}
                                </button>
                            ))}
                        </div>
                        {PRESETS[selectedPreset]?.note && (
                            <p className="mt-2 text-xs text-muted-foreground">{PRESETS[selectedPreset].note}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Host SMTP</label>
                            <input
                                type="text"
                                value={form.smtpHost}
                                onChange={e => handleChange('smtpHost', e.target.value)}
                                placeholder="smtp.gmail.com"
                                className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Port</label>
                            <input
                                type="number"
                                value={form.smtpPort}
                                onChange={e => handleChange('smtpPort', Number(e.target.value))}
                                placeholder="587"
                                className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Użytkownik (login)</label>
                            <input
                                type="text"
                                value={form.smtpUser}
                                onChange={e => handleChange('smtpUser', e.target.value)}
                                placeholder="twoj@email.com"
                                className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">
                                Hasło {config?.smtpConfigured && <span className="text-xs text-muted-foreground">(pozostaw puste aby zachować)</span>}
                            </label>
                            <input
                                type="password"
                                value={form.smtpPass}
                                onChange={e => handleChange('smtpPass', e.target.value)}
                                placeholder={config?.smtpConfigured ? '••••••••' : 'Hasło SMTP'}
                                className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-muted-foreground mb-1">
                                Adres nadawcy <span className="text-xs text-muted-foreground">(opcjonalnie)</span>
                            </label>
                            <input
                                type="text"
                                value={form.smtpFrom}
                                onChange={e => handleChange('smtpFrom', e.target.value)}
                                placeholder={form.smtpUser || 'nadawca@email.com'}
                                className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm"
                            />
                        </div>
                    </div>

                    {testResult && (
                        <div className={`mb-4 p-3 rounded-xl border text-sm ${testResult.success
                            ? 'bg-status-accepted/10 border-status-accepted/25 text-status-accepted'
                            : 'bg-destructive/10 border-destructive/25 text-destructive'
                        }`}>
                            {testResult.message}
                        </div>
                    )}

                    {saveSuccess && (
                        <div className="mb-4 p-3 rounded-xl border bg-status-accepted/10 border-status-accepted/25 text-sm text-status-accepted">
                            Konfiguracja zapisana pomyślnie
                        </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={handleTest}
                            disabled={!canTest}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium text-sm disabled:opacity-50"
                            style={{ backgroundColor: '#059669' }}
                        >
                            Testuj połączenie
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!canSave}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium text-sm disabled:opacity-50"
                            style={{ backgroundColor: '#0891b2' }}
                        >
                            {saveSuccess ? 'Zapisano!' : 'Zapisz konfigurację'}
                        </button>
                        {config?.smtpConfigured && (
                            deleteConfirm ? (
                                <>
                                    <span className="text-sm text-status-rejected">Na pewno usunąć?</span>
                                    <button
                                        onClick={handleDelete}
                                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium text-sm"
                                        style={{ backgroundColor: '#dc2626' }}
                                    >
                                        Tak, usuń
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirm(false)}
                                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm border border-border bg-card text-foreground"
                                    >
                                        Anuluj
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setDeleteConfirm(true)}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm border border-destructive/25 text-status-rejected"
                                >
                                    Usuń konfigurację
                                </button>
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
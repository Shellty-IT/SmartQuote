// src/app/dashboard/settings/components/SmtpSection.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useSmtpConfig } from '@/hooks/useSettings';
import { useTranslations } from '@/i18n';

const PRESETS: Record<string, { host: string; port: number }> = {
    gmail:   { host: 'smtp.gmail.com',       port: 587 },
    outlook: { host: 'smtp.office365.com',   port: 587 },
    wp:      { host: 'smtp.wp.pl',           port: 465 },
    onet:    { host: 'smtp.poczta.onet.pl',  port: 465 },
    custom:  { host: '',                     port: 587 },
};

interface SmtpSectionProps {
    isActive?: boolean;
}

export default function SmtpSection({ isActive = false }: SmtpSectionProps) {
    const tr = useTranslations('settings');
    const commonTr = useTranslations('common');

    const PRESET_META: Record<string, { label: string; note: string }> = {
        gmail:   { label: 'Gmail',          note: tr.smtp.presetGmail },
        outlook: { label: 'Outlook / M365', note: tr.smtp.presetOutlook },
        wp:      { label: 'WP',             note: tr.smtp.presetWp },
        onet:    { label: 'Onet',           note: tr.smtp.presetOnet },
        custom:  { label: tr.smtp.presetCustomLabel, note: tr.smtp.presetCustom },
    };

    const { config, isLoading: smtpLoading, updateConfig, testConnection, testSavedConnection, deleteConfig } = useSmtpConfig();

    const [form, setForm] = useState({ smtpHost: '', smtpPort: 587, smtpUser: '', smtpPass: '', smtpFrom: '' });
    const [selectedPreset, setSelectedPreset] = useState<string>('custom');
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [formOpen, setFormOpen] = useState(false);
    const configLoaded = useRef(false);

    useEffect(() => {
        if (!config || configLoaded.current) return;
        configLoaded.current = true;
        requestAnimationFrame(() => {
            setForm({ smtpHost: config.smtpHost || '', smtpPort: config.smtpPort || 587, smtpUser: config.smtpUser || '', smtpPass: '', smtpFrom: config.smtpFrom || '' });
            if (config.smtpHost) {
                const found = Object.entries(PRESETS).find(([, p]) => p.host === config.smtpHost);
                setSelectedPreset(found ? found[0] : 'custom');
            }
        });
    }, [config]); // config is the only external dep; form fields are intentionally excluded

    const handlePresetChange = (key: string) => {
        setSelectedPreset(key);
        const p = PRESETS[key];
        if (key !== 'custom' && p) setForm(prev => ({ ...prev, smtpHost: p.host, smtpPort: p.port }));
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
            if (!form.smtpHost || !form.smtpUser) { setTestResult({ success: false, message: tr.smtp.testErrorFillHost }); return; }
            if (!form.smtpPass && config?.smtpConfigured) {
                const result = await testSavedConnection();
                setTestResult({ success: result.connected, message: result.message });
                return;
            }
            if (!form.smtpPass) { setTestResult({ success: false, message: tr.smtp.testErrorFillPass }); return; }
            const result = await testConnection({ host: form.smtpHost, port: form.smtpPort, user: form.smtpUser, pass: form.smtpPass, from: form.smtpFrom || form.smtpUser });
            setTestResult({ success: result.connected, message: result.message });
        } catch (err: unknown) {
            setTestResult({ success: false, message: err instanceof Error ? err.message : tr.smtp.testErrorDefault });
        }
    };

    const handleSave = async () => {
        setSaveSuccess(false);
        try {
            await updateConfig({ smtpHost: form.smtpHost, smtpPort: form.smtpPort, smtpUser: form.smtpUser, smtpPass: form.smtpPass || undefined, smtpFrom: form.smtpFrom || undefined });
            setSaveSuccess(true);
            setForm(prev => ({ ...prev, smtpPass: '' }));
            setFormOpen(false);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch {}
    };

    const handleDelete = async () => {
        try {
            await deleteConfig();
            setForm({ smtpHost: '', smtpPort: 587, smtpUser: '', smtpPass: '', smtpFrom: '' });
            setSelectedPreset('custom');
            setTestResult(null);
            setDeleteConfirm(false);
            configLoaded.current = false;
        } catch {}
    };

    const canSave = form.smtpHost && form.smtpUser && (form.smtpPass || config?.smtpConfigured);
    const canTest = form.smtpHost && form.smtpUser;
    const isOwnMailboxActive = !!config?.smtpConfigured;

    const inputClass = 'w-full px-3 py-2.5 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-transparent text-sm';

    if (smtpLoading) {
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
        <div className={`rounded-2xl border bg-card p-6 shadow-card ${isActive ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">{tr.smtp.title}</h2>
                    <p className="text-sm text-muted-foreground">{tr.smtp.subtitle}</p>
                </div>
                <div className="flex items-center gap-2">
                    {isActive && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/15 text-primary">
                            {tr.emailProviderSelector.activeLabel}
                        </span>
                    )}
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${isOwnMailboxActive ? 'bg-status-accepted/15 text-status-accepted' : 'bg-destructive/15 text-destructive'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isOwnMailboxActive ? 'bg-status-accepted' : 'bg-destructive'}`} />
                        {isOwnMailboxActive ? tr.smtp.statusOwn : tr.smtp.statusNotConnected}
                    </span>
                </div>
            </div>

            {isOwnMailboxActive ? (
                <div className="mb-6 p-4 rounded-xl border border-status-accepted/25 bg-status-accepted/10">
                    <p className="text-sm text-foreground">{tr.smtp.ownActiveInfo}</p>
                    <p className="mt-2 text-sm">
                        <span className="text-muted-foreground">{tr.smtp.sendingFrom}: </span>
                        <span className="font-medium text-foreground">{config?.smtpFrom || config?.smtpUser}</span>
                        <span className="text-muted-foreground"> {tr.smtp.via} {config?.smtpHost}</span>
                    </p>
                </div>
            ) : (
                <div className="mb-6 p-4 rounded-xl border border-destructive/25 bg-destructive/10">
                    <p className="text-sm text-foreground">{tr.smtp.notConnectedWarning}</p>
                </div>
            )}

            {!formOpen ? (
                <button
                    onClick={() => setFormOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm border border-border text-foreground hover:bg-secondary/50 transition-colors"
                >
                    {isOwnMailboxActive ? tr.smtp.editBtn : tr.smtp.connectOwnCta}
                </button>
            ) : (
                <div className="pt-2 border-t border-border">
                    <div className="flex items-center justify-between mt-4 mb-4">
                        <h3 className="text-sm font-semibold text-foreground">{tr.smtp.smtpTitle}</h3>
                        <button onClick={() => setFormOpen(false)} className="text-xs font-medium text-muted-foreground hover:text-foreground">
                            {tr.smtp.cancelEditBtn}
                        </button>
                    </div>

                    <div className="mb-6">
                        <label className="mb-1.5 block text-sm font-medium text-foreground">{tr.smtp.provider}</label>
                        <div className="flex flex-wrap gap-2">
                            {Object.keys(PRESETS).map(key => (
                                <button key={key} onClick={() => handlePresetChange(key)} className="px-3 py-2 rounded-lg text-sm font-medium border"
                                    style={{ backgroundColor: selectedPreset === key ? '#0891b2' : 'var(--card)', borderColor: selectedPreset === key ? '#0891b2' : 'var(--border)', color: selectedPreset === key ? '#fff' : 'var(--muted-foreground)' }}>
                                    {PRESET_META[key]?.label || key}
                                </button>
                            ))}
                        </div>
                        {PRESET_META[selectedPreset]?.note && <p className="mt-2 text-xs text-muted-foreground">{PRESET_META[selectedPreset].note}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">{tr.smtp.hostLabel}</label>
                            <input type="text" value={form.smtpHost} onChange={e => handleChange('smtpHost', e.target.value)} placeholder="smtp.gmail.com" className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">{tr.smtp.portLabel}</label>
                            <input type="number" value={form.smtpPort} onChange={e => handleChange('smtpPort', Number(e.target.value))} placeholder="587" className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">{tr.smtp.userLabel}</label>
                            <input type="text" value={form.smtpUser} onChange={e => handleChange('smtpUser', e.target.value)} placeholder="twoj@email.com" className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">
                                {tr.smtp.passwordLabel} {config?.smtpConfigured && <span className="text-xs text-muted-foreground">{tr.smtp.passwordKeepHint}</span>}
                            </label>
                            <input type="password" value={form.smtpPass} onChange={e => handleChange('smtpPass', e.target.value)} placeholder={config?.smtpConfigured ? '••••••••' : tr.smtp.passwordPlaceholder} className={inputClass} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-muted-foreground mb-1">
                                {tr.smtp.senderFromLabel} <span className="text-xs text-muted-foreground">{tr.smtp.senderFromOptional}</span>
                            </label>
                            <input type="text" value={form.smtpFrom} onChange={e => handleChange('smtpFrom', e.target.value)} placeholder={form.smtpUser || 'nadawca@email.com'} className={inputClass} />
                        </div>
                    </div>

                    {testResult && (
                        <div className={`mb-4 p-3 rounded-xl border text-sm ${testResult.success ? 'bg-status-accepted/10 border-status-accepted/25 text-status-accepted' : 'bg-destructive/10 border-destructive/25 text-destructive'}`}>
                            {testResult.message}
                        </div>
                    )}

                    {saveSuccess && (
                        <div className="mb-4 p-3 rounded-xl border bg-status-accepted/10 border-status-accepted/25 text-sm text-status-accepted">
                            {tr.smtp.configSaved}
                        </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3">
                        <button onClick={handleTest} disabled={!canTest} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium text-sm disabled:opacity-50" style={{ backgroundColor: '#059669' }}>
                            {tr.smtp.testBtn}
                        </button>
                        <button onClick={handleSave} disabled={!canSave} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium text-sm disabled:opacity-50" style={{ backgroundColor: '#0891b2' }}>
                            {saveSuccess ? tr.smtp.savedBtn : tr.smtp.saveBtn}
                        </button>
                        {config?.smtpConfigured && (
                            deleteConfirm ? (
                                <>
                                    <span className="text-sm text-status-rejected">{tr.smtp.confirmDeleteMsg}</span>
                                    <button onClick={handleDelete} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium text-sm" style={{ backgroundColor: '#dc2626' }}>{tr.smtp.confirmDeleteYes}</button>
                                    <button onClick={() => setDeleteConfirm(false)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm border border-border bg-card text-foreground">{commonTr.cancel}</button>
                                </>
                            ) : (
                                <button onClick={() => setDeleteConfirm(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm border border-destructive/25 text-status-rejected">
                                    {tr.smtp.deleteBtn}
                                </button>
                            )
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

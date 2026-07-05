// src/app/dashboard/settings/components/ResendSection.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useResendConfig } from '@/hooks/useSettings';
import { useTranslations } from '@/i18n';

interface ResendSectionProps {
    isActive?: boolean;
}

export default function ResendSection({ isActive = false }: ResendSectionProps) {
    const tr = useTranslations('settings');
    const commonTr = useTranslations('common');

    const { config, isLoading: resendLoading, updateConfig, testConnection, testSavedConnection, deleteConfig } = useResendConfig();

    const [form, setForm] = useState({ resendApiKey: '', resendFromEmail: '', resendFromName: '' });
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [formOpen, setFormOpen] = useState(false);
    const configLoaded = useRef(false);

    useEffect(() => {
        if (!config || configLoaded.current) return;
        configLoaded.current = true;
        requestAnimationFrame(() => {
            setForm({ resendApiKey: '', resendFromEmail: config.resendFromEmail || '', resendFromName: config.resendFromName || '' });
        });
    }, [config]);

    const handleChange = (field: string, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
        setTestResult(null);
        setSaveSuccess(false);
    };

    const handleTest = async () => {
        setTestResult(null);
        try {
            if (!form.resendApiKey && config?.resendConfigured) {
                const result = await testSavedConnection();
                setTestResult({ success: result.connected, message: result.message });
                return;
            }
            if (!form.resendApiKey) { setTestResult({ success: false, message: tr.resend.testErrorFillKey }); return; }
            const result = await testConnection({ apiKey: form.resendApiKey });
            setTestResult({ success: result.connected, message: result.message });
        } catch (err: unknown) {
            setTestResult({ success: false, message: err instanceof Error ? err.message : tr.resend.testErrorDefault });
        }
    };

    const handleSave = async () => {
        setSaveSuccess(false);
        try {
            await updateConfig({ resendApiKey: form.resendApiKey || undefined, resendFromEmail: form.resendFromEmail, resendFromName: form.resendFromName || undefined });
            setSaveSuccess(true);
            setForm(prev => ({ ...prev, resendApiKey: '' }));
            setFormOpen(false);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch {}
    };

    const handleDelete = async () => {
        try {
            await deleteConfig();
            setForm({ resendApiKey: '', resendFromEmail: '', resendFromName: '' });
            setTestResult(null);
            setDeleteConfirm(false);
            configLoaded.current = false;
        } catch {}
    };

    const canSave = form.resendFromEmail && (form.resendApiKey || config?.resendConfigured);
    const canTest = form.resendApiKey || config?.resendConfigured;
    const isResendActive = !!config?.resendConfigured;

    const inputClass = 'w-full px-3 py-2.5 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-transparent text-sm';

    if (resendLoading) {
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
                    <h2 className="text-lg font-semibold text-foreground">{tr.resend.title}</h2>
                    <p className="text-sm text-muted-foreground">{tr.resend.subtitle}</p>
                </div>
                <div className="flex items-center gap-2">
                    {isActive && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/15 text-primary">
                            {tr.emailProviderSelector.activeLabel}
                        </span>
                    )}
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${isResendActive ? 'bg-status-accepted/15 text-status-accepted' : 'bg-destructive/15 text-destructive'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isResendActive ? 'bg-status-accepted' : 'bg-destructive'}`} />
                        {isResendActive ? tr.resend.statusConnected : tr.resend.statusNotConnected}
                    </span>
                </div>
            </div>

            {isResendActive ? (
                <div className="mb-6 p-4 rounded-xl border border-status-accepted/25 bg-status-accepted/10">
                    <p className="text-sm text-foreground">{tr.resend.connectedInfo}</p>
                    <p className="mt-2 text-sm">
                        <span className="text-muted-foreground">{tr.resend.sendingFrom}: </span>
                        <span className="font-medium text-foreground">{config?.resendFromName ? `${config.resendFromName} <${config.resendFromEmail}>` : config?.resendFromEmail}</span>
                    </p>
                </div>
            ) : (
                <div className="mb-6 p-4 rounded-xl border border-border bg-secondary/20">
                    <p className="text-sm text-foreground">{tr.resend.notConnectedInfo}</p>
                </div>
            )}

            {!formOpen ? (
                <button
                    onClick={() => setFormOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm border border-border text-foreground hover:bg-secondary/50 transition-colors"
                >
                    {isResendActive ? tr.resend.editBtn : tr.resend.connectCta}
                </button>
            ) : (
                <div className="pt-2 border-t border-border">
                    <div className="flex items-center justify-between mt-4 mb-4">
                        <button onClick={() => setFormOpen(false)} className="text-xs font-medium text-muted-foreground hover:text-foreground ml-auto">
                            {tr.resend.cancelEditBtn}
                        </button>
                    </div>

                    <p className="mb-4 text-xs text-muted-foreground">{tr.resend.apiKeyHint}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-muted-foreground mb-1">
                                {tr.resend.apiKeyLabel} {config?.resendConfigured && <span className="text-xs text-muted-foreground">{tr.resend.apiKeyKeepHint}</span>}
                            </label>
                            <input type="password" value={form.resendApiKey} onChange={e => handleChange('resendApiKey', e.target.value)} placeholder={config?.resendConfigured ? '••••••••' : tr.resend.apiKeyPlaceholder} className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">{tr.resend.fromEmailLabel}</label>
                            <input type="email" value={form.resendFromEmail} onChange={e => handleChange('resendFromEmail', e.target.value)} placeholder="oferty@twojadomena.pl" className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">
                                {tr.resend.fromNameLabel} <span className="text-xs text-muted-foreground">{tr.resend.fromNameOptional}</span>
                            </label>
                            <input type="text" value={form.resendFromName} onChange={e => handleChange('resendFromName', e.target.value)} placeholder="Twoja Firma" className={inputClass} />
                        </div>
                    </div>

                    {testResult && (
                        <div className={`mb-4 p-3 rounded-xl border text-sm ${testResult.success ? 'bg-status-accepted/10 border-status-accepted/25 text-status-accepted' : 'bg-destructive/10 border-destructive/25 text-destructive'}`}>
                            {testResult.message}
                        </div>
                    )}

                    {saveSuccess && (
                        <div className="mb-4 p-3 rounded-xl border bg-status-accepted/10 border-status-accepted/25 text-sm text-status-accepted">
                            {tr.resend.configSaved}
                        </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3">
                        <button onClick={handleTest} disabled={!canTest} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium text-sm disabled:opacity-50" style={{ backgroundColor: '#059669' }}>
                            {tr.resend.testBtn}
                        </button>
                        <button onClick={handleSave} disabled={!canSave} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium text-sm disabled:opacity-50" style={{ backgroundColor: '#0891b2' }}>
                            {saveSuccess ? tr.resend.savedBtn : tr.resend.saveBtn}
                        </button>
                        {config?.resendConfigured && (
                            deleteConfirm ? (
                                <>
                                    <span className="text-sm text-status-rejected">{tr.resend.confirmDeleteMsg}</span>
                                    <button onClick={handleDelete} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium text-sm" style={{ backgroundColor: '#dc2626' }}>{tr.resend.confirmDeleteYes}</button>
                                    <button onClick={() => setDeleteConfirm(false)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm border border-border bg-card text-foreground">{commonTr.cancel}</button>
                                </>
                            ) : (
                                <button onClick={() => setDeleteConfirm(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm border border-destructive/25 text-status-rejected">
                                    {tr.resend.deleteBtn}
                                </button>
                            )
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

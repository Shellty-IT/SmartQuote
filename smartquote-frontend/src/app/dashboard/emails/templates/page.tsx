// src/app/dashboard/emails/templates/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, ConfirmDialog, EmptyState } from '@/components/ui';
import { emailsApi } from '@/lib/api/emails.api';
import { BUILT_IN_TEMPLATES } from '@/types/email.types';
import type { EmailTemplate } from '@/types/email.types';

interface TemplateFormProps {
    initial?: { name: string; subject: string; body: string };
    onSave: (data: { name: string; subject: string; body: string }) => Promise<void>;
    onCancel: () => void;
    isSaving: boolean;
}

function TemplateForm({ initial, onSave, onCancel, isSaving }: TemplateFormProps) {
    const [name, setName] = useState(initial?.name ?? '');
    const [subject, setSubject] = useState(initial?.subject ?? '');
    const [body, setBody] = useState(initial?.body ?? '');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const e: Record<string, string> = {};
        if (!name.trim()) e.name = 'Nazwa jest wymagana';
        if (!subject.trim()) e.subject = 'Temat jest wymagany';
        if (!body.trim()) e.body = 'Treść jest wymagana';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        await onSave({ name: name.trim(), subject: subject.trim(), body: body.trim() });
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-xs font-medium text-themed-muted mb-1">
                    Nazwa szablonu <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="np. Oferta premium"
                    className={`w-full px-3 py-2 rounded-xl border text-themed text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30 bg-white dark:bg-slate-800 ${
                        errors.name ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'
                    }`}
                />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
            </div>
            <div>
                <label className="block text-xs font-medium text-themed-muted mb-1">
                    Temat wiadomości <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="Temat emaila"
                    className={`w-full px-3 py-2 rounded-xl border text-themed text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30 bg-white dark:bg-slate-800 ${
                        errors.subject ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'
                    }`}
                />
                {errors.subject && <p className="mt-1 text-xs text-red-500">{errors.subject}</p>}
            </div>
            <div>
                <label className="block text-xs font-medium text-themed-muted mb-1">
                    Treść szablonu <span className="text-red-500">*</span>
                </label>
                <textarea
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    rows={10}
                    placeholder="Treść wiadomości email..."
                    className={`w-full px-3 py-2 rounded-xl border text-themed text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30 bg-white dark:bg-slate-800 resize-y ${
                        errors.body ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'
                    }`}
                />
                {errors.body && <p className="mt-1 text-xs text-red-500">{errors.body}</p>}
                <p className="mt-1 text-xs text-themed-muted">
                    Możesz używać zmiennych: <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{'{clientName}'}</code>, <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{'{offerNumber}'}</code>, <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{'{contractNumber}'}</code>
                </p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isSaving}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-themed hover-themed transition-colors disabled:opacity-60"
                >
                    Anuluj
                </button>
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium transition-colors disabled:opacity-60"
                >
                    {isSaving && (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                    )}
                    Zapisz szablon
                </button>
            </div>
        </div>
    );
}

export default function EmailTemplatesPage() {
    const router = useRouter();
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showNewForm, setShowNewForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [previewId, setPreviewId] = useState<string | null>(null);

    const load = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await emailsApi.getTemplates();
            if (!res.data) throw new Error('Brak danych');
            setTemplates(res.data.filter(t => !t.isBuiltIn));
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Błąd ładowania');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleCreate = async (data: { name: string; subject: string; body: string }) => {
        setIsSaving(true);
        try {
            await emailsApi.createTemplate(data);
            setShowNewForm(false);
            await load();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Błąd tworzenia szablonu');
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdate = async (id: string, data: { name: string; subject: string; body: string }) => {
        setIsSaving(true);
        try {
            await emailsApi.updateTemplate(id, data);
            setEditingId(null);
            await load();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Błąd aktualizacji szablonu');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        setIsDeleting(true);
        try {
            await emailsApi.deleteTemplate(id);
            setDeleteConfirmId(null);
            await load();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Błąd usuwania szablonu');
        } finally {
            setIsDeleting(false);
        }
    };

    const builtInPreview = previewId
        ? BUILT_IN_TEMPLATES.find(t => t.id === previewId)
        : null;

    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/dashboard/emails')}
                        className="p-2 text-themed-muted hover-themed rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-themed">Szablony wiadomości</h1>
                        <p className="text-themed-muted mt-0.5">Zarządzaj szablonami email</p>
                    </div>
                </div>
                <button
                    onClick={() => { setShowNewForm(true); setEditingId(null); }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Nowy szablon
                </button>
            </div>

            {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                    {error}
                </div>
            )}

            {showNewForm && (
                <Card className="mb-6">
                    <h2 className="text-sm font-semibold text-themed mb-4">Nowy szablon</h2>
                    <TemplateForm
                        onSave={handleCreate}
                        onCancel={() => setShowNewForm(false)}
                        isSaving={isSaving}
                    />
                </Card>
            )}

            <div className="space-y-6">
                <div>
                    <h2 className="text-xs font-semibold text-themed-muted uppercase tracking-wide mb-3">
                        Wbudowane ({BUILT_IN_TEMPLATES.length})
                    </h2>
                    <div className="space-y-2">
                        {BUILT_IN_TEMPLATES.map(t => (
                            <div key={t.id} className="card-themed border rounded-xl overflow-hidden">
                                <div className="flex items-center justify-between p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-4 h-4 text-themed-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h8" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-themed">{t.name}</p>
                                            <p className="text-xs text-themed-muted">{t.subject}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-themed-muted px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                                            Wbudowany
                                        </span>
                                        <button
                                            onClick={() => setPreviewId(previewId === t.id ? null : t.id)}
                                            className="p-1.5 text-themed-muted hover:text-cyan-600 dark:hover:text-cyan-400 hover-themed rounded-lg transition-colors"
                                            title="Podgląd"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => router.push('/dashboard/emails/new')}
                                            className="p-1.5 text-themed-muted hover:text-cyan-600 dark:hover:text-cyan-400 hover-themed rounded-lg transition-colors"
                                            title="Użyj szablonu"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                {previewId === t.id && (
                                    <div className="border-t divider-themed p-4">
                                        <p className="text-xs font-medium text-themed-muted mb-2">Podgląd treści:</p>
                                        <pre className="text-xs text-themed whitespace-pre-wrap leading-relaxed font-sans bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                                            {t.body}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h2 className="text-xs font-semibold text-themed-muted uppercase tracking-wide mb-3">
                        Moje szablony ({templates.length})
                    </h2>

                    {isLoading ? (
                        <div className="space-y-2">
                            {[1, 2].map(i => (
                                <div key={i} className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                            ))}
                        </div>
                    ) : templates.length === 0 && !showNewForm ? (
                        <EmptyState
                            icon={
                                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h8" />
                                </svg>
                            }
                            title="Brak własnych szablonów"
                            description='Kliknij "Nowy szablon" aby stworzyć własny szablon wiadomości'
                        />
                    ) : (
                        <div className="space-y-2">
                            {templates.map(t => (
                                <div key={t.id} className="card-themed border rounded-xl overflow-hidden">
                                    <div className="flex items-center justify-between p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                                                <svg className="w-4 h-4 text-cyan-600 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-themed">{t.name}</p>
                                                <p className="text-xs text-themed-muted">{t.subject}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => setPreviewId(previewId === t.id ? null : t.id)}
                                                className="p-1.5 text-themed-muted hover:text-cyan-600 dark:hover:text-cyan-400 hover-themed rounded-lg transition-colors"
                                                title="Podgląd"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => { setEditingId(t.id); setShowNewForm(false); setPreviewId(null); }}
                                                className="p-1.5 text-themed-muted hover:text-cyan-600 dark:hover:text-cyan-400 hover-themed rounded-lg transition-colors"
                                                title="Edytuj"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirmId(t.id)}
                                                className="p-1.5 text-themed-muted hover:text-red-500 dark:hover:text-red-400 hover-themed rounded-lg transition-colors"
                                                title="Usuń"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    {editingId === t.id && (
                                        <div className="border-t divider-themed p-4">
                                            <TemplateForm
                                                initial={{ name: t.name, subject: t.subject, body: t.body }}
                                                onSave={data => handleUpdate(t.id, data)}
                                                onCancel={() => setEditingId(null)}
                                                isSaving={isSaving}
                                            />
                                        </div>
                                    )}

                                    {previewId === t.id && editingId !== t.id && (
                                        <div className="border-t divider-themed p-4">
                                            <p className="text-xs font-medium text-themed-muted mb-2">Podgląd treści:</p>
                                            <pre className="text-xs text-themed whitespace-pre-wrap leading-relaxed font-sans bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                                                {t.body}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {builtInPreview && (
                    <div className="mt-2 p-4 card-themed border rounded-xl">
                        <p className="text-xs font-medium text-themed-muted mb-2">
                            Podgląd: {builtInPreview.name}
                        </p>
                        <pre className="text-xs text-themed whitespace-pre-wrap leading-relaxed font-sans bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                            {builtInPreview.body}
                        </pre>
                    </div>
                )}
            </div>

            <ConfirmDialog
                isOpen={!!deleteConfirmId}
                onClose={() => setDeleteConfirmId(null)}
                onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
                title="Usuń szablon"
                description="Czy na pewno chcesz usunąć ten szablon? Operacja jest nieodwracalna."
                confirmLabel="Usuń"
                isLoading={isDeleting}
            />
        </div>
    );
}
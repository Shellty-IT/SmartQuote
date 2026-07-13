// src/app/dashboard/settings/components/ApiKeysSection.tsx
'use client';

import { useState } from 'react';

import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { useTranslations } from '@/i18n';
import type { ApiKey, CreatedApiKey, CreateApiKeyInput } from '@/types';

function CopyIcon() {
    return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
        </svg>
    );
}

function CheckIcon({ cls }: { cls?: string }) {
    return (
        <svg className={`w-4 h-4 ${cls || ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
    );
}

interface Props {
    apiKeys: ApiKey[];
    onCreate: (data: CreateApiKeyInput) => Promise<CreatedApiKey>;
    onToggle: (id: string) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}

export default function ApiKeysSection({ apiKeys, onCreate, onToggle, onDelete }: Props) {
    const tr = useTranslations('settings');
    const commonTr = useTranslations('common');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);
    const [newKeyName, setNewKeyName] = useState('');
    const [newKeyResult, setNewKeyResult] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleCreate = async () => {
        if (!newKeyName.trim()) return;
        setIsCreating(true);
        try {
            const result = await onCreate({ name: newKeyName.trim() });
            setNewKeyResult(result.secret);
            setNewKeyName('');
        } catch {
        } finally {
            setIsCreating(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedKeyId) return;
        setIsDeleting(true);
        try {
            await onDelete(selectedKeyId);
            setIsDeleteModalOpen(false);
            setSelectedKeyId(null);
        } catch {
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCopy = async (text: string, id: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const closeCreateModal = () => {
        setIsCreateModalOpen(false);
        setNewKeyName('');
        setNewKeyResult(null);
    };


    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">{tr.apiKeys.title}</h2>
                        <p className="text-sm text-muted-foreground">{tr.apiKeys.subtitle}</p>
                    </div>
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        {tr.apiKeys.newKey}
                    </Button>
                </div>

                {apiKeys.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-surface-subtle rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-foreground mb-2">{tr.apiKeys.noKeys}</h3>
                        <p className="text-muted-foreground mb-4">{tr.apiKeys.noKeysDesc}</p>
                        <Button onClick={() => setIsCreateModalOpen(true)}>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            {tr.apiKeys.createFirst}
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {apiKeys.map((apiKey) => (
                            <div
                                key={apiKey.id}
                                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border gap-4 ${apiKey.isActive ? 'bg-card border-border' : 'bg-surface-subtle border-transparent'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${apiKey.isActive ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                                        </svg>
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-medium text-foreground">{apiKey.name}</p>
                                            {!apiKey.isActive && (
                                                <span className="text-xs px-2 py-0.5 bg-surface-subtle text-muted-foreground rounded-full">
                                                    {tr.apiKeys.disabled}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1">
                                            <code className="text-sm text-muted-foreground font-mono truncate max-w-[200px]">{apiKey.maskedKey}</code>
                                        </div>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                                            <span>{tr.apiKeys.created} {new Date(apiKey.createdAt).toLocaleDateString()}</span>
                                            {apiKey.lastUsedAt && (
                                                <span className="flex items-center gap-1">
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    {tr.apiKeys.lastUsed} {new Date(apiKey.lastUsedAt).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 self-end sm:self-center">
                                    <button
                                        onClick={() => onToggle(apiKey.id)}
                                        className={`p-2 rounded-lg transition-colors ${apiKey.isActive ? 'text-primary hover:bg-primary/10' : 'text-muted-foreground hover:bg-secondary/60'}`}
                                        title={apiKey.isActive ? tr.apiKeys.disableTitle : tr.apiKeys.enableTitle}
                                    >
                                        {apiKey.isActive ? (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                            </svg>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => { setSelectedKeyId(apiKey.id); setIsDeleteModalOpen(true); }}
                                        className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                        title={tr.apiKeys.deleteTitle}
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[oklch(0.55_0.14_60)] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                    </svg>
                    <div>
                        <h3 className="font-medium text-amber-800 dark:text-amber-300 mb-1">{tr.apiKeys.securityTitle}</h3>
                        <ul className="text-sm text-[oklch(0.55_0.14_60)] dark:text-[oklch(0.78_0.14_60)] space-y-1">
                            <li>• {tr.apiKeys.securityOnce}</li>
                            <li>• {tr.apiKeys.securityShare}</li>
                            <li>• {tr.apiKeys.securityRotate}</li>
                            <li>• {tr.apiKeys.securityDisable}</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Create modal */}
            <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal} title={newKeyResult ? tr.apiKeys.modalCreatedTitle : tr.apiKeys.modalCreateTitle}>
                {newKeyResult ? (
                    <div className="space-y-4">
                        <div className="p-4 bg-status-accepted/10 border border-status-accepted/25 rounded-lg">
                            <div className="flex items-center gap-2 text-status-accepted mb-2">
                                <CheckIcon />
                                <span className="font-medium">{tr.apiKeys.keyCreated}</span>
                            </div>
                            <p className="text-sm text-status-accepted">{tr.apiKeys.copyNow}</p>
                        </div>
                        <div className="p-4 bg-surface-subtle rounded-lg">
                            <div className="flex items-center justify-between gap-4">
                                <code className="text-sm font-mono text-foreground break-all">{newKeyResult}</code>
                                <button onClick={() => handleCopy(newKeyResult, 'new')} className="flex-shrink-0 p-2 hover:bg-secondary/60 rounded-lg transition-colors">
                                    {copiedId === 'new' ? <CheckIcon cls="text-status-accepted w-5 h-5" /> : <CopyIcon />}
                                </button>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={closeCreateModal}>{commonTr.close}</Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">{tr.apiKeys.keyNameLabel}</label>
                            <input
                                type="text"
                                value={newKeyName}
                                onChange={e => setNewKeyName(e.target.value)}
                                className="w-full px-4 py-2.5 border rounded-lg border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary"
                                placeholder={tr.apiKeys.keyPlaceholder}
                                autoFocus
                            />
                            <p className="text-xs text-muted-foreground mt-1">{tr.apiKeys.keyHint}</p>
                        </div>
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={closeCreateModal}>{commonTr.cancel}</Button>
                            <Button onClick={handleCreate} disabled={!newKeyName.trim() || isCreating}>
                                {isCreating ? (
                                    <>
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                        </svg>
                                        {commonTr.creating}
                                    </>
                                ) : tr.apiKeys.createBtn}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Delete modal */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title={tr.apiKeys.deleteModalTitle}>
                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/25 rounded-lg">
                        <svg className="w-5 h-5 text-destructive flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                        </svg>
                        <p className="text-sm text-destructive">{tr.apiKeys.deleteWarning}</p>
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>{commonTr.cancel}</Button>
                        <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting ? (
                                <>
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>
                                    {commonTr.deleting}
                                </>
                            ) : commonTr.delete}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

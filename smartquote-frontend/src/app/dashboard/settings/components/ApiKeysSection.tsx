// src/app/dashboard/settings/components/ApiKeysSection.tsx
'use client';

import { useState } from 'react';
import { Card } from '@/components/ui';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import type { ApiKey, CreateApiKeyInput } from '@/types';

interface Props {
    apiKeys: ApiKey[];
    onCreate: (data: CreateApiKeyInput) => Promise<ApiKey & { key: string }>;
    onToggle: (id: string) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}

export default function ApiKeysSection({ apiKeys, onCreate, onToggle, onDelete }: Props) {
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
            setNewKeyResult(result.key);
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
            <Card>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-semibold text-themed">Klucze API</h2>
                        <p className="text-sm text-themed-muted">Zarządzaj dostępem do API</p>
                    </div>
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Nowy klucz
                    </Button>
                </div>

                {apiKeys.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 section-themed rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-themed-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-themed mb-2">Brak kluczy API</h3>
                        <p className="text-themed-muted mb-4">
                            Utwórz klucz API, aby zintegrować SmartQuote z innymi aplikacjami
                        </p>
                        <Button onClick={() => setIsCreateModalOpen(true)}>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            Utwórz pierwszy klucz
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {apiKeys.map((apiKey) => (
                            <div
                                key={apiKey.id}
                                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border gap-4 ${
                                    apiKey.isActive
                                        ? 'card-themed'
                                        : 'section-themed border-transparent'
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                        apiKey.isActive
                                            ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400'
                                            : 'bg-slate-200 dark:bg-slate-700 text-themed-muted'
                                    }`}>
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                                        </svg>
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-medium text-themed">{apiKey.name}</p>
                                            {!apiKey.isActive && (
                                                <span className="text-xs px-2 py-0.5 section-themed text-themed-muted rounded-full">
                                                    Wyłączony
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1">
                                            <code className="text-sm text-themed-muted font-mono truncate max-w-[200px]">
                                                {apiKey.key}
                                            </code>
                                            <button
                                                onClick={() => handleCopy(apiKey.key, apiKey.id)}
                                                className="text-themed-muted hover:text-themed flex-shrink-0"
                                            >
                                                {copiedId === apiKey.id ? (
                                                    <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-themed-muted flex-wrap">
                                            <span>Utworzono: {new Date(apiKey.createdAt).toLocaleDateString('pl-PL')}</span>
                                            {apiKey.lastUsedAt && (
                                                <span className="flex items-center gap-1">
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    Ostatnio: {new Date(apiKey.lastUsedAt).toLocaleDateString('pl-PL')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 self-end sm:self-center">
                                    <button
                                        onClick={() => onToggle(apiKey.id)}
                                        className={`p-2 rounded-lg transition-colors ${
                                            apiKey.isActive
                                                ? 'text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/30'
                                                : 'text-themed-muted hover-themed'
                                        }`}
                                        title={apiKey.isActive ? 'Wyłącz' : 'Włącz'}
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
                                        onClick={() => {
                                            setSelectedKeyId(apiKey.id);
                                            setIsDeleteModalOpen(true);
                                        }}
                                        className="p-2 rounded-lg text-themed-muted hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                        title="Usuń"
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
            </Card>

            <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                    </svg>
                    <div>
                        <h3 className="font-medium text-amber-800 dark:text-amber-300 mb-1">Bezpieczeństwo kluczy API</h3>
                        <ul className="text-sm text-amber-700 dark:text-amber-400 space-y-1">
                            <li>• Klucz jest pokazywany tylko raz przy tworzeniu</li>
                            <li>• Nie udostępniaj kluczy osobom trzecim</li>
                            <li>• Regularnie rotuj klucze dla bezpieczeństwa</li>
                            <li>• Wyłącz nieużywane klucze</li>
                        </ul>
                    </div>
                </div>
            </Card>

            <Modal
                isOpen={isCreateModalOpen}
                onClose={closeCreateModal}
                title={newKeyResult ? 'Klucz utworzony!' : 'Nowy klucz API'}
            >
                {newKeyResult ? (
                    <div className="space-y-4">
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 mb-2">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="font-medium">Klucz został utworzony</span>
                            </div>
                            <p className="text-sm text-emerald-600 dark:text-emerald-400">
                                Skopiuj klucz teraz — nie będzie widoczny ponownie!
                            </p>
                        </div>

                        <div className="p-4 section-themed rounded-lg">
                            <div className="flex items-center justify-between gap-4">
                                <code className="text-sm font-mono text-themed break-all">
                                    {newKeyResult}
                                </code>
                                <button
                                    onClick={() => handleCopy(newKeyResult, 'new')}
                                    className="flex-shrink-0 p-2 hover-themed rounded-lg transition-colors"
                                >
                                    {copiedId === 'new' ? (
                                        <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5 text-themed-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button onClick={closeCreateModal}>Zamknij</Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-themed-label mb-2">
                                Nazwa klucza
                            </label>
                            <input
                                type="text"
                                value={newKeyName}
                                onChange={e => setNewKeyName(e.target.value)}
                                className="w-full px-4 py-2.5 border rounded-lg input-themed focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                                placeholder="np. Integracja CRM"
                                autoFocus
                            />
                            <p className="text-xs text-themed-muted mt-1">
                                Nazwa pomoże Ci zidentyfikować gdzie używasz tego klucza
                            </p>
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={closeCreateModal}>
                                Anuluj
                            </Button>
                            <Button onClick={handleCreate} disabled={!newKeyName.trim() || isCreating}>
                                {isCreating ? (
                                    <>
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                        </svg>
                                        Tworzenie...
                                    </>
                                ) : (
                                    'Utwórz klucz'
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Usuń klucz API"
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <svg className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                        </svg>
                        <p className="text-sm text-red-700 dark:text-red-400">
                            Usunięcie klucza jest nieodwracalne. Wszystkie integracje używające tego klucza przestaną działać.
                        </p>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                            Anuluj
                        </Button>
                        <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting ? (
                                <>
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>
                                    Usuwanie...
                                </>
                            ) : (
                                'Usuń klucz'
                            )}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
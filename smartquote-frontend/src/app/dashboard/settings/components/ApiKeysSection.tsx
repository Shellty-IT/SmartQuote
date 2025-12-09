// src/app/dashboard/settings/components/ApiKeysSection.tsx

'use client';

import { useState } from 'react';
import {
    Key,
    Plus,
    Copy,
    Trash2,
    ToggleLeft,
    ToggleRight,
    AlertTriangle,
    Check,
    Eye,
    EyeOff,
    Loader2,
    Clock
} from 'lucide-react';
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
        } catch (error) {
            console.error('Failed to create API key:', error);
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
        } catch (error) {
            console.error('Failed to delete API key:', error);
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
                        <h2 className="text-lg font-semibold text-slate-900">Klucze API</h2>
                        <p className="text-sm text-slate-500">Zarządzaj dostępem do API</p>
                    </div>
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                        <Plus className="w-4 h-4" />
                        Nowy klucz
                    </Button>
                </div>

                {apiKeys.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Key className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 mb-2">Brak kluczy API</h3>
                        <p className="text-slate-500 mb-4">
                            Utwórz klucz API, aby zintegrować SmartQuote z innymi aplikacjami
                        </p>
                        <Button onClick={() => setIsCreateModalOpen(true)}>
                            <Plus className="w-4 h-4" />
                            Utwórz pierwszy klucz
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {apiKeys.map((apiKey) => (
                            <div
                                key={apiKey.id}
                                className={`flex items-center justify-between p-4 rounded-xl border ${
                                    apiKey.isActive
                                        ? 'border-slate-200 bg-white'
                                        : 'border-slate-100 bg-slate-50'
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                        apiKey.isActive
                                            ? 'bg-cyan-100 text-cyan-600'
                                            : 'bg-slate-200 text-slate-400'
                                    }`}>
                                        <Key className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-slate-900">{apiKey.name}</p>
                                            {!apiKey.isActive && (
                                                <span className="text-xs px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full">
                                                    Wyłączony
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1">
                                            <code className="text-sm text-slate-500 font-mono">
                                                {apiKey.key}
                                            </code>
                                            <button
                                                onClick={() => handleCopy(apiKey.key, apiKey.id)}
                                                className="text-slate-400 hover:text-slate-600"
                                            >
                                                {copiedId === apiKey.id ? (
                                                    <Check className="w-4 h-4 text-green-500" />
                                                ) : (
                                                    <Copy className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                                            <span>
                                                Utworzono: {new Date(apiKey.createdAt).toLocaleDateString('pl-PL')}
                                            </span>
                                            {apiKey.lastUsedAt && (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    Ostatnio: {new Date(apiKey.lastUsedAt).toLocaleDateString('pl-PL')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => onToggle(apiKey.id)}
                                        className={`p-2 rounded-lg transition-colors ${
                                            apiKey.isActive
                                                ? 'text-cyan-600 hover:bg-cyan-50'
                                                : 'text-slate-400 hover:bg-slate-100'
                                        }`}
                                        title={apiKey.isActive ? 'Wyłącz' : 'Włącz'}
                                    >
                                        {apiKey.isActive ? (
                                            <ToggleRight className="w-5 h-5" />
                                        ) : (
                                            <ToggleLeft className="w-5 h-5" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedKeyId(apiKey.id);
                                            setIsDeleteModalOpen(true);
                                        }}
                                        className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                        title="Usuń"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Info Card */}
            <Card className="bg-amber-50 border-amber-200">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-medium text-amber-800 mb-1">Bezpieczeństwo kluczy API</h3>
                        <ul className="text-sm text-amber-700 space-y-1">
                            <li>• Klucz jest pokazywany tylko raz przy tworzeniu</li>
                            <li>• Nie udostępniaj kluczy osobom trzecim</li>
                            <li>• Regularnie rotuj klucze dla bezpieczeństwa</li>
                            <li>• Wyłącz nieużywane klucze</li>
                        </ul>
                    </div>
                </div>
            </Card>

            {/* Create Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={closeCreateModal}
                title={newKeyResult ? 'Klucz utworzony!' : 'Nowy klucz API'}
            >
                {newKeyResult ? (
                    <div className="space-y-4">
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-2 text-green-700 mb-2">
                                <Check className="w-5 h-5" />
                                <span className="font-medium">Klucz został utworzony</span>
                            </div>
                            <p className="text-sm text-green-600">
                                Skopiuj klucz teraz - nie będzie widoczny ponownie!
                            </p>
                        </div>

                        <div className="p-4 bg-slate-100 rounded-lg">
                            <div className="flex items-center justify-between gap-4">
                                <code className="text-sm font-mono text-slate-800 break-all">
                                    {newKeyResult}
                                </code>
                                <button
                                    onClick={() => handleCopy(newKeyResult, 'new')}
                                    className="flex-shrink-0 p-2 hover:bg-slate-200 rounded-lg transition-colors"
                                >
                                    {copiedId === 'new' ? (
                                        <Check className="w-5 h-5 text-green-500" />
                                    ) : (
                                        <Copy className="w-5 h-5 text-slate-600" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button onClick={closeCreateModal}>
                                Zamknij
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Nazwa klucza
                            </label>
                            <input
                                type="text"
                                value={newKeyName}
                                onChange={(e) => setNewKeyName(e.target.value)}
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                                placeholder="np. Integracja CRM"
                                autoFocus
                            />
                            <p className="text-xs text-slate-400 mt-1">
                                Nazwa pomoże Ci zidentyfikować gdzie używasz tego klucza
                            </p>
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={closeCreateModal}>
                                Anuluj
                            </Button>
                            <Button
                                onClick={handleCreate}
                                disabled={!newKeyName.trim() || isCreating}
                            >
                                {isCreating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
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

            {/* Delete Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Usuń klucz API"
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                        <p className="text-sm text-red-700">
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
                                    <Loader2 className="w-4 h-4 animate-spin" />
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
// src/app/dashboard/clients/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useClients } from '@/hooks/useClients';
import { Button, Card, Input, Badge, EmptyState, ConfirmDialog } from '@/components/ui';
import { SkeletonTableRow } from '@/components/ui/Skeleton';
import { formatDate, getInitials } from '@/lib/utils';
import { Client } from '@/types';
import { useToast } from '@/contexts/ToastContext';

export default function ClientsPage() {
    const router = useRouter();
    const toast = useToast();
    const { clients, total, page, totalPages, isLoading, error, filters, setFilters, deleteClient, refresh } = useClients();

    const [searchValue, setSearchValue] = useState('');
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; client: Client | null }>({
        isOpen: false,
        client: null,
    });
    const [isDeleting, setIsDeleting] = useState(false);

    const hasFilters = !!(searchValue || filters.type || filters.isActive !== undefined);

    const handleSearch = (value: string) => {
        setSearchValue(value);
        setFilters({ search: value, page: 1 });
    };

    const handleDelete = async () => {
        if (!deleteModal.client) return;

        setIsDeleting(true);
        try {
            await deleteClient(deleteModal.client.id);
            toast.success('Klient usunięty', `"${deleteModal.client.name}" został usunięty`);
            setDeleteModal({ isOpen: false, client: null });
        } catch {
            toast.error('Błąd', 'Nie udało się usunąć klienta');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-themed">Klienci</h1>
                    <p className="text-themed-muted mt-1">Zarządzaj swoimi klientami i kontrahentami</p>
                </div>
                <Button onClick={() => router.push('/dashboard/clients/new')}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Dodaj klienta
                </Button>
            </div>

            <Card className="mb-6">
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <Input
                            placeholder="Szukaj klientów..."
                            value={searchValue}
                            onChange={(e) => handleSearch(e.target.value)}
                            icon={
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            }
                        />
                    </div>
                    <select
                        className="px-4 py-2.5 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                        style={{
                            backgroundColor: 'var(--input-bg)',
                            borderColor: 'var(--divider)',
                            color: 'var(--input-text)',
                        }}
                        value={filters.type || ''}
                        onChange={(e) => setFilters({ type: e.target.value as 'COMPANY' | 'PERSON' | undefined, page: 1 })}
                    >
                        <option value="">Wszystkie typy</option>
                        <option value="COMPANY">Firmy</option>
                        <option value="PERSON">Osoby prywatne</option>
                    </select>
                    <select
                        className="px-4 py-2.5 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                        style={{
                            backgroundColor: 'var(--input-bg)',
                            borderColor: 'var(--divider)',
                            color: 'var(--input-text)',
                        }}
                        value={filters.isActive?.toString() || ''}
                        onChange={(e) => setFilters({ isActive: e.target.value ? e.target.value === 'true' : undefined, page: 1 })}
                    >
                        <option value="">Wszystkie statusy</option>
                        <option value="true">Aktywni</option>
                        <option value="false">Nieaktywni</option>
                    </select>
                </div>
            </Card>

            {error && (
                <div
                    className="mb-6 p-4 rounded-lg border"
                    style={{
                        backgroundColor: 'var(--error-bg, rgba(239, 68, 68, 0.1))',
                        borderColor: 'var(--error-border, rgba(239, 68, 68, 0.25))',
                        color: 'var(--error-text, #ef4444)',
                    }}
                >
                    {error}
                    <button onClick={refresh} className="ml-2 underline hover:opacity-80">
                        Spróbuj ponownie
                    </button>
                </div>
            )}

            {isLoading && clients.length === 0 ? (
                <Card padding="none">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                            <tr className="border-b" style={{ borderColor: 'var(--divider)', backgroundColor: 'var(--section-bg)' }}>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-themed-muted uppercase tracking-wider">Klient</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-themed-muted uppercase tracking-wider">Kontakt</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-themed-muted uppercase tracking-wider">Typ</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-themed-muted uppercase tracking-wider">Oferty</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-themed-muted uppercase tracking-wider">Dodano</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-themed-muted uppercase tracking-wider">Akcje</th>
                            </tr>
                            </thead>
                            <tbody>
                            {Array.from({ length: 6 }).map((_, i) => (
                                <SkeletonTableRow key={i} columns={6} />
                            ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            ) : clients.length === 0 ? (
                <Card>
                    <EmptyState
                        icon={
                            hasFilters ? (
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            ) : (
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            )
                        }
                        title={hasFilters ? 'Brak wyników' : 'Brak klientów'}
                        description={
                            hasFilters
                                ? 'Spróbuj zmienić kryteria wyszukiwania'
                                : 'Dodaj pierwszego klienta, aby rozpocząć tworzenie ofert'
                        }
                        action={
                            hasFilters
                                ? undefined
                                : { label: 'Dodaj klienta', onClick: () => router.push('/dashboard/clients/new') }
                        }
                    />
                </Card>
            ) : (
                <Card padding="none">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                            <tr className="border-b" style={{ borderColor: 'var(--divider)', backgroundColor: 'var(--section-bg)' }}>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-themed-muted uppercase tracking-wider">
                                    Klient
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-themed-muted uppercase tracking-wider">
                                    Kontakt
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-themed-muted uppercase tracking-wider">
                                    Typ
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-themed-muted uppercase tracking-wider">
                                    Oferty
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-themed-muted uppercase tracking-wider">
                                    Dodano
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-themed-muted uppercase tracking-wider">
                                    Akcje
                                </th>
                            </tr>
                            </thead>
                            <tbody>
                            {clients.map((client) => (
                                <tr
                                    key={client.id}
                                    className="border-b hover-themed transition-colors cursor-pointer"
                                    style={{ borderColor: 'var(--divider)' }}
                                    onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white text-sm font-semibold">
                                                {getInitials(client.name)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-themed">{client.name}</p>
                                                {client.company && (
                                                    <p className="text-sm text-themed-muted">{client.company}</p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm">
                                            {client.email && <p className="text-themed">{client.email}</p>}
                                            {client.phone && <p className="text-themed-muted">{client.phone}</p>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant={client.type === 'COMPANY' ? 'info' : 'default'}>
                                            {client.type === 'COMPANY' ? 'Firma' : 'Osoba'}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-themed-muted">
                                            {client._count?.offers || 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-themed-muted">
                                            {formatDate(client.createdAt)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => router.push(`/dashboard/clients/${client.id}/edit`)}
                                                className="p-2 text-themed-muted rounded-lg transition-colors"
                                                style={{ backgroundColor: 'transparent' }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = 'var(--tone-active-bg)';
                                                    e.currentTarget.style.color = 'var(--accent-gradient-from)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                    e.currentTarget.style.color = 'var(--muted-text)';
                                                }}
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => setDeleteModal({ isOpen: true, client })}
                                                className="p-2 text-themed-muted rounded-lg transition-colors"
                                                style={{ backgroundColor: 'transparent' }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                                                    e.currentTarget.style.color = '#ef4444';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                    e.currentTarget.style.color = 'var(--muted-text)';
                                                }}
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--divider)' }}>
                            <p className="text-sm text-themed-muted">
                                Pokazano {clients.length} z {total} klientów
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page === 1}
                                    onClick={() => setFilters({ page: page - 1 })}
                                >
                                    Poprzednia
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page === totalPages}
                                    onClick={() => setFilters({ page: page + 1 })}
                                >
                                    Następna
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            )}

            <ConfirmDialog
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, client: null })}
                onConfirm={handleDelete}
                title="Usuń klienta"
                description={`Czy na pewno chcesz usunąć klienta "${deleteModal.client?.name}"? Ta operacja jest nieodwracalna.`}
                confirmLabel="Usuń"
                isLoading={isDeleting}
            />
        </div>
    );
}
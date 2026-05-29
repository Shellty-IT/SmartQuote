// src/app/dashboard/clients/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search, UserPlus, Pencil, Trash2,
    Users, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useClients } from '@/hooks/useClients';
import { ConfirmDialog } from '@/components/ui';
import { SkeletonTableRow } from '@/components/ui/Skeleton';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDate, getInitials, cn } from '@/lib/utils';
import { Client } from '@/types';
import { useToast } from '@/contexts/ToastContext';

const TH_COLS = ['Klient', 'Kontakt', 'Typ', 'Oferty', 'Dodano', ''];

export default function ClientsPage() {
    const router = useRouter();
    const toast = useToast();
    const { clients, total, page, totalPages, isLoading, error, filters, setFilters, deleteClient, refresh } = useClients();

    const [searchValue, setSearchValue] = useState('');
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; client: Client | null }>({ isOpen: false, client: null });
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
        <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-8 sm:px-6">
            {/* Header */}
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">CRM</div>
                    <h1 className="mt-1 text-3xl font-bold tracking-tight">Klienci</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Zarządzaj klientami i kontrahentami</p>
                </div>
                <button
                    onClick={() => router.push('/dashboard/clients/new')}
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-primary px-4 text-sm font-semibold text-white shadow-glow ring-1 ring-white/15 transition hover:brightness-110"
                >
                    <UserPlus className="h-4 w-4" /> Dodaj klienta
                </button>
            </div>

            {/* Filters */}
            <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
                <div className="flex flex-wrap gap-3">
                    <div className="relative min-w-[200px] flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            placeholder="Szukaj klientów..."
                            value={searchValue}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="h-10 w-full rounded-lg border border-border bg-secondary/60 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring/30"
                        />
                    </div>
                    <select
                        value={filters.type || ''}
                        onChange={(e) => setFilters({ type: e.target.value as 'COMPANY' | 'PERSON' | undefined, page: 1 })}
                        className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
                    >
                        <option value="">Wszystkie typy</option>
                        <option value="COMPANY">Firmy</option>
                        <option value="PERSON">Osoby prywatne</option>
                    </select>
                    <select
                        value={filters.isActive?.toString() || ''}
                        onChange={(e) => setFilters({ isActive: e.target.value ? e.target.value === 'true' : undefined, page: 1 })}
                        className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
                    >
                        <option value="">Wszystkie statusy</option>
                        <option value="true">Aktywni</option>
                        <option value="false">Nieaktywni</option>
                    </select>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                    {error}
                    <button onClick={refresh} className="ml-2 underline hover:opacity-80">Spróbuj ponownie</button>
                </div>
            )}

            {/* Table */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b border-border bg-surface-subtle">
                            <tr>
                                {TH_COLS.map((col, i) => (
                                    <th
                                        key={i}
                                        className={cn(
                                            'px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground',
                                            i === TH_COLS.length - 1 ? 'text-right' : 'text-left',
                                        )}
                                    >
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading && clients.length === 0
                                ? Array.from({ length: 6 }).map((_, i) => <SkeletonTableRow key={i} columns={6} />)
                                : clients.length === 0
                                ? (
                                    <tr>
                                        <td colSpan={6} className="py-16 text-center">
                                            <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" strokeWidth={1.5} />
                                            <p className="text-sm font-medium">{hasFilters ? 'Brak wyników' : 'Brak klientów'}</p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {hasFilters ? 'Spróbuj zmienić kryteria wyszukiwania' : 'Dodaj pierwszego klienta'}
                                            </p>
                                            {!hasFilters && (
                                                <button
                                                    onClick={() => router.push('/dashboard/clients/new')}
                                                    className="mt-4 inline-flex h-9 items-center gap-2 rounded-xl bg-gradient-primary px-4 text-sm font-semibold text-white shadow-glow ring-1 ring-white/15 hover:brightness-110"
                                                >
                                                    <UserPlus className="h-4 w-4" /> Dodaj klienta
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                )
                                : clients.map((client) => (
                                    <tr
                                        key={client.id}
                                        className="cursor-pointer border-b border-border transition-colors hover:bg-secondary/40"
                                        onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-primary text-[11px] font-bold text-white">
                                                    {getInitials(client.name)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold leading-tight">{client.name}</p>
                                                    {client.company && (
                                                        <p className="text-xs text-muted-foreground">{client.company}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            {client.email && <p>{client.email}</p>}
                                            {client.phone && <p className="text-muted-foreground">{client.phone}</p>}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={cn(
                                                'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
                                                client.type === 'COMPANY'
                                                    ? 'bg-[color-mix(in_oklab,var(--status-open)_12%,transparent)] text-status-open ring-[color-mix(in_oklab,var(--status-open)_25%,transparent)]'
                                                    : 'bg-secondary text-muted-foreground ring-border',
                                            )}>
                                                {client.type === 'COMPANY' ? 'Firma' : 'Osoba'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">
                                            {client._count?.offers || 0}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">
                                            {formatDate(client.createdAt)}
                                        </td>
                                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-0.5">
                                                <button
                                                    onClick={() => router.push(`/dashboard/clients/${client.id}/edit`)}
                                                    title="Edytuj"
                                                    className="rounded-lg p-2 text-muted-foreground transition hover:text-primary"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteModal({ isOpen: true, client })}
                                                    title="Usuń"
                                                    className="rounded-lg p-2 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            }
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-border px-6 py-4">
                        <p className="text-sm text-muted-foreground">
                            Pokazano {clients.length} z {total} klientów
                        </p>
                        <div className="flex gap-2">
                            <button
                                disabled={page === 1}
                                onClick={() => setFilters({ page: page - 1 })}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:bg-secondary disabled:pointer-events-none disabled:opacity-40"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <span className="flex items-center text-sm font-medium text-muted-foreground">
                                {page}/{totalPages}
                            </span>
                            <button
                                disabled={page === totalPages}
                                onClick={() => setFilters({ page: page + 1 })}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:bg-secondary disabled:pointer-events-none disabled:opacity-40"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

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

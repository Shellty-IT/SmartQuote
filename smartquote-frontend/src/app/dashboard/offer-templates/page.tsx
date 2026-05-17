// src/app/dashboard/offer-templates/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card, ConfirmDialog } from '@/components/ui';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonTableRow, SkeletonMobileCard } from '@/components/ui/Skeleton';
import { offerTemplatesApi, ApiError } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import type { OfferTemplate } from '@/types';

export default function OfferTemplatesPage() {
    const router = useRouter();
    const toast = useToast();
    const [templates, setTemplates] = useState<OfferTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [categories, setCategories] = useState<string[]>([]);
    const [deleteModal, setDeleteModal] = useState<OfferTemplate | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadTemplates = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await offerTemplatesApi.list({
                search: search || undefined,
                category: category || undefined,
                limit: 100,
            });
            setTemplates(response.data ?? []);
        } catch (err) {
            if (err instanceof ApiError) {
                toast.error('Błąd', err.message);
            }
        } finally {
            setIsLoading(false);
        }
    }, [search, category, toast]);

    const loadCategories = useCallback(async () => {
        try {
            const response = await offerTemplatesApi.getCategories();
            setCategories(response.data ?? []);
        } catch {
            setCategories([]);
        }
    }, []);

    useEffect(() => {
        loadTemplates();
    }, [loadTemplates]);

    useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    async function handleDelete() {
        if (!deleteModal) return;
        setIsDeleting(true);
        try {
            await offerTemplatesApi.delete(deleteModal.id);
            toast.success('Usunięto', `Szablon "${deleteModal.name}" został usunięty`);
            setDeleteModal(null);
            loadTemplates();
        } catch (err) {
            if (err instanceof ApiError) {
                toast.error('Błąd', err.message);
            }
        } finally {
            setIsDeleting(false);
        }
    }

    const hasFilters = search.length > 0 || category.length > 0;

    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-themed">Szablony ofert</h1>
                    <p className="text-sm text-themed-muted mt-1">
                        Twórz presety pozycji do szybkiego generowania ofert
                    </p>
                </div>
                <Link href="/dashboard/offer-templates/new">
                    <Button className="w-full sm:w-auto">
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Nowy szablon
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="relative">
                    <svg
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-themed-muted pointer-events-none"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Szukaj szablonu..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 rounded-lg input-themed text-sm text-themed"
                    />
                </div>
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg input-themed text-sm text-themed"
                >
                    <option value="">Wszystkie kategorie</option>
                    {categories.map((cat) => (
                        <option key={cat} value={cat}>
                            {cat}
                        </option>
                    ))}
                </select>
            </div>

            {isLoading ? (
                <>
                    <div className="hidden lg:block">
                        <Card className="overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="section-themed border-b divider-themed">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-semibold text-themed-muted uppercase tracking-wider text-left">Nazwa</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-themed-muted uppercase tracking-wider text-left">Kategoria</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-themed-muted uppercase tracking-wider text-center">Pozycje</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-themed-muted uppercase tracking-wider text-center">Płatność</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-themed-muted uppercase tracking-wider text-right">Akcje</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divider-themed">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <SkeletonTableRow key={i} columns={5} />
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                    <div className="lg:hidden space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <SkeletonMobileCard key={i} />
                        ))}
                    </div>
                </>
            ) : templates.length === 0 ? (
                <Card>
                    <EmptyState
                        icon={
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                            </svg>
                        }
                        title={hasFilters ? 'Brak wyników' : 'Brak szablonów'}
                        description={
                            hasFilters
                                ? 'Spróbuj zmienić kryteria wyszukiwania'
                                : 'Stwórz swój pierwszy szablon oferty'
                        }
                        action={
                            !hasFilters
                                ? {
                                    label: 'Stwórz szablon',
                                    onClick: () => router.push('/dashboard/offer-templates/new'),
                                }
                                : undefined
                        }
                    />
                </Card>
            ) : (
                <>
                    <div className="hidden lg:block">
                        <Card className="overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="section-themed border-b divider-themed">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-semibold text-themed-muted uppercase tracking-wider text-left">Nazwa</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-themed-muted uppercase tracking-wider text-left">Kategoria</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-themed-muted uppercase tracking-wider text-center">Pozycje</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-themed-muted uppercase tracking-wider text-center">Płatność</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-themed-muted uppercase tracking-wider text-right">Akcje</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divider-themed">
                                    {templates.map((template) => (
                                        <tr key={template.id} className="hover-themed transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-themed text-sm">{template.name}</span>
                                                    {template.description && (
                                                        <span className="text-xs text-themed-muted truncate max-w-xs">
                                                                {template.description}
                                                            </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {template.category ? (
                                                    <span className="px-2.5 py-1 text-xs rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-medium">
                                                            {template.category}
                                                        </span>
                                                ) : (
                                                    <span className="text-xs text-themed-muted">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                    <span className="text-sm text-themed font-medium">
                                                        {template.items.length}
                                                    </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                    <span className="text-sm text-themed">
                                                        {template.defaultPaymentDays} dni
                                                    </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => router.push(`/dashboard/offer-templates/${template.id}`)}
                                                        className="p-2 rounded-lg hover-themed text-themed-muted transition-colors"
                                                        title="Edytuj"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteModal(template)}
                                                        className="p-2 rounded-lg hover:bg-red-500/10 text-red-600 dark:text-red-400 transition-colors"
                                                        title="Usuń"
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
                        </Card>
                    </div>

                    <div className="lg:hidden space-y-3">
                        {templates.map((template) => (
                            <Card key={template.id} className="p-4">
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-themed text-sm truncate">{template.name}</h3>
                                        {template.description && (
                                            <p className="text-xs text-themed-muted mt-0.5 line-clamp-2">
                                                {template.description}
                                            </p>
                                        )}
                                    </div>
                                    {template.category && (
                                        <span className="px-2 py-0.5 text-xs rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-medium shrink-0">
                                            {template.category}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-4 text-xs text-themed-muted mb-3">
                                    <span>{template.items.length} pozycji</span>
                                    <span>·</span>
                                    <span>{template.defaultPaymentDays} dni płatności</span>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => router.push(`/dashboard/offer-templates/${template.id}`)}
                                        className="flex-1"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Edytuj
                                    </Button>
                                    <button
                                        onClick={() => setDeleteModal(template)}
                                        className="px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </>
            )}

            <ConfirmDialog
                isOpen={!!deleteModal}
                onClose={() => setDeleteModal(null)}
                onConfirm={handleDelete}
                title="Usuń szablon"
                description={`Czy na pewno chcesz usunąć szablon "${deleteModal?.name}"? Ta operacja jest nieodwracalna.`}
                confirmLabel="Usuń"
                isLoading={isDeleting}
            />
        </div>
    );
}
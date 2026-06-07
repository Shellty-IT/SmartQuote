// src/app/dashboard/offer-templates/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileText, FileSignature } from 'lucide-react';
import { Button, ConfirmDialog } from '@/components/ui';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonTableRow, SkeletonMobileCard } from '@/components/ui/Skeleton';
import { offerTemplatesApi, ApiError } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { useTranslations } from '@/i18n';
import { cn } from '@/lib/utils';
import { DocumentTemplatesTab } from './components/DocumentTemplatesTab';
import { ContractDocumentTemplates } from './components/ContractDocumentTemplates';
import type { OfferTemplate } from '@/types';

type PageTab = 'offers' | 'contracts';

// ── Offer item templates list ─────────────────────────────────────────────────

function OfferItemTemplates() {
    const router = useRouter();
    const toast = useToast();
    const tr = useTranslations('offerTemplatesPage');
    const commonTr = useTranslations('common');
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
                toast.error(commonTr.errorTitle, err.message);
            }
        } finally {
            setIsLoading(false);
        }
    }, [search, category, toast, commonTr.errorTitle]);

    const loadCategories = useCallback(async () => {
        try {
            const response = await offerTemplatesApi.getCategories();
            setCategories(response.data ?? []);
        } catch {
            setCategories([]);
        }
    }, []);

    useEffect(() => { loadTemplates(); }, [loadTemplates]);
    useEffect(() => { loadCategories(); }, [loadCategories]);

    async function handleDelete() {
        if (!deleteModal) return;
        setIsDeleting(true);
        try {
            await offerTemplatesApi.delete(deleteModal.id);
            toast.success(tr.toasts.deleted, tr.toasts.deletedDesc.replace('{name}', deleteModal.name));
            setDeleteModal(null);
            loadTemplates();
        } catch (err) {
            if (err instanceof ApiError) toast.error(commonTr.errorTitle, err.message);
        } finally {
            setIsDeleting(false);
        }
    }

    const hasFilters = search.length > 0 || category.length > 0;

    return (
        <div className="space-y-4">
            {/* Section header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-base font-semibold text-foreground">{tr.itemSetsSection}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{tr.itemSetsSectionSub}</p>
                </div>
                <Link href="/dashboard/offer-templates/new">
                    <Button size="sm">
                        <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        {tr.newTemplate}
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder={tr.searchPlaceholder}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 rounded-lg border-border bg-card text-foreground text-sm"
                    />
                </div>
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border-border bg-card text-foreground text-sm"
                >
                    <option value="">{tr.allCategories}</option>
                    {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>

            {/* List */}
            {isLoading ? (
                <>
                    <div className="hidden lg:block">
                        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-surface-subtle border-b border-border">
                                        <tr>
                                            <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground text-left">{tr.colName}</th>
                                            <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground text-left">{tr.colCategory}</th>
                                            <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground text-center">{tr.colItems}</th>
                                            <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground text-center">{tr.colPayment}</th>
                                            <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground text-right">{tr.colActions}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y border-border">
                                        {Array.from({ length: 5 }).map((_, i) => <SkeletonTableRow key={i} columns={5} />)}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div className="lg:hidden space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => <SkeletonMobileCard key={i} />)}
                    </div>
                </>
            ) : templates.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                    <EmptyState
                        icon={
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                            </svg>
                        }
                        title={hasFilters ? tr.noResults : tr.noTemplates}
                        description={hasFilters ? tr.noResultsDesc : tr.createFirst}
                        action={!hasFilters ? { label: tr.createBtn, onClick: () => router.push('/dashboard/offer-templates/new') } : undefined}
                    />
                </div>
            ) : (
                <>
                    <div className="hidden lg:block">
                        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-surface-subtle border-b border-border">
                                        <tr>
                                            <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground text-left">{tr.colName}</th>
                                            <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground text-left">{tr.colCategory}</th>
                                            <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground text-center">{tr.colItems}</th>
                                            <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground text-center">{tr.colPayment}</th>
                                            <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground text-right">{tr.colActions}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y border-border">
                                        {templates.map((template) => (
                                            <tr key={template.id} className="hover:bg-secondary/60 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-foreground text-sm">{template.name}</span>
                                                        {template.description && (
                                                            <span className="text-xs text-muted-foreground truncate max-w-xs">{template.description}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {template.category ? (
                                                        <span className="px-2.5 py-1 text-xs rounded-full bg-primary/10 text-primary font-medium">{template.category}</span>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="text-sm text-foreground font-medium">{template.items.length}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="text-sm text-foreground">{tr.paymentDays.replace('{n}', String(template.defaultPaymentDays))}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => router.push(`/dashboard/offer-templates/${template.id}`)}
                                                            className="p-2 rounded-lg hover:bg-secondary/60 text-muted-foreground transition-colors"
                                                            title={commonTr.edit}
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteModal(template)}
                                                            className="p-2 rounded-lg hover:bg-status-rejected/10 text-status-rejected transition-colors"
                                                            title={commonTr.delete}
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
                        </div>
                    </div>

                    <div className="lg:hidden space-y-3">
                        {templates.map((template) => (
                            <div key={template.id} className="rounded-2xl border border-border bg-card p-6 shadow-card">
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-foreground text-sm truncate">{template.name}</h3>
                                        {template.description && (
                                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{template.description}</p>
                                        )}
                                    </div>
                                    {template.category && (
                                        <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary font-medium shrink-0">{template.category}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                                    <span>{template.items.length} pozycji</span>
                                    <span>·</span>
                                    <span>{tr.itemsDays.replace('{n}', String(template.defaultPaymentDays))}</span>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/offer-templates/${template.id}`)} className="flex-1">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        {commonTr.edit}
                                    </Button>
                                    <button
                                        onClick={() => setDeleteModal(template)}
                                        className="px-3 py-2 rounded-lg border border-destructive/30 bg-status-rejected/10 text-status-rejected text-sm font-medium hover:bg-status-rejected/20 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            <ConfirmDialog
                isOpen={!!deleteModal}
                onClose={() => setDeleteModal(null)}
                onConfirm={handleDelete}
                title={tr.deleteTitle}
                description={tr.deleteDesc}
                confirmLabel={commonTr.delete}
                isLoading={isDeleting}
            />
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OfferTemplatesPage() {
    const tr = useTranslations('offerTemplatesPage');
    const [activeTab, setActiveTab] = useState<PageTab>('offers');

    return (
        <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-8 sm:px-6">
            {/* Header */}
            <div>
                <h1 className="text-xl md:text-3xl font-bold tracking-tight">{tr.title}</h1>
                <p className="text-sm text-muted-foreground mt-1">{tr.subtitle}</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 rounded-xl border border-border bg-card p-1 w-fit shadow-card">
                <button
                    type="button"
                    onClick={() => setActiveTab('offers')}
                    className={cn(
                        'flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                        activeTab === 'offers'
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60',
                    )}
                >
                    <FileText className="h-4 w-4" />
                    {tr.tabOffers}
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('contracts')}
                    className={cn(
                        'flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                        activeTab === 'contracts'
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60',
                    )}
                >
                    <FileSignature className="h-4 w-4" />
                    {tr.tabContracts}
                </button>
            </div>

            {/* Tab: Offer templates */}
            {activeTab === 'offers' && (
                <div className="space-y-8">
                    <div className="space-y-3">
                        <div>
                            <h2 className="text-base font-semibold text-foreground">{tr.docTemplateSection}</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">{tr.docTemplateSectionSub}</p>
                        </div>
                        <DocumentTemplatesTab />
                    </div>
                    <div className="border-t border-border" />
                    <OfferItemTemplates />
                </div>
            )}

            {/* Tab: Contract templates */}
            {activeTab === 'contracts' && (
                <div className="space-y-3">
                    <div>
                        <h2 className="text-base font-semibold text-foreground">{tr.contractDocSection}</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">{tr.contractDocSectionSub}</p>
                    </div>
                    <ContractDocumentTemplates />
                </div>
            )}
        </div>
    );
}

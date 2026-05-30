// src/app/dashboard/offer-templates/[id]/page.tsx
'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { offerTemplatesApi, ApiError } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { useTranslations } from '@/i18n';
import type { OfferTemplate, UpdateOfferTemplateInput, CreateOfferTemplateItemInput } from '@/types';

interface PageProps {
    params: Promise<{ id: string }>;
}

interface TemplateItem extends CreateOfferTemplateItemInput {
    _tempId: string;
}

function toApiItem(item: TemplateItem): CreateOfferTemplateItemInput {
    const { _tempId: _omit, ...rest } = item;
    void _omit;
    return rest;
}

export default function EditOfferTemplatePage({ params }: PageProps) {
    const { id } = use(params);
    const router = useRouter();
    const toast = useToast();
    const tr = useTranslations('offerTemplateForm');
    const commonTr = useTranslations('common');

    const [template, setTemplate] = useState<OfferTemplate | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [defaultPaymentDays, setDefaultPaymentDays] = useState(14);
    const [defaultTerms, setDefaultTerms] = useState('');
    const [defaultNotes, setDefaultNotes] = useState('');
    const [items, setItems] = useState<TemplateItem[]>([]);

    const loadTemplate = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await offerTemplatesApi.get(id);
            if (response.data) {
                setTemplate(response.data);
                setName(response.data.name);
                setDescription(response.data.description ?? '');
                setCategory(response.data.category ?? '');
                setDefaultPaymentDays(response.data.defaultPaymentDays);
                setDefaultTerms(response.data.defaultTerms ?? '');
                setDefaultNotes(response.data.defaultNotes ?? '');
                setItems(
                    response.data.items.map((item) => ({
                        _tempId: item.id,
                        name: item.name,
                        description: item.description,
                        quantity: item.quantity,
                        unit: item.unit,
                        unitPrice: item.unitPrice,
                        vatRate: item.vatRate,
                        discount: item.discount,
                        isOptional: item.isOptional,
                        variantName: item.variantName,
                    }))
                );
            }
        } catch (err) {
            if (err instanceof ApiError) {
                toast.error(commonTr.errorTitle, err.message);
                router.push('/dashboard/offer-templates');
            }
        } finally {
            setIsLoading(false);
        }
    }, [id, toast, router]);

    useEffect(() => {
        loadTemplate();
    }, [loadTemplate]);

    function addItem() {
        setItems((prev) => [
            ...prev,
            {
                _tempId: crypto.randomUUID(),
                name: '',
                description: null,
                quantity: 1,
                unit: 'szt.',
                unitPrice: 0,
                vatRate: 23,
                discount: 0,
                isOptional: false,
                variantName: null,
            },
        ]);
    }

    function removeItem(tempId: string) {
        if (items.length === 1) return;
        setItems((prev) => prev.filter((i) => i._tempId !== tempId));
    }

    function updateItem(tempId: string, field: keyof TemplateItem, value: string | number | boolean | null) {
        setItems((prev) =>
            prev.map((item) => (item._tempId === tempId ? { ...item, [field]: value } : item))
        );
    }

    async function handleSubmit() {
        if (name.length < 3) {
            toast.error(tr.toasts.validationError, tr.toasts.nameTooShort);
            return;
        }
        if (items.length === 0 || items.some((i) => !i.name || i.quantity <= 0)) {
            toast.error(tr.toasts.validationError, tr.toasts.itemsInvalid);
            return;
        }

        setIsSubmitting(true);
        try {
            const data: UpdateOfferTemplateInput = {
                name,
                description: description || null,
                category: category || null,
                defaultPaymentDays,
                defaultTerms: defaultTerms || null,
                defaultNotes: defaultNotes || null,
                items: items.map(toApiItem),
            };

            await offerTemplatesApi.update(id, data);
            toast.success(tr.toasts.updated, `"${name}" ${tr.toasts.updated}`);
            router.push('/dashboard/offer-templates');
        } catch (err) {
            if (err instanceof ApiError) {
                toast.error(commonTr.errorTitle, err.message);
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoading) return <PageLoader />;
    if (!template) return null;

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-muted-foreground hover:opacity-70 mb-4"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    {tr.back}
                </button>
                <h1 className="text-3xl font-bold tracking-tight">{tr.editTitle}</h1>
                <p className="text-muted-foreground mt-1">{tr.editSubtitle}</p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <h2 className="text-lg font-semibold text-foreground mb-4">{tr.basicInfo}</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                            {tr.nameLabel} <span className="text-status-rejected">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="np. WordPress Standard"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg border-border bg-card text-foreground text-foreground"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">{tr.descLabel}</label>
                        <textarea
                            placeholder={tr.descLabel}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            className="w-full px-4 py-2.5 rounded-lg border-border bg-card text-foreground text-foreground resize-none"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">
                                {tr.categoryLabel}
                            </label>
                            <input
                                type="text"
                                placeholder="np. Strony WWW"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-lg border-border bg-card text-foreground text-foreground"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">
                                {tr.paymentDaysLabel}
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={365}
                                value={defaultPaymentDays}
                                onChange={(e) => setDefaultPaymentDays(Number(e.target.value))}
                                className="w-full px-4 py-2.5 rounded-lg border-border bg-card text-foreground text-foreground"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                            {tr.termsLabel}
                        </label>
                        <textarea
                            placeholder={tr.termsLabel}
                            value={defaultTerms}
                            onChange={(e) => setDefaultTerms(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2.5 rounded-lg border-border bg-card text-foreground text-foreground resize-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                            {tr.notesLabel}
                        </label>
                        <textarea
                            placeholder={tr.notesLabel}
                            value={defaultNotes}
                            onChange={(e) => setDefaultNotes(e.target.value)}
                            rows={2}
                            className="w-full px-4 py-2.5 rounded-lg border-border bg-card text-foreground text-foreground resize-none"
                        />
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-foreground">{tr.itemsSection.replace("{n}", String(items.length))}</h2>
                    <Button variant="outline" size="sm" onClick={addItem}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        {tr.addItem}
                    </Button>
                </div>
                <div className="space-y-4">
                    {items.map((item, index) => (
                        <div key={item._tempId} className="bg-surface-subtle rounded-xl p-4 border border-border">
                            <div className="flex items-start justify-between mb-3">
                                <span className="text-sm font-semibold text-foreground">{tr.itemTitle.replace('{n}', String(index + 1))}</span>
                                {items.length > 1 && (
                                    <button
                                        onClick={() => removeItem(item._tempId)}
                                        className="p-1 rounded-lg hover:bg-status-rejected/10 text-status-rejected transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="md:col-span-2">
                                    <input
                                        type="text"
                                        placeholder={tr.itemNamePlaceholder}
                                        value={item.name}
                                        onChange={(e) => updateItem(item._tempId, 'name', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border-border bg-card text-foreground text-foreground text-sm"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <input
                                        type="text"
                                        placeholder={tr.itemDescPlaceholder}
                                        value={item.description ?? ''}
                                        onChange={(e) => updateItem(item._tempId, 'description', e.target.value || null)}
                                        className="w-full px-3 py-2 rounded-lg border-border bg-card text-foreground text-foreground text-sm"
                                    />
                                </div>
                                <div>
                                    <input
                                        type="number"
                                        placeholder={tr.itemQtyPlaceholder}
                                        min={0}
                                        step={0.01}
                                        value={item.quantity}
                                        onChange={(e) => updateItem(item._tempId, 'quantity', Number(e.target.value))}
                                        className="w-full px-3 py-2 rounded-lg border-border bg-card text-foreground text-foreground text-sm"
                                    />
                                </div>
                                <div>
                                    <input
                                        type="text"
                                        placeholder={tr.itemUnitPlaceholder}
                                        value={item.unit}
                                        onChange={(e) => updateItem(item._tempId, 'unit', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border-border bg-card text-foreground text-foreground text-sm"
                                    />
                                </div>
                                <div>
                                    <input
                                        type="number"
                                        placeholder={tr.itemPricePlaceholder}
                                        min={0}
                                        step={0.01}
                                        value={item.unitPrice}
                                        onChange={(e) => updateItem(item._tempId, 'unitPrice', Number(e.target.value))}
                                        className="w-full px-3 py-2 rounded-lg border-border bg-card text-foreground text-foreground text-sm"
                                    />
                                </div>
                                <div>
                                    <input
                                        type="number"
                                        placeholder="VAT %"
                                        min={0}
                                        max={100}
                                        value={item.vatRate}
                                        onChange={(e) => updateItem(item._tempId, 'vatRate', Number(e.target.value))}
                                        className="w-full px-3 py-2 rounded-lg border-border bg-card text-foreground text-foreground text-sm"
                                    />
                                </div>
                                <div>
                                    <input
                                        type="number"
                                        placeholder={tr.itemDiscountPlaceholder}
                                        min={0}
                                        max={100}
                                        value={item.discount}
                                        onChange={(e) => updateItem(item._tempId, 'discount', Number(e.target.value))}
                                        className="w-full px-3 py-2 rounded-lg border-border bg-card text-foreground text-foreground text-sm"
                                    />
                                </div>
                                <div>
                                    <input
                                        type="text"
                                        placeholder={tr.itemVariantPlaceholder}
                                        value={item.variantName ?? ''}
                                        onChange={(e) => updateItem(item._tempId, 'variantName', e.target.value || null)}
                                        className="w-full px-3 py-2 rounded-lg border-border bg-card text-foreground text-foreground text-sm"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id={`optional-${item._tempId}`}
                                        checked={item.isOptional}
                                        onChange={(e) => updateItem(item._tempId, 'isOptional', e.target.checked)}
                                        className="w-4 h-4 rounded border-border"
                                    />
                                    <label htmlFor={`optional-${item._tempId}`} className="text-sm text-foreground">
                                        Pozycja opcjonalna
                                    </label>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-between">
                <Button variant="outline" onClick={() => router.back()}>{commonTr.cancel}</Button>
                <Button onClick={handleSubmit} isLoading={isSubmitting}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>{commonTr.saveChanges}</Button>
            </div>
        </div>
    );
}
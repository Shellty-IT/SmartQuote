// src/app/dashboard/contracts/new/page.tsx
'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useContracts } from '@/hooks/useContracts';
import { useClients } from '@/hooks/useClients';
import { Button, Input, Select, Textarea, LoadingSpinner } from '@/components/ui';
import { Client } from '@/types';
import { useToast } from '@/contexts/ToastContext';
import { useTranslations } from '@/i18n';

function NewContractForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const toast = useToast();
    const t = useTranslations('contractForm');
    const commonTr = useTranslations('common');
    const fromOfferId = searchParams.get('fromOffer');

    const { createContract, createFromOffer } = useContracts();
    const { clients } = useClients({ limit: 100 });
    const [loading, setLoading] = useState(false);

    const createFromOfferAttempted = useRef(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        clientId: '',
        startDate: '',
        endDate: '',
        terms: '',
        paymentTerms: '',
        paymentDays: 14,
        notes: '',
        items: [
            { name: '', description: '', quantity: 1, unit: 'szt.', unitPrice: 0, vatRate: 23, discount: 0 }
        ],
    });

    useEffect(() => {
        if (fromOfferId && !createFromOfferAttempted.current) {
            createFromOfferAttempted.current = true;

            const handleCreateFromOffer = async () => {
                setLoading(true);

                const response = await createFromOffer(fromOfferId);

                if (response.success && response.data) {
                    toast.success(t.toasts.created, t.toasts.createdFromOffer);
                    router.push(`/dashboard/contracts/${response.data.id}`);
                } else {
                    toast.error(t.toasts.error, t.toasts.createFromOfferError);
                    setLoading(false);
                }
            };

            handleCreateFromOffer();
        }
    }, [fromOfferId, createFromOffer, router, toast, t]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await createContract({
                ...formData,
                paymentDays: Number(formData.paymentDays),
                items: formData.items.map((item, index) => ({
                    ...item,
                    quantity: Number(item.quantity),
                    unitPrice: Number(item.unitPrice),
                    vatRate: Number(item.vatRate),
                    discount: Number(item.discount),
                    position: index,
                })),
            });

            if (response.success && response.data) {
                toast.success(t.toasts.created, t.toasts.createdDesc.replace('{name}', formData.title));
                router.push(`/dashboard/contracts/${response.data.id}`);
            } else {
                toast.error(t.toasts.error, t.toasts.createError);
                setLoading(false);
            }
        } catch {
            toast.error(t.toasts.error, t.toasts.createError);
            setLoading(false);
        }
    };

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { name: '', description: '', quantity: 1, unit: 'szt.', unitPrice: 0, vatRate: 23, discount: 0 }]
        }));
    };

    const removeItem = (index: number) => {
        if (formData.items.length > 1) {
            setFormData(prev => ({
                ...prev,
                items: prev.items.filter((_, i) => i !== index)
            }));
        }
    };

    const updateItem = (index: number, field: string, value: string | number) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        }));
    };

    if (fromOfferId && loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-muted-foreground">{t.creatingFromOffer}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4 md:p-8">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/contracts">
                    <Button variant="ghost" size="sm">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{t.newTitle}</h1>
                    <p className="text-muted-foreground">{t.newSubtitle}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                    <h2 className="text-lg font-semibold text-foreground mb-4">{t.basicInfo}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label={t.contractTitleLabel}
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            required
                        />
                        <Select
                            label={t.clientLabel}
                            value={formData.clientId}
                            onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                            required
                            placeholder={t.clientPlaceholder}
                            options={clients.map((client: Client) => ({
                                value: client.id,
                                label: client.company ? `${client.name} (${client.company})` : client.name
                            }))}
                        />
                        <Input
                            type="date"
                            label={t.startDate}
                            value={formData.startDate}
                            onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                        />
                        <Input
                            type="date"
                            label={t.endDate}
                            value={formData.endDate}
                            onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                        />
                        <Input
                            type="number"
                            label={t.paymentDays}
                            value={formData.paymentDays}
                            onChange={(e) => setFormData(prev => ({ ...prev, paymentDays: parseInt(e.target.value) || 14 }))}
                        />
                    </div>
                    <div className="mt-4">
                        <Textarea
                            label={t.descriptionLabel}
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            rows={3}
                            resizable
                        />
                    </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-foreground">{t.itemsSection}</h2>
                        <Button type="button" variant="outline" size="sm" onClick={addItem}>
                            {t.addItem}
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {formData.items.map((item, index) => (
                            <div key={index} className="bg-card border-border border rounded-lg p-4">
                                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                                    <div className="md:col-span-2">
                                        <Input
                                            label={t.nameLabel}
                                            value={item.name}
                                            onChange={(e) => updateItem(index, 'name', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <Input
                                        type="number"
                                        label={t.qtyLabel}
                                        value={item.quantity}
                                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                        step="0.001"
                                        min="0"
                                    />
                                    <Input
                                        label={t.unitLabel}
                                        value={item.unit}
                                        onChange={(e) => updateItem(index, 'unit', e.target.value)}
                                    />
                                    <Input
                                        type="number"
                                        label={t.netPriceLabel}
                                        value={item.unitPrice}
                                        onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                                        step="0.01"
                                        min="0"
                                    />
                                    <div className="flex items-end">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeItem(index)}
                                            disabled={formData.items.length === 1}
                                        >{commonTr.delete}</Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                    <h2 className="text-lg font-semibold text-foreground mb-4">{t.termsSection}</h2>
                    <div className="space-y-4">
                        <Textarea
                            label={t.termsLabel}
                            value={formData.terms}
                            onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
                            rows={4}
                            resizable
                        />
                        <Textarea
                            label={t.internalNotes}
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            rows={3}
                            resizable
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <Link href="/dashboard/contracts">
                        <Button type="button" variant="outline">
                            {t.cancel}
                        </Button>
                    </Link>
                    <Button type="submit" disabled={loading}>
                        {loading ? t.creating : t.createContract}
                    </Button>
                </div>
            </form>
        </div>
    );
}

function NewContractLoading() {
    const t = useTranslations('contractForm');
    return (
        <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            <p className="mt-4 text-muted-foreground">{t.loading}</p>
        </div>
    );
}

export default function NewContractPage() {
    return (
        <Suspense fallback={<NewContractLoading />}>
            <NewContractForm />
        </Suspense>
    );
}

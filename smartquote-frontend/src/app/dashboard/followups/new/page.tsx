// src/app/dashboard/followups/new/page.tsx
'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { followUpsApi } from '@/lib/api';
import { useClients } from '@/hooks/useClients';
import { useOffers } from '@/hooks/useOffers';
import { useContracts } from '@/hooks/useContracts';
import { Button, Input, Select, Textarea } from '@/components/ui';
import { useTranslations } from '@/i18n';
import { CreateFollowUpData } from '@/types';

function NewFollowUpForm() {
    const router = useRouter();
    const tr = useTranslations('followupNew');
    const followupsTr = useTranslations('followups');
    const searchParams = useSearchParams();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<CreateFollowUpData>({
        title: '',
        description: '',
        type: 'TASK',
        priority: 'MEDIUM',
        dueDate: new Date().toISOString().split('T')[0],
        notes: '',
        clientId: searchParams.get('clientId') || undefined,
        offerId: searchParams.get('offerId') || undefined,
        contractId: searchParams.get('contractId') || undefined,
    });
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const { clients = [] } = useClients({ limit: 100 });
    const { offers = [] } = useOffers({ limit: 100 });
    const { contracts = [] } = useContracts({ limit: 100 });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value || undefined }));
        if (fieldErrors[name]) {
            setFieldErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!formData.title || formData.title.length < 2) {
            errors.title = tr.validation.titleTooShort;
        }

        if (!formData.dueDate) {
            errors.dueDate = tr.validation.dueDateRequired;
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);
        setError(null);

        try {
            const cleanData: CreateFollowUpData = {
                title: formData.title,
                type: formData.type,
                dueDate: new Date(formData.dueDate).toISOString(),
                ...(formData.priority && { priority: formData.priority }),
                ...(formData.description && { description: formData.description }),
                ...(formData.notes && { notes: formData.notes }),
                ...(formData.clientId && { clientId: formData.clientId }),
                ...(formData.offerId && { offerId: formData.offerId }),
                ...(formData.contractId && { contractId: formData.contractId }),
            };

            await followUpsApi.create(cleanData);
            router.push('/dashboard/followups');
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError(tr.unexpectedError);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-3xl mx-auto">
            <div className="mb-8">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    {tr.back}
                </button>
                <h1 className="text-3xl font-bold tracking-tight">{tr.title}</h1>
                <p className="text-muted-foreground mt-1">{tr.subtitle}</p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-destructive/10 border border-destructive/25 rounded-lg text-destructive">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-card">
                    <h2 className="text-lg font-semibold text-foreground mb-4">{tr.basicInfo}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <Input
                                label={tr.titleLabel}
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                error={fieldErrors.title}
                                required
                                placeholder={tr.titlePlaceholder}
                            />
                        </div>
                        <Select
                            label={tr.typeLabel}
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            options={Object.entries(tr.types).map(([v, l]) => ({ value: v, label: l }))}
                        />
                        <Select
                            label={tr.priorityLabel}
                            name="priority"
                            value={formData.priority}
                            onChange={handleChange}
                            options={Object.entries(followupsTr.priorities).map(([v, l]) => ({ value: v, label: l }))}
                        />
                        <Input
                            label={tr.dueDateLabel}
                            name="dueDate"
                            type="date"
                            value={formData.dueDate}
                            onChange={handleChange}
                            error={fieldErrors.dueDate}
                            required
                        />
                    </div>
                </div>

                <div className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-card">
                    <h2 className="text-lg font-semibold text-foreground mb-4">{tr.descSection}</h2>
                    <Textarea
                        name="description"
                        value={formData.description || ''}
                        onChange={handleChange}
                        placeholder={tr.descPlaceholder}
                        rows={3}
                    />
                </div>

                <div className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-card">
                    <h2 className="text-lg font-semibold text-foreground mb-4">{tr.linksSection}</h2>
                    <div className="grid grid-cols-1 gap-4">
                        <Select
                            label={tr.clientLabel}
                            name="clientId"
                            value={formData.clientId || ''}
                            onChange={handleChange}
                            options={[
                                { value: '', label: tr.noLink },
                                ...clients.map((c) => ({ value: c.id, label: c.name })),
                            ]}
                        />
                        <Select
                            label={tr.offerLabel}
                            name="offerId"
                            value={formData.offerId || ''}
                            onChange={handleChange}
                            options={[
                                { value: '', label: tr.noLink },
                                ...offers.map((o) => ({ value: o.id, label: `${o.number} - ${o.title}` })),
                            ]}
                        />
                        <Select
                            label={tr.contractLabel}
                            name="contractId"
                            value={formData.contractId || ''}
                            onChange={handleChange}
                            options={[
                                { value: '', label: tr.noLink },
                                ...contracts.map((c) => ({ value: c.id, label: `${c.number} - ${c.title}` })),
                            ]}
                        />
                    </div>
                </div>

                <div className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-card">
                    <h2 className="text-lg font-semibold text-foreground mb-4">{tr.notesSection}</h2>
                    <Textarea
                        name="notes"
                        value={formData.notes || ''}
                        onChange={handleChange}
                        placeholder={tr.notesPlaceholder}
                        rows={3}
                    />
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        {tr.cancel}
                    </Button>
                    <Button type="submit" isLoading={isLoading}>
                        {tr.submit}
                    </Button>
                </div>
            </form>
        </div>
    );
}

function NewFollowUpLoading() {
    const commonTr = useTranslations('common');
    return (
        <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">{commonTr.loading}</p>
        </div>
    );
}

export default function NewFollowUpPage() {
    return (
        <Suspense fallback={<NewFollowUpLoading />}>
            <NewFollowUpForm />
        </Suspense>
    );
}
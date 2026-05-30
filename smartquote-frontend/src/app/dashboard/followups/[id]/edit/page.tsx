// src/app/dashboard/followups/[id]/edit/page.tsx
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useFollowUp } from '@/hooks/useFollowUps';
import { followUpsApi } from '@/lib/api';
import { useClients } from '@/hooks/useClients';
import { useOffers } from '@/hooks/useOffers';
import { useContracts } from '@/hooks/useContracts';
import { Button, Input, Select, Textarea } from '@/components/ui';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { UpdateFollowUpData } from '@/types';
import { useTranslations } from '@/i18n';

export default function EditFollowUpPage({ params }: { params: Promise<{ id: string }> }) {
    const tr = useTranslations('followupNew');
    const followupsTr = useTranslations('followups');
    const offerDetailTr = useTranslations('offerDetail');
    const commonTr = useTranslations('common');
    const { id } = use(params);
    const router = useRouter();
    const { followUp, loading: loadingFollowUp, error: fetchError } = useFollowUp(id);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<UpdateFollowUpData>({});
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const { clients = [] } = useClients({ limit: 100 });
    const { offers = [] } = useOffers({ limit: 100 });
    const { contracts = [] } = useContracts({ limit: 100 });

    useEffect(() => {
        if (followUp) {
            setFormData({
                title: followUp.title,
                description: followUp.description || '',
                type: followUp.type,
                status: followUp.status,
                priority: followUp.priority,
                dueDate: followUp.dueDate.split('T')[0],
                notes: followUp.notes || '',
                clientId: followUp.clientId || undefined,
                offerId: followUp.offerId || undefined,
                contractId: followUp.contractId || undefined,
            });
        }
    }, [followUp]);

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
            const cleanData: UpdateFollowUpData = {};

            if (formData.title) cleanData.title = formData.title;
            if (formData.type) cleanData.type = formData.type;
            if (formData.status) cleanData.status = formData.status;
            if (formData.priority) cleanData.priority = formData.priority;
            if (formData.dueDate) cleanData.dueDate = formData.dueDate;

            if (formData.description) cleanData.description = formData.description;
            if (formData.notes) cleanData.notes = formData.notes;

            if (formData.clientId) cleanData.clientId = formData.clientId;
            if (formData.offerId) cleanData.offerId = formData.offerId;
            if (formData.contractId) cleanData.contractId = formData.contractId;

            await followUpsApi.update(id, cleanData);
            router.push(`/dashboard/followups/${id}`);
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

    if (loadingFollowUp) return <PageLoader />;

    if (fetchError || !followUp) {
        return (
            <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-8 sm:px-6">
                <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                    <div className="text-center py-12">
                        <p className="text-status-rejected mb-4">{fetchError || 'Nie znaleziono follow-upa'}</p>
                        <Button onClick={() => router.push('/dashboard/followups')}>{offerDetailTr.backToList}</Button>
                    </div>
                </div>
            </div>
        );
    }

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
                <h1 className="text-3xl font-bold tracking-tight">{commonTr.edit}</h1>
                <p className="text-muted-foreground mt-1">{tr.editSubtitle}</p>
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
                                value={formData.title || ''}
                                onChange={handleChange}
                                error={fieldErrors.title}
                                required
                                placeholder={tr.titlePlaceholder}
                            />
                        </div>
                        <Select
                            label={tr.typeLabel}
                            name="type"
                            value={formData.type || ''}
                            onChange={handleChange}
                            options={[
                                { value: 'CALL', label: tr.types.CALL },
                                { value: 'EMAIL', label: tr.types.EMAIL },
                                { value: 'MEETING', label: tr.types.MEETING },
                                { value: 'TASK', label: tr.types.TASK },
                                { value: 'REMINDER', label: tr.types.REMINDER },
                                { value: 'OTHER', label: tr.types.OTHER },
                            ]}
                        />
                        <Select
                            label={followupsTr.statusLabel}
                            name="status"
                            value={formData.status || ''}
                            onChange={handleChange}
                            options={[
                                { value: 'PENDING', label: followupsTr.statuses.PENDING },
                                { value: 'COMPLETED', label: followupsTr.statuses.COMPLETED },
                                { value: 'CANCELLED', label: followupsTr.statuses.CANCELLED },
                            ]}
                        />
                        <Select
                            label={tr.priorityLabel}
                            name="priority"
                            value={formData.priority || ''}
                            onChange={handleChange}
                            options={[
                                { value: 'LOW', label: followupsTr.priorities.LOW },
                                { value: 'MEDIUM', label: followupsTr.priorities.MEDIUM },
                                { value: 'HIGH', label: followupsTr.priorities.HIGH },
                                { value: 'URGENT', label: followupsTr.priorities.URGENT },
                            ]}
                        />
                        <Input
                            label={tr.dueDateLabel}
                            name="dueDate"
                            type="date"
                            value={formData.dueDate || ''}
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
                            label="Oferta"
                            name="offerId"
                            value={formData.offerId || ''}
                            onChange={handleChange}
                            options={[
                                { value: '', label: tr.noLink },
                                ...offers.map((o) => ({ value: o.id, label: `${o.number} - ${o.title}` })),
                            ]}
                        />
                        <Select
                            label="Umowa"
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
                    <Button type="button" variant="outline" onClick={() => router.back()}>{commonTr.cancel}</Button>
                    <Button type="submit" isLoading={isLoading}>{commonTr.saveChanges}</Button>
                </div>
            </form>
        </div>
    );
}
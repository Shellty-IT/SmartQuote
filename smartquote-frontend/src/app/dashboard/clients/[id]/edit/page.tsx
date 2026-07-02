// src/app/dashboard/clients/[id]/edit/page.tsx
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useClient } from '@/hooks/useClients';
import { clientsApi, ApiError, getApiFieldErrors } from '@/lib/api';
import { Button, Input, Select, Textarea } from '@/components/ui';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { UpdateClientInput } from '@/types';
import { useToast } from '@/contexts/ToastContext';
import { useTranslations } from '@/i18n';

export default function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const toast = useToast();
    const t = useTranslations('clientForm');
    const { client, isLoading: isLoadingClient, error: clientError } = useClient(id);

    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<UpdateClientInput>({});
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (client) {
            setFormData({
                type: client.type,
                name: client.name,
                email: client.email || '',
                phone: client.phone || '',
                company: client.company || '',
                nip: client.nip || '',
                address: client.address || '',
                city: client.city || '',
                postalCode: client.postalCode || '',
                website: client.website || '',
                notes: client.notes || '',
                isActive: client.isActive,
            });
        }
    }, [client]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setFormData((prev) => ({ ...prev, [name]: newValue }));
        if (fieldErrors[name]) {
            setFieldErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await clientsApi.update(id, formData);
            toast.success(t.toasts.updated, t.toasts.updatedDesc);
            router.push(`/dashboard/clients/${id}`);
        } catch (err) {
            const errors = getApiFieldErrors(err);
            if (Object.keys(errors).length > 0) {
                setFieldErrors(errors);
                toast.error(t.toasts.saveError, Object.values(errors)[0]);
            } else if (err instanceof ApiError) {
                toast.error(t.toasts.saveError, err.message);
            } else {
                toast.error(t.toasts.error, t.toasts.unexpectedError);
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoadingClient) return <PageLoader />;

    if (clientError || !client) {
        return (
            <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-8 sm:px-6">
                <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                    <div className="text-center py-12">
                        <p className="text-destructive mb-4">{clientError || t.notFound}</p>
                        <Button onClick={() => router.push('/dashboard/clients')}>
                            {t.backToList}
                        </Button>
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
                    className="flex items-center gap-2 text-muted-foreground hover:opacity-70 mb-4"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    {t.back}
                </button>
                <h1 className="text-2xl font-bold text-foreground">{t.editTitle}</h1>
                <p className="text-muted-foreground mt-1">{client.name}</p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-card">
                    <h2 className="text-lg font-semibold text-foreground mb-4">{t.basicInfo}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                            label={t.clientType}
                            name="type"
                            value={formData.type || 'COMPANY'}
                            onChange={handleChange}
                            options={[
                                { value: 'COMPANY', label: t.companyType },
                                { value: 'PERSON', label: t.personType },
                            ]}
                        />
                        <Input
                            label={t.nameLabel}
                            name="name"
                            value={formData.name || ''}
                            onChange={handleChange}
                            error={fieldErrors.name}
                            required
                        />
                        {formData.type === 'COMPANY' && (
                            <>
                                <Input
                                    label={t.companyLabel}
                                    name="company"
                                    value={formData.company || ''}
                                    onChange={handleChange}
                                />
                                <Input
                                    label={t.nipLabel}
                                    name="nip"
                                    value={formData.nip || ''}
                                    onChange={handleChange}
                                    error={fieldErrors.nip}
                                />
                            </>
                        )}
                        <div className="md:col-span-2 flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="isActive"
                                name="isActive"
                                checked={formData.isActive ?? true}
                                onChange={handleChange}
                                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                            />
                            <label htmlFor="isActive" className="text-sm text-muted-foreground">
                                {t.isActiveLabel}
                            </label>
                        </div>
                    </div>
                </div>

                <div className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-card">
                    <h2 className="text-lg font-semibold text-foreground mb-4">{t.contactInfo}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label={t.emailLabel}
                            name="email"
                            type="email"
                            value={formData.email || ''}
                            onChange={handleChange}
                            error={fieldErrors.email}
                        />
                        <Input
                            label={t.phoneLabel}
                            name="phone"
                            value={formData.phone || ''}
                            onChange={handleChange}
                        />
                        <Input
                            label={t.websiteLabel}
                            name="website"
                            value={formData.website || ''}
                            onChange={handleChange}
                            error={fieldErrors.website}
                        />
                    </div>
                </div>

                <div className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-card">
                    <h2 className="text-lg font-semibold text-foreground mb-4">{t.address}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <Input
                                label={t.streetLabel}
                                name="address"
                                value={formData.address || ''}
                                onChange={handleChange}
                            />
                        </div>
                        <Input
                            label={t.cityLabel}
                            name="city"
                            value={formData.city || ''}
                            onChange={handleChange}
                        />
                        <Input
                            label={t.postalCodeLabel}
                            name="postalCode"
                            value={formData.postalCode || ''}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-card">
                    <h2 className="text-lg font-semibold text-foreground mb-4">{t.notes}</h2>
                    <Textarea
                        name="notes"
                        value={formData.notes || ''}
                        onChange={handleChange}
                        rows={4}
                    />
                </div>

                <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        {t.cancel}
                    </Button>
                    <Button type="submit" isLoading={isLoading}>
                        {t.saveButton}
                    </Button>
                </div>
            </form>
        </div>
    );
}

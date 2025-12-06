// src/app/dashboard/followups/[id]/edit/page.tsx

'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useFollowUp } from '@/hooks/useFollowUps';
import { followUpsApi } from '@/lib/api';
import { useClients } from '@/hooks/useClients';
import { useOffers } from '@/hooks/useOffers';
import { useContracts } from '@/hooks/useContracts';
import { Button, Input, Select, Textarea, Card } from '@/components/ui';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { UpdateFollowUpData } from '@/types';

export default function EditFollowUpPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { followUp, loading: loadingFollowUp, error: fetchError } = useFollowUp(id);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<UpdateFollowUpData>({});
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    // Fetch related data for dropdowns - z domyślną wartością pustej tablicy
    const { clients = [] } = useClients({ limit: 100 });
    const { offers = [] } = useOffers({ limit: 100 });
    const { contracts = [] } = useContracts({ limit: 100 });

    // Populate form when follow-up is loaded
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
            errors.title = 'Tytuł musi mieć minimum 2 znaki';
        }

        if (!formData.dueDate) {
            errors.dueDate = 'Termin jest wymagany';
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

            // Only include changed fields
            if (formData.title) cleanData.title = formData.title;
            if (formData.type) cleanData.type = formData.type;
            if (formData.status) cleanData.status = formData.status;
            if (formData.priority) cleanData.priority = formData.priority;
            if (formData.dueDate) cleanData.dueDate = formData.dueDate;

            // Optional string fields - only include if has value
            if (formData.description) cleanData.description = formData.description;
            if (formData.notes) cleanData.notes = formData.notes;

            // Optional relation fields - only include if has value
            if (formData.clientId) cleanData.clientId = formData.clientId;
            if (formData.offerId) cleanData.offerId = formData.offerId;
            if (formData.contractId) cleanData.contractId = formData.contractId;

            await followUpsApi.update(id, cleanData);
            router.push(`/dashboard/followups/${id}`);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Wystąpił nieoczekiwany błąd');
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (loadingFollowUp) return <PageLoader />;

    if (fetchError || !followUp) {
        return (
            <div className="p-8">
                <Card>
                    <div className="text-center py-12">
                        <p className="text-red-600 mb-4">{fetchError || 'Nie znaleziono follow-upa'}</p>
                        <Button onClick={() => router.push('/dashboard/followups')}>
                            Wróć do listy
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Powrót
                </button>
                <h1 className="text-2xl font-bold text-slate-900">Edytuj follow-up</h1>
                <p className="text-slate-500 mt-1">Modyfikuj szczegóły zadania</p>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
                <Card className="mb-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Podstawowe informacje</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <Input
                                label="Tytuł"
                                name="title"
                                value={formData.title || ''}
                                onChange={handleChange}
                                error={fieldErrors.title}
                                required
                                placeholder="np. Zadzwonić do klienta"
                            />
                        </div>
                        <Select
                            label="Typ"
                            name="type"
                            value={formData.type || ''}
                            onChange={handleChange}
                            options={[
                                { value: 'CALL', label: '📞 Telefon' },
                                { value: 'EMAIL', label: '✉️ Email' },
                                { value: 'MEETING', label: '🤝 Spotkanie' },
                                { value: 'TASK', label: '✅ Zadanie' },
                                { value: 'REMINDER', label: '🔔 Przypomnienie' },
                                { value: 'OTHER', label: '📌 Inne' },
                            ]}
                        />
                        <Select
                            label="Status"
                            name="status"
                            value={formData.status || ''}
                            onChange={handleChange}
                            options={[
                                { value: 'PENDING', label: 'Oczekujące' },
                                { value: 'COMPLETED', label: 'Wykonane' },
                                { value: 'CANCELLED', label: 'Anulowane' },
                            ]}
                        />
                        <Select
                            label="Priorytet"
                            name="priority"
                            value={formData.priority || ''}
                            onChange={handleChange}
                            options={[
                                { value: 'LOW', label: 'Niski' },
                                { value: 'MEDIUM', label: 'Średni' },
                                { value: 'HIGH', label: 'Wysoki' },
                                { value: 'URGENT', label: 'Pilne' },
                            ]}
                        />
                        <Input
                            label="Termin"
                            name="dueDate"
                            type="date"
                            value={formData.dueDate || ''}
                            onChange={handleChange}
                            error={fieldErrors.dueDate}
                            required
                        />
                    </div>
                </Card>

                <Card className="mb-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Opis</h2>
                    <Textarea
                        name="description"
                        value={formData.description || ''}
                        onChange={handleChange}
                        placeholder="Szczegółowy opis zadania..."
                        rows={3}
                    />
                </Card>

                <Card className="mb-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Powiązania</h2>
                    <div className="grid grid-cols-1 gap-4">
                        <Select
                            label="Klient"
                            name="clientId"
                            value={formData.clientId || ''}
                            onChange={handleChange}
                            options={[
                                { value: '', label: 'Brak powiązania' },
                                ...clients.map((c) => ({ value: c.id, label: c.name })),
                            ]}
                        />
                        <Select
                            label="Oferta"
                            name="offerId"
                            value={formData.offerId || ''}
                            onChange={handleChange}
                            options={[
                                { value: '', label: 'Brak powiązania' },
                                ...offers.map((o) => ({ value: o.id, label: `${o.number} - ${o.title}` })),
                            ]}
                        />
                        <Select
                            label="Umowa"
                            name="contractId"
                            value={formData.contractId || ''}
                            onChange={handleChange}
                            options={[
                                { value: '', label: 'Brak powiązania' },
                                ...contracts.map((c) => ({ value: c.id, label: `${c.number} - ${c.title}` })),
                            ]}
                        />
                    </div>
                </Card>

                <Card className="mb-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Notatki</h2>
                    <Textarea
                        name="notes"
                        value={formData.notes || ''}
                        onChange={handleChange}
                        placeholder="Dodatkowe notatki..."
                        rows={3}
                    />
                </Card>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Anuluj
                    </Button>
                    <Button type="submit" isLoading={isLoading}>
                        Zapisz zmiany
                    </Button>
                </div>
            </form>
        </div>
    );
}
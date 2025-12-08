// src/app/dashboard/followups/new/page.tsx

'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { followUpsApi } from '@/lib/api';
import { useClients } from '@/hooks/useClients';
import { useOffers } from '@/hooks/useOffers';
import { useContracts } from '@/hooks/useContracts';
import { Button, Input, Select, Textarea, Card } from '@/components/ui';
import { CreateFollowUpData } from '@/types';

export default function NewFollowUpPage() {
    const router = useRouter();
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

    // Fetch related data for dropdowns - z domyślną wartością pustej tablicy
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
            errors.title = 'Tytuł musi mieć minimum 2 znaki';
        }

        if (!formData.dueDate) {
            errors.dueDate = 'Termin jest wymagany';
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

// W src/app/dashboard/followups/new/page.tsx
// Zmień handleSubmit:

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);
        setError(null);

        try {
            const cleanData: CreateFollowUpData = {
                // Required fields
                title: formData.title,
                type: formData.type,
                dueDate: new Date(formData.dueDate).toISOString(),

                // Optional fields - dodawane warunkowo
                ...(formData.priority && { priority: formData.priority }),
                ...(formData.description && { description: formData.description }),
                ...(formData.notes && { notes: formData.notes }),
                ...(formData.clientId && { clientId: formData.clientId }),
                ...(formData.offerId && { offerId: formData.offerId }),
                ...(formData.contractId && { contractId: formData.contractId }),
            };

            console.log('Sending data:', cleanData);

            await followUpsApi.create(cleanData);
            router.push('/dashboard/followups');
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
                <h1 className="text-2xl font-bold text-slate-900">Nowy follow-up</h1>
                <p className="text-slate-500 mt-1">Utwórz nowe zadanie lub przypomnienie</p>
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
                                value={formData.title}
                                onChange={handleChange}
                                error={fieldErrors.title}
                                required
                                placeholder="np. Zadzwonić do klienta"
                            />
                        </div>
                        <Select
                            label="Typ"
                            name="type"
                            value={formData.type}
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
                            label="Priorytet"
                            name="priority"
                            value={formData.priority}
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
                            value={formData.dueDate}
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
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Powiązania (opcjonalne)</h2>
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
                        Utwórz follow-up
                    </Button>
                </div>
            </form>
        </div>
    );
}
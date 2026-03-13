// src/app/dashboard/followups/new/page.tsx
'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { followUpsApi } from '@/lib/api';
import { useClients } from '@/hooks/useClients';
import { useOffers } from '@/hooks/useOffers';
import { useContracts } from '@/hooks/useContracts';
import { Button, Input, Select, Textarea, Card } from '@/components/ui';
import { CreateFollowUpData } from '@/types';

function NewFollowUpForm() {
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
                setError('Wystąpił nieoczekiwany błąd');
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
                    className="flex items-center gap-2 text-themed-muted hover:text-themed mb-4"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Powrót
                </button>
                <h1 className="text-2xl font-bold text-themed">Nowy follow-up</h1>
                <p className="text-themed-muted mt-1">Utwórz nowe zadanie lub przypomnienie</p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <Card className="mb-6">
                    <h2 className="text-lg font-semibold text-themed mb-4">Podstawowe informacje</h2>
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
                    <h2 className="text-lg font-semibold text-themed mb-4">Opis</h2>
                    <Textarea
                        name="description"
                        value={formData.description || ''}
                        onChange={handleChange}
                        placeholder="Szczegółowy opis zadania..."
                        rows={3}
                    />
                </Card>

                <Card className="mb-6">
                    <h2 className="text-lg font-semibold text-themed mb-4">Powiązania (opcjonalne)</h2>
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
                    <h2 className="text-lg font-semibold text-themed mb-4">Notatki</h2>
                    <Textarea
                        name="notes"
                        value={formData.notes || ''}
                        onChange={handleChange}
                        placeholder="Dodatkowe notatki..."
                        rows={3}
                    />
                </Card>

                <div className="flex flex-col sm:flex-row justify-end gap-3">
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

function NewFollowUpLoading() {
    return (
        <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
            <p className="mt-4 text-themed-muted">Ładowanie...</p>
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
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useClient } from '@/hooks/useClients';
import { clientsApi, ApiError } from '@/lib/api';
import { Button, Input, Select, Textarea, Card } from '@/components/ui';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { UpdateClientInput } from '@/types';

export default function EditClientPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { client, isLoading: isLoadingClient, error: clientError } = useClient(params.id);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
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
        setError(null);

        try {
            await clientsApi.update(params.id, formData);
            router.push(`/dashboard/clients/${params.id}`);
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.message);
            } else {
                setError('Wystąpił nieoczekiwany błąd');
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoadingClient) return <PageLoader />;

    if (clientError || !client) {
        return (
            <div className="p-8">
                <Card>
                    <div className="text-center py-12">
                        <p className="text-red-600 mb-4">{clientError || 'Nie znaleziono klienta'}</p>
                        <Button onClick={() => router.push('/dashboard/clients')}>
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
                <h1 className="text-2xl font-bold text-slate-900">Edytuj klienta</h1>
                <p className="text-slate-500 mt-1">{client.name}</p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <Card className="mb-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Podstawowe informacje</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                            label="Typ klienta"
                            name="type"
                            value={formData.type || 'COMPANY'}
                            onChange={handleChange}
                            options={[
                                { value: 'COMPANY', label: 'Firma' },
                                { value: 'PERSON', label: 'Osoba prywatna' },
                            ]}
                        />
                        <Input
                            label="Nazwa / Imię i nazwisko"
                            name="name"
                            value={formData.name || ''}
                            onChange={handleChange}
                            error={fieldErrors.name}
                            required
                        />
                        {formData.type === 'COMPANY' && (
                            <>
                                <Input
                                    label="Firma"
                                    name="company"
                                    value={formData.company || ''}
                                    onChange={handleChange}
                                />
                                <Input
                                    label="NIP"
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
                                className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                            />
                            <label htmlFor="isActive" className="text-sm text-slate-700">
                                Klient aktywny
                            </label>
                        </div>
                    </div>
                </Card>

                <Card className="mb-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Dane kontaktowe</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Email"
                            name="email"
                            type="email"
                            value={formData.email || ''}
                            onChange={handleChange}
                            error={fieldErrors.email}
                        />
                        <Input
                            label="Telefon"
                            name="phone"
                            value={formData.phone || ''}
                            onChange={handleChange}
                        />
                        <Input
                            label="Strona WWW"
                            name="website"
                            value={formData.website || ''}
                            onChange={handleChange}
                            error={fieldErrors.website}
                        />
                    </div>
                </Card>

                <Card className="mb-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Adres</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <Input
                                label="Ulica i numer"
                                name="address"
                                value={formData.address || ''}
                                onChange={handleChange}
                            />
                        </div>
                        <Input
                            label="Miasto"
                            name="city"
                            value={formData.city || ''}
                            onChange={handleChange}
                        />
                        <Input
                            label="Kod pocztowy"
                            name="postalCode"
                            value={formData.postalCode || ''}
                            onChange={handleChange}
                        />
                    </div>
                </Card>

                <Card className="mb-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Notatki</h2>
                    <Textarea
                        name="notes"
                        value={formData.notes || ''}
                        onChange={handleChange}
                        rows={4}
                    />
                </Card>

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
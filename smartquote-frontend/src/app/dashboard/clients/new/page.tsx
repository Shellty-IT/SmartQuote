'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { clientsApi } from '@/lib/api';
import { Button, Input, Select, Textarea, Card } from '@/components/ui';
import { CreateClientInput } from '@/types';

export default function NewClientPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<CreateClientInput>({
        type: 'COMPANY',
        name: '',
        email: '',
        phone: '',
        company: '',
        nip: '',
        address: '',
        city: '',
        postalCode: '',
        website: '',
        notes: '',
    });
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (fieldErrors[name]) {
            setFieldErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!formData.name || formData.name.length < 2) {
            errors.name = 'Nazwa musi mieć minimum 2 znaki';
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Nieprawidłowy format email';
        }

        if (formData.nip && !/^\d{10}$/.test(formData.nip)) {
            errors.nip = 'NIP musi mieć 10 cyfr';
        }

        if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
            errors.website = 'Nieprawidłowy format URL (musi zaczynać się od http:// lub https://)';
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
            // Tworzymy czysty obiekt z zachowaniem typu
            const cleanData: CreateClientInput = {
                type: formData.type,
                name: formData.name,
                ...(formData.email && { email: formData.email }),
                ...(formData.phone && { phone: formData.phone }),
                ...(formData.company && { company: formData.company }),
                ...(formData.nip && { nip: formData.nip }),
                ...(formData.address && { address: formData.address }),
                ...(formData.city && { city: formData.city }),
                ...(formData.postalCode && { postalCode: formData.postalCode }),
                ...(formData.website && { website: formData.website }),
                ...(formData.notes && { notes: formData.notes }),
            };

            await clientsApi.create(cleanData);
            router.push('/dashboard/clients');
        } catch (err) {
            // reszta kodu bez zmian
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
                <h1 className="text-2xl font-bold text-slate-900">Nowy klient</h1>
                <p className="text-slate-500 mt-1">Dodaj nowego klienta do swojej bazy</p>
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
                        <Select
                            label="Typ klienta"
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            options={[
                                { value: 'COMPANY', label: 'Firma' },
                                { value: 'PERSON', label: 'Osoba prywatna' },
                            ]}
                        />
                        <Input
                            label="Nazwa / Imię i nazwisko"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            error={fieldErrors.name}
                            required
                            placeholder="np. TechCorp Sp. z o.o. lub Jan Kowalski"
                        />
                        {formData.type === 'COMPANY' && (
                            <>
                                <Input
                                    label="Firma"
                                    name="company"
                                    value={formData.company || ''}
                                    onChange={handleChange}
                                    placeholder="Nazwa firmy"
                                />
                                <Input
                                    label="NIP"
                                    name="nip"
                                    value={formData.nip || ''}
                                    onChange={handleChange}
                                    error={fieldErrors.nip}
                                    placeholder="1234567890"
                                />
                            </>
                        )}
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
                            placeholder="kontakt@firma.pl"
                        />
                        <Input
                            label="Telefon"
                            name="phone"
                            value={formData.phone || ''}
                            onChange={handleChange}
                            placeholder="+48 123 456 789"
                        />
                        <Input
                            label="Strona WWW"
                            name="website"
                            value={formData.website || ''}
                            onChange={handleChange}
                            error={fieldErrors.website}
                            placeholder="https://www.firma.pl"
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
                                placeholder="ul. Przykładowa 123"
                            />
                        </div>
                        <Input
                            label="Miasto"
                            name="city"
                            value={formData.city || ''}
                            onChange={handleChange}
                            placeholder="Warszawa"
                        />
                        <Input
                            label="Kod pocztowy"
                            name="postalCode"
                            value={formData.postalCode || ''}
                            onChange={handleChange}
                            placeholder="00-001"
                        />
                    </div>
                </Card>

                <Card className="mb-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Notatki</h2>
                    <Textarea
                        name="notes"
                        value={formData.notes || ''}
                        onChange={handleChange}
                        placeholder="Dodatkowe informacje o kliencie..."
                        rows={4}
                    />
                </Card>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Anuluj
                    </Button>
                    <Button type="submit" isLoading={isLoading}>
                        Dodaj klienta
                    </Button>
                </div>
            </form>
        </div>
    );
}
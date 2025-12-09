// SmartQuote-AI/src/app/dashboard/contracts/new/page.tsx

'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useContracts } from '@/hooks/useContracts';
import { useClients } from '@/hooks/useClients';
import { Button, Card, Input, Select, Textarea, LoadingSpinner } from '@/components/ui';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Client } from '@/types';

function NewContractForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const fromOfferId = searchParams.get('fromOffer');

    const { createContract, createFromOffer } = useContracts();
    const { clients, isLoading: clientsLoading } = useClients({ limit: 100 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Ref do śledzenia czy już próbowaliśmy utworzyć umowę z oferty
    const createFromOfferAttempted = useRef(false);

    // Formularz do ręcznego tworzenia umowy
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

    // Jeśli jest fromOffer, automatycznie tworzymy umowę z oferty
    useEffect(() => {
        if (fromOfferId && !createFromOfferAttempted.current) {
            createFromOfferAttempted.current = true;

            const handleCreateFromOffer = async () => {
                setLoading(true);
                setError(null);

                const response = await createFromOffer(fromOfferId);

                if (response.success && response.data) {
                    router.push(`/dashboard/contracts/${response.data.id}`);
                } else {
                    setError('Nie udało się utworzyć umowy z oferty');
                    setLoading(false);
                }
            };

            handleCreateFromOffer();
        }
    }, [fromOfferId, createFromOffer, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

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
            router.push(`/dashboard/contracts/${response.data.id}`);
        } else {
            setError('Nie udało się utworzyć umowy');
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
                <p className="mt-4 text-gray-500">Tworzenie umowy z oferty...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center space-x-4">
                <Link href="/dashboard/contracts">
                    <Button variant="ghost" size="sm">
                        <ArrowLeftIcon className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Nowa umowa</h1>
                    <p className="text-gray-500">Utwórz nową umowę</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4">Informacje podstawowe</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Tytuł umowy *"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            required
                        />
                        <Select
                            label="Klient *"
                            value={formData.clientId}
                            onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                            required
                            placeholder="Wybierz klienta"
                            options={clients.map((client: Client) => ({
                                value: client.id,
                                label: client.company ? `${client.name} (${client.company})` : client.name
                            }))}
                        />
                        <Input
                            type="date"
                            label="Data rozpoczęcia"
                            value={formData.startDate}
                            onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                        />
                        <Input
                            type="date"
                            label="Data zakończenia"
                            value={formData.endDate}
                            onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                        />
                        <Input
                            type="number"
                            label="Termin płatności (dni)"
                            value={formData.paymentDays}
                            onChange={(e) => setFormData(prev => ({ ...prev, paymentDays: parseInt(e.target.value) || 14 }))}
                        />
                    </div>
                    <div className="mt-4">
                        <Textarea
                            label="Opis"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            rows={3}
                        />
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">Pozycje umowy</h2>
                        <Button type="button" variant="outline" size="sm" onClick={addItem}>
                            + Dodaj pozycję
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {formData.items.map((item, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4">
                                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                                    <div className="md:col-span-2">
                                        <Input
                                            label="Nazwa *"
                                            value={item.name}
                                            onChange={(e) => updateItem(index, 'name', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <Input
                                        type="number"
                                        label="Ilość"
                                        value={item.quantity}
                                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                        step="0.001"
                                        min="0"
                                    />
                                    <Input
                                        label="Jednostka"
                                        value={item.unit}
                                        onChange={(e) => updateItem(index, 'unit', e.target.value)}
                                    />
                                    <Input
                                        type="number"
                                        label="Cena netto"
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
                                        >
                                            Usuń
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4">Warunki</h2>
                    <div className="space-y-4">
                        <Textarea
                            label="Warunki umowy"
                            value={formData.terms}
                            onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
                            rows={4}
                        />
                        <Textarea
                            label="Notatki wewnętrzne"
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            rows={3}
                        />
                    </div>
                </Card>

                <div className="flex justify-end space-x-4">
                    <Link href="/dashboard/contracts">
                        <Button type="button" variant="outline">
                            Anuluj
                        </Button>
                    </Link>
                    <Button type="submit" disabled={loading}>
                        {loading ? 'Tworzenie...' : 'Utwórz umowę'}
                    </Button>
                </div>
            </form>
        </div>
    );
}

// Komponent ładowania
function NewContractLoading() {
    return (
        <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-500">Ładowanie...</p>
        </div>
    );
}

// Główny eksport strony z Suspense
export default function NewContractPage() {
    return (
        <Suspense fallback={<NewContractLoading />}>
            <NewContractForm />
        </Suspense>
    );
}
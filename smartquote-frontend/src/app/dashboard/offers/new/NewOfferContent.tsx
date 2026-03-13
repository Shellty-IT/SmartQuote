// src/app/dashboard/offers/new/NewOfferContent.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useClients } from '@/hooks/useClients';
import { offersApi, ApiError } from '@/lib/api';
import { Button, Input, Select, Textarea, Card } from '@/components/ui';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatCurrency, getInitials } from '@/lib/utils';
import { CreateOfferInput, CreateOfferItemInput, Client } from '@/types';
import AIPriceInsight from '@/components/ai/AIPriceInsight';

type Step = 'client' | 'details' | 'items' | 'summary';

const STEPS: { id: Step; label: string }[] = [
    { id: 'client', label: 'Klient' },
    { id: 'details', label: 'Szczegóły' },
    { id: 'items', label: 'Pozycje' },
    { id: 'summary', label: 'Podsumowanie' },
];

const VAT_RATES = [
    { value: '23', label: '23%' },
    { value: '8', label: '8%' },
    { value: '5', label: '5%' },
    { value: '0', label: '0%' },
];

const UNITS = [
    { value: 'szt.', label: 'szt.' },
    { value: 'godz.', label: 'godz.' },
    { value: 'dni', label: 'dni' },
    { value: 'kg', label: 'kg' },
    { value: 'm', label: 'm' },
    { value: 'm²', label: 'm²' },
    { value: 'kpl.', label: 'kpl.' },
    { value: 'usł.', label: 'usł.' },
];

interface ExtendedOfferItem extends CreateOfferItemInput {
    isOptional: boolean;
    minQuantity: number;
    maxQuantity: number;
}

const emptyItem: ExtendedOfferItem = {
    name: '',
    description: '',
    quantity: 1,
    unit: 'szt.',
    unitPrice: 0,
    vatRate: 23,
    discount: 0,
    isOptional: false,
    minQuantity: 1,
    maxQuantity: 100,
};

export default function NewOfferContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const preselectedClientId = searchParams.get('clientId');

    const { clients, isLoading: isLoadingClients } = useClients({ limit: 100 });

    const [currentStep, setCurrentStep] = useState<Step>('client');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [clientSearch, setClientSearch] = useState('');
    const [offerDetails, setOfferDetails] = useState({
        title: '',
        description: '',
        validUntil: '',
        notes: '',
        terms: 'Płatność przelewem w ciągu 14 dni od wystawienia faktury.',
        paymentDays: 14,
    });
    const [items, setItems] = useState<ExtendedOfferItem[]>([{ ...emptyItem }]);

    useEffect(() => {
        if (preselectedClientId && clients.length > 0) {
            const client = clients.find((c) => c.id === preselectedClientId);
            if (client) {
                setSelectedClient(client);
                setCurrentStep('details');
            }
        }
    }, [preselectedClientId, clients]);

    const calculateItemTotal = (item: ExtendedOfferItem) => {
        const quantity = item.quantity || 0;
        const unitPrice = item.unitPrice || 0;
        const discount = item.discount || 0;
        const vatRate = item.vatRate || 23;

        const discountMultiplier = 1 - discount / 100;
        const totalNet = quantity * unitPrice * discountMultiplier;
        const totalVat = totalNet * (vatRate / 100);
        const totalGross = totalNet + totalVat;

        return { totalNet, totalVat, totalGross };
    };

    const totals = items.reduce(
        (acc, item) => {
            const itemTotals = calculateItemTotal(item);
            return {
                totalNet: acc.totalNet + itemTotals.totalNet,
                totalVat: acc.totalVat + itemTotals.totalVat,
                totalGross: acc.totalGross + itemTotals.totalGross,
            };
        },
        { totalNet: 0, totalVat: 0, totalGross: 0 }
    );

    const filteredClients = clients.filter(
        (client) =>
            client.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
            client.email?.toLowerCase().includes(clientSearch.toLowerCase()) ||
            client.company?.toLowerCase().includes(clientSearch.toLowerCase())
    );

    const goToStep = (step: Step) => setCurrentStep(step);

    const goNext = () => {
        const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
        if (currentIndex < STEPS.length - 1) {
            setCurrentStep(STEPS[currentIndex + 1].id);
        }
    };

    const goBack = () => {
        const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
        if (currentIndex > 0) {
            setCurrentStep(STEPS[currentIndex - 1].id);
        }
    };

    const addItem = () => setItems([...items, { ...emptyItem }]);

    const removeItem = (index: number) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const updateItem = (index: number, field: keyof ExtendedOfferItem, value: string | number | boolean) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const canProceed = () => {
        switch (currentStep) {
            case 'client':
                return selectedClient !== null;
            case 'details':
                return offerDetails.title.length >= 3;
            case 'items':
                return items.every((item) => item.name && item.quantity > 0 && item.unitPrice >= 0);
            default:
                return true;
        }
    };

    const handleSubmit = async () => {
        if (!selectedClient) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const data: CreateOfferInput = {
                clientId: selectedClient.id,
                title: offerDetails.title,
                description: offerDetails.description || undefined,
                validUntil: offerDetails.validUntil || undefined,
                notes: offerDetails.notes || undefined,
                terms: offerDetails.terms || undefined,
                paymentDays: offerDetails.paymentDays,
                items: items.map((item) => ({
                    name: item.name,
                    description: item.description || undefined,
                    quantity: item.quantity,
                    unit: item.unit,
                    unitPrice: item.unitPrice,
                    vatRate: item.vatRate,
                    discount: item.discount,
                    isOptional: item.isOptional,
                    minQuantity: item.isOptional ? item.minQuantity : undefined,
                    maxQuantity: item.isOptional ? item.maxQuantity : undefined,
                })),
            };

            const response = await offersApi.create(data);
            if (response.data?.id) {
                router.push(`/dashboard/offers/${response.data.id}`);
            } else {
                throw new Error('Nie udało się utworzyć oferty');
            }
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.message);
            } else {
                setError('Wystąpił nieoczekiwany błąd');
            }
            setIsSubmitting(false);
        }
    };

    if (isLoadingClients && clients.length === 0) {
        return <PageLoader />;
    }

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-themed-muted hover:opacity-70 mb-4"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Powrót
                </button>
                <h1 className="text-2xl font-bold text-themed">Nowa oferta</h1>
                <p className="text-themed-muted mt-1">Utwórz nową ofertę handlową</p>
            </div>

            <div className="mb-8">
                <div className="flex items-center justify-between">
                    {STEPS.map((step, index) => {
                        const isActive = step.id === currentStep;
                        const isPast = STEPS.findIndex((s) => s.id === currentStep) > index;

                        return (
                            <div key={step.id} className="flex items-center flex-1">
                                <button
                                    onClick={() => isPast && goToStep(step.id)}
                                    disabled={!isPast}
                                    className={`flex items-center gap-2 ${isPast ? 'cursor-pointer' : 'cursor-default'}`}
                                >
                                    <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                                            isActive
                                                ? 'bg-cyan-500 text-white'
                                                : isPast
                                                    ? 'bg-emerald-500 text-white'
                                                    : 'section-themed text-themed-muted'
                                        }`}
                                    >
                                        {isPast ? (
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : (
                                            index + 1
                                        )}
                                    </div>
                                    <span
                                        className={`text-sm font-medium hidden sm:block ${
                                            isActive ? 'text-cyan-600' : isPast ? 'text-emerald-600' : 'text-themed-muted'
                                        }`}
                                    >
                                    {step.label}
                                </span>
                                </button>
                                {index < STEPS.length - 1 && (
                                    <div className={`flex-1 h-0.5 mx-4 ${isPast ? 'bg-emerald-500' : 'section-themed'}`} />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/25 rounded-lg text-red-600">
                    {error}
                </div>
            )}

            <Card className="mb-6">
                {currentStep === 'client' && (
                    <div>
                        <h2 className="text-lg font-semibold text-themed mb-4">Wybierz klienta</h2>
                        <Input
                            placeholder="Szukaj klienta..."
                            value={clientSearch}
                            onChange={(e) => setClientSearch(e.target.value)}
                            className="mb-4"
                            icon={
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            }
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                            {filteredClients.map((client) => (
                                <button
                                    key={client.id}
                                    onClick={() => setSelectedClient(client)}
                                    className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                                        selectedClient?.id === client.id
                                            ? 'border-cyan-500 bg-cyan-500/10'
                                            : 'card-themed border hover-themed'
                                    }`}
                                >
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                                        {getInitials(client.name)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-themed truncate">{client.name}</p>
                                        <p className="text-sm text-themed-muted truncate">
                                            {client.email || client.phone || 'Brak kontaktu'}
                                        </p>
                                    </div>
                                    {selectedClient?.id === client.id && (
                                        <svg className="w-5 h-5 text-cyan-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </button>
                            ))}
                        </div>
                        {filteredClients.length === 0 && (
                            <div className="text-center py-8">
                                <p className="text-themed-muted mb-4">Nie znaleziono klientów</p>
                                <Button variant="outline" onClick={() => router.push('/dashboard/clients/new')}>
                                    Dodaj nowego klienta
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {currentStep === 'details' && (
                    <div>
                        <h2 className="text-lg font-semibold text-themed mb-4">Szczegóły oferty</h2>
                        <div className="space-y-4">
                            <Input
                                label="Tytuł oferty"
                                value={offerDetails.title}
                                onChange={(e) => setOfferDetails({ ...offerDetails, title: e.target.value })}
                                placeholder="np. System CRM dla firmy X"
                                required
                            />
                            <Textarea
                                label="Opis"
                                value={offerDetails.description}
                                onChange={(e) => setOfferDetails({ ...offerDetails, description: e.target.value })}
                                placeholder="Krótki opis zakresu oferty..."
                                rows={3}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Ważna do"
                                    type="date"
                                    value={offerDetails.validUntil}
                                    onChange={(e) => setOfferDetails({ ...offerDetails, validUntil: e.target.value })}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                                <Input
                                    label="Termin płatności (dni)"
                                    type="number"
                                    value={offerDetails.paymentDays}
                                    onChange={(e) => setOfferDetails({ ...offerDetails, paymentDays: parseInt(e.target.value) || 14 })}
                                    min={0}
                                    max={365}
                                />
                            </div>
                            <Textarea
                                label="Warunki płatności"
                                value={offerDetails.terms}
                                onChange={(e) => setOfferDetails({ ...offerDetails, terms: e.target.value })}
                                rows={2}
                            />
                            <Textarea
                                label="Notatki wewnętrzne"
                                value={offerDetails.notes}
                                onChange={(e) => setOfferDetails({ ...offerDetails, notes: e.target.value })}
                                placeholder="Notatki widoczne tylko dla Ciebie..."
                                rows={2}
                            />
                        </div>
                    </div>
                )}

                {currentStep === 'items' && (
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-themed">Pozycje oferty</h2>
                            <Button variant="outline" size="sm" onClick={addItem}>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Dodaj pozycję
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {items.map((item, index) => {
                                const itemTotals = calculateItemTotal(item);

                                return (
                                    <div key={index} className="p-4 section-themed rounded-xl space-y-4">
                                        <div className="flex items-start justify-between">
                                        <span className="text-sm font-medium text-themed-muted">
                                            Pozycja {index + 1}
                                        </span>
                                            {items.length > 1 && (
                                                <button
                                                    onClick={() => removeItem(index)}
                                                    className="p-1 text-themed-muted hover:text-red-500 transition-colors"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2">
                                                <Input
                                                    label="Nazwa"
                                                    value={item.name}
                                                    onChange={(e) => updateItem(index, 'name', e.target.value)}
                                                    placeholder="np. Wdrożenie systemu CRM"
                                                    required
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <Textarea
                                                    label="Opis (opcjonalnie)"
                                                    value={item.description || ''}
                                                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                                                    rows={2}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                            <Input
                                                label="Ilość"
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                                min={0}
                                                step="0.01"
                                            />
                                            <Select
                                                label="Jednostka"
                                                value={item.unit || 'szt.'}
                                                onChange={(e) => updateItem(index, 'unit', e.target.value)}
                                                options={UNITS}
                                            />
                                            <Input
                                                label="Cena netto"
                                                type="number"
                                                value={item.unitPrice}
                                                onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                min={0}
                                                step="0.01"
                                            />
                                            <Select
                                                label="VAT"
                                                value={String(item.vatRate || 23)}
                                                onChange={(e) => updateItem(index, 'vatRate', parseInt(e.target.value))}
                                                options={VAT_RATES}
                                            />
                                            <Input
                                                label="Rabat %"
                                                type="number"
                                                value={item.discount || 0}
                                                onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value) || 0)}
                                                min={0}
                                                max={100}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <AIPriceInsight
                                                itemName={item.name}
                                                currentPrice={item.unitPrice}
                                                onPriceSelect={(price) => updateItem(index, 'unitPrice', price)}
                                            />
                                        </div>

                                        <div className="p-3 card-themed border rounded-lg">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={item.isOptional}
                                                    onChange={(e) => updateItem(index, 'isOptional', e.target.checked)}
                                                    className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                                                />
                                                <div>
                                                <span className="text-sm font-medium text-themed">
                                                    Pozycja opcjonalna
                                                </span>
                                                    <p className="text-xs text-themed-muted">
                                                        Klient może odznaczyć tę pozycję lub zmienić ilość
                                                    </p>
                                                </div>
                                            </label>

                                            {item.isOptional && (
                                                <div className="flex gap-4 mt-3 pl-7">
                                                    <Input
                                                        label="Min. ilość"
                                                        type="number"
                                                        value={item.minQuantity}
                                                        onChange={(e) => updateItem(index, 'minQuantity', parseInt(e.target.value) || 1)}
                                                        min={1}
                                                        className="w-32"
                                                    />
                                                    <Input
                                                        label="Max. ilość"
                                                        type="number"
                                                        value={item.maxQuantity}
                                                        onChange={(e) => updateItem(index, 'maxQuantity', parseInt(e.target.value) || 100)}
                                                        min={1}
                                                        className="w-32"
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex justify-end gap-4 pt-2 border-t divider-themed">
                                        <span className="text-sm text-themed-muted">
                                            Netto: <strong>{formatCurrency(itemTotals.totalNet)}</strong>
                                        </span>
                                            <span className="text-sm text-themed-muted">
                                            VAT: <strong>{formatCurrency(itemTotals.totalVat)}</strong>
                                        </span>
                                            <span className="text-sm text-themed">
                                            Brutto: <strong>{formatCurrency(itemTotals.totalGross)}</strong>
                                        </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-6 p-4 bg-slate-900 rounded-xl text-white">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">Suma netto:</span>
                                <span className="text-lg font-semibold">{formatCurrency(totals.totalNet)}</span>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-slate-400">VAT:</span>
                                <span className="text-lg font-semibold">{formatCurrency(totals.totalVat)}</span>
                            </div>
                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-700">
                                <span className="text-slate-200">Suma brutto:</span>
                                <span className="text-2xl font-bold text-cyan-400">{formatCurrency(totals.totalGross)}</span>
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === 'summary' && selectedClient && (
                    <div>
                        <h2 className="text-lg font-semibold text-themed mb-6">Podsumowanie oferty</h2>
                        <div className="space-y-6">
                            <div className="p-4 section-themed rounded-xl">
                                <h3 className="text-sm font-medium text-themed-muted mb-2">Klient</h3>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white text-sm font-semibold">
                                        {getInitials(selectedClient.name)}
                                    </div>
                                    <div>
                                        <p className="font-medium text-themed">{selectedClient.name}</p>
                                        <p className="text-sm text-themed-muted">{selectedClient.email}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 section-themed rounded-xl">
                                <h3 className="text-sm font-medium text-themed-muted mb-2">Szczegóły</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-themed-muted">Tytuł</p>
                                        <p className="text-themed">{offerDetails.title}</p>
                                    </div>
                                    {offerDetails.validUntil && (
                                        <div>
                                            <p className="text-sm text-themed-muted">Ważna do</p>
                                            <p className="text-themed">{offerDetails.validUntil}</p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm text-themed-muted">Termin płatności</p>
                                        <p className="text-themed">{offerDetails.paymentDays} dni</p>
                                    </div>
                                </div>
                                {offerDetails.description && (
                                    <div className="mt-4">
                                        <p className="text-sm text-themed-muted">Opis</p>
                                        <p className="text-themed">{offerDetails.description}</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 section-themed rounded-xl">
                                <h3 className="text-sm font-medium text-themed-muted mb-2">Pozycje ({items.length})</h3>
                                <div className="space-y-2">
                                    {items.map((item, index) => {
                                        const itemTotals = calculateItemTotal(item);
                                        return (
                                            <div key={index} className="flex justify-between items-center py-2 border-b divider-themed last:border-0">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-themed">{item.name}</p>
                                                        {item.isOptional && (
                                                            <span className="text-xs px-1.5 py-0.5 rounded-full badge-info font-medium">
                                                            Opcjonalna
                                                        </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-themed-muted">
                                                        {item.quantity} {item.unit} × {formatCurrency(item.unitPrice)}
                                                        {item.discount ? ` (-${item.discount}%)` : ''}
                                                    </p>
                                                </div>
                                                <p className="font-semibold text-themed">
                                                    {formatCurrency(itemTotals.totalGross)}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="p-4 bg-slate-900 rounded-xl text-white">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Suma netto:</span>
                                    <span className="text-lg font-semibold">{formatCurrency(totals.totalNet)}</span>
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-slate-400">VAT:</span>
                                    <span className="text-lg font-semibold">{formatCurrency(totals.totalVat)}</span>
                                </div>
                                <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-700">
                                    <span className="text-slate-200">Suma brutto:</span>
                                    <span className="text-2xl font-bold text-cyan-400">{formatCurrency(totals.totalGross)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Card>

            <div className="flex justify-between">
                <Button
                    variant="outline"
                    onClick={currentStep === 'client' ? () => router.back() : goBack}
                >
                    {currentStep === 'client' ? 'Anuluj' : 'Wstecz'}
                </Button>

                <div className="flex gap-3">
                    {currentStep === 'summary' ? (
                        <Button onClick={handleSubmit} isLoading={isSubmitting}>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Utwórz ofertę
                        </Button>
                    ) : (
                        <Button onClick={goNext} disabled={!canProceed()}>
                            Dalej
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
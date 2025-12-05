'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOffer } from '@/hooks/useOffers';
import { useClients } from '@/hooks/useClients';
import { offersApi, ApiError } from '@/lib/api';
import { Button, Input, Select, Textarea, Card } from '@/components/ui';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatCurrency, getInitials } from '@/lib/utils';
import { UpdateOfferInput, CreateOfferItemInput, Client } from '@/types';

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

type ItemFieldValue = string | number | undefined | null;

export default function EditOfferPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { offer, isLoading: isLoadingOffer, error: offerError } = useOffer(params.id);
    const { clients } = useClients({ limit: 100 });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [offerDetails, setOfferDetails] = useState({
        title: '',
        description: '',
        validUntil: '',
        notes: '',
        terms: '',
        paymentDays: 14,
    });
    const [items, setItems] = useState<CreateOfferItemInput[]>([]);

    // Populate form when offer loads
    useEffect(() => {
        if (offer) {
            setOfferDetails({
                title: offer.title,
                description: offer.description || '',
                validUntil: offer.validUntil ? offer.validUntil.split('T')[0] : '',
                notes: offer.notes || '',
                terms: offer.terms || '',
                paymentDays: offer.paymentDays,
            });

            setItems(
                offer.items.map((item) => ({
                    name: item.name,
                    description: item.description || '',
                    quantity: Number(item.quantity),
                    unit: item.unit,
                    unitPrice: Number(item.unitPrice),
                    vatRate: Number(item.vatRate),
                    discount: Number(item.discount),
                }))
            );

            if (offer.client) {
                setSelectedClient(offer.client);
            }
        }
    }, [offer]);

    // Update selected client when clients load
    useEffect(() => {
        if (offer && clients.length > 0 && !selectedClient) {
            // ✅ FIX 1: Zmieniono offer.clientId na offer.client.id
            const client = clients.find((c) => c.id === offer.client?.id);
            if (client) setSelectedClient(client);
        }
    }, [offer, clients, selectedClient]);

    // Calculate totals
    const calculateItemTotal = (item: CreateOfferItemInput) => {
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

    // Item management
    const addItem = () => {
        setItems([
            ...items,
            {
                name: '',
                description: '',
                quantity: 1,
                unit: 'szt.',
                unitPrice: 0,
                vatRate: 23,
                discount: 0,
            },
        ]);
    };

    const removeItem = (index: number) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    // ✅ FIX 2: Zmieniono typ 'any' na 'ItemFieldValue'
    const updateItem = (index: number, field: keyof CreateOfferItemInput, value: ItemFieldValue) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    // Submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedClient || !offer) return;

        setIsLoading(true);
        setError(null);

        try {
            const data: UpdateOfferInput = {
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
                })),
            };

            await offersApi.update(offer.id, data);
            router.push(`/dashboard/offers/${offer.id}`);
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

    if (isLoadingOffer) return <PageLoader />;

    if (offerError || !offer) {
        return (
            <div className="p-8">
                <Card>
                    <div className="text-center py-12">
                        <p className="text-red-600 mb-4">{offerError || 'Nie znaleziono oferty'}</p>
                        <Button onClick={() => router.push('/dashboard/offers')}>
                            Wróć do listy
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
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
                <h1 className="text-2xl font-bold text-slate-900">Edytuj ofertę</h1>
                <p className="text-slate-500 mt-1">{offer.number}</p>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Client */}
                <Card className="mb-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Klient</h2>
                    {selectedClient && (
                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white text-sm font-semibold">
                                {getInitials(selectedClient.name)}
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-slate-900">{selectedClient.name}</p>
                                <p className="text-sm text-slate-500">{selectedClient.email}</p>
                            </div>
                            <Select
                                value={selectedClient.id}
                                onChange={(e) => {
                                    const client = clients.find((c) => c.id === e.target.value);
                                    if (client) setSelectedClient(client);
                                }}
                                options={clients.map((c) => ({ value: c.id, label: c.name }))}
                                className="w-64"
                            />
                        </div>
                    )}
                </Card>

                {/* Details */}
                <Card className="mb-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Szczegóły oferty</h2>

                    <div className="space-y-4">
                        <Input
                            label="Tytuł oferty"
                            value={offerDetails.title}
                            onChange={(e) => setOfferDetails({ ...offerDetails, title: e.target.value })}
                            required
                        />

                        <Textarea
                            label="Opis"
                            value={offerDetails.description}
                            onChange={(e) => setOfferDetails({ ...offerDetails, description: e.target.value })}
                            rows={3}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Ważna do"
                                type="date"
                                value={offerDetails.validUntil}
                                onChange={(e) => setOfferDetails({ ...offerDetails, validUntil: e.target.value })}
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
                            rows={2}
                        />
                    </div>
                </Card>

                {/* Items */}
                <Card className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-slate-900">Pozycje oferty</h2>
                        <Button variant="outline" size="sm" type="button" onClick={addItem}>
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
                                <div key={index} className="p-4 bg-slate-50 rounded-xl space-y-4">
                                    <div className="flex items-start justify-between">
                                        <span className="text-sm font-medium text-slate-500">
                                            Pozycja {index + 1}
                                        </span>
                                        {items.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeItem(index)}
                                                className="p-1 text-slate-400 hover:text-red-500 transition-colors"
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

                                    {/* ✅ FIX 3: Upewnij się że JSX jest poprawny */}
                                    <div className="flex justify-end gap-4 pt-2 border-t border-slate-200">
                                        <span className="text-sm text-slate-500">
                                            Netto: <strong>{formatCurrency(itemTotals.totalNet)}</strong>
                                        </span>
                                        <span className="text-sm text-slate-500">
                                            VAT: <strong>{formatCurrency(itemTotals.totalVat)}</strong>
                                        </span>
                                        <span className="text-sm text-slate-900">
                                            Brutto: <strong>{formatCurrency(itemTotals.totalGross)}</strong>
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Totals */}
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
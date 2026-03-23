// src/app/dashboard/offers/[id]/edit/page.tsx
'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useOffer } from '@/hooks/useOffers';
import { useClients } from '@/hooks/useClients';
import { offersApi, ApiError } from '@/lib/api';
import { Button, Input, Select, Textarea, Card } from '@/components/ui';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatCurrency, getInitials } from '@/lib/utils';
import { UpdateOfferInput, CreateOfferItemInput, Client } from '@/types';
import AIPriceInsight from '@/components/ai/AIPriceInsight';
import { useToast } from '@/contexts/ToastContext';

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

interface ExtendedEditItem extends CreateOfferItemInput {
    isOptional: boolean;
    minQuantity: number;
    maxQuantity: number;
    variantName: string;
}

type ItemFieldValue = string | number | boolean | undefined | null;

function getUniqueVariants(items: ExtendedEditItem[]): string[] {
    const variants = items
        .map((i) => i.variantName.trim())
        .filter((v) => v.length > 0);
    return [...new Set(variants)];
}

export default function EditOfferPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const toast = useToast();
    const { offer, isLoading: isLoadingOffer, error: offerError } = useOffer(id);
    const { clients } = useClients({ limit: 100 });

    const [isLoading, setIsLoading] = useState(false);

    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [offerDetails, setOfferDetails] = useState({
        title: '',
        description: '',
        validUntil: '',
        notes: '',
        terms: '',
        paymentDays: 14,
        requireAuditTrail: false,
    });
    const [items, setItems] = useState<ExtendedEditItem[]>([]);

    useEffect(() => {
        if (offer) {
            setOfferDetails({
                title: offer.title,
                description: offer.description || '',
                validUntil: offer.validUntil ? offer.validUntil.split('T')[0] : '',
                notes: offer.notes || '',
                terms: offer.terms || '',
                paymentDays: offer.paymentDays,
                requireAuditTrail: offer.requireAuditTrail || false,
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
                    isOptional: item.isOptional || false,
                    minQuantity: item.minQuantity || 1,
                    maxQuantity: item.maxQuantity || 100,
                    variantName: item.variantName || '',
                }))
            );

            if (offer.client) {
                setSelectedClient(offer.client);
            }
        }
    }, [offer]);

    useEffect(() => {
        if (offer && clients.length > 0 && !selectedClient) {
            const client = clients.find((c) => c.id === offer.client?.id);
            if (client) setSelectedClient(client);
        }
    }, [offer, clients, selectedClient]);

    const calculateItemTotal = (item: ExtendedEditItem) => {
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
                isOptional: false,
                minQuantity: 1,
                maxQuantity: 100,
                variantName: '',
            },
        ]);
    };

    const removeItem = (index: number) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const updateItem = (index: number, field: keyof ExtendedEditItem, value: ItemFieldValue) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const uniqueVariants = getUniqueVariants(items);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedClient || !offer) return;

        setIsLoading(true);

        try {
            const data: UpdateOfferInput = {
                clientId: selectedClient.id,
                title: offerDetails.title,
                description: offerDetails.description || undefined,
                validUntil: offerDetails.validUntil || undefined,
                notes: offerDetails.notes || undefined,
                terms: offerDetails.terms || undefined,
                paymentDays: offerDetails.paymentDays,
                requireAuditTrail: offerDetails.requireAuditTrail,
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
                    variantName: item.variantName.trim() || undefined,
                })),
            };

            await offersApi.update(offer.id, data);
            toast.success('Oferta zaktualizowana', 'Zmiany zostały zapisane pomyślnie');
            router.push(`/dashboard/offers/${offer.id}`);
        } catch (err) {
            if (err instanceof ApiError) {
                toast.error('Błąd zapisu', err.message);
            } else {
                toast.error('Błąd zapisu', 'Wystąpił nieoczekiwany błąd');
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoadingOffer) return <PageLoader />;

    if (offerError || !offer) {
        return (
            <div className="p-4 md:p-8">
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
                <h1 className="text-2xl font-bold text-themed">Edytuj ofertę</h1>
                <p className="text-themed-muted mt-1">{offer.number}</p>
            </div>

            <form onSubmit={handleSubmit}>
                <Card className="mb-6">
                    <h2 className="text-lg font-semibold text-themed mb-4">Klient</h2>
                    {selectedClient && (
                        <div className="flex items-center gap-3 p-4 section-themed rounded-xl">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white text-sm font-semibold">
                                {getInitials(selectedClient.name)}
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-themed">{selectedClient.name}</p>
                                <p className="text-sm text-themed-muted">{selectedClient.email}</p>
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

                <Card className="mb-6">
                    <h2 className="text-lg font-semibold text-themed mb-4">Szczegóły oferty</h2>

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

                        <div className="p-4 card-themed border rounded-xl">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={offerDetails.requireAuditTrail}
                                    onChange={(e) => setOfferDetails({ ...offerDetails, requireAuditTrail: e.target.checked })}
                                    className="mt-0.5 w-5 h-5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                                />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                        <span className="text-sm font-medium text-themed">
                                            Formalne potwierdzenie akceptacji
                                        </span>
                                    </div>
                                    <p className="text-xs text-themed-muted mt-1">
                                        Przy akceptacji zostanie zapisany adres IP, przeglądarka oraz wygenerowany
                                        cyfrowy odcisk treści (SHA-256). Klient otrzyma email z potwierdzeniem i hashem.
                                        PDF będzie zawierał certyfikat akceptacji.
                                    </p>
                                </div>
                            </label>
                        </div>
                    </div>
                </Card>

                <Card className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-themed">Pozycje oferty</h2>
                        <Button variant="outline" size="sm" type="button" onClick={addItem}>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Dodaj pozycję
                        </Button>
                    </div>

                    {uniqueVariants.length > 0 && (
                        <div className="mb-4 p-3 bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl">
                            <div className="flex items-center gap-2 mb-1">
                                <svg className="w-4 h-4 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <span className="text-sm font-medium text-cyan-800">
                                    Warianty: {uniqueVariants.join(', ')}
                                </span>
                            </div>
                            <p className="text-xs text-cyan-600">
                                Pozycje bez wariantu są wspólne dla wszystkich wariantów.
                            </p>
                        </div>
                    )}

                    <div className="space-y-4">
                        {items.map((item, index) => {
                            const itemTotals = calculateItemTotal(item);

                            return (
                                <div key={index} className={`p-4 rounded-xl space-y-4 ${
                                    item.variantName.trim()
                                        ? 'section-themed border-l-4 border-l-cyan-400'
                                        : 'section-themed'
                                }`}>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-themed-muted">
                                                Pozycja {index + 1}
                                            </span>
                                            {item.variantName.trim() && (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700 font-medium">
                                                    {item.variantName.trim()}
                                                </span>
                                            )}
                                        </div>
                                        {items.length > 1 && (
                                            <button
                                                type="button"
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

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            label="Wariant (opcjonalnie)"
                                            value={item.variantName}
                                            onChange={(e) => updateItem(index, 'variantName', e.target.value)}
                                            placeholder="np. Basic, Standard, Premium"
                                            list={`edit-variant-suggestions-${index}`}
                                        />
                                        {uniqueVariants.length > 0 && (
                                            <datalist id={`edit-variant-suggestions-${index}`}>
                                                {uniqueVariants.map((v) => (
                                                    <option key={v} value={v} />
                                                ))}
                                            </datalist>
                                        )}
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
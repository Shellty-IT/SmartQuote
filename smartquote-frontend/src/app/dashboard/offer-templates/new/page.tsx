// src/app/dashboard/offer-templates/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card } from '@/components/ui';
import { offerTemplatesApi, ApiError } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import type { CreateOfferTemplateInput, CreateOfferTemplateItemInput } from '@/types';

interface TemplateItem extends CreateOfferTemplateItemInput {
    _tempId: string;
}

const emptyItem: TemplateItem = {
    _tempId: '',
    name: '',
    description: null,
    quantity: 1,
    unit: 'szt.',
    unitPrice: 0,
    vatRate: 23,
    discount: 0,
    isOptional: false,
    variantName: null,
};

function toApiItem(item: TemplateItem): CreateOfferTemplateItemInput {
    const { _tempId: _omit, ...rest } = item;
    void _omit;
    return rest;
}

const textareaClass =
    'w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all duration-200 resize-y';

const inputClass =
    'w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all duration-200';

const inputSmClass =
    'w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all duration-200 text-sm';

export default function NewOfferTemplatePage() {
    const router = useRouter();
    const toast = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [defaultPaymentDays, setDefaultPaymentDays] = useState(14);
    const [defaultTerms, setDefaultTerms] = useState('');
    const [defaultNotes, setDefaultNotes] = useState('');
    const [items, setItems] = useState<TemplateItem[]>([{ ...emptyItem, _tempId: crypto.randomUUID() }]);

    function addItem() {
        setItems((prev) => [...prev, { ...emptyItem, _tempId: crypto.randomUUID() }]);
    }

    function removeItem(tempId: string) {
        if (items.length === 1) return;
        setItems((prev) => prev.filter((i) => i._tempId !== tempId));
    }

    function updateItem(tempId: string, field: keyof TemplateItem, value: string | number | boolean | null) {
        setItems((prev) =>
            prev.map((item) => (item._tempId === tempId ? { ...item, [field]: value } : item))
        );
    }

    async function handleSubmit() {
        if (name.length < 3) {
            toast.error('Błąd walidacji', 'Nazwa szablonu musi mieć minimum 3 znaki');
            return;
        }
        if (items.length === 0 || items.some((i) => !i.name || i.quantity <= 0)) {
            toast.error('Błąd walidacji', 'Wszystkie pozycje muszą mieć nazwę i ilość większą od 0');
            return;
        }

        setIsSubmitting(true);
        try {
            const data: CreateOfferTemplateInput = {
                name,
                description: description || null,
                category: category || null,
                defaultPaymentDays,
                defaultTerms: defaultTerms || null,
                defaultNotes: defaultNotes || null,
                items: items.map(toApiItem),
            };

            const response = await offerTemplatesApi.create(data);
            if (response.data?.id) {
                toast.success('Szablon utworzony', `"${name}" został zapisany`);
                router.push('/dashboard/offer-templates');
            }
        } catch (err) {
            if (err instanceof ApiError) {
                toast.error('Błąd', err.message);
            }
        } finally {
            setIsSubmitting(false);
        }
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
                <h1 className="text-2xl font-bold text-themed">Nowy szablon oferty</h1>
                <p className="text-themed-muted mt-1">Utwórz preset pozycji do wielokrotnego użycia</p>
            </div>

            <Card className="mb-6 p-6">
                <h2 className="text-lg font-semibold text-themed mb-4">Podstawowe informacje</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            Nazwa szablonu <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="np. WordPress Standard"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            Opis (opcjonalne)
                        </label>
                        <textarea
                            placeholder="Krótki opis szablonu..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            className={`${textareaClass} min-h-[72px]`}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                Kategoria (opcjonalne)
                            </label>
                            <input
                                type="text"
                                placeholder="np. Strony WWW"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                Domyślne dni płatności
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={365}
                                value={defaultPaymentDays}
                                onChange={(e) => setDefaultPaymentDays(Number(e.target.value))}
                                className={inputClass}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            Domyślne warunki (opcjonalne)
                        </label>
                        <textarea
                            placeholder="Standardowe warunki oferty..."
                            value={defaultTerms}
                            onChange={(e) => setDefaultTerms(e.target.value)}
                            rows={3}
                            className={`${textareaClass} min-h-[88px]`}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            Domyślne uwagi (opcjonalne)
                        </label>
                        <textarea
                            placeholder="Dodatkowe uwagi..."
                            value={defaultNotes}
                            onChange={(e) => setDefaultNotes(e.target.value)}
                            rows={2}
                            className={`${textareaClass} min-h-[72px]`}
                        />
                    </div>
                </div>
            </Card>

            <Card className="mb-6 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-themed">Pozycje szablonu ({items.length})</h2>
                    <Button variant="outline" size="sm" onClick={addItem}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Dodaj pozycję
                    </Button>
                </div>
                <div className="space-y-4">
                    {items.map((item, index) => (
                        <div key={item._tempId} className="section-themed rounded-xl p-4 border divider-themed">
                            <div className="flex items-start justify-between mb-3">
                                <span className="text-sm font-semibold text-themed">Pozycja {index + 1}</span>
                                {items.length > 1 && (
                                    <button
                                        onClick={() => removeItem(item._tempId)}
                                        className="p-1 rounded-lg hover:bg-red-500/10 text-red-600 dark:text-red-400 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="md:col-span-2">
                                    <input
                                        type="text"
                                        placeholder="Nazwa pozycji *"
                                        value={item.name}
                                        onChange={(e) => updateItem(item._tempId, 'name', e.target.value)}
                                        className={inputSmClass}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <input
                                        type="text"
                                        placeholder="Opis (opcjonalnie)"
                                        value={item.description ?? ''}
                                        onChange={(e) => updateItem(item._tempId, 'description', e.target.value || null)}
                                        className={inputSmClass}
                                    />
                                </div>
                                <div>
                                    <input
                                        type="number"
                                        placeholder="Ilość"
                                        min={0}
                                        step={0.01}
                                        value={item.quantity}
                                        onChange={(e) => updateItem(item._tempId, 'quantity', Number(e.target.value))}
                                        className={inputSmClass}
                                    />
                                </div>
                                <div>
                                    <input
                                        type="text"
                                        placeholder="Jednostka"
                                        value={item.unit}
                                        onChange={(e) => updateItem(item._tempId, 'unit', e.target.value)}
                                        className={inputSmClass}
                                    />
                                </div>
                                <div>
                                    <input
                                        type="number"
                                        placeholder="Cena netto"
                                        min={0}
                                        step={0.01}
                                        value={item.unitPrice}
                                        onChange={(e) => updateItem(item._tempId, 'unitPrice', Number(e.target.value))}
                                        className={inputSmClass}
                                    />
                                </div>
                                <div>
                                    <input
                                        type="number"
                                        placeholder="VAT %"
                                        min={0}
                                        max={100}
                                        value={item.vatRate}
                                        onChange={(e) => updateItem(item._tempId, 'vatRate', Number(e.target.value))}
                                        className={inputSmClass}
                                    />
                                </div>
                                <div>
                                    <input
                                        type="number"
                                        placeholder="Rabat %"
                                        min={0}
                                        max={100}
                                        value={item.discount}
                                        onChange={(e) => updateItem(item._tempId, 'discount', Number(e.target.value))}
                                        className={inputSmClass}
                                    />
                                </div>
                                <div>
                                    <input
                                        type="text"
                                        placeholder="Wariant (opcjonalnie)"
                                        value={item.variantName ?? ''}
                                        onChange={(e) => updateItem(item._tempId, 'variantName', e.target.value || null)}
                                        className={inputSmClass}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id={`optional-${item._tempId}`}
                                        checked={item.isOptional}
                                        onChange={(e) => updateItem(item._tempId, 'isOptional', e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-300"
                                    />
                                    <label htmlFor={`optional-${item._tempId}`} className="text-sm text-themed">
                                        Pozycja opcjonalna
                                    </label>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            <div className="flex justify-between">
                <Button variant="outline" onClick={() => router.back()}>
                    Anuluj
                </Button>
                <Button onClick={handleSubmit} isLoading={isSubmitting}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Zapisz szablon
                </Button>
            </div>
        </div>
    );
}
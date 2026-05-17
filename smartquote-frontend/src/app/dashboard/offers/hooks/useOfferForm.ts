// src/app/dashboard/offers/hooks/useOfferForm.ts

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useClients } from '@/hooks/useClients';
import { offersApi, ApiError } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import type { Client, CreateOfferInput, OfferTemplate, Offer } from '@/types';
import type { Step } from '../new/constants';
import { STEPS } from '../new/constants';
import type { ExtendedOfferItem, OfferDetails, OfferTotalsData } from '../new/types';
import { emptyItem, defaultOfferDetails } from '../new/types';

export function calculateItemTotal(item: ExtendedOfferItem): OfferTotalsData {
    const quantity = item.quantity || 0;
    const unitPrice = item.unitPrice || 0;
    const discount = item.discount || 0;
    const vatRate = item.vatRate || 23;

    const discountMultiplier = 1 - discount / 100;
    const totalNet = quantity * unitPrice * discountMultiplier;
    const totalVat = totalNet * (vatRate / 100);
    const totalGross = totalNet + totalVat;

    return { totalNet, totalVat, totalGross };
}

export function getUniqueVariants(items: ExtendedOfferItem[]): string[] {
    const variants = items
        .map((i) => i.variantName.trim())
        .filter((v) => v.length > 0);
    return [...new Set(variants)];
}

export function useOfferForm(options?: { initialData?: Offer }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const toast = useToast();

    const isEditMode = !!options?.initialData;
    const offerId = options?.initialData?.id;
    const preselectedClientId = searchParams.get('clientId');

    const { clients, isLoading: isLoadingClients } = useClients({ limit: 100 });

    const [currentStep, setCurrentStep] = useState<Step>('client');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false);

    const [selectedClient, setSelectedClient] = useState<Client | null>(() => {
        return options?.initialData?.client || null;
    });

    const [offerDetails, setOfferDetails] = useState<OfferDetails>(() => {
        if (options?.initialData) {
            return {
                title: options.initialData.title,
                description: options.initialData.description || '',
                validUntil: options.initialData.validUntil
                    ? options.initialData.validUntil.split('T')[0]
                    : '',
                notes: options.initialData.notes || '',
                terms: options.initialData.terms || '',
                paymentDays: options.initialData.paymentDays,
                requireAuditTrail: options.initialData.requireAuditTrail || false,
            };
        }
        return defaultOfferDetails;
    });

    const [items, setItems] = useState<ExtendedOfferItem[]>(() => {
        if (options?.initialData?.items) {
            return options.initialData.items.map((item) => ({
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
            }));
        }
        return [{ ...emptyItem }];
    });

    useEffect(() => {
        if (!isEditMode && preselectedClientId && clients.length > 0) {
            const client = clients.find((c) => c.id === preselectedClientId);
            if (client) {
                setSelectedClient(client);
                setCurrentStep('details');
            }
        }
    }, [isEditMode, preselectedClientId, clients]);

    const totals = useMemo(() => {
        return items.reduce(
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
    }, [items]);

    const uniqueVariants = useMemo(() => getUniqueVariants(items), [items]);

    const goToStep = useCallback((step: Step) => setCurrentStep(step), []);

    const goNext = useCallback(() => {
        const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
        if (currentIndex < STEPS.length - 1) {
            setCurrentStep(STEPS[currentIndex + 1].id);
        }
    }, [currentStep]);

    const goBack = useCallback(() => {
        const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
        if (currentIndex > 0) {
            setCurrentStep(STEPS[currentIndex - 1].id);
        }
    }, [currentStep]);

    const addItem = useCallback(() => {
        setItems((prev) => [...prev, { ...emptyItem }]);
    }, []);

    const removeItem = useCallback((index: number) => {
        setItems((prev) => {
            if (prev.length > 1) {
                return prev.filter((_, i) => i !== index);
            }
            return prev;
        });
    }, []);

    const updateItem = useCallback(
        (index: number, field: keyof ExtendedOfferItem, value: string | number | boolean) => {
            setItems((prev) => {
                const newItems = [...prev];
                newItems[index] = { ...newItems[index], [field]: value };
                return newItems;
            });
        },
        []
    );

    const updateDetails = useCallback(
        <K extends keyof OfferDetails>(field: K, value: OfferDetails[K]) => {
            setOfferDetails((prev) => ({ ...prev, [field]: value }));
        },
        []
    );

    const applyTemplate = useCallback(
        (template: OfferTemplate) => {
            const templateItems: ExtendedOfferItem[] = template.items.map((item) => ({
                name: item.name,
                description: item.description ?? '',
                quantity: Number(item.quantity),
                unit: item.unit,
                unitPrice: Number(item.unitPrice),
                vatRate: Number(item.vatRate),
                discount: Number(item.discount),
                isOptional: item.isOptional,
                minQuantity: 1,
                maxQuantity: 100,
                variantName: item.variantName ?? '',
            }));

            setItems(templateItems);

            if (!offerDetails.paymentDays || offerDetails.paymentDays === defaultOfferDetails.paymentDays) {
                setOfferDetails((prev) => ({
                    ...prev,
                    paymentDays: template.defaultPaymentDays,
                    terms: prev.terms || template.defaultTerms || '',
                    notes: prev.notes || template.defaultNotes || '',
                }));
            }

            toast.success(
                'Szablon zastosowany',
                `Wstawiono ${template.items.length} pozycji z szablonu "${template.name}"`
            );
        },
        [offerDetails.paymentDays, toast]
    );

    const canProceed = useCallback(() => {
        switch (currentStep) {
            case 'client':
                return selectedClient !== null;
            case 'details':
                return offerDetails.title.length >= 3;
            case 'items':
                return items.every(
                    (item) => item.name && item.quantity > 0 && item.unitPrice >= 0
                );
            default:
                return true;
        }
    }, [currentStep, selectedClient, offerDetails.title, items]);

    const handleSubmit = useCallback(async () => {
        if (!selectedClient) return;

        setIsSubmitting(true);

        try {
            const data: CreateOfferInput = {
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

            if (isEditMode && offerId) {
                await offersApi.update(offerId, data);
                toast.success('Oferta zaktualizowana', 'Zmiany zostały zapisane pomyślnie');
                router.push(`/dashboard/offers/${offerId}`);
            } else {
                const response = await offersApi.create(data);
                if (response.data?.id) {
                    toast.success('Oferta utworzona', `"${offerDetails.title}" została zapisana`);
                    router.push(`/dashboard/offers/${response.data.id}`);
                } else {
                    throw new Error('Nie udało się utworzyć oferty');
                }
            }
        } catch (err) {
            if (err instanceof ApiError) {
                toast.error(
                    isEditMode ? 'Błąd aktualizacji' : 'Błąd tworzenia oferty',
                    err.message
                );
            } else {
                toast.error('Błąd', 'Wystąpił nieoczekiwany błąd');
            }
            setIsSubmitting(false);
        }
    }, [isEditMode, offerId, selectedClient, offerDetails, items, toast, router]);

    return {
        clients,
        isLoadingClients,
        currentStep,
        isSubmitting,
        isEditMode,
        selectedClient,
        setSelectedClient,
        offerDetails,
        updateDetails,
        items,
        addItem,
        removeItem,
        updateItem,
        totals,
        uniqueVariants,
        goToStep,
        goNext,
        goBack,
        canProceed,
        handleSubmit,
        applyTemplate,
        templateSelectorOpen,
        setTemplateSelectorOpen,
        router,
    };
}
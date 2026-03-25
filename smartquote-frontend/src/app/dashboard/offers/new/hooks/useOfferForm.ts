// src/app/dashboard/offers/new/hooks/useOfferForm.ts

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useClients } from '@/hooks/useClients';
import { offersApi, ApiError } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import type { Client, CreateOfferInput } from '@/types';
import type { Step } from '../constants';
import { STEPS } from '../constants';
import type { ExtendedOfferItem, OfferDetails, OfferTotalsData } from '../types';
import { emptyItem, defaultOfferDetails } from '../types';

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

export function useOfferForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const toast = useToast();
    const preselectedClientId = searchParams.get('clientId');

    const { clients, isLoading: isLoadingClients } = useClients({ limit: 100 });

    const [currentStep, setCurrentStep] = useState<Step>('client');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [offerDetails, setOfferDetails] = useState<OfferDetails>(defaultOfferDetails);
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

    const canProceed = useCallback(() => {
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

            const response = await offersApi.create(data);
            if (response.data?.id) {
                toast.success('Oferta utworzona', `"${offerDetails.title}" została zapisana`);
                router.push(`/dashboard/offers/${response.data.id}`);
            } else {
                throw new Error('Nie udało się utworzyć oferty');
            }
        } catch (err) {
            if (err instanceof ApiError) {
                toast.error('Błąd tworzenia oferty', err.message);
            } else {
                toast.error('Błąd', 'Wystąpił nieoczekiwany błąd');
            }
            setIsSubmitting(false);
        }
    }, [selectedClient, offerDetails, items, toast, router]);

    return {
        clients,
        isLoadingClients,
        currentStep,
        isSubmitting,
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
        router,
    };
}
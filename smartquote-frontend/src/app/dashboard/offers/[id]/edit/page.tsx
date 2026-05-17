// src/app/dashboard/offers/[id]/edit/page.tsx
'use client';

import React, { use } from 'react';
import { useOffer } from '@/hooks/useOffers';
import { Button, Card } from '@/components/ui';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { useOfferForm } from '../../hooks';
import OfferStepper from '../../new/components/OfferStepper';
import StepClient from '../../new/components/StepClient';
import StepDetails from '../../new/components/StepDetails';
import StepItems from '../../new/components/StepItems';
import StepSummary from '../../new/components/StepSummary';

export default function EditOfferPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { offer, isLoading: isLoadingOffer, error: offerError } = useOffer(id);

    const {
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
    } = useOfferForm({
        initialData: offer || undefined,
    });

    if (isLoadingOffer || isLoadingClients) {
        return <PageLoader />;
    }

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

            <OfferStepper currentStep={currentStep} onStepClick={goToStep} />

            <Card className="mb-6">
                {currentStep === 'client' && (
                    <StepClient
                        clients={clients}
                        selectedClient={selectedClient}
                        onSelectClient={setSelectedClient}
                    />
                )}

                {currentStep === 'details' && (
                    <StepDetails
                        details={offerDetails}
                        onUpdate={updateDetails}
                    />
                )}

                {currentStep === 'items' && (
                    <StepItems
                        items={items}
                        totals={totals}
                        uniqueVariants={uniqueVariants}
                        onAddItem={addItem}
                        onRemoveItem={removeItem}
                        onUpdateItem={updateItem}
                    />
                )}

                {currentStep === 'summary' && selectedClient && (
                    <StepSummary
                        client={selectedClient}
                        details={offerDetails}
                        items={items}
                        totals={totals}
                        uniqueVariants={uniqueVariants}
                    />
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
                            Zapisz zmiany
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
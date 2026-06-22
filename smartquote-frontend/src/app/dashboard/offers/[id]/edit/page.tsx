// src/app/dashboard/offers/[id]/edit/page.tsx
'use client';

import React, { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOffer } from '@/hooks/useOffers';
import { Button } from '@/components/ui';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { useTranslations } from '@/i18n';
import { useOfferForm } from '../../hooks';
import OfferStepper from '../../new/components/OfferStepper';
import StepClient from '../../new/components/StepClient';
import StepDetails from '../../new/components/StepDetails';
import StepItems from '../../new/components/StepItems';
import StepSummary from '../../new/components/StepSummary';
import StepTemplate from '../../new/components/StepTemplate';
import type { Offer } from '@/types';

function TemplateEditRedirect({ offerId }: { offerId: string }) {
    const router = useRouter();

    useEffect(() => {
        router.replace(`/dashboard/offers/${offerId}?tab=template`);
    }, [offerId, router]);

    return <PageLoader />;
}

// ── Inner form — rendered only after offer is loaded ─────────────────────────

function EditOfferForm({ offer }: { offer: Offer }) {
    const tr = useTranslations('offerNew');
    const commonTr = useTranslations('common');
    const offerDetailTr = useTranslations('offerDetail');

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
        stepIds,
        goToStep,
        goNext,
        goBack,
        canProceed,
        handleSubmit,
        proposalBlocks,
        setProposalBlocks,
        router,
    } = useOfferForm({ initialData: offer });

    if (isLoadingClients) return <PageLoader />;

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-muted-foreground hover:opacity-70 mb-4"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    {tr.back}
                </button>
                <h1 className="text-2xl font-bold text-foreground">{tr.editTitle}</h1>
                <p className="text-muted-foreground mt-1">{offer.number}</p>
            </div>

            <OfferStepper currentStep={currentStep} stepIds={stepIds} onStepClick={goToStep} />

            <div className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-card">
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
                        clientName={selectedClient?.name}
                        hideTemplateSelector
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

                {currentStep === 'template' && selectedClient && (
                    <StepTemplate
                        client={selectedClient}
                        offerTitle={offerDetails.title}
                        onTitleChange={(v) => updateDetails('title', v)}
                        totalGross={totals.totalGross}
                        currency={offer.currency ?? 'PLN'}
                        paymentDays={offerDetails.paymentDays}
                        blocks={proposalBlocks}
                        onBlocksChange={setProposalBlocks}
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
            </div>

            <div className="flex justify-between">
                <Button
                    variant="outline"
                    onClick={currentStep === 'client' ? () => router.back() : goBack}
                >
                    {currentStep === 'client' ? offerDetailTr.backToList : tr.prev}
                </Button>

                <div className="flex gap-3">
                    {currentStep === 'summary' ? (
                        <Button onClick={handleSubmit} isLoading={isSubmitting}>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {commonTr.saveChanges}
                        </Button>
                    ) : (
                        <Button onClick={goNext} disabled={!canProceed()}>
                            {tr.next}
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

// ── Page wrapper — waits for offer to load before mounting the form ───────────

export default function EditOfferPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const offerDetailTr = useTranslations('offerDetail');
    const { offer, isLoading: isLoadingOffer, error: offerError } = useOffer(id);

    if (isLoadingOffer) return <PageLoader />;

    if (offerError || !offer) {
        return (
            <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-8 sm:px-6">
                <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                    <div className="text-center py-12">
                        <p className="text-destructive mb-4">{offerError || offerDetailTr.notFound}</p>
                        <Button onClick={() => window.history.back()}>
                            {offerDetailTr.backToList}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if ((offer.templateType ?? 'classic') !== 'classic') {
        return <TemplateEditRedirect offerId={offer.id} />;
    }

    // Key ensures that if the user navigates to a different edit page the form fully resets
    return <EditOfferForm key={offer.id} offer={offer} />;
}

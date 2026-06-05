// src/app/dashboard/offers/new/NewOfferContent.tsx
'use client';

import { Button } from '@/components/ui';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { useTranslations } from '@/i18n';
import { useOfferForm } from '../hooks';
import OfferStepper from './components/OfferStepper';
import StepClient from './components/StepClient';
import StepDetails from './components/StepDetails';
import StepItems from './components/StepItems';
import StepSummary from './components/StepSummary';
import StepTemplate from './components/StepTemplate';
import TemplateSelector from '@/components/offer-templates/TemplateSelector';

export default function NewOfferContent() {
    const tr = useTranslations('offerNew');
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
        applyTemplate,
        templateSelectorOpen,
        setTemplateSelectorOpen,
        proposalBlocks,
        setProposalBlocks,
        router,
    } = useOfferForm();

    if (isLoadingClients && clients.length === 0) return <PageLoader />;

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-muted-foreground hover:opacity-70 mb-4">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    {tr.back}
                </button>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">{tr.title}</h1>
                        <p className="text-muted-foreground mt-1">{tr.subtitle}</p>
                    </div>
                    {currentStep === 'items' && (
                        <button
                            onClick={() => setTemplateSelectorOpen(true)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary/40 bg-primary/10 text-primary text-sm font-medium hover:bg-primary/15 transition-colors shrink-0"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                            </svg>
                            {tr.useTemplate}
                        </button>
                    )}
                </div>
            </div>

            <OfferStepper currentStep={currentStep} stepIds={stepIds} onStepClick={goToStep} />

            <div className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-card">
                {currentStep === 'client' && (
                    <StepClient clients={clients} selectedClient={selectedClient} onSelectClient={setSelectedClient} />
                )}
                {currentStep === 'details' && (
                    <StepDetails
                        details={offerDetails}
                        onUpdate={updateDetails}
                        clientName={selectedClient?.name}
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
                {currentStep === 'template' && (
                    <StepTemplate
                        client={selectedClient}
                        offerTitle={offerDetails.title}
                        totalGross={totals.totalGross}
                        currency="PLN"
                        paymentDays={offerDetails.paymentDays}
                        blocks={proposalBlocks}
                        onBlocksChange={setProposalBlocks}
                    />
                )}
                {currentStep === 'summary' && selectedClient && (
                    <StepSummary client={selectedClient} details={offerDetails} items={items} totals={totals} uniqueVariants={uniqueVariants} />
                )}
            </div>

            <div className="flex justify-between">
                <Button variant="outline" onClick={currentStep === 'client' ? () => router.back() : goBack}>
                    {currentStep === 'client' ? tr.cancel : tr.prev}
                </Button>

                <div className="flex gap-3">
                    {currentStep === 'summary' ? (
                        <Button data-testid="offer-create-button" onClick={handleSubmit} isLoading={isSubmitting}>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {tr.create}
                        </Button>
                    ) : (
                        <Button data-testid="offer-next-button" onClick={goNext} disabled={!canProceed()}>
                            {tr.next}
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </Button>
                    )}
                </div>
            </div>

            <TemplateSelector
                isOpen={templateSelectorOpen}
                onClose={() => setTemplateSelectorOpen(false)}
                onSelect={applyTemplate}
            />
        </div>
    );
}

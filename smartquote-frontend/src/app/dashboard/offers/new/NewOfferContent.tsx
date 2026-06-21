// src/app/dashboard/offers/new/NewOfferContent.tsx
'use client';

import { useEffect } from 'react';
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
import StepTypeChoice from './components/StepTypeChoice';
import TemplateSelector from '@/components/offer-templates/TemplateSelector';
import StepShopTemplate from './components/StepShopTemplate';
import StepWebsiteV2Template from './components/StepWebsiteV2Template';
import StepWebsiteV3Template from './components/StepWebsiteV3Template';
import StepSupportTemplate from './components/StepSupportTemplate';
import StepMobileAppTemplate from './components/StepMobileAppTemplate';
import StepMobileSimpleTemplate from './components/StepMobileSimpleTemplate';
import StepUniversalTemplate from './components/StepUniversalTemplate';
import WizardHeader from '@/components/ui/WizardHeader';

export default function NewOfferContent() {
    const tr = useTranslations('offerNew');
    const {
        clients,
        isLoadingClients,
        leads,
        currentStep,
        isSubmitting,
        selectedClient,
        setSelectedClient,
        selectedLead,
        setSelectedLead,
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
        shopBlocks,
        setShopBlocks,
        websiteV2Blocks,
        setWebsiteV2Blocks,
        websiteV3Blocks,
        setWebsiteV3Blocks,
        supportBlocks,
        setSupportBlocks,
        mobileAppBlocks,
        setMobileAppBlocks,
        mobileSimpleBlocks,
        setMobileSimpleBlocks,
        universalBlocks,
        setUniversalBlocks,
        router,
    } = useOfferForm();

    const documentClient = selectedClient ?? (selectedLead
        ? { name: selectedLead.name, company: selectedLead.company ?? null }
        : null);

    // Initialize terms from i18n once on mount (can't use i18n value in useState initializer)
    useEffect(() => {
        if (!offerDetails.terms) {
            updateDetails('terms', tr.details.termsDefault);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (isLoadingClients && clients.length === 0) return <PageLoader />;

    return (
        <div className="w-full max-w-[1400px] px-4 py-3 md:px-6">
            <div className="mb-4">
                <WizardHeader
                    title={tr.title}
                    subtitle={tr.subtitle}
                    backLabel={tr.back}
                    onBack={() => router.back()}
                    progress={<OfferStepper currentStep={currentStep} stepIds={stepIds} onStepClick={goToStep} />}
                    action={currentStep === 'items' ? (
                        <button
                            onClick={() => setTemplateSelectorOpen(true)}
                            className="flex h-9 items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 text-xs font-medium text-primary transition-colors hover:bg-primary/15"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                            </svg>
                            {tr.useTemplate}
                        </button>
                    ) : undefined}
                />
            </div>

            <div className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-card">
                {currentStep === 'client' && (
                    <StepClient
                        clients={clients}
                        leads={leads}
                        selectedClient={selectedClient}
                        selectedLead={selectedLead}
                        onSelectClient={(client) => { setSelectedClient(client); setSelectedLead(null); }}
                        onSelectLead={(lead) => { setSelectedLead(lead); setSelectedClient(null); }}
                    />
                )}
                {currentStep === 'type_choice' && (
                    <StepTypeChoice
                        selectedType={offerDetails.templateType ?? 'classic'}
                        onSelect={(type) => updateDetails('templateType', type)}
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
                {currentStep === 'template' && offerDetails.templateType === 'proposal' && (
                    <StepTemplate
                        client={documentClient}
                        offerTitle={offerDetails.title}
                        onTitleChange={(v) => updateDetails('title', v)}
                        totalGross={totals.totalGross}
                        currency="PLN"
                        paymentDays={offerDetails.paymentDays}
                        blocks={proposalBlocks}
                        onBlocksChange={setProposalBlocks}
                    />
                )}
                {currentStep === 'template' && offerDetails.templateType === 'shop' && (
                    <StepShopTemplate
                        client={documentClient}
                        offerTitle={offerDetails.title}
                        onTitleChange={(v) => updateDetails('title', v)}
                        totalGross={totals.totalGross}
                        currency="PLN"
                        paymentDays={offerDetails.paymentDays}
                        blocks={shopBlocks}
                        onBlocksChange={setShopBlocks}
                    />
                )}
                {currentStep === 'template' && offerDetails.templateType === 'website_v2' && (
                    <StepWebsiteV2Template
                        client={documentClient}
                        offerTitle={offerDetails.title}
                        onTitleChange={(v) => updateDetails('title', v)}
                        totalGross={totals.totalGross}
                        currency="PLN"
                        paymentDays={offerDetails.paymentDays}
                        blocks={websiteV2Blocks}
                        onBlocksChange={setWebsiteV2Blocks}
                    />
                )}
                {currentStep === 'template' && offerDetails.templateType === 'website_v3' && (
                    <StepWebsiteV3Template
                        client={documentClient}
                        offerTitle={offerDetails.title}
                        onTitleChange={(v) => updateDetails('title', v)}
                        totalGross={totals.totalGross}
                        currency="PLN"
                        paymentDays={offerDetails.paymentDays}
                        blocks={websiteV3Blocks}
                        onBlocksChange={setWebsiteV3Blocks}
                    />
                )}
                {currentStep === 'template' && offerDetails.templateType === 'support' && (
                    <StepSupportTemplate
                        client={documentClient}
                        offerTitle={offerDetails.title}
                        onTitleChange={(v) => updateDetails('title', v)}
                        blocks={supportBlocks}
                        onBlocksChange={setSupportBlocks}
                    />
                )}
                {currentStep === 'template' && offerDetails.templateType === 'mobile_app' && (
                    <StepMobileAppTemplate
                        client={documentClient}
                        offerTitle={offerDetails.title}
                        onTitleChange={(v) => updateDetails('title', v)}
                        blocks={mobileAppBlocks}
                        onBlocksChange={setMobileAppBlocks}
                    />
                )}
                {currentStep === 'template' && offerDetails.templateType === 'mobile_simple' && (
                    <StepMobileSimpleTemplate
                        client={documentClient}
                        offerTitle={offerDetails.title}
                        onTitleChange={(v) => updateDetails('title', v)}
                        blocks={mobileSimpleBlocks}
                        onBlocksChange={setMobileSimpleBlocks}
                    />
                )}
                {currentStep === 'template' && offerDetails.templateType === 'universal' && (
                    <StepUniversalTemplate
                        client={documentClient}
                        offerTitle={offerDetails.title}
                        onTitleChange={(v) => updateDetails('title', v)}
                        blocks={universalBlocks}
                        onBlocksChange={setUniversalBlocks}
                    />
                )}
                {currentStep === 'summary' && (selectedClient || selectedLead) && (
                    <StepSummary
                        client={selectedClient ?? { name: selectedLead!.name, email: selectedLead!.email }}
                        details={offerDetails}
                        items={items}
                        totals={totals}
                        uniqueVariants={uniqueVariants}
                    />
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

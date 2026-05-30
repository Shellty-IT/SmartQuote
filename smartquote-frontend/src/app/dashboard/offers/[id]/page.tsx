// src/app/dashboard/offers/[id]/page.tsx
'use client';

import { use } from 'react';
import { Button, ConfirmDialog } from '@/components/ui';
import { useTranslations } from '@/i18n';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import PublishDialog from '@/components/offers/PublishDialog';
import { useOfferDetail } from './hooks/useOfferDetail';
import { OfferHeader } from './components/OfferHeader';
import { OfferTabs } from './components/OfferTabs';
import { DetailsTab } from './components/details/DetailsTab';
import { AnalyticsTab } from './components/analytics/AnalyticsTab';
import { CommentsTab } from './components/comments/CommentsTab';
import { EmailsTab } from './components/emails/EmailsTab';
import { KsefMasterPreview } from './components/KsefMasterPreview';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function OfferDetailPage({ params }: PageProps) {
    const { id } = use(params);
    const {
        offer,
        isLoading,
        error,
        analytics,
        comments,
        isSending,
        activeTab,
        setActiveTab,
        isUpdatingStatus,
        deleteModal,
        setDeleteModal,
        isDeleting,
        isDownloadingPDF,
        publishDialogOpen,
        setPublishDialogOpen,
        newComment,
        setNewComment,
        observerInsight,
        isLoadingObserver,
        observerError,
        closingStrategy,
        isLoadingCloser,
        closerError,
        expandedStrategy,
        setExpandedStrategy,
        ksefModalOpen,
        setKsefModalOpen,
        canGenerateInvoice,
        offerReadyForInvoice,
        invoiceAlreadySent,
        ksefAvailability,
        isCheckingKsef,
        handleKsefSent,
        variantData,
        availableTransitions,
        isExpired,
        handleCopyHash,
        handleLoadObserver,
        handleLoadCloser,
        handleUseStrategy,
        handleStatusChange,
        handleDelete,
        handleDuplicate,
        handleDownloadPDF,
        handlePublished,
        handleAddSellerComment,
        router,
    } = useOfferDetail(id);

    const tr = useTranslations('offerDetail');
    const commonTr = useTranslations('common');

    if (isLoading) return <PageLoader />;

    if (error || !offer) {
        return (
            <div className="mx-auto max-w-[1400px] px-4 py-16 text-center sm:px-6">
                <div className="rounded-2xl border border-border bg-card p-12 shadow-card">
                    <p className="text-destructive mb-4">{error || tr.notFound}</p>
                    <Button onClick={() => router.push('/dashboard/offers')}>
                        {tr.backToList}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-8 sm:px-6">
            <OfferHeader
                offer={offer}
                variantData={variantData}
                isExpired={isExpired}
                availableTransitions={availableTransitions}
                isUpdatingStatus={isUpdatingStatus}
                canGenerateInvoice={canGenerateInvoice}
                offerReadyForInvoice={offerReadyForInvoice}
                invoiceAlreadySent={invoiceAlreadySent}
                ksefAvailability={ksefAvailability}
                isCheckingKsef={isCheckingKsef}
                onStatusChange={handleStatusChange}
                onPublishClick={() => setPublishDialogOpen(true)}
                onDuplicate={handleDuplicate}
                onKsefClick={() => setKsefModalOpen(true)}
            />

            <div className="mb-6"><OfferTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                viewCount={offer.viewCount || 0}
                commentsCount={offer._count?.comments || 0}
                emailsCount={0}
            /></div>

            {activeTab === 'details' && (
                <DetailsTab
                    offer={offer}
                    variantData={variantData}
                    isExpired={isExpired}
                    isDownloadingPDF={isDownloadingPDF}
                    onDownloadPDF={handleDownloadPDF}
                    onPublishClick={() => setPublishDialogOpen(true)}
                    onDeleteClick={() => setDeleteModal(true)}
                    onCopyHash={handleCopyHash}
                />
            )}

            {activeTab === 'analytics' && (
                <AnalyticsTab
                    analytics={analytics}
                    observerInsight={observerInsight}
                    isLoadingObserver={isLoadingObserver}
                    observerError={observerError}
                    onLoadObserver={handleLoadObserver}
                />
            )}

            {activeTab === 'comments' && (
                <CommentsTab
                    comments={comments}
                    newComment={newComment}
                    isSending={isSending}
                    closingStrategy={closingStrategy}
                    isLoadingCloser={isLoadingCloser}
                    closerError={closerError}
                    expandedStrategy={expandedStrategy}
                    onCommentChange={setNewComment}
                    onSubmitComment={handleAddSellerComment}
                    onLoadCloser={handleLoadCloser}
                    onExpandStrategy={setExpandedStrategy}
                    onUseStrategy={handleUseStrategy}
                />
            )}

            {activeTab === 'emails' && (
                <EmailsTab
                    offerId={offer.id}
                    offerNumber={offer.number}
                />
            )}

            <ConfirmDialog
                isOpen={deleteModal}
                onClose={() => setDeleteModal(false)}
                onConfirm={handleDelete}
                title={tr.deleteTitle}
                description={tr.deleteDesc.replace('{title}', offer.title).replace('{number}', offer.number)}
                confirmLabel={tr.deleteConfirm}
                isLoading={isDeleting}
            />

            <PublishDialog
                isOpen={publishDialogOpen}
                onClose={() => setPublishDialogOpen(false)}
                offerId={offer.id}
                offerNumber={offer.number}
                validUntil={offer.validUntil}
                currentToken={offer.publicToken}
                isInteractive={offer.isInteractive}
                clientEmail={offer.client?.email || null}
                onPublished={handlePublished}
            />

            <KsefMasterPreview
                isOpen={ksefModalOpen}
                onClose={() => setKsefModalOpen(false)}
                offerId={offer.id}
                onSent={handleKsefSent}
            />
        </div>
    );
}
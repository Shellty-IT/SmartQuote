// src/app/dashboard/offers/[id]/page.tsx
'use client';

import { use } from 'react';
import { Button, Card, ConfirmDialog } from '@/components/ui';
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
        invoiceAlreadySent,
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

    if (isLoading) return <PageLoader />;

    if (error || !offer) {
        return (
            <div className="p-4 md:p-8">
                <Card>
                    <div className="text-center py-12">
                        <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Nie znaleziono oferty'}</p>
                        <Button onClick={() => router.push('/dashboard/offers')}>
                            Wróć do listy
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8">
            <OfferHeader
                offer={offer}
                variantData={variantData}
                isExpired={isExpired}
                availableTransitions={availableTransitions}
                isUpdatingStatus={isUpdatingStatus}
                canGenerateInvoice={canGenerateInvoice}
                invoiceAlreadySent={invoiceAlreadySent}
                onStatusChange={handleStatusChange}
                onPublishClick={() => setPublishDialogOpen(true)}
                onDuplicate={handleDuplicate}
                onKsefClick={() => setKsefModalOpen(true)}
            />

            <OfferTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                viewCount={offer.viewCount || 0}
                commentsCount={offer._count?.comments || 0}
                emailsCount={0}
            />

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
                title="Usuń ofertę"
                description={`Czy na pewno chcesz usunąć ofertę "${offer.title}" (${offer.number})? Ta operacja jest nieodwracalna.`}
                confirmLabel="Usuń"
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
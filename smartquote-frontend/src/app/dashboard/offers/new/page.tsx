// src/app/dashboard/offers/new/page.tsx
import { Suspense } from 'react';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import NewOfferContent from './NewOfferContent';

export default function NewOfferPage() {
    return (
        <Suspense fallback={<PageLoader />}>
            <NewOfferContent />
        </Suspense>
    );
}
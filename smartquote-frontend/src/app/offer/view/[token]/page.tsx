// SmartQuote-AI/src/app/offer/views/[token]/page.tsx

'use client';

import { useState, useEffect, use } from 'react';
import { publicOffersApi, ApiError } from '@/lib/api';
import type { PublicOfferData } from '@/types';
import InteractiveOffer from '@/components/publicOffer/InteractiveOffer';

interface PageProps {
    params: Promise<{ token: string }>;
}

export default function PublicOfferPage({ params }: PageProps) {
    const { token } = use(params);

    const [data, setData] = useState<PublicOfferData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadOffer() {
            setIsLoading(true);
            setError(null);

            try {
                const response = await publicOffersApi.get(token);
                setData(response.data ?? null);
            } catch (err) {
                if (err instanceof ApiError) {
                    if (err.status === 404) {
                        setError('NOT_FOUND');
                    } else {
                        setError(err.message);
                    }
                } else {
                    setError('Nie udało się załadować oferty');
                }
            } finally {
                setIsLoading(false);
            }
        }

        if (token) {
            loadOffer();
        }
    }, [token]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-24">
                <div className="w-12 h-12 border-4 border-cyan-200 border-t-cyan-500 rounded-full animate-spin mb-6" />
                <p className="text-slate-500 text-lg">Ładowanie oferty...</p>
            </div>
        );
    }

    if (error === 'NOT_FOUND' || !data) {
        return (
            <div className="max-w-md mx-auto text-center py-24">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center">
                    <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-3">
                    Oferta nie znaleziona
                </h1>
                <p className="text-slate-500">
                    Link do oferty jest nieprawidłowy, nieaktywny lub oferta została usunięta.
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-md mx-auto text-center py-24">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
                    <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-3">
                    Wystąpił błąd
                </h1>
                <p className="text-slate-500 mb-6">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 bg-cyan-500 text-white font-medium rounded-xl hover:bg-cyan-600 transition-colors"
                >
                    Spróbuj ponownie
                </button>
            </div>
        );
    }

    return <InteractiveOffer token={token} data={data} />;
}
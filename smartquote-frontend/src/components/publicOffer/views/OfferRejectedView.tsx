// src/components/publicOffer/views/OfferRejectedView.tsx
'use client';

interface OfferRejectedViewProps {
    offerNumber: string;
}

export default function OfferRejectedView({ offerNumber }: OfferRejectedViewProps) {
    return (
        <div className="max-w-2xl mx-auto text-center py-16 px-4">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
                <svg
                    className="w-10 h-10 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                    />
                </svg>
            </div>

            <h1 className="text-3xl font-bold text-slate-900 mb-3">
                Oferta odrzucona
            </h1>

            <p className="text-lg text-slate-600 mb-2">
                Oferta <span className="font-semibold">{offerNumber}</span> została odrzucona.
            </p>

            <p className="text-slate-500">
                Sprzedawca został powiadomiony o Twojej decyzji.
            </p>
        </div>
    );
}
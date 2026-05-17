// src/components/publicOffer/views/OfferExpiredView.tsx
'use client';

interface OfferExpiredViewProps {
    offerNumber: string;
    sellerEmail?: string;
    primaryColor: string;
}

export default function OfferExpiredView({
                                             offerNumber,
                                             sellerEmail,
                                             primaryColor,
                                         }: OfferExpiredViewProps) {
    return (
        <div className="max-w-2xl mx-auto text-center py-16 px-4">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-100 flex items-center justify-center">
                <svg
                    className="w-10 h-10 text-amber-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
            </div>

            <h1 className="text-3xl font-bold text-slate-900 mb-3">
                Oferta wygasła
            </h1>

            <p className="text-lg text-slate-600 mb-2">
                Termin ważności oferty{' '}
                <span className="font-semibold">{offerNumber}</span> minął.
            </p>

            <p className="text-slate-500">
                Skontaktuj się ze sprzedawcą, aby uzyskać aktualną ofertę.
            </p>

            {sellerEmail && (
                <a
                    href={`mailto:${sellerEmail}`}
                    className="inline-flex items-center gap-2 mt-6 px-6 py-3 text-white font-medium rounded-xl transition-colors hover:opacity-90"
                    style={{ backgroundColor: primaryColor }}
                >
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                    </svg>
                    Napisz do sprzedawcy
                </a>
            )}
        </div>
    );
}
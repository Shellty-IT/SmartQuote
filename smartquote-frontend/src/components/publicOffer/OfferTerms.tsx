// src/components/publicOffer/OfferTerms.tsx
'use client';

interface OfferTermsProps {
    terms: string;
    paymentDays?: number;
}

export default function OfferTerms({ terms, paymentDays }: OfferTermsProps) {
    if (!terms) return null;

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">
                Warunki
            </h3>

            <p className="text-slate-700 whitespace-pre-wrap text-sm leading-relaxed">
                {terms}
            </p>

            {paymentDays && paymentDays > 0 && (
                <p className="text-sm text-slate-500 mt-3">
                    Termin płatności:{' '}
                    <span className="font-medium text-slate-700">
                        {paymentDays} dni
                    </span>
                </p>
            )}
        </div>
    );
}
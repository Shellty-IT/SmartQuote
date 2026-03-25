// src/components/publicOffer/views/OfferAcceptedView.tsx
'use client';

import { formatPLN, formatDateTime } from '../utils';

interface AuditTrailData {
    contentHash: string;
    ipAddress: string;
    acceptedAt: string;
}

interface OfferAcceptedViewProps {
    offerNumber: string;
    offerTitle: string;
    selectedVariant: string | null;
    totalGross: number;
    primaryColor: string;
    auditTrailData: AuditTrailData | null;
}

export default function OfferAcceptedView({
                                              offerNumber,
                                              offerTitle,
                                              selectedVariant,
                                              totalGross,
                                              primaryColor,
                                              auditTrailData,
                                          }: OfferAcceptedViewProps) {
    return (
        <div className="max-w-2xl mx-auto text-center py-16 px-4">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center">
                <svg
                    className="w-10 h-10 text-emerald-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            </div>

            <h1 className="text-3xl font-bold text-slate-900 mb-3">
                Oferta zaakceptowana!
            </h1>

            <p className="text-lg text-slate-600 mb-2">
                Dziękujemy za akceptację oferty{' '}
                <span className="font-semibold">{offerNumber}</span>.
            </p>

            {selectedVariant && (
                <p className="text-slate-500 mb-2">
                    Wybrany wariant:{' '}
                    <span className="font-semibold" style={{ color: primaryColor }}>
                        {selectedVariant}
                    </span>
                </p>
            )}

            <p className="text-slate-500 mb-8">
                Sprzedawca został powiadomiony i wkrótce się z Tobą skontaktuje.
            </p>

            <div className="bg-slate-900 rounded-xl p-6 inline-block">
                <p className="text-slate-400 text-sm mb-1">Zaakceptowana kwota brutto</p>
                <p className="text-3xl font-bold" style={{ color: primaryColor }}>
                    {formatPLN(totalGross)}
                </p>
            </div>

            {auditTrailData && (
                <div className="mt-8 bg-white rounded-xl border border-emerald-200 p-6 text-left max-w-lg mx-auto">
                    <div className="flex items-center gap-2 mb-4">
                        <svg
                            className="w-5 h-5 text-emerald-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                            />
                        </svg>
                        <h3 className="text-lg font-semibold text-slate-900">
                            Certyfikat akceptacji
                        </h3>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">
                                Oferta
                            </p>
                            <p className="text-sm text-slate-900 font-medium">
                                {offerNumber} — {offerTitle}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">
                                Data akceptacji
                            </p>
                            <p className="text-sm text-slate-900">
                                {formatDateTime(auditTrailData.acceptedAt)}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">
                                Cyfrowy odcisk treści (SHA-256)
                            </p>
                            <p className="text-xs text-emerald-700 font-mono break-all bg-emerald-50 p-2 rounded-lg mt-1">
                                {auditTrailData.contentHash}
                            </p>
                        </div>
                    </div>

                    <p className="text-xs text-slate-400 mt-4 leading-relaxed">
                        Ten hash jest unikalnym odciskiem cyfrowym treści oferty w momencie akceptacji.
                        Potwierdzenie zostało również wysłane na Twój adres email.
                    </p>
                </div>
            )}
        </div>
    );
}
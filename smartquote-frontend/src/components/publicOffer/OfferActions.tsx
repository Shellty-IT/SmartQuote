// src/components/publicOffer/OfferActions.tsx
'use client';

interface OfferActionsProps {
    onAccept: () => void;
    onReject: () => void;
}

export default function OfferActions({ onAccept, onReject }: OfferActionsProps) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex flex-col sm:flex-row gap-3">
                <button
                    onClick={onAccept}
                    className="flex-1 px-6 py-4 rounded-xl text-white font-semibold text-lg transition-colors flex items-center justify-center gap-3 hover:opacity-90"
                    style={{ backgroundColor: '#059669' }}
                >
                    <svg
                        className="w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                        />
                    </svg>
                    Akceptuję ofertę
                </button>

                <button
                    onClick={onReject}
                    className="flex-1 sm:flex-initial px-6 py-4 rounded-xl border-2 border-slate-200 text-slate-600 font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center justify-center gap-3"
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
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                    Odrzucam
                </button>
            </div>
        </div>
    );
}
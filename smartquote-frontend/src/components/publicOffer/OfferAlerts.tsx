// src/components/publicOffer/OfferAlerts.tsx
'use client';

interface ErrorAlertProps {
    message: string;
    onDismiss: () => void;
}

export function ErrorAlert({ message, onDismiss }: ErrorAlertProps) {
    return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <svg
                className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
            </svg>
            <div>
                <p className="text-sm font-medium text-red-800">{message}</p>
                <button
                    onClick={onDismiss}
                    className="text-xs text-red-600 hover:text-red-700 mt-1 underline"
                >
                    Zamknij
                </button>
            </div>
        </div>
    );
}

export function AuditTrailInfoAlert() {
    return (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
            <svg
                className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
            </svg>
            <div>
                <p className="text-sm font-medium text-emerald-800">
                    Oferta z formalnym potwierdzeniem
                </p>
                <p className="text-xs text-emerald-600 mt-1">
                    Przy akceptacji zostaniesz poproszony o podanie imienia i adresu email.
                    Otrzymasz potwierdzenie z cyfrowym odciskiem treści (SHA-256).
                </p>
            </div>
        </div>
    );
}
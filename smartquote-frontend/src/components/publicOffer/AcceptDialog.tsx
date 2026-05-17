// SmartQuote-AI/src/components/publicOffer/AcceptDialog.tsx
'use client';

import { useState } from 'react';

interface SelectedItem {
    readonly name: string;
    readonly quantity: number;
    readonly unit: string;
    readonly brutto: number;
}

export interface AcceptAuditData {
    readonly clientName: string;
    readonly clientEmail: string;
}

interface AcceptDialogProps {
    readonly isOpen: boolean;
    readonly onClose: () => void;
    readonly onConfirm: (auditData?: AcceptAuditData) => Promise<void>;
    readonly offerNumber: string;
    readonly clientName: string;
    readonly clientCompany: string | null;
    readonly selectedItems: SelectedItem[];
    readonly totalGross: number;
    readonly isLoading: boolean;
    readonly requireAuditTrail?: boolean;
    readonly primaryColor?: string;
}

function formatPLN(amount: number): string {
    return new Intl.NumberFormat('pl-PL', {
        style: 'currency',
        currency: 'PLN',
        minimumFractionDigits: 2,
    }).format(amount);
}

export default function AcceptDialog({
                                         isOpen,
                                         onClose,
                                         onConfirm,
                                         offerNumber,
                                         clientName,
                                         clientCompany,
                                         selectedItems,
                                         totalGross,
                                         isLoading,
                                         requireAuditTrail = false,
                                         primaryColor = '#0891b2',
                                     }: AcceptDialogProps) {
    const [confirmed, setConfirmed] = useState(false);
    const [auditName, setAuditName] = useState('');
    const [auditEmail, setAuditEmail] = useState('');

    if (!isOpen) return null;

    const handleClose = () => {
        if (isLoading) return;
        setConfirmed(false);
        setAuditName('');
        setAuditEmail('');
        onClose();
    };

    const isAuditValid = !requireAuditTrail || (auditName.trim().length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(auditEmail));

    const handleConfirm = async () => {
        if (!confirmed || isLoading || !isAuditValid) return;

        if (requireAuditTrail) {
            await onConfirm({
                clientName: auditName.trim(),
                clientEmail: auditEmail.trim(),
            });
        } else {
            await onConfirm();
        }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="accept-dialog-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={handleBackdropClick}
        >
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                aria-hidden="true"
            />

            <div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div>
                            <h2 id="accept-dialog-title" className="text-xl font-bold text-slate-900">
                                Potwierdzenie akceptacji
                            </h2>
                            <p className="text-sm text-slate-500">
                                Oferta {offerNumber}
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 mb-4">
                        <p className="text-xs uppercase tracking-wider text-slate-400 font-medium mb-1">
                            Akceptujący
                        </p>
                        <p className="font-medium text-slate-900">{clientName}</p>
                        {clientCompany && clientCompany !== clientName && (
                            <p className="text-sm text-slate-600">{clientCompany}</p>
                        )}
                    </div>

                    {requireAuditTrail && (
                        <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4 mb-4">
                            <div className="flex items-center gap-2 mb-3">
                                <svg className="w-4 h-4 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                <span className="text-sm font-medium text-cyan-800">
                                    Formalna akceptacja — potwierdź swoje dane
                                </span>
                            </div>
                            <p className="text-xs text-cyan-600 mb-3">
                                Ta oferta wymaga formalnego potwierdzenia. Twoje dane, adres IP i cyfrowy
                                odcisk treści (SHA-256) zostaną zapisane. Otrzymasz email z potwierdzeniem.
                            </p>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-cyan-800 mb-1">
                                        Imię i nazwisko *
                                    </label>
                                    <input
                                        type="text"
                                        value={auditName}
                                        onChange={(e) => setAuditName(e.target.value)}
                                        placeholder="Jan Kowalski"
                                        disabled={isLoading}
                                        className="w-full px-3 py-2 rounded-lg border border-cyan-300 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-cyan-800 mb-1">
                                        Adres email *
                                    </label>
                                    <input
                                        type="email"
                                        value={auditEmail}
                                        onChange={(e) => setAuditEmail(e.target.value)}
                                        placeholder="jan@firma.pl"
                                        disabled={isLoading}
                                        className="w-full px-3 py-2 rounded-lg border border-cyan-300 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50"
                                    />
                                    <p className="text-xs text-cyan-500 mt-1">
                                        Na ten adres wyślemy potwierdzenie z hashem cyfrowym
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-slate-50 rounded-xl p-4 mb-4">
                        <p className="text-xs uppercase tracking-wider text-slate-400 font-medium mb-3">
                            Wybrane pozycje
                        </p>
                        <div className="space-y-2">
                            {selectedItems.map((item, index) => (
                                <div key={index} className="flex justify-between items-center text-sm">
                                    <div className="flex-1 min-w-0">
                                        <span className="text-slate-900">{item.name}</span>
                                        <span className="text-slate-400 ml-2">
                                            ×{item.quantity} {item.unit}
                                        </span>
                                    </div>
                                    <span className="font-medium text-slate-900 ml-4 flex-shrink-0">
                                        {formatPLN(item.brutto)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-900 rounded-xl p-4 mb-6">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-300 font-medium">Kwota brutto</span>
                            <span
                                className="text-2xl font-bold"
                                style={{ color: primaryColor }}
                            >
                                {formatPLN(totalGross)}
                            </span>
                        </div>
                    </div>

                    <label className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl cursor-pointer mb-6">
                        <input
                            type="checkbox"
                            checked={confirmed}
                            onChange={(e) => setConfirmed(e.target.checked)}
                            disabled={isLoading}
                            className="mt-0.5 w-5 h-5 rounded border-amber-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span className="text-sm text-amber-900 leading-relaxed">
                            Potwierdzam akceptację niniejszej oferty i zapoznałem/am się z jej warunkami.
                            Rozumiem, że akceptacja jest wiążąca.
                            {requireAuditTrail && (
                                <> Wyrażam zgodę na zapisanie moich danych w celu potwierdzenia akceptacji.</>
                            )}
                        </span>
                    </label>

                    <div className="flex gap-3">
                        <button
                            onClick={handleClose}
                            disabled={isLoading}
                            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
                        >
                            Anuluj
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={!confirmed || isLoading || !isAuditValid}
                            className="flex-1 px-4 py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Przetwarzanie...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                    Zatwierdź akceptację
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
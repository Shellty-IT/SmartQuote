// src/components/publicOffer/RejectDialog.tsx
'use client';

import { useState } from 'react';

interface RejectDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason?: string) => Promise<void>;
    offerNumber: string;
    isLoading: boolean;
}

export default function RejectDialog({
                                         isOpen,
                                         onClose,
                                         onConfirm,
                                         offerNumber,
                                         isLoading,
                                     }: RejectDialogProps) {
    const [reason, setReason] = useState('');

    if (!isOpen) return null;

    const handleClose = () => {
        if (isLoading) return;
        setReason('');
        onClose();
    };

    const handleConfirm = async () => {
        if (isLoading) return;
        await onConfirm(reason.trim() || undefined);
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
            aria-labelledby="reject-dialog-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={handleBackdropClick}
        >
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                aria-hidden="true"
            />

            <div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <div>
                            <h2 id="reject-dialog-title" className="text-xl font-bold text-slate-900">
                                Odrzuć ofertę
                            </h2>
                            <p className="text-sm text-slate-500">
                                Oferta {offerNumber}
                            </p>
                        </div>
                    </div>

                    <p className="text-slate-600 mb-4">
                        Czy na pewno chcesz odrzucić tę ofertę? Sprzedawca zostanie o tym poinformowany.
                    </p>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Powód odrzucenia
                            <span className="text-slate-400 font-normal"> (opcjonalnie)</span>
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            disabled={isLoading}
                            placeholder="Np. za wysoka cena, inny termin realizacji..."
                            rows={3}
                            maxLength={1000}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none disabled:opacity-50"
                        />
                        <p className="text-xs text-slate-400 mt-1 text-right">
                            {reason.length}/1000
                        </p>
                    </div>

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
                            disabled={isLoading}
                            className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Odrzuć ofertę
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
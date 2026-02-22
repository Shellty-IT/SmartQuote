// SmartQuote-AI/src/components/publicOffer/AcceptDialog.tsx

'use client';

import { useState } from 'react';

interface SelectedItem {
    name: string;
    quantity: number;
    unit: string;
    brutto: number;
}

interface AcceptDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    offerNumber: string;
    clientName: string;
    clientCompany: string | null;
    selectedItems: SelectedItem[];
    totalGross: number;
    isLoading: boolean;
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
                                     }: AcceptDialogProps) {
    const [confirmed, setConfirmed] = useState(false);

    if (!isOpen) return null;

    const handleClose = () => {
        if (isLoading) return;
        setConfirmed(false);
        onClose();
    };

    const handleConfirm = async () => {
        if (!confirmed || isLoading) return;
        await onConfirm();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">
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
                            <span className="text-2xl font-bold text-cyan-400">
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
                            className="mt-0.5 w-5 h-5 rounded border-amber-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                        />
                        <span className="text-sm text-amber-900 leading-relaxed">
                            Potwierdzam akceptację niniejszej oferty i zapoznałem/am się z jej warunkami.
                            Rozumiem, że akceptacja jest wiążąca.
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
                            disabled={!confirmed || isLoading}
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
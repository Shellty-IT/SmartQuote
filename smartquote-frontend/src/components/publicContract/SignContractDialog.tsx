// src/components/publicContract/SignContractDialog.tsx
'use client';

import { useState, useRef } from 'react';
import SignaturePad, { SignaturePadRef } from './SignaturePad';

interface SignContractDialogProps {
    contractNumber: string;
    contractTitle: string;
    totalGross: number;
    currency: string;
    onSign: (data: { signerName: string; signerEmail: string; signatureImage: string }) => Promise<void>;
    onClose: () => void;
}

function formatCurrency(amount: number, currency: string = 'PLN'): string {
    return new Intl.NumberFormat('pl-PL', { style: 'currency', currency }).format(amount);
}

export default function SignContractDialog({
                                               contractNumber,
                                               contractTitle,
                                               totalGross,
                                               currency,
                                               onSign,
                                               onClose,
                                           }: SignContractDialogProps) {
    const [signerName, setSignerName] = useState('');
    const [signerEmail, setSignerEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const signaturePadRef = useRef<SignaturePadRef>(null);

    const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const canSubmit = signerName.trim().length >= 2 && isValidEmail(signerEmail) && !isSubmitting;

    const handleSubmit = async () => {
        if (!signaturePadRef.current) return;

        if (signaturePadRef.current.isEmpty()) {
            setError('Proszę złożyć podpis w polu powyżej');
            return;
        }

        if (signerName.trim().length < 2) {
            setError('Imię i nazwisko musi mieć minimum 2 znaki');
            return;
        }

        if (!isValidEmail(signerEmail)) {
            setError('Podaj prawidłowy adres email');
            return;
        }

        setError(null);
        setIsSubmitting(true);

        try {
            const signatureImage = signaturePadRef.current.toDataURL();
            await onSign({
                signerName: signerName.trim(),
                signerEmail: signerEmail.trim(),
                signatureImage,
            });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Wystąpił błąd podczas podpisywania';
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClear = () => {
        signaturePadRef.current?.clear();
        setError(null);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="sign-dialog-title"
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-6 pt-6 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-xl">
                            ✍️
                        </div>
                        <div>
                            <h2 id="sign-dialog-title" className="text-lg font-bold text-slate-900">
                                Podpisz umowę
                            </h2>
                            <p className="text-sm text-slate-500">{contractNumber}</p>
                        </div>
                    </div>
                    <p className="text-sm text-slate-600 mt-2">
                        {contractTitle} —{' '}
                        <span className="font-semibold text-emerald-600">
              {formatCurrency(totalGross, currency)}
            </span>
                    </p>
                </div>

                <div className="px-6 py-4 space-y-4">
                    {error && (
                        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="signer-name" className="block text-sm font-medium text-slate-700 mb-1">
                            Imię i nazwisko <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="signer-name"
                            type="text"
                            value={signerName}
                            onChange={(e) => setSignerName(e.target.value)}
                            placeholder="Jan Kowalski"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label htmlFor="signer-email" className="block text-sm font-medium text-slate-700 mb-1">
                            Email <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="signer-email"
                            type="email"
                            value={signerEmail}
                            onChange={(e) => setSignerEmail(e.target.value)}
                            placeholder="jan@firma.pl"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                        <p className="text-xs text-slate-400 mt-1">Na ten adres wyślemy potwierdzenie podpisu</p>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="block text-sm font-medium text-slate-700">
                                Podpis <span className="text-red-500">*</span>
                            </label>
                            <button
                                type="button"
                                onClick={handleClear}
                                className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
                            >
                                Wyczyść
                            </button>
                        </div>
                        <SignaturePad ref={signaturePadRef} />
                        <p className="text-xs text-slate-400 mt-1">Narysuj podpis myszką lub palcem na ekranie dotykowym</p>
                    </div>
                </div>

                <div className="px-6 pb-6 pt-2 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                        Anuluj
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        className="flex-1 px-4 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Podpisywanie...
                            </>
                        ) : (
                            'Zatwierdź podpis'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
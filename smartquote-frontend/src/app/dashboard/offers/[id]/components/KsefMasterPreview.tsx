// src/app/dashboard/offers/[id]/components/KsefMasterPreview.tsx

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button, Card } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { ksefApi } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import type { KsefPreviewData } from '@/types/ksef.types';

interface KsefMasterPreviewProps {
    isOpen: boolean;
    onClose: () => void;
    offerId: string;
    onSent: () => void;
}

export function KsefMasterPreview({ isOpen, onClose, offerId, onSent }: KsefMasterPreviewProps) {
    const toast = useToast();
    const backdropRef = useRef<HTMLDivElement>(null);

    const [preview, setPreview] = useState<KsefPreviewData | null>(null);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const [previewError, setPreviewError] = useState<string | null>(null);

    const [issueDate, setIssueDate] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [isSending, setIsSending] = useState(false);

    const loadPreview = useCallback(async () => {
        setIsLoadingPreview(true);
        setPreviewError(null);
        try {
            const data = await ksefApi.getPreview(offerId);
            setPreview(data);
            setIssueDate(data.suggestedIssueDate);
            setDueDate(data.suggestedDueDate);
        } catch (err) {
            setPreviewError(err instanceof Error ? err.message : 'Nie udało się pobrać danych');
        } finally {
            setIsLoadingPreview(false);
        }
    }, [offerId]);

    useEffect(() => {
        if (isOpen) {
            loadPreview();
        } else {
            setPreview(null);
            setPreviewError(null);
            setIssueDate('');
            setDueDate('');
        }
    }, [isOpen, loadPreview]);

    useEffect(() => {
        if (!isOpen) return;
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === backdropRef.current) {
            onClose();
        }
    };

    const handleSend = async () => {
        if (!preview || isSending) return;

        if (!issueDate || !dueDate) {
            toast.error('Błąd', 'Uzupełnij datę wystawienia i termin płatności');
            return;
        }

        if (new Date(dueDate) < new Date(issueDate)) {
            toast.error('Błąd', 'Termin płatności nie może być wcześniejszy niż data wystawienia');
            return;
        }

        setIsSending(true);
        try {
            await ksefApi.send({
                offerId,
                issueDate,
                dueDate,
            });
            toast.success(
                'Przesłano do KSeF Master',
                'Dane przesłane do KSeF Master. Faktura czeka w poczekalni.'
            );
            onSent();
            onClose();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Nie udało się przesłać danych';
            toast.error('Błąd wysyłki', message);
        } finally {
            setIsSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            ref={backdropRef}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ksef-preview-title"
        >
            <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto card-themed rounded-xl shadow-2xl">
                <div className="sticky top-0 z-10 card-themed border-b divider-themed px-6 py-4 flex items-center justify-between rounded-t-xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center">
                            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div>
                            <h2 id="ksef-preview-title" className="text-lg font-semibold text-themed">
                                Wystaw fakturę — KSeF Master
                            </h2>
                            <p className="text-xs text-themed-muted">
                                Podgląd danych przed przesłaniem
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-themed-muted hover:text-themed hover-themed rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {isLoadingPreview && (
                        <div className="flex items-center justify-center py-12">
                            <div className="flex items-center gap-3 text-themed-muted">
                                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Ładowanie danych…
                            </div>
                        </div>
                    )}

                    {previewError && (
                        <div className="rounded-lg bg-red-500/10 border border-red-500/25 p-4 text-center">
                            <p className="text-red-600 dark:text-red-400 text-sm">{previewError}</p>
                            <button
                                onClick={loadPreview}
                                className="mt-2 text-xs text-red-600 dark:text-red-400 underline hover:no-underline"
                            >
                                Spróbuj ponownie
                            </button>
                        </div>
                    )}

                    {preview && !isLoadingPreview && !previewError && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card className="p-4">
                                    <h3 className="text-sm font-semibold text-themed-muted mb-3 uppercase tracking-wider">
                                        Sprzedawca
                                    </h3>
                                    <p className="font-medium text-themed">{preview.seller.name}</p>
                                    <p className="text-sm text-themed-muted">NIP: {preview.seller.nip}</p>
                                    <p className="text-sm text-themed-muted">{preview.seller.address}</p>
                                    <p className="text-sm text-themed-muted">
                                        {preview.seller.postalCode} {preview.seller.city}
                                    </p>
                                    {!preview.seller.nip && (
                                        <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                            Brak NIP — uzupełnij w ustawieniach
                                        </p>
                                    )}
                                </Card>

                                <Card className="p-4">
                                    <h3 className="text-sm font-semibold text-themed-muted mb-3 uppercase tracking-wider">
                                        Nabywca
                                    </h3>
                                    <p className="font-medium text-themed">{preview.buyer.name}</p>
                                    <p className="text-sm text-themed-muted">NIP: {preview.buyer.nip}</p>
                                    <p className="text-sm text-themed-muted">{preview.buyer.address}</p>
                                    <p className="text-sm text-themed-muted">
                                        {preview.buyer.postalCode} {preview.buyer.city}
                                    </p>
                                    {!preview.buyer.nip && (
                                        <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                            Brak NIP — uzupełnij dane klienta
                                        </p>
                                    )}
                                </Card>
                            </div>

                            <Card className="p-4">
                                <h3 className="text-sm font-semibold text-themed-muted mb-3 uppercase tracking-wider">
                                    Daty faktury
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-themed mb-1">
                                            Data wystawienia
                                        </label>
                                        <input
                                            type="date"
                                            value={issueDate}
                                            onChange={(e) => setIssueDate(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border input-themed text-themed text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-themed mb-1">
                                            Termin płatności
                                        </label>
                                        <input
                                            type="date"
                                            value={dueDate}
                                            onChange={(e) => setDueDate(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border input-themed text-themed text-sm"
                                        />
                                    </div>
                                </div>
                                {dueDate && issueDate && new Date(dueDate) < new Date(issueDate) && (
                                    <p className="text-xs text-red-500 mt-2">
                                        Termin płatności nie może być wcześniejszy niż data wystawienia
                                    </p>
                                )}
                            </Card>

                            <Card className="p-4">
                                <h3 className="text-sm font-semibold text-themed-muted mb-3 uppercase tracking-wider">
                                    Pozycje ({preview.items.length})
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                        <tr className="border-b divider-themed">
                                            <th className="text-left py-2 pr-4 text-themed-muted font-medium">Nazwa</th>
                                            <th className="text-right py-2 px-2 text-themed-muted font-medium">Ilość</th>
                                            <th className="text-right py-2 px-2 text-themed-muted font-medium">Cena netto</th>
                                            <th className="text-right py-2 px-2 text-themed-muted font-medium">VAT</th>
                                            <th className="text-right py-2 pl-2 text-themed-muted font-medium">Brutto</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {preview.items.map((item, idx) => (
                                            <tr key={idx} className="border-b divider-themed last:border-0">
                                                <td className="py-2 pr-4">
                                                    <p className="text-themed font-medium">{item.name}</p>
                                                    {item.description && (
                                                        <p className="text-xs text-themed-muted mt-0.5">{item.description}</p>
                                                    )}
                                                </td>
                                                <td className="py-2 px-2 text-right text-themed-muted">
                                                    {item.quantity} {item.unit}
                                                </td>
                                                <td className="py-2 px-2 text-right text-themed">
                                                    {formatCurrency(item.unitPrice)}
                                                </td>
                                                <td className="py-2 px-2 text-right text-themed-muted">
                                                    {item.vatRate}%
                                                </td>
                                                <td className="py-2 pl-2 text-right font-medium text-themed">
                                                    {formatCurrency(item.totalGross)}
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-4 pt-3 border-t divider-themed flex justify-end">
                                    <div className="w-56 space-y-1.5">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-themed-muted">Netto:</span>
                                            <span className="text-themed">{formatCurrency(preview.offer.totalNet)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-themed-muted">VAT:</span>
                                            <span className="text-themed">{formatCurrency(preview.offer.totalVat)}</span>
                                        </div>
                                        <div className="flex justify-between text-base font-semibold pt-1.5 border-t divider-themed">
                                            <span className="text-themed">Brutto:</span>
                                            <span className="text-amber-600 dark:text-amber-400">
                                                {formatCurrency(preview.offer.totalGross)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <div className="rounded-lg bg-amber-500/10 border border-amber-500/25 p-4">
                                <div className="flex gap-3">
                                    <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div>
                                        <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                                            Dane zostaną przesłane do poczekalni KSeF Master
                                        </p>
                                        <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1">
                                            Faktura nie zostanie wystawiona automatycznie — wymaga zatwierdzenia w KSeF Master.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {preview && !isLoadingPreview && !previewError && (
                    <div className="sticky bottom-0 card-themed border-t divider-themed px-6 py-4 flex items-center justify-end gap-3 rounded-b-xl">
                        <Button variant="outline" onClick={onClose} disabled={isSending}>
                            Anuluj
                        </Button>
                        <Button
                            onClick={handleSend}
                            disabled={isSending || !preview.seller.nip || !preview.buyer.nip}
                            className="bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50"
                        >
                            {isSending ? (
                                <span className="flex items-center gap-2">
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Wysyłanie…
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                    Prześlij do KSeF Master
                                </span>
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
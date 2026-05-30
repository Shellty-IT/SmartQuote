// src/app/dashboard/offers/[id]/components/KsefMasterPreview.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { ksefApi } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { useTranslations } from '@/i18n';
import type { KsefPreviewData } from '@/types/ksef.types';

interface KsefMasterPreviewProps {
    isOpen: boolean;
    onClose: () => void;
    offerId: string;
    onSent: () => void;
}

export function KsefMasterPreview({ isOpen, onClose, offerId, onSent }: KsefMasterPreviewProps) {
    const toast = useToast();
    const tr = useTranslations('offerDetail');
    const commonTr = useTranslations('common');
    const k = tr.ksef;
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
        const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === backdropRef.current) onClose();
    };

    const handleSend = async () => {
        if (!preview || isSending) return;
        if (!issueDate || !dueDate) { toast.error(commonTr.errorTitle, tr.ksef.fillDates); return; }
        if (new Date(dueDate) < new Date(issueDate)) { toast.error(commonTr.errorTitle, tr.ksef.invalidPaymentDate); return; }

        setIsSending(true);
        try {
            await ksefApi.send({ offerId, issueDate, dueDate });
            toast.success(k.successTitle, k.successDesc);
            onSent();
            onClose();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Nie udało się przesłać danych';
            toast.error(commonTr.errorTitle, message);
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
            <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-border rounded-xl shadow-2xl">
                <div className="sticky top-0 z-10 bg-card border-border border-b border-border px-6 py-4 flex items-center justify-between rounded-t-xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[oklch(0.72_0.16_60)/15%] flex items-center justify-center">
                            <svg className="w-5 h-5 text-[oklch(0.55_0.14_60)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div>
                            <h2 id="ksef-preview-title" className="text-lg font-semibold text-foreground">{k.title}</h2>
                            <p className="text-xs text-muted-foreground">{k.subtitle}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-lg transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {isLoadingPreview && (
                        <div className="flex items-center justify-center py-12">
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                {k.loading}
                            </div>
                        </div>
                    )}

                    {previewError && (
                        <div className="rounded-lg bg-destructive/10 border border-destructive/25 p-4 text-center">
                            <p className="text-status-rejected text-sm">{previewError}</p>
                            <button onClick={loadPreview} className="mt-2 text-xs text-status-rejected underline hover:no-underline">{k.retry}</button>
                        </div>
                    )}

                    {preview && !isLoadingPreview && !previewError && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
                                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">{k.seller}</h3>
                                    <p className="font-medium text-foreground">{preview.seller.name}</p>
                                    <p className="text-sm text-muted-foreground">{k.nip} {preview.seller.nip}</p>
                                    <p className="text-sm text-muted-foreground">{preview.seller.address}</p>
                                    <p className="text-sm text-muted-foreground">{preview.seller.postalCode} {preview.seller.city}</p>
                                    {!preview.seller.nip && (
                                        <p className="text-xs text-destructive mt-2 flex items-center gap-1">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                            {k.noSellerNip}
                                        </p>
                                    )}
                                </div>
                                <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
                                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">{k.buyer}</h3>
                                    <p className="font-medium text-foreground">{preview.buyer.name}</p>
                                    <p className="text-sm text-muted-foreground">{k.nip} {preview.buyer.nip}</p>
                                    <p className="text-sm text-muted-foreground">{preview.buyer.address}</p>
                                    <p className="text-sm text-muted-foreground">{preview.buyer.postalCode} {preview.buyer.city}</p>
                                    {!preview.buyer.nip && (
                                        <p className="text-xs text-destructive mt-2 flex items-center gap-1">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                            {k.noBuyerNip}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
                                <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">{k.dates}</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">{k.issueDate}</label>
                                        <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">{k.paymentDue}</label>
                                        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm" />
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
                                <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">{k.items} ({preview.items.length})</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                        <tr className="border-b border-border">
                                            <th className="text-left py-2 pr-4 text-muted-foreground font-medium">{k.name}</th>
                                            <th className="text-right py-2 px-2 text-muted-foreground font-medium">{k.qty}</th>
                                            <th className="text-right py-2 px-2 text-muted-foreground font-medium">{k.netPrice}</th>
                                            <th className="text-right py-2 px-2 text-muted-foreground font-medium">{k.vat}</th>
                                            <th className="text-right py-2 pl-2 text-muted-foreground font-medium">{k.gross}</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {preview.items.map((item, idx) => (
                                            <tr key={idx} className="border-b border-border last:border-0">
                                                <td className="py-2 pr-4">
                                                    <p className="text-foreground font-medium">{item.name}</p>
                                                    {item.description && <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>}
                                                </td>
                                                <td className="py-2 px-2 text-right text-muted-foreground">{item.quantity} {item.unit}</td>
                                                <td className="py-2 px-2 text-right text-foreground">{formatCurrency(item.unitPrice)}</td>
                                                <td className="py-2 px-2 text-right text-muted-foreground">{item.vatRate}%</td>
                                                <td className="py-2 pl-2 text-right font-medium text-foreground">{formatCurrency(item.totalGross)}</td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="mt-4 pt-3 border-t border-border flex justify-end">
                                    <div className="w-56 space-y-1.5">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">{k.net}</span>
                                            <span className="text-foreground">{formatCurrency(preview.offer.totalNet)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">{k.vat}</span>
                                            <span className="text-foreground">{formatCurrency(preview.offer.totalVat)}</span>
                                        </div>
                                        <div className="flex justify-between text-base font-semibold pt-1.5 border-t border-border">
                                            <span className="text-foreground">{k.totalGross}</span>
                                            <span className="text-[oklch(0.55_0.14_60)]">{formatCurrency(preview.offer.totalGross)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-lg bg-[oklch(0.72_0.16_60)/10%] border border-amber-500/25 p-4">
                                <div className="flex gap-3">
                                    <svg className="w-5 h-5 text-[oklch(0.55_0.14_60)] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div>
                                        <p className="text-sm font-medium text-[oklch(0.55_0.14_60)] dark:text-[oklch(0.78_0.14_60)]">{k.footerNote}</p>
                                        <p className="text-xs text-[oklch(0.55_0.14_60)]/80 dark:text-[oklch(0.78_0.14_60)]/80 mt-1">{k.footerWarn}</p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {preview && !isLoadingPreview && !previewError && (
                    <div className="sticky bottom-0 bg-card border-border border-t border-border px-6 py-4 flex items-center justify-end gap-3 rounded-b-xl">
                        <Button variant="outline" onClick={onClose} disabled={isSending}>{k.cancel}</Button>
                        <Button onClick={handleSend} disabled={isSending || !preview.seller.nip || !preview.buyer.nip} className="bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50">
                            {isSending ? (
                                <span className="flex items-center gap-2">
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    {k.sending}
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                    {k.submit}
                                </span>
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

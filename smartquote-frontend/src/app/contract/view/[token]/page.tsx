// src/app/contract/view/[token]/page.tsx
'use client';

import { useState, useEffect, useCallback, use } from 'react';
import SignContractDialog from '@/components/publicContract/SignContractDialog';

interface PageProps {
    params: Promise<{ token: string }>;
}

interface PublicContractSeller {
    name: string | null;
    email: string | null;
    phone: string | null;
    nip: string | null;
    address: string | null;
    city: string | null;
    postalCode: string | null;
    website: string | null;
    logo: string | null;
}

interface PublicContractClient {
    name: string;
    company: string | null;
    email: string | null;
    phone: string | null;
    nip: string | null;
    address: string | null;
    city: string | null;
    postalCode: string | null;
}

interface PublicContractItem {
    id: string;
    name: string;
    description: string | null;
    quantity: number;
    unit: string;
    unitPrice: number;
    vatRate: number;
    discount: number;
    totalNet: number;
    totalVat: number;
    totalGross: number;
    position: number;
}

interface PublicContractSignatureLog {
    signerName: string;
    signerEmail: string;
    signedAt: string;
    contentHash: string;
    signatureImage: string;
    ipAddress: string;
}

interface PublicContractData {
    contract: {
        id: string;
        number: string;
        title: string;
        description: string | null;
        status: string;
        totalNet: number;
        totalVat: number;
        totalGross: number;
        currency: string;
        startDate: string | null;
        endDate: string | null;
        signedAt: string | null;
        terms: string | null;
        paymentTerms: string | null;
        paymentDays: number;
        createdAt: string;
        items: PublicContractItem[];
        client: PublicContractClient;
        seller: PublicContractSeller;
        signatureLog: PublicContractSignatureLog | null;
    };
}

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

const statusLabels: Record<string, { label: string; color: string; bg: string }> = {
    DRAFT: { label: 'Szkic', color: 'text-slate-600', bg: 'bg-slate-100' },
    PENDING_SIGNATURE: { label: 'Do podpisu', color: 'text-amber-700', bg: 'bg-amber-100' },
    ACTIVE: { label: 'Aktywna', color: 'text-emerald-700', bg: 'bg-emerald-100' },
    COMPLETED: { label: 'Zakończona', color: 'text-blue-700', bg: 'bg-blue-100' },
    TERMINATED: { label: 'Rozwiązana', color: 'text-red-700', bg: 'bg-red-100' },
    EXPIRED: { label: 'Wygasła', color: 'text-orange-700', bg: 'bg-orange-100' },
};

function formatCurrency(amount: number, currency: string = 'PLN'): string {
    return new Intl.NumberFormat('pl-PL', { style: 'currency', currency }).format(amount);
}

function formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('pl-PL', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatDateTime(dateStr: string | null): string {
    if (!dateStr) return '—';
    const dt = new Date(dateStr);
    return dt.toLocaleDateString('pl-PL', { year: 'numeric', month: 'long', day: 'numeric' }) +
        ', ' + dt.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function PublicContractPage({ params }: PageProps) {
    const { token } = use(params);

    const [data, setData] = useState<PublicContractData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadError, setDownloadError] = useState<string | null>(null);
    const [showSignDialog, setShowSignDialog] = useState(false);
    const [signSuccess, setSignSuccess] = useState(false);
    const [hashCopied, setHashCopied] = useState(false);
    const [copyError, setCopyError] = useState(false);

    const loadContract = useCallback(async (showSpinner = true) => {
        if (showSpinner) setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_URL}/api/public/contracts/${token}`, {
                headers: { 'Content-Type': 'application/json' },
            });
            const json = await response.json();
            if (!response.ok) {
                if (response.status === 404) {
                    setError('NOT_FOUND');
                } else {
                    setError(json.error?.message || 'Błąd serwera');
                }
                return;
            }
            setData(json.data);
        } catch {
            setError('Nie udało się załadować umowy');
        } finally {
            if (showSpinner) setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (token) loadContract(true);
    }, [token, loadContract]);

    const handleSign = async (signData: { signerName: string; signerEmail: string; signatureImage: string }) => {
        const response = await fetch(`${API_URL}/api/public/contracts/${token}/sign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(signData),
        });
        const json = await response.json();
        if (!response.ok) {
            throw new Error(json.error?.message || 'Błąd podpisywania umowy');
        }
        setShowSignDialog(false);
        setSignSuccess(true);
        await loadContract(false);
        setTimeout(() => setSignSuccess(false), 8000);
    };

    const handleDownloadPdf = async () => {
        setIsDownloading(true);
        setDownloadError(null);
        try {
            const response = await fetch(`${API_URL}/api/public/contracts/${token}/pdf`);
            if (!response.ok) throw new Error('Nie udało się pobrać dokumentu PDF');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `umowa-${data?.contract.number.replace(/\//g, '-') || 'document'}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setDownloadError(err instanceof Error ? err.message : 'Wystąpił błąd podczas pobierania PDF');
        } finally {
            setIsDownloading(false);
        }
    };

    const handleCopyHash = async (hash: string) => {
        setCopyError(false);
        try {
            await navigator.clipboard.writeText(hash);
            setHashCopied(true);
            setTimeout(() => setHashCopied(false), 2000);
        } catch {
            setCopyError(true);
            setTimeout(() => setCopyError(false), 3000);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-24">
                <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mb-6" />
                <p className="text-slate-500 text-lg">Ładowanie umowy...</p>
            </div>
        );
    }

    if (error === 'NOT_FOUND' || !data) {
        return (
            <div className="max-w-md mx-auto text-center py-24">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center">
                    <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-3">Umowa nie znaleziona</h1>
                <p className="text-slate-500">Link do umowy jest nieprawidłowy, nieaktywny lub umowa została usunięta.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-md mx-auto text-center py-24">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
                    <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-3">Wystąpił błąd</h1>
                <p className="text-slate-500 mb-6">{error}</p>
                <button onClick={() => loadContract(true)} className="px-6 py-3 bg-emerald-500 text-white font-medium rounded-xl hover:bg-emerald-600 transition-colors">
                    Spróbuj ponownie
                </button>
            </div>
        );
    }

    const { contract } = data;
    const status = statusLabels[contract.status] || statusLabels.DRAFT;
    const isTerminal = contract.status === 'TERMINATED' || contract.status === 'EXPIRED';
    const canSign = contract.status === 'PENDING_SIGNATURE' && !contract.signatureLog;

    return (
        <div className="space-y-6">
            {signSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-xl flex-shrink-0">
                        ✅
                    </div>
                    <div>
                        <p className="font-semibold text-emerald-800">Umowa została podpisana!</p>
                        <p className="text-sm text-emerald-600">Potwierdzenie zostanie wysłane na podany adres email.</p>
                    </div>
                </div>
            )}

            {isTerminal && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                        </svg>
                    </div>
                    <div>
                        <p className="font-semibold text-red-800">
                            {contract.status === 'TERMINATED' ? 'Ta umowa została rozwiązana' : 'Ta umowa wygasła'}
                        </p>
                        <p className="text-sm text-red-600">Dokument ma charakter archiwalny.</p>
                    </div>
                </div>
            )}

            {downloadError && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold text-red-800">Błąd pobierania PDF</p>
                        <p className="text-sm text-red-600">{downloadError}</p>
                    </div>
                    <button
                        onClick={() => setDownloadError(null)}
                        className="p-1 text-red-400 hover:text-red-600 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            {contract.seller.logo && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={contract.seller.logo} alt="" className="w-10 h-10 rounded-lg bg-white/20 object-contain" />
                            )}
                            <div>
                                <p className="text-white/80 text-sm">{contract.seller.name || 'SmartQuote'}</p>
                                <p className="text-white font-bold text-lg">UMOWA</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-white/80 text-sm">Nr {contract.number}</p>
                            <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                                {status.label}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <h1 className="text-xl font-bold text-slate-900 mb-2">{contract.title}</h1>
                    {contract.description && (
                        <p className="text-slate-600 text-sm mb-4">{contract.description}</p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
                        <div className="bg-slate-50 rounded-xl p-4">
                            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Wykonawca</h3>
                            <p className="font-semibold text-slate-900">{contract.seller.name}</p>
                            {contract.seller.nip && <p className="text-sm text-slate-600">NIP: {contract.seller.nip}</p>}
                            {contract.seller.address && <p className="text-sm text-slate-600">{contract.seller.address}</p>}
                            {contract.seller.city && <p className="text-sm text-slate-600">{contract.seller.postalCode} {contract.seller.city}</p>}
                            {contract.seller.email && <p className="text-sm text-slate-600 mt-1">{contract.seller.email}</p>}
                            {contract.seller.phone && <p className="text-sm text-slate-600">{contract.seller.phone}</p>}
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4">
                            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Zleceniodawca</h3>
                            <p className="font-semibold text-slate-900">{contract.client.name}</p>
                            {contract.client.company && <p className="text-sm text-slate-600">{contract.client.company}</p>}
                            {contract.client.nip && <p className="text-sm text-slate-600">NIP: {contract.client.nip}</p>}
                            {contract.client.address && <p className="text-sm text-slate-600">{contract.client.address}</p>}
                            {contract.client.city && <p className="text-sm text-slate-600">{contract.client.postalCode} {contract.client.city}</p>}
                            {contract.client.email && <p className="text-sm text-slate-600 mt-1">{contract.client.email}</p>}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                        <p className="text-xs font-medium text-slate-400 uppercase">Data zawarcia</p>
                        <p className="text-sm font-semibold text-slate-900 mt-1">{formatDate(contract.createdAt)}</p>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-400 uppercase">Obowiązuje od</p>
                        <p className="text-sm font-semibold text-slate-900 mt-1">{formatDate(contract.startDate)}</p>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-400 uppercase">Obowiązuje do</p>
                        <p className="text-sm font-semibold text-slate-900 mt-1">{formatDate(contract.endDate)}</p>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-400 uppercase">Data podpisania</p>
                        <p className={`text-sm font-semibold mt-1 ${contract.signedAt ? 'text-emerald-600' : 'text-slate-900'}`}>
                            {formatDate(contract.signedAt)}
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                    <h2 className="text-lg font-semibold text-slate-900">Pozycje umowy</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Lp.</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Nazwa</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Ilość</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Cena</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">VAT</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Brutto</th>
                        </tr>
                        </thead>
                        <tbody>
                        {contract.items.map((item, idx) => (
                            <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                <td className="px-6 py-3 text-sm text-slate-500">{idx + 1}</td>
                                <td className="px-6 py-3">
                                    <p className="text-sm font-medium text-slate-900">{item.name}</p>
                                    {item.description && <p className="text-xs text-slate-500">{item.description}</p>}
                                </td>
                                <td className="px-6 py-3 text-right text-sm text-slate-900">{item.quantity} {item.unit}</td>
                                <td className="px-6 py-3 text-right text-sm text-slate-900">{formatCurrency(item.unitPrice)}</td>
                                <td className="px-6 py-3 text-right text-sm text-slate-900">{item.vatRate}%</td>
                                <td className="px-6 py-3 text-right text-sm font-semibold text-slate-900">{formatCurrency(item.totalGross)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Suma netto:</span>
                        <span className="font-medium text-slate-900">{formatCurrency(contract.totalNet, contract.currency)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">VAT:</span>
                        <span className="font-medium text-slate-900">{formatCurrency(contract.totalVat, contract.currency)}</span>
                    </div>
                    <div className="flex justify-between text-base pt-2 border-t border-slate-200">
                        <span className="font-bold text-slate-900">RAZEM BRUTTO:</span>
                        <span className="font-bold text-emerald-600 text-lg">{formatCurrency(contract.totalGross, contract.currency)}</span>
                    </div>
                </div>
            </div>

            {contract.terms && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Warunki umowy</h3>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{contract.terms}</p>
                </div>
            )}

            {contract.paymentTerms && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Warunki płatności</h3>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{contract.paymentTerms}</p>
                    <p className="text-sm text-slate-500 mt-2">Termin płatności: <span className="font-medium text-slate-700">{contract.paymentDays} dni</span></p>
                </div>
            )}

            {contract.signatureLog && (
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 overflow-hidden">
                    <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-lg">✍️</div>
                            <div>
                                <h3 className="text-white font-bold">Podpis elektroniczny</h3>
                                <p className="text-emerald-100 text-xs">Certyfikat podpisu umowy</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 space-y-5">
                        <div className="bg-white rounded-xl border border-emerald-100 p-4 flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={contract.signatureLog.signatureImage}
                                alt="Podpis elektroniczny"
                                className="max-w-[300px] max-h-[120px] object-contain"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-medium text-slate-400 uppercase">Podpisujący</p>
                                <p className="text-sm font-semibold text-slate-900 mt-1">{contract.signatureLog.signerName}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-400 uppercase">Email</p>
                                <p className="text-sm font-semibold text-slate-900 mt-1">{contract.signatureLog.signerEmail}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-400 uppercase">Data podpisu</p>
                                <p className="text-sm font-semibold text-emerald-700 mt-1">{formatDateTime(contract.signatureLog.signedAt)}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-400 uppercase">Adres IP</p>
                                <p className="text-sm font-semibold text-slate-900 mt-1">{contract.signatureLog.ipAddress}</p>
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-medium text-slate-400 uppercase mb-2">Content Hash (SHA-256)</p>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 text-xs bg-slate-900 text-emerald-400 px-4 py-3 rounded-xl font-mono break-all leading-relaxed">
                                    {contract.signatureLog.contentHash}
                                </code>
                                <button
                                    onClick={() => handleCopyHash(contract.signatureLog!.contentHash)}
                                    className="flex-shrink-0 p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors relative"
                                    title="Kopiuj hash"
                                >
                                    {hashCopied ? (
                                        <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : copyError ? (
                                        <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            {copyError && (
                                <p className="text-xs text-red-500 mt-1">Nie udało się skopiować. Zaznacz hash ręcznie.</p>
                            )}
                            <p className="text-xs text-slate-400 mt-2">
                                Ten hash jest unikalnym odciskiem cyfrowym treści umowy w momencie podpisu.
                                Każda zmiana w treści generowałaby inny hash — co potwierdza integralność dokumentu.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex flex-col sm:flex-row gap-3">
                    {canSign && (
                        <button
                            onClick={() => setShowSignDialog(true)}
                            className="flex-1 px-6 py-4 rounded-xl bg-emerald-600 text-white font-semibold text-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-3"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                            Podpisz umowę
                        </button>
                    )}
                    <button
                        onClick={handleDownloadPdf}
                        disabled={isDownloading}
                        className={`${canSign ? 'flex-1 sm:flex-initial' : 'flex-1'} px-6 py-4 rounded-xl ${
                            canSign
                                ? 'border-2 border-slate-200 text-slate-600 font-medium hover:bg-slate-50 hover:border-slate-300'
                                : 'bg-emerald-600 text-white font-semibold text-lg hover:bg-emerald-700'
                        } disabled:opacity-50 transition-colors flex items-center justify-center gap-3`}
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {isDownloading
                            ? 'Generowanie PDF...'
                            : contract.signatureLog
                                ? 'Pobierz umowę z podpisem (PDF)'
                                : 'Pobierz umowę (PDF)'}
                    </button>
                    {contract.seller.email && (
                        <a
                            href={`mailto:${contract.seller.email}?subject=Umowa ${contract.number}`}
                            className="flex-1 sm:flex-initial px-6 py-4 rounded-xl border-2 border-slate-200 text-slate-600 font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center justify-center gap-3"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Kontakt z wykonawcą
                        </a>
                    )}
                </div>
            </div>

            {showSignDialog && (
                <SignContractDialog
                    contractNumber={contract.number}
                    contractTitle={contract.title}
                    totalGross={contract.totalGross}
                    currency={contract.currency}
                    onSign={handleSign}
                    onClose={() => setShowSignDialog(false)}
                />
            )}
        </div>
    );
}
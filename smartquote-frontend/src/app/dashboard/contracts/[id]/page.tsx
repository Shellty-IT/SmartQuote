// src/app/dashboard/contracts/[id]/page.tsx
'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useContract } from '@/hooks/useContracts';
import { contractsApi } from '@/lib/api';
import { Button, ConfirmDialog } from '@/components/ui';
import StatusBadge from '@/components/ui/StatusBadge';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatCurrency, formatDate, getContractStatusConfig } from '@/lib/utils';
import { useToast } from '@/contexts/ToastContext';
import type { ContractStatus } from '@/types';

interface PageProps {
    params: Promise<{ id: string }>;
}

const MAIN_STEPS: { status: ContractStatus; label: string }[] = [
    { status: 'DRAFT', label: 'Szkic' },
    { status: 'PENDING_SIGNATURE', label: 'Do podpisu' },
    { status: 'ACTIVE', label: 'Aktywna' },
    { status: 'COMPLETED', label: 'Zakończona' },
];

const STATUS_ACTIONS: Record<ContractStatus, { next: ContractStatus; label: string; description: string; variant: 'primary' | 'outline' | 'danger' }[]> = {
    DRAFT: [
        { next: 'PENDING_SIGNATURE', label: 'Wyślij do podpisu', description: 'Oznacz umowę jako wysłaną do klienta do podpisu', variant: 'primary' },
    ],
    PENDING_SIGNATURE: [
        { next: 'ACTIVE', label: 'Oznacz jako podpisaną', description: 'Klient podpisał umowę — aktywuj ją', variant: 'primary' },
        { next: 'TERMINATED', label: 'Anuluj umowę', description: 'Klient nie podpisał — anuluj umowę', variant: 'danger' },
    ],
    ACTIVE: [
        { next: 'COMPLETED', label: 'Zakończ umowę', description: 'Umowa została zrealizowana pomyślnie', variant: 'primary' },
        { next: 'TERMINATED', label: 'Rozwiąż umowę', description: 'Rozwiąż umowę przedterminowo', variant: 'danger' },
    ],
    COMPLETED: [],
    TERMINATED: [],
    EXPIRED: [],
};

function StatusTimeline({ currentStatus }: { currentStatus: ContractStatus }) {
    const isTerminal = currentStatus === 'TERMINATED' || currentStatus === 'EXPIRED';
    const currentIndex = MAIN_STEPS.findIndex(s => s.status === currentStatus);

    return (
        <div className="w-full">
            <div className="flex items-center">
                {MAIN_STEPS.map((step, index) => {
                    const isCompleted = !isTerminal && currentIndex > index;
                    const isCurrent = currentStatus === step.status;

                    return (
                        <div key={step.status} className="flex items-center flex-1 last:flex-none">
                            <div className="flex flex-col items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                                    isCompleted
                                        ? 'bg-status-accepted border-status-accepted text-white'
                                        : isCurrent
                                            ? 'bg-primary border-primary text-white ring-4 ring-primary/20'
                                            : isTerminal
                                                ? 'border-destructive/30 text-destructive bg-destructive/5'
                                                : 'border-border text-muted-foreground'
                                } ${isTerminal && !isCompleted && !isCurrent ? 'opacity-50' : ''}`}
                                     style={!isCompleted && !isCurrent && !isTerminal ? { borderColor: 'var(--border)', backgroundColor: 'var(--card)' } : undefined}
                                >
                                    {isCompleted ? (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        <span>{index + 1}</span>
                                    )}
                                </div>
                                <span className={`text-xs mt-2 font-medium text-center whitespace-nowrap ${
                                    isCompleted ? 'text-status-accepted' : isCurrent ? 'text-primary' : 'text-muted-foreground'
                                }`}>
                                    {step.label}
                                </span>
                            </div>

                            {index < MAIN_STEPS.length - 1 && (
                                <div className={`flex-1 h-0.5 mx-2 mt-[-1.25rem] rounded-full ${
                                    isCompleted ? 'bg-status-accepted' : ''
                                }`}
                                     style={!isCompleted ? { backgroundColor: 'var(--border)' } : undefined}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            {isTerminal && (
                <div className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20">
                    <svg className="w-5 h-5 text-destructive flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="text-sm font-medium text-destructive">
                        {currentStatus === 'TERMINATED' ? 'Umowa została rozwiązana' : 'Umowa wygasła'}
                    </span>
                </div>
            )}
        </div>
    );
}

export default function ContractDetailsPage({ params }: PageProps) {
    const { id } = use(params);
    const toast = useToast();
    const { contract, loading, error, refetch } = useContract(id);
    const [statusConfirm, setStatusConfirm] = useState<{ next: ContractStatus; label: string; description: string } | null>(null);
    const [isChangingStatus, setIsChangingStatus] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);

    const handleStatusChange = async () => {
        if (!statusConfirm || !contract) return;
        setIsChangingStatus(true);
        try {
            await contractsApi.updateStatus(contract.id, statusConfirm.next);
            const newStatusConfig = getContractStatusConfig(statusConfirm.next);
            toast.success('Status zmieniony', `Umowa: ${newStatusConfig.label}`);
            setStatusConfirm(null);
            await refetch();
        } catch {
            toast.error('Błąd', 'Nie udało się zmienić statusu umowy');
        } finally {
            setIsChangingStatus(false);
        }
    };

    const handleDownloadPdf = async () => {
        if (!contract) return;
        setIsDownloading(true);
        try {
            const blob = await contractsApi.downloadPdf(contract.id);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `umowa-${contract.number.replace(/\//g, '-')}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            toast.success('PDF pobrany', `Umowa ${contract.number}`);
        } catch {
            toast.error('Błąd PDF', 'Nie udało się pobrać dokumentu');
        } finally {
            setIsDownloading(false);
        }
    };

    const handlePublish = async () => {
        if (!contract) return;
        setIsPublishing(true);
        try {
            await contractsApi.publish(contract.id);
            toast.success('Link opublikowany', 'Możesz teraz udostępnić link klientowi');
            await refetch();
        } catch {
            toast.error('Błąd', 'Nie udało się opublikować linku');
        } finally {
            setIsPublishing(false);
        }
    };

    const handleUnpublish = async () => {
        if (!contract) return;
        setIsPublishing(true);
        try {
            await contractsApi.unpublish(contract.id);
            toast.success('Link dezaktywowany', 'Link publiczny został wyłączony');
            await refetch();
        } catch {
            toast.error('Błąd', 'Nie udało się dezaktywować linku');
        } finally {
            setIsPublishing(false);
        }
    };

    const handleCopyLink = async () => {
        if (!contract?.publicToken) return;
        const frontendUrl = (process.env.NEXT_PUBLIC_FRONTEND_URL || window.location.origin).replace(/\/$/, '');
        const url = `${frontendUrl}/contract/view/${contract.publicToken}`;
        try {
            await navigator.clipboard.writeText(url);
            toast.info('Skopiowano', 'Link skopiowany do schowka');
        } catch {
            toast.error('Błąd', 'Nie udało się skopiować linku');
        }
    };

    const handleCopyHash = async () => {
        if (!contract?.signatureLog?.contentHash) return;
        try {
            await navigator.clipboard.writeText(contract.signatureLog.contentHash);
            toast.info('Skopiowano', 'Hash skopiowany do schowka');
        } catch {
            toast.error('Błąd', 'Nie udało się skopiować hasha');
        }
    };

    if (loading) return <PageLoader />;

    if (error || !contract) {
        return (
            <div className="p-8 text-center">
                <div className="w-16 h-16 bg-surface-subtle rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <p className="text-muted-foreground mb-4">{error || 'Umowa nie znaleziona'}</p>
                <Link href="/dashboard/contracts">
                    <Button variant="outline">Wróć do listy</Button>
                </Link>
            </div>
        );
    }

    const statusConfig = getContractStatusConfig(contract.status);
    const availableActions = STATUS_ACTIONS[contract.status] || [];
    const hasPublicLink = !!contract.publicToken;

    return (
        <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-8 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/contracts">
                        <button className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition hover:text-foreground">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="mt-0.5 text-3xl font-bold tracking-tight font-mono">{contract.number}</h1>
                            <StatusBadge status={contract.status} />
                        </div>
                        <p className="text-muted-foreground mt-1">{contract.title}</p>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Status umowy</h3>
                <StatusTimeline currentStatus={contract.status} />
            </div>

            {availableActions.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Dostępne akcje</h3>
                    <div className="flex flex-wrap gap-3">
                        {availableActions.map((action) => (
                            <div key={action.next} className="flex items-center gap-3">
                                <Button
                                    variant={action.variant}
                                    onClick={() => setStatusConfirm({ next: action.next, label: action.label, description: action.description })}
                                >
                                    {action.variant === 'primary' ? (
                                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    )}
                                    {action.label}
                                </Button>
                                <span className="text-sm text-muted-foreground hidden sm:inline">{action.description}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="rounded-2xl border border-border bg-card shadow-card">
                        <div className="px-6 py-4 border-b border-border">
                            <h2 className="text-lg font-semibold text-foreground">Szczegóły umowy</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            {contract.description && (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Opis</label>
                                    <p className="mt-1 text-foreground">{contract.description}</p>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Data rozpoczęcia</label>
                                    <p className="mt-1 text-foreground">{contract.startDate ? formatDate(contract.startDate) : '—'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Data zakończenia</label>
                                    <p className="mt-1 text-foreground">{contract.endDate ? formatDate(contract.endDate) : '—'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Data podpisania</label>
                                    <p className={`mt-1 ${contract.signedAt ? 'text-status-accepted font-medium' : 'text-foreground'}`}>
                                        {contract.signedAt ? formatDate(contract.signedAt) : '—'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Termin płatności</label>
                                    <p className="mt-1 text-foreground">{contract.paymentDays} dni</p>
                                </div>
                            </div>
                            {contract.terms && (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Warunki umowy</label>
                                    <p className="mt-1 text-foreground whitespace-pre-wrap">{contract.terms}</p>
                                </div>
                            )}
                            {contract.offerId && (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Utworzona z oferty</label>
                                    <Link href={`/dashboard/offers/${contract.offerId}`} className="mt-1 text-primary hover:text-primary hover:underline block">
                                        {contract.offer?.number || contract.offerId} →
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-card shadow-card">
                        <div className="px-6 py-4 border-b border-border">
                            <h2 className="text-lg font-semibold text-foreground">Pozycje umowy</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-surface-subtle border-b border-border">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Nazwa</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Ilość</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Cena jedn.</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">VAT</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Brutto</th>
                                </tr>
                                </thead>
                                <tbody>
                                {contract.items.map((item) => (
                                    <tr key={item.id} className="border-b border-border">
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-foreground">{item.name}</p>
                                            {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm text-foreground">{Number(item.quantity)} {item.unit}</td>
                                        <td className="px-6 py-4 text-right text-sm text-foreground">{formatCurrency(Number(item.unitPrice))}</td>
                                        <td className="px-6 py-4 text-right text-sm text-foreground">{Number(item.vatRate)}%</td>
                                        <td className="px-6 py-4 text-right text-sm font-medium text-foreground">{formatCurrency(Number(item.totalGross))}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-6 py-4 bg-surface-subtle border-t border-border space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Suma netto:</span>
                                <span className="text-foreground font-medium">{formatCurrency(Number(contract.totalNet))}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">VAT:</span>
                                <span className="text-foreground font-medium">{formatCurrency(Number(contract.totalVat))}</span>
                            </div>
                            <div className="flex justify-between text-base pt-2 border-t border-border">
                                <span className="text-foreground font-bold">RAZEM BRUTTO:</span>
                                <span className="text-primary font-bold text-lg">{formatCurrency(Number(contract.totalGross), contract.currency)}</span>
                            </div>
                        </div>
                    </div>

                    {(contract.signatureLog || contract.status === 'PENDING_SIGNATURE') && (
                        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
                            <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-white">Podpis elektroniczny</h2>
                                        <p className="text-sm text-emerald-100">
                                            {contract.signatureLog
                                                ? 'Certyfikat podpisu cyfrowego'
                                                : 'Oczekuje na podpis klienta'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {contract.signatureLog ? (
                                <div className="p-6 space-y-5">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground">Podpisujący</label>
                                            <p className="mt-1 text-sm font-medium text-foreground">{contract.signatureLog.signerName}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground">Email podpisującego</label>
                                            <p className="mt-1 text-sm text-foreground">{contract.signatureLog.signerEmail}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground">Data podpisu</label>
                                            <p className="mt-1 text-sm text-status-accepted font-medium">{formatDate(contract.signatureLog.signedAt)}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground">Adres IP</label>
                                            <p className="mt-1 text-sm font-mono text-foreground">{contract.signatureLog.ipAddress}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground mb-2 block">Podpis</label>
                                        <div className="border border-border rounded-lg p-4 bg-white flex items-center justify-center">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={contract.signatureLog.signatureImage}
                                                alt="Podpis elektroniczny"
                                                className="max-h-24 max-w-full object-contain"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground mb-2 block">Hash SHA-256</label>
                                        <div className="flex items-start gap-2">
                                            <code className="flex-1 text-xs font-mono break-all p-3 rounded-lg bg-surface-subtle text-foreground">
                                                {contract.signatureLog.contentHash}
                                            </code>
                                            <button
                                                onClick={handleCopyHash}
                                                className="flex-shrink-0 p-2 rounded-lg hover:bg-secondary/60 transition-colors"
                                                title="Kopiuj hash"
                                            >
                                                <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground">Przeglądarka</label>
                                        <p className="mt-1 text-xs text-muted-foreground break-all">{contract.signatureLog.userAgent}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 text-center">
                                    <div className="w-16 h-16 rounded-full bg-[oklch(0.72_0.16_60)/10%]0/10 flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-sm font-semibold text-foreground mb-1">Oczekuje na podpis</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Klient nie podpisał jeszcze umowy elektronicznie.
                                        {hasPublicLink && ' Udostępnij link publiczny, aby klient mógł podpisać.'}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="rounded-2xl border border-border bg-card shadow-card">
                        <div className="px-6 py-4 border-b border-border">
                            <h2 className="text-lg font-semibold text-foreground">Klient</h2>
                        </div>
                        <div className="p-6 space-y-3">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white text-sm font-semibold">
                                    {contract.client.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-medium text-foreground">{contract.client.name}</p>
                                    {contract.client.company && <p className="text-sm text-muted-foreground">{contract.client.company}</p>}
                                </div>
                            </div>
                            {contract.client.email && (
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground">Email</label>
                                    <p className="text-sm text-foreground">{contract.client.email}</p>
                                </div>
                            )}
                            {contract.client.phone && (
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground">Telefon</label>
                                    <p className="text-sm text-foreground">{contract.client.phone}</p>
                                </div>
                            )}
                            {contract.client.nip && (
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground">NIP</label>
                                    <p className="text-sm text-foreground">{contract.client.nip}</p>
                                </div>
                            )}
                            <Link href={`/dashboard/clients/${contract.client.id}`}>
                                <Button variant="outline" size="sm" className="w-full mt-4">Zobacz profil klienta</Button>
                            </Link>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-card shadow-card">
                        <div className="px-6 py-4 border-b border-border">
                            <h2 className="text-lg font-semibold text-foreground">Dystrybucja</h2>
                        </div>
                        <div className="p-6 space-y-3">
                            {hasPublicLink ? (
                                <>
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-status-accepted/15 text-status-accepted border border-status-accepted/25 rounded-full">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                            </svg>
                                            Link aktywny
                                        </span>
                                    </div>
                                    <Button variant="outline" className="w-full" onClick={handleCopyLink}>
                                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                        Kopiuj link dla klienta
                                    </Button>
                                    <Button variant="outline" className="w-full text-destructive hover:bg-destructive/10" onClick={handleUnpublish} disabled={isPublishing}>
                                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                        </svg>
                                        Dezaktywuj link
                                    </Button>
                                </>
                            ) : (
                                <Button className="w-full" onClick={handlePublish} disabled={isPublishing}>
                                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                    </svg>
                                    {isPublishing ? 'Generowanie...' : 'Wygeneruj link publiczny'}
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-card shadow-card">
                        <div className="px-6 py-4 border-b border-border">
                            <h2 className="text-lg font-semibold text-foreground">Akcje</h2>
                        </div>
                        <div className="p-6 space-y-3">
                            <Link href={`/dashboard/contracts/${contract.id}/edit`}>
                                <Button variant="outline" className="w-full">
                                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                    Edytuj umowę
                                </Button>
                            </Link>
                            <Button variant="outline" className="w-full" onClick={handleDownloadPdf} disabled={isDownloading}>
                                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {isDownloading ? 'Generowanie...' : 'Pobierz PDF'}
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-card shadow-card">
                        <div className="px-6 py-4 border-b border-border">
                            <h2 className="text-lg font-semibold text-foreground">Historia</h2>
                        </div>
                        <div className="p-6">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-2 h-2 rounded-full bg-slate-400 flex-shrink-0" />
                                    <span className="text-muted-foreground">Utworzono:</span>
                                    <span className="text-foreground">{formatDate(contract.createdAt)}</span>
                                </div>
                                {contract.sentAt && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="w-2 h-2 rounded-full bg-[color-mix(in_oklab,var(--status-open)_10%,transparent)]0 flex-shrink-0" />
                                        <span className="text-muted-foreground">Wysłano:</span>
                                        <span className="text-foreground">{formatDate(contract.sentAt)}</span>
                                    </div>
                                )}
                                {contract.signedAt && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="w-2 h-2 rounded-full bg-status-accepted flex-shrink-0" />
                                        <span className="text-muted-foreground">Podpisano:</span>
                                        <span className="text-status-accepted font-medium">
                                            {formatDate(contract.signedAt)}
                                            {contract.signatureLog && ' (e-podpis)'}
                                        </span>
                                    </div>
                                )}
                                {contract.startDate && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                                        <span className="text-muted-foreground">Rozpoczęcie:</span>
                                        <span className="text-foreground">{formatDate(contract.startDate)}</span>
                                    </div>
                                )}
                                {contract.endDate && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="w-2 h-2 rounded-full bg-[oklch(0.72_0.16_60)/10%]0 flex-shrink-0" />
                                        <span className="text-muted-foreground">Zakończenie:</span>
                                        <span className="text-foreground">{formatDate(contract.endDate)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {contract.notes && (
                        <div className="rounded-2xl border border-border bg-card shadow-card">
                            <div className="px-6 py-4 border-b border-border">
                                <h2 className="text-lg font-semibold text-foreground">Notatki</h2>
                            </div>
                            <div className="p-6">
                                <p className="text-foreground whitespace-pre-wrap text-sm">{contract.notes}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmDialog
                isOpen={!!statusConfirm}
                onClose={() => setStatusConfirm(null)}
                onConfirm={handleStatusChange}
                title={statusConfirm?.label || ''}
                description={statusConfirm?.description || ''}
                confirmLabel="Potwierdź"
                isLoading={isChangingStatus}
            />
        </div>
    );
}
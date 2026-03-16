// src/app/dashboard/contracts/[id]/page.tsx
'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useContract } from '@/hooks/useContracts';
import { contractsApi } from '@/lib/api';
import { Button, Badge, Card, ConfirmDialog } from '@/components/ui';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatCurrency, formatDate, getContractStatusConfig } from '@/lib/utils';
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
                                        ? 'bg-emerald-500 border-emerald-500 text-white'
                                        : isCurrent
                                            ? 'bg-cyan-500 border-cyan-500 text-white ring-4 ring-cyan-500/20'
                                            : isTerminal
                                                ? 'border-red-300 text-red-400 bg-red-500/5'
                                                : 'border-slate-300 text-themed-muted'
                                } ${isTerminal && !isCompleted && !isCurrent ? 'opacity-50' : ''}`}
                                     style={!isCompleted && !isCurrent && !isTerminal ? { borderColor: 'var(--card-border)', backgroundColor: 'var(--card-bg)' } : undefined}
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
                                    isCompleted ? 'text-emerald-600' : isCurrent ? 'text-cyan-600' : 'text-themed-muted'
                                }`}>
                                    {step.label}
                                </span>
                            </div>

                            {index < MAIN_STEPS.length - 1 && (
                                <div className={`flex-1 h-0.5 mx-2 mt-[-1.25rem] rounded-full ${
                                    isCompleted ? 'bg-emerald-500' : ''
                                }`}
                                     style={!isCompleted ? { backgroundColor: 'var(--divider)' } : undefined}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            {isTerminal && (
                <div className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
                    <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="text-sm font-medium text-red-600">
                        {currentStatus === 'TERMINATED' ? 'Umowa została rozwiązana' : 'Umowa wygasła'}
                    </span>
                </div>
            )}
        </div>
    );
}

export default function ContractDetailsPage({ params }: PageProps) {
    const { id } = use(params);
    const router = useRouter();
    const { contract, loading, error, refetch } = useContract(id);
    const [statusConfirm, setStatusConfirm] = useState<{ next: ContractStatus; label: string; description: string } | null>(null);
    const [isChangingStatus, setIsChangingStatus] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);

    const handleStatusChange = async () => {
        if (!statusConfirm || !contract) return;
        setIsChangingStatus(true);
        try {
            await contractsApi.updateStatus(contract.id, statusConfirm.next);
            setStatusConfirm(null);
            await refetch();
        } catch (err: unknown) {
            console.error('Status change error:', err);
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
        } catch (err: unknown) {
            console.error('PDF download error:', err);
        } finally {
            setIsDownloading(false);
        }
    };

    const handlePublish = async () => {
        if (!contract) return;
        setIsPublishing(true);
        try {
            await contractsApi.publish(contract.id);
            await refetch();
        } catch (err: unknown) {
            console.error('Publish error:', err);
        } finally {
            setIsPublishing(false);
        }
    };

    const handleUnpublish = async () => {
        if (!contract) return;
        setIsPublishing(true);
        try {
            await contractsApi.unpublish(contract.id);
            await refetch();
        } catch (err: unknown) {
            console.error('Unpublish error:', err);
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
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2000);
        } catch (err: unknown) {
            console.error('Copy failed:', err);
        }
    };

    if (loading) return <PageLoader />;

    if (error || !contract) {
        return (
            <div className="p-8 text-center">
                <div className="w-16 h-16 section-themed rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-themed-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <p className="text-themed-muted mb-4">{error || 'Umowa nie znaleziona'}</p>
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
        <div className="p-4 md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/contracts">
                        <button className="p-2 text-themed-muted hover-themed rounded-lg transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-themed">{contract.number}</h1>
                            <Badge className={`${statusConfig.bgColor} ${statusConfig.color}`}>{statusConfig.label}</Badge>
                        </div>
                        <p className="text-themed-muted mt-1">{contract.title}</p>
                    </div>
                </div>
            </div>

            <Card className="p-6">
                <h3 className="text-sm font-semibold text-themed-muted uppercase tracking-wider mb-4">Status umowy</h3>
                <StatusTimeline currentStatus={contract.status} />
            </Card>

            {availableActions.length > 0 && (
                <Card className="p-4">
                    <h3 className="text-sm font-semibold text-themed-muted uppercase tracking-wider mb-3">Dostępne akcje</h3>
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
                                <span className="text-sm text-themed-muted hidden sm:inline">{action.description}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <div className="px-6 py-4 border-b divider-themed">
                            <h2 className="text-lg font-semibold text-themed">Szczegóły umowy</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            {contract.description && (
                                <div>
                                    <label className="text-sm font-medium text-themed-muted">Opis</label>
                                    <p className="mt-1 text-themed">{contract.description}</p>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-themed-muted">Data rozpoczęcia</label>
                                    <p className="mt-1 text-themed">{contract.startDate ? formatDate(contract.startDate) : '—'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-themed-muted">Data zakończenia</label>
                                    <p className="mt-1 text-themed">{contract.endDate ? formatDate(contract.endDate) : '—'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-themed-muted">Data podpisania</label>
                                    <p className={`mt-1 ${contract.signedAt ? 'text-emerald-600 font-medium' : 'text-themed'}`}>
                                        {contract.signedAt ? formatDate(contract.signedAt) : '—'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-themed-muted">Termin płatności</label>
                                    <p className="mt-1 text-themed">{contract.paymentDays} dni</p>
                                </div>
                            </div>
                            {contract.terms && (
                                <div>
                                    <label className="text-sm font-medium text-themed-muted">Warunki umowy</label>
                                    <p className="mt-1 text-themed whitespace-pre-wrap">{contract.terms}</p>
                                </div>
                            )}
                            {contract.offerId && (
                                <div>
                                    <label className="text-sm font-medium text-themed-muted">Utworzona z oferty</label>
                                    <Link href={`/dashboard/offers/${contract.offerId}`} className="mt-1 text-cyan-600 hover:text-cyan-700 hover:underline block">
                                        {contract.offer?.number || contract.offerId} →
                                    </Link>
                                </div>
                            )}
                        </div>
                    </Card>

                    <Card>
                        <div className="px-6 py-4 border-b divider-themed">
                            <h2 className="text-lg font-semibold text-themed">Pozycje umowy</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="section-themed border-b divider-themed">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-themed-muted uppercase">Nazwa</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-themed-muted uppercase">Ilość</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-themed-muted uppercase">Cena jedn.</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-themed-muted uppercase">VAT</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-themed-muted uppercase">Brutto</th>
                                </tr>
                                </thead>
                                <tbody>
                                {contract.items.map((item) => (
                                    <tr key={item.id} className="border-b divider-themed">
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-themed">{item.name}</p>
                                            {item.description && <p className="text-xs text-themed-muted">{item.description}</p>}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm text-themed">{Number(item.quantity)} {item.unit}</td>
                                        <td className="px-6 py-4 text-right text-sm text-themed">{formatCurrency(Number(item.unitPrice))}</td>
                                        <td className="px-6 py-4 text-right text-sm text-themed">{Number(item.vatRate)}%</td>
                                        <td className="px-6 py-4 text-right text-sm font-medium text-themed">{formatCurrency(Number(item.totalGross))}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-6 py-4 section-themed border-t divider-themed space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-themed-muted">Suma netto:</span>
                                <span className="text-themed font-medium">{formatCurrency(Number(contract.totalNet))}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-themed-muted">VAT:</span>
                                <span className="text-themed font-medium">{formatCurrency(Number(contract.totalVat))}</span>
                            </div>
                            <div className="flex justify-between text-base pt-2 border-t divider-themed">
                                <span className="text-themed font-bold">RAZEM BRUTTO:</span>
                                <span className="text-cyan-600 font-bold text-lg">{formatCurrency(Number(contract.totalGross), contract.currency)}</span>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <div className="px-6 py-4 border-b divider-themed">
                            <h2 className="text-lg font-semibold text-themed">Klient</h2>
                        </div>
                        <div className="p-6 space-y-3">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white text-sm font-semibold">
                                    {contract.client.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-medium text-themed">{contract.client.name}</p>
                                    {contract.client.company && <p className="text-sm text-themed-muted">{contract.client.company}</p>}
                                </div>
                            </div>
                            {contract.client.email && (
                                <div>
                                    <label className="text-xs font-medium text-themed-muted">Email</label>
                                    <p className="text-sm text-themed">{contract.client.email}</p>
                                </div>
                            )}
                            {contract.client.phone && (
                                <div>
                                    <label className="text-xs font-medium text-themed-muted">Telefon</label>
                                    <p className="text-sm text-themed">{contract.client.phone}</p>
                                </div>
                            )}
                            {contract.client.nip && (
                                <div>
                                    <label className="text-xs font-medium text-themed-muted">NIP</label>
                                    <p className="text-sm text-themed">{contract.client.nip}</p>
                                </div>
                            )}
                            <Link href={`/dashboard/clients/${contract.client.id}`}>
                                <Button variant="outline" size="sm" className="w-full mt-4">Zobacz profil klienta</Button>
                            </Link>
                        </div>
                    </Card>

                    <Card>
                        <div className="px-6 py-4 border-b divider-themed">
                            <h2 className="text-lg font-semibold text-themed">Dystrybucja</h2>
                        </div>
                        <div className="p-6 space-y-3">
                            {hasPublicLink ? (
                                <>
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-500/15 text-emerald-600 border border-emerald-500/25 rounded-full">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                            </svg>
                                            Link aktywny
                                        </span>
                                    </div>
                                    <Button variant="outline" className="w-full" onClick={handleCopyLink}>
                                        {copiedLink ? (
                                            <>
                                                <svg className="w-5 h-5 mr-2 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                Skopiowano!
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                                Kopiuj link dla klienta
                                            </>
                                        )}
                                    </Button>
                                    <Button variant="outline" className="w-full text-red-600 hover:bg-red-500/10" onClick={handleUnpublish} disabled={isPublishing}>
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
                    </Card>

                    <Card>
                        <div className="px-6 py-4 border-b divider-themed">
                            <h2 className="text-lg font-semibold text-themed">Akcje</h2>
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
                    </Card>

                    <Card>
                        <div className="px-6 py-4 border-b divider-themed">
                            <h2 className="text-lg font-semibold text-themed">Historia</h2>
                        </div>
                        <div className="p-6">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-2 h-2 rounded-full bg-slate-400 flex-shrink-0" />
                                    <span className="text-themed-muted">Utworzono:</span>
                                    <span className="text-themed">{formatDate(contract.createdAt)}</span>
                                </div>
                                {contract.sentAt && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                                        <span className="text-themed-muted">Wysłano:</span>
                                        <span className="text-themed">{formatDate(contract.sentAt)}</span>
                                    </div>
                                )}
                                {contract.signedAt && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                                        <span className="text-themed-muted">Podpisano:</span>
                                        <span className="text-emerald-600 font-medium">{formatDate(contract.signedAt)}</span>
                                    </div>
                                )}
                                {contract.startDate && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="w-2 h-2 rounded-full bg-cyan-500 flex-shrink-0" />
                                        <span className="text-themed-muted">Rozpoczęcie:</span>
                                        <span className="text-themed">{formatDate(contract.startDate)}</span>
                                    </div>
                                )}
                                {contract.endDate && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                                        <span className="text-themed-muted">Zakończenie:</span>
                                        <span className="text-themed">{formatDate(contract.endDate)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>

                    {contract.notes && (
                        <Card>
                            <div className="px-6 py-4 border-b divider-themed">
                                <h2 className="text-lg font-semibold text-themed">Notatki</h2>
                            </div>
                            <div className="p-6">
                                <p className="text-themed whitespace-pre-wrap text-sm">{contract.notes}</p>
                            </div>
                        </Card>
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
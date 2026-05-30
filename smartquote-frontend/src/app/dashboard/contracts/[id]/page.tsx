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
import { useTranslations } from '@/i18n';

interface PageProps {
    params: Promise<{ id: string }>;
}

type StatusActionVariant = 'primary' | 'outline' | 'danger';

interface StatusAction {
    next: ContractStatus;
    label: string;
    description: string;
    variant: StatusActionVariant;
}

function StatusTimeline({ currentStatus, t }: { currentStatus: ContractStatus; t: ReturnType<typeof useTranslations<'contractDetailPage'>> }) {
    const MAIN_STEPS: { status: ContractStatus; label: string }[] = [
        { status: 'DRAFT', label: t.statusSteps.DRAFT },
        { status: 'PENDING_SIGNATURE', label: t.statusSteps.PENDING_SIGNATURE },
        { status: 'ACTIVE', label: t.statusSteps.ACTIVE },
        { status: 'COMPLETED', label: t.statusSteps.COMPLETED },
    ];

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
                        {currentStatus === 'TERMINATED' ? t.terminated : t.expired}
                    </span>
                </div>
            )}
        </div>
    );
}

export default function ContractDetailsPage({ params }: PageProps) {
    const { id } = use(params);
    const toast = useToast();
    const t = useTranslations('contractDetailPage');
    const { contract, loading, error, refetch } = useContract(id);
    const [statusConfirm, setStatusConfirm] = useState<{ next: ContractStatus; label: string; description: string } | null>(null);
    const [isChangingStatus, setIsChangingStatus] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);

    const STATUS_ACTIONS: Record<ContractStatus, StatusAction[]> = {
        DRAFT: [
            { next: 'PENDING_SIGNATURE', label: t.statusActions.DRAFT_next, description: t.statusActions.DRAFT_desc, variant: 'primary' },
        ],
        PENDING_SIGNATURE: [
            { next: 'ACTIVE', label: t.statusActions.PENDING_next1, description: t.statusActions.PENDING_desc1, variant: 'primary' },
            { next: 'TERMINATED', label: t.statusActions.PENDING_next2, description: t.statusActions.PENDING_desc2, variant: 'danger' },
        ],
        ACTIVE: [
            { next: 'COMPLETED', label: t.statusActions.ACTIVE_next1, description: t.statusActions.ACTIVE_desc1, variant: 'primary' },
            { next: 'TERMINATED', label: t.statusActions.ACTIVE_next2, description: t.statusActions.ACTIVE_desc2, variant: 'danger' },
        ],
        COMPLETED: [],
        TERMINATED: [],
        EXPIRED: [],
    };

    const handleStatusChange = async () => {
        if (!statusConfirm || !contract) return;
        setIsChangingStatus(true);
        try {
            await contractsApi.updateStatus(contract.id, statusConfirm.next);
            const newStatusConfig = getContractStatusConfig(statusConfirm.next);
            toast.success(t.toasts.statusChanged, `Umowa: ${newStatusConfig.label}`);
            setStatusConfirm(null);
            await refetch();
        } catch {
            toast.error(t.toasts.statusError, t.toasts.statusError);
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
            toast.success(t.toasts.pdfDownloaded, `Umowa ${contract.number}`);
        } catch {
            toast.error(t.toasts.pdfError, t.toasts.pdfErrorDesc);
        } finally {
            setIsDownloading(false);
        }
    };

    const handlePublish = async () => {
        if (!contract) return;
        setIsPublishing(true);
        try {
            await contractsApi.publish(contract.id);
            toast.success(t.toasts.published, t.toasts.publishedDesc);
            await refetch();
        } catch {
            toast.error(t.toasts.publishError, t.toasts.publishErrorDesc);
        } finally {
            setIsPublishing(false);
        }
    };

    const handleUnpublish = async () => {
        if (!contract) return;
        setIsPublishing(true);
        try {
            await contractsApi.unpublish(contract.id);
            toast.success(t.toasts.unpublished, t.toasts.unpublishedDesc);
            await refetch();
        } catch {
            toast.error(t.toasts.publishError, t.toasts.unpublishErrorDesc);
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
            toast.info(t.toasts.copied, t.toasts.copiedDesc);
        } catch {
            toast.error(t.toasts.copyError, t.toasts.copyErrorDesc);
        }
    };

    const handleCopyHash = async () => {
        if (!contract?.signatureLog?.contentHash) return;
        try {
            await navigator.clipboard.writeText(contract.signatureLog.contentHash);
            toast.info(t.toasts.hashCopied, t.toasts.hashCopiedDesc);
        } catch {
            toast.error(t.toasts.hashCopyError, t.toasts.hashCopyErrorDesc);
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
                <p className="text-muted-foreground mb-4">{error || t.notFound}</p>
                <Link href="/dashboard/contracts">
                    <Button variant="outline">{t.backToList}</Button>
                </Link>
            </div>
        );
    }
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
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">{t.statusLabel}</h3>
                <StatusTimeline currentStatus={contract.status} t={t} />
            </div>

            {availableActions.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t.availableActions}</h3>
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
                            <h2 className="text-lg font-semibold text-foreground">{t.contractDetails}</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            {contract.description && (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">{t.descLabel}</label>
                                    <p className="mt-1 text-foreground">{contract.description}</p>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">{t.startDate}</label>
                                    <p className="mt-1 text-foreground">{contract.startDate ? formatDate(contract.startDate) : '—'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">{t.endDate}</label>
                                    <p className="mt-1 text-foreground">{contract.endDate ? formatDate(contract.endDate) : '—'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">{t.signedDate}</label>
                                    <p className={`mt-1 ${contract.signedAt ? 'text-status-accepted font-medium' : 'text-foreground'}`}>
                                        {contract.signedAt ? formatDate(contract.signedAt) : '—'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">{t.paymentDays}</label>
                                    <p className="mt-1 text-foreground">{contract.paymentDays} dni</p>
                                </div>
                            </div>
                            {contract.terms && (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">{t.termsLabel}</label>
                                    <p className="mt-1 text-foreground whitespace-pre-wrap">{contract.terms}</p>
                                </div>
                            )}
                            {contract.offerId && (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">{t.createdFromOffer}</label>
                                    <Link href={`/dashboard/offers/${contract.offerId}`} className="mt-1 text-primary hover:text-primary hover:underline block">
                                        {contract.offer?.number || contract.offerId} →
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-card shadow-card">
                        <div className="px-6 py-4 border-b border-border">
                            <h2 className="text-lg font-semibold text-foreground">{t.contractDetails}</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-surface-subtle border-b border-border">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">{t.tableColName}</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">{t.tableColQty}</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">{t.tableColUnitPrice}</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">{t.tableColVat}</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">{t.tableColGross}</th>
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
                                <span className="text-muted-foreground">{t.subtotal}</span>
                                <span className="text-foreground font-medium">{formatCurrency(Number(contract.totalNet))}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{t.vatLabel}</span>
                                <span className="text-foreground font-medium">{formatCurrency(Number(contract.totalVat))}</span>
                            </div>
                            <div className="flex justify-between text-base pt-2 border-t border-border">
                                <span className="text-foreground font-bold">{t.totalGross}</span>
                                <span className="text-primary font-bold text-lg">{formatCurrency(Number(contract.totalGross), contract.currency)}</span>
                            </div>
                        </div>
                    </div>

                    {(contract.signatureLog || contract.status === 'PENDING_SIGNATURE') && (
                        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
                            <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-card/20 backdrop-blur-sm flex items-center justify-center">
                                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-white">{t.signatureTitle}</h2>
                                        <p className="text-sm text-emerald-100">
                                            {contract.signatureLog
                                                ? t.signatureCert
                                                : t.signatureWaiting}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {contract.signatureLog ? (
                                <div className="p-6 space-y-5">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground">{t.signerLabel}</label>
                                            <p className="mt-1 text-sm font-medium text-foreground">{contract.signatureLog.signerName}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground">{t.signerEmailLabel}</label>
                                            <p className="mt-1 text-sm text-foreground">{contract.signatureLog.signerEmail}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground">{t.signedAtLabel}</label>
                                            <p className="mt-1 text-sm text-status-accepted font-medium">{formatDate(contract.signatureLog.signedAt)}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground">{t.ipLabel}</label>
                                            <p className="mt-1 text-sm font-mono text-foreground">{contract.signatureLog.ipAddress}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground mb-2 block">{t.signatureLabel}</label>
                                        <div className="border border-border rounded-lg p-4 bg-card flex items-center justify-center">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={contract.signatureLog.signatureImage}
                                                alt={t.signatureLabel}
                                                className="max-h-24 max-w-full object-contain"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground mb-2 block">{t.hashLabel}</label>
                                        <div className="flex items-start gap-2">
                                            <code className="flex-1 text-xs font-mono break-all p-3 rounded-lg bg-surface-subtle text-foreground">
                                                {contract.signatureLog.contentHash}
                                            </code>
                                            <button
                                                onClick={handleCopyHash}
                                                className="flex-shrink-0 p-2 rounded-lg hover:bg-secondary/60 transition-colors"
                                                title={t.copyHash}
                                            >
                                                <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground">{t.browserLabel}</label>
                                        <p className="mt-1 text-xs text-muted-foreground break-all">{contract.signatureLog.userAgent}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 text-center">
                                    <div className="w-16 h-16 rounded-full bg-[oklch(0.72_0.16_60)/10%] flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-sm font-semibold text-foreground mb-1">{t.pendingTitle}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {t.pendingDesc}
                                        {hasPublicLink && ` ${t.pendingShareLink}`}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="rounded-2xl border border-border bg-card shadow-card">
                        <div className="px-6 py-4 border-b border-border">
                            <h2 className="text-lg font-semibold text-foreground">{t.clientSection}</h2>
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
                                    <label className="text-xs font-medium text-muted-foreground">Phone</label>
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
                                <Button variant="outline" size="sm" className="w-full mt-4">{t.viewClientProfile}</Button>
                            </Link>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-card shadow-card">
                        <div className="px-6 py-4 border-b border-border">
                            <h2 className="text-lg font-semibold text-foreground">{t.distributionSection}</h2>
                        </div>
                        <div className="p-6 space-y-3">
                            {hasPublicLink ? (
                                <>
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-status-accepted/15 text-status-accepted border border-status-accepted/25 rounded-full">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                            </svg>
                                            {t.linkActive}
                                        </span>
                                    </div>
                                    <Button variant="outline" className="w-full" onClick={handleCopyLink}>
                                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                        {t.copyLink}
                                    </Button>
                                    <Button variant="outline" className="w-full text-destructive hover:bg-destructive/10" onClick={handleUnpublish} disabled={isPublishing}>
                                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                        </svg>
                                        {t.deactivateLink}
                                    </Button>
                                </>
                            ) : (
                                <Button className="w-full" onClick={handlePublish} disabled={isPublishing}>
                                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                    </svg>
                                    {isPublishing ? t.generatingLink : t.generateLink.replace('{isPublishing}', '').trim()}
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-card shadow-card">
                        <div className="px-6 py-4 border-b border-border">
                            <h2 className="text-lg font-semibold text-foreground">{t.actionsSection}</h2>
                        </div>
                        <div className="p-6 space-y-3">
                            <Link href={`/dashboard/contracts/${contract.id}/edit`}>
                                <Button variant="outline" className="w-full">
                                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                    {t.editContract}
                                </Button>
                            </Link>
                            <Button variant="outline" className="w-full" onClick={handleDownloadPdf} disabled={isDownloading}>
                                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {isDownloading ? t.generatingPdf : t.downloadPdf}
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-card shadow-card">
                        <div className="px-6 py-4 border-b border-border">
                            <h2 className="text-lg font-semibold text-foreground">{t.historySection}</h2>
                        </div>
                        <div className="p-6">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-2 h-2 rounded-full bg-muted-foreground flex-shrink-0" />
                                    <span className="text-muted-foreground">{t.createdAt}</span>
                                    <span className="text-foreground">{formatDate(contract.createdAt)}</span>
                                </div>
                                {contract.sentAt && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="w-2 h-2 rounded-full bg-status-open flex-shrink-0" />
                                        <span className="text-muted-foreground">{t.sentAt}</span>
                                        <span className="text-foreground">{formatDate(contract.sentAt)}</span>
                                    </div>
                                )}
                                {contract.signedAt && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="w-2 h-2 rounded-full bg-status-accepted flex-shrink-0" />
                                        <span className="text-muted-foreground">{t.signedAt}</span>
                                        <span className="text-status-accepted font-medium">
                                            {formatDate(contract.signedAt)}
                                            {contract.signatureLog && ` ${t.eSign}`}
                                        </span>
                                    </div>
                                )}
                                {contract.startDate && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                                        <span className="text-muted-foreground">{t.startsAt}</span>
                                        <span className="text-foreground">{formatDate(contract.startDate)}</span>
                                    </div>
                                )}
                                {contract.endDate && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="w-2 h-2 rounded-full bg-[oklch(0.72_0.16_60)/15%] flex-shrink-0" />
                                        <span className="text-muted-foreground">{t.endsAt}</span>
                                        <span className="text-foreground">{formatDate(contract.endDate)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {contract.notes && (
                        <div className="rounded-2xl border border-border bg-card shadow-card">
                            <div className="px-6 py-4 border-b border-border">
                                <h2 className="text-lg font-semibold text-foreground">{t.notesSection}</h2>
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
                confirmLabel={t.confirm}
                isLoading={isChangingStatus}
            />
        </div>
    );
}

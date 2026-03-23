// src/app/dashboard/offers/[id]/page.tsx
'use client';

import { useState, use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useOffer, useOfferAnalytics, useOfferComments } from '@/hooks/useOffers';
import { offersApi, ai } from '@/lib/api';
import { Button, Card, Badge, ConfirmDialog } from '@/components/ui';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatDate, formatDateTime, formatCurrency, getStatusConfig, getInitials } from '@/lib/utils';
import { OfferStatus, OfferItem } from '@/types';
import type { ObserverInsight, ClosingStrategy } from '@/types/ai';
import PublishDialog from '@/components/offers/PublishDialog';
import { useToast } from '@/contexts/ToastContext';

const STATUS_TRANSITIONS: Record<OfferStatus, OfferStatus[]> = {
    DRAFT: ['SENT'],
    SENT: ['VIEWED', 'NEGOTIATION', 'ACCEPTED', 'REJECTED'],
    VIEWED: ['NEGOTIATION', 'ACCEPTED', 'REJECTED'],
    NEGOTIATION: ['ACCEPTED', 'REJECTED', 'SENT'],
    ACCEPTED: [],
    REJECTED: ['DRAFT'],
    EXPIRED: ['DRAFT'],
};

type Tab = 'details' | 'analytics' | 'comments';

interface PageProps {
    params: Promise<{ id: string }>;
}

const intentConfig: Record<string, { label: string; color: string }> = {
    likely_accept: { label: 'Prawdopodobna akceptacja', color: 'badge-success' },
    undecided: { label: 'Niezdecydowany', color: 'badge-warning' },
    likely_reject: { label: 'Prawdopodobne odrzucenie', color: 'badge-danger' },
    unknown: { label: 'Brak danych', color: 'badge-themed' },
};

interface VariantGroup {
    name: string | null;
    items: OfferItem[];
}

function groupByVariant(items: OfferItem[]): { groups: VariantGroup[]; variantNames: string[] } {
    const hasVariants = items.some((i) => i.variantName);
    if (!hasVariants) {
        return { groups: [{ name: null, items }], variantNames: [] };
    }

    const groups: VariantGroup[] = [];
    const baseItems = items.filter((i) => !i.variantName);
    if (baseItems.length > 0) {
        groups.push({ name: null, items: baseItems });
    }

    const variantNames = [...new Set(items.filter((i) => i.variantName).map((i) => i.variantName!))];
    for (const vn of variantNames) {
        groups.push({ name: vn, items: items.filter((i) => i.variantName === vn) });
    }

    return { groups, variantNames };
}

function truncateHash(hash: string, length = 16): string {
    if (hash.length <= length * 2 + 3) return hash;
    return `${hash.slice(0, length)}...${hash.slice(-length)}`;
}

export default function OfferDetailPage({ params }: PageProps) {
    const { id } = use(params);

    const router = useRouter();
    const toast = useToast();
    const { data: session } = useSession();
    const { offer, isLoading, error, refresh } = useOffer(id);
    const { analytics, refresh: refreshAnalytics } = useOfferAnalytics(id);
    const { comments, isSending, addComment, refresh: refreshComments } = useOfferComments(id);

    const [activeTab, setActiveTab] = useState<Tab>('details');
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
    const [publishDialogOpen, setPublishDialogOpen] = useState(false);
    const [newComment, setNewComment] = useState('');

    const [observerInsight, setObserverInsight] = useState<ObserverInsight | null>(null);
    const [isLoadingObserver, setIsLoadingObserver] = useState(false);
    const [observerError, setObserverError] = useState<string | null>(null);

    const [closingStrategy, setClosingStrategy] = useState<ClosingStrategy | null>(null);
    const [isLoadingCloser, setIsLoadingCloser] = useState(false);
    const [closerError, setCloserError] = useState<string | null>(null);
    const [expandedStrategy, setExpandedStrategy] = useState<string | null>(null);

    const variantData = useMemo(() => {
        if (!offer?.items) return { groups: [], variantNames: [] };
        return groupByVariant(offer.items);
    }, [offer?.items]);

    const handleCopyHash = async (hash: string) => {
        try {
            await navigator.clipboard.writeText(hash);
            toast.info('Skopiowano', 'Hash skopiowany do schowka');
        } catch {
            toast.error('Błąd', 'Nie udało się skopiować do schowka');
        }
    };

    const handleLoadObserver = async () => {
        setIsLoadingObserver(true);
        setObserverError(null);
        try {
            const data = await ai.observerInsight(id);
            setObserverInsight(data);
        } catch (err) {
            setObserverError(err instanceof Error ? err.message : 'Błąd analizy');
        } finally {
            setIsLoadingObserver(false);
        }
    };

    const handleLoadCloser = async () => {
        setIsLoadingCloser(true);
        setCloserError(null);
        try {
            const data = await ai.closingStrategy(id);
            setClosingStrategy(data);
        } catch (err) {
            setCloserError(err instanceof Error ? err.message : 'Błąd generowania strategii');
        } finally {
            setIsLoadingCloser(false);
        }
    };

    const handleUseStrategy = (text: string) => {
        setNewComment(text);
        setExpandedStrategy(null);
    };

    const handleStatusChange = async (newStatus: OfferStatus) => {
        if (!offer) return;
        setIsUpdatingStatus(true);
        try {
            await offersApi.update(offer.id, { status: newStatus });
            await refresh();
            const statusConfig = getStatusConfig(newStatus);
            toast.success('Status zmieniony', `Oferta: ${statusConfig.label}`);
        } catch {
            toast.error('Błąd', 'Nie udało się zmienić statusu oferty');
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleDelete = async () => {
        if (!offer) return;
        setIsDeleting(true);
        try {
            await offersApi.delete(offer.id);
            toast.success('Oferta usunięta', `${offer.number} została usunięta`);
            router.push('/dashboard/offers');
        } catch {
            toast.error('Błąd', 'Nie udało się usunąć oferty');
            setIsDeleting(false);
        }
    };

    const handleDuplicate = async () => {
        if (!offer) return;
        try {
            const response = await offersApi.duplicate(offer.id);
            if (response.data?.id) {
                toast.success('Oferta zduplikowana', 'Możesz teraz edytować kopię');
                router.push(`/dashboard/offers/${response.data.id}/edit`);
            }
        } catch {
            toast.error('Błąd', 'Nie udało się zduplikować oferty');
        }
    };

    const handleDownloadPDF = async () => {
        if (!offer) return;
        const token = session?.accessToken || localStorage.getItem('token');
        if (!token) {
            toast.error('Brak autoryzacji', 'Zaloguj się ponownie');
            return;
        }
        setIsDownloadingPDF(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
            const response = await fetch(`${apiUrl}/offers/${offer.id}/pdf`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Błąd ${response.status}`);
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Oferta_${offer.number.replace(/\//g, '-')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success('PDF pobrany', `Oferta ${offer.number}`);
        } catch (err) {
            toast.error('Błąd PDF', err instanceof Error ? err.message : 'Wystąpił błąd podczas pobierania');
        } finally {
            setIsDownloadingPDF(false);
        }
    };

    const handlePublished = () => {
        refresh();
        refreshAnalytics();
    };

    const handleAddSellerComment = async () => {
        const trimmed = newComment.trim();
        if (!trimmed || isSending) return;
        await addComment(trimmed);
        setNewComment('');
    };

    if (isLoading) return <PageLoader />;

    if (error || !offer) {
        return (
            <div className="p-4 md:p-8">
                <Card>
                    <div className="text-center py-12">
                        <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Nie znaleziono oferty'}</p>
                        <Button onClick={() => router.push('/dashboard/offers')}>
                            Wróć do listy
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    const status = getStatusConfig(offer.status);
    const availableTransitions = STATUS_TRANSITIONS[offer.status as OfferStatus] || [];
    const isExpired = offer.validUntil && new Date(offer.validUntil) < new Date();

    const tabs: { id: Tab; label: string; count?: number }[] = [
        { id: 'details', label: 'Szczegóły' },
        { id: 'analytics', label: 'Analityka', count: offer.viewCount || 0 },
        { id: 'comments', label: 'Komentarze', count: offer._count?.comments || 0 },
    ];

    const engagementColor = (score: number) => {
        if (score <= 3) return 'bg-red-500';
        if (score <= 6) return 'bg-amber-500';
        return 'bg-emerald-500';
    };

    const renderItemsTable = (items: OfferItem[]) => (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                <tr className="border-b divider-themed">
                    <th className="pb-3 text-left text-xs font-semibold text-themed-muted uppercase">Pozycja</th>
                    <th className="pb-3 text-right text-xs font-semibold text-themed-muted uppercase">Ilość</th>
                    <th className="pb-3 text-right text-xs font-semibold text-themed-muted uppercase">Cena</th>
                    <th className="pb-3 text-right text-xs font-semibold text-themed-muted uppercase">VAT</th>
                    <th className="pb-3 text-right text-xs font-semibold text-themed-muted uppercase">Wartość</th>
                </tr>
                </thead>
                <tbody>
                {items.map((item, index) => (
                    <tr key={item.id || index} className="border-b divider-themed last:border-0">
                        <td className="py-3">
                            <div className="flex items-center gap-2">
                                <p className="font-medium text-themed">{item.name}</p>
                                {item.isOptional && (
                                    <span className="text-xs px-1.5 py-0.5 rounded-full badge-info font-medium">
                                        Opcjonalna
                                    </span>
                                )}
                            </div>
                            {item.description && (
                                <p className="text-sm text-themed-muted mt-1">{item.description}</p>
                            )}
                        </td>
                        <td className="py-3 text-right text-themed-muted">
                            {Number(item.quantity)} {item.unit}
                        </td>
                        <td className="py-3 text-right text-themed-muted">
                            {formatCurrency(Number(item.unitPrice))}
                            {Number(item.discount) > 0 && (
                                <span className="text-xs text-emerald-600 dark:text-emerald-400 ml-1">
                                    -{item.discount}%
                                </span>
                            )}
                        </td>
                        <td className="py-3 text-right text-themed-muted">
                            {item.vatRate}%
                        </td>
                        <td className="py-3 text-right font-semibold text-themed">
                            {formatCurrency(Number(item.totalGross))}
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );

    const auditLog = offer.acceptanceLog;

    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/dashboard/offers')}
                        className="p-2 text-themed-muted hover-themed rounded-lg"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-2xl font-bold text-themed">{offer.title}</h1>
                            <Badge className={`${status.bgColor} ${status.color}`} size="md">
                                {status.label}
                            </Badge>
                            {isExpired && offer.status !== 'EXPIRED' && (
                                <Badge variant="danger" size="md">Wygasła</Badge>
                            )}
                            {offer.isInteractive && (
                                <Badge className="bg-cyan-500/15 text-cyan-600 dark:text-cyan-400" size="md">
                                    Link aktywny
                                </Badge>
                            )}
                            {variantData.variantNames.length > 0 && (
                                <Badge className="bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300" size="md">
                                    {variantData.variantNames.length} wariant{variantData.variantNames.length > 1 ? 'y' : ''}
                                </Badge>
                            )}
                            {offer.requireAuditTrail && (
                                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" size="md">
                                    <svg className="w-3.5 h-3.5 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                    </svg>
                                    Audit Trail
                                </Badge>
                            )}
                        </div>
                        <p className="text-themed-muted mt-1">{offer.number}</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => setPublishDialogOpen(true)}>
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        {offer.isInteractive ? 'Link' : 'Publikuj link'}
                    </Button>
                    {availableTransitions.length > 0 && (
                        <div className="relative group">
                            <Button variant="outline" disabled={isUpdatingStatus}>
                                Zmień status
                                <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </Button>
                            <div className="absolute right-0 mt-2 w-48 card-themed border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                                {availableTransitions.map((newStatus) => {
                                    const statusConfig = getStatusConfig(newStatus);
                                    return (
                                        <button
                                            key={newStatus}
                                            onClick={() => handleStatusChange(newStatus)}
                                            className="w-full px-4 py-2 text-left text-sm hover-themed first:rounded-t-lg last:rounded-b-lg"
                                        >
                                            <Badge className={`${statusConfig.bgColor} ${statusConfig.color}`}>
                                                {statusConfig.label}
                                            </Badge>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    <Button variant="outline" onClick={handleDuplicate}>
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Duplikuj
                    </Button>
                    <Button onClick={() => router.push(`/dashboard/offers/${offer.id}/edit`)}>
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Edytuj
                    </Button>
                </div>
            </div>

            <div className="mb-6">
                <div className="flex gap-1 section-themed rounded-xl p-1 w-fit">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                                activeTab === tab.id
                                    ? 'card-themed text-themed shadow-sm'
                                    : 'text-themed-muted hover-themed'
                            }`}
                        >
                            {tab.label}
                            {tab.count !== undefined && tab.count > 0 && (
                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                    activeTab === tab.id
                                        ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400'
                                        : 'badge-themed'
                                }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {activeTab === 'details' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {offer.description && (
                            <Card>
                                <h2 className="text-lg font-semibold text-themed mb-3">Opis</h2>
                                <p className="text-themed whitespace-pre-wrap">{offer.description}</p>
                            </Card>
                        )}

                        {variantData.variantNames.length > 0 && (
                            <div className="p-4 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 border border-cyan-200 dark:border-cyan-800 rounded-xl">
                                <div className="flex items-center gap-2 mb-2">
                                    <svg className="w-5 h-5 text-cyan-600 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    <h3 className="text-sm font-semibold text-cyan-800 dark:text-cyan-300">Warianty oferty</h3>
                                </div>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {variantData.variantNames.map((v) => {
                                        const count = offer.items.filter((i) => i.variantName === v).length;
                                        return (
                                            <span key={v} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 text-sm font-medium">
                                                {v}
                                                <span className="text-xs text-cyan-500 dark:text-cyan-400">({count})</span>
                                            </span>
                                        );
                                    })}
                                </div>
                                <p className="text-xs text-cyan-600 dark:text-cyan-400">
                                    Pozycje wspólne: {offer.items.filter((i) => !i.variantName).length} • Klient wybierze jeden wariant na interaktywnej stronie oferty.
                                </p>
                            </div>
                        )}

                        <Card>
                            <h2 className="text-lg font-semibold text-themed mb-4">
                                Pozycje ({offer.items?.length || 0})
                            </h2>

                            {variantData.variantNames.length > 0 ? (
                                <div className="space-y-6">
                                    {variantData.groups.map((group, gi) => (
                                        <div key={gi}>
                                            <div className={`flex items-center gap-2 mb-3 pb-2 border-b ${group.name ? 'border-cyan-200 dark:border-cyan-800' : 'divider-themed'}`}>
                                                {group.name ? (
                                                    <>
                                                        <div className="w-1 h-5 rounded-full bg-cyan-400" />
                                                        <h3 className="text-sm font-semibold text-cyan-700 dark:text-cyan-400">
                                                            Wariant: {group.name}
                                                        </h3>
                                                        <span className="text-xs text-themed-muted">({group.items.length} poz.)</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <h3 className="text-sm font-semibold text-themed-muted">
                                                            Pozycje wspólne
                                                        </h3>
                                                        <span className="text-xs text-themed-muted">({group.items.length} poz.)</span>
                                                    </>
                                                )}
                                            </div>
                                            {renderItemsTable(group.items)}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                renderItemsTable(offer.items || [])
                            )}

                            <div className="mt-4 pt-4 border-t divider-themed">
                                <div className="flex justify-end">
                                    <div className="w-64 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-themed-muted">Suma netto:</span>
                                            <span className="font-medium text-themed">{formatCurrency(Number(offer.totalNet))}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-themed-muted">VAT:</span>
                                            <span className="font-medium text-themed">{formatCurrency(Number(offer.totalVat))}</span>
                                        </div>
                                        <div className="flex justify-between text-lg pt-2 border-t divider-themed">
                                            <span className="font-semibold text-themed">Suma brutto:</span>
                                            <span className="font-bold text-cyan-600 dark:text-cyan-400">{formatCurrency(Number(offer.totalGross))}</span>
                                        </div>
                                        {variantData.variantNames.length > 0 && (
                                            <p className="text-xs text-themed-muted text-right">
                                                * wspólne + pierwszy wariant
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {offer.terms && (
                            <Card>
                                <h2 className="text-lg font-semibold text-themed mb-3">Warunki płatności</h2>
                                <p className="text-themed whitespace-pre-wrap">{offer.terms}</p>
                            </Card>
                        )}

                        {offer.notes && (
                            <Card>
                                <h2 className="text-lg font-semibold text-themed mb-3">
                                    <span className="flex items-center gap-2">
                                        <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        Notatki wewnętrzne
                                    </span>
                                </h2>
                                <p className="text-themed whitespace-pre-wrap">{offer.notes}</p>
                            </Card>
                        )}
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <h2 className="text-lg font-semibold text-themed mb-4">Klient</h2>
                            <div
                                className="flex items-center gap-3 p-3 section-themed rounded-xl cursor-pointer hover-themed transition-colors"
                                onClick={() => router.push(`/dashboard/clients/${offer.client.id}`)}
                            >
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white font-semibold">
                                    {getInitials(offer.client.name)}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-themed">{offer.client.name}</p>
                                    <p className="text-sm text-themed-muted">{offer.client.email}</p>
                                </div>
                                <svg className="w-5 h-5 text-themed-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </Card>

                        <Card>
                            <h2 className="text-lg font-semibold text-themed mb-4">Szczegóły</h2>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-themed-muted">Numer</span>
                                    <span className="font-medium text-themed">{offer.number}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-themed-muted">Utworzono</span>
                                    <span className="text-themed">{formatDateTime(offer.createdAt)}</span>
                                </div>
                                {offer.validUntil && (
                                    <div className="flex justify-between">
                                        <span className="text-themed-muted">Ważna do</span>
                                        <span className={isExpired ? 'text-red-600 dark:text-red-400 font-medium' : 'text-themed'}>
                                            {formatDate(offer.validUntil)}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-themed-muted">Termin płatności</span>
                                    <span className="text-themed">{offer.paymentDays} dni</span>
                                </div>
                                {offer.sentAt && (
                                    <div className="flex justify-between">
                                        <span className="text-themed-muted">Wysłano</span>
                                        <span className="text-themed">{formatDateTime(offer.sentAt)}</span>
                                    </div>
                                )}
                                {offer.viewedAt && (
                                    <div className="flex justify-between">
                                        <span className="text-themed-muted">Otwarto</span>
                                        <span className="text-themed">{formatDateTime(offer.viewedAt)}</span>
                                    </div>
                                )}
                                {offer.acceptedAt && (
                                    <div className="flex justify-between">
                                        <span className="text-themed-muted">Zaakceptowano</span>
                                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">{formatDateTime(offer.acceptedAt)}</span>
                                    </div>
                                )}
                                {offer.rejectedAt && (
                                    <div className="flex justify-between">
                                        <span className="text-themed-muted">Odrzucono</span>
                                        <span className="text-red-600 dark:text-red-400 font-medium">{formatDateTime(offer.rejectedAt)}</span>
                                    </div>
                                )}
                                {offer.viewCount > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-themed-muted">Wyświetlenia</span>
                                        <span className="text-themed">{offer.viewCount}</span>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {auditLog && (
                            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 overflow-hidden">
                                <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-3.5">
                                    <div className="flex items-center gap-2.5">
                                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                        </svg>
                                        <h2 className="text-base font-semibold text-white">Audit Trail</h2>
                                    </div>
                                    <p className="text-emerald-100 text-xs mt-1">Formalne potwierdzenie akceptacji</p>
                                </div>

                                <div className="p-5 card-themed space-y-4">
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                            </svg>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-themed">{auditLog.clientName || '—'}</p>
                                            <p className="text-xs text-themed-muted truncate">{auditLog.clientEmail || '—'}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-themed-muted">Data akceptacji</span>
                                            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                                {formatDateTime(auditLog.acceptedAt)}
                                            </span>
                                        </div>

                                        {auditLog.selectedVariant && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-themed-muted">Wybrany wariant</span>
                                                <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 font-medium">
                                                    {auditLog.selectedVariant}
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-themed-muted">Kwota brutto</span>
                                            <span className="text-sm font-bold text-themed">
                                                {formatCurrency(Number(auditLog.totalGross))} {auditLog.currency}
                                            </span>
                                        </div>

                                        <div className="pt-3 border-t divider-themed">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs text-themed-muted">Adres IP</span>
                                                <span className="text-xs font-mono text-themed">{auditLog.ipAddress}</span>
                                            </div>
                                        </div>

                                        <div>
                                            <span className="text-xs text-themed-muted">User Agent</span>
                                            <p className="text-xs font-mono text-themed-muted mt-1 break-all leading-relaxed section-themed rounded-lg p-2">
                                                {auditLog.userAgent}
                                            </p>
                                        </div>

                                        <div className="pt-3 border-t divider-themed">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-xs text-themed-muted">Content Hash (SHA-256)</span>
                                                <button
                                                    onClick={() => handleCopyHash(auditLog.contentHash)}
                                                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md hover-themed text-cyan-600 dark:text-cyan-400 transition-colors"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                    </svg>
                                                    Kopiuj
                                                </button>
                                            </div>
                                            <div className="font-mono text-xs break-all leading-relaxed p-2.5 rounded-lg bg-slate-900 dark:bg-black/40 text-emerald-400 dark:text-emerald-300 select-all">
                                                {truncateHash(auditLog.contentHash, 20)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 pt-2 border-t divider-themed">
                                        <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                            Akceptacja potwierdzona formalnie — dane zweryfikowane i niemodyfikowalne
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!auditLog && offer.requireAuditTrail && (
                            <div className="rounded-2xl border border-amber-200 dark:border-amber-800 overflow-hidden">
                                <div className="p-4 bg-amber-50 dark:bg-amber-950/30">
                                    <div className="flex items-center gap-2.5">
                                        <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                        </svg>
                                        <div>
                                            <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">Audit Trail — oczekiwanie</h3>
                                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                                                Oferta wymaga formalnego potwierdzenia akceptacji. Dane zostaną zapisane po akceptacji przez klienta.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <Card>
                            <h2 className="text-lg font-semibold text-themed mb-4">Akcje</h2>
                            <div className="space-y-2">
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={handleDownloadPDF}
                                    disabled={isDownloadingPDF}
                                >
                                    {isDownloadingPDF ? (
                                        <>
                                            <svg className="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Generowanie PDF...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zm-3 9h2v5H9v-3H7v-2h3v-2H7v-2h5v4zm4 0h3v2h-3v1h3v2h-3v1h3v2h-5v-8h5v-2h-3v2z" />
                                            </svg>
                                            Pobierz PDF
                                        </>
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => setPublishDialogOpen(true)}
                                >
                                    <svg className="w-5 h-5 mr-2 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                    </svg>
                                    {offer.isInteractive ? 'Zarządzaj linkiem' : 'Publikuj interaktywny link'}
                                </Button>
                                <div className="pt-2 border-t divider-themed">
                                    <Button
                                        variant="ghost"
                                        className="w-full justify-start text-red-600 dark:text-red-400 hover:bg-red-500/10"
                                        onClick={() => setDeleteModal(true)}
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Usuń ofertę
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            )}

            {activeTab === 'analytics' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                            <p className="text-sm text-themed-muted">Wyświetlenia</p>
                            <p className="text-3xl font-bold text-themed mt-1">{analytics?.viewCount || 0}</p>
                        </Card>
                        <Card>
                            <p className="text-sm text-themed-muted">Unikalni odwiedzający</p>
                            <p className="text-3xl font-bold text-themed mt-1">{analytics?.uniqueVisitors || 0}</p>
                        </Card>
                        <Card>
                            <p className="text-sm text-themed-muted">Ostatnie otwarcie</p>
                            <p className="text-lg font-semibold text-themed mt-1">
                                {analytics?.lastViewedAt ? formatDateTime(analytics.lastViewedAt) : '—'}
                            </p>
                        </Card>
                        <Card>
                            <p className="text-sm text-themed-muted">Status linku</p>
                            <div className="mt-1">
                                {analytics?.isInteractive ? (
                                    <Badge className="badge-success">Aktywny</Badge>
                                ) : (
                                    <Badge className="badge-themed">Nieaktywny</Badge>
                                )}
                            </div>
                        </Card>
                    </div>

                    <Card>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                                </svg>
                                <h2 className="text-lg font-semibold text-themed">AI Observer — Analiza zachowań</h2>
                            </div>
                            <button
                                onClick={handleLoadObserver}
                                disabled={isLoadingObserver}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-medium hover:from-cyan-600 hover:to-blue-600 transition-all disabled:opacity-50"
                            >
                                {isLoadingObserver ? (
                                    <>
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Analizuję...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        {observerInsight ? 'Odśwież analizę' : 'Analizuj zachowanie'}
                                    </>
                                )}
                            </button>
                        </div>

                        {observerError && (
                            <div className="p-3 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 text-sm mb-4">{observerError}</div>
                        )}

                        {!observerInsight && !isLoadingObserver && !observerError && (
                            <div className="text-center py-8">
                                <svg className="w-12 h-12 mx-auto text-themed-muted opacity-40 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <p className="text-themed-muted text-sm">Kliknij &quot;Analizuj zachowanie&quot; aby AI przeanalizowało interakcje klienta</p>
                            </div>
                        )}

                        {observerInsight && !isLoadingObserver && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${intentConfig[observerInsight.clientIntent]?.color || intentConfig.unknown.color}`}>
                                        {intentConfig[observerInsight.clientIntent]?.label || 'Brak danych'}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-themed-muted">Zaangażowanie:</span>
                                        <div className="w-20 h-2 section-themed rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all ${engagementColor(observerInsight.engagementScore)}`}
                                                style={{ width: `${observerInsight.engagementScore * 10}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-semibold text-themed">{observerInsight.engagementScore}/10</span>
                                    </div>
                                </div>

                                <p className="text-sm text-themed leading-relaxed section-themed rounded-lg p-3">
                                    {observerInsight.summary}
                                </p>

                                {observerInsight.keyFindings.length > 0 && (
                                    <div>
                                        <h4 className="text-xs font-semibold text-themed-muted uppercase tracking-wide mb-2">Kluczowe ustalenia</h4>
                                        <ul className="space-y-1">
                                            {observerInsight.keyFindings.map((finding, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-sm text-themed">
                                                    <svg className="w-4 h-4 text-cyan-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    {finding}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {observerInsight.interestAreas.length > 0 && (
                                        <div>
                                            <h4 className="text-xs font-semibold text-themed-muted uppercase tracking-wide mb-2">Obszary zainteresowania</h4>
                                            <div className="flex flex-wrap gap-1.5">
                                                {observerInsight.interestAreas.map((area, idx) => (
                                                    <span key={idx} className="text-xs px-2 py-1 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/25">
                                                        {area}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {observerInsight.concerns.length > 0 && (
                                        <div>
                                            <h4 className="text-xs font-semibold text-themed-muted uppercase tracking-wide mb-2">Obawy klienta</h4>
                                            <div className="flex flex-wrap gap-1.5">
                                                {observerInsight.concerns.map((concern, idx) => (
                                                    <span key={idx} className="text-xs px-2 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                                                        {concern}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-4 text-xs text-themed-muted pt-2 border-t divider-themed">
                                    <span>Wyświetlenia: <strong className="text-themed">{observerInsight.timeAnalysis.totalViews}</strong></span>
                                    {observerInsight.timeAnalysis.avgViewDuration !== null && (
                                        <span>Śr. czas: <strong className="text-themed">{observerInsight.timeAnalysis.avgViewDuration}s</strong></span>
                                    )}
                                    {observerInsight.timeAnalysis.mostActiveTime && (
                                        <span>Najaktywniejszy: <strong className="text-themed">{observerInsight.timeAnalysis.mostActiveTime}</strong></span>
                                    )}
                                </div>
                            </div>
                        )}
                    </Card>

                    {analytics?.interactions && analytics.interactions.length > 0 && (
                        <Card>
                            <h2 className="text-lg font-semibold text-themed mb-4">Aktywność klienta</h2>
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {analytics.interactions.map((interaction) => {
                                    const typeLabels: Record<string, { label: string; icon: string; color: string }> = {
                                        VIEW: { label: 'Otworzył ofertę', icon: '👁', color: 'text-blue-600 dark:text-blue-400' },
                                        ITEM_SELECT: { label: 'Zmienił wybór pozycji', icon: '☑', color: 'text-cyan-600 dark:text-cyan-400' },
                                        ACCEPT: { label: 'Zaakceptował ofertę', icon: '✅', color: 'text-emerald-600 dark:text-emerald-400' },
                                        REJECT: { label: 'Odrzucił ofertę', icon: '❌', color: 'text-red-600 dark:text-red-400' },
                                        COMMENT: { label: 'Dodał komentarz', icon: '💬', color: 'text-purple-600 dark:text-purple-400' },
                                        PDF_DOWNLOAD: { label: 'Pobrał PDF', icon: '📄', color: 'text-orange-600 dark:text-orange-400' },
                                        VARIANT_SWITCH: { label: 'Zmienił wariant', icon: '🔀', color: 'text-cyan-600 dark:text-cyan-400' },
                                    };
                                    const config = typeLabels[interaction.type] || { label: interaction.type, icon: '•', color: 'text-themed-muted' };

                                    return (
                                        <div key={interaction.id} className="flex items-start gap-3 py-2 border-b divider-themed last:border-0">
                                            <span className="text-lg flex-shrink-0">{config.icon}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-medium ${config.color}`}>
                                                    {config.label}
                                                </p>
                                                <p className="text-xs text-themed-muted">
                                                    {formatDateTime(interaction.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    )}

                    {analytics?.clientSelectedData && (
                        <Card>
                            <h2 className="text-lg font-semibold text-themed mb-4">Wybór klienta</h2>
                            <div className="space-y-2">
                                {(analytics.clientSelectedData as unknown as Array<{ name: string; isSelected: boolean; quantity: number; brutto: number }>).map((item, index) => (                                    <div key={index} className={`flex justify-between items-center py-2 px-3 rounded-lg ${item.isSelected ? 'bg-emerald-500/10' : 'section-themed'}`}>
                                        <div className="flex items-center gap-2">
                                            {item.isSelected ? (
                                                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : (
                                                <svg className="w-4 h-4 text-themed-muted opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            )}
                                            <span className={`text-sm ${item.isSelected ? 'text-themed' : 'text-themed-muted line-through'}`}>
                                                {item.name} ×{item.quantity}
                                            </span>
                                        </div>
                                        <span className={`text-sm font-medium ${item.isSelected ? 'text-themed' : 'text-themed-muted opacity-40'}`}>
                                            {formatCurrency(item.brutto)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>
            )}

            {activeTab === 'comments' && (
                <div className="max-w-2xl space-y-6">
                    <Card>
                        <h2 className="text-lg font-semibold text-themed mb-4">
                            Komentarze ({comments.length})
                        </h2>

                        {comments.length > 0 ? (
                            <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                                {comments.map((comment) => (
                                    <div
                                        key={comment.id}
                                        className={`flex gap-3 ${comment.author === 'SELLER' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                                            comment.author === 'SELLER'
                                                ? 'bg-cyan-500 text-white rounded-br-sm'
                                                : 'section-themed text-themed rounded-bl-sm'
                                        }`}>
                                            <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                                            <div className={`flex items-center gap-2 mt-1 ${comment.author === 'SELLER' ? 'justify-end' : 'justify-start'}`}>
                                                <span className={`text-xs ${comment.author === 'SELLER' ? 'text-cyan-100' : 'text-themed-muted'}`}>
                                                    {comment.author === 'SELLER' ? 'Ty' : 'Klient'}
                                                </span>
                                                <span className={`text-xs ${comment.author === 'SELLER' ? 'text-cyan-200' : 'text-themed-muted opacity-50'}`}>•</span>
                                                <span className={`text-xs ${comment.author === 'SELLER' ? 'text-cyan-200' : 'text-themed-muted'}`}>
                                                    {formatDateTime(comment.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 mb-6">
                                <svg className="w-12 h-12 mx-auto text-themed-muted opacity-40 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <p className="text-themed-muted">Brak komentarzy</p>
                            </div>
                        )}

                        <div className="mb-4 pt-4 border-t divider-themed">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                                    </svg>
                                    <span className="text-sm font-semibold text-themed-label">AI Closer — Strategia negocjacji</span>
                                </div>
                                <button
                                    onClick={handleLoadCloser}
                                    disabled={isLoadingCloser}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-medium hover:from-cyan-600 hover:to-blue-600 transition-all disabled:opacity-50"
                                >
                                    {isLoadingCloser ? (
                                        <>
                                            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Generuję...
                                        </>
                                    ) : (
                                        closingStrategy ? 'Odśwież strategię' : 'Zasugeruj strategię'
                                    )}
                                </button>
                            </div>

                            {closerError && (
                                <div className="p-3 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 text-sm mb-3">{closerError}</div>
                            )}

                            {closingStrategy && !isLoadingCloser && (
                                <div className="space-y-3">
                                    {closingStrategy.contextSummary && (
                                        <p className="text-xs text-themed-muted section-themed rounded-lg p-2.5 italic">
                                            {closingStrategy.contextSummary}
                                        </p>
                                    )}

                                    <div
                                        className="rounded-xl border border-red-500/25 bg-red-500/5 overflow-hidden cursor-pointer"
                                        onClick={() => setExpandedStrategy(expandedStrategy === 'aggressive' ? null : 'aggressive')}
                                    >
                                        <div className="flex items-center justify-between px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm">🛡️</span>
                                                <span className="text-sm font-semibold text-themed">{closingStrategy.aggressive.title}</span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                                    closingStrategy.aggressive.riskLevel === 'low' ? 'badge-success' :
                                                        closingStrategy.aggressive.riskLevel === 'medium' ? 'badge-warning' :
                                                            'badge-danger'
                                                }`}>
                                                    Ryzyko: {closingStrategy.aggressive.riskLevel === 'low' ? 'niskie' : closingStrategy.aggressive.riskLevel === 'medium' ? 'średnie' : 'wysokie'}
                                                </span>
                                            </div>
                                            <svg className={`w-4 h-4 text-themed-muted transition-transform ${expandedStrategy === 'aggressive' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                        {expandedStrategy === 'aggressive' && (
                                            <div className="px-4 pb-4 space-y-3">
                                                <p className="text-xs text-themed-muted">{closingStrategy.aggressive.description}</p>
                                                <div className="card-themed border rounded-lg p-3 text-sm text-themed">
                                                    {closingStrategy.aggressive.suggestedResponse}
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleUseStrategy(closingStrategy.aggressive.suggestedResponse); }}
                                                    className="text-xs px-3 py-1.5 rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 transition-colors"
                                                >
                                                    Wstaw odpowiedź
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div
                                        className="rounded-xl border border-cyan-500/25 bg-cyan-500/5 overflow-hidden cursor-pointer"
                                        onClick={() => setExpandedStrategy(expandedStrategy === 'partnership' ? null : 'partnership')}
                                    >
                                        <div className="flex items-center justify-between px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm">🤝</span>
                                                <span className="text-sm font-semibold text-themed">{closingStrategy.partnership.title}</span>
                                            </div>
                                            <svg className={`w-4 h-4 text-themed-muted transition-transform ${expandedStrategy === 'partnership' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                        {expandedStrategy === 'partnership' && (
                                            <div className="px-4 pb-4 space-y-3">
                                                <p className="text-xs text-themed-muted">{closingStrategy.partnership.description}</p>
                                                {closingStrategy.partnership.proposedConcessions.length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {closingStrategy.partnership.proposedConcessions.map((c, i) => (
                                                            <span key={i} className="text-xs px-2 py-1 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">{c}</span>
                                                        ))}
                                                    </div>
                                                )}
                                                <div className="card-themed border rounded-lg p-3 text-sm text-themed">
                                                    {closingStrategy.partnership.suggestedResponse}
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleUseStrategy(closingStrategy.partnership.suggestedResponse); }}
                                                    className="text-xs px-3 py-1.5 rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 transition-colors"
                                                >
                                                    Wstaw odpowiedź
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div
                                        className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 overflow-hidden cursor-pointer"
                                        onClick={() => setExpandedStrategy(expandedStrategy === 'quickClose' ? null : 'quickClose')}
                                    >
                                        <div className="flex items-center justify-between px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm">⚡</span>
                                                <span className="text-sm font-semibold text-themed">{closingStrategy.quickClose.title}</span>
                                                <span className="text-xs px-2 py-0.5 rounded-full badge-success font-medium">
                                                    Max rabat: {closingStrategy.quickClose.maxDiscountPercent}%
                                                </span>
                                            </div>
                                            <svg className={`w-4 h-4 text-themed-muted transition-transform ${expandedStrategy === 'quickClose' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                        {expandedStrategy === 'quickClose' && (
                                            <div className="px-4 pb-4 space-y-3">
                                                <p className="text-xs text-themed-muted">{closingStrategy.quickClose.description}</p>
                                                <div className="card-themed border rounded-lg p-3 text-sm text-themed">
                                                    {closingStrategy.quickClose.suggestedResponse}
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleUseStrategy(closingStrategy.quickClose.suggestedResponse); }}
                                                    className="text-xs px-3 py-1.5 rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 transition-colors"
                                                >
                                                    Wstaw odpowiedź
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleAddSellerComment();
                                    }
                                }}
                                disabled={isSending}
                                placeholder="Odpowiedz klientowi..."
                                rows={2}
                                className="flex-1 px-4 py-3 rounded-xl border input-themed resize-none disabled:opacity-50 text-sm"
                            />
                            <button
                                onClick={handleAddSellerComment}
                                disabled={!newComment.trim() || isSending}
                                className="self-end px-4 py-3 rounded-xl bg-cyan-500 text-white hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                            >
                                {isSending ? (
                                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </Card>
                </div>
            )}

            <ConfirmDialog
                isOpen={deleteModal}
                onClose={() => setDeleteModal(false)}
                onConfirm={handleDelete}
                title="Usuń ofertę"
                description={`Czy na pewno chcesz usunąć ofertę "${offer.title}" (${offer.number})? Ta operacja jest nieodwracalna.`}
                confirmLabel="Usuń"
                isLoading={isDeleting}
            />

            <PublishDialog
                isOpen={publishDialogOpen}
                onClose={() => setPublishDialogOpen(false)}
                offerId={offer.id}
                offerNumber={offer.number}
                validUntil={offer.validUntil}
                currentToken={offer.publicToken}
                isInteractive={offer.isInteractive}
                clientEmail={offer.client?.email || null}
                onPublished={handlePublished}
            />
        </div>
    );
}
// SmartQuote-AI/src/app/dashboard/offers/[id]/page.tsx

'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useOffer, useOfferAnalytics, useOfferComments } from '@/hooks/useOffers';
import { offersApi, ai } from '@/lib/api';
import { Button, Card, Badge, ConfirmDialog } from '@/components/ui';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatDate, formatDateTime, formatCurrency, getStatusConfig, getInitials } from '@/lib/utils';
import { OfferStatus } from '@/types';
import type { ObserverInsight, ClosingStrategy } from '@/types/ai';
import PublishDialog from '@/components/offers/PublishDialog';

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
    likely_accept: { label: 'Prawdopodobna akceptacja', color: 'bg-emerald-100 text-emerald-700' },
    undecided: { label: 'Niezdecydowany', color: 'bg-amber-100 text-amber-700' },
    likely_reject: { label: 'Prawdopodobne odrzucenie', color: 'bg-red-100 text-red-700' },
    unknown: { label: 'Brak danych', color: 'bg-slate-100 text-slate-500' },
};

export default function OfferDetailPage({ params }: PageProps) {
    const { id } = use(params);

    const router = useRouter();
    const { data: session } = useSession();
    const { offer, isLoading, error, refresh } = useOffer(id);
    const { analytics, refresh: refreshAnalytics } = useOfferAnalytics(id);
    const { comments, isSending, addComment, refresh: refreshComments } = useOfferComments(id);

    const [activeTab, setActiveTab] = useState<Tab>('details');
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
    const [pdfError, setPdfError] = useState<string | null>(null);
    const [publishDialogOpen, setPublishDialogOpen] = useState(false);
    const [newComment, setNewComment] = useState('');

    const [observerInsight, setObserverInsight] = useState<ObserverInsight | null>(null);
    const [isLoadingObserver, setIsLoadingObserver] = useState(false);
    const [observerError, setObserverError] = useState<string | null>(null);

    const [closingStrategy, setClosingStrategy] = useState<ClosingStrategy | null>(null);
    const [isLoadingCloser, setIsLoadingCloser] = useState(false);
    const [closerError, setCloserError] = useState<string | null>(null);
    const [expandedStrategy, setExpandedStrategy] = useState<string | null>(null);

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
        } catch (err) {
            console.error('Status update error:', err);
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleDelete = async () => {
        if (!offer) return;
        setIsDeleting(true);
        try {
            await offersApi.delete(offer.id);
            router.push('/dashboard/offers');
        } catch (err) {
            console.error('Delete error:', err);
            setIsDeleting(false);
        }
    };

    const handleDuplicate = async () => {
        if (!offer) return;
        try {
            const response = await offersApi.duplicate(offer.id);
            if (response.data?.id) {
                router.push(`/dashboard/offers/${response.data.id}/edit`);
            }
        } catch (err) {
            console.error('Duplicate error:', err);
        }
    };

    const handleDownloadPDF = async () => {
        if (!offer) return;
        const token = session?.accessToken || localStorage.getItem('token');
        if (!token) {
            setPdfError('Brak autoryzacji. Zaloguj się ponownie.');
            return;
        }
        setIsDownloadingPDF(true);
        setPdfError(null);
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
        } catch (err) {
            console.error('Error downloading PDF:', err);
            setPdfError(err instanceof Error ? err.message : 'Wystąpił błąd podczas pobierania PDF');
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
            <div className="p-8">
                <Card>
                    <div className="text-center py-12">
                        <p className="text-red-600 mb-4">{error || 'Nie znaleziono oferty'}</p>
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

    return (
        <div className="p-8">
            <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/dashboard/offers')}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-slate-900">{offer.title}</h1>
                            <Badge className={`${status.bgColor} ${status.color}`} size="md">
                                {status.label}
                            </Badge>
                            {isExpired && offer.status !== 'EXPIRED' && (
                                <Badge variant="danger" size="md">Wygasła</Badge>
                            )}
                            {offer.isInteractive && (
                                <Badge className="bg-cyan-100 text-cyan-700" size="md">
                                    Link aktywny
                                </Badge>
                            )}
                        </div>
                        <p className="text-slate-500 mt-1">{offer.number}</p>
                    </div>
                </div>
                <div className="flex gap-2">
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
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                                {availableTransitions.map((newStatus) => {
                                    const statusConfig = getStatusConfig(newStatus);
                                    return (
                                        <button
                                            key={newStatus}
                                            onClick={() => handleStatusChange(newStatus)}
                                            className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 first:rounded-t-lg last:rounded-b-lg"
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
                <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                                activeTab === tab.id
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {tab.label}
                            {tab.count !== undefined && tab.count > 0 && (
                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                    activeTab === tab.id
                                        ? 'bg-cyan-100 text-cyan-700'
                                        : 'bg-slate-200 text-slate-500'
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
                                <h2 className="text-lg font-semibold text-slate-900 mb-3">Opis</h2>
                                <p className="text-slate-700 whitespace-pre-wrap">{offer.description}</p>
                            </Card>
                        )}

                        <Card>
                            <h2 className="text-lg font-semibold text-slate-900 mb-4">
                                Pozycje ({offer.items?.length || 0})
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                    <tr className="border-b border-slate-200">
                                        <th className="pb-3 text-left text-xs font-semibold text-slate-500 uppercase">Pozycja</th>
                                        <th className="pb-3 text-right text-xs font-semibold text-slate-500 uppercase">Ilość</th>
                                        <th className="pb-3 text-right text-xs font-semibold text-slate-500 uppercase">Cena</th>
                                        <th className="pb-3 text-right text-xs font-semibold text-slate-500 uppercase">VAT</th>
                                        <th className="pb-3 text-right text-xs font-semibold text-slate-500 uppercase">Wartość</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                    {offer.items?.map((item, index) => (
                                        <tr key={item.id || index}>
                                            <td className="py-3">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-slate-900">{item.name}</p>
                                                    {item.isOptional && (
                                                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
                                                            Opcjonalna
                                                        </span>
                                                    )}
                                                </div>
                                                {item.description && (
                                                    <p className="text-sm text-slate-500 mt-1">{item.description}</p>
                                                )}
                                            </td>
                                            <td className="py-3 text-right text-slate-600">
                                                {Number(item.quantity)} {item.unit}
                                            </td>
                                            <td className="py-3 text-right text-slate-600">
                                                {formatCurrency(Number(item.unitPrice))}
                                                {Number(item.discount) > 0 && (
                                                    <span className="text-xs text-emerald-600 ml-1">
                                                        -{item.discount}%
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 text-right text-slate-600">
                                                {item.vatRate}%
                                            </td>
                                            <td className="py-3 text-right font-semibold text-slate-900">
                                                {formatCurrency(Number(item.totalGross))}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-200">
                                <div className="flex justify-end">
                                    <div className="w-64 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Suma netto:</span>
                                            <span className="font-medium text-slate-900">{formatCurrency(Number(offer.totalNet))}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">VAT:</span>
                                            <span className="font-medium text-slate-900">{formatCurrency(Number(offer.totalVat))}</span>
                                        </div>
                                        <div className="flex justify-between text-lg pt-2 border-t border-slate-200">
                                            <span className="font-semibold text-slate-900">Suma brutto:</span>
                                            <span className="font-bold text-cyan-600">{formatCurrency(Number(offer.totalGross))}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {offer.terms && (
                            <Card>
                                <h2 className="text-lg font-semibold text-slate-900 mb-3">Warunki płatności</h2>
                                <p className="text-slate-700 whitespace-pre-wrap">{offer.terms}</p>
                            </Card>
                        )}

                        {offer.notes && (
                            <Card>
                                <h2 className="text-lg font-semibold text-slate-900 mb-3">
                                    <span className="flex items-center gap-2">
                                        <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        Notatki wewnętrzne
                                    </span>
                                </h2>
                                <p className="text-slate-700 whitespace-pre-wrap">{offer.notes}</p>
                            </Card>
                        )}
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <h2 className="text-lg font-semibold text-slate-900 mb-4">Klient</h2>
                            <div
                                className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors"
                                onClick={() => router.push(`/dashboard/clients/${offer.client.id}`)}
                            >
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white font-semibold">
                                    {getInitials(offer.client.name)}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-slate-900">{offer.client.name}</p>
                                    <p className="text-sm text-slate-500">{offer.client.email}</p>
                                </div>
                                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </Card>

                        <Card>
                            <h2 className="text-lg font-semibold text-slate-900 mb-4">Szczegóły</h2>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Numer</span>
                                    <span className="font-medium text-slate-900">{offer.number}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Utworzono</span>
                                    <span className="text-slate-900">{formatDateTime(offer.createdAt)}</span>
                                </div>
                                {offer.validUntil && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Ważna do</span>
                                        <span className={isExpired ? 'text-red-600 font-medium' : 'text-slate-900'}>
                                            {formatDate(offer.validUntil)}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Termin płatności</span>
                                    <span className="text-slate-900">{offer.paymentDays} dni</span>
                                </div>
                                {offer.sentAt && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Wysłano</span>
                                        <span className="text-slate-900">{formatDateTime(offer.sentAt)}</span>
                                    </div>
                                )}
                                {offer.viewedAt && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Otwarto</span>
                                        <span className="text-slate-900">{formatDateTime(offer.viewedAt)}</span>
                                    </div>
                                )}
                                {offer.acceptedAt && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Zaakceptowano</span>
                                        <span className="text-emerald-600 font-medium">{formatDateTime(offer.acceptedAt)}</span>
                                    </div>
                                )}
                                {offer.rejectedAt && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Odrzucono</span>
                                        <span className="text-red-600 font-medium">{formatDateTime(offer.rejectedAt)}</span>
                                    </div>
                                )}
                                {offer.viewCount > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Wyświetlenia</span>
                                        <span className="text-slate-900">{offer.viewCount}</span>
                                    </div>
                                )}
                            </div>
                        </Card>

                        <Card>
                            <h2 className="text-lg font-semibold text-slate-900 mb-4">Akcje</h2>
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
                                {pdfError && (
                                    <p className="text-sm text-red-600 px-2">{pdfError}</p>
                                )}
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
                                <div className="pt-2 border-t border-slate-200">
                                    <Button
                                        variant="ghost"
                                        className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
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
                            <p className="text-sm text-slate-500">Wyświetlenia</p>
                            <p className="text-3xl font-bold text-slate-900 mt-1">{analytics?.viewCount || 0}</p>
                        </Card>
                        <Card>
                            <p className="text-sm text-slate-500">Unikalni odwiedzający</p>
                            <p className="text-3xl font-bold text-slate-900 mt-1">{analytics?.uniqueVisitors || 0}</p>
                        </Card>
                        <Card>
                            <p className="text-sm text-slate-500">Ostatnie otwarcie</p>
                            <p className="text-lg font-semibold text-slate-900 mt-1">
                                {analytics?.lastViewedAt ? formatDateTime(analytics.lastViewedAt) : '—'}
                            </p>
                        </Card>
                        <Card>
                            <p className="text-sm text-slate-500">Status linku</p>
                            <div className="mt-1">
                                {analytics?.isInteractive ? (
                                    <Badge className="bg-emerald-100 text-emerald-700">Aktywny</Badge>
                                ) : (
                                    <Badge className="bg-slate-100 text-slate-500">Nieaktywny</Badge>
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
                                <h2 className="text-lg font-semibold text-slate-900">AI Observer — Analiza zachowań</h2>
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
                            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm mb-4">{observerError}</div>
                        )}

                        {!observerInsight && !isLoadingObserver && !observerError && (
                            <div className="text-center py-8">
                                <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <p className="text-slate-400 text-sm">Kliknij &quot;Analizuj zachowanie&quot; aby AI przeanalizowało interakcje klienta</p>
                            </div>
                        )}

                        {observerInsight && !isLoadingObserver && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${intentConfig[observerInsight.clientIntent]?.color || intentConfig.unknown.color}`}>
                                        {intentConfig[observerInsight.clientIntent]?.label || 'Brak danych'}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-500">Zaangażowanie:</span>
                                        <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all ${engagementColor(observerInsight.engagementScore)}`}
                                                style={{ width: `${observerInsight.engagementScore * 10}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-semibold text-slate-700">{observerInsight.engagementScore}/10</span>
                                    </div>
                                </div>

                                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-lg p-3">
                                    {observerInsight.summary}
                                </p>

                                {observerInsight.keyFindings.length > 0 && (
                                    <div>
                                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Kluczowe ustalenia</h4>
                                        <ul className="space-y-1">
                                            {observerInsight.keyFindings.map((finding, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
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
                                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Obszary zainteresowania</h4>
                                            <div className="flex flex-wrap gap-1.5">
                                                {observerInsight.interestAreas.map((area, idx) => (
                                                    <span key={idx} className="text-xs px-2 py-1 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
                                                        {area}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {observerInsight.concerns.length > 0 && (
                                        <div>
                                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Obawy klienta</h4>
                                            <div className="flex flex-wrap gap-1.5">
                                                {observerInsight.concerns.map((concern, idx) => (
                                                    <span key={idx} className="text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                                        {concern}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
                                    <span>Wyświetlenia: <strong className="text-slate-700">{observerInsight.timeAnalysis.totalViews}</strong></span>
                                    {observerInsight.timeAnalysis.avgViewDuration !== null && (
                                        <span>Śr. czas: <strong className="text-slate-700">{observerInsight.timeAnalysis.avgViewDuration}s</strong></span>
                                    )}
                                    {observerInsight.timeAnalysis.mostActiveTime && (
                                        <span>Najaktywniejszy: <strong className="text-slate-700">{observerInsight.timeAnalysis.mostActiveTime}</strong></span>
                                    )}
                                </div>
                            </div>
                        )}
                    </Card>

                    {analytics?.interactions && analytics.interactions.length > 0 && (
                        <Card>
                            <h2 className="text-lg font-semibold text-slate-900 mb-4">Aktywność klienta</h2>
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {analytics.interactions.map((interaction) => {
                                    const typeLabels: Record<string, { label: string; icon: string; color: string }> = {
                                        VIEW: { label: 'Otworzył ofertę', icon: '👁', color: 'text-blue-600' },
                                        ITEM_SELECT: { label: 'Zmienił wybór pozycji', icon: '☑', color: 'text-cyan-600' },
                                        ACCEPT: { label: 'Zaakceptował ofertę', icon: '✅', color: 'text-emerald-600' },
                                        REJECT: { label: 'Odrzucił ofertę', icon: '❌', color: 'text-red-600' },
                                        COMMENT: { label: 'Dodał komentarz', icon: '💬', color: 'text-purple-600' },
                                        PDF_DOWNLOAD: { label: 'Pobrał PDF', icon: '📄', color: 'text-orange-600' },
                                    };
                                    const config = typeLabels[interaction.type] || { label: interaction.type, icon: '•', color: 'text-slate-600' };

                                    return (
                                        <div key={interaction.id} className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
                                            <span className="text-lg flex-shrink-0">{config.icon}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-medium ${config.color}`}>
                                                    {config.label}
                                                </p>
                                                <p className="text-xs text-slate-400">
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
                            <h2 className="text-lg font-semibold text-slate-900 mb-4">Wybór klienta</h2>
                            <div className="space-y-2">
                                {(analytics.clientSelectedData as Array<{ name: string; isSelected: boolean; quantity: number; brutto: number }>).map((item, index) => (
                                    <div key={index} className={`flex justify-between items-center py-2 px-3 rounded-lg ${item.isSelected ? 'bg-emerald-50' : 'bg-slate-50'}`}>
                                        <div className="flex items-center gap-2">
                                            {item.isSelected ? (
                                                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : (
                                                <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            )}
                                            <span className={`text-sm ${item.isSelected ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
                                                {item.name} ×{item.quantity}
                                            </span>
                                        </div>
                                        <span className={`text-sm font-medium ${item.isSelected ? 'text-slate-900' : 'text-slate-300'}`}>
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
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">
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
                                                : 'bg-slate-100 text-slate-900 rounded-bl-sm'
                                        }`}>
                                            <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                                            <div className={`flex items-center gap-2 mt-1 ${comment.author === 'SELLER' ? 'justify-end' : 'justify-start'}`}>
                                                <span className={`text-xs ${comment.author === 'SELLER' ? 'text-cyan-100' : 'text-slate-400'}`}>
                                                    {comment.author === 'SELLER' ? 'Ty' : 'Klient'}
                                                </span>
                                                <span className={`text-xs ${comment.author === 'SELLER' ? 'text-cyan-200' : 'text-slate-300'}`}>•</span>
                                                <span className={`text-xs ${comment.author === 'SELLER' ? 'text-cyan-200' : 'text-slate-400'}`}>
                                                    {formatDateTime(comment.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 mb-6">
                                <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <p className="text-slate-400">Brak komentarzy</p>
                            </div>
                        )}

                        <div className="mb-4 pt-4 border-t border-slate-200">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                                    </svg>
                                    <span className="text-sm font-semibold text-slate-700">AI Closer — Strategia negocjacji</span>
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
                                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm mb-3">{closerError}</div>
                            )}

                            {closingStrategy && !isLoadingCloser && (
                                <div className="space-y-3">
                                    {closingStrategy.contextSummary && (
                                        <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-2.5 italic">
                                            {closingStrategy.contextSummary}
                                        </p>
                                    )}

                                    <div
                                        className="rounded-xl border border-red-200 bg-red-50/30 overflow-hidden cursor-pointer"
                                        onClick={() => setExpandedStrategy(expandedStrategy === 'aggressive' ? null : 'aggressive')}
                                    >
                                        <div className="flex items-center justify-between px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm">🛡️</span>
                                                <span className="text-sm font-semibold text-slate-900">{closingStrategy.aggressive.title}</span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                                    closingStrategy.aggressive.riskLevel === 'low' ? 'bg-emerald-100 text-emerald-700' :
                                                        closingStrategy.aggressive.riskLevel === 'medium' ? 'bg-amber-100 text-amber-700' :
                                                            'bg-red-100 text-red-700'
                                                }`}>
                                                    Ryzyko: {closingStrategy.aggressive.riskLevel === 'low' ? 'niskie' : closingStrategy.aggressive.riskLevel === 'medium' ? 'średnie' : 'wysokie'}
                                                </span>
                                            </div>
                                            <svg className={`w-4 h-4 text-slate-400 transition-transform ${expandedStrategy === 'aggressive' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                        {expandedStrategy === 'aggressive' && (
                                            <div className="px-4 pb-4 space-y-3">
                                                <p className="text-xs text-slate-600">{closingStrategy.aggressive.description}</p>
                                                <div className="bg-white rounded-lg p-3 border border-red-100 text-sm text-slate-800">
                                                    {closingStrategy.aggressive.suggestedResponse}
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleUseStrategy(closingStrategy.aggressive.suggestedResponse); }}
                                                    className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                                                >
                                                    Wstaw odpowiedź
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div
                                        className="rounded-xl border border-cyan-200 bg-cyan-50/30 overflow-hidden cursor-pointer"
                                        onClick={() => setExpandedStrategy(expandedStrategy === 'partnership' ? null : 'partnership')}
                                    >
                                        <div className="flex items-center justify-between px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm">🤝</span>
                                                <span className="text-sm font-semibold text-slate-900">{closingStrategy.partnership.title}</span>
                                            </div>
                                            <svg className={`w-4 h-4 text-slate-400 transition-transform ${expandedStrategy === 'partnership' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                        {expandedStrategy === 'partnership' && (
                                            <div className="px-4 pb-4 space-y-3">
                                                <p className="text-xs text-slate-600">{closingStrategy.partnership.description}</p>
                                                {closingStrategy.partnership.proposedConcessions.length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {closingStrategy.partnership.proposedConcessions.map((c, i) => (
                                                            <span key={i} className="text-xs px-2 py-1 rounded-full bg-cyan-100 text-cyan-700">{c}</span>
                                                        ))}
                                                    </div>
                                                )}
                                                <div className="bg-white rounded-lg p-3 border border-cyan-100 text-sm text-slate-800">
                                                    {closingStrategy.partnership.suggestedResponse}
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleUseStrategy(closingStrategy.partnership.suggestedResponse); }}
                                                    className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                                                >
                                                    Wstaw odpowiedź
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div
                                        className="rounded-xl border border-emerald-200 bg-emerald-50/30 overflow-hidden cursor-pointer"
                                        onClick={() => setExpandedStrategy(expandedStrategy === 'quickClose' ? null : 'quickClose')}
                                    >
                                        <div className="flex items-center justify-between px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm">⚡</span>
                                                <span className="text-sm font-semibold text-slate-900">{closingStrategy.quickClose.title}</span>
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                                                    Max rabat: {closingStrategy.quickClose.maxDiscountPercent}%
                                                </span>
                                            </div>
                                            <svg className={`w-4 h-4 text-slate-400 transition-transform ${expandedStrategy === 'quickClose' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                        {expandedStrategy === 'quickClose' && (
                                            <div className="px-4 pb-4 space-y-3">
                                                <p className="text-xs text-slate-600">{closingStrategy.quickClose.description}</p>
                                                <div className="bg-white rounded-lg p-3 border border-emerald-100 text-sm text-slate-800">
                                                    {closingStrategy.quickClose.suggestedResponse}
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleUseStrategy(closingStrategy.quickClose.suggestedResponse); }}
                                                    className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors"
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
                                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none disabled:opacity-50 text-sm"
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
                onPublished={handlePublished}
            />
        </div>
    );
}
// src/app/dashboard/offers/[id]/page.tsx

'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useOffer } from '@/hooks/useOffers';
import { offersApi } from '@/lib/api';
import { Button, Card, Badge, ConfirmDialog } from '@/components/ui';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatDate, formatDateTime, formatCurrency, getStatusConfig, getInitials } from '@/lib/utils';
import { OfferStatus } from '@/types';

const STATUS_TRANSITIONS: Record<OfferStatus, OfferStatus[]> = {
    DRAFT: ['SENT'],
    SENT: ['VIEWED', 'NEGOTIATION', 'ACCEPTED', 'REJECTED'],
    VIEWED: ['NEGOTIATION', 'ACCEPTED', 'REJECTED'],
    NEGOTIATION: ['ACCEPTED', 'REJECTED', 'SENT'],
    ACCEPTED: [],
    REJECTED: ['DRAFT'],
    EXPIRED: ['DRAFT'],
};

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function OfferDetailPage({ params }: PageProps) {
    // Rozpakowanie Promise z params (Next.js 15)
    const { id } = use(params);

    const router = useRouter();
    const { data: session } = useSession();
    const { offer, isLoading, error, refresh } = useOffer(id);

    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
    const [pdfError, setPdfError] = useState<string | null>(null);

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
            router.push(`/dashboard/offers/${response.data.id}/edit`);
        } catch (err) {
            console.error('Duplicate error:', err);
        }
    };

    // Funkcja pobierania PDF
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
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
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
        } catch (error) {
            console.error('Error downloading PDF:', error);
            setPdfError(error instanceof Error ? error.message : 'Wystąpił błąd podczas pobierania PDF');
        } finally {
            setIsDownloadingPDF(false);
        }
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

    return (
        <div className="p-8">
            {/* Header */}
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
                        </div>
                        <p className="text-slate-500 mt-1">{offer.number}</p>
                    </div>
                </div>
                <div className="flex gap-2">
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Description */}
                    {offer.description && (
                        <Card>
                            <h2 className="text-lg font-semibold text-slate-900 mb-3">Opis</h2>
                            <p className="text-slate-700 whitespace-pre-wrap">{offer.description}</p>
                        </Card>
                    )}

                    {/* Items */}
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
                                            <p className="font-medium text-slate-900">{item.name}</p>
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

                        {/* Totals */}
                        <div className="mt-4 pt-4 border-t border-slate-200">
                            <div className="flex justify-end">
                                <div className="w-64 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Suma netto:</span>
                                        <span className="font-medium text-slate-900">
                                            {formatCurrency(Number(offer.totalNet))}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">VAT:</span>
                                        <span className="font-medium text-slate-900">
                                            {formatCurrency(Number(offer.totalVat))}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-lg pt-2 border-t border-slate-200">
                                        <span className="font-semibold text-slate-900">Suma brutto:</span>
                                        <span className="font-bold text-cyan-600">
                                            {formatCurrency(Number(offer.totalGross))}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Terms */}
                    {offer.terms && (
                        <Card>
                            <h2 className="text-lg font-semibold text-slate-900 mb-3">Warunki płatności</h2>
                            <p className="text-slate-700 whitespace-pre-wrap">{offer.terms}</p>
                        </Card>
                    )}

                    {/* Internal Notes */}
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

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Client */}
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

                    {/* Details */}
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
                        </div>
                    </Card>

                    {/* Actions */}
                    <Card>
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">Akcje</h2>
                        <div className="space-y-2">
                            {/* PRZYCISK PDF */}
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
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zm-3 9h2v5H9v-3H7v-2h3v-2H7v-2h5v4zm4 0h3v2h-3v1h3v2h-3v1h3v2h-5v-8h5v-2h-3v2z"/>
                                        </svg>
                                        Pobierz PDF
                                    </>
                                )}
                            </Button>

                            {pdfError && (
                                <p className="text-sm text-red-600 px-2">{pdfError}</p>
                            )}

                            <Button variant="outline" className="w-full justify-start" disabled>
                                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                Wyślij mailem
                                <Badge variant="warning" size="sm" className="ml-auto">Wkrótce</Badge>
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

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={deleteModal}
                onClose={() => setDeleteModal(false)}
                onConfirm={handleDelete}
                title="Usuń ofertę"
                description={`Czy na pewno chcesz usunąć ofertę "${offer.title}" (${offer.number})? Ta operacja jest nieodwracalna.`}
                confirmLabel="Usuń"
                isLoading={isDeleting}
            />
        </div>
    );
}
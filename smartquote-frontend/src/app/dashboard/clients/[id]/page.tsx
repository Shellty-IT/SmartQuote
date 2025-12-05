'use client';

import { useRouter } from 'next/navigation';
import { useClient } from '@/hooks/useClients';
import { useOffers } from '@/hooks/useOffers';
import { Button, Card, Badge } from '@/components/ui';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatDate, formatCurrency, getStatusConfig, getInitials } from '@/lib/utils';

export default function ClientDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { client, isLoading, error } = useClient(params.id);
    const { offers } = useOffers({ clientId: params.id, limit: 5 });

    if (isLoading) return <PageLoader />;

    if (error || !client) {
        return (
            <div className="p-8">
                <Card>
                    <div className="text-center py-12">
                        <p className="text-red-600 mb-4">{error || 'Nie znaleziono klienta'}</p>
                        <Button onClick={() => router.push('/dashboard/clients')}>
                            Wróć do listy
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/dashboard/clients')}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white text-xl font-semibold">
                        {getInitials(client.name)}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{client.name}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant={client.type === 'COMPANY' ? 'info' : 'default'}>
                                {client.type === 'COMPANY' ? 'Firma' : 'Osoba prywatna'}
                            </Badge>
                            <Badge variant={client.isActive ? 'success' : 'default'}>
                                {client.isActive ? 'Aktywny' : 'Nieaktywny'}
                            </Badge>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => router.push(`/dashboard/offers/new?clientId=${client.id}`)}>
                        Nowa oferta
                    </Button>
                    <Button onClick={() => router.push(`/dashboard/clients/${client.id}/edit`)}>
                        Edytuj
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">Dane kontaktowe</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-slate-500">Email</p>
                                <p className="text-slate-900">{client.email || '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Telefon</p>
                                <p className="text-slate-900">{client.phone || '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Strona WWW</p>
                                {client.website ? (
                                    <a href={client.website} target="_blank" className="text-cyan-600 hover:underline">
                                        {client.website}
                                    </a>
                                ) : (
                                    <p className="text-slate-900">-</p>
                                )}
                            </div>
                            {client.type === 'COMPANY' && (
                                <>
                                    <div>
                                        <p className="text-sm text-slate-500">NIP</p>
                                        <p className="text-slate-900">{client.nip || '-'}</p>
                                    </div>
                                </>
                            )}
                        </div>
                    </Card>

                    <Card>
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">Adres</h2>
                        <div className="space-y-1">
                            <p className="text-slate-900">{client.address || '-'}</p>
                            <p className="text-slate-900">
                                {client.postalCode} {client.city}
                            </p>
                            <p className="text-slate-500">{client.country}</p>
                        </div>
                    </Card>

                    {client.notes && (
                        <Card>
                            <h2 className="text-lg font-semibold text-slate-900 mb-4">Notatki</h2>
                            <p className="text-slate-700 whitespace-pre-wrap">{client.notes}</p>
                        </Card>
                    )}

                    {/* Recent Offers */}
                    <Card>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-slate-900">Ostatnie oferty</h2>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/dashboard/offers?clientId=${client.id}`)}
                            >
                                Zobacz wszystkie
                            </Button>
                        </div>

                        {offers.length === 0 ? (
                            <p className="text-slate-500 text-center py-8">Brak ofert dla tego klienta</p>
                        ) : (
                            <div className="space-y-3">
                                {offers.map((offer) => {
                                    const status = getStatusConfig(offer.status);
                                    return (
                                        <div
                                            key={offer.id}
                                            onClick={() => router.push(`/dashboard/offers/${offer.id}`)}
                                            className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
                                        >
                                            <div>
                                                <p className="font-medium text-slate-900">{offer.title}</p>
                                                <p className="text-sm text-slate-500">{offer.number}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-slate-900">
                                                    {formatCurrency(offer.totalGross)}
                                                </p>
                                                <Badge className={`${status.bgColor} ${status.color}`}>
                                                    {status.label}
                                                </Badge>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">Statystyki</h2>
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Wszystkie oferty</span>
                                <span className="font-semibold text-slate-900">{client._count?.offers || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Dodano</span>
                                <span className="text-slate-900">{formatDate(client.createdAt)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Ostatnia aktualizacja</span>
                                <span className="text-slate-900">{formatDate(client.updatedAt)}</span>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">Szybkie akcje</h2>
                        <div className="space-y-2">
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => router.push(`/dashboard/offers/new?clientId=${client.id}`)}
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Nowa oferta
                            </Button>
                            {client.email && (
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => window.location.href = `mailto:${client.email}`}
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    Wyślij email
                                </Button>
                            )}
                            {client.phone && (
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => window.location.href = `tel:${client.phone}`}
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    Zadzwoń
                                </Button>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useOffers, useOffersStats } from '@/hooks/useOffers';
import { useClientsStats } from '@/hooks/useClients';
import KPICard from './components/KPICard';
import { Card, Badge, Button } from '@/components/ui';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatCurrency, formatRelativeTime, getStatusConfig, getInitials } from '@/lib/utils';

export default function DashboardPage() {
    const { data: session } = useSession();
    const router = useRouter();

    // Pobierz dane z API
    const { stats: offersStats, isLoading: isLoadingOffersStats } = useOffersStats();
    const { stats: clientsStats, isLoading: isLoadingClientsStats } = useClientsStats();
    const { offers: recentOffers, isLoading: isLoadingOffers } = useOffers({ limit: 5 });

    const userName = session?.user?.name || session?.user?.email?.split('@')[0] || 'Użytkownik';

    // Oblicz metryki
    const activeOffersCount = offersStats?.total
        ? offersStats.total - (offersStats.byStatus?.REJECTED?.count || 0) - (offersStats.byStatus?.EXPIRED?.count || 0)
        : 0;

    const pipelineValue = offersStats?.totalValue
        ? offersStats.totalValue - (offersStats.byStatus?.REJECTED?.value || 0) - (offersStats.byStatus?.EXPIRED?.value || 0)
        : 0;

    const conversionRate = offersStats?.total && offersStats.total > 0
        ? Math.round(((offersStats.byStatus?.ACCEPTED?.count || 0) / offersStats.total) * 100)
        : 0;

    const pendingFollowups = (offersStats?.byStatus?.SENT?.count || 0) + (offersStats?.byStatus?.VIEWED?.count || 0);

    const isLoading = isLoadingOffersStats || isLoadingClientsStats || isLoadingOffers;

    if (isLoading) {
        return <PageLoader />;
    }

    return (
        <div className="min-h-screen">
            {/* Top Header */}
            <header className="sticky top-0 z-30 bg-slate-50/80 backdrop-blur-sm border-b border-slate-200/60">
                <div className="flex items-center justify-between px-8 py-4">
                    {/* Search */}
                    <div className="relative w-96">
                        <svg
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Szukaj ofert, klientów, umów..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                        />
                        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-xs text-slate-400 bg-slate-100 rounded">
                            ⌘K
                        </kbd>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-4">
                        {/* Notifications */}
                        <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            {pendingFollowups > 0 && (
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                            )}
                        </button>

                        {/* User */}
                        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                            <div className="text-right">
                                <p className="text-sm font-medium text-slate-700">{userName}</p>
                                <p className="text-xs text-slate-500">{session?.user?.email}</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-semibold shadow-lg shadow-cyan-500/25">
                                {userName.charAt(0).toUpperCase()}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="p-8">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-900">
                        Witaj ponownie, {userName}! 👋
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Oto przegląd Twojej aktywności sprzedażowej
                    </p>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-3 mb-8">
                    <Button onClick={() => router.push('/dashboard/offers/new')}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Nowa oferta
                    </Button>
                    <Button variant="outline" onClick={() => router.push('/dashboard/clients/new')}>
                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        Dodaj klienta
                    </Button>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <KPICard
                        title="Aktywne oferty"
                        value={String(activeOffersCount)}
                        change={offersStats?.byStatus?.DRAFT?.count ? `${offersStats.byStatus.DRAFT.count} szkiców` : '0 szkiców'}
                        changeType="neutral"
                        description="bez odrzuconych i wygasłych"
                        iconBg="bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30"
                        icon={
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        }
                    />
                    <KPICard
                        title="Wartość pipeline'u"
                        value={formatCurrency(pipelineValue).replace('PLN', '').trim()}
                        change={`${formatCurrency(offersStats?.acceptedValue || 0)} zaakceptowane`}
                        changeType="positive"
                        description="PLN łącznie"
                        iconBg="bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/30"
                        icon={
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        }
                    />
                    <KPICard
                        title="Wskaźnik konwersji"
                        value={`${conversionRate}%`}
                        change={`${offersStats?.byStatus?.ACCEPTED?.count || 0} zaakceptowanych`}
                        changeType={conversionRate >= 30 ? 'positive' : conversionRate >= 15 ? 'neutral' : 'negative'}
                        description={`z ${offersStats?.total || 0} ofert`}
                        iconBg="bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/30"
                        icon={
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        }
                    />
                    <KPICard
                        title="Klienci"
                        value={String(clientsStats?.total || 0)}
                        change={`${clientsStats?.active || 0} aktywnych`}
                        changeType="neutral"
                        description={`${clientsStats?.withOffers || 0} z ofertami`}
                        iconBg="bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30"
                        icon={
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        }
                    />
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recent Offers - Takes 2 columns */}
                    <div className="lg:col-span-2">
                        <Card padding="none">
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900">Ostatnie oferty</h3>
                                    <p className="text-sm text-slate-500">Twoja aktywność z ostatnich dni</p>
                                </div>
                                <button
                                    onClick={() => router.push('/dashboard/offers')}
                                    className="text-sm font-medium text-cyan-600 hover:text-cyan-700 transition-colors"
                                >
                                    Zobacz wszystkie →
                                </button>
                            </div>

                            {/* List */}
                            {recentOffers.length === 0 ? (
                                <div className="px-6 py-12 text-center">
                                    <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p className="text-slate-500 mb-4">Brak ofert</p>
                                    <Button size="sm" onClick={() => router.push('/dashboard/offers/new')}>
                                        Utwórz pierwszą ofertę
                                    </Button>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {recentOffers.map((offer) => {
                                        const status = getStatusConfig(offer.status);
                                        return (
                                            <div
                                                key={offer.id}
                                                className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors cursor-pointer group"
                                                onClick={() => router.push(`/dashboard/offers/${offer.id}`)}
                                            >
                                                {/* Avatar */}
                                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white text-sm font-semibold">
                                                    {offer.client ? getInitials(offer.client.name) : '??'}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-medium text-slate-900 truncate group-hover:text-cyan-600 transition-colors">
                                                            {offer.title}
                                                        </p>
                                                        <Badge className={`${status.bgColor} ${status.color}`}>
                                                            {status.label}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <p className="text-sm text-slate-500 truncate">
                                                            {offer.client?.name || 'Brak klienta'}
                                                        </p>
                                                        <span className="text-slate-300">•</span>
                                                        <p className="text-xs text-slate-400">{offer.number}</p>
                                                    </div>
                                                </div>

                                                {/* Value & Date */}
                                                <div className="flex-shrink-0 text-right">
                                                    <p className="text-sm font-semibold text-slate-900">
                                                        {formatCurrency(Number(offer.totalGross))}
                                                    </p>
                                                    <p className="text-xs text-slate-400 mt-1">
                                                        {formatRelativeTime(offer.createdAt)}
                                                    </p>
                                                </div>

                                                {/* Arrow */}
                                                <svg
                                                    className="w-5 h-5 text-slate-300 group-hover:text-cyan-500 group-hover:translate-x-1 transition-all"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Quick Stats - Takes 1 column */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Status Breakdown */}
                        <Card>
                            <h3 className="text-lg font-semibold text-slate-900 mb-4">Status ofert</h3>
                            <div className="space-y-3">
                                {[
                                    { status: 'DRAFT', label: 'Szkice' },
                                    { status: 'SENT', label: 'Wysłane' },
                                    { status: 'VIEWED', label: 'Otwarte' },
                                    { status: 'NEGOTIATION', label: 'Negocjacje' },
                                    { status: 'ACCEPTED', label: 'Zaakceptowane' },
                                    { status: 'REJECTED', label: 'Odrzucone' },
                                ].map(({ status, label }) => {
                                    const count = offersStats?.byStatus?.[status as keyof typeof offersStats.byStatus]?.count || 0;
                                    const config = getStatusConfig(status);
                                    const percentage = offersStats?.total ? Math.round((count / offersStats.total) * 100) : 0;

                                    return (
                                        <div key={status} className="flex items-center gap-3">
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-sm text-slate-600">{label}</span>
                                                    <span className="text-sm font-medium text-slate-900">{count}</span>
                                                </div>
                                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all ${
                                                            status === 'ACCEPTED' ? 'bg-emerald-500' :
                                                                status === 'REJECTED' ? 'bg-red-500' :
                                                                    status === 'SENT' || status === 'VIEWED' ? 'bg-blue-500' :
                                                                        status === 'NEGOTIATION' ? 'bg-amber-500' :
                                                                            'bg-slate-400'
                                                        }`}
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>

                        {/* Quick Actions */}
                        <Card>
                            <h3 className="text-lg font-semibold text-slate-900 mb-4">Szybkie akcje</h3>
                            <div className="space-y-2">
                                <button
                                    onClick={() => router.push('/dashboard/offers/new')}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center text-cyan-600">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">Nowa oferta</p>
                                        <p className="text-xs text-slate-500">Utwórz ofertę dla klienta</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => router.push('/dashboard/clients/new')}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">Dodaj klienta</p>
                                        <p className="text-xs text-slate-500">Nowy kontrahent</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => router.push('/dashboard/clients')}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">Lista klientów</p>
                                        <p className="text-xs text-slate-500">Zarządzaj kontaktami</p>
                                    </div>
                                </button>
                            </div>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
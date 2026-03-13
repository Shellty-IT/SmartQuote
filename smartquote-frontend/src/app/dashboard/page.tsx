// src/app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useOffers, useOffersStats } from '@/hooks/useOffers';
import { useClientsStats } from '@/hooks/useClients';
import { ai } from '@/lib/api';
import KPICard from './components/KPICard';
import StatsChart from './components/StatsChart';
import { Badge, Button } from '@/components/ui';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatCurrency, formatRelativeTime, getStatusConfig, getInitials } from '@/lib/utils';
import type { LatestInsightItem } from '@/types/ai';

export default function DashboardPage() {
    const { data: session } = useSession();
    const router = useRouter();

    const { stats: offersStats, isLoading: isLoadingOffersStats } = useOffersStats();
    const { stats: clientsStats, isLoading: isLoadingClientsStats } = useClientsStats();
    const { offers: recentOffers, isLoading: isLoadingOffers } = useOffers({ limit: 5 });

    const [latestInsights, setLatestInsights] = useState<LatestInsightItem[]>([]);
    const [isLoadingInsights, setIsLoadingInsights] = useState(true);

    useEffect(() => {
        ai.latestInsights(3)
            .then(setLatestInsights)
            .catch((err: unknown) => {
                console.error('Failed to load AI insights:', err);
            })
            .finally(() => setIsLoadingInsights(false));
    }, []);

    const userName = session?.user?.name || session?.user?.email?.split('@')[0] || 'Użytkownik';

    const activeOffersCount = offersStats?.total
        ? offersStats.total - (offersStats.byStatus?.REJECTED?.count || 0) - (offersStats.byStatus?.EXPIRED?.count || 0)
        : 0;

    const pipelineValue = offersStats?.totalValue
        ? offersStats.totalValue - (offersStats.byStatus?.REJECTED?.value || 0) - (offersStats.byStatus?.EXPIRED?.value || 0)
        : 0;

    const conversionRate = offersStats?.total && offersStats.total > 0
        ? Math.round(((offersStats.byStatus?.ACCEPTED?.count || 0) / offersStats.total) * 100)
        : 0;

    const isLoading = isLoadingOffersStats || isLoadingClientsStats || isLoadingOffers;

    if (isLoading) {
        return <PageLoader />;
    }

    const statusChartData = [
        { label: 'Szkice', value: offersStats?.byStatus?.DRAFT?.count || 0, color: 'bg-slate-400', bgColor: 'bg-slate-100' },
        { label: 'Wysłane', value: offersStats?.byStatus?.SENT?.count || 0, color: 'bg-blue-500', bgColor: 'bg-blue-100' },
        { label: 'Otwarte', value: offersStats?.byStatus?.VIEWED?.count || 0, color: 'bg-cyan-500', bgColor: 'bg-cyan-100' },
        { label: 'Negocjacje', value: offersStats?.byStatus?.NEGOTIATION?.count || 0, color: 'bg-amber-500', bgColor: 'bg-amber-100' },
        { label: 'Zaakceptowane', value: offersStats?.byStatus?.ACCEPTED?.count || 0, color: 'bg-emerald-500', bgColor: 'bg-emerald-100' },
        { label: 'Odrzucone', value: offersStats?.byStatus?.REJECTED?.count || 0, color: 'bg-red-500', bgColor: 'bg-red-100' },
    ];

    return (
        <div className="min-h-screen">
            <main className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-themed">
                            Witaj, {userName}! 👋
                        </h1>
                        <p className="text-themed-muted text-sm mt-1">
                            Oto przegląd Twojej aktywności sprzedażowej
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button onClick={() => router.push('/dashboard/offers/new')} size="sm">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span className="hidden sm:inline">Nowa oferta</span>
                            <span className="sm:hidden">Oferta</span>
                        </Button>
                        <Button variant="outline" onClick={() => router.push('/dashboard/clients/new')} size="sm">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                            <span className="hidden sm:inline">Dodaj klienta</span>
                            <span className="sm:hidden">Klient</span>
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
                    <KPICard
                        title="Aktywne oferty"
                        value={String(activeOffersCount)}
                        change={offersStats?.byStatus?.DRAFT?.count ? `${offersStats.byStatus.DRAFT.count} szkiców` : '0 szkiców'}
                        changeType="neutral"
                        description="bez odrzuconych i wygasłych"
                        onClick={() => router.push('/dashboard/offers')}
                        iconBg="bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30"
                        icon={
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        }
                    />
                    <KPICard
                        title="Wartość pipeline"
                        value={formatCurrency(pipelineValue).replace('PLN', '').trim()}
                        change={`${formatCurrency(offersStats?.acceptedValue || 0)} zakc.`}
                        changeType="positive"
                        description="PLN łącznie"
                        onClick={() => router.push('/dashboard/offers')}
                        iconBg="bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/30"
                        icon={
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        }
                    />
                    <KPICard
                        title="Konwersja"
                        value={`${conversionRate}%`}
                        change={`${offersStats?.byStatus?.ACCEPTED?.count || 0} zakc.`}
                        changeType={conversionRate >= 30 ? 'positive' : conversionRate >= 15 ? 'neutral' : 'negative'}
                        description={`z ${offersStats?.total || 0} ofert`}
                        iconBg="bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/30"
                        icon={
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                        onClick={() => router.push('/dashboard/clients')}
                        iconBg="bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30"
                        icon={
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        }
                    />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6">
                    <div className="xl:col-span-8 space-y-4 sm:space-y-6">
                        <div className="rounded-2xl border overflow-hidden card-themed">
                            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b divider-themed">
                                <div>
                                    <h3 className="text-base sm:text-lg font-semibold text-themed">Ostatnie oferty</h3>
                                    <p className="text-xs sm:text-sm text-themed-muted">Twoja aktywność z ostatnich dni</p>
                                </div>
                                <button
                                    onClick={() => router.push('/dashboard/offers')}
                                    className="text-sm font-medium text-cyan-600 hover:text-cyan-700 transition-colors"
                                >
                                    Wszystkie →
                                </button>
                            </div>

                            {recentOffers.length === 0 ? (
                                <div className="px-6 py-12 text-center">
                                    <svg className="w-12 h-12 text-themed-muted mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p className="text-themed-muted mb-4">Brak ofert</p>
                                    <Button size="sm" onClick={() => router.push('/dashboard/offers/new')}>
                                        Utwórz pierwszą ofertę
                                    </Button>
                                </div>
                            ) : (
                                <div className="divide-y divider-themed">
                                    {recentOffers.map((offer) => {
                                        const status = getStatusConfig(offer.status);
                                        return (
                                            <div
                                                key={offer.id}
                                                className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 hover-themed transition-colors cursor-pointer group"
                                                onClick={() => router.push(`/dashboard/offers/${offer.id}`)}
                                            >
                                                <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white text-xs sm:text-sm font-semibold">
                                                    {offer.client ? getInitials(offer.client.name) : '??'}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-medium text-themed truncate group-hover:text-cyan-600 transition-colors">
                                                            {offer.title}
                                                        </p>
                                                        <Badge className={`${status.bgColor} ${status.color} hidden sm:inline-flex`}>
                                                            {status.label}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <p className="text-xs sm:text-sm text-themed-muted truncate">
                                                            {offer.client?.name || 'Brak klienta'}
                                                        </p>
                                                        <span className="text-themed-muted opacity-30 hidden sm:inline">•</span>
                                                        <p className="text-xs text-themed-muted hidden sm:inline">{offer.number}</p>
                                                    </div>
                                                </div>

                                                <div className="flex-shrink-0 text-right">
                                                    <p className="text-xs sm:text-sm font-semibold text-themed">
                                                        {formatCurrency(Number(offer.totalGross))}
                                                    </p>
                                                    <p className="text-xs text-themed-muted mt-0.5">
                                                        {formatRelativeTime(offer.createdAt)}
                                                    </p>
                                                </div>

                                                <svg
                                                    className="w-4 h-4 text-themed-muted opacity-30 group-hover:text-cyan-500 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all hidden sm:block"
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
                        </div>

                        <div className="rounded-2xl border p-4 sm:p-6 card-themed">
                            <h3 className="text-base sm:text-lg font-semibold text-themed mb-4">Rozkład statusów ofert</h3>
                            <StatsChart data={statusChartData} total={offersStats?.total || 0} />
                        </div>
                    </div>

                    <div className="xl:col-span-4 space-y-4 sm:space-y-6">
                        <div className="rounded-2xl border overflow-hidden bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-200" style={{ background: 'var(--card-bg)' }}>
                            <div className="flex items-center justify-between px-5 py-3.5 border-b border-cyan-200/50">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-sm font-bold text-cyan-900">Wnioski AI</h3>
                                </div>
                                {latestInsights.length > 0 && (
                                    <span className="text-xs font-medium text-cyan-600 bg-cyan-100 px-2 py-0.5 rounded-full">
                                        {latestInsights.length}
                                    </span>
                                )}
                            </div>

                            <div className="p-4">
                                {isLoadingInsights ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : latestInsights.length === 0 ? (
                                    <div className="text-center py-8">
                                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-cyan-100 flex items-center justify-center">
                                            <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                                            </svg>
                                        </div>
                                        <p className="text-sm font-medium text-cyan-800">Brak wniosków</p>
                                        <p className="text-xs text-cyan-600 mt-1">Pojawią się po zakończeniu ofert</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {latestInsights.map((insight) => (
                                            <div
                                                key={insight.id}
                                                className="bg-white rounded-xl p-3.5 border border-cyan-100 hover:border-cyan-300 hover:shadow-sm transition-all cursor-pointer group"
                                                onClick={() => router.push(`/dashboard/offers/${insight.offerId}`)}
                                            >
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span className={`flex-shrink-0 w-2 h-2 rounded-full ${
                                                            insight.outcome === 'ACCEPTED' ? 'bg-emerald-500' : 'bg-red-500'
                                                        }`} />
                                                        <span className="text-xs font-bold text-slate-800 truncate">
                                                            {insight.offerNumber}
                                                        </span>
                                                        <span className={`flex-shrink-0 text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                                                            insight.outcome === 'ACCEPTED'
                                                                ? 'bg-emerald-100 text-emerald-700'
                                                                : 'bg-red-100 text-red-700'
                                                        }`}>
                                                            {insight.outcome === 'ACCEPTED' ? 'Wygrana' : 'Przegrana'}
                                                        </span>
                                                    </div>
                                                    <svg className="w-4 h-4 text-slate-300 group-hover:text-cyan-500 flex-shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </div>

                                                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-2">
                                                    {insight.insights.summary || insight.offerTitle}
                                                </p>

                                                {insight.insights.keyLessons && insight.insights.keyLessons.length > 0 && (
                                                    <div className="flex items-start gap-1.5 mb-2">
                                                        <svg className="w-3 h-3 text-cyan-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                                                        </svg>
                                                        <span className="text-xs text-cyan-700 leading-relaxed line-clamp-1">
                                                            {insight.insights.keyLessons[0]}
                                                        </span>
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between text-xs text-slate-400">
                                                    <span className="truncate">{insight.clientName}</span>
                                                    <span className="flex-shrink-0 ml-2">{formatRelativeTime(insight.createdAt)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="rounded-2xl border p-4 sm:p-5 card-themed">
                            <h3 className="text-base font-semibold text-themed mb-4">Szybkie akcje</h3>
                            <div className="space-y-1.5">
                                {[
                                    {
                                        label: 'Nowa oferta',
                                        desc: 'Utwórz ofertę dla klienta',
                                        href: '/dashboard/offers/new',
                                        icon: (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                        ),
                                        color: 'bg-cyan-100 text-cyan-600',
                                    },
                                    {
                                        label: 'Dodaj klienta',
                                        desc: 'Nowy kontrahent',
                                        href: '/dashboard/clients/new',
                                        icon: (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                            </svg>
                                        ),
                                        color: 'bg-violet-100 text-violet-600',
                                    },
                                    {
                                        label: 'AI Asystent',
                                        desc: 'Porozmawiaj z AI',
                                        href: '/dashboard/ai',
                                        icon: (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                            </svg>
                                        ),
                                        color: 'bg-amber-100 text-amber-600',
                                    },
                                    {
                                        label: 'Follow-upy',
                                        desc: 'Zaplanowane zadania',
                                        href: '/dashboard/followups',
                                        icon: (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        ),
                                        color: 'bg-emerald-100 text-emerald-600',
                                    },
                                ].map((action) => (
                                    <button
                                        key={action.href}
                                        onClick={() => router.push(action.href)}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl hover-themed transition-all text-left group"
                                    >
                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${action.color} transition-transform group-hover:scale-110`}>
                                            {action.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-themed">{action.label}</p>
                                            <p className="text-xs text-themed-muted">{action.desc}</p>
                                        </div>
                                        <svg className="w-4 h-4 text-themed-muted opacity-30 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
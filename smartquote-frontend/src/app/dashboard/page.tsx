// src/app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    FileText, TrendingUp, Target, Users,
    Plus, UserPlus, Sparkles, CalendarClock,
    Mail, ArrowUpRight, ChevronRight, Lightbulb,
} from 'lucide-react';

import { useOffers, useOffersStats } from '@/hooks/useOffers';
import { useClientsStats } from '@/hooks/useClients';
import { ai } from '@/lib/api';
import KPICard from './components/KPICard';
import StatsChart from './components/StatsChart';
import DashboardSkeleton from './components/DashboardSkeleton';
import StatusBadge from '@/components/ui/StatusBadge';
import { SkeletonInsightCard } from '@/components/ui/Skeleton';
import { formatCurrency, formatRelativeTime, getInitials, cn } from '@/lib/utils';
import type { LatestInsightItem } from '@/types/ai';

/* ─── InsightCard ─────────────────────────────────────────────── */
function InsightCard({ insight, onClick }: { insight: LatestInsightItem; onClick: () => void }) {
    const [expanded, setExpanded] = useState(false);
    const keyLessons = insight.insights.keyLessons || [];
    const hasVariant = !!insight.insights.selectedVariant;
    const hasMore = keyLessons.length > 1 || hasVariant || !!insight.insights.pricingInsight;
    const won = insight.outcome === 'ACCEPTED';

    return (
        <div
            className="group rounded-xl border border-border bg-card p-3.5 shadow-sm transition hover:shadow-card cursor-pointer"
            onClick={onClick}
        >
            <div className="flex items-center gap-2">
                <span className={cn('h-2 w-2 shrink-0 rounded-full', won ? 'bg-status-accepted' : 'bg-status-rejected')} />
                <span className="font-mono text-xs font-semibold">{insight.offerNumber}</span>
                <StatusBadge status={won ? 'WON' : 'LOST'} showDot={false} />
            </div>

            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                {insight.insights.summary || insight.offerTitle}
            </p>

            {keyLessons.length > 0 && (
                <div className="mt-1.5 flex items-start gap-1.5">
                    <Lightbulb className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                    <span className="line-clamp-2 text-[11px] leading-relaxed text-foreground">
                        {keyLessons[0]}
                    </span>
                </div>
            )}

            {hasVariant && !expanded && (
                <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-primary">
                    <Sparkles className="h-3 w-3" /> Wariant: {insight.insights.selectedVariant}
                </div>
            )}

            {expanded && hasMore && (
                <div className="mt-2 space-y-2 border-t border-border pt-2">
                    {keyLessons.slice(1).map((l, i) => (
                        <div key={i} className="flex items-start gap-1.5">
                            <span className="mt-0.5 text-[10px] text-primary">•</span>
                            <span className="text-xs text-muted-foreground">{l}</span>
                        </div>
                    ))}
                    {hasVariant && (
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-primary">
                            <Sparkles className="h-3 w-3" /> Wariant: {insight.insights.selectedVariant}
                        </div>
                    )}
                    {insight.insights.pricingInsight && (
                        <p className="text-xs text-muted-foreground">{insight.insights.pricingInsight}</p>
                    )}
                </div>
            )}

            <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-[11px] text-muted-foreground">
                <span className="truncate">{insight.clientName}</span>
                <div className="flex shrink-0 items-center gap-2 ml-2">
                    {hasMore && (
                        <button
                            className="font-medium text-primary hover:underline"
                            onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }}
                        >
                            {expanded ? 'Zwiń' : 'Więcej'}
                        </button>
                    )}
                    <span>{formatRelativeTime(insight.createdAt)}</span>
                </div>
            </div>
        </div>
    );
}

/* ─── Page ─────────────────────────────────────────────────────── */
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
            .catch(() => {})
            .finally(() => setIsLoadingInsights(false));
    }, []);

    const userName = session?.user?.name || session?.user?.email?.split('@')[0] || 'Użytkownik';

    const activeOffers = offersStats?.total
        ? offersStats.total - (offersStats.byStatus?.REJECTED?.count || 0) - (offersStats.byStatus?.EXPIRED?.count || 0)
        : 0;
    const pipelineValue = (offersStats?.totalValue || 0) - (offersStats?.byStatus?.REJECTED?.value || 0) - (offersStats?.byStatus?.EXPIRED?.value || 0);
    const conversionRate = offersStats?.total && offersStats.total > 0
        ? Math.round(((offersStats.byStatus?.ACCEPTED?.count || 0) / offersStats.total) * 100)
        : 0;

    if (isLoadingOffersStats || isLoadingClientsStats || isLoadingOffers) {
        return <DashboardSkeleton />;
    }

    const statusDistribution = [
        { label: 'Szkice',       value: offersStats?.byStatus?.DRAFT?.count || 0,       color: 'bg-status-draft' },
        { label: 'Wysłane',      value: offersStats?.byStatus?.SENT?.count || 0,        color: 'bg-[oklch(0.65_0.16_245)]' },
        { label: 'Otwarte',      value: offersStats?.byStatus?.VIEWED?.count || 0,      color: 'bg-[oklch(0.72_0.14_200)]' },
        { label: 'Negocjacje',   value: offersStats?.byStatus?.NEGOTIATION?.count || 0, color: 'bg-[oklch(0.72_0.16_60)]' },
        { label: 'Zaakceptowane',value: offersStats?.byStatus?.ACCEPTED?.count || 0,    color: 'bg-status-accepted' },
        { label: 'Odrzucone',    value: offersStats?.byStatus?.REJECTED?.count || 0,    color: 'bg-status-rejected' },
    ];

    const quickActions = [
        { icon: Plus,         label: 'Nowa oferta',    sub: 'Utwórz ofertę dla klienta', href: '/dashboard/offers/new',    primary: true },
        { icon: UserPlus,     label: 'Dodaj klienta',  sub: 'Nowy kontrahent',            href: '/dashboard/clients/new',   primary: false },
        { icon: Sparkles,     label: 'AI Asystent',    sub: 'Porozmawiaj z AI',           href: '/dashboard/ai',            primary: false },
        { icon: CalendarClock,label: 'Follow-upy',     sub: 'Zaplanowane zadania',        href: '/dashboard/followups',     primary: false },
        { icon: Mail,         label: 'Korespondencja', sub: 'Skrzynka odbiorcza',         href: '/dashboard/emails',        primary: false },
    ];

    return (
        <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-8 sm:px-6">
            {/* Page header */}
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                        Dashboard
                    </div>
                    <h1 className="mt-1 text-3xl font-bold tracking-tight">
                        Witaj, {userName}!
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Oto przegląd Twojej aktywności sprzedażowej.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => router.push('/dashboard/clients/new')}
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold shadow-sm transition hover:bg-secondary"
                    >
                        <UserPlus className="h-4 w-4" /> Dodaj klienta
                    </button>
                    <button
                        onClick={() => router.push('/dashboard/offers/new')}
                        className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-primary px-4 text-sm font-semibold text-white shadow-glow ring-1 ring-white/15 transition hover:brightness-110"
                    >
                        <Plus className="h-4 w-4" /> Nowa oferta
                    </button>
                </div>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <KPICard
                    title="Aktywne oferty"
                    value={String(activeOffers)}
                    change={`− ${offersStats?.byStatus?.DRAFT?.count || 0} szkiców`}
                    changeType="neutral"
                    description="bez odrzuconych i wygasłych"
                    icon={<FileText className="h-5 w-5" strokeWidth={2.2} />}
                    accent="from-[oklch(0.65_0.18_245)] to-[oklch(0.72_0.14_215)]"
                    onClick={() => router.push('/dashboard/offers')}
                />
                <KPICard
                    title="Wartość pipeline"
                    value={formatCurrency(pipelineValue).replace(/\s*PLN/, '')}
                    change={`↑ ${formatCurrency(offersStats?.acceptedValue || 0).replace(/\s*PLN/, '')} zakc.`}
                    changeType="positive"
                    description="PLN łącznie"
                    icon={<TrendingUp className="h-5 w-5" strokeWidth={2.2} />}
                    accent="from-[oklch(0.68_0.15_165)] to-[oklch(0.72_0.13_200)]"
                    onClick={() => router.push('/dashboard/offers')}
                />
                <KPICard
                    title="Konwersja"
                    value={`${conversionRate}%`}
                    change={`↑ ${offersStats?.byStatus?.ACCEPTED?.count || 0} zakc.`}
                    changeType={conversionRate >= 30 ? 'positive' : conversionRate >= 15 ? 'neutral' : 'negative'}
                    description={`z ${offersStats?.total || 0} ofert`}
                    icon={<Target className="h-5 w-5" strokeWidth={2.2} />}
                    accent="from-[oklch(0.65_0.18_260)] to-[oklch(0.72_0.14_230)]"
                />
                <KPICard
                    title="Klienci"
                    value={String(clientsStats?.total || 0)}
                    change={`${clientsStats?.withOffers || 0} z ofertami`}
                    changeType="neutral"
                    description={`${clientsStats?.active || 0} aktywnych`}
                    icon={<Users className="h-5 w-5" strokeWidth={2.2} />}
                    accent="from-[oklch(0.7_0.15_50)] to-[oklch(0.72_0.16_25)]"
                    onClick={() => router.push('/dashboard/clients')}
                />
            </div>

            {/* Row 2: recent offers + AI insights */}
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                {/* Recent offers */}
                <div className="xl:col-span-2 rounded-2xl border border-border bg-card shadow-card">
                    <div className="flex items-center justify-between border-b border-border px-6 py-5">
                        <div>
                            <h2 className="text-lg font-semibold tracking-tight">Ostatnie oferty</h2>
                            <p className="text-xs text-muted-foreground">Twoja aktywność z ostatnich dni</p>
                        </div>
                        <Link
                            href="/dashboard/offers"
                            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                        >
                            Wszystkie <ArrowUpRight className="h-4 w-4" />
                        </Link>
                    </div>

                    {recentOffers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-14 text-center">
                            <FileText className="mb-3 h-10 w-10 text-muted-foreground/40" strokeWidth={1.5} />
                            <p className="text-sm text-muted-foreground mb-3">Brak ofert</p>
                            <button
                                onClick={() => router.push('/dashboard/offers/new')}
                                className="inline-flex h-9 items-center gap-2 rounded-xl bg-gradient-primary px-4 text-sm font-semibold text-white shadow-glow ring-1 ring-white/15 transition hover:brightness-110"
                            >
                                <Plus className="h-4 w-4" /> Utwórz pierwszą
                            </button>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/60 border-t border-border">
                            {recentOffers.map((offer) => (
                                <Link
                                    key={offer.id}
                                    href={`/dashboard/offers/${offer.id}`}
                                    className="group flex items-center gap-4 px-6 py-4 transition hover:bg-secondary/50"
                                >
                                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-primary text-[11px] font-bold text-white shadow-sm">
                                        {offer.client ? getInitials(offer.client.name) : '??'}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="truncate text-sm font-semibold">{offer.title}</span>
                                            <StatusBadge status={offer.status} showDot={false} />
                                        </div>
                                        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                                            <span>{offer.client?.name || 'Brak klienta'}</span>
                                            <span className="text-border">•</span>
                                            <span className="font-mono">{offer.number}</span>
                                        </div>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <div className="text-sm font-semibold tabular-nums">
                                            {formatCurrency(Number(offer.totalGross))}
                                        </div>
                                        <div className="text-[11px] text-muted-foreground">
                                            {formatRelativeTime(offer.createdAt)}
                                        </div>
                                    </div>
                                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60 transition group-hover:translate-x-0.5 group-hover:text-foreground" />
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* AI insights */}
                <div className="rounded-2xl border border-border bg-gradient-to-br from-[oklch(0.97_0.03_240)] to-[oklch(0.95_0.05_215)] p-1 shadow-card dark:from-[oklch(0.22_0.05_245)] dark:to-[oklch(0.2_0.04_220)]">
                    <div className="rounded-[15px] bg-card/60 p-5 backdrop-blur-sm h-full">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary text-white shadow-glow">
                                    <Sparkles className="h-4 w-4" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-semibold">Wnioski AI</h2>
                                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                        {latestInsights.length} {latestInsights.length === 1 ? 'nowy' : 'nowych'}
                                    </div>
                                </div>
                            </div>
                            <Link
                                href="/dashboard/ai-insights"
                                className="text-xs font-semibold text-primary hover:underline"
                            >
                                Wszystkie →
                            </Link>
                        </div>
                        <div className="mt-4 space-y-2.5">
                            {isLoadingInsights ? (
                                Array.from({ length: 3 }).map((_, i) => <SkeletonInsightCard key={i} />)
                            ) : latestInsights.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 text-center">
                                    <Lightbulb className="mb-3 h-10 w-10 text-muted-foreground/40" strokeWidth={1.5} />
                                    <p className="text-sm font-medium">Brak wniosków</p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Pojawią się po zakończeniu ofert
                                    </p>
                                </div>
                            ) : (
                                latestInsights.map((insight) => (
                                    <InsightCard
                                        key={insight.id}
                                        insight={insight}
                                        onClick={() => router.push(`/dashboard/offers/${insight.offerId}`)}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Row 3: status distribution + quick actions */}
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                {/* Status distribution */}
                <div className="xl:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-card">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold tracking-tight">Rozkład statusów ofert</h2>
                            <p className="text-xs text-muted-foreground">{offersStats?.total || 0} ofert łącznie</p>
                        </div>
                    </div>
                    <div className="mt-5">
                        <StatsChart data={statusDistribution} total={offersStats?.total || 0} />
                    </div>
                </div>

                {/* Quick actions */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                    <h2 className="text-lg font-semibold tracking-tight">Szybkie akcje</h2>
                    <div className="mt-4 space-y-2">
                        {quickActions.map((action) => {
                            const Icon = action.icon;
                            return (
                                <button
                                    key={action.href}
                                    onClick={() => router.push(action.href)}
                                    className="group flex w-full items-center gap-3 rounded-xl border border-border bg-surface-subtle p-3 text-left transition hover:border-primary/30 hover:bg-secondary"
                                >
                                    <div className={cn(
                                        'grid h-10 w-10 shrink-0 place-items-center rounded-xl shadow-sm',
                                        action.primary
                                            ? 'bg-gradient-primary text-white'
                                            : 'bg-card text-primary ring-1 ring-border'
                                    )}>
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm font-semibold">{action.label}</div>
                                        <div className="text-[11px] text-muted-foreground">{action.sub}</div>
                                    </div>
                                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60 transition group-hover:translate-x-0.5 group-hover:text-foreground" />
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

// src/app/dashboard/ai-insights/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ai } from '@/lib/api';
import { Button } from '@/components/ui';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import type { InsightsListItem, InsightsListParams } from '@/types/ai';

type OutcomeFilter = 'ALL' | 'ACCEPTED' | 'REJECTED';

function InsightDetailCard({ insight }: { insight: InsightsListItem }) {
    const [expanded, setExpanded] = useState(false);
    const router = useRouter();

    const keyLessons = insight.insights.keyLessons || [];
    const improvementSuggestions = insight.insights.improvementSuggestions || [];
    const hasVariant = !!insight.insights.selectedVariant;
    const hasPricing = !!insight.insights.pricingInsight;
    const hasIndustryNote = !!insight.insights.industryNote;
    const hasVariantHistory = !!(
        insight.insights.variantHistory &&
        insight.insights.variantHistory.totalAcceptedWithVariant > 0
    );

    return (
        <div className="rounded-2xl border overflow-hidden dash-section transition-all">
            <div
                className="flex items-start sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 cursor-pointer hover-themed transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                    <span className={`flex-shrink-0 w-3 h-3 rounded-full mt-1 sm:mt-0 ${
                        insight.outcome === 'ACCEPTED' ? 'bg-emerald-500' : 'bg-red-500'
                    }`} />
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-themed">{insight.offerNumber}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                insight.outcome === 'ACCEPTED' ? 'badge-success' : 'badge-danger'
                            }`}>
                                {insight.outcome === 'ACCEPTED' ? 'Wygrana' : 'Przegrana'}
                            </span>
                            {hasVariant && (
                                <span
                                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                                    style={{ backgroundColor: 'var(--tone-active-bg)', color: 'var(--accent-gradient-from)' }}
                                >
                                    {insight.insights.selectedVariant}
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-themed-muted truncate mt-0.5">{insight.offerTitle}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-themed-muted">
                            <span>{insight.clientName}</span>
                            {insight.clientCompany && (
                                <>
                                    <span className="opacity-30">•</span>
                                    <span>{insight.clientCompany}</span>
                                </>
                            )}
                            <span className="opacity-30">•</span>
                            <span className="font-semibold text-themed">
                                {formatCurrency(insight.offerValue)}
                            </span>
                            <span className="opacity-30">•</span>
                            <span>{formatRelativeTime(insight.createdAt)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/offers/${insight.offerId}`);
                        }}
                        className="text-xs font-medium px-2.5 py-1 rounded-lg transition-colors hover:opacity-80"
                        style={{ backgroundColor: 'var(--tone-active-bg)', color: 'var(--accent-gradient-from)' }}
                    >
                        Oferta →
                    </button>
                    <svg
                        className={`w-5 h-5 text-themed-muted transition-transform ${expanded ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {expanded && (
                <div className="px-4 sm:px-6 pb-5 pt-2 border-t space-y-4" style={{ borderColor: 'var(--divider)' }}>
                    {insight.insights.summary && (
                        <div>
                            <h4 className="text-xs font-semibold text-themed-label uppercase tracking-wide mb-1.5">Podsumowanie</h4>
                            <p className="text-sm text-themed-muted leading-relaxed">{insight.insights.summary}</p>
                        </div>
                    )}

                    {keyLessons.length > 0 && (
                        <div>
                            <h4 className="text-xs font-semibold text-themed-label uppercase tracking-wide mb-1.5">Kluczowe wnioski</h4>
                            <div className="space-y-1.5">
                                {keyLessons.map((lesson, idx) => (
                                    <div key={idx} className="flex items-start gap-2">
                                        <svg className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--accent-gradient-from)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                                        </svg>
                                        <span className="text-sm text-themed leading-relaxed">{lesson}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {hasPricing && (
                        <div>
                            <h4 className="text-xs font-semibold text-themed-label uppercase tracking-wide mb-1.5">Analiza cenowa</h4>
                            <div className="flex items-start gap-2 rounded-xl p-3" style={{ backgroundColor: 'var(--tone-active-bg)' }}>
                                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--accent-gradient-from)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-sm text-themed leading-relaxed">{insight.insights.pricingInsight}</span>
                            </div>
                        </div>
                    )}

                    {improvementSuggestions.length > 0 && (
                        <div>
                            <h4 className="text-xs font-semibold text-themed-label uppercase tracking-wide mb-1.5">Sugestie usprawnień</h4>
                            <div className="space-y-1.5">
                                {improvementSuggestions.map((suggestion, idx) => (
                                    <div key={idx} className="flex items-start gap-2">
                                        <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                        </svg>
                                        <span className="text-sm text-themed-muted leading-relaxed">{suggestion}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {hasVariant && (
                        <div>
                            <h4 className="text-xs font-semibold text-themed-label uppercase tracking-wide mb-1.5">Wariant</h4>
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--accent-gradient-from)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                                </svg>
                                <span className="text-sm font-medium" style={{ color: 'var(--accent-gradient-from)' }}>
                                    {insight.insights.selectedVariant}
                                </span>
                                {insight.insights.availableVariants && insight.insights.availableVariants.length > 0 && (
                                    <span className="text-xs text-themed-muted">
                                        (z {insight.insights.availableVariants.length}: {insight.insights.availableVariants.join(', ')})
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {hasVariantHistory && (
                        <div>
                            <h4 className="text-xs font-semibold text-themed-label uppercase tracking-wide mb-1.5">Trend wariantów</h4>
                            <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--tone-active-bg)' }}>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(insight.insights.variantHistory!.distribution).map(([variant, count]) => {
                                        const total = insight.insights.variantHistory?.totalAcceptedWithVariant || 1;
                                        const pct = Math.round((count / total) * 100);
                                        const isSelected = variant === insight.insights.selectedVariant;
                                        return (
                                            <div
                                                key={variant}
                                                className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium"
                                                style={{
                                                    backgroundColor: isSelected ? 'var(--accent-gradient-from)' : 'var(--divider)',
                                                    color: isSelected ? '#ffffff' : 'var(--muted-text)',
                                                }}
                                            >
                                                <span>{variant}</span>
                                                <span className="font-bold">{pct}%</span>
                                                <span className="opacity-60">(n={count})</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <p className="text-xs text-themed-muted mt-2">
                                    Na podstawie {insight.insights.variantHistory!.totalAcceptedWithVariant} zaakceptowanych ofert z wariantami
                                </p>
                            </div>
                        </div>
                    )}

                    {hasIndustryNote && (
                        <div>
                            <h4 className="text-xs font-semibold text-themed-label uppercase tracking-wide mb-1.5">Notatka branżowa</h4>
                            <p className="text-sm text-themed-muted leading-relaxed italic">{insight.insights.industryNote}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function AIInsightsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [insights, setInsights] = useState<InsightsListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });

    const [outcomeFilter, setOutcomeFilter] = useState<OutcomeFilter>(
        (searchParams.get('outcome') as OutcomeFilter) || 'ALL'
    );
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
    const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') || '');
    const [dateTo, setDateTo] = useState(searchParams.get('dateTo') || '');

    const fetchInsights = useCallback(async (page: number = 1) => {
        setIsLoading(true);
        try {
            const params: Record<string, string | number | boolean | undefined> = {
                page,
                limit: 10,
            };
            if (outcomeFilter !== 'ALL') params.outcome = outcomeFilter;
            if (search) params.search = search;
            if (dateFrom) params.dateFrom = dateFrom;
            if (dateTo) params.dateTo = dateTo;

            const result = await ai.insightsList(params);
            setInsights(result.data);
            setMeta(result.meta);
        } catch (err: unknown) {
            console.error('Failed to load insights:', err);
        } finally {
            setIsLoading(false);
        }
    }, [outcomeFilter, search, dateFrom, dateTo]);

    useEffect(() => {
        fetchInsights(1);
    }, [fetchInsights]);

    const handleSearch = () => {
        setSearch(searchInput);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const clearFilters = () => {
        setOutcomeFilter('ALL');
        setSearch('');
        setSearchInput('');
        setDateFrom('');
        setDateTo('');
    };

    const hasActiveFilters = outcomeFilter !== 'ALL' || search || dateFrom || dateTo;

    const acceptedCount = insights.filter(i => i.outcome === 'ACCEPTED').length;
    const rejectedCount = insights.filter(i => i.outcome === 'REJECTED').length;

    if (isLoading && insights.length === 0) {
        return <PageLoader />;
    }

    return (
        <div className="min-h-screen">
            <main className="p-4 sm:p-6 lg:p-8 max-w-[1200px] mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold text-themed">Wnioski AI</h1>
                                <p className="text-sm text-themed-muted">
                                    Analiza zakończonych ofert — {meta.total} {meta.total === 1 ? 'wniosek' : meta.total < 5 ? 'wnioski' : 'wniosków'}
                                </p>
                            </div>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => router.push('/dashboard')}>
                        ← Dashboard
                    </Button>
                </div>

                <div className="rounded-2xl border overflow-hidden dash-section mb-6">
                    <div className="p-4 sm:p-5 space-y-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    placeholder="Szukaj po tytule, numerze lub kliencie..."
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-colors"
                                    style={{
                                        backgroundColor: 'var(--input-bg)',
                                        borderColor: 'var(--divider)',
                                        color: 'var(--input-text)',
                                    }}
                                />
                                <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-themed-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <Button size="sm" onClick={handleSearch}>Szukaj</Button>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                            <div className="flex gap-1.5">
                                {(['ALL', 'ACCEPTED', 'REJECTED'] as const).map((filter) => {
                                    const labels: Record<OutcomeFilter, string> = {
                                        ALL: 'Wszystkie',
                                        ACCEPTED: `Wygrane${outcomeFilter === 'ALL' && acceptedCount > 0 ? ` (${acceptedCount})` : ''}`,
                                        REJECTED: `Przegrane${outcomeFilter === 'ALL' && rejectedCount > 0 ? ` (${rejectedCount})` : ''}`,
                                    };
                                    const isActive = outcomeFilter === filter;
                                    return (
                                        <button
                                            key={filter}
                                            onClick={() => setOutcomeFilter(filter)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                                isActive
                                                    ? 'text-white shadow-sm'
                                                    : 'text-themed-muted hover:opacity-80'
                                            }`}
                                            style={isActive ? {
                                                backgroundColor: filter === 'REJECTED' ? '#ef4444' : filter === 'ACCEPTED' ? '#10b981' : 'var(--accent-gradient-from)',
                                            } : {
                                                backgroundColor: 'var(--tone-active-bg)',
                                            }}
                                        >
                                            {labels[filter]}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="flex gap-2 sm:ml-auto items-center">
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="px-3 py-1.5 rounded-lg border text-xs"
                                    style={{
                                        backgroundColor: 'var(--input-bg)',
                                        borderColor: 'var(--divider)',
                                        color: 'var(--input-text)',
                                    }}
                                />
                                <span className="text-xs text-themed-muted">—</span>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="px-3 py-1.5 rounded-lg border text-xs"
                                    style={{
                                        backgroundColor: 'var(--input-bg)',
                                        borderColor: 'var(--divider)',
                                        color: 'var(--input-text)',
                                    }}
                                />
                            </div>

                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="text-xs font-medium transition-colors hover:opacity-80"
                                    style={{ color: 'var(--accent-gradient-from)' }}
                                >
                                    Wyczyść filtry
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : insights.length === 0 ? (
                    <div className="rounded-2xl border dash-section p-12 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--tone-active-bg)' }}>
                            <svg className="w-8 h-8" style={{ color: 'var(--accent-gradient-from)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-themed mb-1">
                            {hasActiveFilters ? 'Brak wyników' : 'Brak wniosków AI'}
                        </h3>
                        <p className="text-sm text-themed-muted">
                            {hasActiveFilters
                                ? 'Spróbuj zmienić filtry wyszukiwania'
                                : 'Wnioski pojawią się po zaakceptowaniu lub odrzuceniu ofert'
                            }
                        </p>
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="mt-4 text-sm font-medium transition-colors hover:opacity-80"
                                style={{ color: 'var(--accent-gradient-from)' }}
                            >
                                Wyczyść filtry
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="space-y-3">
                            {insights.map((insight) => (
                                <InsightDetailCard key={insight.id} insight={insight} />
                            ))}
                        </div>

                        {meta.totalPages > 1 && (
                            <div className="flex items-center justify-between mt-6 px-2">
                                <p className="text-xs text-themed-muted">
                                    Strona {meta.page} z {meta.totalPages} ({meta.total} wyników)
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fetchInsights(meta.page - 1)}
                                        disabled={meta.page <= 1}
                                    >
                                        ← Poprzednia
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fetchInsights(meta.page + 1)}
                                        disabled={meta.page >= meta.totalPages}
                                    >
                                        Następna →
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
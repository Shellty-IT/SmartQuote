// SmartQuote-AI/src/components/ai/AIPriceInsight.tsx
'use client';

import { useState } from 'react';
import { ai } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { PriceInsightResult } from '@/types/ai';

interface AIPriceInsightProps {
    itemName: string;
    currentPrice?: number;
    onPriceSelect?: (price: number) => void;
}

export default function AIPriceInsight({ itemName, currentPrice, onPriceSelect }: AIPriceInsightProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<PriceInsightResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const canAnalyze = itemName.trim().length >= 3;

    const handleAnalyze = async () => {
        if (!canAnalyze) return;

        setIsLoading(true);
        setError(null);
        setIsOpen(true);

        try {
            const data = await ai.priceInsight(itemName.trim());
            setResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Błąd analizy cenowej');
        } finally {
            setIsLoading(false);
        }
    };

    const suggestedAvg = result
        ? Math.round((result.aiSuggestion.suggestedMin + result.aiSuggestion.suggestedMax) / 2)
        : 0;

    const isPriceLow = result && currentPrice !== undefined && currentPrice > 0
        ? currentPrice < result.aiSuggestion.suggestedMin
        : false;

    const isPriceHigh = result && currentPrice !== undefined && currentPrice > 0
        ? currentPrice > result.aiSuggestion.suggestedMax
        : false;

    const confidenceConfig = {
        low: { label: 'Niska', color: 'bg-amber-100 text-amber-700' },
        medium: { label: 'Średnia', color: 'bg-blue-100 text-blue-700' },
        high: { label: 'Wysoka', color: 'bg-emerald-100 text-emerald-700' },
    };

    const intentScoreColor = (score: number) => {
        if (score <= 3) return 'bg-red-500';
        if (score <= 6) return 'bg-amber-500';
        return 'bg-emerald-500';
    };

    if (!isOpen) {
        return (
            <button
                type="button"
                onClick={handleAnalyze}
                disabled={!canAnalyze || isLoading}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    canAnalyze
                        ? 'bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-700 border border-cyan-200 hover:from-cyan-100 hover:to-blue-100 hover:border-cyan-300'
                        : 'bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed'
                }`}
                title={canAnalyze ? 'Sprawdź sugestię cenową AI' : 'Wpisz nazwę pozycji (min. 3 znaki)'}
            >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                </svg>
                AI Insight
            </button>
        );
    }

    return (
        <div className="mt-3 rounded-xl border border-cyan-200 bg-gradient-to-br from-cyan-50/50 to-blue-50/30 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-cyan-100/60 to-blue-100/40 border-b border-cyan-200/50">
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                    <span className="text-sm font-semibold text-cyan-800">AI Price Insight</span>
                    {result && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${confidenceConfig[result.aiSuggestion.confidence].color}`}>
                            {confidenceConfig[result.aiSuggestion.confidence].label}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={handleAnalyze}
                        disabled={isLoading || !canAnalyze}
                        className="p-1 text-cyan-600 hover:text-cyan-800 disabled:opacity-50"
                        title="Odśwież analizę"
                    >
                        <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        onClick={() => { setIsOpen(false); setResult(null); setError(null); }}
                        className="p-1 text-slate-400 hover:text-slate-600"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="p-4">
                {isLoading && (
                    <div className="flex items-center justify-center py-6">
                        <div className="flex items-center gap-3 text-cyan-600">
                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span className="text-sm font-medium">Analizuję dane cenowe...</span>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                        {error}
                    </div>
                )}

                {result && !isLoading && (
                    <div className="space-y-4">
                        <div>
                            <div className="flex items-baseline justify-between mb-2">
                                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Sugerowana cena netto</span>
                                <span className="text-xs text-slate-400">
                                    na podstawie {result.historicalData.count} pozycji
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-lg font-bold text-cyan-700">
                                    {formatCurrency(result.aiSuggestion.suggestedMin)}
                                </span>
                                <div className="flex-1 h-2 rounded-full bg-slate-200 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full" />
                                    {currentPrice !== undefined && currentPrice > 0 && result.aiSuggestion.suggestedMax > result.aiSuggestion.suggestedMin && (
                                        <div
                                            className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                                                isPriceLow ? 'bg-amber-500' : isPriceHigh ? 'bg-amber-500' : 'bg-emerald-500'
                                            }`}
                                            style={{
                                                left: `${Math.max(0, Math.min(100, ((currentPrice - result.aiSuggestion.suggestedMin) / (result.aiSuggestion.suggestedMax - result.aiSuggestion.suggestedMin)) * 100))}%`,
                                            }}
                                        />
                                    )}
                                </div>
                                <span className="text-lg font-bold text-blue-700">
                                    {formatCurrency(result.aiSuggestion.suggestedMax)}
                                </span>
                            </div>
                        </div>

                        {currentPrice !== undefined && currentPrice > 0 && (isPriceLow || isPriceHigh) && (
                            <div className={`flex items-start gap-2 p-2.5 rounded-lg text-xs ${
                                isPriceLow ? 'bg-amber-50 text-amber-800' : 'bg-blue-50 text-blue-800'
                            }`}>
                                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                                </svg>
                                <span>
                                    {isPriceLow
                                        ? `Twoja cena (${formatCurrency(currentPrice)}) jest poniżej sugerowanego minimum. Marża może być zbyt niska.`
                                        : `Twoja cena (${formatCurrency(currentPrice)}) jest powyżej sugerowanego maksimum. Konkurencyjność może być zagrożona.`
                                    }
                                </span>
                            </div>
                        )}

                        {result.aiSuggestion.marginWarning && (
                            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 text-amber-800 text-xs">
                                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                                </svg>
                                <span>{result.aiSuggestion.marginWarning}</span>
                            </div>
                        )}

                        <div className="text-xs text-slate-600 leading-relaxed bg-white/60 rounded-lg p-3 border border-slate-100">
                            {result.aiSuggestion.marketAnalysis}
                        </div>

                        {result.historicalData.count > 0 && (
                            <div className="flex items-center gap-4 text-xs text-slate-500 pt-1 border-t border-cyan-100">
                                <span>Śr. historyczna: <strong className="text-slate-700">{formatCurrency(result.historicalData.avgPrice)}</strong></span>
                                <span>Min: <strong className="text-slate-700">{formatCurrency(result.historicalData.minPrice)}</strong></span>
                                <span>Max: <strong className="text-slate-700">{formatCurrency(result.historicalData.maxPrice)}</strong></span>
                            </div>
                        )}

                        {onPriceSelect && suggestedAvg > 0 && (
                            <button
                                type="button"
                                onClick={() => onPriceSelect(suggestedAvg)}
                                className="w-full py-2 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-medium transition-colors"
                            >
                                Zastosuj sugerowaną cenę: {formatCurrency(suggestedAvg)}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
// src/app/dashboard/offers/[id]/components/analytics/ObserverSection.tsx
'use client';

import { Card } from '@/components/ui';
import { INTENT_CONFIG } from '../../constants';
import { getEngagementColor } from '../../utils';
import type { ObserverInsight } from '@/types/ai';

interface ObserverSectionProps {
    observerInsight: ObserverInsight | null;
    isLoading: boolean;
    error: string | null;
    onLoadObserver: () => void;
}

export function ObserverSection({ observerInsight, isLoading, error, onLoadObserver }: ObserverSectionProps) {
    return (
        <Card>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                    <h2 className="text-lg font-semibold text-themed">AI Observer — Analiza zachowań</h2>
                </div>
                <button
                    onClick={onLoadObserver}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-medium hover:from-cyan-600 hover:to-blue-600 transition-all disabled:opacity-50"
                >
                    {isLoading ? (
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

            {error && (
                <div className="p-3 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 text-sm mb-4">{error}</div>
            )}

            {!observerInsight && !isLoading && !error && (
                <div className="text-center py-8">
                    <svg className="w-12 h-12 mx-auto text-themed-muted opacity-40 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-themed-muted text-sm">Kliknij &quot;Analizuj zachowanie&quot; aby AI przeanalizowało interakcje klienta</p>
                </div>
            )}

            {observerInsight && !isLoading && (
                <div className="space-y-4">
                    <div className="flex items-center gap-3 flex-wrap">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${INTENT_CONFIG[observerInsight.clientIntent]?.color || INTENT_CONFIG.unknown.color}`}>
              {INTENT_CONFIG[observerInsight.clientIntent]?.label || 'Brak danych'}
            </span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-themed-muted">Zaangażowanie:</span>
                            <div className="w-20 h-2 section-themed rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${getEngagementColor(observerInsight.engagementScore)}`}
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
    );
}
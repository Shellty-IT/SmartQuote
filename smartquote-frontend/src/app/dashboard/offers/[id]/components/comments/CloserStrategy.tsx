// src/app/dashboard/offers/[id]/components/comments/CloserStrategy.tsx
'use client';

import type { ClosingStrategy } from '@/types/ai';

interface CloserStrategyProps {
    closingStrategy: ClosingStrategy | null;
    isLoading: boolean;
    error: string | null;
    expandedStrategy: string | null;
    onLoadCloser: () => void;
    onExpandStrategy: (strategy: string | null) => void;
    onUseStrategy: (text: string) => void;
}

export function CloserStrategy({
                                   closingStrategy,
                                   isLoading,
                                   error,
                                   expandedStrategy,
                                   onLoadCloser,
                                   onExpandStrategy,
                                   onUseStrategy,
                               }: CloserStrategyProps) {
    const renderStrategyCard = (
        key: string,
        strategy: { title: string; description: string; suggestedResponse: string; riskLevel?: string; proposedConcessions?: string[]; maxDiscountPercent?: number },
        icon: string,
        borderColor: string,
        bgColor: string
    ) => (
        <div
            className={`rounded-xl border ${borderColor} ${bgColor} overflow-hidden cursor-pointer`}
            onClick={() => onExpandStrategy(expandedStrategy === key ? null : key)}
        >
            <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                    <span className="text-sm">{icon}</span>
                    <span className="text-sm font-semibold text-themed">{strategy.title}</span>
                    {strategy.riskLevel && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            strategy.riskLevel === 'low' ? 'badge-success' :
                                strategy.riskLevel === 'medium' ? 'badge-warning' :
                                    'badge-danger'
                        }`}>
              Ryzyko: {strategy.riskLevel === 'low' ? 'niskie' : strategy.riskLevel === 'medium' ? 'średnie' : 'wysokie'}
            </span>
                    )}
                    {strategy.maxDiscountPercent !== undefined && (
                        <span className="text-xs px-2 py-0.5 rounded-full badge-success font-medium">
              Max rabat: {strategy.maxDiscountPercent}%
            </span>
                    )}
                </div>
                <svg className={`w-4 h-4 text-themed-muted transition-transform ${expandedStrategy === key ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </div>
            {expandedStrategy === key && (
                <div className="px-4 pb-4 space-y-3">
                    <p className="text-xs text-themed-muted">{strategy.description}</p>
                    {strategy.proposedConcessions && strategy.proposedConcessions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {strategy.proposedConcessions.map((c, i) => (
                                <span key={i} className="text-xs px-2 py-1 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">{c}</span>
                            ))}
                        </div>
                    )}
                    <div className="card-themed border rounded-lg p-3 text-sm text-themed">
                        {strategy.suggestedResponse}
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); onUseStrategy(strategy.suggestedResponse); }}
                        className="text-xs px-3 py-1.5 rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 transition-colors"
                    >
                        Wstaw odpowiedź
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <div className="mb-4 pt-4 border-t divider-themed">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                    <span className="text-sm font-semibold text-themed-label">AI Closer — Strategia negocjacji</span>
                </div>
                <button
                    onClick={onLoadCloser}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-medium hover:from-cyan-600 hover:to-blue-600 transition-all disabled:opacity-50"
                >
                    {isLoading ? (
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

            {error && (
                <div className="p-3 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 text-sm mb-3">{error}</div>
            )}

            {closingStrategy && !isLoading && (
                <div className="space-y-3">
                    {closingStrategy.contextSummary && (
                        <p className="text-xs text-themed-muted section-themed rounded-lg p-2.5 italic">
                            {closingStrategy.contextSummary}
                        </p>
                    )}

                    {renderStrategyCard(
                        'aggressive',
                        closingStrategy.aggressive,
                        '🛡️',
                        'border-red-500/25',
                        'bg-red-500/5'
                    )}

                    {renderStrategyCard(
                        'partnership',
                        closingStrategy.partnership,
                        '🤝',
                        'border-cyan-500/25',
                        'bg-cyan-500/5'
                    )}

                    {renderStrategyCard(
                        'quickClose',
                        closingStrategy.quickClose,
                        '⚡',
                        'border-emerald-500/25',
                        'bg-emerald-500/5'
                    )}
                </div>
            )}
        </div>
    );
}
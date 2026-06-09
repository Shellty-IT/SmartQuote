// src/app/dashboard/offers/new/components/StepTypeChoice.tsx

import { useTranslations } from '@/i18n'

interface StepTypeChoiceProps {
    selectedType: 'classic' | 'proposal'
    onSelect: (type: 'classic' | 'proposal') => void
}

export default function StepTypeChoice({ selectedType, onSelect }: StepTypeChoiceProps) {
    const tr = useTranslations('offerNew')
    const c = tr.typeChoice

    return (
        <div>
            <h2 className="text-lg font-semibold text-foreground mb-1">{c.title}</h2>
            <p className="text-sm text-muted-foreground mb-6">{c.subtitle}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Classic */}
                <button
                    type="button"
                    onClick={() => onSelect('classic')}
                    className={`flex flex-col gap-4 p-5 rounded-xl border-2 text-left transition-all ${
                        selectedType === 'classic'
                            ? 'border-primary bg-primary/5'
                            : 'border-border bg-card hover:bg-secondary/40'
                    }`}
                >
                    <div className="flex items-start gap-3">
                        <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                selectedType === 'classic'
                                    ? 'bg-primary text-white'
                                    : 'bg-muted text-muted-foreground'
                            }`}
                        >
                            {/* Table icon */}
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M3 10h18M3 6h18M3 14h18M3 18h18" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-foreground">{c.classicLabel}</p>
                            <p className="text-sm text-muted-foreground mt-1">{c.classicDesc}</p>
                        </div>
                        {selectedType === 'classic' && (
                            <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        )}
                    </div>

                    {/* Mini preview */}
                    <div className="rounded-lg bg-secondary/60 p-3 space-y-1.5">
                        {['Usługa A', 'Usługa B', 'Usługa C'].map((row, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <div className="h-2 rounded bg-muted-foreground/30 flex-1" />
                                <div className="h-2 w-12 rounded bg-muted-foreground/20" />
                            </div>
                        ))}
                        <div className="flex justify-end mt-2">
                            <div className="h-2.5 w-20 rounded bg-primary/40" />
                        </div>
                    </div>
                </button>

                {/* Proposal / Strona internetowa */}
                <button
                    type="button"
                    onClick={() => onSelect('proposal')}
                    className={`flex flex-col gap-4 p-5 rounded-xl border-2 text-left transition-all ${
                        selectedType === 'proposal'
                            ? 'border-primary bg-primary/5'
                            : 'border-border bg-card hover:bg-secondary/40'
                    }`}
                >
                    <div className="flex items-start gap-3">
                        <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                selectedType === 'proposal'
                                    ? 'bg-primary text-white'
                                    : 'bg-muted text-muted-foreground'
                            }`}
                        >
                            {/* Globe/web icon */}
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-foreground">{c.proposalLabel}</p>
                            <p className="text-sm text-muted-foreground mt-1">{c.proposalDesc}</p>
                        </div>
                        {selectedType === 'proposal' && (
                            <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        )}
                    </div>

                    {/* Mini preview */}
                    <div className="rounded-lg bg-secondary/60 p-3 space-y-1.5">
                        <div className="h-3 w-24 rounded bg-primary/40" />
                        <div className="h-2 rounded bg-muted-foreground/20 w-full" />
                        <div className="h-2 rounded bg-muted-foreground/20 w-4/5" />
                        <div className="h-2 rounded bg-muted-foreground/20 w-3/5" />
                        <div className="flex gap-2 mt-2">
                            <div className="h-5 flex-1 rounded bg-primary/30" />
                            <div className="h-5 flex-1 rounded bg-muted-foreground/20" />
                        </div>
                    </div>
                </button>
            </div>
        </div>
    )
}

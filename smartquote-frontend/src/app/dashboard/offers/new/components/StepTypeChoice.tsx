// src/app/dashboard/offers/new/components/StepTypeChoice.tsx

import { useTranslations } from '@/i18n'
import type { TemplateType } from '../constants'

interface StepTypeChoiceProps {
    selectedType: TemplateType
    onSelect: (type: TemplateType) => void
}

export default function StepTypeChoice({ selectedType, onSelect }: StepTypeChoiceProps) {
    const tr = useTranslations('offerNew')
    const c = tr.typeChoice

    return (
        <div data-testid="offer-step-type-choice">
            <h2 className="text-lg font-semibold text-foreground mb-1">{c.title}</h2>
            <p className="text-sm text-muted-foreground mb-6">{c.subtitle}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 1. Classic — Uniwersalny - systemowy */}
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
                    <div className="rounded-lg bg-secondary/60 p-3 space-y-1.5">
                        {[0, 1, 2].map((i) => (
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

                {/* 2. Universal — Uniwersalny - klasyczny */}
                <button
                    type="button"
                    onClick={() => onSelect('universal')}
                    className={`flex flex-col gap-4 p-5 rounded-xl border-2 text-left transition-all ${
                        selectedType === 'universal'
                            ? 'border-primary bg-primary/5'
                            : 'border-border bg-card hover:bg-secondary/40'
                    }`}
                >
                    <div className="flex items-start gap-3">
                        <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                selectedType === 'universal'
                                    ? 'bg-primary text-white'
                                    : 'bg-muted text-muted-foreground'
                            }`}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-foreground">{c.universalLabel}</p>
                            <p className="text-sm text-muted-foreground mt-1">{c.universalDesc}</p>
                        </div>
                        {selectedType === 'universal' && (
                            <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        )}
                    </div>
                    <div className="rounded-lg p-3 space-y-1.5" style={{ background: '#1B3A5C' }}>
                        <div className="flex items-start gap-2">
                            <div className="w-1 rounded-full" style={{ background: '#C9A84C', minHeight: '40px' }} />
                            <div className="flex-1 space-y-1">
                                <div className="h-2 rounded w-3/4" style={{ background: '#C9A84C', opacity: 0.9 }} />
                                <div className="h-1.5 rounded bg-white/20 w-full" />
                                <div className="h-1.5 rounded bg-white/15 w-2/3" />
                            </div>
                        </div>
                        <div className="flex gap-1 mt-1">
                            <div className="h-3 flex-1 rounded" style={{ background: 'rgba(201,168,76,.3)' }} />
                            <div className="h-3 flex-1 rounded bg-white/10" />
                            <div className="h-3 flex-1 rounded bg-white/10" />
                        </div>
                    </div>
                </button>

                {/* 3. Proposal — Strona internetowa - V1 */}
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

                {/* 4. Website v2 — Strona internetowa - domyślny */}
                <button
                    type="button"
                    onClick={() => onSelect('website_v2')}
                    className={`flex flex-col gap-4 p-5 rounded-xl border-2 text-left transition-all ${
                        selectedType === 'website_v2'
                            ? 'border-primary bg-primary/5'
                            : 'border-border bg-card hover:bg-secondary/40'
                    }`}
                >
                    <div className="flex items-start gap-3">
                        <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                selectedType === 'website_v2'
                                    ? 'bg-primary text-white'
                                    : 'bg-muted text-muted-foreground'
                            }`}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-foreground">{c.websiteV2Label}</p>
                            <p className="text-sm text-muted-foreground mt-1">{c.websiteV2Desc}</p>
                        </div>
                        {selectedType === 'website_v2' && (
                            <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        )}
                    </div>
                    <div className="rounded-lg bg-secondary/60 p-3 space-y-1.5">
                        <div className="h-3 w-28 rounded bg-primary/40" />
                        <div className="h-2 rounded bg-muted-foreground/20 w-full" />
                        <div className="h-2 rounded bg-muted-foreground/20 w-5/6" />
                        <div className="flex gap-1 mt-2">
                            <div className="h-6 flex-1 rounded bg-muted-foreground/10 border border-muted-foreground/20" />
                            <div className="h-6 flex-1 rounded bg-muted-foreground/10 border border-muted-foreground/20" />
                            <div className="h-6 flex-1 rounded bg-primary/20 border border-primary/30" />
                        </div>
                    </div>
                </button>

                {/* 5. Website v3 — Strona internetowa - zaawansowany */}
                <button
                    type="button"
                    onClick={() => onSelect('website_v3')}
                    className={`flex flex-col gap-4 p-5 rounded-xl border-2 text-left transition-all ${
                        selectedType === 'website_v3'
                            ? 'border-primary bg-primary/5'
                            : 'border-border bg-card hover:bg-secondary/40'
                    }`}
                >
                    <div className="flex items-start gap-3">
                        <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                selectedType === 'website_v3'
                                    ? 'bg-primary text-white'
                                    : 'bg-muted text-muted-foreground'
                            }`}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-foreground">{c.websiteV3Label}</p>
                            <p className="text-sm text-muted-foreground mt-1">{c.websiteV3Desc}</p>
                        </div>
                        {selectedType === 'website_v3' && (
                            <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        )}
                    </div>
                    <div className="rounded-lg bg-secondary/60 p-3 space-y-1.5">
                        <div className="h-3 w-24 rounded" style={{ background: 'linear-gradient(90deg,#7C3AED,#06B6D4)' }} />
                        <div className="h-2 rounded bg-muted-foreground/20 w-full" />
                        <div className="h-2 rounded bg-muted-foreground/20 w-4/5" />
                        <div className="flex gap-1 mt-2">
                            <div className="h-6 flex-1 rounded bg-muted-foreground/10 border border-muted-foreground/20" />
                            <div className="h-6 flex-1 rounded" style={{ background: 'linear-gradient(135deg,#7C3AED22,#06B6D422)', borderColor: '#7C3AED44' }} />
                        </div>
                    </div>
                </button>

                {/* 6. Mobile Simple — Aplikacja mobilna - domyślny */}
                <button
                    type="button"
                    onClick={() => onSelect('mobile_simple')}
                    className={`flex flex-col gap-4 p-5 rounded-xl border-2 text-left transition-all ${
                        selectedType === 'mobile_simple'
                            ? 'border-primary bg-primary/5'
                            : 'border-border bg-card hover:bg-secondary/40'
                    }`}
                >
                    <div className="flex items-start gap-3">
                        <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                selectedType === 'mobile_simple'
                                    ? 'bg-primary text-white'
                                    : 'bg-muted text-muted-foreground'
                            }`}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M9 12l2 2 4-4M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-foreground">{c.mobileSimpleLabel}</p>
                            <p className="text-sm text-muted-foreground mt-1">{c.mobileSimpleDesc}</p>
                        </div>
                        {selectedType === 'mobile_simple' && (
                            <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        )}
                    </div>
                    <div className="rounded-lg p-3 space-y-1.5" style={{ background: 'linear-gradient(135deg,#065F5B,#0D9488)' }}>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-14 rounded-lg border border-white/20 bg-white/10 flex-shrink-0 flex flex-col items-center justify-start pt-1 gap-0.5">
                                <div className="w-4 h-1 rounded bg-white/40" />
                                <div className="w-4 h-3 rounded bg-white/20 mt-1" />
                                <div className="flex gap-0.5 mt-0.5">
                                    <div className="w-1.5 h-2 rounded bg-white/20" />
                                    <div className="w-1.5 h-2 rounded" style={{ background: '#F97316', opacity: 0.8 }} />
                                </div>
                            </div>
                            <div className="flex-1 space-y-1">
                                <div className="h-2 rounded w-3/4" style={{ background: '#F97316', opacity: 0.9 }} />
                                <div className="h-1.5 rounded bg-white/30 w-full" />
                                <div className="h-1.5 rounded bg-white/20 w-2/3" />
                            </div>
                        </div>
                    </div>
                </button>

                {/* 7. Mobile App — Aplikacja mobilna - zaawansowany */}
                <button
                    type="button"
                    onClick={() => onSelect('mobile_app')}
                    className={`flex flex-col gap-4 p-5 rounded-xl border-2 text-left transition-all ${
                        selectedType === 'mobile_app'
                            ? 'border-primary bg-primary/5'
                            : 'border-border bg-card hover:bg-secondary/40'
                    }`}
                >
                    <div className="flex items-start gap-3">
                        <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                selectedType === 'mobile_app'
                                    ? 'bg-primary text-white'
                                    : 'bg-muted text-muted-foreground'
                            }`}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-foreground">{c.mobileAppLabel}</p>
                            <p className="text-sm text-muted-foreground mt-1">{c.mobileAppDesc}</p>
                        </div>
                        {selectedType === 'mobile_app' && (
                            <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        )}
                    </div>
                    <div className="rounded-lg p-3 space-y-1.5" style={{ background: '#1E1B4B' }}>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-14 rounded-lg border border-white/20 bg-white/5 flex-shrink-0 flex items-center justify-center">
                                <div className="w-4 h-6 rounded bg-gradient-to-b from-rose-400 to-indigo-400 opacity-80" />
                            </div>
                            <div className="flex-1 space-y-1">
                                <div className="h-2 rounded w-3/4" style={{ background: '#F43F5E', opacity: 0.8 }} />
                                <div className="h-1.5 rounded bg-white/20 w-full" />
                                <div className="h-1.5 rounded bg-white/20 w-2/3" />
                            </div>
                        </div>
                    </div>
                </button>

                {/* 8. Shop — Sklep internetowy */}
                <button
                    type="button"
                    onClick={() => onSelect('shop')}
                    className={`flex flex-col gap-4 p-5 rounded-xl border-2 text-left transition-all ${
                        selectedType === 'shop'
                            ? 'border-primary bg-primary/5'
                            : 'border-border bg-card hover:bg-secondary/40'
                    }`}
                >
                    <div className="flex items-start gap-3">
                        <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                selectedType === 'shop'
                                    ? 'bg-primary text-white'
                                    : 'bg-muted text-muted-foreground'
                            }`}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-foreground">{c.shopLabel}</p>
                            <p className="text-sm text-muted-foreground mt-1">{c.shopDesc}</p>
                        </div>
                        {selectedType === 'shop' && (
                            <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        )}
                    </div>
                    <div className="rounded-lg bg-secondary/60 p-3 space-y-1.5">
                        <div className="flex gap-1.5">
                            <div className="h-2 flex-1 rounded bg-primary/30" />
                            <div className="h-2 flex-1 rounded bg-muted-foreground/20" />
                            <div className="h-2 flex-1 rounded bg-muted-foreground/20" />
                        </div>
                        <div className="h-2 rounded bg-muted-foreground/20 w-full" />
                        <div className="h-2 rounded bg-muted-foreground/20 w-3/4" />
                        <div className="flex gap-2 mt-1">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className={`h-3 w-3 rounded-full ${i === 4 ? 'bg-primary/40' : 'bg-muted-foreground/20'}`} />
                            ))}
                        </div>
                    </div>
                </button>

                {/* 9. Support — Wsparcie IT / SLA */}
                <button
                    type="button"
                    onClick={() => onSelect('support')}
                    className={`flex flex-col gap-4 p-5 rounded-xl border-2 text-left transition-all ${
                        selectedType === 'support'
                            ? 'border-primary bg-primary/5'
                            : 'border-border bg-card hover:bg-secondary/40'
                    }`}
                >
                    <div className="flex items-start gap-3">
                        <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                selectedType === 'support'
                                    ? 'bg-primary text-white'
                                    : 'bg-muted text-muted-foreground'
                            }`}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-foreground">{c.supportLabel}</p>
                            <p className="text-sm text-muted-foreground mt-1">{c.supportDesc}</p>
                        </div>
                        {selectedType === 'support' && (
                            <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        )}
                    </div>
                    <div className="rounded-lg p-3 space-y-1.5" style={{ background: '#F0FDF9' }}>
                        <div className="h-3 w-24 rounded" style={{ background: '#0F4C75' }} />
                        <div className="flex gap-1 mt-1">
                            <div className="h-8 flex-1 rounded border" style={{ background: '#fff', borderColor: '#E2E8F0' }} />
                            <div className="h-8 flex-1 rounded border-2" style={{ background: '#EFF6FF', borderColor: '#0F4C75' }} />
                            <div className="h-8 flex-1 rounded border" style={{ background: '#0F172A', borderColor: '#0F172A' }} />
                        </div>
                        <div className="h-2 rounded w-3/4" style={{ background: '#10B981', opacity: 0.4 }} />
                    </div>
                </button>
            </div>
        </div>
    )
}

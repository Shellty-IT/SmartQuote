// src/app/dashboard/offers/new/components/StepDetails.tsx
'use client';

import { useState, useCallback } from 'react';
import { Sparkles } from 'lucide-react';
import { Input } from '@/components/ui';
import { useTranslations } from '@/i18n';
import { cn } from '@/lib/utils';
import { ai } from '@/lib/api';
import RichTextEditor from '@/components/email/RichTextEditor';
import type { OfferDetails } from '../types';

interface StepDetailsProps {
    details: OfferDetails;
    onUpdate: <K extends keyof OfferDetails>(field: K, value: OfferDetails[K]) => void;
    /** Client name for AI context (optional) */
    clientName?: string;
    /**
     * When true, the PDF template-type selector is hidden.
     * Used in new-offer flow where the type is chosen in a dedicated StepTypeChoice step.
     */
    hideTemplateSelector?: boolean;
}

export default function StepDetails({ details, onUpdate, clientName, hideTemplateSelector = false }: StepDetailsProps) {
    const tr = useTranslations('offerNew');
    const d = tr.details;
    const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
    const [isPolishingDesc, setIsPolishingDesc] = useState(false);

    const handleGenerateDescription = useCallback(async (mode: 'generate' | 'polish') => {
        if (!details.title || details.title.length < 3) return;
        if (mode === 'generate') setIsGeneratingDesc(true); else setIsPolishingDesc(true);
        try {
            const result = await ai.generateOfferDescription({
                title: details.title,
                clientName: clientName || 'Klient',
                templateType: details.templateType,
                currentText: mode === 'polish' ? details.description : undefined,
                mode,
            });
            onUpdate('description', result);
        } catch {
            // toast is not available here — user sees no change on error (silent fail)
        } finally {
            setIsGeneratingDesc(false);
            setIsPolishingDesc(false);
        }
    }, [details.title, details.description, details.templateType, clientName, onUpdate]);

    const canAI = details.title.length >= 3;

    return (
        <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">{d.title}</h2>
            <div className="space-y-4">
                <Input
                    data-testid="offer-title-input"
                    label={d.offerTitle}
                    value={details.title}
                    onChange={(e) => onUpdate('title', e.target.value)}
                    placeholder={d.offerTitlePlaceholder}
                    required
                />

                {/* Description with AI */}
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-foreground">{d.description}</label>
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                disabled={!canAI || isGeneratingDesc || isPolishingDesc}
                                onClick={() => handleGenerateDescription('generate')}
                                title={canAI ? d.aiHint : d.offerTitlePlaceholder}
                                className={cn(
                                    'flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                                    canAI
                                        ? 'bg-primary/10 text-primary hover:bg-primary/20'
                                        : 'cursor-not-allowed opacity-40 bg-muted text-muted-foreground',
                                )}
                            >
                                <Sparkles className="h-3 w-3" />
                                {isGeneratingDesc ? d.aiGenerating : d.aiGenerate}
                            </button>
                            {details.description && (
                                <button
                                    type="button"
                                    disabled={!canAI || isGeneratingDesc || isPolishingDesc}
                                    onClick={() => handleGenerateDescription('polish')}
                                    className={cn(
                                        'flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                                        canAI
                                            ? 'bg-primary/10 text-primary hover:bg-primary/20'
                                            : 'cursor-not-allowed opacity-40 bg-muted text-muted-foreground',
                                    )}
                                >
                                    <Sparkles className="h-3 w-3" />
                                    {isPolishingDesc ? d.aiGenerating : d.aiPolish}
                                </button>
                            )}
                        </div>
                    </div>
                    <RichTextEditor
                        value={details.description}
                        onChange={(v) => onUpdate('description', v)}
                        placeholder={d.descriptionPlaceholder}
                        minHeight={160}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label={d.validUntil}
                        type="date"
                        value={details.validUntil}
                        onChange={(e) => onUpdate('validUntil', e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                    />
                    <Input
                        label={d.paymentDays}
                        type="number"
                        value={details.paymentDays}
                        onChange={(e) => onUpdate('paymentDays', parseInt(e.target.value) || 14)}
                        min={0}
                        max={365}
                    />
                </div>

                {/* Payment terms — rich text */}
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1">{d.paymentTerms}</label>
                    <RichTextEditor
                        value={details.terms}
                        onChange={(v) => onUpdate('terms', v)}
                        minHeight={80}
                    />
                </div>

                {/* Internal notes — plain textarea (not client-facing) */}
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1">{d.internalNotes}</label>
                    <textarea
                        value={details.notes}
                        onChange={(e) => onUpdate('notes', e.target.value)}
                        placeholder={d.internalNotesPlaceholder}
                        rows={2}
                        style={{ resize: 'vertical', minHeight: '70px' }}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
                    />
                </div>

                {/* PDF template type — hidden in new-offer flow (type chosen in StepTypeChoice) */}
                {!hideTemplateSelector && <div>
                    <label className="block text-sm font-medium text-foreground mb-2">{d.pdfTemplateLabel}</label>
                    <p className="text-xs text-muted-foreground mb-3">{d.pdfTemplateHint}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(['classic', 'proposal'] as const).map((type) => {
                            const isActive = details.templateType === type;
                            const icon = type === 'classic' ? '📄' : '🗂️';
                            const label = type === 'classic' ? d.pdfClassic : d.pdfProposal;
                            const desc = type === 'classic' ? d.pdfClassicDesc : d.pdfProposalDesc;
                            return (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => onUpdate('templateType', type)}
                                    className={cn(
                                        'flex items-start gap-3 rounded-xl border-2 p-3 text-left transition-all',
                                        isActive
                                            ? 'border-primary bg-primary/5'
                                            : 'border-border hover:border-border/60 hover:bg-surface-subtle',
                                    )}
                                >
                                    <span className="text-xl flex-shrink-0 mt-0.5">{icon}</span>
                                    <div>
                                        <p className={cn('text-sm font-semibold', isActive ? 'text-primary' : 'text-foreground')}>{label}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>}

                {/* Audit trail */}
                <div className="p-4 bg-card border-border border rounded-xl">
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            data-testid="offer-audit-trail-checkbox"
                            type="checkbox"
                            checked={details.requireAuditTrail}
                            onChange={(e) => onUpdate('requireAuditTrail', e.target.checked)}
                            className="mt-0.5 w-5 h-5 rounded border-border text-primary focus:ring-primary"
                        />
                        <div>
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                <span className="text-sm font-medium text-foreground">{d.auditTrailTitle}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{d.auditTrailDesc}</p>
                        </div>
                    </label>
                </div>
            </div>
        </div>
    );
}

// src/app/dashboard/offers/new/components/OfferStepper.tsx
'use client';

import { useTranslations } from '@/i18n';
import type { Step } from '../constants';

interface OfferStepperProps {
    currentStep: Step;
    stepIds: Step[];
    onStepClick: (step: Step) => void;
}

export default function OfferStepper({ currentStep, stepIds, onStepClick }: OfferStepperProps) {
    const tr = useTranslations('offerNew');
    const labels: Record<Step, string> = {
        client: tr.steps.client,
        type_choice: tr.steps.type_choice,
        details: tr.steps.details,
        items: tr.steps.items,
        template: tr.steps.template,
        summary: tr.steps.summary,
    };
    const currentIndex = stepIds.indexOf(currentStep);

    return (
        <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
                {stepIds.map((stepId, index) => {
                    const isActive = stepId === currentStep;
                    const isCompleted = index < currentIndex;
                    const isClickable = index <= currentIndex;

                    return (
                        <div key={stepId} className="flex items-center flex-1">
                            <button
                                onClick={() => isClickable && onStepClick(stepId)}
                                disabled={!isClickable}
                                className={`flex items-center gap-2 ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                            >
                                <div className={`grid h-8 w-8 place-items-center rounded-full text-xs font-semibold transition-all ${
                                    isActive
                                        ? 'bg-gradient-primary text-white shadow-glow ring-1 ring-white/15'
                                        : isCompleted
                                            ? 'bg-status-accepted text-white'
                                            : 'border border-border bg-card text-muted-foreground'
                                }`}>
                                    {isCompleted ? (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        index + 1
                                    )}
                                </div>
                                <span className={`hidden xl:block text-xs font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    {labels[stepId]}
                                </span>
                            </button>
                            {index < stepIds.length - 1 && (
                                <div className="flex-1 h-px mx-2 md:mx-3 bg-surface-subtle" />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

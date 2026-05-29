// src/app/dashboard/offers/new/components/OfferStepper.tsx
'use client';

import { STEPS, type Step } from '../constants';

interface OfferStepperProps {
    currentStep: Step;
    onStepClick: (step: Step) => void;
}

export default function OfferStepper({ currentStep, onStepClick }: OfferStepperProps) {
    const currentIndex = STEPS.findIndex((s) => s.id === currentStep);

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between">
                {STEPS.map((step, index) => {
                    const isActive = step.id === currentStep;
                    const isCompleted = index < currentIndex;
                    const isClickable = index <= currentIndex;

                    return (
                        <div key={step.id} className="flex items-center flex-1">
                            <button
                                onClick={() => isClickable && onStepClick(step.id)}
                                disabled={!isClickable}
                                className={`flex items-center gap-3 ${
                                    isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                                }`}
                            >
                                <div
                                    className={`grid h-10 w-10 place-items-center rounded-full text-sm font-semibold transition-all ${
                                        isActive
                                            ? 'bg-gradient-primary text-white shadow-glow ring-1 ring-white/15'
                                            : isCompleted
                                                ? 'bg-status-accepted text-white'
                                                : 'border border-border bg-card text-muted-foreground'
                                    }`}
                                >
                                    {isCompleted ? (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        index + 1
                                    )}
                                </div>
                                <span
                                    className={`hidden md:block text-sm font-medium ${
                                        isActive ? 'text-foreground' : 'text-muted-foreground'
                                    }`}
                                >
                                    {step.label}
                                </span>
                            </button>
                            {index < STEPS.length - 1 && (
                                <div className="flex-1 h-0.5 mx-2 md:mx-4 bg-surface-subtle" />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
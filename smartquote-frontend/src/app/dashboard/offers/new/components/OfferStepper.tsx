// src/app/dashboard/offers/new/components/OfferStepper.tsx

import { STEPS, type Step } from '../constants';

interface OfferStepperProps {
    currentStep: Step;
    onStepClick: (step: Step) => void;
}

export default function OfferStepper({ currentStep, onStepClick }: OfferStepperProps) {
    return (
        <div className="mb-8">
            <div className="flex items-center justify-between">
                {STEPS.map((step, index) => {
                    const isActive = step.id === currentStep;
                    const isPast = STEPS.findIndex((s) => s.id === currentStep) > index;

                    return (
                        <div key={step.id} className="flex items-center flex-1">
                            <button
                                onClick={() => isPast && onStepClick(step.id)}
                                disabled={!isPast}
                                className={`flex items-center gap-2 ${isPast ? 'cursor-pointer' : 'cursor-default'}`}
                            >
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                                        isActive
                                            ? 'bg-cyan-500 text-white'
                                            : isPast
                                                ? 'bg-emerald-500 text-white'
                                                : 'section-themed text-themed-muted'
                                    }`}
                                >
                                    {isPast ? (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        index + 1
                                    )}
                                </div>
                                <span
                                    className={`text-sm font-medium hidden sm:block ${
                                        isActive ? 'text-cyan-600' : isPast ? 'text-emerald-600' : 'text-themed-muted'
                                    }`}
                                >
                                    {step.label}
                                </span>
                            </button>
                            {index < STEPS.length - 1 && (
                                <div className={`flex-1 h-0.5 mx-4 ${isPast ? 'bg-emerald-500' : 'section-themed'}`} />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
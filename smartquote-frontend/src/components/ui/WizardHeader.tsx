'use client';

import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';

interface WizardHeaderProps {
    title: string;
    subtitle: string;
    backLabel: string;
    onBack: () => void;
    progress: ReactNode;
    action?: ReactNode;
}

export default function WizardHeader({
    title,
    subtitle,
    backLabel,
    onBack,
    progress,
    action,
}: WizardHeaderProps) {
    return (
        <header className="grid gap-3 rounded-xl border border-border/80 bg-card/90 p-2.5 shadow-sm backdrop-blur-sm md:grid-cols-[auto_180px_minmax(0,1fr)_128px] md:items-center">
            <button
                type="button"
                onClick={onBack}
                className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground shadow-sm transition-all hover:border-primary/35 hover:bg-primary/5 hover:text-primary hover:shadow"
            >
                <ArrowLeft className="h-4 w-4" />
                {backLabel}
            </button>

            <div className="min-w-0 md:border-l md:border-border/70 md:pl-3">
                <h1 className="truncate text-lg font-bold leading-tight text-foreground">{title}</h1>
                <p className="hidden truncate text-xs text-muted-foreground lg:block">{subtitle}</p>
            </div>

            <div className="min-w-0">{progress}</div>

            <div className="flex min-h-9 items-center justify-end">
                {action}
            </div>
        </header>
    );
}

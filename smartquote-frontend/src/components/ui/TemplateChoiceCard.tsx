import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TemplateChoiceCardProps {
    selected: boolean;
    onSelect: () => void;
    title: string;
    description: string;
    icon: ReactNode;
    preview: ReactNode;
    iconVariant?: 'default' | 'website';
}

/**
 * Shared selection card used by the offer and contract creation wizards.
 * The preview lives in its own footer so cards stay aligned even when their
 * descriptions wrap to a different number of lines.
 */
export default function TemplateChoiceCard({
    selected,
    onSelect,
    title,
    description,
    icon,
    preview,
    iconVariant = 'default',
}: TemplateChoiceCardProps) {
    const websiteIcon = iconVariant === 'website';

    return (
        <button
            type="button"
            aria-pressed={selected}
            data-selected={selected || undefined}
            onClick={onSelect}
            className={cn(
                'group relative flex h-full min-h-[15.5rem] w-full flex-col overflow-hidden rounded-2xl border text-left',
                'bg-card shadow-sm transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                selected
                    ? 'border-primary/70 bg-primary/5 shadow-card ring-1 ring-primary/10'
                    : 'border-border hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-card',
            )}
        >
            <div data-slot="template-card-header" className="flex min-h-[8.75rem] w-full items-start gap-3.5 px-5 pb-5 pt-5">
                <span
                    className={cn(
                        'grid size-10 shrink-0 place-items-center rounded-xl border transition-colors',
                        websiteIcon
                            ? 'border-sky-500/30 bg-sky-500 text-white shadow-sm group-hover:border-sky-500/40 group-hover:bg-sky-500'
                            : selected
                                ? 'border-primary/30 bg-gradient-primary text-white shadow-sm'
                                : 'border-border bg-surface-subtle text-muted-foreground group-hover:border-primary/20 group-hover:text-primary',
                    )}
                    aria-hidden="true"
                >
                    {icon}
                </span>

                <span className="min-w-0 flex-1 pr-7">
                    <span className="block text-[0.98rem] font-semibold leading-5 tracking-[-0.01em] text-foreground">
                        {title}
                    </span>
                    <span className="mt-1.5 block text-sm leading-5 text-muted-foreground">
                        {description}
                    </span>
                </span>

                <span
                    className={cn(
                        'absolute right-4 top-4 grid size-6 place-items-center rounded-full border transition-colors',
                        selected
                            ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                            : 'border-border-strong bg-card text-transparent group-hover:border-primary/40',
                    )}
                    aria-hidden="true"
                >
                    <Check className="size-3.5" strokeWidth={3} />
                </span>
            </div>

            <span
                data-slot="template-preview"
                className={cn(
                    'mt-auto block w-full border-t border-border/80 p-3.5',
                    selected ? 'bg-primary/5' : 'bg-surface-subtle/60 dark:bg-background/20',
                )}
                aria-hidden="true"
            >
                <span className="block h-20 overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
                    {preview}
                </span>
            </span>
        </button>
    );
}

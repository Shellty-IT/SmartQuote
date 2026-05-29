'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const Textarea = React.forwardRef<
    HTMLTextAreaElement,
    React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
    <textarea
        ref={ref}
        className={cn(
            'flex min-h-[80px] w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60',
            className,
        )}
        {...props}
    />
));
Textarea.displayName = 'Textarea';

interface LegacyTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    resizable?: boolean;
}

const LegacyTextarea = React.forwardRef<HTMLTextAreaElement, LegacyTextareaProps>(
    ({ className, label, error, id, resizable = true, ...props }, ref) => {
        const textareaId = id || props.name;
        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={textareaId}
                        className="mb-1.5 block text-sm font-medium text-foreground"
                    >
                        {label}
                        {props.required && <span className="ml-1 text-destructive">*</span>}
                    </label>
                )}
                <Textarea
                    ref={ref}
                    id={textareaId}
                    className={cn(
                        resizable ? 'resize-y' : 'resize-none',
                        error && 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/30',
                        className,
                    )}
                    {...props}
                />
                {error && <p className="mt-1.5 text-sm text-destructive">{error}</p>}
            </div>
        );
    },
);
LegacyTextarea.displayName = 'LegacyTextarea';

export { Textarea };
export default LegacyTextarea;

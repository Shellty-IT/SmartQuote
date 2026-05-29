'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    ({ className, type, ...props }, ref) => (
        <input
            type={type}
            ref={ref}
            className={cn(
                'flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60 file:border-0 file:bg-transparent file:text-sm file:font-medium',
                className,
            )}
            {...props}
        />
    ),
);
Input.displayName = 'Input';

/* Legacy default-export with label/error/icon wrapper */
interface LegacyInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

const LegacyInput = React.forwardRef<HTMLInputElement, LegacyInputProps>(
    ({ className, label, error, icon, id, ...props }, ref) => {
        const inputId = id || props.name;
        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="mb-1.5 block text-sm font-medium text-foreground"
                    >
                        {label}
                        {props.required && <span className="ml-1 text-destructive">*</span>}
                    </label>
                )}
                <div className="relative">
                    {icon && (
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                            {icon}
                        </div>
                    )}
                    <Input
                        ref={ref}
                        id={inputId}
                        className={cn(
                            icon && 'pl-10',
                            error && 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/30',
                            className,
                        )}
                        {...props}
                    />
                </div>
                {error && <p className="mt-1.5 text-sm text-destructive">{error}</p>}
            </div>
        );
    },
);
LegacyInput.displayName = 'LegacyInput';

export { Input };
export default LegacyInput;

'use client';

import { forwardRef, SelectHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SelectOption {
    value: string;
    label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options?: SelectOption[];
    placeholder?: string;
    children?: ReactNode;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, label, error, options, placeholder, id, children, ...props }, ref) => {
        const selectId = id || props.name;
        return (
            <div className="w-full">
                {label && (
                    <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-foreground">
                        {label}
                        {props.required && <span className="ml-1 text-destructive">*</span>}
                    </label>
                )}
                <select
                    ref={ref}
                    id={selectId}
                    className={cn(
                        'block h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground shadow-sm transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60',
                        error &&
                            'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/30',
                        className,
                    )}
                    {...props}
                >
                    {placeholder && (
                        <option value="" disabled>
                            {placeholder}
                        </option>
                    )}
                    {options &&
                        options.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    {children}
                </select>
                {error && <p className="mt-1.5 text-sm text-destructive">{error}</p>}
            </div>
        );
    },
);

Select.displayName = 'Select';

export default Select;

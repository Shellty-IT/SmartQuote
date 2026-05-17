// SmartQuote-AI/src/components/ui/Select.tsx

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
                    <label
                        htmlFor={selectId}
                        className="block text-sm font-medium text-slate-700 mb-1.5"
                    >
                        {label}
                        {props.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                )}
                <select
                    ref={ref}
                    id={selectId}
                    className={cn(
                        'block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900',
                        'focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500',
                        'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed',
                        'transition-all duration-200',
                        error && 'border-red-300 focus:ring-red-500/20 focus:border-red-500',
                        className
                    )}
                    {...props}
                >
                    {placeholder && (
                        <option value="" disabled>
                            {placeholder}
                        </option>
                    )}
                    {/* Renderuj options jeśli podano tablicę */}
                    {options && options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                    {/* Lub renderuj children jeśli podano */}
                    {children}
                </select>
                {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
            </div>
        );
    }
);

Select.displayName = 'Select';

export default Select;
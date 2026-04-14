// src/components/ui/Textarea.tsx
'use client';

import { forwardRef, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    resizable?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, label, error, id, resizable = true, ...props }, ref) => {
        const textareaId = id || props.name;

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={textareaId}
                        className="block text-sm font-medium text-themed mb-1.5"
                    >
                        {label}
                        {props.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                )}
                <textarea
                    ref={ref}
                    id={textareaId}
                    className={cn(
                        'block w-full rounded-lg border px-4 py-2.5',
                        'border-slate-300 dark:border-slate-600',
                        'bg-white dark:bg-slate-800',
                        'text-slate-900 dark:text-slate-100',
                        'placeholder:text-slate-400 dark:placeholder:text-slate-500',
                        'focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500',
                        'disabled:bg-slate-50 dark:disabled:bg-slate-900 disabled:text-slate-500 disabled:cursor-not-allowed',
                        'transition-all duration-200',
                        resizable ? 'resize-y min-h-[80px]' : 'resize-none',
                        error && 'border-red-300 dark:border-red-600 focus:ring-red-500/20 focus:border-red-500',
                        className
                    )}
                    {...props}
                />
                {error && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>}
            </div>
        );
    }
);

Textarea.displayName = 'Textarea';

export default Textarea;
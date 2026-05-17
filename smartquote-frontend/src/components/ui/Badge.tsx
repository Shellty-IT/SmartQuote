// src/components/ui/Badge.tsx
'use client';

import { cn } from '@/lib/utils';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
    size?: 'sm' | 'md';
    className?: string;
}

export default function Badge({
                                  children,
                                  variant = 'default',
                                  size = 'sm',
                                  className,
                              }: BadgeProps) {
    const variants = {
        default: 'badge-themed',
        success: 'badge-success',
        warning: 'badge-warning',
        danger: 'badge-danger',
        info: 'badge-info',
    };

    const sizes = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-sm',
    };

    return (
        <span
            className={cn(
                'inline-flex items-center font-medium rounded-full',
                variants[variant],
                sizes[size],
                className
            )}
        >
            {children}
        </span>
    );
}
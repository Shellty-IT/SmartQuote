'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
    'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold transition-colors',
    {
        variants: {
            variant: {
                default: 'border-transparent bg-secondary text-secondary-foreground',
                primary: 'border-transparent bg-primary text-primary-foreground',
                outline: 'border-border bg-transparent text-foreground',
                destructive:
                    'border-transparent bg-destructive/10 text-destructive ring-1 ring-inset ring-destructive/20',
                success:
                    'border-transparent bg-[color-mix(in_oklab,var(--status-accepted)_18%,transparent)] text-[var(--status-accepted)] ring-1 ring-inset ring-[color-mix(in_oklab,var(--status-accepted)_30%,transparent)]',
                warning:
                    'border-transparent bg-[color-mix(in_oklab,oklch(0.8_0.16_60)_18%,transparent)] text-[oklch(0.55_0.14_60)] ring-1 ring-inset ring-[color-mix(in_oklab,oklch(0.7_0.16_60)_30%,transparent)]',
                danger:
                    'border-transparent bg-destructive/10 text-destructive ring-1 ring-inset ring-destructive/20',
                info: 'border-transparent bg-[color-mix(in_oklab,var(--status-open)_18%,transparent)] text-[var(--status-open)] ring-1 ring-inset ring-[color-mix(in_oklab,var(--status-open)_30%,transparent)]',
            },
            size: {
                sm: 'px-2 py-0.5 text-[11px]',
                md: 'px-2.5 py-1 text-xs',
            },
        },
        defaultVariants: { variant: 'default', size: 'sm' },
    },
);

export interface BadgeProps
    extends React.HTMLAttributes<HTMLSpanElement>,
        VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
    return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}

export { Badge, badgeVariants };
export default Badge;

'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
    {
        variants: {
            variant: {
                default:
                    'bg-gradient-primary text-white shadow-glow ring-1 ring-white/15 hover:brightness-110',
                outline:
                    'border border-border bg-card text-foreground shadow-sm hover:bg-secondary',
                secondary:
                    'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                ghost: 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                destructive:
                    'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
                link: 'text-primary underline-offset-4 hover:underline',
                subtle: 'bg-surface-subtle text-foreground hover:bg-secondary',
            },
            size: {
                default: 'h-10 px-4 [&_svg]:size-4',
                sm: 'h-8 rounded-lg px-3 text-xs [&_svg]:size-3.5',
                lg: 'h-11 px-6 [&_svg]:size-4',
                icon: 'h-9 w-9 [&_svg]:size-4',
                'icon-sm': 'h-8 w-8 rounded-lg [&_svg]:size-4',
            },
        },
        defaultVariants: { variant: 'default', size: 'default' },
    },
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : 'button';
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        );
    },
);
Button.displayName = 'Button';

type LegacyVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type LegacySize = 'sm' | 'md' | 'lg';

interface LegacyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: LegacyVariant;
    size?: LegacySize;
    isLoading?: boolean;
}

const legacyVariantMap: Record<LegacyVariant, VariantProps<typeof buttonVariants>['variant']> = {
    primary: 'default',
    secondary: 'secondary',
    outline: 'outline',
    ghost: 'ghost',
    danger: 'destructive',
};

const legacySizeMap: Record<LegacySize, VariantProps<typeof buttonVariants>['size']> = {
    sm: 'sm',
    md: 'default',
    lg: 'lg',
};

const LegacyButton = React.forwardRef<HTMLButtonElement, LegacyButtonProps>(
    ({ variant = 'primary', size = 'md', isLoading, disabled, children, className, ...props }, ref) => (
        <Button
            ref={ref}
            variant={legacyVariantMap[variant]}
            size={legacySizeMap[size]}
            disabled={disabled || isLoading}
            className={className}
            {...props}
        >
            {isLoading && <Loader2 className="size-4 animate-spin" />}
            {children}
        </Button>
    ),
);
LegacyButton.displayName = 'LegacyButton';

export { Button, buttonVariants };
export default LegacyButton;

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const alertVariants = cva(
    'relative w-full rounded-xl border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:size-4',
    {
        variants: {
            variant: {
                default: 'border-border bg-card text-card-foreground [&>svg]:text-foreground',
                destructive:
                    'border-destructive/30 bg-destructive/10 text-destructive [&>svg]:text-destructive',
                warning:
                    'border-[oklch(0.7_0.16_60)]/30 bg-[oklch(0.7_0.16_60)]/10 text-[oklch(0.55_0.14_60)] [&>svg]:text-[oklch(0.55_0.14_60)] dark:text-[oklch(0.78_0.14_60)]',
                success:
                    'border-[var(--status-accepted)]/30 bg-[var(--status-accepted)]/10 text-[var(--status-accepted)] [&>svg]:text-[var(--status-accepted)]',
                info: 'border-primary/30 bg-primary/10 text-primary [&>svg]:text-primary',
            },
        },
        defaultVariants: { variant: 'default' },
    },
);

const Alert = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
    <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
));
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
    ({ className, ...props }, ref) => (
        <h5
            ref={ref}
            className={cn('mb-1 text-sm font-semibold leading-none tracking-tight', className)}
            {...props}
        />
    ),
);
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn('text-sm [&_p]:leading-relaxed', className)} {...props} />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };

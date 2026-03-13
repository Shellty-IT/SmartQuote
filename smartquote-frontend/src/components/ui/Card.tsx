// src/components/ui/Card.tsx
'use client';

import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

export default function Card({ children, className, padding = 'md', ...props }: CardProps) {
    const paddings = {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
    };

    return (
        <div
            className={cn(
                'rounded-2xl shadow-sm border card-themed transition-colors duration-300',
                paddings[padding],
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardHeader({
                               title,
                               description,
                               action,
                           }: {
    title: string;
    description?: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="flex items-center justify-between mb-6">
            <div>
                <h3 className="text-lg font-semibold text-themed">{title}</h3>
                {description && <p className="text-sm text-themed-muted mt-1">{description}</p>}
            </div>
            {action && <div>{action}</div>}
        </div>
    );
}
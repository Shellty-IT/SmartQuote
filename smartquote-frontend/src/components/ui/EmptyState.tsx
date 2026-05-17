// src/components/ui/EmptyState.tsx
'use client';

import Button from './Button';

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4">
            {icon && (
                <div className="w-16 h-16 section-themed rounded-full flex items-center justify-center text-themed-muted mb-4">
                    {icon}
                </div>
            )}
            <h3 className="text-lg font-medium text-themed mb-1">{title}</h3>
            {description && (
                <p className="text-sm text-themed-muted text-center max-w-sm mb-4">{description}</p>
            )}
            {action && (
                <Button onClick={action.onClick} variant="primary">
                    {action.label}
                </Button>
            )}
        </div>
    );
}
'use client';

import LegacyButton from './Button';

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
        <div className="flex flex-col items-center justify-center px-4 py-12">
            {icon && (
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                    {icon}
                </div>
            )}
            <h3 className="mb-1 text-lg font-semibold tracking-tight">{title}</h3>
            {description && (
                <p className="mb-4 max-w-sm text-center text-sm text-muted-foreground">{description}</p>
            )}
            {action && (
                <LegacyButton onClick={action.onClick} variant="primary">
                    {action.label}
                </LegacyButton>
            )}
        </div>
    );
}

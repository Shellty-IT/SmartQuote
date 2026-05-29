'use client';

import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import Modal from './Modal';
import LegacyButton from './Button';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
    isLoading?: boolean;
}

const iconConfig = {
    danger: {
        Icon: AlertCircle,
        iconClass: 'text-destructive',
        bgClass: 'bg-destructive/10',
    },
    warning: {
        Icon: AlertTriangle,
        iconClass: 'text-[oklch(0.65_0.18_60)]',
        bgClass: 'bg-[oklch(0.65_0.18_60)]/10',
    },
    info: {
        Icon: Info,
        iconClass: 'text-primary',
        bgClass: 'bg-primary/10',
    },
};

export default function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel = 'Potwierdź',
    cancelLabel = 'Anuluj',
    variant = 'danger',
    isLoading = false,
}: ConfirmDialogProps) {
    const { Icon, iconClass, bgClass } = iconConfig[variant];
    return (
        <Modal isOpen={isOpen} onClose={onClose} size="sm">
            <div className="text-center">
                <div className={cn('mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full', bgClass)}>
                    <Icon className={cn('h-6 w-6', iconClass)} />
                </div>
                <h3 className="mb-2 text-lg font-semibold tracking-tight">{title}</h3>
                {description && <p className="mb-6 text-sm text-muted-foreground">{description}</p>}
                <div className="flex justify-center gap-3">
                    <LegacyButton variant="outline" onClick={onClose} disabled={isLoading}>
                        {cancelLabel}
                    </LegacyButton>
                    <LegacyButton
                        variant={variant === 'danger' ? 'danger' : 'primary'}
                        onClick={onConfirm}
                        isLoading={isLoading}
                    >
                        {confirmLabel}
                    </LegacyButton>
                </div>
            </div>
        </Modal>
    );
}

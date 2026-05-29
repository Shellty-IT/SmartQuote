'use client';

import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const sizeMap = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-6xl',
} as const;

export default function Modal({
    isOpen,
    onClose,
    title,
    description,
    children,
    size = 'md',
}: ModalProps) {
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const modalId = title ? 'modal-title-' + title.replace(/\s+/g, '-').toLowerCase() : undefined;

    return (
        <div
            className="fixed inset-0 z-50 overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby={modalId}
        >
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                aria-hidden="true"
                onClick={onClose}
            />
            <div className="flex min-h-full items-center justify-center p-4">
                <div
                    className={cn(
                        'relative w-full rounded-2xl border border-border bg-card text-card-foreground shadow-elevated transition-all',
                        sizeMap[size],
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    {(title || description) && (
                        <div className="border-b border-border px-6 py-4">
                            {title && (
                                <h3 id={modalId} className="text-lg font-semibold tracking-tight">
                                    {title}
                                </h3>
                            )}
                            {description && (
                                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                            )}
                        </div>
                    )}
                    <button
                        onClick={onClose}
                        aria-label="Zamknij"
                        className="absolute right-4 top-4 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                        <X className="h-4 w-4" />
                    </button>
                    <div className="px-6 py-4">{children}</div>
                </div>
            </div>
        </div>
    );
}

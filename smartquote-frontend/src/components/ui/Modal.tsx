// src/components/ui/Modal.tsx
'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export default function Modal({
                                  isOpen,
                                  onClose,
                                  title,
                                  description,
                                  children,
                                  size = 'md',
                              }: ModalProps) {
    if (!isOpen) return null;

    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-6xl',
    };

    const modalId = title ? 'modal-title-' + title.replace(/\s+/g, '-').toLowerCase() : undefined;

    return (
        <div
            className="fixed inset-0 z-50 overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby={modalId}
        >
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                aria-hidden="true"
                onClick={onClose}
            />

            <div className="flex min-h-full items-center justify-center p-4">
                <div
                    className={cn(
                        'relative w-full card-themed border rounded-2xl shadow-2xl transform transition-all',
                        sizes[size]
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    {(title || description) && (
                        <div className="px-6 py-4 border-b divider-themed">
                            {title && (
                                <h3 id={modalId} className="text-lg font-semibold text-themed">
                                    {title}
                                </h3>
                            )}
                            {description && (
                                <p className="mt-1 text-sm text-themed-muted">{description}</p>
                            )}
                        </div>
                    )}

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-themed-muted hover-themed rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div className="px-6 py-4">{children}</div>
                </div>
            </div>
        </div>
    );
}
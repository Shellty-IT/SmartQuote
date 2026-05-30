'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/i18n';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration: number;
}

const typeConfig: Record<ToastType, { color: string; bar: string; Icon: typeof CheckCircle2 }> = {
    success: {
        color: 'text-[var(--status-accepted)]',
        bar: 'bg-[var(--status-accepted)]',
        Icon: CheckCircle2,
    },
    error: {
        color: 'text-destructive',
        bar: 'bg-destructive',
        Icon: XCircle,
    },
    warning: {
        color: 'text-[oklch(0.65_0.18_60)]',
        bar: 'bg-[oklch(0.65_0.18_60)]',
        Icon: AlertTriangle,
    },
    info: {
        color: 'text-primary',
        bar: 'bg-primary',
        Icon: Info,
    },
};

const ariaRoles: Record<ToastType, 'alert' | 'status'> = {
    success: 'status',
    error: 'alert',
    warning: 'alert',
    info: 'status',
};

interface ToastItemProps {
    toast: ToastData;
    onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
    const tr = useTranslations('common');
    const [isExiting, setIsExiting] = useState(false);
    const closingRef = useRef(false);
    const { Icon, color, bar } = typeConfig[toast.type];

    const handleClose = useCallback(() => {
        if (closingRef.current) return;
        closingRef.current = true;
        setIsExiting(true);
        setTimeout(() => onRemove(toast.id), 200);
    }, [onRemove, toast.id]);

    useEffect(() => {
        if (toast.duration <= 0) return;
        const timer = setTimeout(handleClose, toast.duration);
        return () => clearTimeout(timer);
    }, [toast.duration, handleClose]);

    return (
        <div
            className={cn(
                'toast-item border-l-4',
                isExiting ? 'toast-exit' : 'toast-enter',
                color.replace('text-', 'border-l-'),
            )}
            role={ariaRoles[toast.type]}
            aria-live={toast.type === 'error' || toast.type === 'warning' ? 'assertive' : 'polite'}
        >
            <div className={cn('mt-px shrink-0', color)}>
                <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="toast-title">{toast.title}</p>
                {toast.message && <p className="toast-message">{toast.message}</p>}
            </div>
            <button onClick={handleClose} aria-label={tr.close} className="toast-close-btn">
                <X className="h-4 w-4" />
            </button>
            {toast.duration > 0 && (
                <div
                    className={cn('toast-progress-bar', bar)}
                    style={{ animationDuration: `${toast.duration}ms` }}
                />
            )}
        </div>
    );
}

interface ToastContainerProps {
    toasts: ToastData[];
    onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
    if (toasts.length === 0) return null;
    return (
        <div className="toast-container" role="region" aria-label="Powiadomienia">
            {toasts.map((t) => (
                <ToastItem key={t.id} toast={t} onRemove={onRemove} />
            ))}
        </div>
    );
}

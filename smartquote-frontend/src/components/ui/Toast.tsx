// src/components/ui/Toast.tsx
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration: number;
}

const TYPE_STYLES: Record<ToastType, { border: string; icon: string; progress: string }> = {
    success: { border: '#059669', icon: '#059669', progress: '#10b981' },
    error: { border: '#dc2626', icon: '#dc2626', progress: '#ef4444' },
    warning: { border: '#d97706', icon: '#d97706', progress: '#f59e0b' },
    info: { border: '#0891b2', icon: '#0891b2', progress: '#06b6d4' },
};

const ARIA_ROLES: Record<ToastType, 'alert' | 'status'> = {
    success: 'status',
    error: 'alert',
    warning: 'alert',
    info: 'status',
};

function CheckCircle() {
    return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
        </svg>
    );
}

function XCircle() {
    return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
        </svg>
    );
}

function Exclamation() {
    return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
    );
}

function InfoCircle() {
    return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
        </svg>
    );
}

const ICONS: Record<ToastType, () => React.JSX.Element> = {
    success: CheckCircle,
    error: XCircle,
    warning: Exclamation,
    info: InfoCircle,
};

interface ToastItemProps {
    toast: ToastData;
    onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
    const [isExiting, setIsExiting] = useState(false);
    const closingRef = useRef(false);
    const config = TYPE_STYLES[toast.type];
    const Icon = ICONS[toast.type];

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
            className={`toast-item ${isExiting ? 'toast-exit' : 'toast-enter'}`}
            role={ARIA_ROLES[toast.type]}
            aria-live={toast.type === 'error' || toast.type === 'warning' ? 'assertive' : 'polite'}
            style={{
                backgroundColor: 'var(--toast-bg)',
                borderLeft: `4px solid ${config.border}`,
                borderTop: '1px solid var(--toast-border)',
                borderRight: '1px solid var(--toast-border)',
                borderBottom: '1px solid var(--toast-border)',
                boxShadow: '0 4px 16px var(--toast-shadow)',
            }}
        >
            <div style={{ color: config.icon, flexShrink: 0, marginTop: '1px' }}>
                <Icon />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p className="toast-title">{toast.title}</p>
                {toast.message && <p className="toast-message">{toast.message}</p>}
            </div>
            <button onClick={handleClose} aria-label="Zamknij" className="toast-close-btn">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
            </button>
            {toast.duration > 0 && (
                <div
                    className="toast-progress-bar"
                    style={{ backgroundColor: config.progress, animationDuration: `${toast.duration}ms` }}
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
            {toasts.map(t => (
                <ToastItem key={t.id} toast={t} onRemove={onRemove} />
            ))}
        </div>
    );
}
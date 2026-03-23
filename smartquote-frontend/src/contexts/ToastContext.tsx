// src/contexts/ToastContext.tsx
'use client';

import { createContext, useContext, useCallback, useState, useRef, type ReactNode } from 'react';
import { ToastContainer, type ToastData, type ToastType } from '@/components/ui/Toast';

const MAX_TOASTS = 5;
const DEFAULT_DURATION = 5000;
const ERROR_DURATION = 8000;

interface ToastInput {
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

interface ToastContextType {
    addToast: (input: ToastInput) => string;
    removeToast: (id: string) => void;
    success: (title: string, message?: string) => string;
    error: (title: string, message?: string) => string;
    warning: (title: string, message?: string) => string;
    info: (title: string, message?: string) => string;
}

const ToastContext = createContext<ToastContextType>({
    addToast: () => '',
    removeToast: () => {},
    success: () => '',
    error: () => '',
    warning: () => '',
    info: () => '',
});

export function useToast() {
    return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastData[]>([]);
    const counterRef = useRef(0);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const addToast = useCallback((input: ToastInput): string => {
        counterRef.current += 1;
        const id = `toast-${Date.now()}-${counterRef.current}`;
        const duration = input.duration ?? (input.type === 'error' ? ERROR_DURATION : DEFAULT_DURATION);
        const newToast: ToastData = {
            id,
            type: input.type,
            title: input.title,
            message: input.message,
            duration,
        };

        setToasts(prev => {
            const updated = [...prev, newToast];
            return updated.length > MAX_TOASTS ? updated.slice(-MAX_TOASTS) : updated;
        });

        return id;
    }, []);

    const success = useCallback((title: string, message?: string): string => {
        return addToast({ type: 'success', title, message });
    }, [addToast]);

    const error = useCallback((title: string, message?: string): string => {
        return addToast({ type: 'error', title, message });
    }, [addToast]);

    const warning = useCallback((title: string, message?: string): string => {
        return addToast({ type: 'warning', title, message });
    }, [addToast]);

    const info = useCallback((title: string, message?: string): string => {
        return addToast({ type: 'info', title, message });
    }, [addToast]);

    return (
        <ToastContext.Provider value={{ addToast, removeToast, success, error, warning, info }}>
            {children}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </ToastContext.Provider>
    );
}
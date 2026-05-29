// src/app/providers.tsx
'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode, useEffect, useState, createContext, useContext, useCallback, useRef } from 'react';
import { AIChatProvider } from '@/contexts/AIChatContext';
import { ToastProvider } from '@/contexts/ToastContext';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    toggle: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'light',
    setTheme: () => {},
    toggle: () => {},
});

export function useTheme() {
    return useContext(ThemeContext);
}

function applyTheme(t: Theme) {
    const root = document.documentElement;
    if (t === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
}

function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('light');
    const [mounted, setMounted] = useState(false);
    const initialized = useRef(false);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        requestAnimationFrame(() => {
            const saved = localStorage.getItem('smartquote-theme') as Theme | null;
            const resolved: Theme = (saved === 'light' || saved === 'dark') ? saved : 'light';
            setThemeState(resolved);
            applyTheme(resolved);
            setMounted(true);
        });
    }, []);

    const setTheme = useCallback((newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem('smartquote-theme', newTheme);
        applyTheme(newTheme);
    }, []);

    const toggle = useCallback(() => {
        setThemeState((prev) => {
            const next: Theme = prev === 'dark' ? 'light' : 'dark';
            localStorage.setItem('smartquote-theme', next);
            applyTheme(next);
            return next;
        });
    }, []);

    if (!mounted) {
        return <>{children}</>;
    }

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggle }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function Providers({ children }: { children: ReactNode }) {
    return (
        <SessionProvider>
            <ThemeProvider>
                <ToastProvider>
                    <AIChatProvider>
                        {children}
                    </AIChatProvider>
                </ToastProvider>
            </ThemeProvider>
        </SessionProvider>
    );
}
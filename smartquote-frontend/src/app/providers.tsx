// src/app/providers.tsx
'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode, useEffect, useState, createContext, useContext, useCallback, useRef } from 'react';
import { AIChatProvider } from '@/contexts/AIChatContext';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'light',
    setTheme: () => {},
});

export function useTheme() {
    return useContext(ThemeContext);
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
            if (saved === 'light' || saved === 'dark') {
                setThemeState(saved);
                document.documentElement.setAttribute('data-theme', saved);
            }
            setMounted(true);
        });
    }, []);

    const setTheme = useCallback((newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem('smartquote-theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    }, []);

    if (!mounted) {
        return <>{children}</>;
    }

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function Providers({ children }: { children: ReactNode }) {
    return (
        <SessionProvider>
            <ThemeProvider>
                <AIChatProvider>
                    {children}
                </AIChatProvider>
            </ThemeProvider>
        </SessionProvider>
    );
}
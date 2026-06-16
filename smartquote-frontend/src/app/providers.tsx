// src/app/providers.tsx
'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode, useEffect, useState, createContext, useContext, useCallback, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AIChatProvider } from '@/contexts/AIChatContext';
import { ToastProvider } from '@/contexts/ToastContext';


type Theme = 'light' | 'dark';
type Language = 'pl' | 'en';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
}

export const LanguageContext = createContext<LanguageContextType>({
    language: 'pl',
    setLanguage: () => {},
});

function LanguageProvider({
    children,
    initialLanguage = 'pl',
}: {
    children: ReactNode;
    initialLanguage?: Language;
}) {
    const [language, setLanguageState] = useState<Language>(initialLanguage);

    useEffect(() => {
        try {
            localStorage.setItem('smartquote-lang', language);
            document.cookie = `smartquote-lang=${language}; path=/; max-age=31536000; SameSite=Lax`;
            document.documentElement.lang = language;
        } catch {
        }
    }, [language]);

    const setLanguage = useCallback((lang: Language) => {
        setLanguageState(lang);
        try {
            localStorage.setItem('smartquote-lang', lang);
            document.cookie = `smartquote-lang=${lang}; path=/; max-age=31536000; SameSite=Lax`;
        } catch {
        }
    }, []);

    return (
        <LanguageContext.Provider value={{ language, setLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
}

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
    const initialized = useRef(false);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        requestAnimationFrame(() => {
            const saved = localStorage.getItem('smartquote-theme') as Theme | null;
            const resolved: Theme = (saved === 'light' || saved === 'dark') ? saved : 'light';
            setThemeState(resolved);
            applyTheme(resolved);
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

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggle }}>
            {children}
        </ThemeContext.Provider>
    );
}

interface SidebarContextType {
    collapsed: boolean;
    setCollapsed: (v: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType>({
    collapsed: false,
    setCollapsed: () => {},
});

export function useSidebarCollapsed() {
    return useContext(SidebarContext);
}

function SidebarProvider({ children }: { children: ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);
    return (
        <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
            {children}
        </SidebarContext.Provider>
    );
}

export function Providers({
    children,
    initialLanguage = 'pl',
}: {
    children: ReactNode;
    initialLanguage?: Language;
}) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 30_000,
                retry: 1,
                refetchOnWindowFocus: true,
            },
        },
    }));
    return (
        <QueryClientProvider client={queryClient}>
            <SessionProvider>
                <ThemeProvider>
                    <LanguageProvider initialLanguage={initialLanguage}>
                        <SidebarProvider>
                            <ToastProvider>
                                <AIChatProvider>
                                    {children}
                                </AIChatProvider>
                            </ToastProvider>
                        </SidebarProvider>
                    </LanguageProvider>
                </ThemeProvider>
            </SessionProvider>
        </QueryClientProvider>
    );
}

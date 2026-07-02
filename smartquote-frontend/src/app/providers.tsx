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

export type DockPosition = 'left' | 'right' | 'top' | 'bottom' | 'floating';
const DOCK_POSITIONS: readonly DockPosition[] = ['left', 'right', 'top', 'bottom', 'floating'];

export interface DockFloatCoords {
    x: number;
    y: number;
}

const DEFAULT_FLOAT_COORDS: DockFloatCoords = { x: 24, y: 96 };

interface DockContextType {
    position: DockPosition;
    setPosition: (p: DockPosition) => void;
    collapsed: boolean;
    setCollapsed: (v: boolean) => void;
    floatCoords: DockFloatCoords;
    setFloatCoords: (c: DockFloatCoords) => void;
}

const DockContext = createContext<DockContextType>({
    position: 'left',
    setPosition: () => {},
    collapsed: false,
    setCollapsed: () => {},
    floatCoords: DEFAULT_FLOAT_COORDS,
    setFloatCoords: () => {},
});

export function useDockSettings() {
    return useContext(DockContext);
}

function DockProvider({ children }: { children: ReactNode }) {
    const [position, setPositionState] = useState<DockPosition>('left');
    const [collapsed, setCollapsedState] = useState(false);
    const [floatCoords, setFloatCoordsState] = useState<DockFloatCoords>(DEFAULT_FLOAT_COORDS);
    const initialized = useRef(false);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        try {
            const savedPosition = localStorage.getItem('sq_dock_position') as DockPosition | null;
            if (savedPosition && DOCK_POSITIONS.includes(savedPosition)) {
                setPositionState(savedPosition);
            }
            const savedCollapsed = localStorage.getItem('sq_dock_collapsed');
            if (savedCollapsed !== null) {
                setCollapsedState(savedCollapsed === 'true');
            }
            const savedFloat = localStorage.getItem('sq_dock_float_position');
            if (savedFloat) {
                const parsed = JSON.parse(savedFloat);
                if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') {
                    setFloatCoordsState(parsed);
                }
            }
        } catch {
        }
    }, []);

    const setPosition = useCallback((p: DockPosition) => {
        setPositionState(p);
        try {
            localStorage.setItem('sq_dock_position', p);
        } catch {
        }
    }, []);

    const setCollapsed = useCallback((v: boolean) => {
        setCollapsedState(v);
        try {
            localStorage.setItem('sq_dock_collapsed', String(v));
        } catch {
        }
    }, []);

    const setFloatCoords = useCallback((c: DockFloatCoords) => {
        setFloatCoordsState(c);
        try {
            localStorage.setItem('sq_dock_float_position', JSON.stringify(c));
        } catch {
        }
    }, []);

    return (
        <DockContext.Provider value={{ position, setPosition, collapsed, setCollapsed, floatCoords, setFloatCoords }}>
            {children}
        </DockContext.Provider>
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
                        <DockProvider>
                            <ToastProvider>
                                <AIChatProvider>
                                    {children}
                                </AIChatProvider>
                            </ToastProvider>
                        </DockProvider>
                    </LanguageProvider>
                </ThemeProvider>
            </SessionProvider>
        </QueryClientProvider>
    );
}

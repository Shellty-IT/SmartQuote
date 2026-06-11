'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { PageContext } from '@/hooks/usePageContext';

interface AIChatContextType {
    isOpen: boolean;
    openChat: () => void;
    closeChat: () => void;
    toggleChat: () => void;
    sendQuickMessage: (message: string) => void;
    quickMessage: string | null;
    clearQuickMessage: () => void;
    hideGlobalFab: boolean;
    setHideGlobalFab: (hide: boolean) => void;
    pageContext: PageContext | null;
    setPageContext: (ctx: PageContext | null) => void;
    proactiveSuggestions: string[];
    setProactiveSuggestions: (s: string[]) => void;
}

const AIChatContext = createContext<AIChatContextType | undefined>(undefined);

export function AIChatProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [quickMessage, setQuickMessage] = useState<string | null>(null);
    const [hideGlobalFab, setHideGlobalFab] = useState(false);
    const [pageContext, setPageContext] = useState<PageContext | null>(null);
    const [proactiveSuggestions, setProactiveSuggestions] = useState<string[]>([]);

    const openChat = useCallback(() => setIsOpen(true), []);
    const closeChat = useCallback(() => setIsOpen(false), []);
    const toggleChat = useCallback(() => setIsOpen(prev => !prev), []);

    const sendQuickMessage = useCallback((message: string) => {
        setQuickMessage(message);
        setIsOpen(true);
    }, []);

    const clearQuickMessage = useCallback(() => {
        setQuickMessage(null);
    }, []);

    return (
        <AIChatContext.Provider value={{
            isOpen,
            openChat,
            closeChat,
            toggleChat,
            sendQuickMessage,
            quickMessage,
            clearQuickMessage,
            hideGlobalFab,
            setHideGlobalFab,
            pageContext,
            setPageContext,
            proactiveSuggestions,
            setProactiveSuggestions,
        }}>
            {children}
        </AIChatContext.Provider>
    );
}

export function useAIChat() {
    const context = useContext(AIChatContext);
    if (!context) {
        throw new Error('useAIChat must be used within AIChatProvider');
    }
    return context;
}
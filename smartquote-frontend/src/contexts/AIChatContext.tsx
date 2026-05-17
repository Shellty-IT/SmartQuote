'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface AIChatContextType {
    isOpen: boolean;
    openChat: () => void;
    closeChat: () => void;
    toggleChat: () => void;
    sendQuickMessage: (message: string) => void;
    quickMessage: string | null;
    clearQuickMessage: () => void;
}

const AIChatContext = createContext<AIChatContextType | undefined>(undefined);

export function AIChatProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [quickMessage, setQuickMessage] = useState<string | null>(null);

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
            clearQuickMessage
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
// src/components/ai/hooks/useChatScroll.ts
import { useRef, useEffect, useCallback } from 'react';

export function useChatScroll(messages: unknown, isOpen: boolean, isMinimized: boolean) {
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen, isMinimized, scrollToBottom]);

    return { messagesEndRef, scrollToBottom };
}
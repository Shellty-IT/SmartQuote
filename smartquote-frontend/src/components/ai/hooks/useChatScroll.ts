// src/components/ai/hooks/useChatScroll.ts
import { useRef, useEffect, useCallback } from 'react';

export function useChatScroll(dependencies: unknown[]) {
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, dependencies);

    return { messagesEndRef, scrollToBottom };
}
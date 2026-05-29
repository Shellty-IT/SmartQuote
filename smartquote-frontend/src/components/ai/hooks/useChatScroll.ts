// src/components/ai/hooks/useChatScroll.ts
import { useRef, useEffect, useCallback } from 'react';

export function useChatScroll(dependencies: unknown[]) {
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        scrollToBottom();
    }, dependencies); // dynamic deps array is intentional — caller controls when to scroll

    return { messagesEndRef, scrollToBottom };
}
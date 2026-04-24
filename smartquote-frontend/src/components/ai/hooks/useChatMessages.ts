// src/components/ai/hooks/useChatMessages.ts
import { useState, useEffect, useCallback } from 'react';

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const STORAGE_KEY = 'global-ai-chat-messages';

export function useChatMessages() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (!saved) return;

            const parsed = JSON.parse(saved) as Array<{
                id: string;
                role: 'user' | 'assistant';
                content: string;
                timestamp: string;
            }>;

            setMessages(
                parsed.map((m) => ({
                    ...m,
                    timestamp: new Date(m.timestamp),
                }))
            );
        } catch (error) {
            console.error('Failed to load chat messages:', error);
            localStorage.removeItem(STORAGE_KEY);
        }
    }, []);

    useEffect(() => {
        if (messages.length > 0) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
            } catch (error) {
                console.error('Failed to save chat messages:', error);
            }
        }
    }, [messages]);

    const addMessage = useCallback((message: ChatMessage) => {
        setMessages((prev) => [...prev, message]);
    }, []);

    const clearMessages = useCallback(() => {
        setMessages([]);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    return {
        messages,
        addMessage,
        clearMessages,
    };
}
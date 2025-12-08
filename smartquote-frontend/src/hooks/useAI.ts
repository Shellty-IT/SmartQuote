// SmartQuote-AI/src/hooks/useAI.ts
'use client';

import { useState, useCallback } from 'react';
import { ai } from '@/lib/api';
import { v4 as uuidv4 } from 'uuid';
import type {
    AIMessage,
    AIAction,
    AISuggestion,
    AIStats,
    GeneratedOffer,
    ClientAnalysis,
    ChatData,
    SuggestionsData
} from '@/types/ai';

export function useAI() {
    const [messages, setMessages] = useState<AIMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
    const [stats, setStats] = useState<AIStats | null>(null);

    const sendMessage = useCallback(async (content: string) => {
        if (!content.trim()) return;

        const userMessage: AIMessage = {
            id: uuidv4(),
            role: 'user',
            content,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);

        const loadingMessage: AIMessage = {
            id: uuidv4(),
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            isLoading: true,
        };
        setMessages(prev => [...prev, loadingMessage]);
        setIsLoading(true);

        try {
            const history = messages.map(m => ({
                role: m.role,
                content: m.content,
            }));

            const data = await ai.chat(content, history) as ChatData;

            const aiMessage: AIMessage = {
                id: loadingMessage.id,
                role: 'assistant',
                content: data.message,
                timestamp: new Date(),
                suggestions: data.suggestions,
                actions: data.actions,
            };

            setMessages(prev => prev.map(m =>
                m.id === loadingMessage.id ? aiMessage : m
            ));
        } catch (error: unknown) {
            let errorMessage = 'Wystąpił błąd. Spróbuj ponownie.';

            if (error instanceof Error) {
                errorMessage = error.message;
            }

            const errorAIMessage: AIMessage = {
                id: loadingMessage.id,
                role: 'assistant',
                content: errorMessage,
                timestamp: new Date(),
            };
            setMessages(prev => prev.map(m =>
                m.id === loadingMessage.id ? errorAIMessage : m
            ));
        } finally {
            setIsLoading(false);
        }
    }, [messages]);

    const fetchSuggestions = useCallback(async () => {
        try {
            const data = await ai.getSuggestions() as SuggestionsData;
            setSuggestions(data.suggestions || []);
            setStats(data.stats || null);
        } catch (error) {
            console.error('Error fetching suggestions:', error);
        }
    }, []);

    const generateOffer = useCallback(async (
        description: string,
        clientId?: string
    ): Promise<GeneratedOffer | null> => {
        setIsLoading(true);
        try {
            const data = await ai.generateOffer(description, clientId) as GeneratedOffer;
            return data;
        } catch (error) {
            console.error('Error generating offer:', error);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const generateEmail = useCallback(async (
        type: 'offer_send' | 'followup' | 'thank_you' | 'reminder',
        clientName: string,
        offerTitle?: string,
        customContext?: string
    ): Promise<string | null> => {
        setIsLoading(true);
        try {
            const data = await ai.generateEmail(type, clientName, offerTitle, customContext) as { email: string };
            return data.email;
        } catch (error) {
            console.error('Error generating email:', error);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const analyzeClient = useCallback(async (clientId: string): Promise<ClientAnalysis | null> => {
        setIsLoading(true);
        try {
            const data = await ai.analyzeClient(clientId) as ClientAnalysis;
            return data;
        } catch (error) {
            console.error('Error analyzing client:', error);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const clearMessages = useCallback(async () => {
        setMessages([]);
        try {
            await ai.clearHistory();
        } catch (error) {
            console.error('Error clearing history:', error);
        }
    }, []);

    return {
        messages,
        isLoading,
        suggestions,
        stats,
        sendMessage,
        fetchSuggestions,
        generateOffer,
        generateEmail,
        analyzeClient,
        clearMessages,
    };
}
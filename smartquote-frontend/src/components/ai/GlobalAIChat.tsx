// src/components/ai/GlobalAIChat.tsx
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { ai } from '@/lib/api';
import { useChatMessages } from './hooks/useChatMessages';
import { useChatScroll } from './hooks/useChatScroll';
import { ChatHeader } from './ChatHeader';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';

export function GlobalAIChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const { data: session } = useSession();
    const { messages, addMessage, clearMessages } = useChatMessages();
    const { messagesEndRef } = useChatScroll([messages, isOpen, isMinimized]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = {
            id: crypto.randomUUID(),
            role: 'user' as const,
            content: input.trim(),
            timestamp: new Date(),
        };

        addMessage(userMessage);
        const messageToSend = input.trim();
        setInput('');
        setIsLoading(true);

        try {
            const history = messages.map((m) => ({
                role: m.role,
                content: m.content,
            }));

            const response = await ai.chat(messageToSend, history);

            const assistantMessage = {
                id: crypto.randomUUID(),
                role: 'assistant' as const,
                content: response.message || 'Nie otrzymano odpowiedzi',
                timestamp: new Date(),
            };

            addMessage(assistantMessage);

            if (!isOpen || isMinimized) {
                setUnreadCount((prev) => prev + 1);
            }
        } catch (error) {
            const errorMessage = {
                id: crypto.randomUUID(),
                role: 'assistant' as const,
                content:
                    error instanceof Error
                        ? error.message
                        : 'Przepraszam, wystąpił błąd. Spróbuj ponownie później.',
                timestamp: new Date(),
            };
            addMessage(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearHistory = async () => {
        try {
            await ai.clearHistory();
        } catch (error) {
            console.error('Failed to clear AI history:', error);
        }
        clearMessages();
    };

    const toggleOpen = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            setIsMinimized(false);
            setUnreadCount(0);
        }
    };

    const toggleMinimize = () => {
        setIsMinimized(!isMinimized);
        if (isMinimized) {
            setUnreadCount(0);
        }
    };

    if (!session) {
        return null;
    }

    return (
        <>
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={toggleOpen}
                        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/30 transition-shadow"
                    >
                        <svg className="w-6 h-6 text-white relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                        </svg>

                        {unreadCount > 0 && (
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full z-20"
                            >
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </motion.span>
                        )}

                        <span
                            className="absolute inset-0 rounded-full bg-cyan-500 animate-ping opacity-25 pointer-events-none"
                            aria-hidden="true"
                        />
                    </motion.button>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            scale: 1,
                            height: isMinimized ? 'auto' : '500px',
                        }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] card-themed border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                    >
                        <ChatHeader
                            isLoading={isLoading}
                            isMinimized={isMinimized}
                            onToggleMinimize={toggleMinimize}
                            onClearHistory={handleClearHistory}
                            onClose={toggleOpen}
                        />

                        <AnimatePresence>
                            {!isMinimized && (
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: 'auto' }}
                                    exit={{ height: 0 }}
                                    className="flex-1 overflow-hidden flex flex-col"
                                >
                                    <ChatMessages
                                        messages={messages}
                                        isLoading={isLoading}
                                        messagesEndRef={messagesEndRef}
                                        onSuggestionClick={setInput}
                                    />

                                    <ChatInput
                                        value={input}
                                        onChange={setInput}
                                        onSend={handleSend}
                                        isLoading={isLoading}
                                        isVisible={!isMinimized}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
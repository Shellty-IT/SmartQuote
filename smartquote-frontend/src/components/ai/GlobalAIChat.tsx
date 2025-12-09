'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare,
    X,
    Send,
    Minimize2,
    Maximize2,
    Sparkles,
    Loader2,
    Trash2,
    Bot,
    User
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { ai } from '@/lib/api';
import Button from '@/components/ui/Button';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export function GlobalAIChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const { data: session } = useSession();

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        if (isOpen && !isMinimized) {
            scrollToBottom();
            setUnreadCount(0);
        }
    }, [messages, isOpen, isMinimized, scrollToBottom]);

    useEffect(() => {
        if (isOpen && !isMinimized) {
            inputRef.current?.focus();
        }
    }, [isOpen, isMinimized]);

    // Load messages from localStorage
    useEffect(() => {
        const savedMessages = localStorage.getItem('global-ai-chat-messages');
        if (savedMessages) {
            try {
                const parsed = JSON.parse(savedMessages) as Array<{
                    id: string;
                    role: 'user' | 'assistant';
                    content: string;
                    timestamp: string;
                }>;
                setMessages(parsed.map((m) => ({
                    ...m,
                    timestamp: new Date(m.timestamp)
                })));
            } catch (e) {
                console.error('Failed to load chat messages:', e);
            }
        }
    }, []);

    // Save messages to localStorage
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem('global-ai-chat-messages', JSON.stringify(messages));
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: crypto.randomUUID(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        const messageToSend = input.trim();
        setInput('');
        setIsLoading(true);

        try {
            // Przygotuj historię w formacie wymaganym przez API
            const history = messages.map(m => ({
                role: m.role as 'user' | 'assistant',
                content: m.content,
            }));

            // Użyj API client - dokładnie tak jak AI Asystent
            const response = await ai.chat(messageToSend, history);

            const assistantMessage: Message = {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: response.message || 'Nie otrzymano odpowiedzi',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistantMessage]);

            if (!isOpen || isMinimized) {
                setUnreadCount(prev => prev + 1);
            }
        } catch (error) {
            console.error('AI Chat error:', error);

            let errorContent = 'Przepraszam, wystąpił błąd. Spróbuj ponownie później.';
            if (error instanceof Error) {
                errorContent = error.message;
            }

            const errorMessage: Message = {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: errorContent,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleClearHistory = async () => {
        try {
            await ai.clearHistory();
        } catch (error) {
            console.error('Failed to clear AI history:', error);
        }
        setMessages([]);
        localStorage.removeItem('global-ai-chat-messages');
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

    // Nie pokazuj chatu jeśli użytkownik nie jest zalogowany
    if (!session) {
        return null;
    }

    return (
        <>
            {/* Floating Button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={toggleOpen}
                        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14
                                   bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full shadow-lg
                                   shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/30 transition-shadow"
                    >
                        <Sparkles className="w-6 h-6 text-white" />

                        {unreadCount > 0 && (
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-1 -right-1 flex items-center justify-center
                                           w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full"
                            >
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </motion.span>
                        )}

                        <span className="absolute inset-0 rounded-full bg-cyan-500 animate-ping opacity-25" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            scale: 1,
                            height: isMinimized ? 'auto' : '500px'
                        }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed bottom-6 right-6 z-50 w-96 bg-white dark:bg-slate-900
                                   rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700
                                   overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3
                                        bg-gradient-to-r from-cyan-500 to-blue-600">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-8 h-8
                                                bg-white/20 rounded-full">
                                    <Bot className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold">Asystent AI</h3>
                                    <p className="text-white/70 text-xs">
                                        {isLoading ? 'Pisze...' : 'Online'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={handleClearHistory}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                    title="Wyczyść historię"
                                >
                                    <Trash2 className="w-4 h-4 text-white/70" />
                                </button>
                                <button
                                    onClick={toggleMinimize}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    {isMinimized ? (
                                        <Maximize2 className="w-4 h-4 text-white" />
                                    ) : (
                                        <Minimize2 className="w-4 h-4 text-white" />
                                    )}
                                </button>
                                <button
                                    onClick={toggleOpen}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <X className="w-4 h-4 text-white" />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <AnimatePresence>
                            {!isMinimized && (
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: 'auto' }}
                                    exit={{ height: 0 }}
                                    className="flex-1 overflow-hidden flex flex-col"
                                >
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: '320px' }}>
                                        {messages.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-full text-center py-8">
                                                <div className="w-16 h-16 bg-cyan-100 dark:bg-cyan-900/30
                                                                rounded-full flex items-center justify-center mb-4">
                                                    <MessageSquare className="w-8 h-8 text-cyan-600" />
                                                </div>
                                                <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-1">
                                                    Cześć{session.user?.name ? `, ${session.user.name.split(' ')[0]}` : ''}!
                                                </h4>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[250px]">
                                                    Jak mogę Ci dzisiaj pomóc?
                                                </p>
                                            </div>
                                        ) : (
                                            messages.map((message) => (
                                                <ChatBubble key={message.id} message={message} />
                                            ))
                                        )}

                                        {isLoading && (
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 bg-cyan-100 dark:bg-cyan-900/30
                                                                rounded-full flex items-center justify-center flex-shrink-0">
                                                    <Bot className="w-4 h-4 text-cyan-600" />
                                                </div>
                                                <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl
                                                                rounded-tl-none px-4 py-3">
                                                    <div className="flex items-center gap-1">
                                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                                                              style={{ animationDelay: '0ms' }} />
                                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                                                              style={{ animationDelay: '150ms' }} />
                                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                                                              style={{ animationDelay: '300ms' }} />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Quick Actions */}
                                    {messages.length === 0 && (
                                        <div className="px-4 pb-2">
                                            <div className="flex flex-wrap gap-2">
                                                {[
                                                    'Pomóż mi stworzyć ofertę',
                                                    'Podsumuj dzisiejsze zadania',
                                                    'Zaległe follow-upy'
                                                ].map((suggestion) => (
                                                    <button
                                                        key={suggestion}
                                                        onClick={() => setInput(suggestion)}
                                                        className="text-xs px-3 py-1.5 bg-slate-100 dark:bg-slate-800
                                                                   text-slate-700 dark:text-slate-300 rounded-full
                                                                   hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                                    >
                                                        {suggestion}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Input */}
                                    <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                                        <div className="flex items-end gap-2">
                                            <textarea
                                                ref={inputRef}
                                                value={input}
                                                onChange={(e) => setInput(e.target.value)}
                                                onKeyDown={handleKeyDown}
                                                placeholder="Napisz wiadomość..."
                                                rows={1}
                                                className="flex-1 resize-none rounded-xl border border-slate-200
                                                           dark:border-slate-700 bg-slate-50 dark:bg-slate-800
                                                           px-4 py-2.5 text-sm focus:outline-none focus:ring-2
                                                           focus:ring-cyan-500 dark:text-slate-100"
                                                style={{ maxHeight: '120px' }}
                                            />
                                            <Button
                                                onClick={handleSend}
                                                disabled={!input.trim() || isLoading}
                                                size="sm"
                                                className="rounded-xl h-10 w-10 p-0 flex items-center justify-center"
                                            >
                                                {isLoading ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Send className="w-4 h-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

function ChatBubble({ message }: { message: Message }) {
    const isUser = message.role === 'user';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
        >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                isUser
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600'
                    : 'bg-cyan-100 dark:bg-cyan-900/30'
            }`}>
                {isUser ? (
                    <User className="w-4 h-4 text-white" />
                ) : (
                    <Bot className="w-4 h-4 text-cyan-600" />
                )}
            </div>

            <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                isUser
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-tr-none'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none'
            }`}>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className={`text-xs mt-1 ${
                    isUser ? 'text-cyan-100' : 'text-slate-500 dark:text-slate-400'
                }`}>
                    {message.timestamp.toLocaleTimeString('pl-PL', {
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </p>
            </div>
        </motion.div>
    );
}
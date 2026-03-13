// src/app/dashboard/ai/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAI } from '@/hooks/useAI';
import { ChatMessage, QuickActions, SuggestionCard } from '@/components/ai';

export default function AIAssistantPage() {
    const {
        messages,
        isLoading,
        suggestions,
        stats,
        sendMessage,
        fetchSuggestions,
        clearMessages,
    } = useAI();

    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchSuggestions();
    }, [fetchSuggestions]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            sendMessage(input);
            setInput('');
        }
    };

    const handleQuickAction = (prompt: string) => {
        sendMessage(prompt);
    };

    const handleSuggestionClick = (suggestion: string) => {
        sendMessage(suggestion);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col lg:flex-row gap-4 lg:gap-6 p-4 sm:p-6 lg:p-8">
            <div className="flex-1 flex flex-col rounded-2xl border card-themed overflow-hidden">
                <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b divider-themed">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                            <span className="text-white text-lg">✨</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-themed">SmartQuote AI</h1>
                            <p className="text-xs text-themed-muted">Twój inteligentny asystent sprzedaży</p>
                        </div>
                    </div>
                    {messages.length > 0 && (
                        <button
                            onClick={clearMessages}
                            className="px-3 py-1.5 text-sm text-themed-muted hover:text-red-500 rounded-lg hover-themed transition-colors"
                        >
                            🗑️ Wyczyść
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6" style={{ backgroundColor: 'var(--section-bg)' }}>
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-6 shadow-xl shadow-cyan-500/20">
                                <span className="text-4xl">✨</span>
                            </div>
                            <h2 className="text-xl font-semibold text-themed mb-2">
                                Witaj w SmartQuote AI!
                            </h2>
                            <p className="text-themed-muted max-w-md mb-8">
                                Jestem Twoim inteligentnym asystentem. Mogę pomóc Ci tworzyć oferty,
                                analizować klientów, pisać emaile i wiele więcej.
                            </p>
                            <QuickActions onAction={handleQuickAction} />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {messages.map((message) => (
                                <ChatMessage
                                    key={message.id}
                                    message={message}
                                    onSuggestionClick={handleSuggestionClick}
                                />
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                <div className="px-4 sm:px-6 py-4 border-t divider-themed" style={{ backgroundColor: 'var(--card-bg)' }}>
                    <form onSubmit={handleSubmit} className="flex gap-3">
                        <div className="flex-1">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Napisz wiadomość... (Enter aby wysłać, Shift+Enter nowa linia)"
                                className="w-full px-4 py-3 rounded-xl border resize-none transition-colors"
                                rows={1}
                                disabled={isLoading}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="px-5 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/25"
                        >
                            {isLoading ? (
                                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            )}
                        </button>
                    </form>
                </div>
            </div>

            <div className="w-full lg:w-80 flex flex-col gap-4 lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto">
                {stats && (
                    <div className="rounded-2xl border p-4 card-themed">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-lg">📊</span>
                            <h3 className="font-semibold text-themed">Podsumowanie</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="text-center p-3 rounded-xl" style={{ backgroundColor: 'var(--section-bg)' }}>
                                <div className="text-2xl font-bold text-cyan-500">{stats.totalClients}</div>
                                <div className="text-xs text-themed-muted">Klienci</div>
                            </div>
                            <div className="text-center p-3 rounded-xl" style={{ backgroundColor: 'var(--section-bg)' }}>
                                <div className="text-2xl font-bold text-emerald-500">{stats.activeOffers}</div>
                                <div className="text-xs text-themed-muted">Aktywne oferty</div>
                            </div>
                            <div className="text-center p-3 rounded-xl" style={{ backgroundColor: 'var(--section-bg)' }}>
                                <div className="text-2xl font-bold text-amber-500">{stats.pendingFollowUps}</div>
                                <div className="text-xs text-themed-muted">Zaległe zadania</div>
                            </div>
                            <div className="text-center p-3 rounded-xl" style={{ backgroundColor: 'var(--section-bg)' }}>
                                <div className="text-xl font-bold text-violet-500">
                                    {(stats.monthlyRevenue / 1000).toFixed(0)}k
                                </div>
                                <div className="text-xs text-themed-muted">Przychód (mies.)</div>
                            </div>
                        </div>
                    </div>
                )}

                {suggestions.length > 0 && (
                    <div className="rounded-2xl border p-4 card-themed flex-1 overflow-y-auto">
                        <h3 className="font-semibold text-themed mb-4">Inteligentne sugestie</h3>
                        <div className="space-y-3">
                            {suggestions.map((suggestion, index) => (
                                <SuggestionCard
                                    key={index}
                                    suggestion={suggestion}
                                    onPrompt={handleQuickAction}
                                />
                            ))}
                        </div>
                    </div>
                )}

                <div className="rounded-2xl border p-4 card-themed">
                    <h3 className="font-semibold text-themed mb-3">Wskazówki</h3>
                    <ul className="text-xs text-themed-muted space-y-2.5">
                        <li className="flex items-start gap-2">
                            <span className="flex-shrink-0">💡</span>
                            <span>Opisz potrzebę klienta, a stworzę ofertę</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="flex-shrink-0">📧</span>
                            <span>Poproś o email — dobiorę ton i treść</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="flex-shrink-0">📊</span>
                            <span>Zapytaj o statystyki i analizy</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="flex-shrink-0">🎯</span>
                            <span>Poproś o sugestie follow-upów</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
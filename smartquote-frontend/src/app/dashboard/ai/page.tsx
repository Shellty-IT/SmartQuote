// SmartQuote-AI/src/app/dashboard/ai/page.tsx
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
        <div className="h-[calc(100vh-120px)] flex gap-6">
            {/* Panel główny - czat */}
            <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200">
                {/* Nagłówek */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                            <span className="text-white text-lg">✨</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-gray-900">SmartQuote AI</h1>
                            <p className="text-xs text-gray-500">Twój inteligentny asystent sprzedaży</p>
                        </div>
                    </div>
                    {messages.length > 0 && (
                        <button
                            onClick={clearMessages}
                            className="px-3 py-1.5 text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            🗑️ Wyczyść
                        </button>
                    )}
                </div>

                {/* Obszar wiadomości */}
                <div className="flex-1 overflow-y-auto p-6">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mb-6">
                                <span className="text-4xl">✨</span>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">
                                Witaj w SmartQuote AI!
                            </h2>
                            <p className="text-gray-500 max-w-md mb-8">
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

                {/* Input */}
                <div className="px-6 py-4 border-t border-gray-200">
                    <form onSubmit={handleSubmit} className="flex gap-3">
                        <div className="flex-1">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Napisz wiadomość... (Enter aby wysłać, Shift+Enter nowa linia)"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none transition-colors"
                                rows={1}
                                disabled={isLoading}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? '...' : '➤'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Panel boczny - sugestie i statystyki */}
            <div className="w-80 flex flex-col gap-4">
                {/* Statystyki */}
                {stats && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-lg">📊</span>
                            <h3 className="font-semibold text-gray-900">Podsumowanie</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold text-blue-600">{stats.totalClients}</div>
                                <div className="text-xs text-gray-500">Klienci</div>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold text-green-600">{stats.activeOffers}</div>
                                <div className="text-xs text-gray-500">Aktywne oferty</div>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold text-orange-600">{stats.pendingFollowUps}</div>
                                <div className="text-xs text-gray-500">Zaległe zadania</div>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <div className="text-xl font-bold text-purple-600">
                                    {(stats.monthlyRevenue / 1000).toFixed(0)}k
                                </div>
                                <div className="text-xs text-gray-500">Przychód (mies.)</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Sugestie */}
                {suggestions.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex-1 overflow-y-auto">
                        <h3 className="font-semibold text-gray-900 mb-4">Inteligentne sugestie</h3>
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

                {/* Wskazówki */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Wskazówki</h3>
                    <ul className="text-xs text-gray-500 space-y-2">
                        <li>💡 Opisz potrzebę klienta, a stworzę ofertę</li>
                        <li>📧 Poproś o email - dobiorę ton i treść</li>
                        <li>📊 Zapytaj o statystyki i analizy</li>
                        <li>🎯 Poproś o sugestie follow-upów</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
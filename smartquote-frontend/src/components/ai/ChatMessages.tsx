// src/components/ai/ChatMessages.tsx
import React from 'react';
import { useSession } from 'next-auth/react';
import { ChatBubble } from './ChatBubble';
import type { ChatMessage } from './hooks/useChatMessages';

interface ChatMessagesProps {
    messages: ChatMessage[];
    isLoading: boolean;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    onSuggestionClick: (suggestion: string) => void;
}

export function ChatMessages({
                                 messages,
                                 isLoading,
                                 messagesEndRef,
                                 onSuggestionClick,
                             }: ChatMessagesProps) {
    const { data: session } = useSession();

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: '320px' }}>
            {messages.length === 0 ? (
                <EmptyState userName={session?.user?.name} onSuggestionClick={onSuggestionClick} />
            ) : (
                <>
                    {messages.map((message) => (
                        <ChatBubble key={message.id} message={message} />
                    ))}
                    {isLoading && <TypingIndicator />}
                </>
            )}
            <div ref={messagesEndRef} />
        </div>
    );
}

function EmptyState({
                        userName,
                        onSuggestionClick,
                    }: {
    userName?: string | null;
    onSuggestionClick: (suggestion: string) => void;
}) {
    const suggestions = [
        'Pomóż mi stworzyć ofertę',
        'Podsumuj dzisiejsze zadania',
        'Zaległe follow-upy',
    ];

    return (
        <>
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <div className="w-16 h-16 bg-cyan-500/15 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                </div>
                <h4 className="font-medium text-themed mb-1">
                    Cześć{userName ? `, ${userName.split(' ')[0]}` : ''}!
                </h4>
                <p className="text-sm text-themed-muted max-w-[250px]">
                    Jak mogę Ci dzisiaj pomóc?
                </p>
            </div>

            <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                    <button
                        key={suggestion}
                        onClick={() => onSuggestionClick(suggestion)}
                        className="text-xs px-3 py-1.5 section-themed text-themed-muted rounded-full hover-themed transition-colors"
                    >
                        {suggestion}
                    </button>
                ))}
            </div>
        </>
    );
}

function TypingIndicator() {
    return (
        <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-cyan-500/15 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            </div>
            <div className="section-themed rounded-2xl rounded-tl-none px-4 py-3">
                <div className="flex items-center gap-1">
                    <span
                        className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce"
                        style={{ animationDelay: '0ms' }}
                    />
                    <span
                        className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce"
                        style={{ animationDelay: '150ms' }}
                    />
                    <span
                        className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce"
                        style={{ animationDelay: '300ms' }}
                    />
                </div>
            </div>
        </div>
    );
}
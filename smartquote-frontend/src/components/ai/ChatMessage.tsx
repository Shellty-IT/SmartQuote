// src/components/ai/ChatMessage.tsx
'use client';

import { useRouter } from 'next/navigation';
import type { AIMessage, AIAction } from '@/types/ai';

interface ChatMessageProps {
    message: AIMessage;
    onAction?: (action: AIAction) => void;
    onSuggestionClick?: (suggestion: string) => void;
}

export function ChatMessage({ message, onAction, onSuggestionClick }: ChatMessageProps) {
    const router = useRouter();
    const isUser = message.role === 'user';

    const handleAction = (action: AIAction) => {
        if (onAction) {
            onAction(action);
        } else {
            switch (action.type) {
                case 'view_client':
                    router.push(`/dashboard/clients/${action.payload.clientId}`);
                    break;
                case 'view_offer':
                    router.push(`/dashboard/offers/${action.payload.offerId}`);
                    break;
                case 'create_offer':
                    router.push('/dashboard/offers/new');
                    break;
                case 'create_followup':
                    router.push('/dashboard/followups/new');
                    break;
                case 'navigate':
                    router.push(action.payload.path as string);
                    break;
            }
        }
    };

    if (message.isLoading) {
        return (
            <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl px-4 py-3 section-themed">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    isUser
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                        : 'section-themed text-themed'
                }`}
            >
                {!isUser && (
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center">
                            <span className="text-white text-xs">AI</span>
                        </div>
                        <span className="text-xs text-themed-muted">SmartQuote AI</span>
                    </div>
                )}

                <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                    {message.content}
                </div>

                {message.actions && message.actions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {message.actions.map((action, index) => (
                            <button
                                key={index}
                                onClick={() => handleAction(action)}
                                className="px-3 py-1 text-xs font-medium rounded-full card-themed border
                                           hover:border-cyan-500 hover:text-cyan-600 transition-colors"
                            >
                                {action.label}
                            </button>
                        ))}
                    </div>
                )}

                {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-3 pt-3 border-t divider-themed">
                        <p className="text-xs text-themed-muted mb-2">Sugestie:</p>
                        <div className="flex flex-wrap gap-2">
                            {message.suggestions.map((suggestion, index) => (
                                <button
                                    key={index}
                                    onClick={() => onSuggestionClick?.(suggestion)}
                                    className="text-xs px-3 py-1 rounded-full card-themed border
                                               hover:border-cyan-500 hover:text-cyan-600 transition-colors"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className={`text-xs mt-2 ${isUser ? 'text-cyan-100' : 'text-themed-muted'}`}>
                    {new Date(message.timestamp).toLocaleTimeString('pl-PL', {
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                </div>
            </div>
        </div>
    );
}
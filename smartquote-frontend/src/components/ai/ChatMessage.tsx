// SmartQuote-AI/src/components/ai/ChatMessage.tsx
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
                <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-gray-100">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                }`}
            >
                {!isUser && (
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                            <span className="text-white text-xs">AI</span>
                        </div>
                        <span className="text-xs text-gray-500">SmartQuote AI</span>
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
                                className="px-3 py-1 text-xs font-medium rounded-full bg-white border border-gray-200 hover:border-blue-500 hover:text-blue-600 transition-colors"
                            >
                                {action.label}
                            </button>
                        ))}
                    </div>
                )}

                {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-2">Sugestie:</p>
                        <div className="flex flex-wrap gap-2">
                            {message.suggestions.map((suggestion, index) => (
                                <button
                                    key={index}
                                    onClick={() => onSuggestionClick?.(suggestion)}
                                    className="text-xs px-3 py-1 rounded-full bg-white border border-gray-200 hover:border-blue-500 hover:text-blue-600 transition-colors"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className={`text-xs mt-2 ${isUser ? 'text-blue-200' : 'text-gray-400'}`}>
                    {new Date(message.timestamp).toLocaleTimeString('pl-PL', {
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                </div>
            </div>
        </div>
    );
}
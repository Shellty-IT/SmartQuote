// src/components/ai/ChatBubble.tsx
import React from 'react';
import { motion } from 'framer-motion';
import type { ChatMessage } from './hooks/useChatMessages';

interface ChatBubbleProps {
    message: ChatMessage;
}

export function ChatBubble({ message }: ChatBubbleProps) {
    const isUser = message.role === 'user';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
        >
            <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isUser
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600'
                        : 'bg-cyan-500/15'
                }`}
            >
                {isUser ? (
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                ) : (
                    <svg className="w-4 h-4 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                )}
            </div>

            <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    isUser
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-tr-none'
                        : 'section-themed text-themed rounded-tl-none'
                }`}
            >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p
                    className={`text-xs mt-1 ${
                        isUser ? 'text-cyan-100' : 'text-themed-muted'
                    }`}
                >
                    {message.timestamp.toLocaleTimeString('pl-PL', {
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                </p>
            </div>
        </motion.div>
    );
}
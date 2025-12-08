// SmartQuote-AI/src/components/ai/SuggestionCard.tsx
'use client';

import { useRouter } from 'next/navigation';
import type { AISuggestion } from '@/types/ai';

interface SuggestionCardProps {
    suggestion: AISuggestion;
    onPrompt?: (prompt: string) => void;
}

const iconMap = {
    warning: '⚠️',
    info: 'ℹ️',
    tip: '💡',
    success: '✅',
};

const colorMap = {
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    tip: 'bg-purple-50 border-purple-200 text-purple-800',
    success: 'bg-green-50 border-green-200 text-green-800',
};

export function SuggestionCard({ suggestion, onPrompt }: SuggestionCardProps) {
    const router = useRouter();

    const handleClick = () => {
        if (suggestion.action) {
            if (suggestion.action.type === 'navigate' && suggestion.action.path) {
                router.push(suggestion.action.path);
            } else if (suggestion.action.type === 'ai_prompt' && suggestion.action.prompt) {
                onPrompt?.(suggestion.action.prompt);
            }
        }
    };

    return (
        <div
            onClick={handleClick}
            className={`p-4 rounded-xl border ${colorMap[suggestion.type]} cursor-pointer hover:shadow-md transition-shadow`}
        >
            <div className="flex items-start gap-3">
                <span className="text-lg">{iconMap[suggestion.type]}</span>
                <div className="flex-1">
                    <h4 className="font-medium text-sm">{suggestion.title}</h4>
                    <p className="text-xs mt-1 opacity-80">{suggestion.message}</p>
                </div>
            </div>
        </div>
    );
}
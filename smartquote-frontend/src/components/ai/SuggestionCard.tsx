// src/components/ai/SuggestionCard.tsx
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
    warning: 'bg-[oklch(0.72_0.16_60)/10%]0/10 text-[oklch(0.55_0.14_60)] dark:text-[oklch(0.78_0.14_60)] border',
    info: 'bg-primary/10 text-primary border',
    tip: 'bg-[oklch(0.7_0.16_300)/15%] text-[oklch(0.55_0.18_300)] dark:text-[oklch(0.78_0.14_300)] border border-purple-300/30',
    success: 'bg-status-accepted/10 text-status-accepted border',
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
            className={`p-4 rounded-xl ${colorMap[suggestion.type]} cursor-pointer hover:shadow-md transition-shadow`}
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
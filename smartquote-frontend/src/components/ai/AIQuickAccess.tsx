'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { useAIChat } from '@/contexts/AIChatContext';
import Button from '@/components/ui/Button';

interface AIQuickAccessProps {
    context?: string;
    prompt?: string;
    label?: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
}

export function AIQuickAccess({
                                  context,
                                  prompt,
                                  label = 'Zapytaj AI',
                                  variant = 'ghost',
                                  size = 'sm'
                              }: AIQuickAccessProps) {
    const { sendQuickMessage, openChat } = useAIChat();

    const handleClick = () => {
        if (prompt) {
            const fullPrompt = context
                ? `${prompt}\n\nKontekst: ${context}`
                : prompt;
            sendQuickMessage(fullPrompt);
        } else {
            openChat();
        }
    };

    return (
        <Button
            variant={variant}
            size={size}
            onClick={handleClick}
            className="gap-2"
        >
            <Sparkles className="w-4 h-4" />
            {label}
        </Button>
    );
}
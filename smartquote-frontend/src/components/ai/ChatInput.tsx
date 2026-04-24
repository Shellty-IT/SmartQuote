// src/components/ai/ChatInput.tsx
import React, { useRef, useEffect } from 'react';
import Button from '@/components/ui/Button';

interface ChatInputProps {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    isLoading: boolean;
    isVisible: boolean;
}

export function ChatInput({ value, onChange, onSend, isLoading, isVisible }: ChatInputProps) {
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isVisible) {
            inputRef.current?.focus();
        }
    }, [isVisible]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
    };

    return (
        <div className="p-4 border-t divider-themed">
            <div className="flex items-end gap-2">
                <textarea
                    ref={inputRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Napisz wiadomość..."
                    rows={1}
                    className="flex-1 resize-none rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 input-themed"
                    style={{ maxHeight: '120px' }}
                />
                <Button
                    onClick={onSend}
                    disabled={!value.trim() || isLoading}
                    size="sm"
                    className="rounded-xl h-10 w-10 p-0 flex items-center justify-center"
                >
                    {isLoading ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                        </svg>
                    )}
                </Button>
            </div>
        </div>
    );
}
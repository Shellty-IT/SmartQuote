// SmartQuote-AI/src/components/publicOffer/CommentSection.tsx

'use client';

import { useState } from 'react';
import type { OfferComment } from '@/types';

interface CommentSectionProps {
    comments: OfferComment[];
    onAddComment: (content: string) => Promise<void>;
    disabled: boolean;
    isSending: boolean;
}

function formatCommentDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Przed chwilą';
    if (diffMins < 60) return `${diffMins} min temu`;
    if (diffHours < 24) return `${diffHours} godz. temu`;
    if (diffDays < 7) return `${diffDays} dni temu`;

    return date.toLocaleDateString('pl-PL', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function CommentSection({
                                           comments,
                                           onAddComment,
                                           disabled,
                                           isSending,
                                       }: CommentSectionProps) {
    const [newComment, setNewComment] = useState('');

    const handleSubmit = async () => {
        const trimmed = newComment.trim();
        if (!trimmed || isSending || disabled) return;

        await onAddComment(trimmed);
        setNewComment('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h3 className="text-lg font-semibold text-slate-900">
                    Pytania i komentarze
                </h3>
                {comments.length > 0 && (
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                        {comments.length}
                    </span>
                )}
            </div>

            {comments.length > 0 && (
                <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
                    {comments.map((comment) => (
                        <div
                            key={comment.id}
                            className={`flex gap-3 ${
                                comment.author === 'CLIENT' ? 'justify-end' : 'justify-start'
                            }`}
                        >
                            <div
                                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                                    comment.author === 'CLIENT'
                                        ? 'bg-cyan-500 text-white rounded-br-sm'
                                        : 'bg-slate-100 text-slate-900 rounded-bl-sm'
                                }`}
                            >
                                <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                                <div
                                    className={`flex items-center gap-2 mt-1 ${
                                        comment.author === 'CLIENT' ? 'justify-end' : 'justify-start'
                                    }`}
                                >
                                    <span
                                        className={`text-xs ${
                                            comment.author === 'CLIENT'
                                                ? 'text-cyan-100'
                                                : 'text-slate-400'
                                        }`}
                                    >
                                        {comment.author === 'CLIENT' ? 'Ty' : 'Sprzedawca'}
                                    </span>
                                    <span
                                        className={`text-xs ${
                                            comment.author === 'CLIENT'
                                                ? 'text-cyan-200'
                                                : 'text-slate-300'
                                        }`}
                                    >
                                        •
                                    </span>
                                    <span
                                        className={`text-xs ${
                                            comment.author === 'CLIENT'
                                                ? 'text-cyan-200'
                                                : 'text-slate-400'
                                        }`}
                                    >
                                        {formatCommentDate(comment.createdAt)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!disabled ? (
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isSending}
                            placeholder="Napisz pytanie lub komentarz..."
                            rows={2}
                            maxLength={2000}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none disabled:opacity-50 text-sm"
                        />
                        <p className="absolute bottom-2 right-3 text-xs text-slate-300">
                            {newComment.length}/2000
                        </p>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={!newComment.trim() || isSending || disabled}
                        className="self-end px-4 py-3 rounded-xl bg-cyan-500 text-white hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    >
                        {isSending ? (
                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        )}
                    </button>
                </div>
            ) : (
                <div className="text-center py-4 bg-slate-50 rounded-xl">
                    <p className="text-sm text-slate-500">
                        Komentarze są zamknięte — oferta została już rozpatrzona.
                    </p>
                </div>
            )}
        </div>
    );
}
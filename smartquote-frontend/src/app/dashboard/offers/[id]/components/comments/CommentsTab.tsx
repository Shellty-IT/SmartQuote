// src/app/dashboard/offers/[id]/components/comments/CommentsTab.tsx
'use client';

import type { ClosingStrategy } from '@/types/ai';
import { useTranslations } from '@/i18n';
import { CommentsList } from './CommentsList';
import { CloserStrategy } from './CloserStrategy';
import { CommentInput } from './CommentInput';

interface Comment {
    id: string;
    content: string;
    author: 'SELLER' | 'CLIENT';
    createdAt: string;
}

interface CommentsTabProps {
    comments: Comment[];
    newComment: string;
    isSending: boolean;
    closingStrategy: ClosingStrategy | null;
    isLoadingCloser: boolean;
    closerError: string | null;
    expandedStrategy: string | null;
    onCommentChange: (value: string) => void;
    onSubmitComment: () => void;
    onLoadCloser: () => void;
    onExpandStrategy: (strategy: string | null) => void;
    onUseStrategy: (text: string) => void;
}

export function CommentsTab({
                                comments,
                                newComment,
                                isSending,
                                closingStrategy,
                                isLoadingCloser,
                                closerError,
                                expandedStrategy,
                                onCommentChange,
                                onSubmitComment,
                                onLoadCloser,
                                onExpandStrategy,
                                onUseStrategy,
                            }: CommentsTabProps) {
    const tr = useTranslations('offerDetail');
    return (
        <div className="max-w-2xl space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                    {tr.comments.title} ({comments.length})
                </h2>

                <CommentsList comments={comments} />

                <CloserStrategy
                    closingStrategy={closingStrategy}
                    isLoading={isLoadingCloser}
                    error={closerError}
                    expandedStrategy={expandedStrategy}
                    onLoadCloser={onLoadCloser}
                    onExpandStrategy={onExpandStrategy}
                    onUseStrategy={onUseStrategy}
                />

                <CommentInput
                    value={newComment}
                    onChange={onCommentChange}
                    onSubmit={onSubmitComment}
                    isSending={isSending}
                />
            </div>
        </div>
    );
}
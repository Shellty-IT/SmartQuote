// src/app/dashboard/offers/[id]/components/comments/CommentsTab.tsx
'use client';

import { Card } from '@/components/ui';
import type { ClosingStrategy } from '@/types/ai';
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
    return (
        <div className="max-w-2xl space-y-6">
            <Card>
                <h2 className="text-lg font-semibold text-themed mb-4">
                    Komentarze ({comments.length})
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
            </Card>
        </div>
    );
}
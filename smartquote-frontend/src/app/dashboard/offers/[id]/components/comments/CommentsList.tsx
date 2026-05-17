// src/app/dashboard/offers/[id]/components/comments/CommentsList.tsx
'use client';

import { formatDateTime } from '@/lib/utils';

interface Comment {
    id: string;
    content: string;
    author: 'SELLER' | 'CLIENT';
    createdAt: string;
}

interface CommentsListProps {
    comments: Comment[];
}

export function CommentsList({ comments }: CommentsListProps) {
    if (comments.length === 0) {
        return (
            <div className="text-center py-8 mb-6">
                <svg className="w-12 h-12 mx-auto text-themed-muted opacity-40 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-themed-muted">Brak komentarzy</p>
            </div>
        );
    }

    return (
        <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
            {comments.map((comment) => (
                <div
                    key={comment.id}
                    className={`flex gap-3 ${comment.author === 'SELLER' ? 'justify-end' : 'justify-start'}`}
                >
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        comment.author === 'SELLER'
                            ? 'bg-cyan-500 text-white rounded-br-sm'
                            : 'section-themed text-themed rounded-bl-sm'
                    }`}>
                        <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                        <div className={`flex items-center gap-2 mt-1 ${comment.author === 'SELLER' ? 'justify-end' : 'justify-start'}`}>
              <span className={`text-xs ${comment.author === 'SELLER' ? 'text-cyan-100' : 'text-themed-muted'}`}>
                {comment.author === 'SELLER' ? 'Ty' : 'Klient'}
              </span>
                            <span className={`text-xs ${comment.author === 'SELLER' ? 'text-cyan-200' : 'text-themed-muted opacity-50'}`}>•</span>
                            <span className={`text-xs ${comment.author === 'SELLER' ? 'text-cyan-200' : 'text-themed-muted'}`}>
                {formatDateTime(comment.createdAt)}
              </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
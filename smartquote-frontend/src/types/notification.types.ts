// src/types/notification.types.ts

export type NotificationType =
    | 'OFFER_VIEWED'
    | 'OFFER_ACCEPTED'
    | 'OFFER_REJECTED'
    | 'OFFER_COMMENT'
    | 'AI_INSIGHT'
    | 'FOLLOW_UP_REMINDER'
    | 'CONTRACT_SIGNED'
    | 'SYSTEM';

export interface Notification {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    isRead: boolean;
    link: string | null;
    metadata: Record<string, unknown> | null;
    createdAt: string;
}
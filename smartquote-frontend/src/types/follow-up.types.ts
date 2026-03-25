// src/types/follow-up.types.ts

export type FollowUpType = 'CALL' | 'EMAIL' | 'MEETING' | 'TASK' | 'REMINDER' | 'OTHER';
export type FollowUpStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface FollowUp {
    id: string;
    title: string;
    description: string | null;
    type: FollowUpType;
    status: FollowUpStatus;
    priority: Priority;
    dueDate: string;
    completedAt: string | null;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
    userId: string;
    clientId: string | null;
    offerId: string | null;
    contractId: string | null;
    client: {
        id: string;
        name: string;
        email: string | null;
        company: string | null;
    } | null;
    offer: {
        id: string;
        number: string;
        title: string;
        status: string;
    } | null;
    contract: {
        id: string;
        number: string;
        title: string;
        status: string;
    } | null;
}

export interface FollowUpStats {
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
    overdue: number;
    todayDue: number;
    thisWeekDue: number;
    completedThisMonth: number;
    completionRate: number;
}

export interface CreateFollowUpData {
    title: string;
    description?: string;
    type: FollowUpType;
    priority?: Priority;
    dueDate: string;
    notes?: string;
    clientId?: string;
    offerId?: string;
    contractId?: string;
}

export interface UpdateFollowUpData {
    title?: string;
    description?: string;
    type?: FollowUpType;
    status?: FollowUpStatus;
    priority?: Priority;
    dueDate?: string;
    notes?: string;
    clientId?: string | null;
    offerId?: string | null;
    contractId?: string | null;
}
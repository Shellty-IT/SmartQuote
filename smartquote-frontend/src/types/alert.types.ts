export type AlertType = 'overdue_followup' | 'expiring_offer' | 'stale_draft' | 'new_lead' | 'unsigned_contract';
export type AlertPriority = 'high' | 'medium' | 'low';

export interface Alert {
    id: string;
    type: AlertType;
    priority: AlertPriority;
    title: string;
    message: string;
    count?: number;
    action: { label: string; path: string };
    createdAt: string;
}

export interface AlertsResponse {
    alerts: Alert[];
    total: number;
}

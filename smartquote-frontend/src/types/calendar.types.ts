export type CalendarEventColor = 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'pink' | 'teal';

export interface CalendarEvent {
    id: string;
    title: string;
    description: string | null;
    startAt: string;
    endAt: string | null;
    allDay: boolean;
    color: CalendarEventColor;
    clientId: string | null;
    client: { id: string; name: string } | null;
    offerId: string | null;
    offer: { id: string; title: string; number: string } | null;
    leadId: string | null;
    lead: { id: string; name: string; company: string | null } | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateCalendarEventInput {
    title: string;
    description?: string | null;
    startAt: string;
    endAt?: string | null;
    allDay?: boolean;
    color?: CalendarEventColor;
    clientId?: string | null;
    offerId?: string | null;
    leadId?: string | null;
}

export interface UpdateCalendarEventInput extends Partial<CreateCalendarEventInput> {}

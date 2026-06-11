export interface Note {
    id: string;
    content: string;
    clientId: string | null;
    offerId: string | null;
    contractId: string | null;
    leadId: string | null;
    user: { name: string | null; email: string };
    createdAt: string;
    updatedAt: string;
}

export interface CreateNoteInput {
    content: string;
    clientId?: string | null;
    offerId?: string | null;
    contractId?: string | null;
    leadId?: string | null;
}

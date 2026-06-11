export type LeadStatus = 'NEW' | 'CONTACTED' | 'CONVERTED' | 'LOST';

export interface Lead {
    id: string;
    name: string;
    company: string | null;
    email: string | null;
    phone: string | null;
    source: string | null;
    notes: string | null;
    status: LeadStatus;
    clientId: string | null;
    client: { id: string; name: string; email: string | null } | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateLeadInput { name: string; company?: string | null; email?: string | null; phone?: string | null; source?: string | null; notes?: string | null; }
export interface UpdateLeadInput extends Partial<CreateLeadInput> { status?: LeadStatus; }
export interface ConvertLeadInput { name?: string; email?: string | null; phone?: string | null; company?: string | null; nip?: string | null; }

export interface LeadsStats { total: number; byStatus: Record<LeadStatus, number>; }

export interface PaginatedLeads { leads: Lead[]; total: number; page: number; limit: number; }

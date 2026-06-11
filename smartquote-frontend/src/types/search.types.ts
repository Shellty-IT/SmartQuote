export interface SearchResultClient { id: string; name: string; email: string | null; company: string | null; type: string; }
export interface SearchResultOffer { id: string; number: string; title: string; status: string; totalGross: number; currency: string; clientName: string; }
export interface SearchResultContract { id: string; number: string; title: string; status: string; clientName: string; }
export interface SearchResultLead { id: string; name: string; company: string | null; email: string | null; status: string; }
export interface SearchResults { clients: SearchResultClient[]; offers: SearchResultOffer[]; contracts: SearchResultContract[]; leads: SearchResultLead[]; }

// SmartQuote-AI/src/types/ai.ts
export interface AIMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    suggestions?: string[];
    actions?: AIAction[];
    isLoading?: boolean;
}

export interface AIAction {
    type: 'create_offer' | 'create_followup' | 'send_email' | 'view_client' | 'view_offer' | 'navigate';
    label: string;
    payload: Record<string, unknown>;
}

export interface AISuggestion {
    type: 'warning' | 'info' | 'tip' | 'success';
    title: string;
    message: string;
    action?: {
        type: 'navigate' | 'ai_prompt';
        path?: string;
        prompt?: string;
    };
}

export interface AIStats {
    totalClients: number;
    activeOffers: number;
    pendingFollowUps: number;
    monthlyRevenue: number;
}

export interface GeneratedOffer {
    title: string;
    items: {
        name: string;
        description?: string;
        quantity: number;
        unit: string;
        unitPrice: number;
        vatRate: number;
    }[];
    notes?: string;
    validDays: number;
}

export interface ClientAnalysis {
    score: number;
    potential: 'wysoki' | 'średni' | 'niski';
    summary: string;
    recommendations: string[];
    nextAction: string;
    risks: string[];
}

// Typy dla API responses
export interface ChatData {
    message: string;
    suggestions?: string[];
    actions?: AIAction[];
}

export interface SuggestionsData {
    suggestions: AISuggestion[];
    stats: AIStats;
}
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

export interface ChatData {
    message: string;
    suggestions?: string[];
    actions?: AIAction[];
}

export interface SuggestionsData {
    suggestions: AISuggestion[];
    stats: AIStats;
}

export interface PriceInsightHistoricalItem {
    name: string;
    unitPrice: number;
    quantity: number;
    unit: string;
    offerTitle: string;
    offerStatus: string;
    clientName: string;
    date: string;
}

export interface PriceInsightResult {
    historicalData: {
        avgPrice: number;
        minPrice: number;
        maxPrice: number;
        count: number;
        items: PriceInsightHistoricalItem[];
    };
    aiSuggestion: {
        suggestedMin: number;
        suggestedMax: number;
        marketAnalysis: string;
        marginWarning: string | null;
        confidence: 'low' | 'medium' | 'high';
    };
}

export interface ObserverInsight {
    summary: string;
    keyFindings: string[];
    clientIntent: 'likely_accept' | 'undecided' | 'likely_reject' | 'unknown';
    interestAreas: string[];
    concerns: string[];
    engagementScore: number;
    timeAnalysis: {
        totalViews: number;
        avgViewDuration: number | null;
        mostActiveTime: string | null;
    };
}

export interface ClosingStrategyVariant {
    title: string;
    description: string;
    suggestedResponse: string;
}

export interface ClosingStrategy {
    aggressive: ClosingStrategyVariant & {
        riskLevel: 'low' | 'medium' | 'high';
    };
    partnership: ClosingStrategyVariant & {
        proposedConcessions: string[];
    };
    quickClose: ClosingStrategyVariant & {
        maxDiscountPercent: number;
    };
    contextSummary: string;
}

export interface PostMortemInsight {
    outcome: string;
    summary: string;
    keyLessons: string[];
    pricingInsight: string;
    improvementSuggestions: string[];
    industryNote: string | null;
}
// SmartQuote-AI/src/lib/api.ts

import { getSession } from 'next-auth/react';
import type {
    ApiResponse,
    Client,
    CreateClientInput,
    UpdateClientInput,
    ClientsStats,
    Offer,
    CreateOfferInput,
    UpdateOfferInput,
    OffersStats,
    Contract,
    CreateContractInput,
    ContractsStats,
    FollowUp,
    CreateFollowUpData,
    UpdateFollowUpData,
    FollowUpStats,
    User,
    AllSettings,
    UserProfile,
    UserSettings,
    CompanyInfo,
    ApiKey,
    UpdateProfileInput,
    ChangePasswordInput,
    UpdateSettingsInput,
    UpdateCompanyInfoInput,
    CreateApiKeyInput
} from '@/types';
import type {
    ChatData,
    SuggestionsData,
    GeneratedOffer,
    ClientAnalysis
} from '@/types/ai';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

interface FetchOptions extends RequestInit {
    params?: Record<string, string | number | boolean | undefined>;
}

interface SessionWithToken {
    accessToken?: string;
}

class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    private async getAuthHeaders(): Promise<HeadersInit> {
        const session = await getSession() as SessionWithToken | null;
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        if (session?.accessToken) {
            headers['Authorization'] = `Bearer ${session.accessToken}`;
        }

        return headers;
    }

    private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
        const url = new URL(`${this.baseUrl}${endpoint}`);

        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    url.searchParams.append(key, String(value));
                }
            });
        }

        return url.toString();
    }

    async request<T>(endpoint: string, options: FetchOptions = {}): Promise<ApiResponse<T>> {
        const { params, ...fetchOptions } = options;
        const url = this.buildUrl(endpoint, params);
        const headers = await this.getAuthHeaders();

        try {
            const response = await fetch(url, {
                ...fetchOptions,
                headers: {
                    ...headers,
                    ...fetchOptions.headers,
                },
            });

            const data: ApiResponse<T> = await response.json();

            if (!response.ok) {
                throw new ApiError(
                    data.error?.message || 'Wystąpił błąd',
                    data.error?.code || 'UNKNOWN_ERROR',
                    response.status,
                    data.error?.details
                );
            }

            return data;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(
                'Błąd połączenia z serwerem',
                'NETWORK_ERROR',
                0
            );
        }
    }

    async get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { method: 'GET', params });
    }

    async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async patch<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }

    async downloadBlob(endpoint: string): Promise<Blob> {
        const session = await getSession() as SessionWithToken | null;
        const headers: HeadersInit = {};

        if (session?.accessToken) {
            headers['Authorization'] = `Bearer ${session.accessToken}`;
        }

        const url = `${this.baseUrl}${endpoint}`;
        const response = await fetch(url, { headers });

        if (!response.ok) {
            throw new ApiError('Nie udało się pobrać pliku', 'DOWNLOAD_ERROR', response.status);
        }

        return response.blob();
    }
}

export class ApiError extends Error {
    constructor(
        message: string,
        public code: string,
        public status: number,
        public details?: unknown
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

export const api = new ApiClient(`${API_URL}/api`);

// ============================================
// API Endpoints
// ============================================

// Auth
export const authApi = {
    login: (email: string, password: string) =>
        api.post<{ user: User; token: string }>('/auth/login', { email, password }),
    register: (data: { email: string; password: string; name?: string }) =>
        api.post<{ user: User; token: string }>('/auth/register', data),
    me: () =>
        api.get<User>('/auth/me'),
};

// Clients
export const clientsApi = {
    list: (params?: Record<string, string | number | boolean | undefined>) =>
        api.get<Client[]>('/clients', params),
    get: (id: string) =>
        api.get<Client>(`/clients/${id}`),
    create: (data: CreateClientInput) =>
        api.post<Client>('/clients', data),
    update: (id: string, data: UpdateClientInput) =>
        api.put<Client>(`/clients/${id}`, data),
    delete: (id: string) =>
        api.delete<{ message: string }>(`/clients/${id}`),
    stats: () =>
        api.get<ClientsStats>('/clients/stats'),
};

// Offers
export const offersApi = {
    list: (params?: Record<string, string | number | boolean | undefined>) =>
        api.get<Offer[]>('/offers', params),
    get: (id: string) =>
        api.get<Offer>(`/offers/${id}`),
    create: (data: CreateOfferInput) =>
        api.post<Offer>('/offers', data),
    update: (id: string, data: UpdateOfferInput) =>
        api.put<Offer>(`/offers/${id}`, data),
    delete: (id: string) =>
        api.delete<{ message: string }>(`/offers/${id}`),
    duplicate: (id: string) =>
        api.post<Offer>(`/offers/${id}/duplicate`),
    stats: () =>
        api.get<OffersStats>('/offers/stats'),
    downloadPdf: (id: string) =>
        api.downloadBlob(`/offers/${id}/pdf`),
};

// Contracts
export const contractsApi = {
    list: (params?: Record<string, string | number | boolean | undefined>) =>
        api.get<Contract[]>('/contracts', params),
    get: (id: string) =>
        api.get<Contract>(`/contracts/${id}`),
    create: (data: CreateContractInput) =>
        api.post<Contract>('/contracts', data),
    update: (id: string, data: Partial<CreateContractInput>) =>
        api.put<Contract>(`/contracts/${id}`, data),
    delete: (id: string) =>
        api.delete<{ message: string }>(`/contracts/${id}`),
    createFromOffer: (offerId: string) =>
        api.post<Contract>(`/contracts/from-offer/${offerId}`),
    updateStatus: (id: string, status: string) =>
        api.put<Contract>(`/contracts/${id}/status`, { status }),
    stats: () =>
        api.get<ContractsStats>('/contracts/stats'),
    downloadPdf: (id: string) =>
        api.downloadBlob(`/contracts/${id}/pdf`),
};

// Follow-ups
export const followUpsApi = {
    list: (params?: Record<string, string | number | boolean | undefined>) =>
        api.get<FollowUp[]>('/followups', params),
    get: (id: string) =>
        api.get<FollowUp>(`/followups/${id}`),
    create: (data: CreateFollowUpData) =>
        api.post<FollowUp>('/followups', data),
    update: (id: string, data: UpdateFollowUpData) =>
        api.put<FollowUp>(`/followups/${id}`, data),
    delete: (id: string) =>
        api.delete<{ message: string }>(`/followups/${id}`),
    complete: (id: string) =>
        api.patch<FollowUp>(`/followups/${id}/complete`, {}),
    stats: () =>
        api.get<FollowUpStats>('/followups/stats'),
    upcoming: (params?: Record<string, string | number | boolean | undefined>) =>
        api.get<FollowUp[]>('/followups/upcoming', params),
    overdue: () =>
        api.get<FollowUp[]>('/followups/overdue'),
};

// ============ AI ============
export const ai = {
    chat: async (message: string, history: Array<{ role: 'user' | 'assistant'; content: string }> = []): Promise<ChatData> => {
        const response = await api.post<ChatData>('/ai/chat', { message, history });
        return response.data as ChatData;
    },

    generateOffer: async (description: string, clientId?: string): Promise<GeneratedOffer> => {
        const response = await api.post<GeneratedOffer>('/ai/generate-offer', { description, clientId });
        return response.data as GeneratedOffer;
    },

    generateEmail: async (
        type: 'offer_send' | 'followup' | 'thank_you' | 'reminder',
        clientName: string,
        offerTitle?: string,
        customContext?: string
    ): Promise<{ email: string }> => {
        const response = await api.post<{ email: string }>('/ai/generate-email', {
            type,
            clientName,
            offerTitle,
            customContext,
        });
        return response.data as { email: string };
    },

    analyzeClient: async (clientId: string): Promise<ClientAnalysis> => {
        const response = await api.get<ClientAnalysis>(`/ai/analyze-client/${clientId}`);
        return response.data as ClientAnalysis;
    },

    getSuggestions: async (): Promise<SuggestionsData> => {
        const response = await api.get<SuggestionsData>('/ai/suggestions');
        return response.data as SuggestionsData;
    },

    clearHistory: async (): Promise<{ message: string }> => {
        const response = await api.delete<{ message: string }>('/ai/history');
        return response.data as { message: string };
    },
};

// ============ Settings ============
export const settingsApi = {
    // Pobierz wszystkie ustawienia naraz
    getAll: async (): Promise<AllSettings> => {
        const response = await api.get<AllSettings>('/settings');
        return response.data as AllSettings;
    },

    // Profile
    getProfile: async (): Promise<UserProfile> => {
        const response = await api.get<UserProfile>('/settings/profile');
        return response.data as UserProfile;
    },

    updateProfile: async (data: UpdateProfileInput): Promise<UserProfile> => {
        const response = await api.put<UserProfile>('/settings/profile', data);
        return response.data as UserProfile;
    },

    // Password
    changePassword: async (data: ChangePasswordInput): Promise<{ message: string }> => {
        const response = await api.put<{ message: string }>('/settings/password', data);
        return response.data as { message: string };
    },

    // Preferences
    getPreferences: async (): Promise<UserSettings> => {
        const response = await api.get<UserSettings>('/settings/preferences');
        return response.data as UserSettings;
    },

    updatePreferences: async (data: UpdateSettingsInput): Promise<UserSettings> => {
        const response = await api.put<UserSettings>('/settings/preferences', data);
        return response.data as UserSettings;
    },

    // Company
    getCompany: async (): Promise<CompanyInfo> => {
        const response = await api.get<CompanyInfo>('/settings/company');
        return response.data as CompanyInfo;
    },

    updateCompany: async (data: UpdateCompanyInfoInput): Promise<CompanyInfo> => {
        const response = await api.put<CompanyInfo>('/settings/company', data);
        return response.data as CompanyInfo;
    },

    // API Keys
    getApiKeys: async (): Promise<ApiKey[]> => {
        const response = await api.get<ApiKey[]>('/settings/api-keys');
        return response.data as ApiKey[];
    },

    createApiKey: async (data: CreateApiKeyInput): Promise<ApiKey & { key: string }> => {
        const response = await api.post<ApiKey & { key: string }>('/settings/api-keys', data);
        return response.data as ApiKey & { key: string };
    },

    toggleApiKey: async (id: string): Promise<ApiKey> => {
        const response = await api.patch<ApiKey>(`/settings/api-keys/${id}/toggle`);
        return response.data as ApiKey;
    },

    deleteApiKey: async (id: string): Promise<{ message: string }> => {
        const response = await api.delete<{ message: string }>(`/settings/api-keys/${id}`);
        return response.data as { message: string };
    },
};
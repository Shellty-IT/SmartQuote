// src/lib/api.ts

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
    PublishOfferResult,
    SendToClientResult,
    OfferAnalytics,
    OfferComment,
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
    CreateApiKeyInput,
    SmtpConfigData,
    UpdateSmtpConfigInput,
    TestSmtpConnectionInput,
    TestSmtpConnectionResult,
    PublicOfferData,
    PublicOfferAcceptPayload,
    PublicOfferRejectPayload,
    Notification,
} from '@/types';
import type {
    ChatData,
    SuggestionsData,
    GeneratedOffer,
    ClientAnalysis,
    PriceInsightResult,
    ObserverInsight,
    ClosingStrategy,
    LatestInsightItem,
    InsightsListItem,
} from '@/types/ai';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

interface FetchOptions extends RequestInit {
    params?: Record<string, string | number | boolean | undefined>;
}

interface SessionWithToken {
    readonly accessToken?: string;
}

class ApiClient {
    private readonly baseUrl: string;

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
    }

    async requestPublic<T>(endpoint: string, options: FetchOptions = {}): Promise<ApiResponse<T>> {
        const { params, ...fetchOptions } = options;
        const url = this.buildUrl(endpoint, params);

        const response = await fetch(url, {
            ...fetchOptions,
            headers: {
                'Content-Type': 'application/json',
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

    async uploadFile<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
        const session = await getSession() as SessionWithToken | null;
        const headers: HeadersInit = {};

        if (session?.accessToken) {
            headers['Authorization'] = `Bearer ${session.accessToken}`;
        }

        const url = `${this.baseUrl}${endpoint}`;

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: formData,
        });

        const data: ApiResponse<T> = await response.json();

        if (!response.ok) {
            throw new ApiError(
                data.error?.message || 'Wystąpił błąd',
                data.error?.code || 'UPLOAD_ERROR',
                response.status,
                data.error?.details
            );
        }

        return data;
    }

    async getPublic<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<ApiResponse<T>> {
        return this.requestPublic<T>(endpoint, { method: 'GET', params });
    }

    async postPublic<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
        return this.requestPublic<T>(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async patchPublic<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
        return this.requestPublic<T>(endpoint, {
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined,
        });
    }
}

export class ApiError extends Error {
    readonly code: string;
    readonly status: number;
    readonly details?: unknown;

    constructor(
        message: string,
        code: string,
        status: number,
        details?: unknown
    ) {
        super(message);
        this.name = 'ApiError';
        this.code = code;
        this.status = status;
        this.details = details;
    }
}

export const api = new ApiClient(`${API_URL}/api`);

export async function checkBackendHealth(): Promise<boolean> {
    try {
        const response = await fetch(`${API_URL}/api/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(30000),
        });
        return response.ok;
    } catch {
        return false;
    }
}

export const authApi = {
    login: (email: string, password: string) =>
        api.post<{ user: User; token: string }>('/auth/login', { email, password }),
    register: (data: { email: string; password: string; name?: string }) =>
        api.post<{ user: User; token: string }>('/auth/register', data),
    me: () =>
        api.get<User>('/auth/me'),
};

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
    publish: (id: string) =>
        api.post<PublishOfferResult>(`/offers/${id}/publish`),
    unpublish: (id: string) =>
        api.delete<{ unpublished: boolean }>(`/offers/${id}/publish`),
    analytics: (id: string) =>
        api.get<OfferAnalytics>(`/offers/${id}/analytics`),
    getComments: (id: string) =>
        api.get<OfferComment[]>(`/offers/${id}/comments`),
    addComment: (id: string, content: string) =>
        api.post<OfferComment>(`/offers/${id}/comments`, { content }),
    sendToClient: (id: string) =>
        api.post<SendToClientResult>(`/offers/${id}/send-to-client`),
};

export const publicOffersApi = {
    get: (token: string) =>
        api.getPublic<PublicOfferData>(`/public/offers/${token}`),
    registerView: (token: string) =>
        api.postPublic<{ registered: boolean }>(`/public/offers/${token}/view`),
    accept: (token: string, payload: PublicOfferAcceptPayload) =>
        api.postPublic<{ accepted: boolean }>(`/public/offers/${token}/accept`, payload),
    reject: (token: string, payload: PublicOfferRejectPayload) =>
        api.postPublic<{ rejected: boolean }>(`/public/offers/${token}/reject`, payload),
    addComment: (token: string, content: string) =>
        api.postPublic<OfferComment>(`/public/offers/${token}/comment`, { content }),
    trackSelection: (
        token: string,
        items: Array<{ id: string; isSelected: boolean; quantity: number }>,
        selectedVariant?: string
    ) =>
        api.patchPublic<{ tracked: boolean }>(`/public/offers/${token}/selection`, { items, selectedVariant }),
};

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
    publish: (id: string) =>
        api.post<{ publicToken: string; publicUrl: string; alreadyPublished: boolean }>(`/contracts/${id}/publish`),
    unpublish: (id: string) =>
        api.delete<{ unpublished: boolean }>(`/contracts/${id}/publish`),
};

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

export const notificationsApi = {
    list: (params?: Record<string, string | number | boolean | undefined>) =>
        api.get<Notification[]>('/notifications', params),
    unreadCount: () =>
        api.get<{ count: number }>('/notifications/unread-count'),
    markAsRead: (id: string) =>
        api.patch<{ marked: boolean }>(`/notifications/${id}/read`),
    markAllAsRead: () =>
        api.patch<{ marked: boolean }>('/notifications/read-all'),
    delete: (id: string) =>
        api.delete<{ deleted: boolean }>(`/notifications/${id}`),
};

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

    priceInsight: async (itemName: string, category?: string): Promise<PriceInsightResult> => {
        const response = await api.post<PriceInsightResult>('/ai/price-insight', { itemName, category });
        return response.data as PriceInsightResult;
    },

    observerInsight: async (offerId: string): Promise<ObserverInsight> => {
        const response = await api.get<ObserverInsight>(`/ai/observer/${offerId}`);
        return response.data as ObserverInsight;
    },

    closingStrategy: async (offerId: string): Promise<ClosingStrategy> => {
        const response = await api.get<ClosingStrategy>(`/ai/closing-strategy/${offerId}`);
        return response.data as ClosingStrategy;
    },

    latestInsights: async (limit?: number): Promise<LatestInsightItem[]> => {
        const params = limit ? { limit: String(limit) } : undefined;
        const response = await api.get<LatestInsightItem[]>('/ai/latest-insights', params);
        return response.data as LatestInsightItem[];
    },

    insightsList: async (params?: Record<string, string | number | boolean | undefined>): Promise<{ data: InsightsListItem[]; meta: { page: number; limit: number; total: number; totalPages: number } }> => {
        const response = await api.get<InsightsListItem[]>('/ai/insights', params);
        return {
            data: response.data as InsightsListItem[],
            meta: response.meta as { page: number; limit: number; total: number; totalPages: number },
        };
    },
};

export const settingsApi = {
    getAll: async (): Promise<AllSettings> => {
        const response = await api.get<AllSettings>('/settings');
        return response.data as AllSettings;
    },

    getProfile: async (): Promise<UserProfile> => {
        const response = await api.get<UserProfile>('/settings/profile');
        return response.data as UserProfile;
    },

    updateProfile: async (data: UpdateProfileInput): Promise<UserProfile> => {
        const response = await api.put<UserProfile>('/settings/profile', data);
        return response.data as UserProfile;
    },

    uploadAvatar: async (file: File): Promise<{ url: string }> => {
        const formData = new FormData();
        formData.append('avatar', file);
        const response = await api.uploadFile<{ url: string }>('/settings/profile/avatar', formData);
        return response.data as { url: string };
    },

    changePassword: async (data: ChangePasswordInput): Promise<{ message: string }> => {
        const response = await api.put<{ message: string }>('/settings/password', data);
        return response.data as { message: string };
    },

    getPreferences: async (): Promise<UserSettings> => {
        const response = await api.get<UserSettings>('/settings/preferences');
        return response.data as UserSettings;
    },

    updatePreferences: async (data: UpdateSettingsInput): Promise<UserSettings> => {
        const response = await api.put<UserSettings>('/settings/preferences', data);
        return response.data as UserSettings;
    },

    getCompany: async (): Promise<CompanyInfo> => {
        const response = await api.get<CompanyInfo>('/settings/company');
        return response.data as CompanyInfo;
    },

    updateCompany: async (data: UpdateCompanyInfoInput): Promise<CompanyInfo> => {
        const response = await api.put<CompanyInfo>('/settings/company', data);
        return response.data as CompanyInfo;
    },

    uploadLogo: async (file: File): Promise<{ url: string }> => {
        const formData = new FormData();
        formData.append('logo', file);
        const response = await api.uploadFile<{ url: string }>('/settings/company/logo', formData);
        return response.data as { url: string };
    },

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

    getSmtpConfig: async (): Promise<SmtpConfigData> => {
        const response = await api.get<SmtpConfigData>('/settings/smtp');
        return response.data as SmtpConfigData;
    },

    updateSmtpConfig: async (data: UpdateSmtpConfigInput): Promise<SmtpConfigData> => {
        const response = await api.put<SmtpConfigData>('/settings/smtp', data);
        return response.data as SmtpConfigData;
    },

    deleteSmtpConfig: async (): Promise<{ message: string }> => {
        const response = await api.delete<{ message: string }>('/settings/smtp');
        return response.data as { message: string };
    },

    testSmtpConnection: async (data: TestSmtpConnectionInput): Promise<TestSmtpConnectionResult> => {
        const response = await api.post<TestSmtpConnectionResult>('/settings/smtp/test', data);
        return response.data as TestSmtpConnectionResult;
    },
};
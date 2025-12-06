// SmartQuote-AI/src/lib/api.ts

import { getSession } from 'next-auth/react';
import { ApiResponse } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

interface FetchOptions extends RequestInit {
    params?: Record<string, any>;
}

class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    private async getAuthHeaders(): Promise<HeadersInit> {
        const session = await getSession();
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        // Jeśli mamy token z backendu, użyj go
        if ((session as any)?.accessToken) {
            headers['Authorization'] = `Bearer ${(session as any).accessToken}`;
        }

        return headers;
    }

    private buildUrl(endpoint: string, params?: Record<string, any>): string {
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

    async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { method: 'GET', params });
    }

    async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }

    async downloadBlob(endpoint: string): Promise<Blob> {
        const session = await getSession();
        const headers: HeadersInit = {};

        if ((session as any)?.accessToken) {
            headers['Authorization'] = `Bearer ${(session as any).accessToken}`;
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
        public details?: any
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
        api.post<{ user: any; token: string }>('/auth/login', { email, password }),
    register: (data: { email: string; password: string; name?: string }) =>
        api.post('/auth/register', data),
    me: () => api.get('/auth/me'),
};

// Clients
export const clientsApi = {
    list: (params?: Record<string, any>) =>
        api.get<any[]>('/clients', params),
    get: (id: string) =>
        api.get<any>(`/clients/${id}`),
    create: (data: any) =>
        api.post<any>('/clients', data),
    update: (id: string, data: any) =>
        api.put<any>(`/clients/${id}`, data),
    delete: (id: string) =>
        api.delete(`/clients/${id}`),
    stats: () =>
        api.get<any>('/clients/stats'),
};

// Offers
export const offersApi = {
    list: (params?: Record<string, any>) =>
        api.get<any[]>('/offers', params),
    get: (id: string) =>
        api.get<any>(`/offers/${id}`),
    create: (data: any) =>
        api.post<any>('/offers', data),
    update: (id: string, data: any) =>
        api.put<any>(`/offers/${id}`, data),
    delete: (id: string) =>
        api.delete(`/offers/${id}`),
    duplicate: (id: string) =>
        api.post<any>(`/offers/${id}/duplicate`),
    stats: () =>
        api.get<any>('/offers/stats'),
};

// Contracts
export const contractsApi = {
    list: (params?: Record<string, any>) =>
        api.get<any[]>('/contracts', params),
    get: (id: string) =>
        api.get<any>(`/contracts/${id}`),
    create: (data: any) =>
        api.post<any>('/contracts', data),
    update: (id: string, data: any) =>
        api.put<any>(`/contracts/${id}`, data),
    delete: (id: string) =>
        api.delete(`/contracts/${id}`),
    createFromOffer: (offerId: string) =>
        api.post<any>(`/contracts/from-offer/${offerId}`),
    updateStatus: (id: string, status: string) =>
        api.put<any>(`/contracts/${id}/status`, { status }),
    stats: () =>
        api.get<any>('/contracts/stats'),
    downloadPdf: (id: string) =>
        api.downloadBlob(`/contracts/${id}/pdf`),
};
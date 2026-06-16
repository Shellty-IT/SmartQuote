// src/lib/api/client.ts

import { getSession, signOut } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

interface FetchOptions extends RequestInit {
    params?: Record<string, string | number | boolean | undefined>;
}

interface SessionWithToken {
    readonly accessToken?: string;
}

interface ApiResponseShape<T = unknown> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    };
    meta?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

let isSigningOut = false;

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

    private async parseJsonResponse<T>(response: Response): Promise<ApiResponseShape<T>> {
        const text = await response.text();

        if (!text) {
            return { success: response.ok } as ApiResponseShape<T>;
        }

        try {
            return JSON.parse(text) as ApiResponseShape<T>;
        } catch {
            return {
                success: false,
                error: {
                    code: response.ok ? 'INVALID_RESPONSE' : 'HTTP_ERROR',
                    message: response.ok ? 'Invalid response from server' : (response.statusText || 'An error occurred'),
                },
            };
        }
    }

    private async handleUnauthorized(response: Response): Promise<void> {
        if (response.status !== 401) return;

        if (typeof window !== 'undefined' && !isSigningOut) {
            isSigningOut = true;
            await signOut({ callbackUrl: '/' });
        }

        throw new ApiError('Session expired. Please sign in again.', 'UNAUTHORIZED', 401);
    }

    async request<T>(endpoint: string, options: FetchOptions = {}): Promise<ApiResponseShape<T>> {
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

        const data = await this.parseJsonResponse<T>(response);

        if (!response.ok) {
            await this.handleUnauthorized(response);
            throw new ApiError(
                data.error?.message || 'An error occurred',
                data.error?.code || 'UNKNOWN_ERROR',
                response.status,
                data.error?.details
            );
        }

        return data;
    }

    async requestPublic<T>(endpoint: string, options: FetchOptions = {}): Promise<ApiResponseShape<T>> {
        const { params, ...fetchOptions } = options;
        const url = this.buildUrl(endpoint, params);

        const response = await fetch(url, {
            ...fetchOptions,
            headers: {
                'Content-Type': 'application/json',
                ...fetchOptions.headers,
            },
        });

        const data = await this.parseJsonResponse<T>(response);

        if (!response.ok) {
            throw new ApiError(
                data.error?.message || 'An error occurred',
                data.error?.code || 'UNKNOWN_ERROR',
                response.status,
                data.error?.details
            );
        }

        return data;
    }

    async get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<ApiResponseShape<T>> {
        return this.request<T>(endpoint, { method: 'GET', params });
    }

    async post<T>(endpoint: string, data?: unknown): Promise<ApiResponseShape<T>> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async put<T>(endpoint: string, data?: unknown): Promise<ApiResponseShape<T>> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async patch<T>(endpoint: string, data?: unknown): Promise<ApiResponseShape<T>> {
        return this.request<T>(endpoint, {
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async delete<T>(endpoint: string): Promise<ApiResponseShape<T>> {
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
            const data = await this.parseJsonResponse<never>(response);
            await this.handleUnauthorized(response);
            throw new ApiError(
                data.error?.message || 'Failed to download file',
                data.error?.code || 'DOWNLOAD_ERROR',
                response.status,
                data.error?.details
            );
        }

        return response.blob();
    }

    async uploadFile<T>(endpoint: string, formData: FormData): Promise<ApiResponseShape<T>> {
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

        const data = await this.parseJsonResponse<T>(response);

        if (!response.ok) {
            await this.handleUnauthorized(response);
            throw new ApiError(
                data.error?.message || 'An error occurred',
                data.error?.code || 'UPLOAD_ERROR',
                response.status,
                data.error?.details
            );
        }

        return data;
    }

    async getPublic<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<ApiResponseShape<T>> {
        return this.requestPublic<T>(endpoint, { method: 'GET', params });
    }

    async postPublic<T>(endpoint: string, data?: unknown): Promise<ApiResponseShape<T>> {
        return this.requestPublic<T>(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async patchPublic<T>(endpoint: string, data?: unknown): Promise<ApiResponseShape<T>> {
        return this.requestPublic<T>(endpoint, {
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined,
        });
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

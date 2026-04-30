// src/lib/api/settings.api.ts

import { api } from './client';
import type {
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
    SenderEmailData,
    UpdateSenderEmailInput,
} from '@/types';

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

    getSenderEmail: async (): Promise<SenderEmailData> => {
        const response = await api.get<SenderEmailData>('/settings/sender-email');
        return response.data as SenderEmailData;
    },

    updateSenderEmail: async (data: UpdateSenderEmailInput): Promise<SenderEmailData> => {
        const response = await api.put<SenderEmailData>('/settings/sender-email', data);
        return response.data as SenderEmailData;
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

    testSavedSmtpConnection: async (): Promise<TestSmtpConnectionResult> => {
        const response = await api.post<TestSmtpConnectionResult>('/settings/smtp/test-saved');
        return response.data as TestSmtpConnectionResult;
    },
};
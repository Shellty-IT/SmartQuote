// src/lib/api/settings.api.ts

import { api } from './client';
import type {
    AllSettings,
    UserProfile,
    UserSettings,
    CompanyInfo,
    ApiKey,
    CreatedApiKey,
    UpdateProfileInput,
    ChangePasswordInput,
    UpdateSettingsInput,
    UpdateCompanyInfoInput,
    CreateApiKeyInput,
    SmtpConfigData,
    UpdateSmtpConfigInput,
    TestSmtpConnectionInput,
    TestSmtpConnectionResult,
    ResendConfigData,
    UpdateResendConfigInput,
    TestResendConnectionInput,
    TestResendConnectionResult,
} from '@/types';

type ApiKeyResponse = Omit<ApiKey, 'maskedKey'> & { key: string };
type AllSettingsResponse = Omit<AllSettings, 'apiKeys'> & { apiKeys: ApiKeyResponse[] };

function toApiKey({ key, ...apiKey }: ApiKeyResponse): ApiKey {
    return { ...apiKey, maskedKey: key };
}

export const settingsApi = {
    getAll: async (): Promise<AllSettings> => {
        const response = await api.get<AllSettingsResponse>('/settings');
        const data = response.data as AllSettingsResponse;
        return { ...data, apiKeys: data.apiKeys.map(toApiKey) };
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
        const response = await api.get<ApiKeyResponse[]>('/settings/api-keys');
        return (response.data as ApiKeyResponse[]).map(toApiKey);
    },

    createApiKey: async (data: CreateApiKeyInput): Promise<CreatedApiKey> => {
        const response = await api.post<ApiKeyResponse>('/settings/api-keys', data);
        return { secret: (response.data as ApiKeyResponse).key };
    },

    toggleApiKey: async (id: string): Promise<ApiKey> => {
        const response = await api.patch<ApiKeyResponse>(`/settings/api-keys/${id}/toggle`);
        return toApiKey(response.data as ApiKeyResponse);
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

    testSavedSmtpConnection: async (): Promise<TestSmtpConnectionResult> => {
        const response = await api.post<TestSmtpConnectionResult>('/settings/smtp/test-saved');
        return response.data as TestSmtpConnectionResult;
    },

    getResendConfig: async (): Promise<ResendConfigData> => {
        const response = await api.get<ResendConfigData>('/settings/resend');
        return response.data as ResendConfigData;
    },

    updateResendConfig: async (data: UpdateResendConfigInput): Promise<ResendConfigData> => {
        const response = await api.put<ResendConfigData>('/settings/resend', data);
        return response.data as ResendConfigData;
    },

    deleteResendConfig: async (): Promise<{ message: string }> => {
        const response = await api.delete<{ message: string }>('/settings/resend');
        return response.data as { message: string };
    },

    testResendConnection: async (data: TestResendConnectionInput): Promise<TestResendConnectionResult> => {
        const response = await api.post<TestResendConnectionResult>('/settings/resend/test', data);
        return response.data as TestResendConnectionResult;
    },

    testSavedResendConnection: async (): Promise<TestResendConnectionResult> => {
        const response = await api.post<TestResendConnectionResult>('/settings/resend/test-saved');
        return response.data as TestResendConnectionResult;
    },

    deleteAccount: async (): Promise<{ message: string }> => {
        const response = await api.delete<{ message: string }>('/settings/account');
        return response.data as { message: string };
    },
};

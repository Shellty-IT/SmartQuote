// SmartQuote-AI/src/hooks/useSettings.ts

'use client';

import { useState, useEffect, useCallback } from 'react';
import { settingsApi } from '@/lib/api';
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
} from '@/types';

export function useSettings() {
    const [settings, setSettings] = useState<AllSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSettings = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await settingsApi.getAll();
            setSettings(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Błąd pobierania ustawień');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const updateProfile = async (data: UpdateProfileInput): Promise<UserProfile> => {
        const updated = await settingsApi.updateProfile(data);
        setSettings(prev => prev ? { ...prev, profile: updated } : null);
        return updated;
    };

    const changePassword = async (data: ChangePasswordInput): Promise<void> => {
        await settingsApi.changePassword(data);
    };

    const updatePreferences = async (data: UpdateSettingsInput): Promise<UserSettings> => {
        const updated = await settingsApi.updatePreferences(data);
        setSettings(prev => prev ? { ...prev, settings: updated } : null);
        return updated;
    };

    const updateCompany = async (data: UpdateCompanyInfoInput): Promise<CompanyInfo> => {
        const updated = await settingsApi.updateCompany(data);
        setSettings(prev => prev ? { ...prev, companyInfo: updated } : null);
        return updated;
    };

    const createApiKey = async (data: CreateApiKeyInput): Promise<ApiKey & { key: string }> => {
        const newKey = await settingsApi.createApiKey(data);
        await fetchSettings();
        return newKey;
    };

    const toggleApiKey = async (id: string): Promise<void> => {
        await settingsApi.toggleApiKey(id);
        await fetchSettings();
    };

    const deleteApiKey = async (id: string): Promise<void> => {
        await settingsApi.deleteApiKey(id);
        setSettings(prev => prev ? {
            ...prev,
            apiKeys: prev.apiKeys.filter(k => k.id !== id)
        } : null);
    };

    return {
        settings,
        isLoading,
        error,
        refetch: fetchSettings,
        updateProfile,
        changePassword,
        updatePreferences,
        updateCompany,
        createApiKey,
        toggleApiKey,
        deleteApiKey,
    };
}

export function useSmtpConfig() {
    const [config, setConfig] = useState<SmtpConfigData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchConfig = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await settingsApi.getSmtpConfig();
            setConfig(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Błąd pobierania konfiguracji SMTP');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

    const updateConfig = async (data: UpdateSmtpConfigInput): Promise<SmtpConfigData> => {
        setIsSaving(true);
        setError(null);
        try {
            const updated = await settingsApi.updateSmtpConfig(data);
            setConfig(updated);
            return updated;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Błąd zapisu konfiguracji';
            setError(message);
            throw err;
        } finally {
            setIsSaving(false);
        }
    };

    const testConnection = async (data: TestSmtpConnectionInput): Promise<TestSmtpConnectionResult> => {
        setIsTesting(true);
        setError(null);
        try {
            const result = await settingsApi.testSmtpConnection(data);
            return result;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Błąd testu połączenia';
            setError(message);
            throw err;
        } finally {
            setIsTesting(false);
        }
    };

    const testSavedConnection = async (): Promise<TestSmtpConnectionResult> => {
        setIsTesting(true);
        setError(null);
        try {
            const result = await settingsApi.testSavedSmtpConnection();
            return result;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Błąd testu połączenia';
            setError(message);
            throw err;
        } finally {
            setIsTesting(false);
        }
    };

    const deleteConfig = async (): Promise<void> => {
        setIsDeleting(true);
        setError(null);
        try {
            await settingsApi.deleteSmtpConfig();
            setConfig({
                smtpHost: null,
                smtpPort: 587,
                smtpUser: null,
                smtpPass: null,
                smtpFrom: null,
                smtpConfigured: false,
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Błąd usuwania konfiguracji';
            setError(message);
            throw err;
        } finally {
            setIsDeleting(false);
        }
    };

    return {
        config,
        isLoading,
        isSaving,
        isTesting,
        isDeleting,
        error,
        refetch: fetchConfig,
        updateConfig,
        testConnection,
        testSavedConnection,
        deleteConfig,
    };
}
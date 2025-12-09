// src/hooks/useSettings.ts

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

    // Profile
    const updateProfile = async (data: UpdateProfileInput): Promise<UserProfile> => {
        const updated = await settingsApi.updateProfile(data);
        setSettings(prev => prev ? { ...prev, profile: updated } : null);
        return updated;
    };

    // Password
    const changePassword = async (data: ChangePasswordInput): Promise<void> => {
        await settingsApi.changePassword(data);
    };

    // Preferences
    const updatePreferences = async (data: UpdateSettingsInput): Promise<UserSettings> => {
        const updated = await settingsApi.updatePreferences(data);
        setSettings(prev => prev ? { ...prev, settings: updated } : null);
        return updated;
    };

    // Company
    const updateCompany = async (data: UpdateCompanyInfoInput): Promise<CompanyInfo> => {
        const updated = await settingsApi.updateCompany(data);
        setSettings(prev => prev ? { ...prev, companyInfo: updated } : null);
        return updated;
    };

    // API Keys
    const createApiKey = async (data: CreateApiKeyInput): Promise<ApiKey & { key: string }> => {
        const newKey = await settingsApi.createApiKey(data);
        await fetchSettings(); // Odśwież listę
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
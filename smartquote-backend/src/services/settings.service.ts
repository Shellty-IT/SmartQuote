// src/services/settings.service.ts
//
// Barrel re-export: settings.service.ts used to hold profile, email-provider
// config (SMTP/Resend + secret encryption) and API-key management in one
// 560-line file covering unrelated concerns. Split into src/services/settings/
// for focus and testability; this file keeps the original import surface
// (`import * as settingsService from './settings.service'`, and named imports
// like `getUserEmailConfig`) so nothing outside this module needed to change.
export * from './settings/profile.service';
export * from './settings/email-config.service';
export * from './settings/api-keys.service';

import { getProfile, getSettings, getCompanyInfo } from './settings/profile.service';
import { getApiKeys } from './settings/api-keys.service';

export async function getAllSettings(userId: string) {
    const [profile, settings, companyInfo, apiKeys] = await Promise.all([
        getProfile(userId),
        getSettings(userId),
        getCompanyInfo(userId),
        getApiKeys(userId),
    ]);
    return { profile, settings, companyInfo, apiKeys };
}

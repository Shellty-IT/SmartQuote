// src/types/settings.types.ts

export interface UserSettings {
    id: string;
    userId: string;
    theme: 'light' | 'dark';
    language: 'pl' | 'en';
    emailNotifications: boolean;
    offerNotifications: boolean;
    followUpReminders: boolean;
    weeklyReport: boolean;
    aiTone: 'professional' | 'friendly' | 'formal';
    aiAutoSuggestions: boolean;
    smtpHost: string | null;
    smtpPort: number | null;
    smtpUser: string | null;
    smtpPass: string | null;
    smtpFrom: string | null;
    smtpConfigured: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface SmtpConfigData {
    smtpHost: string | null;
    smtpPort: number | null;
    smtpUser: string | null;
    smtpPass: string | null;
    smtpFrom: string | null;
    smtpConfigured: boolean;
}

export interface UpdateSmtpConfigInput {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass?: string;
    smtpFrom?: string;
}

export interface TestSmtpConnectionInput {
    host: string;
    port: number;
    user: string;
    pass: string;
    from?: string;
}

export interface TestSmtpConnectionResult {
    connected: boolean;
    message: string;
}

export interface CompanyInfo {
    id: string;
    userId: string;
    name: string | null;
    nip: string | null;
    regon: string | null;
    address: string | null;
    city: string | null;
    postalCode: string | null;
    country: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    bankName: string | null;
    bankAccount: string | null;
    logo: string | null;
    primaryColor: string | null;
    defaultPaymentDays: number;
    defaultTerms: string | null;
    defaultNotes: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ApiKey {
    id: string;
    name: string;
    key: string;
    lastUsedAt: string | null;
    expiresAt: string | null;
    isActive: boolean;
    permissions: string[];
    createdAt: string;
}

export interface UserProfile {
    id: string;
    email: string;
    name: string | null;
    phone: string | null;
    avatar: string | null;
    role: 'USER' | 'ADMIN';
    createdAt: string;
}

export interface AllSettings {
    profile: UserProfile;
    settings: UserSettings;
    companyInfo: CompanyInfo;
    apiKeys: ApiKey[];
}

export interface UpdateProfileInput {
    name?: string;
    phone?: string | null;
    avatar?: string | null;
}

export interface ChangePasswordInput {
    currentPassword: string;
    newPassword: string;
}

export interface UpdateSettingsInput {
    theme?: 'light' | 'dark';
    language?: 'pl' | 'en';
    emailNotifications?: boolean;
    offerNotifications?: boolean;
    followUpReminders?: boolean;
    weeklyReport?: boolean;
    aiTone?: 'professional' | 'friendly' | 'formal';
    aiAutoSuggestions?: boolean;
}

export interface UpdateCompanyInfoInput {
    name?: string | null;
    nip?: string | null;
    regon?: string | null;
    address?: string | null;
    city?: string | null;
    postalCode?: string | null;
    country?: string | null;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    bankName?: string | null;
    bankAccount?: string | null;
    logo?: string | null;
    primaryColor?: string | null;
    defaultPaymentDays?: number;
    defaultTerms?: string | null;
    defaultNotes?: string | null;
}

export interface CreateApiKeyInput {
    name: string;
    permissions?: string[];
    expiresAt?: string | null;
}

export interface SenderEmailData {
    senderEmail: string | null;
}

export interface UpdateSenderEmailInput {
    senderEmail: string;
}
// src/services/settings.service.ts
import crypto from 'crypto';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { encrypt, decrypt } from '../utils/crypto';
import { emailService } from './email';
import { authCache } from '../lib/auth-cache';
import { ksefBridgeService } from './ksef-bridge.service';
import { createModuleLogger } from '../lib/logger';
import type { SmtpConfig, ResendConfig, EmailProviderConfig } from '../types';

const logger = createModuleLogger('settings');

export async function getProfile(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            avatar: true,
            role: true,
            createdAt: true,
        },
    });
    if (!user) throw new Error('Użytkownik nie znaleziony');
    return user;
}

export async function updateProfile(
    userId: string,
    data: { name?: string; phone?: string; avatar?: string },
) {
    return prisma.user.update({
        where: { id: userId },
        data: { name: data.name, phone: data.phone, avatar: data.avatar },
        select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            avatar: true,
            role: true,
            createdAt: true,
        },
    });
}

export async function changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('Użytkownik nie znaleziony');

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) throw new Error('Nieprawidłowe obecne hasło');

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } });

    authCache.invalidate(userId);
    logger.info({ userId }, 'Password changed, auth cache invalidated');

    return { message: 'Hasło zostało zmienione' };
}

export async function deleteAccount(userId: string) {
    await prisma.user.delete({ where: { id: userId } });
    authCache.invalidate(userId);
    logger.info({ userId }, 'Account deleted');
    return { message: 'Konto zostało usunięte' };
}

export async function getSettings(userId: string) {
    let settings = await prisma.userSettings.findUnique({ where: { userId } });
    if (!settings) {
        settings = await prisma.userSettings.create({ data: { userId } });
    }
    return {
        ...settings,
        smtpPass: settings.smtpPass ? '••••••••' : null,
        resendApiKey: settings.resendApiKey ? '••••••••' : null,
    };
}

export async function updateSettings(
    userId: string,
    data: {
        theme?: string;
        language?: string;
        emailNotifications?: boolean;
        offerNotifications?: boolean;
        followUpReminders?: boolean;
        weeklyReport?: boolean;
        aiTone?: string;
        aiAutoSuggestions?: boolean;
        emailProvider?: 'smtp' | 'resend';
    },
) {
    const settings = await prisma.userSettings.upsert({
        where: { userId },
        update: data,
        create: { userId, ...data },
    });
    return {
        ...settings,
        smtpPass: settings.smtpPass ? '••••••••' : null,
        resendApiKey: settings.resendApiKey ? '••••••••' : null,
    };
}

export async function getSmtpConfig(userId: string) {
    const settings = await prisma.userSettings.findUnique({
        where: { userId },
        select: {
            smtpHost: true,
            smtpPort: true,
            smtpUser: true,
            smtpPass: true,
            smtpFrom: true,
            smtpConfigured: true,
        },
    });
    if (!settings) {
        return { smtpHost: null, smtpPort: 587, smtpUser: null, smtpPass: null, smtpFrom: null, smtpConfigured: false };
    }
    return {
        smtpHost: settings.smtpHost,
        smtpPort: settings.smtpPort,
        smtpUser: settings.smtpUser,
        smtpPass: settings.smtpPass ? '••••••••' : null,
        smtpFrom: settings.smtpFrom,
        smtpConfigured: settings.smtpConfigured,
    };
}

function normalizeSmtpFrom(smtpFrom: string | undefined | null, smtpUser: string): string {
    if (!smtpFrom || smtpFrom.trim() === '') return smtpUser;
    const trimmed = smtpFrom.trim();

    const emailOnly = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailOnly.test(trimmed)) return trimmed;

    const fullFormat = /^.+<[^\s@]+@[^\s@]+\.[^\s@]+>$/;
    if (fullFormat.test(trimmed)) return trimmed;

    const bracketOnly = /^<[^\s@]+@[^\s@]+\.[^\s@]+>$/;
    if (bracketOnly.test(trimmed)) return trimmed;

    return `"${trimmed}" <${smtpUser}>`;
}

export async function updateSmtpConfig(
    userId: string,
    data: {
        smtpHost: string;
        smtpPort: number;
        smtpUser: string;
        smtpPass?: string;
        smtpFrom?: string;
    },
) {
    const existing = await prisma.userSettings.findUnique({
        where: { userId },
        select: { smtpPass: true },
    });

    let encryptedPass = existing?.smtpPass || null;
    if (data.smtpPass && data.smtpPass !== '••••••••') {
        encryptedPass = encrypt(data.smtpPass);
    }

    const isConfigured = !!(data.smtpHost && data.smtpUser && encryptedPass);
    const normalizedFrom = normalizeSmtpFrom(data.smtpFrom, data.smtpUser);

    const settings = await prisma.userSettings.upsert({
        where: { userId },
        update: {
            smtpHost: data.smtpHost,
            smtpPort: data.smtpPort,
            smtpUser: data.smtpUser,
            smtpPass: encryptedPass,
            smtpFrom: normalizedFrom,
            smtpConfigured: isConfigured,
        },
        create: {
            userId,
            smtpHost: data.smtpHost,
            smtpPort: data.smtpPort,
            smtpUser: data.smtpUser,
            smtpPass: encryptedPass,
            smtpFrom: normalizedFrom,
            smtpConfigured: isConfigured,
        },
    });

    return {
        smtpHost: settings.smtpHost,
        smtpPort: settings.smtpPort,
        smtpUser: settings.smtpUser,
        smtpPass: settings.smtpPass ? '••••••••' : null,
        smtpFrom: settings.smtpFrom,
        smtpConfigured: settings.smtpConfigured,
    };
}

export async function deleteSmtpConfig(userId: string) {
    await prisma.userSettings.upsert({
        where: { userId },
        update: { smtpHost: null, smtpPort: 587, smtpUser: null, smtpPass: null, smtpFrom: null, smtpConfigured: false },
        create: { userId },
    });
    return { message: 'Konfiguracja SMTP została usunięta' };
}

export async function testSmtpConnection(config: SmtpConfig) {
    return emailService.testConnection(config);
}

export async function getDecryptedSmtpConfig(userId: string): Promise<SmtpConfig | null> {
    const settings = await prisma.userSettings.findUnique({
        where: { userId },
        select: {
            smtpHost: true,
            smtpPort: true,
            smtpUser: true,
            smtpPass: true,
            smtpFrom: true,
            smtpConfigured: true,
        },
    });

    if (!settings || !settings.smtpConfigured) return null;
    if (!settings.smtpHost || !settings.smtpUser || !settings.smtpPass) return null;

    try {
        const decryptedPass = decrypt(settings.smtpPass);
        const normalizedFrom = normalizeSmtpFrom(settings.smtpFrom, settings.smtpUser);
        return {
            host: settings.smtpHost,
            port: settings.smtpPort || 587,
            user: settings.smtpUser,
            pass: decryptedPass,
            from: normalizedFrom,
        };
    } catch (err: unknown) {
        logger.error({ err, userId }, 'SMTP password decryption failed');
        return null;
    }
}

export async function testSavedSmtpConnection(userId: string): Promise<{ success: boolean; error?: string }> {
    const config = await getDecryptedSmtpConfig(userId);
    if (!config) {
        return { success: false, error: 'Brak zapisanej konfiguracji SMTP lub błąd odszyfrowania hasła' };
    }
    return emailService.testConnection(config);
}

function buildResendFrom(fromEmail: string, fromName?: string | null): string {
    const trimmedName = fromName?.trim();
    return trimmedName ? `"${trimmedName}" <${fromEmail}>` : fromEmail;
}

export async function getResendConfig(userId: string) {
    const settings = await prisma.userSettings.findUnique({
        where: { userId },
        select: {
            resendApiKey: true,
            resendFromEmail: true,
            resendFromName: true,
            resendConfigured: true,
        },
    });
    if (!settings) {
        return { resendApiKey: null, resendFromEmail: null, resendFromName: null, resendConfigured: false };
    }
    return {
        resendApiKey: settings.resendApiKey ? '••••••••' : null,
        resendFromEmail: settings.resendFromEmail,
        resendFromName: settings.resendFromName,
        resendConfigured: settings.resendConfigured,
    };
}

export async function updateResendConfig(
    userId: string,
    data: {
        resendApiKey?: string;
        resendFromEmail: string;
        resendFromName?: string;
    },
) {
    const existing = await prisma.userSettings.findUnique({
        where: { userId },
        select: { resendApiKey: true },
    });

    let encryptedKey = existing?.resendApiKey || null;
    if (data.resendApiKey && data.resendApiKey !== '••••••••') {
        encryptedKey = encrypt(data.resendApiKey);
    }

    const isConfigured = !!(data.resendFromEmail && encryptedKey);

    const settings = await prisma.userSettings.upsert({
        where: { userId },
        update: {
            resendFromEmail: data.resendFromEmail,
            resendFromName: data.resendFromName,
            resendApiKey: encryptedKey,
            resendConfigured: isConfigured,
        },
        create: {
            userId,
            resendFromEmail: data.resendFromEmail,
            resendFromName: data.resendFromName,
            resendApiKey: encryptedKey,
            resendConfigured: isConfigured,
        },
    });

    return {
        resendApiKey: settings.resendApiKey ? '••••••••' : null,
        resendFromEmail: settings.resendFromEmail,
        resendFromName: settings.resendFromName,
        resendConfigured: settings.resendConfigured,
    };
}

export async function deleteResendConfig(userId: string) {
    await prisma.userSettings.upsert({
        where: { userId },
        update: { resendApiKey: null, resendFromEmail: null, resendFromName: null, resendConfigured: false },
        create: { userId },
    });
    return { message: 'Konfiguracja Resend została usunięta' };
}

export async function testResendConnection(apiKey: string) {
    return emailService.testResendConnection(apiKey);
}

export async function getDecryptedResendConfig(userId: string): Promise<ResendConfig | null> {
    const settings = await prisma.userSettings.findUnique({
        where: { userId },
        select: {
            resendApiKey: true,
            resendFromEmail: true,
            resendFromName: true,
            resendConfigured: true,
        },
    });

    if (!settings || !settings.resendConfigured) return null;
    if (!settings.resendApiKey || !settings.resendFromEmail) return null;

    try {
        const decryptedKey = decrypt(settings.resendApiKey);
        return {
            apiKey: decryptedKey,
            from: buildResendFrom(settings.resendFromEmail, settings.resendFromName),
        };
    } catch (err: unknown) {
        logger.error({ err, userId }, 'Resend API key decryption failed');
        return null;
    }
}

export async function testSavedResendConnection(userId: string): Promise<{ success: boolean; error?: string }> {
    const config = await getDecryptedResendConfig(userId);
    if (!config) {
        return { success: false, error: 'Brak zapisanej konfiguracji Resend lub błąd odszyfrowania klucza' };
    }
    return emailService.testResendConnection(config.apiKey);
}

export async function getUserEmailConfig(userId: string): Promise<EmailProviderConfig | null> {
    const settings = await prisma.userSettings.findUnique({
        where: { userId },
        select: { emailProvider: true },
    });
    const provider = settings?.emailProvider === 'resend' ? 'resend' : 'smtp';

    if (provider === 'resend') {
        const resend = await getDecryptedResendConfig(userId);
        return resend ? { provider: 'resend', config: resend } : null;
    }
    const smtp = await getDecryptedSmtpConfig(userId);
    return smtp ? { provider: 'smtp', config: smtp } : null;
}

export async function getCompanyInfo(userId: string) {
    let companyInfo = await prisma.companyInfo.findUnique({ where: { userId } });
    if (!companyInfo) {
        companyInfo = await prisma.companyInfo.create({ data: { userId } });
    }
    return companyInfo;
}

export async function updateCompanyInfo(
    userId: string,
    data: {
        name?: string;
        nip?: string;
        regon?: string;
        address?: string;
        city?: string;
        postalCode?: string;
        country?: string;
        phone?: string;
        email?: string;
        website?: string;
        bankName?: string;
        bankAccount?: string;
        logo?: string;
        logoLight?: string;
        logoDark?: string;
        primaryColor?: string;
        defaultPaymentDays?: number;
        defaultTerms?: string;
        defaultNotes?: string;
    },
) {
    const result = await prisma.companyInfo.upsert({
        where: { userId },
        update: data,
        create: { userId, ...data },
    });

    // Fix #5 – invalidate KSeF availability cache when NIP changes so the
    // invoice button reflects the new NIP immediately, without waiting for TTL.
    if ('nip' in data) {
        ksefBridgeService.invalidateAvailability(userId);
    }

    return result;
}

export async function getApiKeys(userId: string) {
    const apiKeys = await prisma.apiKey.findMany({
        where: { userId },
        select: {
            id: true,
            name: true,
            key: true,
            lastUsedAt: true,
            expiresAt: true,
            isActive: true,
            permissions: true,
            createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
    });
    return apiKeys.map((key: {
        key: string;
        id: string;
        name: string;
        lastUsedAt: Date | null;
        expiresAt: Date | null;
        isActive: boolean;
        permissions: string[];
        createdAt: Date;
    }) => ({
        ...key,
        key: `${key.key.slice(0, 8)}...${key.key.slice(-4)}`,
    }));
}

export async function createApiKey(
    userId: string,
    data: { name: string; permissions?: string[]; expiresAt?: Date },
) {
    const key = `sq_${crypto.randomBytes(32).toString('hex')}`;
    const apiKey = await prisma.apiKey.create({
        data: {
            userId,
            name: data.name,
            key,
            permissions: data.permissions || ['read'],
            expiresAt: data.expiresAt,
        },
    });
    return { ...apiKey, key };
}

export async function deleteApiKey(userId: string, keyId: string) {
    const apiKey = await prisma.apiKey.findFirst({ where: { id: keyId, userId } });
    if (!apiKey) throw new Error('Klucz API nie znaleziony');
    await prisma.apiKey.delete({ where: { id: keyId } });
    return { message: 'Klucz API został usunięty' };
}

export async function toggleApiKey(userId: string, keyId: string) {
    const apiKey = await prisma.apiKey.findFirst({ where: { id: keyId, userId } });
    if (!apiKey) throw new Error('Klucz API nie znaleziony');
    return prisma.apiKey.update({
        where: { id: keyId },
        data: { isActive: !apiKey.isActive },
    });
}

export async function getAllSettings(userId: string) {
    const [profile, settings, companyInfo, apiKeys] = await Promise.all([
        getProfile(userId),
        getSettings(userId),
        getCompanyInfo(userId),
        getApiKeys(userId),
    ]);
    return { profile, settings, companyInfo, apiKeys };
}

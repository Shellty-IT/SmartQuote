// src/services/settings/email-config.service.ts
import prisma from '../../lib/prisma';
import { encrypt, decrypt } from '../../utils/crypto';
import { emailService } from '../email';
import { createModuleLogger } from '../../lib/logger';
import type { SmtpConfig, ResendConfig, EmailProviderConfig } from '../../types';

const logger = createModuleLogger('settings');

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

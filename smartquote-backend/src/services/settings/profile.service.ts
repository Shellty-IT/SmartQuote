// src/services/settings/profile.service.ts
import prisma from '../../lib/prisma';
import bcrypt from 'bcryptjs';
import { authCache } from '../../lib/auth-cache';
import { ksefBridgeService } from '../ksef-bridge.service';
import { createModuleLogger } from '../../lib/logger';

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
    // Bumping tokenVersion invalidates every JWT issued before this point
    // (they carry the old version), not just the 5-minute auth cache entry —
    // otherwise a stolen token stays valid for up to 7 days post-change.
    await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword, tokenVersion: { increment: 1 } },
    });

    authCache.invalidate(userId);
    logger.info({ userId }, 'Password changed, auth cache invalidated, tokenVersion bumped');

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

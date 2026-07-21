// src/services/settings/api-keys.service.ts
import crypto from 'crypto';
import prisma from '../../lib/prisma';
import { NotFoundError } from '../../errors/domain.errors';
import { hasPrismaCode } from '../../utils/prismaErrors';

export async function getApiKeys(userId: string) {
    const apiKeys = await prisma.apiKey.findMany({
        where: { userId },
        select: {
            id: true,
            name: true,
            prefix: true,
            lastFour: true,
            lastUsedAt: true,
            expiresAt: true,
            isActive: true,
            permissions: true,
            createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
    });
    return apiKeys.map(toApiKeyDto);
}

type ApiKeyDtoSource = {
    id: string;
    name: string;
    prefix: string;
    lastFour: string;
    lastUsedAt: Date | null;
    expiresAt: Date | null;
    isActive: boolean;
    permissions: string[];
    createdAt: Date;
};

function toApiKeyDto(apiKey: ApiKeyDtoSource) {
    const { prefix, lastFour, ...safeFields } = apiKey;
    return { ...safeFields, key: `${prefix}...${lastFour}` };
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
            keyHash: crypto.createHash('sha256').update(key).digest('hex'),
            prefix: key.slice(0, 8),
            lastFour: key.slice(-4),
            permissions: data.permissions || ['read'],
            expiresAt: data.expiresAt,
        },
        select: {
            id: true,
            name: true,
            prefix: true,
            lastFour: true,
            lastUsedAt: true,
            expiresAt: true,
            isActive: true,
            permissions: true,
            createdAt: true,
        },
    });
    return { ...toApiKeyDto(apiKey), key };
}

export async function deleteApiKey(userId: string, keyId: string) {
    const result = await prisma.apiKey.deleteMany({ where: { id: keyId, userId } });
    if (result.count === 0) throw new NotFoundError('Klucz API');
    return { message: 'Klucz API został usunięty' };
}

export async function toggleApiKey(userId: string, keyId: string) {
    const apiKey = await prisma.apiKey.findFirst({
        where: { id: keyId, userId },
        select: { id: true, isActive: true },
    });
    if (!apiKey) throw new NotFoundError('Klucz API');
    let updated;
    try {
        updated = await prisma.apiKey.update({
            where: { id: keyId },
            data: { isActive: !apiKey.isActive },
            select: {
                id: true,
                name: true,
                prefix: true,
                lastFour: true,
                lastUsedAt: true,
                expiresAt: true,
                isActive: true,
                permissions: true,
                createdAt: true,
            },
        });
    } catch (error: unknown) {
        if (hasPrismaCode(error, 'P2025')) throw new NotFoundError('Klucz API');
        throw error;
    }
    return toApiKeyDto(updated);
}

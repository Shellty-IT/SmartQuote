jest.mock('../lib/prisma', () => ({
    __esModule: true,
    default: {
        apiKey: {
            findMany: jest.fn(),
            create: jest.fn(),
            findFirst: jest.fn(),
            update: jest.fn(),
            deleteMany: jest.fn(),
        },
    },
}));

jest.mock('../services/email', () => ({ emailService: {} }));
jest.mock('../lib/auth-cache', () => ({ authCache: { invalidate: jest.fn() } }));
jest.mock('../services/ksef-bridge.service', () => ({
    ksefBridgeService: { invalidateAvailability: jest.fn() },
}));

import prisma from '../lib/prisma';
import { createApiKey, deleteApiKey, getApiKeys, toggleApiKey } from '../services/settings.service';
import { NotFoundError } from '../errors/domain.errors';

const apiKeyDb = prisma.apiKey as unknown as {
    findMany: jest.Mock;
    create: jest.Mock;
    findFirst: jest.Mock;
    update: jest.Mock;
    deleteMany: jest.Mock;
};

const storedDto = {
    id: 'key-1',
    name: 'Integracja',
    prefix: 'sq_ab12c',
    lastFour: '9xyz',
    lastUsedAt: null,
    expiresAt: null,
    isActive: true,
    permissions: ['read'],
    createdAt: new Date('2026-07-13T00:00:00Z'),
};

beforeEach(() => jest.resetAllMocks());

it('stores only a SHA-256 hash and reveals the secret once', async () => {
    apiKeyDb.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
        ...storedDto,
        prefix: data.prefix,
        lastFour: data.lastFour,
    }));

    const result = await createApiKey('user-1', { name: 'Integracja' });
    const createCall = apiKeyDb.create.mock.calls[0][0];

    expect(result.key).toMatch(/^sq_[a-f0-9]{64}$/);
    expect(createCall.data.keyHash).toMatch(/^[a-f0-9]{64}$/);
    expect(createCall.data.keyHash).not.toBe(result.key);
    expect(createCall.data).not.toHaveProperty('key');
});

it('returns only a masked key from list and toggle operations', async () => {
    apiKeyDb.findMany.mockResolvedValue([storedDto]);
    apiKeyDb.findFirst.mockResolvedValue({ id: 'key-1', isActive: true });
    apiKeyDb.update.mockResolvedValue({ ...storedDto, isActive: false });

    const [listed] = await getApiKeys('user-1');
    const toggled = await toggleApiKey('user-1', 'key-1');

    expect(listed.key).toBe('sq_ab12c...9xyz');
    expect(toggled.key).toBe('sq_ab12c...9xyz');
    expect(listed).not.toHaveProperty('keyHash');
    expect(toggled).not.toHaveProperty('keyHash');
});

it('returns not found for foreign or missing keys', async () => {
    apiKeyDb.findFirst.mockResolvedValue(null);
    apiKeyDb.deleteMany.mockResolvedValue({ count: 0 });

    await expect(toggleApiKey('user-1', 'foreign')).rejects.toThrow(NotFoundError);
    await expect(deleteApiKey('user-1', 'foreign')).rejects.toThrow(NotFoundError);
    expect(apiKeyDb.deleteMany).toHaveBeenCalledWith({
        where: { id: 'foreign', userId: 'user-1' },
    });
});

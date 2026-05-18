// src/__tests__/clientsService.test.ts

// Mock the repository before importing the service
jest.mock('../repositories/clients.repository', () => ({
    clientsRepository: {
        create: jest.fn(),
        findById: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        existsForUser: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        countStats: jest.fn(),
    },
}));

import { ClientsService } from '../services/clients.service';
import { clientsRepository } from '../repositories/clients.repository';
import { NotFoundError } from '../errors/domain.errors';

const repo = clientsRepository as jest.Mocked<typeof clientsRepository>;

const service = new ClientsService();
const USER_ID = 'user-123';
const CLIENT_ID = 'client-abc';

const MOCK_CLIENT = {
    id: CLIENT_ID,
    userId: USER_ID,
    name: 'Jan Kowalski',
    email: 'jan@example.com',
    type: 'COMPANY' as const,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
};

beforeEach(() => {
    jest.resetAllMocks();
});

// ── create ────────────────────────────────────────────────────────────────────

describe('ClientsService.create', () => {
    it('delegates to repository.create with userId and data', async () => {
        repo.create.mockResolvedValue(MOCK_CLIENT as never);
        const data = { name: 'Jan Kowalski', email: 'jan@example.com' };
        const result = await service.create(USER_ID, data);
        expect(repo.create).toHaveBeenCalledWith(USER_ID, data);
        expect(result).toBe(MOCK_CLIENT);
    });
});

// ── findById ──────────────────────────────────────────────────────────────────

describe('ClientsService.findById', () => {
    it('delegates to repository.findById', async () => {
        repo.findById.mockResolvedValue(MOCK_CLIENT as never);
        const result = await service.findById(CLIENT_ID, USER_ID);
        expect(repo.findById).toHaveBeenCalledWith(CLIENT_ID, USER_ID);
        expect(result).toBe(MOCK_CLIENT);
    });

    it('returns null when client not found', async () => {
        repo.findById.mockResolvedValue(null as never);
        const result = await service.findById('non-existent', USER_ID);
        expect(result).toBeNull();
    });
});

// ── findAll ───────────────────────────────────────────────────────────────────

describe('ClientsService.findAll', () => {
    beforeEach(() => {
        repo.findMany.mockResolvedValue([MOCK_CLIENT] as never);
        repo.count.mockResolvedValue(1 as never);
    });

    it('returns clients, total, page and limit', async () => {
        const result = await service.findAll(USER_ID, { page: '1', limit: '10' });
        expect(result.clients).toHaveLength(1);
        expect(result.total).toBe(1);
        expect(result.page).toBe(1);
        expect(result.limit).toBe(10);
    });

    it('defaults page to 1 and limit to 20 when not provided', async () => {
        await service.findAll(USER_ID, {});
        expect(repo.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ skip: 0, take: 20 }),
        );
    });

    it('parses isActive=true correctly', async () => {
        await service.findAll(USER_ID, { isActive: 'true' });
        expect(repo.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ isActive: true }),
        );
    });

    it('parses isActive=false correctly', async () => {
        await service.findAll(USER_ID, { isActive: 'false' });
        expect(repo.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ isActive: false }),
        );
    });

    it('calculates skip correctly for page 2 with limit 10', async () => {
        await service.findAll(USER_ID, { page: '2', limit: '10' });
        expect(repo.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ skip: 10, take: 10 }),
        );
    });

    it('clamps limit to MAX_PAGE_LIMIT (100)', async () => {
        await service.findAll(USER_ID, { limit: '999' });
        expect(repo.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ take: 100 }),
        );
    });

    it('defaults page to 1 on invalid value', async () => {
        await service.findAll(USER_ID, { page: 'abc' });
        expect(repo.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ skip: 0 }),
        );
    });

    it('defaults limit to 20 on invalid value', async () => {
        await service.findAll(USER_ID, { limit: 'xyz' });
        expect(repo.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ take: 20 }),
        );
    });

    it('passes search, sortBy and sortOrder to filter', async () => {
        await service.findAll(USER_ID, {
            search: 'kowalski',
            sortBy: 'name',
            sortOrder: 'asc',
        });
        expect(repo.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ search: 'kowalski', sortBy: 'name', sortOrder: 'asc' }),
        );
    });

    it('defaults sortBy to createdAt when not provided', async () => {
        await service.findAll(USER_ID, {});
        expect(repo.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ sortBy: 'createdAt' }),
        );
    });
});

// ── update ────────────────────────────────────────────────────────────────────

describe('ClientsService.update', () => {
    it('updates client when it exists', async () => {
        repo.existsForUser.mockResolvedValue(true as never);
        repo.update.mockResolvedValue({ ...MOCK_CLIENT, name: 'Updated' } as never);

        const result = await service.update(CLIENT_ID, USER_ID, { name: 'Updated' });
        expect(repo.existsForUser).toHaveBeenCalledWith(CLIENT_ID, USER_ID);
        expect(repo.update).toHaveBeenCalledWith(CLIENT_ID, { name: 'Updated' });
        expect((result as typeof MOCK_CLIENT).name).toBe('Updated');
    });

    it('throws NotFoundError when client does not exist', async () => {
        repo.existsForUser.mockResolvedValue(false as never);

        await expect(service.update(CLIENT_ID, USER_ID, { name: 'X' })).rejects.toThrow(NotFoundError);
        expect(repo.update).not.toHaveBeenCalled();
    });
});

// ── delete ────────────────────────────────────────────────────────────────────

describe('ClientsService.delete', () => {
    it('deletes client when it exists', async () => {
        repo.existsForUser.mockResolvedValue(true as never);
        repo.delete.mockResolvedValue(MOCK_CLIENT as never);

        await service.delete(CLIENT_ID, USER_ID);
        expect(repo.existsForUser).toHaveBeenCalledWith(CLIENT_ID, USER_ID);
        expect(repo.delete).toHaveBeenCalledWith(CLIENT_ID);
    });

    it('throws NotFoundError when client does not exist', async () => {
        repo.existsForUser.mockResolvedValue(false as never);

        await expect(service.delete(CLIENT_ID, USER_ID)).rejects.toThrow(NotFoundError);
        expect(repo.delete).not.toHaveBeenCalled();
    });
});

// ── getStats ──────────────────────────────────────────────────────────────────

describe('ClientsService.getStats', () => {
    it('calculates inactive as total minus active', async () => {
        repo.countStats.mockResolvedValue([100, 70, 45] as never);
        const result = await service.getStats(USER_ID);
        expect(result.total).toBe(100);
        expect(result.active).toBe(70);
        expect(result.inactive).toBe(30);
        expect(result.withOffers).toBe(45);
    });

    it('handles all zero stats', async () => {
        repo.countStats.mockResolvedValue([0, 0, 0] as never);
        const result = await service.getStats(USER_ID);
        expect(result.total).toBe(0);
        expect(result.inactive).toBe(0);
    });
});

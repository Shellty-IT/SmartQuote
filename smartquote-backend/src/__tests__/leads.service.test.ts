// src/__tests__/leads.service.test.ts

jest.mock('../repositories/leads.repository', () => ({
    leadsRepository: {
        create: jest.fn(),
        findById: jest.fn(),
        findAll: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        countByStatus: jest.fn(),
    },
}));

jest.mock('../lib/prisma', () => ({
    __esModule: true,
    default: {
        lead: { count: jest.fn() },
        client: { create: jest.fn(), findFirst: jest.fn() },
    },
}));

import { LeadsService } from '../services/leads.service';
import { leadsRepository } from '../repositories/leads.repository';
import prisma from '../lib/prisma';
import { NotFoundError } from '../errors/domain.errors';

const repo = leadsRepository as jest.Mocked<typeof leadsRepository>;
const prismaMock = prisma as unknown as {
    lead: { count: jest.Mock };
    client: { create: jest.Mock; findFirst: jest.Mock };
};

const service = new LeadsService();
const USER_ID = 'user-abc';
const LEAD_ID = 'lead-123';

const MOCK_LEAD = {
    id: LEAD_ID,
    userId: USER_ID,
    name: 'Jan Kowalski',
    status: 'NEW' as const,
    email: 'jan@example.com',
    phone: null,
    company: 'ACME',
    source: null,
    notes: null,
    clientId: null,
    client: null,
    createdAt: new Date(),
    updatedAt: new Date(),
};

beforeEach(() => jest.resetAllMocks());

// ─── create ───────────────────────────────────────────────────────────────────

describe('LeadsService.create', () => {
    it('delegates to repository and returns the created lead', async () => {
        repo.create.mockResolvedValue(MOCK_LEAD as never);
        const result = await service.create(USER_ID, { name: 'Jan Kowalski' });
        expect(repo.create).toHaveBeenCalledWith(USER_ID, { name: 'Jan Kowalski' });
        expect(result).toBe(MOCK_LEAD);
    });
});

// ─── findById ─────────────────────────────────────────────────────────────────

describe('LeadsService.findById', () => {
    it('returns lead when found', async () => {
        repo.findById.mockResolvedValue(MOCK_LEAD as never);
        const result = await service.findById(LEAD_ID, USER_ID);
        expect(result).toBe(MOCK_LEAD);
    });

    it('throws NotFoundError when lead does not exist', async () => {
        repo.findById.mockResolvedValue(null);
        await expect(service.findById(LEAD_ID, USER_ID)).rejects.toThrow(NotFoundError);
    });

    it('throws NotFoundError for foreign userId', async () => {
        repo.findById.mockResolvedValue(null);
        await expect(service.findById(LEAD_ID, 'other-user')).rejects.toThrow(NotFoundError);
    });
});

// ─── findAll ──────────────────────────────────────────────────────────────────

describe('LeadsService.findAll', () => {
    const MOCK_LIST = { leads: [MOCK_LEAD], total: 1, page: 1, limit: 20 };

    it('delegates to repository with parsed pagination', async () => {
        repo.findAll.mockResolvedValue(MOCK_LIST as never);
        await service.findAll(USER_ID, { page: '2', limit: '10' });
        expect(repo.findAll).toHaveBeenCalledWith(
            USER_ID,
            expect.objectContaining({ skip: 10, take: 10 }),
        );
    });

    it('defaults to page 1, limit 20', async () => {
        repo.findAll.mockResolvedValue(MOCK_LIST as never);
        await service.findAll(USER_ID, {});
        expect(repo.findAll).toHaveBeenCalledWith(
            USER_ID,
            expect.objectContaining({ skip: 0, take: 20 }),
        );
    });

    it('clamps limit to MAX_PAGE_LIMIT (100)', async () => {
        repo.findAll.mockResolvedValue(MOCK_LIST as never);
        await service.findAll(USER_ID, { limit: '999' });
        expect(repo.findAll).toHaveBeenCalledWith(
            USER_ID,
            expect.objectContaining({ take: 100 }),
        );
    });

    it('ignores invalid page/limit values, falls back to defaults', async () => {
        repo.findAll.mockResolvedValue(MOCK_LIST as never);
        await service.findAll(USER_ID, { page: 'abc', limit: '-5' });
        expect(repo.findAll).toHaveBeenCalledWith(
            USER_ID,
            expect.objectContaining({ skip: 0, take: 20 }),
        );
    });
});

// ─── update ───────────────────────────────────────────────────────────────────

describe('LeadsService.update', () => {
    it('updates and returns the lead when found', async () => {
        const updated = { ...MOCK_LEAD, name: 'Jan Nowak' };
        repo.findById.mockResolvedValue(MOCK_LEAD as never);
        repo.update.mockResolvedValue(updated as never);
        const result = await service.update(LEAD_ID, USER_ID, { name: 'Jan Nowak' });
        expect(repo.update).toHaveBeenCalledWith(LEAD_ID, USER_ID, { name: 'Jan Nowak' });
        expect(result).toBe(updated);
    });

    it('throws NotFoundError when lead not owned by user', async () => {
        repo.findById.mockResolvedValue(null);
        await expect(service.update(LEAD_ID, 'attacker', { name: 'X' })).rejects.toThrow(NotFoundError);
        expect(repo.update).not.toHaveBeenCalled();
    });
});

// ─── delete ───────────────────────────────────────────────────────────────────

describe('LeadsService.delete', () => {
    it('deletes the lead when found', async () => {
        repo.findById.mockResolvedValue(MOCK_LEAD as never);
        repo.delete.mockResolvedValue(MOCK_LEAD as never);
        await expect(service.delete(LEAD_ID, USER_ID)).resolves.not.toThrow();
        expect(repo.delete).toHaveBeenCalledWith(LEAD_ID, USER_ID);
    });

    it('throws NotFoundError when lead not owned by user', async () => {
        repo.findById.mockResolvedValue(null);
        await expect(service.delete(LEAD_ID, 'attacker')).rejects.toThrow(NotFoundError);
        expect(repo.delete).not.toHaveBeenCalled();
    });
});

// ─── convert ──────────────────────────────────────────────────────────────────

describe('LeadsService.convert', () => {
    const MOCK_CLIENT = { id: 'client-new', userId: USER_ID, name: 'Jan Kowalski' };

    it('creates a client and updates lead status to CONVERTED', async () => {
        repo.findById.mockResolvedValue(MOCK_LEAD as never);
        prismaMock.client.create.mockResolvedValue(MOCK_CLIENT as never);
        repo.update.mockResolvedValue({ ...MOCK_LEAD, status: 'CONVERTED', clientId: MOCK_CLIENT.id } as never);

        const result = await service.convert(LEAD_ID, USER_ID, {});

        expect(prismaMock.client.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ userId: USER_ID, name: MOCK_LEAD.name }),
            }),
        );
        expect(repo.update).toHaveBeenCalledWith(
            LEAD_ID,
            USER_ID,
            expect.objectContaining({ status: 'CONVERTED', clientId: MOCK_CLIENT.id }),
        );
        expect(result.client).toBe(MOCK_CLIENT);
        expect(result.clientId).toBe(MOCK_CLIENT.id);
    });

    it('uses provided convert data over lead defaults', async () => {
        repo.findById.mockResolvedValue(MOCK_LEAD as never);
        prismaMock.client.create.mockResolvedValue(MOCK_CLIENT as never);
        repo.update.mockResolvedValue(MOCK_LEAD as never);

        await service.convert(LEAD_ID, USER_ID, { name: 'Override Name', email: 'override@example.com' });

        expect(prismaMock.client.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ name: 'Override Name', email: 'override@example.com' }),
            }),
        );
    });

    it('throws NotFoundError when lead not found', async () => {
        repo.findById.mockResolvedValue(null);
        await expect(service.convert(LEAD_ID, USER_ID, {})).rejects.toThrow(NotFoundError);
        expect(prismaMock.client.create).not.toHaveBeenCalled();
    });

    it('returns the existing client when the lead was already converted', async () => {
        repo.findById.mockResolvedValue({ ...MOCK_LEAD, clientId: MOCK_CLIENT.id, status: 'CONVERTED' } as never);
        prismaMock.client.findFirst.mockResolvedValue(MOCK_CLIENT as never);

        const result = await service.convert(LEAD_ID, USER_ID, {});

        expect(result.clientId).toBe(MOCK_CLIENT.id);
        expect(prismaMock.client.create).not.toHaveBeenCalled();
        expect(repo.update).not.toHaveBeenCalled();
    });
});

// ─── getStats ─────────────────────────────────────────────────────────────────

describe('LeadsService.getStats', () => {
    it('returns total count and per-status breakdown', async () => {
        repo.countByStatus.mockResolvedValue({ NEW: 3, CONTACTED: 1, CONVERTED: 1, LOST: 2 } as never);

        const result = await service.getStats(USER_ID);

        expect(result.total).toBe(6);
        expect(result.byStatus.NEW).toBe(3);
        expect(repo.countByStatus).toHaveBeenCalledWith(USER_ID);
    });
});

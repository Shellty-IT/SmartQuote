// src/__tests__/search.service.test.ts
//
// Search service hits 4 Prisma models in parallel (client, offer, contract, lead).
// MemoryCache is mocked to always miss so each test exercises the full DB path.

jest.mock('../lib/cache', () => ({
    MemoryCache: jest.fn().mockImplementation(() => ({
        get: jest.fn().mockReturnValue(null),
        set: jest.fn(),
    })),
}));

jest.mock('../lib/prisma', () => ({
    __esModule: true,
    default: {
        client: { findMany: jest.fn() },
        offer: { findMany: jest.fn() },
        contract: { findMany: jest.fn() },
        lead: { findMany: jest.fn() },
    },
}));

import { searchService } from '../services/search.service';
import prisma from '../lib/prisma';

const db = prisma as unknown as {
    client: { findMany: jest.Mock };
    offer: { findMany: jest.Mock };
    contract: { findMany: jest.Mock };
    lead: { findMany: jest.Mock };
};

const USER_ID = 'user-abc';

function makeClient(id: string) {
    return { id, name: 'Kowalski', email: 'k@example.com', company: 'ACME', type: 'COMPANY' };
}
function makeOffer(id: string) {
    return { id, number: 'OFF/2026/001', title: 'Oferta', status: 'SENT', totalGross: 1000, currency: 'PLN', client: { name: 'ACME' } };
}
function makeContract(id: string) {
    return { id, number: 'UMW/2026/001', title: 'Umowa', status: 'ACTIVE', client: { name: 'ACME' } };
}
function makeLead(id: string) {
    return { id, name: 'Lead', company: 'Firma', email: 'l@example.com', status: 'NEW' };
}

beforeEach(() => {
    jest.resetAllMocks();
    db.client.findMany.mockResolvedValue([]);
    db.offer.findMany.mockResolvedValue([]);
    db.contract.findMany.mockResolvedValue([]);
    db.lead.findMany.mockResolvedValue([]);
});

// ─── basic structure ──────────────────────────────────────────────────────────

describe('SearchService.search — result shape', () => {
    it('returns all four entity arrays even when DB is empty', async () => {
        const result = await searchService.search(USER_ID, 'kowal', 5);
        expect(result).toEqual({ clients: [], offers: [], contracts: [], leads: [] });
    });

    it('maps client results correctly', async () => {
        db.client.findMany.mockResolvedValue([makeClient('c1')]);
        const result = await searchService.search(USER_ID, 'kowal', 5);
        expect(result.clients).toHaveLength(1);
        expect(result.clients[0]).toEqual(
            expect.objectContaining({ id: 'c1', name: 'Kowalski', type: 'COMPANY' }),
        );
    });

    it('maps offer results and extracts clientName from nested relation', async () => {
        db.offer.findMany.mockResolvedValue([makeOffer('o1')]);
        const result = await searchService.search(USER_ID, 'oferta', 5);
        expect(result.offers).toHaveLength(1);
        expect(result.offers[0].clientName).toBe('ACME');
        expect(result.offers[0]).not.toHaveProperty('client');
    });

    it('maps contract results and extracts clientName', async () => {
        db.contract.findMany.mockResolvedValue([makeContract('con1')]);
        const result = await searchService.search(USER_ID, 'umowa', 5);
        expect(result.contracts).toHaveLength(1);
        expect(result.contracts[0].clientName).toBe('ACME');
    });

    it('maps lead results correctly', async () => {
        db.lead.findMany.mockResolvedValue([makeLead('l1')]);
        const result = await searchService.search(USER_ID, 'lead', 5);
        expect(result.leads).toHaveLength(1);
        expect(result.leads[0]).toEqual(
            expect.objectContaining({ id: 'l1', name: 'Lead', status: 'NEW' }),
        );
    });
});

// ─── userId isolation ─────────────────────────────────────────────────────────

describe('SearchService.search — userId isolation', () => {
    it('passes userId to every prisma query', async () => {
        await searchService.search(USER_ID, 'test', 5);

        expect(db.client.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: expect.objectContaining({ userId: USER_ID }) }),
        );
        expect(db.offer.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: expect.objectContaining({ userId: USER_ID }) }),
        );
        expect(db.contract.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: expect.objectContaining({ userId: USER_ID }) }),
        );
        expect(db.lead.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: expect.objectContaining({ userId: USER_ID }) }),
        );
    });

    it('respects limit parameter for all queries', async () => {
        await searchService.search(USER_ID, 'test', 3);
        expect(db.client.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 3 }));
        expect(db.offer.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 3 }));
    });

    it('clamps an excessive limit', async () => {
        await searchService.search(USER_ID, 'test', 999999);
        expect(db.client.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 100 }));
        expect(db.lead.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 100 }));
    });

    it('normalizes whitespace in the query', async () => {
        await searchService.search(USER_ID, '  test  ', 5);
        expect(db.client.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.objectContaining({
                OR: expect.arrayContaining([{ name: { contains: 'test', mode: 'insensitive' } }]),
            }),
        }));
    });
});

// ─── graceful lead fallback ───────────────────────────────────────────────────

describe('SearchService.search — database failures', () => {
    it('propagates a lead query failure', async () => {
        db.lead.findMany.mockRejectedValue(new Error('Model not found'));
        await expect(searchService.search(USER_ID, 'kowal', 5)).rejects.toThrow('Model not found');
    });
});

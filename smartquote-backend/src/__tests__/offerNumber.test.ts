// src/__tests__/offerNumber.test.ts

// Mock Prisma before importing the module under test
jest.mock('../lib/prisma', () => ({
    __esModule: true,
    default: {
        $queryRaw: jest.fn(),
    },
}));

import prisma from '../lib/prisma';
import { generateOfferNumber } from '../utils/offerNumber';

const mockQueryRaw = prisma.$queryRaw as jest.Mock;
const YEAR = new Date().getFullYear();
const PREFIX = `OFF/${YEAR}/`;

beforeEach(() => {
    mockQueryRaw.mockReset();
});

describe('generateOfferNumber', () => {
    it('starts at 001 when no offers exist for this year', async () => {
        mockQueryRaw.mockResolvedValue([{ max_num: null }]);
        const result = await generateOfferNumber('user-1');
        expect(result).toBe(`${PREFIX}001`);
    });

    it('increments the last offer number by 1', async () => {
        mockQueryRaw.mockResolvedValue([{ max_num: 5n }]);
        const result = await generateOfferNumber('user-1');
        expect(result).toBe(`${PREFIX}006`);
    });

    it('pads the number to 3 digits', async () => {
        mockQueryRaw.mockResolvedValue([{ max_num: 9n }]);
        const result = await generateOfferNumber('user-1');
        expect(result).toBe(`${PREFIX}010`);
    });

    it('handles three-digit numbers without extra padding', async () => {
        mockQueryRaw.mockResolvedValue([{ max_num: 99n }]);
        const result = await generateOfferNumber('user-1');
        expect(result).toBe(`${PREFIX}100`);
    });

    it('handles large numbers correctly — no lexicographic ordering bug', async () => {
        mockQueryRaw.mockResolvedValue([{ max_num: 999n }]);
        const result = await generateOfferNumber('user-1');
        expect(result).toBe(`${PREFIX}1000`);
    });

    it('correctly continues from 1000 without getting stuck', async () => {
        mockQueryRaw.mockResolvedValue([{ max_num: 1000n }]);
        const result = await generateOfferNumber('user-1');
        expect(result).toBe(`${PREFIX}1001`);
    });

    it('falls back to 001 when result is empty array', async () => {
        mockQueryRaw.mockResolvedValue([]);
        const result = await generateOfferNumber('user-1');
        expect(result).toBe(`${PREFIX}001`);
    });

    it('includes correct year in the prefix', async () => {
        mockQueryRaw.mockResolvedValue([{ max_num: null }]);
        const result = await generateOfferNumber('user-1');
        expect(result).toContain(`${YEAR}`);
        expect(result).toMatch(/^OFF\/\d{4}\/\d{3,}$/);
    });
});

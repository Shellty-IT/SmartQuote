// src/__tests__/offerNumber.test.ts

// Mock Prisma before importing the module under test
jest.mock('../lib/prisma', () => ({
    __esModule: true,
    default: {
        offer: {
            findFirst: jest.fn(),
        },
    },
}));

import prisma from '../lib/prisma';
import { generateOfferNumber } from '../utils/offerNumber';

const mockFindFirst = prisma.offer.findFirst as jest.Mock;
const YEAR = new Date().getFullYear();
const PREFIX = `OFF/${YEAR}/`;

beforeEach(() => {
    mockFindFirst.mockReset();
});

describe('generateOfferNumber', () => {
    it('starts at 001 when no offers exist for this year', async () => {
        mockFindFirst.mockResolvedValue(null);
        const result = await generateOfferNumber('user-1');
        expect(result).toBe(`${PREFIX}001`);
    });

    it('increments the last offer number by 1', async () => {
        mockFindFirst.mockResolvedValue({ number: `${PREFIX}005` });
        const result = await generateOfferNumber('user-1');
        expect(result).toBe(`${PREFIX}006`);
    });

    it('pads the number to 3 digits', async () => {
        mockFindFirst.mockResolvedValue({ number: `${PREFIX}009` });
        const result = await generateOfferNumber('user-1');
        expect(result).toBe(`${PREFIX}010`);
    });

    it('handles three-digit numbers without extra padding', async () => {
        mockFindFirst.mockResolvedValue({ number: `${PREFIX}099` });
        const result = await generateOfferNumber('user-1');
        expect(result).toBe(`${PREFIX}100`);
    });

    it('handles large numbers', async () => {
        mockFindFirst.mockResolvedValue({ number: `${PREFIX}999` });
        const result = await generateOfferNumber('user-1');
        expect(result).toBe(`${PREFIX}1000`);
    });

    it('queries prisma with correct userId and year prefix', async () => {
        mockFindFirst.mockResolvedValue(null);
        await generateOfferNumber('user-abc');
        expect(mockFindFirst).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    userId: 'user-abc',
                    number: { startsWith: PREFIX },
                }),
            }),
        );
    });

    it('falls back to 001 when last number is NaN', async () => {
        mockFindFirst.mockResolvedValue({ number: `${PREFIX}abc` });
        const result = await generateOfferNumber('user-1');
        expect(result).toBe(`${PREFIX}001`);
    });

    it('includes correct year in the prefix', async () => {
        mockFindFirst.mockResolvedValue(null);
        const result = await generateOfferNumber('user-1');
        expect(result).toContain(`${YEAR}`);
        expect(result).toMatch(/^OFF\/\d{4}\/\d{3,}$/);
    });
});

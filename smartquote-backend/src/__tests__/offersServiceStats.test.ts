import { OfferStatus } from '@prisma/client';

jest.mock('../repositories/offers.repository', () => ({
    offersRepository: {
        groupByStatus: jest.fn(),
        groupByStatusValueWithoutBlocks: jest.fn(),
        findBlockOffersForStats: jest.fn(),
    },
    OffersRepository: jest.fn(),
}));

jest.mock('../services/shared/postmortem.utils', () => ({
    triggerPostMortem: jest.fn(),
}));

jest.mock('../services/email', () => ({ emailService: { sendOfferEmail: jest.fn() } }));
jest.mock('../services/settings.service', () => ({ getDecryptedSmtpConfig: jest.fn(), getUserEmailConfig: jest.fn() }));
jest.mock('../services/pdf', () => ({ pdfService: { generateOfferPDF: jest.fn() } }));
jest.mock('../utils/offerNumber', () => ({ generateOfferNumber: jest.fn().mockResolvedValue('OFF/2026/001') }));

import { offersService } from '../services/offers.service';
import { offersRepository } from '../repositories/offers.repository';

const mockedRepo = offersRepository as jest.Mocked<typeof offersRepository>;

const USER_ID = 'user-1';

describe('OffersService.getStats', () => {
    afterEach(() => jest.clearAllMocks());

    it('sums plain totalGross columns for offers without blocks (SQL path only)', async () => {
        mockedRepo.groupByStatus.mockResolvedValue([
            { status: OfferStatus.SENT, _count: { status: 2 } },
            { status: OfferStatus.ACCEPTED, _count: { status: 1 } },
        ] as never);
        mockedRepo.groupByStatusValueWithoutBlocks.mockResolvedValue([
            { status: OfferStatus.SENT, _sum: { totalGross: 300 } },
            { status: OfferStatus.ACCEPTED, _sum: { totalGross: 500 } },
        ] as never);
        mockedRepo.findBlockOffersForStats.mockResolvedValue([]);

        const result = await offersService.getStats(USER_ID);

        expect(result.total).toBe(3);
        expect(result.byStatus.SENT).toEqual({ count: 2, value: 300 });
        expect(result.byStatus.ACCEPTED).toEqual({ count: 1, value: 500 });
        expect(result.totalValue).toBe(800);
        expect(result.acceptedValue).toBe(500);
    });

    it('combines the SQL sum with normalized block-override offers for the same status', async () => {
        mockedRepo.groupByStatus.mockResolvedValue([
            { status: OfferStatus.DRAFT, _count: { status: 2 } },
        ] as never);
        mockedRepo.groupByStatusValueWithoutBlocks.mockResolvedValue([
            { status: OfferStatus.DRAFT, _sum: { totalGross: 100 } },
        ] as never);
        // One doc-template offer whose stale totalGross column (1) is overridden
        // by its block's priceOverride once normalizeOfferFromBlockTotals runs.
        mockedRepo.findBlockOffersForStats.mockResolvedValue([
            {
                status: OfferStatus.DRAFT,
                templateType: 'mobile_simple',
                blocks: { process: { priceOverride: 10000, priceType: 'net' } },
                totalNet: 1,
                totalVat: 1,
                totalGross: 1,
            },
        ] as never);

        const result = await offersService.getStats(USER_ID);

        expect(result.total).toBe(2);
        // 100 (SQL side) + 12300 gross (10000 net grossed up at 23% VAT)
        expect(result.byStatus.DRAFT).toEqual({ count: 2, value: 12400 });
        expect(result.totalValue).toBe(12400);
    });

    it('ignores block offers whose blocks carry no price override', async () => {
        mockedRepo.groupByStatus.mockResolvedValue([
            { status: OfferStatus.DRAFT, _count: { status: 1 } },
        ] as never);
        mockedRepo.groupByStatusValueWithoutBlocks.mockResolvedValue([]);
        mockedRepo.findBlockOffersForStats.mockResolvedValue([
            {
                status: OfferStatus.DRAFT,
                templateType: 'mobile_simple',
                blocks: {},
                totalNet: 200,
                totalVat: 46,
                totalGross: 246,
            },
        ] as never);

        const result = await offersService.getStats(USER_ID);

        expect(result.byStatus.DRAFT).toEqual({ count: 1, value: 246 });
    });
});

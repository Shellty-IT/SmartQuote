jest.mock('../lib/prisma', () => ({
    __esModule: true,
    default: { $queryRaw: jest.fn() },
}));

import prisma from '../lib/prisma';
import { DashboardService } from '../services/dashboard.service';

const queryRaw = prisma.$queryRaw as jest.Mock;
const service = new DashboardService();

describe('DashboardService.getSidebarStats', () => {
    beforeEach(() => queryRaw.mockReset());

    it('maps bigint database counters to JSON-safe numbers', async () => {
        queryRaw.mockResolvedValue([{
            offers: 12n,
            clients: 7n,
            contracts: 4n,
            followups: 3n,
            leads: 2n,
        }]);

        await expect(service.getSidebarStats('user-1')).resolves.toEqual({
            offers: 12,
            clients: 7,
            contracts: 4,
            followups: 3,
            leads: 2,
        });
        expect(queryRaw).toHaveBeenCalledTimes(1);
    });

    it('returns zero counters when the query produces no row', async () => {
        queryRaw.mockResolvedValue([]);

        await expect(service.getSidebarStats('user-1')).resolves.toEqual({
            offers: 0,
            clients: 0,
            contracts: 0,
            followups: 0,
            leads: 0,
        });
    });
});

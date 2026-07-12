import prisma from '../lib/prisma';

export interface SidebarStats {
    offers: number;
    clients: number;
    contracts: number;
    followups: number;
    leads: number;
}

interface SidebarStatsRow {
    offers: bigint;
    clients: bigint;
    contracts: bigint;
    followups: bigint;
    leads: bigint;
}

export class DashboardService {
    async getSidebarStats(userId: string): Promise<SidebarStats> {
        // One database round trip replaces five HTTP requests and the full
        // entity-level statistics queries. Existing user/status indexes cover it.
        const rows = await prisma.$queryRaw<SidebarStatsRow[]>`
            SELECT
                (SELECT COUNT(*) FROM "offers" WHERE "userId" = ${userId}) AS "offers",
                (SELECT COUNT(*) FROM "clients" WHERE "userId" = ${userId}) AS "clients",
                (SELECT COUNT(*) FROM "contracts" WHERE "userId" = ${userId}) AS "contracts",
                (
                    SELECT COUNT(*)
                    FROM "follow_ups"
                    WHERE "userId" = ${userId}
                      AND "status" IN ('PENDING', 'OVERDUE')
                ) AS "followups",
                (
                    SELECT COUNT(*)
                    FROM "leads"
                    WHERE "userId" = ${userId}
                      AND "status" IN ('NEW', 'CONTACTED')
                ) AS "leads"
        `;

        const row = rows[0];
        if (!row) {
            return { offers: 0, clients: 0, contracts: 0, followups: 0, leads: 0 };
        }

        return {
            offers: Number(row.offers),
            clients: Number(row.clients),
            contracts: Number(row.contracts),
            followups: Number(row.followups),
            leads: Number(row.leads),
        };
    }
}

export const dashboardService = new DashboardService();

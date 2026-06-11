// src/__tests__/alerts.service.test.ts
//
// Tests for the getAlerts function. All prisma calls are mocked so tests run
// without a real database. Each test controls exactly which DB counts/rows are
// returned to verify alert generation and Polish message formatting.

jest.mock('../lib/prisma', () => ({
    __esModule: true,
    default: {
        followUp: { count: jest.fn() },
        offer: { findMany: jest.fn(), count: jest.fn() },
        lead: { count: jest.fn() },
        contract: { count: jest.fn() },
    },
}));

import { getAlerts } from '../services/alerts.service';
import prisma from '../lib/prisma';

const db = prisma as unknown as {
    followUp: { count: jest.Mock };
    offer: { findMany: jest.Mock; count: jest.Mock };
    lead: { count: jest.Mock };
    contract: { count: jest.Mock };
};

const USER_ID = 'user-abc';

function defaultEmpty() {
    db.followUp.count.mockResolvedValue(0);
    db.offer.findMany.mockResolvedValue([]);
    db.offer.count.mockResolvedValue(0);
    db.lead.count.mockResolvedValue(0);
    db.contract.count.mockResolvedValue(0);
}

function makeExpiringOffer(daysFromNow: number) {
    const validUntil = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
    return { id: `offer-${daysFromNow}`, number: `OFF/2026/00${daysFromNow}`, title: 'Oferta testowa', validUntil };
}

beforeEach(() => {
    jest.resetAllMocks();
    defaultEmpty();
});

// ─── no alerts ────────────────────────────────────────────────────────────────

describe('getAlerts — no conditions met', () => {
    it('returns empty array when all counts are zero', async () => {
        const alerts = await getAlerts(USER_ID);
        expect(alerts).toEqual([]);
    });
});

// ─── overdue follow-ups ───────────────────────────────────────────────────────

describe('getAlerts — overdue_followup', () => {
    it('generates alert when there are overdue follow-ups', async () => {
        db.followUp.count.mockResolvedValue(3);
        const alerts = await getAlerts(USER_ID);
        const alert = alerts.find((a) => a.type === 'overdue_followup');
        expect(alert).toBeDefined();
        expect(alert!.priority).toBe('high');
        expect(alert!.id).toBe(`overdue_followup:${USER_ID}`);
        expect(alert!.count).toBe(3);
    });

    it('uses singular form for exactly 1 follow-up', async () => {
        db.followUp.count.mockResolvedValue(1);
        const alerts = await getAlerts(USER_ID);
        const alert = alerts.find((a) => a.type === 'overdue_followup')!;
        expect(alert.message).toBe('1 follow-up oczekuje na wykonanie');
    });

    it('uses plural form for more than 1 follow-up', async () => {
        db.followUp.count.mockResolvedValue(5);
        const alerts = await getAlerts(USER_ID);
        const alert = alerts.find((a) => a.type === 'overdue_followup')!;
        expect(alert.message).toBe('5 follow-upów oczekuje na wykonanie');
    });

    it('does not generate alert when count is 0', async () => {
        db.followUp.count.mockResolvedValue(0);
        const alerts = await getAlerts(USER_ID);
        expect(alerts.find((a) => a.type === 'overdue_followup')).toBeUndefined();
    });
});

// ─── expiring offers ──────────────────────────────────────────────────────────

describe('getAlerts — expiring_offer', () => {
    it('generates one alert per expiring offer', async () => {
        db.offer.findMany.mockResolvedValue([makeExpiringOffer(5), makeExpiringOffer(3)]);
        const alerts = await getAlerts(USER_ID);
        expect(alerts.filter((a) => a.type === 'expiring_offer')).toHaveLength(2);
    });

    it('assigns priority "high" when offer expires in ≤ 2 days', async () => {
        db.offer.findMany.mockResolvedValue([makeExpiringOffer(1)]);
        const alerts = await getAlerts(USER_ID);
        const alert = alerts.find((a) => a.type === 'expiring_offer')!;
        expect(alert.priority).toBe('high');
    });

    it('assigns priority "medium" when offer expires in > 2 days', async () => {
        db.offer.findMany.mockResolvedValue([makeExpiringOffer(5)]);
        const alerts = await getAlerts(USER_ID);
        const alert = alerts.find((a) => a.type === 'expiring_offer')!;
        expect(alert.priority).toBe('medium');
    });

    it('includes offer number in message', async () => {
        db.offer.findMany.mockResolvedValue([makeExpiringOffer(3)]);
        const alerts = await getAlerts(USER_ID);
        const alert = alerts.find((a) => a.type === 'expiring_offer')!;
        expect(alert.message).toContain('OFF/2026/003');
    });

    it('action path links to the specific offer', async () => {
        db.offer.findMany.mockResolvedValue([makeExpiringOffer(3)]);
        const alerts = await getAlerts(USER_ID);
        const alert = alerts.find((a) => a.type === 'expiring_offer')!;
        expect(alert.action.path).toBe(`/dashboard/offers/offer-3`);
    });
});

// ─── stale drafts ─────────────────────────────────────────────────────────────

describe('getAlerts — stale_draft', () => {
    it('generates alert when there are stale drafts', async () => {
        db.offer.count.mockResolvedValue(2);
        const alerts = await getAlerts(USER_ID);
        const alert = alerts.find((a) => a.type === 'stale_draft');
        expect(alert).toBeDefined();
        expect(alert!.priority).toBe('low');
        expect(alert!.count).toBe(2);
    });

    it('singular message for 1 draft', async () => {
        db.offer.count.mockResolvedValue(1);
        const alerts = await getAlerts(USER_ID);
        const alert = alerts.find((a) => a.type === 'stale_draft')!;
        expect(alert.message).toContain('1 szkic');
    });
});

// ─── new leads ────────────────────────────────────────────────────────────────

describe('getAlerts — new_lead', () => {
    it('generates alert when there are new leads', async () => {
        db.lead.count.mockResolvedValue(4);
        const alerts = await getAlerts(USER_ID);
        const alert = alerts.find((a) => a.type === 'new_lead');
        expect(alert).toBeDefined();
        expect(alert!.priority).toBe('medium');
        expect(alert!.count).toBe(4);
    });

    it('singular form for 1 lead', async () => {
        db.lead.count.mockResolvedValue(1);
        const alerts = await getAlerts(USER_ID);
        const alert = alerts.find((a) => a.type === 'new_lead')!;
        expect(alert.message).toContain('1 nowy lead');
    });
});

// ─── unsigned contracts ───────────────────────────────────────────────────────

describe('getAlerts — unsigned_contract', () => {
    it('generates alert when there are unsigned contracts', async () => {
        db.contract.count.mockResolvedValue(2);
        const alerts = await getAlerts(USER_ID);
        const alert = alerts.find((a) => a.type === 'unsigned_contract');
        expect(alert).toBeDefined();
        expect(alert!.priority).toBe('medium');
        expect(alert!.id).toBe(`unsigned_contract:${USER_ID}`);
    });

    it('singular form for 1 contract', async () => {
        db.contract.count.mockResolvedValue(1);
        const alerts = await getAlerts(USER_ID);
        const alert = alerts.find((a) => a.type === 'unsigned_contract')!;
        expect(alert.message).toContain('czeka');
    });
});

// ─── sorting ──────────────────────────────────────────────────────────────────

describe('getAlerts — priority sorting', () => {
    it('orders alerts: high → medium → low', async () => {
        db.followUp.count.mockResolvedValue(2);   // high
        db.lead.count.mockResolvedValue(1);       // medium
        db.offer.count.mockResolvedValue(3);      // low

        const alerts = await getAlerts(USER_ID);

        const priorities = alerts.map((a) => a.priority);
        const sortedPriorities = [...priorities].sort((a, b) => {
            const order = { high: 0, medium: 1, low: 2 };
            return order[a] - order[b];
        });
        expect(priorities).toEqual(sortedPriorities);
    });

    it('high-priority expiring offer (≤2 days) appears before medium alerts', async () => {
        db.offer.findMany.mockResolvedValue([makeExpiringOffer(1)]);  // high
        db.lead.count.mockResolvedValue(2);                           // medium

        const alerts = await getAlerts(USER_ID);
        const types = alerts.map((a) => a.type);
        expect(types.indexOf('expiring_offer')).toBeLessThan(types.indexOf('new_lead'));
    });
});

import { describe, expect, it } from 'vitest';
import { mapSidebarStats } from '@/hooks/useSidebarStats';
import { affectsSidebarStats } from '@/lib/data-mutation-events';

describe('mapSidebarStats', () => {
    it('keeps counters undefined during the initial load', () => {
        expect(mapSidebarStats(undefined, true)).toEqual({
            offers: undefined,
            clients: undefined,
            contracts: undefined,
            followups: undefined,
            leads: undefined,
        });
    });

    it('maps the aggregate response without recomputing or double-counting statuses', () => {
        expect(mapSidebarStats({
            offers: 8,
            clients: 5,
            contracts: 3,
            followups: 2,
            leads: 1,
        }, false)).toEqual({
            offers: 8,
            clients: 5,
            contracts: 3,
            followups: 2,
            leads: 1,
        });
    });

    it('falls back to zero after a completed empty response', () => {
        expect(mapSidebarStats(undefined, false).offers).toBe(0);
    });
});

describe('affectsSidebarStats', () => {
    it('refreshes after direct entity mutations from any screen', () => {
        expect(affectsSidebarStats({ endpoint: '/leads/123/convert', method: 'POST' })).toBe(true);
        expect(affectsSidebarStats({ endpoint: '/offers/123', method: 'DELETE' })).toBe(true);
    });

    it('ignores reads and unrelated settings changes', () => {
        expect(affectsSidebarStats({ endpoint: '/offers', method: 'GET' })).toBe(false);
        expect(affectsSidebarStats({ endpoint: '/settings/profile', method: 'PUT' })).toBe(false);
    });
});

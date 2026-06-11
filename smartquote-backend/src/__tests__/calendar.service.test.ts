// src/__tests__/calendar.service.test.ts

jest.mock('../repositories/calendar.repository', () => ({
    calendarRepository: {
        create: jest.fn(),
        findById: jest.fn(),
        findAll: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
}));

import { CalendarService } from '../services/calendar.service';
import { calendarRepository } from '../repositories/calendar.repository';
import { NotFoundError } from '../errors/domain.errors';

const repo = calendarRepository as jest.Mocked<typeof calendarRepository>;
const service = new CalendarService();
const USER_ID = 'user-abc';
const EVENT_ID = 'event-123';

const MOCK_EVENT = {
    id: EVENT_ID,
    userId: USER_ID,
    title: 'Spotkanie z klientem',
    description: null,
    startAt: new Date('2026-06-15T10:00:00Z'),
    endAt: new Date('2026-06-15T11:00:00Z'),
    allDay: false,
    color: 'blue',
    clientId: null,
    offerId: null,
    leadId: null,
    client: null,
    offer: null,
    lead: null,
    createdAt: new Date(),
    updatedAt: new Date(),
};

beforeEach(() => jest.resetAllMocks());

// ─── create ───────────────────────────────────────────────────────────────────

describe('CalendarService.create', () => {
    it('delegates to repository and returns the created event', async () => {
        repo.create.mockResolvedValue(MOCK_EVENT as never);
        const input = { title: 'Spotkanie z klientem', startAt: '2026-06-15T10:00:00Z' };
        const result = await service.create(USER_ID, input);
        expect(repo.create).toHaveBeenCalledWith(USER_ID, input);
        expect(result).toBe(MOCK_EVENT);
    });
});

// ─── findById ─────────────────────────────────────────────────────────────────

describe('CalendarService.findById', () => {
    it('returns event when found', async () => {
        repo.findById.mockResolvedValue(MOCK_EVENT as never);
        const result = await service.findById(EVENT_ID, USER_ID);
        expect(result).toBe(MOCK_EVENT);
        expect(repo.findById).toHaveBeenCalledWith(EVENT_ID, USER_ID);
    });

    it('throws NotFoundError when event does not exist', async () => {
        repo.findById.mockResolvedValue(null);
        await expect(service.findById(EVENT_ID, USER_ID)).rejects.toThrow(NotFoundError);
    });

    it('throws NotFoundError for foreign userId', async () => {
        repo.findById.mockResolvedValue(null);
        await expect(service.findById(EVENT_ID, 'attacker')).rejects.toThrow(NotFoundError);
    });
});

// ─── findAll ──────────────────────────────────────────────────────────────────

describe('CalendarService.findAll', () => {
    it('delegates to repository with filter', async () => {
        repo.findAll.mockResolvedValue([MOCK_EVENT] as never);
        const filter = { from: '2026-06-01', to: '2026-06-30' };
        const result = await service.findAll(USER_ID, filter);
        expect(repo.findAll).toHaveBeenCalledWith(USER_ID, filter);
        expect(result).toHaveLength(1);
    });

    it('passes empty filter through unchanged', async () => {
        repo.findAll.mockResolvedValue([] as never);
        await service.findAll(USER_ID, {});
        expect(repo.findAll).toHaveBeenCalledWith(USER_ID, {});
    });
});

// ─── update ───────────────────────────────────────────────────────────────────

describe('CalendarService.update', () => {
    it('updates and returns the event when found', async () => {
        const updated = { ...MOCK_EVENT, title: 'Zmodyfikowane spotkanie' };
        repo.findById.mockResolvedValue(MOCK_EVENT as never);
        repo.update.mockResolvedValue(updated as never);

        const result = await service.update(EVENT_ID, USER_ID, { title: 'Zmodyfikowane spotkanie' });

        expect(repo.findById).toHaveBeenCalledWith(EVENT_ID, USER_ID);
        expect(repo.update).toHaveBeenCalledWith(EVENT_ID, USER_ID, { title: 'Zmodyfikowane spotkanie' });
        expect(result).toBe(updated);
    });

    it('throws NotFoundError when event not owned by user', async () => {
        repo.findById.mockResolvedValue(null);
        await expect(
            service.update(EVENT_ID, 'attacker', { title: 'X' }),
        ).rejects.toThrow(NotFoundError);
        expect(repo.update).not.toHaveBeenCalled();
    });
});

// ─── delete ───────────────────────────────────────────────────────────────────

describe('CalendarService.delete', () => {
    it('deletes the event when found', async () => {
        repo.findById.mockResolvedValue(MOCK_EVENT as never);
        repo.delete.mockResolvedValue(true as never);

        await expect(service.delete(EVENT_ID, USER_ID)).resolves.not.toThrow();
        expect(repo.findById).toHaveBeenCalledWith(EVENT_ID, USER_ID);
        expect(repo.delete).toHaveBeenCalledWith(EVENT_ID, USER_ID);
    });

    it('throws NotFoundError when event not owned by user', async () => {
        repo.findById.mockResolvedValue(null);
        await expect(service.delete(EVENT_ID, 'attacker')).rejects.toThrow(NotFoundError);
        expect(repo.delete).not.toHaveBeenCalled();
    });
});

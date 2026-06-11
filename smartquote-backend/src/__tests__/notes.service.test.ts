// src/__tests__/notes.service.test.ts

jest.mock('../repositories/notes.repository', () => ({
    notesRepository: {
        create: jest.fn(),
        findById: jest.fn(),
        findByEntity: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
}));

import { NotesService } from '../services/notes.service';
import { notesRepository } from '../repositories/notes.repository';
import { NotFoundError } from '../errors/domain.errors';

const repo = notesRepository as jest.Mocked<typeof notesRepository>;
const service = new NotesService();
const USER_ID = 'user-abc';
const NOTE_ID = 'note-123';

const MOCK_NOTE = {
    id: NOTE_ID,
    userId: USER_ID,
    content: 'Ważna notatka',
    clientId: 'client-1',
    offerId: null,
    contractId: null,
    leadId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
};

beforeEach(() => jest.resetAllMocks());

// ─── create ───────────────────────────────────────────────────────────────────

describe('NotesService.create', () => {
    it('delegates to repository with userId and data', async () => {
        repo.create.mockResolvedValue(MOCK_NOTE as never);
        const input = { content: 'Ważna notatka', clientId: 'client-1' };
        const result = await service.create(USER_ID, input);
        expect(repo.create).toHaveBeenCalledWith(USER_ID, input);
        expect(result).toBe(MOCK_NOTE);
    });
});

// ─── findByEntity ─────────────────────────────────────────────────────────────

describe('NotesService.findByEntity', () => {
    it('returns notes for a given client', async () => {
        repo.findByEntity.mockResolvedValue([MOCK_NOTE] as never);
        const result = await service.findByEntity(USER_ID, { clientId: 'client-1' });
        expect(repo.findByEntity).toHaveBeenCalledWith(USER_ID, { clientId: 'client-1' });
        expect(result).toHaveLength(1);
    });

    it('passes offerId filter through', async () => {
        repo.findByEntity.mockResolvedValue([] as never);
        await service.findByEntity(USER_ID, { offerId: 'offer-1' });
        expect(repo.findByEntity).toHaveBeenCalledWith(USER_ID, { offerId: 'offer-1' });
    });
});

// ─── update ───────────────────────────────────────────────────────────────────

describe('NotesService.update', () => {
    it('updates content when note is found', async () => {
        const updated = { ...MOCK_NOTE, content: 'Zaktualizowana notatka' };
        repo.findById.mockResolvedValue(MOCK_NOTE as never);
        repo.update.mockResolvedValue(updated as never);

        const result = await service.update(NOTE_ID, USER_ID, 'Zaktualizowana notatka');

        expect(repo.findById).toHaveBeenCalledWith(NOTE_ID, USER_ID);
        expect(repo.update).toHaveBeenCalledWith(NOTE_ID, USER_ID, 'Zaktualizowana notatka');
        expect(result).toBe(updated);
    });

    it('throws NotFoundError when note does not exist', async () => {
        repo.findById.mockResolvedValue(null);
        await expect(service.update(NOTE_ID, USER_ID, 'nowa treść')).rejects.toThrow(NotFoundError);
        expect(repo.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundError for foreign userId', async () => {
        repo.findById.mockResolvedValue(null);
        await expect(service.update(NOTE_ID, 'attacker', 'inject')).rejects.toThrow(NotFoundError);
    });
});

// ─── delete ───────────────────────────────────────────────────────────────────

describe('NotesService.delete', () => {
    it('succeeds when repository confirms deletion', async () => {
        repo.delete.mockResolvedValue(true as never);
        await expect(service.delete(NOTE_ID, USER_ID)).resolves.not.toThrow();
        expect(repo.delete).toHaveBeenCalledWith(NOTE_ID, USER_ID);
    });

    it('throws NotFoundError when repository returns false (not owned / not found)', async () => {
        repo.delete.mockResolvedValue(false as never);
        await expect(service.delete(NOTE_ID, 'attacker')).rejects.toThrow(NotFoundError);
    });
});

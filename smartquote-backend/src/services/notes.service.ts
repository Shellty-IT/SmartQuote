// src/services/notes.service.ts
import { notesRepository, NotesEntityFilter } from '../repositories/notes.repository';
import { NotFoundError } from '../errors/domain.errors';
import { createModuleLogger } from '../lib/logger';
import type { CreateNoteInput } from '../types';

const logger = createModuleLogger('NotesService');

export class NotesService {
    async create(userId: string, data: CreateNoteInput) {
        logger.info('Creating note', { userId });
        return notesRepository.create(userId, data);
    }

    async findByEntity(userId: string, filter: NotesEntityFilter) {
        return notesRepository.findByEntity(userId, filter);
    }

    async update(id: string, userId: string, content: string) {
        const existing = await notesRepository.findById(id, userId);
        if (!existing) throw new NotFoundError('Note');
        return notesRepository.update(id, userId, content);
    }

    async delete(id: string, userId: string) {
        const deleted = await notesRepository.delete(id, userId);
        if (!deleted) throw new NotFoundError('Note');
    }
}

export const notesService = new NotesService();

// src/repositories/notes.repository.ts
import prisma from '../lib/prisma';
import type { CreateNoteInput } from '../types';

export interface NotesEntityFilter {
    clientId?: string;
    offerId?: string;
    contractId?: string;
    leadId?: string;
}

export class NotesRepository {
    async create(userId: string, data: CreateNoteInput) {
        return prisma.note.create({
            data: {
                userId,
                content: data.content,
                clientId: data.clientId ?? null,
                offerId: data.offerId ?? null,
                contractId: data.contractId ?? null,
                leadId: data.leadId ?? null,
            },
        });
    }

    async findById(id: string, userId: string) {
        return prisma.note.findFirst({
            where: { id, userId },
        });
    }

    async findByEntity(userId: string, filter: NotesEntityFilter) {
        const where: Record<string, unknown> = { userId };

        if (filter.clientId) where.clientId = filter.clientId;
        if (filter.offerId) where.offerId = filter.offerId;
        if (filter.contractId) where.contractId = filter.contractId;
        if (filter.leadId) where.leadId = filter.leadId;

        return prisma.note.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: { name: true, email: true },
                },
            },
        });
    }

    async update(id: string, userId: string, content: string) {
        return prisma.$transaction(async (tx) => {
            const record = await tx.note.findFirst({ where: { id, userId }, select: { id: true } });
            if (!record) return null;
            return tx.note.update({ where: { id }, data: { content } });
        });
    }

    async delete(id: string, userId: string): Promise<boolean> {
        const result = await prisma.note.deleteMany({ where: { id, userId } });
        return result.count > 0;
    }
}

export const notesRepository = new NotesRepository();

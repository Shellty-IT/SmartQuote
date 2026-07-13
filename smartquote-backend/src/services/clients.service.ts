// src/services/clients.service.ts
import { ClientType } from '@prisma/client';
import { clientsRepository, ClientsFilter } from '../repositories/clients.repository';
import { ConflictError, NotFoundError } from '../errors/domain.errors';
import { hasPrismaCode } from '../utils/prismaErrors';
import type { CreateClientInput, UpdateClientInput, PaginationQuery } from '../types';

const MAX_PAGE_LIMIT = 100;
const DEFAULT_PAGE_LIMIT = 20;

function parsePage(raw: string | undefined): number {
    const n = parseInt(raw ?? '1', 10);
    return Number.isNaN(n) || n < 1 ? 1 : n;
}

function parseLimit(raw: string | undefined): number {
    const n = parseInt(raw ?? String(DEFAULT_PAGE_LIMIT), 10);
    if (Number.isNaN(n) || n < 1) return DEFAULT_PAGE_LIMIT;
    return Math.min(n, MAX_PAGE_LIMIT);
}

type ListClientsQuery = PaginationQuery & {
    type?: string;
    isActive?: string;
};

export class ClientsService {
    async create(userId: string, data: CreateClientInput) {
        return clientsRepository.create(userId, data);
    }

    async findById(id: string, userId: string) {
        return clientsRepository.findById(id, userId);
    }

    async findAll(userId: string, query: ListClientsQuery) {
        const page = parsePage(query.page);
        const limit = parseLimit(query.limit);
        const skip = (page - 1) * limit;

        const filter: ClientsFilter = {
            userId,
            skip,
            take: limit,
            search: query.search,
            type: query.type as ClientType | undefined,
            isActive: query.isActive !== undefined ? query.isActive === 'true' : undefined,
            sortBy: (query.sortBy as ClientsFilter['sortBy']) ?? 'createdAt',
            sortOrder: query.sortOrder ?? 'desc',
        };

        const [clients, total] = await Promise.all([
            clientsRepository.findMany(filter),
            clientsRepository.count(filter),
        ]);

        return { clients, total, page, limit };
    }

    async update(id: string, userId: string, data: UpdateClientInput) {
        const result = await clientsRepository.update(id, userId, data);
        if (!result) throw new NotFoundError('Klient');
        return result;
    }

    async delete(id: string, userId: string) {
        try {
            const deleted = await clientsRepository.delete(id, userId);
            if (!deleted) throw new NotFoundError('Klient');
        } catch (error: unknown) {
            if (hasPrismaCode(error, 'P2003')) {
                throw new ConflictError('Nie moĹĽna usunÄ…Ä‡ klienta powiÄ…zanego z ofertÄ… lub umowÄ…');
            }
            throw error;
        }
    }

    async getStats(userId: string) {
        const [total, active, withOffers] = await clientsRepository.countStats(userId);
        return { total, active, inactive: total - active, withOffers };
    }
}

export const clientsService = new ClientsService();

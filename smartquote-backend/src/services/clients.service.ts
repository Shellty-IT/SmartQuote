// src/services/clients.service.ts
import { ClientType } from '@prisma/client';
import { clientsRepository, ClientsFilter } from '../repositories/clients.repository';
import { NotFoundError } from '../errors/domain.errors';
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
        const exists = await clientsRepository.existsForUser(id, userId);
        if (!exists) throw new NotFoundError('Klient');
        return clientsRepository.update(id, data);
    }

    async delete(id: string, userId: string) {
        const exists = await clientsRepository.existsForUser(id, userId);
        if (!exists) throw new NotFoundError('Klient');
        return clientsRepository.delete(id);
    }

    async getStats(userId: string) {
        const [total, active, withOffers] = await clientsRepository.countStats(userId);
        return { total, active, inactive: total - active, withOffers };
    }
}

export const clientsService = new ClientsService();

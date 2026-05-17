// src/repositories/clients.repository.ts
import { Prisma, ClientType } from '@prisma/client';
import prisma from '../lib/prisma';
import type { CreateClientInput, UpdateClientInput } from '../types';

export interface ClientsFilter {
    userId: string;
    search?: string;
    type?: ClientType;
    isActive?: boolean;
    sortBy?: 'name' | 'createdAt' | 'updatedAt';
    sortOrder?: 'asc' | 'desc';
    skip: number;
    take: number;
}

const CLIENT_WITH_COUNT = {
    _count: {
        select: { offers: true, followUps: true },
    },
} satisfies Prisma.ClientInclude;

export const clientsRepository = {
    create(userId: string, data: CreateClientInput) {
        return prisma.client.create({
            data: { ...data, userId },
        });
    },

    findById(id: string, userId: string) {
        return prisma.client.findFirst({
            where: { id, userId },
            include: CLIENT_WITH_COUNT,
        });
    },

    findMany(filter: ClientsFilter) {
        const where = buildWhereClause(filter);
        const orderBy = buildOrderBy(filter.sortBy, filter.sortOrder);

        return prisma.client.findMany({
            where,
            orderBy,
            skip: filter.skip,
            take: filter.take,
            include: {
                _count: { select: { offers: true } },
            },
        });
    },

    count(filter: Pick<ClientsFilter, 'userId' | 'search' | 'type' | 'isActive'>) {
        return prisma.client.count({ where: buildWhereClause(filter) });
    },

    update(id: string, data: UpdateClientInput) {
        return prisma.client.update({
            where: { id },
            data,
        });
    },

    delete(id: string) {
        return prisma.client.delete({ where: { id } });
    },

    existsForUser(id: string, userId: string): Promise<boolean> {
        return prisma.client
            .findFirst({ where: { id, userId }, select: { id: true } })
            .then(Boolean);
    },

    countStats(userId: string) {
        return Promise.all([
            prisma.client.count({ where: { userId } }),
            prisma.client.count({ where: { userId, isActive: true } }),
            prisma.client.count({ where: { userId, offers: { some: {} } } }),
        ]);
    },
};

function buildWhereClause(
    filter: Pick<ClientsFilter, 'userId' | 'search' | 'type' | 'isActive'>,
): Prisma.ClientWhereInput {
    const where: Prisma.ClientWhereInput = { userId: filter.userId };

    if (filter.search) {
        where.OR = [
            { name: { contains: filter.search, mode: 'insensitive' } },
            { email: { contains: filter.search, mode: 'insensitive' } },
            { company: { contains: filter.search, mode: 'insensitive' } },
            { nip: { contains: filter.search } },
        ];
    }

    if (filter.type !== undefined) {
        where.type = filter.type;
    }

    if (filter.isActive !== undefined) {
        where.isActive = filter.isActive;
    }

    return where;
}

function buildOrderBy(
    sortBy: ClientsFilter['sortBy'] = 'createdAt',
    sortOrder: ClientsFilter['sortOrder'] = 'desc',
): Prisma.ClientOrderByWithRelationInput {
    return { [sortBy]: sortOrder };
}

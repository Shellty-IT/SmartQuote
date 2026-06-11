// src/repositories/leads.repository.ts
import prisma from '../lib/prisma';
import type { CreateLeadInput, UpdateLeadInput, LeadStatus } from '../types';
import { LeadStatus as PrismaLeadStatus } from '@prisma/client';

export interface LeadsFilter {
    userId: string;
    skip?: number;
    take?: number;
    search?: string;
    status?: LeadStatus;
    sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'status';
    sortOrder?: 'asc' | 'desc';
}

export class LeadsRepository {
    async create(userId: string, data: CreateLeadInput) {
        return prisma.lead.create({
            data: {
                userId,
                name: data.name,
                company: data.company ?? null,
                email: data.email ?? null,
                phone: data.phone ?? null,
                source: data.source ?? null,
                notes: data.notes ?? null,
            },
        });
    }

    async findById(id: string, userId: string) {
        return prisma.lead.findFirst({
            where: { id, userId },
            include: {
                client: {
                    select: { id: true, name: true, email: true },
                },
            },
        });
    }

    async findAll(userId: string, filter: LeadsFilter): Promise<{
        leads: Awaited<ReturnType<typeof prisma.lead.findMany>>;
        total: number;
        page: number;
        limit: number;
    }> {
        const take = filter.take ?? 20;
        const skip = filter.skip ?? 0;
        const page = Math.floor(skip / take) + 1;

        const where = {
            userId,
            ...(filter.status ? { status: filter.status as PrismaLeadStatus } : {}),
            ...(filter.search
                ? {
                      OR: [
                          { name: { contains: filter.search, mode: 'insensitive' as const } },
                          { company: { contains: filter.search, mode: 'insensitive' as const } },
                          { email: { contains: filter.search, mode: 'insensitive' as const } },
                      ],
                  }
                : {}),
        };

        const orderBy = filter.sortBy
            ? { [filter.sortBy]: filter.sortOrder ?? 'desc' }
            : { createdAt: 'desc' as const };

        const [leads, total] = await Promise.all([
            prisma.lead.findMany({
                where,
                orderBy,
                skip,
                take,
                include: {
                    client: { select: { id: true, name: true, email: true } },
                },
            }),
            prisma.lead.count({ where }),
        ]);

        return { leads, total, page, limit: take };
    }

    async update(id: string, userId: string, data: UpdateLeadInput) {
        return prisma.$transaction(async (tx) => {
            const record = await tx.lead.findFirst({ where: { id, userId }, select: { id: true } });
            if (!record) return null;
            return tx.lead.update({
                where: { id },
                data: {
                    ...(data.name !== undefined ? { name: data.name } : {}),
                    ...(data.company !== undefined ? { company: data.company } : {}),
                    ...(data.email !== undefined ? { email: data.email } : {}),
                    ...(data.phone !== undefined ? { phone: data.phone } : {}),
                    ...(data.source !== undefined ? { source: data.source } : {}),
                    ...(data.notes !== undefined ? { notes: data.notes } : {}),
                    ...(data.status !== undefined ? { status: data.status as PrismaLeadStatus } : {}),
                    ...(data.clientId !== undefined ? { clientId: data.clientId } : {}),
                },
            });
        });
    }

    async delete(id: string, userId: string) {
        // Verify ownership before deleting
        const lead = await prisma.lead.findFirst({ where: { id, userId } });
        if (!lead) return null;
        return prisma.lead.delete({ where: { id } });
    }

    async countByStatus(userId: string): Promise<Record<LeadStatus, number>> {
        const counts = await prisma.lead.groupBy({
            by: ['status'],
            where: { userId },
            _count: { id: true },
        });

        const result: Record<LeadStatus, number> = {
            NEW: 0,
            CONTACTED: 0,
            CONVERTED: 0,
            LOST: 0,
        };

        for (const row of counts) {
            result[row.status as LeadStatus] = row._count.id;
        }

        return result;
    }
}

export const leadsRepository = new LeadsRepository();

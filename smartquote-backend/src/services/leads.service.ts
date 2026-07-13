// src/services/leads.service.ts
import prisma from '../lib/prisma';
import { leadsRepository, LeadsFilter } from '../repositories/leads.repository';
import { ConflictError, NotFoundError } from '../errors/domain.errors';
import { hasPrismaCode } from '../utils/prismaErrors';
import { createModuleLogger } from '../lib/logger';
import type { CreateLeadInput, UpdateLeadInput, ConvertLeadInput, LeadStatus } from '../types';

const logger = createModuleLogger('LeadsService');

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

type ListLeadsQuery = {
    page?: string;
    limit?: string;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
};

export class LeadsService {
    async create(userId: string, data: CreateLeadInput) {
        logger.info('Creating lead', { userId, name: data.name });
        return leadsRepository.create(userId, data);
    }

    async findById(id: string, userId: string) {
        const lead = await leadsRepository.findById(id, userId);
        if (!lead) throw new NotFoundError('Lead');
        return lead;
    }

    async findAll(userId: string, query: ListLeadsQuery) {
        const page = parsePage(query.page);
        const limit = parseLimit(query.limit);
        const skip = (page - 1) * limit;

        const filter: LeadsFilter = {
            userId,
            skip,
            take: limit,
            search: query.search,
            status: query.status as LeadStatus | undefined,
            sortBy: query.sortBy as LeadsFilter['sortBy'],
            sortOrder: query.sortOrder,
        };

        return leadsRepository.findAll(userId, filter);
    }

    async update(id: string, userId: string, data: UpdateLeadInput) {
        const existing = await leadsRepository.findById(id, userId);
        if (!existing) throw new NotFoundError('Lead');
        return leadsRepository.update(id, userId, data);
    }

    async delete(id: string, userId: string) {
        const existing = await leadsRepository.findById(id, userId);
        if (!existing) throw new NotFoundError('Lead');
        try {
            return await leadsRepository.delete(id, userId);
        } catch (error: unknown) {
            if (hasPrismaCode(error, 'P2003')) {
                throw new ConflictError('Nie moĹĽna usunÄ…Ä‡ leada powiÄ…zanego z ofertÄ…');
            }
            throw error;
        }
    }

    async convert(id: string, userId: string, data: ConvertLeadInput) {
        const lead = await leadsRepository.findById(id, userId);
        if (!lead) throw new NotFoundError('Lead');

        // Retrying a conversion must not create duplicate clients.
        if (lead.clientId) {
            const client = await prisma.client.findFirst({
                where: { id: lead.clientId, userId },
            });
            if (client) return { clientId: client.id, lead, client };
        }

        logger.info('Converting lead to client', { leadId: id, userId });

        const client = await prisma.client.create({
            data: {
                userId,
                name: data.name ?? lead.name,
                email: data.email !== undefined ? data.email : lead.email,
                phone: data.phone !== undefined ? data.phone : lead.phone,
                company: data.company !== undefined ? data.company : lead.company,
                nip: data.nip ?? null,
            },
        });

        const updatedLead = await leadsRepository.update(id, userId, {
            status: 'CONVERTED',
            clientId: client.id,
        });

        return { clientId: client.id, lead: updatedLead, client };
    }

    async getStats(userId: string) {
        const byStatus = await leadsRepository.countByStatus(userId);
        // Converted leads are now clients — exclude them so "total" matches the leads list.
        const total = byStatus.NEW + byStatus.CONTACTED + byStatus.LOST;

        return { total, byStatus };
    }
}

export const leadsService = new LeadsService();

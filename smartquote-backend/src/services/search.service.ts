// src/services/search.service.ts
import prisma from '../lib/prisma';
import { MemoryCache } from '../lib/cache';
const searchCache = new MemoryCache(200);

export interface SearchResult {
    clients: {
        id: string;
        name: string;
        email: string | null;
        company: string | null;
        type: string;
    }[];
    offers: {
        id: string;
        number: string;
        title: string;
        status: string;
        totalGross: unknown;
        currency: string;
        clientName: string;
    }[];
    contracts: {
        id: string;
        number: string;
        title: string;
        status: string;
        clientName: string;
    }[];
    leads: {
        id: string;
        name: string;
        company: string | null;
        email: string | null;
        status: string;
    }[];
}

export class SearchService {
    async search(userId: string, q: string, limit: number): Promise<SearchResult> {
        const normalizedQuery = q.trim();
        const take = Math.max(1, Math.min(Math.trunc(limit) || 10, 100));
        const cacheKey = `search:${userId}:${normalizedQuery.toLocaleLowerCase('pl-PL')}:${take}`;
        const cached = searchCache.get<SearchResult>(cacheKey);
        if (cached) return cached;

        const mode = 'insensitive' as const;

        const [clients, offers, contracts, leads] = await Promise.all([
            prisma.client.findMany({
                where: {
                    userId,
                    OR: [
                        { name: { contains: normalizedQuery, mode } },
                        { nip: { contains: normalizedQuery, mode } },
                        { email: { contains: normalizedQuery, mode } },
                    ],
                },
                select: { id: true, name: true, email: true, company: true, type: true },
                take,
            }),
            prisma.offer.findMany({
                where: {
                    userId,
                    OR: [
                        { title: { contains: normalizedQuery, mode } },
                        { number: { contains: normalizedQuery, mode } },
                    ],
                },
                select: {
                    id: true,
                    number: true,
                    title: true,
                    status: true,
                    totalGross: true,
                    currency: true,
                    client: { select: { name: true } },
                    lead: { select: { name: true } },
                },
                take,
            }),
            prisma.contract.findMany({
                where: {
                    userId,
                    OR: [
                        { title: { contains: normalizedQuery, mode } },
                        { number: { contains: normalizedQuery, mode } },
                    ],
                },
                select: {
                    id: true,
                    number: true,
                    title: true,
                    status: true,
                    client: { select: { name: true } },
                },
                take,
            }),
            prisma.lead.findMany({
                where: {
                    userId,
                    OR: [
                        { name: { contains: normalizedQuery, mode } },
                        { company: { contains: normalizedQuery, mode } },
                        { email: { contains: normalizedQuery, mode } },
                    ],
                },
                select: { id: true, name: true, company: true, email: true, status: true },
                take,
            }),
        ]);

        const result: SearchResult = {
            clients: clients.map((c) => ({
                id: c.id,
                name: c.name,
                email: c.email,
                company: c.company,
                type: c.type,
            })),
            offers: offers.map((o) => ({
                id: o.id,
                number: o.number,
                title: o.title,
                status: o.status,
                totalGross: o.totalGross,
                currency: o.currency,
                clientName: (o.client ?? o.lead)?.name ?? 'Nieznany',
            })),
            contracts: contracts.map((c) => ({
                id: c.id,
                number: c.number,
                title: c.title,
                status: c.status,
                clientName: c.client.name,
            })),
            leads,
        };

        searchCache.set(cacheKey, result, 30);
        return result;
    }
}

export const searchService = new SearchService();

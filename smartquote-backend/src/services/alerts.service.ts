// src/services/alerts.service.ts
import prisma from '../lib/prisma';
import { createModuleLogger } from '../lib/logger';

const log = createModuleLogger('alerts');

export interface Alert {
    id: string; // deterministic: `${type}:${relatedId || userId}`
    type: 'overdue_followup' | 'expiring_offer' | 'stale_draft' | 'new_lead' | 'unsigned_contract';
    priority: 'high' | 'medium' | 'low';
    title: string;
    message: string;
    count?: number;
    action: { label: string; path: string };
    createdAt: string; // ISO
}

export async function getAlerts(userId: string): Promise<Alert[]> {
    const now = new Date();
    const alerts: Alert[] = [];

    const [
        overdueFollowUps,
        expiringOffers,
        staleDrafts,
        newLeads,
        unsignedContracts,
    ] = await Promise.all([
        // Follow-ups overdue (dueDate < now, status PENDING)
        prisma.followUp.count({
            where: { userId, status: 'PENDING', dueDate: { lt: now } },
        }),
        // Offers expiring within 7 days (status SENT or NEGOTIATION, validUntil within 7 days)
        prisma.offer.findMany({
            where: {
                userId,
                status: { in: ['SENT', 'NEGOTIATION'] },
                validUntil: {
                    gte: now,
                    lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
                },
            },
            select: { id: true, number: true, title: true, validUntil: true },
            take: 5,
        }),
        // Draft offers older than 14 days
        prisma.offer.count({
            where: {
                userId,
                status: 'DRAFT',
                createdAt: { lt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) },
            },
        }),
        // New leads (NEW status) created in last 14 days, not yet contacted
        prisma.lead.count({
            where: {
                userId,
                status: 'NEW',
                createdAt: { gte: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) },
            },
        }),
        // Contracts pending signature older than 7 days
        prisma.contract.count({
            where: {
                userId,
                status: 'PENDING_SIGNATURE',
                updatedAt: { lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
            },
        }),
    ]);

    if (overdueFollowUps > 0) {
        alerts.push({
            id: `overdue_followup:${userId}`,
            type: 'overdue_followup',
            priority: 'high',
            title: 'Zaległe follow-upy',
            message: `${overdueFollowUps} follow-up${overdueFollowUps === 1 ? '' : 'ów'} oczekuje na wykonanie`,
            count: overdueFollowUps,
            action: { label: 'Zobacz zaległe', path: '/dashboard/followups?status=overdue' },
            createdAt: now.toISOString(),
        });
    }

    for (const offer of expiringOffers) {
        const daysLeft = Math.ceil((new Date(offer.validUntil!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        alerts.push({
            id: `expiring_offer:${offer.id}`,
            type: 'expiring_offer',
            priority: daysLeft <= 2 ? 'high' : 'medium',
            title: 'Oferta wygasa wkrótce',
            message: `Oferta ${offer.number} wygasa za ${daysLeft} ${daysLeft === 1 ? 'dzień' : 'dni'}`,
            action: { label: 'Otwórz ofertę', path: `/dashboard/offers/${offer.id}` },
            createdAt: now.toISOString(),
        });
    }

    if (staleDrafts > 0) {
        alerts.push({
            id: `stale_draft:${userId}`,
            type: 'stale_draft',
            priority: 'low',
            title: 'Stare szkice ofert',
            message: `${staleDrafts} szkic${staleDrafts === 1 ? '' : 'ów'} czeka ponad 14 dni — wyślij lub usuń`,
            count: staleDrafts,
            action: { label: 'Zobacz szkice', path: '/dashboard/offers?status=DRAFT' },
            createdAt: now.toISOString(),
        });
    }

    if (newLeads > 0) {
        alerts.push({
            id: `new_lead:${userId}`,
            type: 'new_lead',
            priority: 'medium',
            title: 'Nowe leady czekają',
            message: `${newLeads} nowy${newLeads === 1 ? ' lead' : 'ch leadów'} bez kontaktu`,
            count: newLeads,
            action: { label: 'Zobacz leady', path: '/dashboard/leads?status=NEW' },
            createdAt: now.toISOString(),
        });
    }

    if (unsignedContracts > 0) {
        alerts.push({
            id: `unsigned_contract:${userId}`,
            type: 'unsigned_contract',
            priority: 'medium',
            title: 'Umowy oczekują na podpis',
            message: `${unsignedContracts} umow${unsignedContracts === 1 ? 'a czeka' : 'y czekają'} na podpisanie`,
            count: unsignedContracts,
            action: { label: 'Zobacz umowy', path: '/dashboard/contracts?status=PENDING_SIGNATURE' },
            createdAt: now.toISOString(),
        });
    }

    // Sort: high first, then medium, then low
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return alerts.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

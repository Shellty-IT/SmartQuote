import prisma from '../lib/prisma';
import { ValidationError } from '../errors/domain.errors';

export interface OwnedRelationIds {
    clientId?: string | null;
    offerId?: string | null;
    contractId?: string | null;
    leadId?: string | null;
    templateId?: string | null;
}

export async function validateOwnedRelations(
    userId: string,
    relations: OwnedRelationIds,
): Promise<void> {
    const checks = [
        relations.clientId
            ? prisma.client.findFirst({ where: { id: relations.clientId, userId }, select: { id: true } })
            : Promise.resolve(null),
        relations.offerId
            ? prisma.offer.findFirst({ where: { id: relations.offerId, userId }, select: { id: true } })
            : Promise.resolve(null),
        relations.contractId
            ? prisma.contract.findFirst({ where: { id: relations.contractId, userId }, select: { id: true } })
            : Promise.resolve(null),
        relations.leadId
            ? prisma.lead.findFirst({ where: { id: relations.leadId, userId }, select: { id: true } })
            : Promise.resolve(null),
        relations.templateId
            ? prisma.emailTemplate.findFirst({ where: { id: relations.templateId, userId }, select: { id: true } })
            : Promise.resolve(null),
    ] as const;

    const [client, offer, contract, lead, template] = await Promise.all(checks);

    if (relations.clientId && !client) throw new ValidationError('NieprawidĹ‚owe powiÄ…zanie z klientem');
    if (relations.offerId && !offer) throw new ValidationError('NieprawidĹ‚owe powiÄ…zanie z ofertÄ…');
    if (relations.contractId && !contract) throw new ValidationError('NieprawidĹ‚owe powiÄ…zanie z umowÄ…');
    if (relations.leadId && !lead) throw new ValidationError('NieprawidĹ‚owe powiÄ…zanie z leadem');
    if (relations.templateId && !template) throw new ValidationError('NieprawidĹ‚owe powiÄ…zanie z szablonem');
}

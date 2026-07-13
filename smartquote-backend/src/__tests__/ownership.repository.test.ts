jest.mock('../lib/prisma', () => ({
    __esModule: true,
    default: {
        client: { findFirst: jest.fn() },
        offer: { findFirst: jest.fn() },
        contract: { findFirst: jest.fn() },
        lead: { findFirst: jest.fn() },
        emailTemplate: { findFirst: jest.fn() },
    },
}));

import prisma from '../lib/prisma';
import { validateOwnedRelations } from '../repositories/ownership.repository';
import { ValidationError } from '../errors/domain.errors';

const db = prisma as unknown as Record<string, { findFirst: jest.Mock }>;

beforeEach(() => {
    jest.resetAllMocks();
    for (const model of Object.values(db)) {
        model.findFirst.mockResolvedValue({ id: 'owned' });
    }
});

it('accepts relations owned by the requesting user', async () => {
    await expect(validateOwnedRelations('user-1', {
        clientId: 'client-1',
        offerId: 'offer-1',
        contractId: 'contract-1',
        leadId: 'lead-1',
        templateId: 'template-1',
    })).resolves.toBeUndefined();

    expect(db.client.findFirst).toHaveBeenCalledWith({
        where: { id: 'client-1', userId: 'user-1' },
        select: { id: true },
    });
});

it.each([
    ['client', 'clientId'],
    ['offer', 'offerId'],
    ['contract', 'contractId'],
    ['lead', 'leadId'],
    ['emailTemplate', 'templateId'],
] as const)('rejects a foreign %s relation', async (model, field) => {
    db[model].findFirst.mockResolvedValue(null);
    await expect(validateOwnedRelations('user-1', { [field]: 'foreign-id' }))
        .rejects.toBeInstanceOf(ValidationError);
});

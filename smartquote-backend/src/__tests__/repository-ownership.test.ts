// src/__tests__/repository-ownership.test.ts
//
// IDOR (Insecure Direct Object Reference) prevention tests.
// Verifies that every mutating service method rejects operations when the
// requesting userId does not own the target record. These tests mock
// repositories to simulate ownership-mismatch responses (null / false)
// and assert that the service layer raises the correct error instead of
// silently mutating another user's data.

// ─── Offers ──────────────────────────────────────────────────────────────────

jest.mock('../repositories/offers.repository', () => ({
    offersRepository: {
        findById: jest.fn(),
        findByIdPublicFields: jest.fn(),
        update: jest.fn(),
        updateWithItems: jest.fn(),
        delete: jest.fn(),
        create: jest.fn(),
        findAll: jest.fn(),
        groupByStatus: jest.fn(),
        count: jest.fn(),
        aggregateTotalGross: jest.fn(),
        findByIdWithUser: jest.fn(),
        findForDuplicate: jest.fn(),
        findForAnalytics: jest.fn(),
        findComments: jest.fn(),
        createCommentWithInteraction: jest.fn(),
        findByPublicToken: jest.fn(),
        findByIdForEmail: jest.fn(),
        findByIdForPDFAttachment: jest.fn(),
    },
    OffersRepository: jest.fn(),
}));

jest.mock('../services/shared/postmortem.utils', () => ({
    triggerPostMortem: jest.fn(),
}));

jest.mock('../services/email', () => ({ emailService: { sendOfferEmail: jest.fn() } }));
jest.mock('../services/settings.service', () => ({ getDecryptedSmtpConfig: jest.fn() }));
jest.mock('../services/pdf', () => ({ pdfService: { generateOfferPDF: jest.fn() } }));
jest.mock('../utils/offerNumber', () => ({ generateOfferNumber: jest.fn().mockResolvedValue('OFF/2026/001') }));

// ─── Contracts ───────────────────────────────────────────────────────────────

jest.mock('../repositories/contracts.repository', () => ({
    contractsRepository: {
        findById: jest.fn(),
        findPublicToken: jest.fn(),
        update: jest.fn(),
        updateWithItems: jest.fn(),
        delete: jest.fn(),
        create: jest.fn(),
        findAll: jest.fn(),
        count: jest.fn(),
        countByYear: jest.fn(),
        groupByStatus: jest.fn(),
        aggregateTotalGross: jest.fn(),
        findOfferForContract: jest.fn(),
        findByIdWithUser: jest.fn(),
        findByIdForPDFAttachment: jest.fn(),
    },
    ContractsRepository: jest.fn(),
}));

// ─── Notes ───────────────────────────────────────────────────────────────────

jest.mock('../repositories/notes.repository', () => ({
    notesRepository: {
        create: jest.fn(),
        findById: jest.fn(),
        findByEntity: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    NotesRepository: jest.fn(),
}));

// ─── Leads ───────────────────────────────────────────────────────────────────

jest.mock('../repositories/leads.repository', () => ({
    leadsRepository: {
        create: jest.fn(),
        findById: jest.fn(),
        findAll: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        countByStatus: jest.fn(),
    },
    LeadsRepository: jest.fn(),
}));

jest.mock('../lib/prisma', () => ({
    __esModule: true,
    default: {
        lead: { count: jest.fn() },
        client: { create: jest.fn() },
    },
}));

// ─── Followups ────────────────────────────────────────────────────────────────

jest.mock('../repositories/followups.repository', () => ({
    followUpsRepository: {
        findById: jest.fn(),
        findAll: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        markOverdue: jest.fn(),
        findUpcoming: jest.fn(),
        findOverdue: jest.fn(),
        findByClientId: jest.fn(),
        findByOfferId: jest.fn(),
        findByContractId: jest.fn(),
        findAllRaw: jest.fn(),
        validateRelations: jest.fn(),
    },
}));

// ─── Config mock (needed by offers service) ──────────────────────────────────

jest.mock('../config', () => ({
    config: {
        frontendUrl: 'http://localhost:3000',
        saltRounds: 1,
        jwtSecret: 'test-secret-32-characters-minimum!',
        gemini: { apiKey: '', model: 'gemini-2.5-flash' },
    },
    isDev: false,
    isProd: false,
    isTest: true,
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import { OffersService } from '../services/offers.service';
import { offersRepository } from '../repositories/offers.repository';
import { ContractsService } from '../services/contracts.service';
import { contractsRepository } from '../repositories/contracts.repository';
import { NotesService } from '../services/notes.service';
import { notesRepository } from '../repositories/notes.repository';
import { LeadsService } from '../services/leads.service';
import { leadsRepository } from '../repositories/leads.repository';
import { followUpsService } from '../services/followups.service';
import { followUpsRepository } from '../repositories/followups.repository';
import { NotFoundError } from '../errors/domain.errors';

const offersRepo = offersRepository as jest.Mocked<typeof offersRepository>;
const contractsRepo = contractsRepository as jest.Mocked<typeof contractsRepository>;
const notesRepo = notesRepository as jest.Mocked<typeof notesRepository>;
const leadsRepo = leadsRepository as jest.Mocked<typeof leadsRepository>;
const followUpsRepo = followUpsRepository as jest.Mocked<typeof followUpsRepository>;

const offersService = new OffersService();
const contractsService = new ContractsService();
const notesService = new NotesService();
const leadsService = new LeadsService();

const OWNER_ID = 'user-owner-123';
const ATTACKER_ID = 'user-attacker-456';
const RESOURCE_ID = 'resource-id-abc';

beforeEach(() => {
    jest.resetAllMocks();
});

// ═════════════════════════════════════════════════════════════════════════════
// OFFERS
// ═════════════════════════════════════════════════════════════════════════════

describe('OffersService — ownership (IDOR prevention)', () => {
    const MOCK_OFFER = {
        id: RESOURCE_ID,
        userId: OWNER_ID,
        status: 'DRAFT',
        number: 'OFF/2026/001',
        title: 'Test offer',
        publicToken: null,
        isInteractive: false,
        totalGross: 1000,
        totalNet: 813,
        totalVat: 187,
        items: [],
        client: { id: 'client-1', name: 'Client', company: null },
        acceptanceLog: null,
        _count: { followUps: 0, comments: 0, views: 0 },
    };

    describe('update', () => {
        it('updates when userId matches owner', async () => {
            offersRepo.findById.mockResolvedValue(MOCK_OFFER as never);
            offersRepo.update.mockResolvedValue(MOCK_OFFER as never);

            await expect(
                offersService.update(RESOURCE_ID, OWNER_ID, { title: 'New title' }),
            ).resolves.not.toThrow();
        });

        it('throws NotFoundError when findById returns null (foreign userId)', async () => {
            offersRepo.findById.mockResolvedValue(null);

            await expect(
                offersService.update(RESOURCE_ID, ATTACKER_ID, { title: 'Hijacked' }),
            ).rejects.toThrow(NotFoundError);

            expect(offersRepo.update).not.toHaveBeenCalled();
            expect(offersRepo.updateWithItems).not.toHaveBeenCalled();
        });

        it('throws NotFoundError when atomic repo update returns null (race condition)', async () => {
            offersRepo.findById.mockResolvedValue(MOCK_OFFER as never);
            offersRepo.update.mockResolvedValue(null);

            await expect(
                offersService.update(RESOURCE_ID, ATTACKER_ID, { title: 'Race' }),
            ).rejects.toThrow(NotFoundError);
        });
    });

    describe('delete', () => {
        it('deletes when userId matches owner', async () => {
            offersRepo.findById.mockResolvedValue(MOCK_OFFER as never);
            offersRepo.delete.mockResolvedValue(true as never);

            await expect(offersService.delete(RESOURCE_ID, OWNER_ID)).resolves.not.toThrow();
        });

        it('throws NotFoundError when delete returns false (foreign userId or non-existent)', async () => {
            // deleteMany with { id, userId } matches 0 rows → returns false → service throws NotFoundError.
            // No prior findById needed — the atomic deleteMany is the ownership check.
            offersRepo.delete.mockResolvedValue(false as never);

            await expect(
                offersService.delete(RESOURCE_ID, ATTACKER_ID),
            ).rejects.toThrow(NotFoundError);

            expect(offersRepo.delete).toHaveBeenCalledWith(RESOURCE_ID, ATTACKER_ID);
        });
    });

    describe('publishOffer', () => {
        it('throws NotFoundError when offer not owned by user', async () => {
            offersRepo.findByIdPublicFields.mockResolvedValue(null);

            await expect(
                offersService.publishOffer(RESOURCE_ID, ATTACKER_ID),
            ).rejects.toThrow(NotFoundError);

            expect(offersRepo.update).not.toHaveBeenCalled();
        });
    });

    describe('unpublishOffer', () => {
        it('throws NotFoundError when offer not owned by user', async () => {
            offersRepo.findById.mockResolvedValue(null);

            await expect(
                offersService.unpublishOffer(RESOURCE_ID, ATTACKER_ID),
            ).rejects.toThrow(NotFoundError);

            expect(offersRepo.update).not.toHaveBeenCalled();
        });
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// CONTRACTS
// ═════════════════════════════════════════════════════════════════════════════

describe('ContractsService — ownership (IDOR prevention)', () => {
    const MOCK_CONTRACT = {
        id: RESOURCE_ID,
        userId: OWNER_ID,
        status: 'DRAFT',
        number: 'UMW/2026/001',
        title: 'Test contract',
        publicToken: null,
        client: { id: 'client-1', name: 'Client' },
        items: [],
        signatureLog: null,
    };

    describe('updateContract', () => {
        it('updates when userId matches owner', async () => {
            contractsRepo.findById.mockResolvedValue(MOCK_CONTRACT as never);
            contractsRepo.update.mockResolvedValue(MOCK_CONTRACT as never);

            await expect(
                contractsService.updateContract(RESOURCE_ID, OWNER_ID, { title: 'New' }),
            ).resolves.not.toThrow();
        });

        it('throws NotFoundError when findById returns null (foreign userId)', async () => {
            contractsRepo.findById.mockResolvedValue(null);

            await expect(
                contractsService.updateContract(RESOURCE_ID, ATTACKER_ID, { title: 'Hijacked' }),
            ).rejects.toThrow(NotFoundError);

            expect(contractsRepo.update).not.toHaveBeenCalled();
            expect(contractsRepo.updateWithItems).not.toHaveBeenCalled();
        });

        it('throws NotFoundError when atomic repo update returns null (race condition)', async () => {
            contractsRepo.findById.mockResolvedValue(MOCK_CONTRACT as never);
            contractsRepo.update.mockResolvedValue(null);

            await expect(
                contractsService.updateContract(RESOURCE_ID, ATTACKER_ID, { title: 'Race' }),
            ).rejects.toThrow(NotFoundError);
        });
    });

    describe('deleteContract', () => {
        it('deletes when userId matches owner', async () => {
            contractsRepo.findById.mockResolvedValue(MOCK_CONTRACT as never);
            contractsRepo.delete.mockResolvedValue(true as never);

            await expect(
                contractsService.deleteContract(RESOURCE_ID, OWNER_ID),
            ).resolves.toBe(true);
        });

        it('throws NotFoundError when findById returns null (foreign userId)', async () => {
            contractsRepo.findById.mockResolvedValue(null);

            await expect(
                contractsService.deleteContract(RESOURCE_ID, ATTACKER_ID),
            ).rejects.toThrow(NotFoundError);

            expect(contractsRepo.delete).not.toHaveBeenCalled();
        });
    });

    describe('publishContract', () => {
        it('throws NotFoundError when contract not owned by user', async () => {
            contractsRepo.findPublicToken.mockResolvedValue(null);

            await expect(
                contractsService.publishContract(RESOURCE_ID, ATTACKER_ID),
            ).rejects.toThrow(NotFoundError);

            expect(contractsRepo.update).not.toHaveBeenCalled();
        });
    });

    describe('unpublishContract', () => {
        it('throws NotFoundError when contract not owned by user', async () => {
            contractsRepo.findById.mockResolvedValue(null);

            await expect(
                contractsService.unpublishContract(RESOURCE_ID, ATTACKER_ID),
            ).rejects.toThrow(NotFoundError);

            expect(contractsRepo.update).not.toHaveBeenCalled();
        });
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// NOTES
// ═════════════════════════════════════════════════════════════════════════════

describe('NotesService — ownership (IDOR prevention)', () => {
    const MOCK_NOTE = { id: RESOURCE_ID, userId: OWNER_ID, content: 'original' };

    describe('update', () => {
        it('updates when userId matches owner', async () => {
            notesRepo.findById.mockResolvedValue(MOCK_NOTE as never);
            notesRepo.update.mockResolvedValue({ ...MOCK_NOTE, content: 'updated' } as never);

            await expect(
                notesService.update(RESOURCE_ID, OWNER_ID, 'updated'),
            ).resolves.not.toThrow();

            expect(notesRepo.update).toHaveBeenCalledWith(RESOURCE_ID, OWNER_ID, 'updated');
        });

        it('throws NotFoundError when findById returns null (foreign userId)', async () => {
            notesRepo.findById.mockResolvedValue(null);

            await expect(
                notesService.update(RESOURCE_ID, ATTACKER_ID, 'injected'),
            ).rejects.toThrow(NotFoundError);

            expect(notesRepo.update).not.toHaveBeenCalled();
        });
    });

    describe('delete', () => {
        it('deletes when userId matches owner', async () => {
            notesRepo.delete.mockResolvedValue(true as never);

            await expect(notesService.delete(RESOURCE_ID, OWNER_ID)).resolves.not.toThrow();
            expect(notesRepo.delete).toHaveBeenCalledWith(RESOURCE_ID, OWNER_ID);
        });

        it('throws NotFoundError when repo returns false (foreign userId)', async () => {
            notesRepo.delete.mockResolvedValue(false as never);

            await expect(
                notesService.delete(RESOURCE_ID, ATTACKER_ID),
            ).rejects.toThrow(NotFoundError);
        });
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// LEADS
// ═════════════════════════════════════════════════════════════════════════════

describe('LeadsService — ownership (IDOR prevention)', () => {
    const MOCK_LEAD = {
        id: RESOURCE_ID,
        userId: OWNER_ID,
        name: 'Jan Kowalski',
        status: 'NEW',
        email: null,
        phone: null,
        company: null,
        source: null,
        notes: null,
        clientId: null,
        client: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    describe('update', () => {
        it('updates when userId matches owner', async () => {
            leadsRepo.findById.mockResolvedValue(MOCK_LEAD as never);
            leadsRepo.update.mockResolvedValue({ ...MOCK_LEAD, name: 'Updated' } as never);

            await expect(
                leadsService.update(RESOURCE_ID, OWNER_ID, { name: 'Updated' }),
            ).resolves.not.toThrow();

            expect(leadsRepo.update).toHaveBeenCalledWith(RESOURCE_ID, OWNER_ID, { name: 'Updated' });
        });

        it('throws NotFoundError when findById returns null (foreign userId)', async () => {
            leadsRepo.findById.mockResolvedValue(null);

            await expect(
                leadsService.update(RESOURCE_ID, ATTACKER_ID, { name: 'Hijacked' }),
            ).rejects.toThrow(NotFoundError);

            expect(leadsRepo.update).not.toHaveBeenCalled();
        });
    });

    describe('delete', () => {
        it('deletes when userId matches owner', async () => {
            leadsRepo.findById.mockResolvedValue(MOCK_LEAD as never);
            leadsRepo.delete.mockResolvedValue(MOCK_LEAD as never);

            await expect(leadsService.delete(RESOURCE_ID, OWNER_ID)).resolves.not.toThrow();
            expect(leadsRepo.delete).toHaveBeenCalledWith(RESOURCE_ID, OWNER_ID);
        });

        it('throws NotFoundError when findById returns null (foreign userId)', async () => {
            leadsRepo.findById.mockResolvedValue(null);

            await expect(
                leadsService.delete(RESOURCE_ID, ATTACKER_ID),
            ).rejects.toThrow(NotFoundError);

            expect(leadsRepo.delete).not.toHaveBeenCalled();
        });
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// FOLLOWUPS
// ═════════════════════════════════════════════════════════════════════════════

describe('followUpsService — ownership (IDOR prevention)', () => {
    const MOCK_FOLLOWUP = {
        id: RESOURCE_ID,
        userId: OWNER_ID,
        title: 'Call client',
        status: 'PENDING',
        type: 'CALL',
        priority: 'MEDIUM',
        dueDate: new Date(),
        notes: null,
        completedAt: null,
        clientId: null,
        offerId: null,
        contractId: null,
        client: null,
        offer: null,
        contract: null,
    };

    describe('update', () => {
        it('updates when userId matches owner', async () => {
            followUpsRepo.findById.mockResolvedValue(MOCK_FOLLOWUP as never);
            followUpsRepo.update.mockResolvedValue(MOCK_FOLLOWUP as never);

            await expect(
                followUpsService.update(RESOURCE_ID, OWNER_ID, { title: 'Updated call' }),
            ).resolves.not.toThrow();
        });

        it('throws when findById returns null (foreign userId)', async () => {
            followUpsRepo.findById.mockResolvedValue(null);

            await expect(
                followUpsService.update(RESOURCE_ID, ATTACKER_ID, { title: 'Hijacked' }),
            ).rejects.toThrow();

            expect(followUpsRepo.update).not.toHaveBeenCalled();
        });

        it('throws when atomic repo update returns null (race condition)', async () => {
            followUpsRepo.findById.mockResolvedValue(MOCK_FOLLOWUP as never);
            followUpsRepo.update.mockResolvedValue(null);

            await expect(
                followUpsService.update(RESOURCE_ID, ATTACKER_ID, { title: 'Race' }),
            ).rejects.toThrow();
        });
    });

    describe('updateStatus', () => {
        it('throws when followup not owned by user', async () => {
            followUpsRepo.findById.mockResolvedValue(null);

            await expect(
                followUpsService.updateStatus(RESOURCE_ID, ATTACKER_ID, 'COMPLETED'),
            ).rejects.toThrow();

            expect(followUpsRepo.update).not.toHaveBeenCalled();
        });
    });

    describe('complete', () => {
        it('throws when followup not owned by user', async () => {
            followUpsRepo.findById.mockResolvedValue(null);

            await expect(
                followUpsService.complete(RESOURCE_ID, ATTACKER_ID),
            ).rejects.toThrow();
        });
    });

    describe('delete', () => {
        it('deletes when userId matches owner', async () => {
            followUpsRepo.findById.mockResolvedValue(MOCK_FOLLOWUP as never);
            followUpsRepo.delete.mockResolvedValue(true as never);

            await expect(followUpsService.delete(RESOURCE_ID, OWNER_ID)).resolves.not.toThrow();
            expect(followUpsRepo.delete).toHaveBeenCalledWith(RESOURCE_ID, OWNER_ID);
        });

        it('throws when findById returns null (foreign userId)', async () => {
            followUpsRepo.findById.mockResolvedValue(null);

            await expect(
                followUpsService.delete(RESOURCE_ID, ATTACKER_ID),
            ).rejects.toThrow();

            expect(followUpsRepo.delete).not.toHaveBeenCalled();
        });
    });
});

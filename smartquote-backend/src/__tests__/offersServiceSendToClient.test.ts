import { OfferStatus } from '@prisma/client';

jest.mock('../repositories/offers.repository', () => ({
    offersRepository: {
        findByIdForEmail: jest.fn(),
        update: jest.fn(),
    },
    OffersRepository: jest.fn(),
}));

jest.mock('../services/email', () => ({
    emailService: { sendOfferLink: jest.fn() },
}));

jest.mock('../services/settings.service', () => ({
    getUserEmailConfig: jest.fn(),
}));

import { offersService } from '../services/offers.service';
import { offersRepository } from '../repositories/offers.repository';
import { emailService } from '../services/email';
import { getUserEmailConfig } from '../services/settings.service';
import { ExternalServiceError } from '../errors/domain.errors';

const mockedRepo = offersRepository as jest.Mocked<typeof offersRepository>;
const mockedEmail = emailService as jest.Mocked<typeof emailService>;
const mockedGetEmailConfig = getUserEmailConfig as jest.Mock;

const USER_ID = 'user-1';
const OFFER_ID = 'offer-1';

function baseOffer(overrides: Record<string, unknown> = {}) {
    return {
        id: OFFER_ID,
        number: 'OFF/2026/001',
        title: 'Test offer',
        status: OfferStatus.DRAFT,
        publicToken: null,
        isInteractive: false,
        totalGross: 1000,
        currency: 'PLN',
        validUntil: null,
        client: { name: 'Jan Kowalski', email: 'jan@example.com' },
        lead: null,
        user: { name: 'Sprzedawca', email: 'seller@example.com', companyInfo: { name: 'Firma' } },
        ...overrides,
    };
}

describe('OffersService.sendOfferToClient', () => {
    beforeEach(() => {
        mockedGetEmailConfig.mockResolvedValue({ provider: 'smtp', config: {} });
    });

    afterEach(() => jest.clearAllMocks());

    it('does not flip status to SENT when the email send fails', async () => {
        mockedRepo.findByIdForEmail.mockResolvedValue(baseOffer() as never);
        mockedRepo.update.mockResolvedValue({ publicToken: 'tok123' } as never);
        mockedEmail.sendOfferLink.mockResolvedValue(false);

        await expect(offersService.sendOfferToClient(OFFER_ID, USER_ID)).rejects.toThrow(
            ExternalServiceError,
        );

        // Only the token-reservation update may have happened — never a status: SENT update.
        const statusUpdateCalls = mockedRepo.update.mock.calls.filter(
            ([, , data]) => (data as Record<string, unknown>).status !== undefined,
        );
        expect(statusUpdateCalls).toHaveLength(0);
    });

    it('reserves a public token before sending, then flips DRAFT to SENT only after a successful send', async () => {
        mockedRepo.findByIdForEmail.mockResolvedValue(baseOffer() as never);
        mockedRepo.update.mockResolvedValue({ publicToken: 'tok123' } as never);
        mockedEmail.sendOfferLink.mockResolvedValue(true);

        const result = await offersService.sendOfferToClient(OFFER_ID, USER_ID);

        expect(result).toEqual({ sent: true, email: 'jan@example.com' });
        expect(mockedRepo.update).toHaveBeenCalledTimes(2);

        const [tokenCall, statusCall] = mockedRepo.update.mock.calls;
        expect(tokenCall[2]).toMatchObject({ isInteractive: true });
        expect((tokenCall[2] as Record<string, unknown>).publicToken).toEqual(expect.any(String));
        expect(statusCall[2]).toMatchObject({ status: 'SENT' });
        expect((statusCall[2] as Record<string, unknown>).sentAt).toBeInstanceOf(Date);

        // sendOfferLink must be called with the token generated in the first update.
        const publicUrlSent = mockedEmail.sendOfferLink.mock.calls[0][1].publicUrl as string;
        expect(publicUrlSent).toContain((tokenCall[2] as Record<string, unknown>).publicToken as string);
    });

    it('reuses an existing public token without a second write, and skips the status flip when already SENT', async () => {
        mockedRepo.findByIdForEmail.mockResolvedValue(
            baseOffer({ status: OfferStatus.SENT, publicToken: 'existing-token', isInteractive: true }) as never,
        );
        mockedEmail.sendOfferLink.mockResolvedValue(true);

        const result = await offersService.sendOfferToClient(OFFER_ID, USER_ID);

        expect(result).toEqual({ sent: true, email: 'jan@example.com' });
        expect(mockedRepo.update).not.toHaveBeenCalled();
        expect(mockedEmail.sendOfferLink.mock.calls[0][1].publicUrl).toContain('existing-token');
    });

    it('rejects when the recipient has no email', async () => {
        mockedRepo.findByIdForEmail.mockResolvedValue(
            baseOffer({ client: { name: 'Jan', email: null } }) as never,
        );

        await expect(offersService.sendOfferToClient(OFFER_ID, USER_ID)).rejects.toThrow(
            'Odbiorca nie ma podanego adresu email',
        );
        expect(mockedEmail.sendOfferLink).not.toHaveBeenCalled();
    });
});

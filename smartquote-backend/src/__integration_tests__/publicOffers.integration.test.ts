// Real HTTP + real Postgres — see helpers/testServer.ts. Covers the public,
// unauthenticated offer-viewing routes, which have no equivalent unit-test
// coverage of the full route → validate → controller → service chain.
import {
    apiRequest,
    deleteTestUser,
    disconnectPrisma,
    registerAndLogin,
    startTestServer,
    type TestServer,
    type TestUser,
} from './helpers/testServer';

describe('Public offers integration', () => {
    let server: TestServer;
    let owner: TestUser;
    let clientId: string;

    beforeAll(async () => {
        server = await startTestServer();
        owner = await registerAndLogin(server.baseUrl);

        const clientRes = await apiRequest<{ id: string }>(server.baseUrl, 'POST', '/api/clients', {
            token: owner.token,
            body: { name: 'Publiczny Klient Sp. z o.o.', type: 'COMPANY' },
        });
        clientId = clientRes.body.data!.id;
    });

    afterAll(async () => {
        await deleteTestUser(owner.userId);
        await server.close();
        await disconnectPrisma();
    });

    async function createAndPublishOffer(): Promise<string> {
        const createRes = await apiRequest<{ id: string }>(server.baseUrl, 'POST', '/api/offers', {
            token: owner.token,
            body: {
                clientId,
                title: 'Publiczna oferta testowa',
                items: [{ name: 'Usługa', quantity: 1, unitPrice: 1000, vatRate: 23 }],
            },
        });
        const offerId = createRes.body.data!.id;

        const publishRes = await apiRequest<{ publicToken: string }>(
            server.baseUrl,
            'POST',
            `/api/offers/${offerId}/publish`,
            { token: owner.token },
        );
        return publishRes.body.data!.publicToken;
    }

    it('returns 404 for a token that does not exist', async () => {
        const res = await apiRequest(server.baseUrl, 'GET', '/api/public/offers/this-token-does-not-exist');
        expect(res.status).toBe(404);
        expect(res.body.error?.code).toBe('OFFER_NOT_FOUND');
    });

    it('serves a published offer by its public token, unauthenticated', async () => {
        const token = await createAndPublishOffer();

        const res = await apiRequest<{ expired: boolean; decided: boolean }>(
            server.baseUrl,
            'GET',
            `/api/public/offers/${token}`,
        );

        expect(res.status).toBe(200);
        expect(res.body.data?.expired).toBe(false);
        expect(res.body.data?.decided).toBe(false);
    });

    it('registers a view against the public offer without requiring auth', async () => {
        const token = await createAndPublishOffer();

        const res = await apiRequest(server.baseUrl, 'POST', `/api/public/offers/${token}/view`, {
            body: {},
        });

        expect(res.status).toBe(200);
    });

    it('rejects an accept request with a malformed body via 422', async () => {
        const token = await createAndPublishOffer();

        const res = await apiRequest(server.baseUrl, 'POST', `/api/public/offers/${token}/accept`, {
            body: { notAValidField: true },
        });

        // acceptPublicOfferSchema requires specific fields — an unrelated body
        // must fail validation rather than silently accepting the offer.
        expect(res.status).toBe(422);
    });
});

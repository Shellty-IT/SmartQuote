// Real HTTP + real Postgres — see helpers/testServer.ts and
// docker-compose.test.yml. Covers the offers CRUD contract end to end,
// including ownership isolation between two different users (the class of
// bug repository-ownership.test.ts checks with mocks; this proves it against
// an actual database with actual foreign keys).
import {
    apiRequest,
    deleteTestUser,
    disconnectPrisma,
    registerAndLogin,
    startTestServer,
    type TestServer,
    type TestUser,
} from './helpers/testServer';

describe('Offers integration', () => {
    let server: TestServer;
    let owner: TestUser;
    let clientId: string;

    beforeAll(async () => {
        server = await startTestServer();
        owner = await registerAndLogin(server.baseUrl);

        const clientRes = await apiRequest<{ id: string }>(server.baseUrl, 'POST', '/api/clients', {
            token: owner.token,
            body: { name: 'Testowy Klient Sp. z o.o.', type: 'COMPANY' },
        });
        if (clientRes.status !== 201 || !clientRes.body.data) {
            throw new Error(`Failed to seed test client: ${clientRes.status} ${JSON.stringify(clientRes.body)}`);
        }
        clientId = clientRes.body.data.id;
    });

    afterAll(async () => {
        await deleteTestUser(owner.userId);
        await server.close();
        await disconnectPrisma();
    });

    const validOfferBody = () => ({
        clientId,
        title: 'Oferta integracyjna testowa',
        items: [
            { name: 'Usługa konsultingowa', quantity: 2, unitPrice: 500, vatRate: 23 },
        ],
    });

    it('rejects unauthenticated requests with 401', async () => {
        const res = await apiRequest(server.baseUrl, 'GET', '/api/offers');
        expect(res.status).toBe(401);
        expect(res.body.error?.code).toBe('UNAUTHORIZED');
    });

    it('rejects an offer with no items with 422 VALIDATION_ERROR', async () => {
        const res = await apiRequest(server.baseUrl, 'POST', '/api/offers', {
            token: owner.token,
            body: { clientId, title: 'Bez pozycji', items: [] },
        });
        expect(res.status).toBe(422);
        expect(res.body.error?.code).toBe('VALIDATION_ERROR');
    });

    it('rejects an offer with neither clientId nor leadId with 422', async () => {
        const res = await apiRequest(server.baseUrl, 'POST', '/api/offers', {
            token: owner.token,
            body: { title: 'Bez odbiorcy', items: [{ name: 'X', quantity: 1, unitPrice: 100 }] },
        });
        expect(res.status).toBe(422);
    });

    it('creates an offer, computes totals correctly, then reads it back', async () => {
        const createRes = await apiRequest<{ id: string; totalNet: string; totalGross: string; number: string }>(
            server.baseUrl,
            'POST',
            '/api/offers',
            { token: owner.token, body: validOfferBody() },
        );

        expect(createRes.status).toBe(201);
        const offer = createRes.body.data!;
        // 2 x 500 net = 1000 net, 23% VAT = 1230 gross.
        expect(Number(offer.totalNet)).toBe(1000);
        expect(Number(offer.totalGross)).toBe(1230);
        expect(offer.number).toMatch(/^OFF\/\d{4}\/\d{3}$/);

        const getRes = await apiRequest(server.baseUrl, 'GET', `/api/offers/${offer.id}`, {
            token: owner.token,
        });
        expect(getRes.status).toBe(200);
        expect((getRes.body.data as { id: string }).id).toBe(offer.id);
    });

    it('updates an offer and recalculates totals from the new items', async () => {
        const createRes = await apiRequest<{ id: string }>(server.baseUrl, 'POST', '/api/offers', {
            token: owner.token,
            body: validOfferBody(),
        });
        const offerId = createRes.body.data!.id;

        const updateRes = await apiRequest<{ totalGross: string }>(
            server.baseUrl,
            'PUT',
            `/api/offers/${offerId}`,
            {
                token: owner.token,
                body: { items: [{ name: 'Nowa pozycja', quantity: 1, unitPrice: 100, vatRate: 23 }] },
            },
        );

        expect(updateRes.status).toBe(200);
        expect(Number(updateRes.body.data!.totalGross)).toBe(123);
    });

    it('returns 404 (not exposing existence) when a foreign user requests another user\'s offer', async () => {
        const createRes = await apiRequest<{ id: string }>(server.baseUrl, 'POST', '/api/offers', {
            token: owner.token,
            body: validOfferBody(),
        });
        const offerId = createRes.body.data!.id;

        const attacker = await registerAndLogin(server.baseUrl, 'Attacker');
        try {
            const res = await apiRequest(server.baseUrl, 'GET', `/api/offers/${offerId}`, {
                token: attacker.token,
            });
            expect(res.status).toBe(404);
            expect(res.body.error?.code).toBe('NOT_FOUND');
        } finally {
            await deleteTestUser(attacker.userId);
        }
    });

    it('publishes an offer and exposes it at a public token URL', async () => {
        const createRes = await apiRequest<{ id: string }>(server.baseUrl, 'POST', '/api/offers', {
            token: owner.token,
            body: validOfferBody(),
        });
        const offerId = createRes.body.data!.id;

        const publishRes = await apiRequest<{ publicToken: string }>(
            server.baseUrl,
            'POST',
            `/api/offers/${offerId}/publish`,
            { token: owner.token },
        );
        expect(publishRes.status).toBe(200);
        const publicToken = publishRes.body.data!.publicToken;
        expect(typeof publicToken).toBe('string');

        const publicRes = await apiRequest(server.baseUrl, 'GET', `/api/public/offers/${publicToken}`);
        expect(publicRes.status).toBe(200);
    });
});

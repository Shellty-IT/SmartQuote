// Real HTTP requests against the actual Express app + a disposable local
// Postgres — see docker-compose.test.yml and `npm run test:integration`.
// Exercises the full route → validate → controller → service → Prisma →
// errorHandler chain, which the mocked-Prisma unit tests never touch.
import {
    apiRequest,
    deleteTestUser,
    disconnectPrisma,
    startTestServer,
    uniqueTestEmail,
    type TestServer,
} from './helpers/testServer';

describe('Auth integration', () => {
    let server: TestServer;
    const createdUserIds: string[] = [];

    beforeAll(async () => {
        server = await startTestServer();
    });

    afterAll(async () => {
        for (const id of createdUserIds) await deleteTestUser(id);
        await server.close();
        await disconnectPrisma();
    });

    it('registers a new user and returns a usable token', async () => {
        const email = uniqueTestEmail();
        const res = await apiRequest<{ user: { id: string; email: string }; token: string }>(
            server.baseUrl,
            'POST',
            '/api/auth/register',
            { body: { email, password: 'Passw0rd123', name: 'Jan Testowy' } },
        );

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data?.user.email).toBe(email);
        expect(typeof res.body.data?.token).toBe('string');
        if (res.body.data) createdUserIds.push(res.body.data.user.id);

        // The token from registration must work against a protected route.
        const me = await apiRequest(server.baseUrl, 'GET', '/api/auth/me', {
            token: res.body.data?.token,
        });
        expect(me.status).toBe(200);
    });

    it('rejects registering the same email twice with 409 CONFLICT', async () => {
        const email = uniqueTestEmail();
        const first = await apiRequest<{ user: { id: string } }>(server.baseUrl, 'POST', '/api/auth/register', {
            body: { email, password: 'Passw0rd123' },
        });
        if (first.body.data) createdUserIds.push(first.body.data.user.id);

        const second = await apiRequest(server.baseUrl, 'POST', '/api/auth/register', {
            body: { email, password: 'Passw0rd123' },
        });

        expect(second.status).toBe(409);
        expect(second.body.error?.code).toBe('CONFLICT');
    });

    it('rejects registration with a weak password via 422 VALIDATION_ERROR', async () => {
        const res = await apiRequest(server.baseUrl, 'POST', '/api/auth/register', {
            body: { email: uniqueTestEmail(), password: 'weak' },
        });

        expect(res.status).toBe(422);
        expect(res.body.error?.code).toBe('VALIDATION_ERROR');
    });

    it('logs in with correct credentials and rejects incorrect ones with 401', async () => {
        const email = uniqueTestEmail();
        const password = 'Passw0rd123';
        const registered = await apiRequest<{ user: { id: string } }>(server.baseUrl, 'POST', '/api/auth/register', {
            body: { email, password },
        });
        if (registered.body.data) createdUserIds.push(registered.body.data.user.id);

        const goodLogin = await apiRequest(server.baseUrl, 'POST', '/api/auth/login', {
            body: { email, password },
        });
        expect(goodLogin.status).toBe(200);

        const badLogin = await apiRequest(server.baseUrl, 'POST', '/api/auth/login', {
            body: { email, password: 'WrongPassword123' },
        });
        expect(badLogin.status).toBe(401);
        expect(badLogin.body.error?.code).toBe('UNAUTHORIZED');
    });

    it('rejects /auth/me without a token with 401', async () => {
        const res = await apiRequest(server.baseUrl, 'GET', '/api/auth/me');
        expect(res.status).toBe(401);
        expect(res.body.error?.code).toBe('UNAUTHORIZED');
    });
});

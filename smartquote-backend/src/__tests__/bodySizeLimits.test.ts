// Verifies the route-scoped JSON body limits wired in src/app.ts: /api/offers
// and /api/settings accept large (image-upload) bodies, while every other
// route — including public, unauthenticated ones like /api/auth/login — is
// capped at the smaller default. These routes require auth, so a request
// with no/invalid token 401s *after* successfully parsing the body, letting
// us distinguish "body accepted" (401) from "body rejected for size" (413)
// without needing a live database connection.
import type { AddressInfo } from 'net';
import app from '../app';

function padded(byteSize: number) {
    return { padding: 'x'.repeat(byteSize) };
}

describe('route-scoped JSON body limits', () => {
    let baseUrl: string;
    let server: ReturnType<typeof app.listen>;

    beforeAll((done) => {
        server = app.listen(0, () => {
            const { port } = server.address() as AddressInfo;
            baseUrl = `http://127.0.0.1:${port}`;
            done();
        });
    });

    afterAll((done) => {
        server.close(done);
    });

    async function post(path: string, bytes: number) {
        return fetch(`${baseUrl}${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(padded(bytes)),
        });
    }

    it('accepts a >1MB body on /api/offers (needs the 10mb limit for template images)', async () => {
        const res = await post('/api/offers', 2 * 1024 * 1024);
        expect(res.status).not.toBe(413);
        expect(res.status).toBe(401);
    });

    it('accepts a >1MB body on /api/settings/company (needs the 10mb limit for logo uploads)', async () => {
        const res = await post('/api/settings/company', 2 * 1024 * 1024);
        expect(res.status).not.toBe(413);
        expect(res.status).toBe(401);
    });

    it('rejects a >1MB body on a route left on the default limit', async () => {
        const res = await post('/api/leads', 2 * 1024 * 1024);
        expect(res.status).toBe(413);
    });

    it('rejects a >1MB body on the public, unauthenticated login route', async () => {
        const res = await post('/api/auth/login', 2 * 1024 * 1024);
        expect(res.status).toBe(413);
    });
});

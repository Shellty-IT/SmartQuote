// src/__integration_tests__/helpers/testServer.ts
import type { AddressInfo } from 'net';
import app from '../../app';
import prisma from '../../lib/prisma';

export interface TestServer {
    baseUrl: string;
    close: () => Promise<void>;
}

export function startTestServer(): Promise<TestServer> {
    return new Promise((resolve) => {
        const server = app.listen(0, () => {
            const { port } = server.address() as AddressInfo;
            resolve({
                baseUrl: `http://127.0.0.1:${port}`,
                close: () => new Promise((res) => server.close(() => res())),
            });
        });
    });
}

export interface ApiResponseBody<T = unknown> {
    success: boolean;
    data?: T;
    error?: { code: string; message: string; details?: unknown };
    meta?: { page: number; limit: number; total: number; totalPages: number };
}

export async function apiRequest<T = unknown>(
    baseUrl: string,
    method: string,
    path: string,
    options: { body?: unknown; token?: string } = {},
): Promise<{ status: number; body: ApiResponseBody<T> }> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (options.token) headers.Authorization = `Bearer ${options.token}`;

    const res = await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    const body = (await res.json()) as ApiResponseBody<T>;
    return { status: res.status, body };
}

let registrationCounter = 0;

export function uniqueTestEmail(): string {
    registrationCounter += 1;
    return `integration-${Date.now()}-${registrationCounter}@test.local`;
}

export interface TestUser {
    userId: string;
    token: string;
    email: string;
    password: string;
}

export async function registerAndLogin(baseUrl: string, name = 'Integration Test User'): Promise<TestUser> {
    const email = uniqueTestEmail();
    const password = 'Passw0rd123';

    const res = await apiRequest<{ user: { id: string }; token: string }>(baseUrl, 'POST', '/api/auth/register', {
        body: { email, password, name },
    });

    if (res.status !== 201 || !res.body.data) {
        throw new Error(`Failed to register test user: ${res.status} ${JSON.stringify(res.body)}`);
    }

    return { userId: res.body.data.user.id, token: res.body.data.token, email, password };
}

// Cascading FKs (onDelete: Cascade from User) clean up everything the test
// user created — offers, clients, settings — in one call.
export async function deleteTestUser(userId: string): Promise<void> {
    await prisma.user.delete({ where: { id: userId } }).catch(() => undefined);
}

export async function disconnectPrisma(): Promise<void> {
    await prisma.$disconnect();
}

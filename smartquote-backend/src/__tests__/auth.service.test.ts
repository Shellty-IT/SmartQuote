// src/__tests__/auth.service.test.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock Prisma before importing the service
jest.mock('../lib/prisma', () => ({
    __esModule: true,
    default: {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
        userSettings: {
            create: jest.fn(),
        },
    },
}));

// Provide a valid config for the service
jest.mock('../config', () => ({
    config: {
        jwtSecret: 'test-jwt-secret-min-32-characters!!',
        saltRounds: 1, // speed up bcrypt in tests
    },
    isDev: false,
    isProd: false,
    isTest: true,
}));

import prisma from '../lib/prisma';
import { register, login } from '../services/auth.service';
import { ConflictError, UnauthorizedError } from '../errors/domain.errors';

const db = prisma as jest.Mocked<typeof prisma>;

const MOCK_USER = {
    id: 'user-id-123',
    email: 'test@example.com',
    password: '', // set in beforeAll
    name: 'Test User',
    role: 'USER',
    isActive: true,
    tokenVersion: 0,
    phone: null,
    avatar: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    companyInfo: null,
};

let hashedPassword: string;

beforeAll(async () => {
    hashedPassword = await bcrypt.hash('correct-password', 1);
    MOCK_USER.password = hashedPassword;
});

beforeEach(() => {
    jest.resetAllMocks();
    (db.userSettings.create as jest.Mock).mockResolvedValue({});
});

// ── register ──────────────────────────────────────────────────────────────────

describe('register', () => {
    it('creates a new user and returns token + user info', async () => {
        (db.user.findUnique as jest.Mock).mockResolvedValue(null);
        (db.user.create as jest.Mock).mockResolvedValue(MOCK_USER);

        const result = await register({ email: 'test@example.com', password: 'password123' });

        expect(result.user.email).toBe('test@example.com');
        expect(result.user.id).toBe('user-id-123');
        expect(typeof result.token).toBe('string');
        expect(result.token.split('.').length).toBe(3); // valid JWT format
    });

    it('lowercases the email before saving', async () => {
        (db.user.findUnique as jest.Mock).mockResolvedValue(null);
        (db.user.create as jest.Mock).mockResolvedValue(MOCK_USER);

        await register({ email: 'UPPER@EXAMPLE.COM', password: 'password123' });

        expect(db.user.findUnique).toHaveBeenCalledWith({
            where: { email: 'upper@example.com' },
        });
    });

    it('hashes the password before saving', async () => {
        (db.user.findUnique as jest.Mock).mockResolvedValue(null);

        let capturedPassword: string | null = null;
        (db.user.create as jest.Mock).mockImplementation(({ data }) => {
            capturedPassword = data.password;
            return Promise.resolve(MOCK_USER);
        });

        await register({ email: 'test@example.com', password: 'plaintext' });

        expect(capturedPassword).not.toBe('plaintext');
        expect(capturedPassword).not.toBeNull();
        const isHashed = await bcrypt.compare('plaintext', capturedPassword!);
        expect(isHashed).toBe(true);
    });

    it('throws ConflictError when email already exists', async () => {
        (db.user.findUnique as jest.Mock).mockResolvedValue(MOCK_USER);

        await expect(
            register({ email: 'test@example.com', password: 'password123' }),
        ).rejects.toThrow(ConflictError);
    });

    it('JWT token contains user id and email', async () => {
        (db.user.findUnique as jest.Mock).mockResolvedValue(null);
        (db.user.create as jest.Mock).mockResolvedValue(MOCK_USER);

        const result = await register({ email: 'test@example.com', password: 'password123' });

        const decoded = jwt.decode(result.token) as Record<string, unknown>;
        expect(decoded.id).toBe(MOCK_USER.id);
        expect(decoded.email).toBe(MOCK_USER.email);
    });

    it('JWT token embeds the user\'s current tokenVersion', async () => {
        (db.user.findUnique as jest.Mock).mockResolvedValue(null);
        (db.user.create as jest.Mock).mockResolvedValue({ ...MOCK_USER, tokenVersion: 3 });

        const result = await register({ email: 'test@example.com', password: 'password123' });

        const decoded = jwt.decode(result.token) as Record<string, unknown>;
        expect(decoded.tokenVersion).toBe(3);
    });
});

// ── login ─────────────────────────────────────────────────────────────────────

describe('login', () => {
    it('returns token and user for valid credentials', async () => {
        (db.user.findUnique as jest.Mock).mockResolvedValue(MOCK_USER);

        const result = await login({ email: 'test@example.com', password: 'correct-password' });

        expect(result.user.email).toBe('test@example.com');
        expect(typeof result.token).toBe('string');
    });

    it('lowercases email when looking up user', async () => {
        (db.user.findUnique as jest.Mock).mockResolvedValue(MOCK_USER);

        await login({ email: 'TEST@EXAMPLE.COM', password: 'correct-password' });

        expect(db.user.findUnique).toHaveBeenCalledWith({
            where: { email: 'test@example.com' },
        });
    });

    it('throws UnauthorizedError for unknown email', async () => {
        (db.user.findUnique as jest.Mock).mockResolvedValue(null);

        await expect(
            login({ email: 'unknown@example.com', password: 'any' }),
        ).rejects.toThrow(UnauthorizedError);
    });

    it('throws UnauthorizedError for wrong password', async () => {
        (db.user.findUnique as jest.Mock).mockResolvedValue(MOCK_USER);

        await expect(
            login({ email: 'test@example.com', password: 'wrong-password' }),
        ).rejects.toThrow(UnauthorizedError);
    });

    it('throws UnauthorizedError for inactive account', async () => {
        (db.user.findUnique as jest.Mock).mockResolvedValue({
            ...MOCK_USER,
            isActive: false,
        });

        await expect(
            login({ email: 'test@example.com', password: 'correct-password' }),
        ).rejects.toThrow(UnauthorizedError);
    });

    it('JWT token is signed with configured secret', async () => {
        (db.user.findUnique as jest.Mock).mockResolvedValue(MOCK_USER);

        const result = await login({ email: 'test@example.com', password: 'correct-password' });

        expect(() =>
            jwt.verify(result.token, 'test-jwt-secret-min-32-characters!!'),
        ).not.toThrow();
    });

    it('JWT token contains user id', async () => {
        (db.user.findUnique as jest.Mock).mockResolvedValue(MOCK_USER);

        const result = await login({ email: 'test@example.com', password: 'correct-password' });

        const decoded = jwt.decode(result.token) as Record<string, unknown>;
        expect(decoded.id).toBe(MOCK_USER.id);
    });
});

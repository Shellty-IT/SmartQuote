// src/services/auth.service.ts
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { config } from '../config';
import { ConflictError, NotFoundError, UnauthorizedError } from '../errors/domain.errors';
import { createModuleLogger } from '../lib/logger';

const log = createModuleLogger('auth');

interface RegisterInput {
    email: string;
    password: string;
    name?: string | null;
}

interface LoginInput {
    email: string;
    password: string;
}

interface AuthUser {
    id: string;
    email: string;
    name: string | null;
    role: string;
}

interface AuthResponse {
    user: AuthUser;
    token: string;
}

const TOKEN_EXPIRES_IN: SignOptions['expiresIn'] = '7d';

function signToken(userId: string, email: string, tokenVersion: number): string {
    return jwt.sign(
        { id: userId, userId, email, tokenVersion },
        config.jwtSecret,
        { algorithm: 'HS256', expiresIn: TOKEN_EXPIRES_IN },
    );
}

export async function register(data: RegisterInput): Promise<AuthResponse> {
    const email = data.email.toLowerCase();

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new ConflictError('Użytkownik z tym adresem email już istnieje');
    }

    const hashedPassword = await bcrypt.hash(data.password, config.saltRounds);

    const user = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            name: data.name ?? null,
        },
    });

    await prisma.userSettings.create({ data: { userId: user.id } }).catch((err: unknown) => {
        log.warn({ err, userId: user.id }, 'Failed to create default userSettings');
    });

    log.info({ userId: user.id, email: user.email }, 'User registered');

    return {
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        token: signToken(user.id, user.email, user.tokenVersion),
    };
}

export async function login(data: LoginInput): Promise<AuthResponse> {
    const email = data.email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        log.warn({ email }, 'Login attempt for unknown email');
        throw new UnauthorizedError('Nieprawidłowy email lub hasło');
    }

    const isValid = await bcrypt.compare(data.password, user.password);
    if (!isValid) {
        log.warn({ userId: user.id }, 'Login failed: invalid password');
        throw new UnauthorizedError('Nieprawidłowy email lub hasło');
    }

    if (!user.isActive) {
        log.warn({ userId: user.id }, 'Login attempt for inactive user');
        throw new UnauthorizedError('Konto jest nieaktywne');
    }

    log.info({ userId: user.id }, 'User logged in');

    return {
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        token: signToken(user.id, user.email, user.tokenVersion),
    };
}

export async function getMe(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            avatar: true,
            role: true,
            createdAt: true,
            companyInfo: {
                select: {
                    name: true,
                    nip: true,
                    address: true,
                    city: true,
                    postalCode: true,
                    phone: true,
                    email: true,
                    website: true,
                    logo: true,
                    primaryColor: true,
                },
            },
        },
    });

    if (!user) {
        throw new NotFoundError('Użytkownik');
    }

    return {
        ...user,
        company: user.companyInfo?.name ?? null,
    };
}

export const authService = { register, login, getMe };

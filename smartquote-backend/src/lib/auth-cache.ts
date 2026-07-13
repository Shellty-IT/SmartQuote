// src/lib/auth-cache.ts
import { MemoryCache } from './cache';

interface CachedUser {
    id: string;
    email: string;
    name: string | null;
    role: string;
    isActive: boolean;
    tokenVersion: number;
}

const cache = new MemoryCache(10_000);
const TTL_SECONDS = 5 * 60;

export const authCache = {
    get(userId: string): CachedUser | null {
        return cache.get<CachedUser>(userId);
    },

    set(user: CachedUser): void {
        cache.set(user.id, user, TTL_SECONDS);
    },

    invalidate(userId: string): void {
        cache.delete(userId);
    },

    clear(): void {
        cache.clear();
    },
};

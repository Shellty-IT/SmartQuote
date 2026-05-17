// src/lib/api/auth.api.ts

import { api } from './client';
import type { User } from '@/types';

export const authApi = {
    login: (email: string, password: string) =>
        api.post<{ user: User; token: string }>('/auth/login', { email, password }),
    register: (data: { email: string; password: string; name?: string }) =>
        api.post<{ user: User; token: string }>('/auth/register', data),
    me: () =>
        api.get<User>('/auth/me'),
};
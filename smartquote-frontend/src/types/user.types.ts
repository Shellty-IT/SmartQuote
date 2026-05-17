// src/types/user.types.ts

export interface User {
    id: string;
    email: string;
    name: string | null;
    company?: string | null;
    phone?: string | null;
    role: 'USER' | 'ADMIN';
    createdAt: string;
}
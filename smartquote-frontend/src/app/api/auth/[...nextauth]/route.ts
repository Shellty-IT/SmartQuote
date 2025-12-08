import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { NextAuthOptions } from 'next-auth';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Hasło', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Wprowadź email i hasło');
                }

                try {
                    console.log('[NextAuth] Próba logowania do:', `${BACKEND_URL}/api/auth/login`);

                    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify({
                            email: credentials.email,
                            password: credentials.password,
                        }),
                    });

                    const data = await response.json();

                    console.log('[NextAuth] Odpowiedź z backendu:', {
                        status: response.status,
                        success: data.success
                    });

                    if (!response.ok || !data.success) {
                        throw new Error(data.error?.message || 'Błąd logowania');
                    }

                    return {
                        id: data.data.user.id,
                        email: data.data.user.email,
                        name: data.data.user.name,
                        role: data.data.user.role,
                        accessToken: data.data.token,
                    };
                } catch (error) {
                    const message = error instanceof Error ? error.message : 'Nieprawidłowy email lub hasło';
                    console.error('[NextAuth] Błąd autoryzacji:', message);
                    throw new Error(message);
                }
            },
        }),
    ],

    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.name = user.name;
                // Bezpieczny dostęp do rozszerzonych właściwości
                if ('role' in user) {
                    token.role = user.role;
                }
                if ('accessToken' in user) {
                    token.accessToken = user.accessToken;
                }
            }
            return token;
        },

        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id;
                session.user.role = token.role;
            }
            session.accessToken = token.accessToken;
            return session;
        },
    },

    pages: {
        signIn: '/',
        error: '/',
    },

    session: {
        strategy: 'jwt',
        maxAge: 24 * 60 * 60,
    },

    secret: process.env.NEXTAUTH_SECRET,

    debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

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
                    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email: credentials.email,
                            password: credentials.password,
                        }),
                    });

                    const data = await response.json();

                    if (!response.ok || !data.success) {
                        throw new Error(data.error?.message || 'Błąd logowania');
                    }

                    // Zwróć użytkownika z tokenem JWT z backendu
                    return {
                        id: data.data.user.id,
                        email: data.data.user.email,
                        name: data.data.user.name,
                        role: data.data.user.role,
                        accessToken: data.data.token, // Token JWT z backendu
                    };
                } catch (error: any) {
                    console.error('[NextAuth] Auth error:', error.message);
                    throw new Error(error.message || 'Nieprawidłowy email lub hasło');
                }
            },
        }),
    ],

    callbacks: {
        async jwt({ token, user }) {
            // Przy pierwszym logowaniu dodaj dane użytkownika do tokena
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.name = user.name;
                token.role = (user as any).role;
                token.accessToken = (user as any).accessToken;
            }
            return token;
        },

        async session({ session, token }) {
            // Przekaż dane z tokena do sesji
            if (session.user) {
                (session.user as any).id = token.id;
                session.user.email = token.email as string;
                session.user.name = token.name as string;
                (session as any).accessToken = token.accessToken;
                (session.user as any).role = token.role;
            }
            return session;
        },
    },

    pages: {
        signIn: '/',
        error: '/',
    },

    session: {
        strategy: 'jwt',
        maxAge: 24 * 60 * 60, // 24 godziny
    },

    secret: process.env.NEXTAUTH_SECRET,

    debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
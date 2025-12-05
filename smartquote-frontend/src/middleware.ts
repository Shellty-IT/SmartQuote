import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
    function middleware(req) {
        // Możesz dodać dodatkową logikę tutaj
        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
        pages: {
            signIn: '/',
        },
    }
);

// Chroń wszystkie ścieżki zaczynające się od /dashboard
export const config = {
    matcher: ['/dashboard/:path*'],
};
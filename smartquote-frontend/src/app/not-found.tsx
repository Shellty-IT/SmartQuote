import Link from 'next/link';
import { Home } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="relative flex min-h-screen items-center justify-center bg-background p-4">
            <div className="pointer-events-none absolute inset-0 bg-gradient-mesh opacity-50" />
            <div className="relative max-w-md w-full text-center">
                <p className="select-none text-8xl font-black leading-none text-primary/15 mb-4">404</p>
                <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl border border-border bg-card shadow-card">
                    <svg className="h-7 w-7 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h1 className="mb-2 text-2xl font-bold tracking-tight">Page not found</h1>
                <p className="mb-8 text-sm text-muted-foreground">
                    The page you are looking for does not exist or has been moved to a different address.
                </p>
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-6 py-3 text-sm font-semibold text-white shadow-glow ring-1 ring-white/15 transition hover:brightness-110"
                >
                    <Home className="h-4 w-4" /> Back to dashboard
                </Link>
            </div>
        </div>
    );
}

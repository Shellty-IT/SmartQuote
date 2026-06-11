'use client';

import { useEffect } from 'react';

interface ErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.error('[GlobalError]', error);
        }
    }, [error]);

    return (
        <html lang="en">
            <body style={{ backgroundColor: 'oklch(0.985 0.008 240)', color: 'oklch(0.22 0.05 250)' }}>
                <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div style={{ maxWidth: '28rem', width: '100%', textAlign: 'center' }}>
                        <div style={{
                            width: '4rem', height: '4rem', borderRadius: '1rem',
                            background: 'oklch(0.6 0.22 25 / 0.12)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 1.5rem',
                            border: '1px solid oklch(0.6 0.22 25 / 0.25)',
                        }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="oklch(0.6 0.22 25)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                                <line x1="12" y1="9" x2="12" y2="13"/>
                                <line x1="12" y1="17" x2="12.01" y2="17"/>
                            </svg>
                        </div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                            An unexpected error occurred
                        </h1>
                        <p style={{ color: 'oklch(0.5 0.04 248)', marginBottom: '2rem', fontSize: '0.875rem' }}>
                            Sorry for the inconvenience. Try refreshing the page or go back to the dashboard.
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                            <button
                                onClick={reset}
                                style={{
                                    padding: '0.625rem 1.25rem',
                                    background: 'linear-gradient(135deg, oklch(0.62 0.18 248), oklch(0.72 0.16 210))',
                                    color: 'white',
                                    borderRadius: '0.75rem',
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    border: 'none',
                                    cursor: 'pointer',
                                }}
                            >
                                Try again
                            </button>
                            <a
                                href="/dashboard"
                                style={{
                                    padding: '0.625rem 1.25rem',
                                    background: 'oklch(0.955 0.018 240)',
                                    color: 'oklch(0.22 0.05 250)',
                                    borderRadius: '0.75rem',
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    border: '1px solid oklch(0.92 0.018 240)',
                                    textDecoration: 'none',
                                }}
                            >
                                Back to dashboard
                            </a>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    );
}

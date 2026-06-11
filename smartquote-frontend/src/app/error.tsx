'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface ErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function RootError({ error, reset }: ErrorProps) {
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.error('[RootError]', error);
        }
    }, [error]);

    return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
            <div className="max-w-sm w-full text-center">
                <div className="w-14 h-14 bg-destructive/15 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <svg className="w-7 h-7 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">Wystąpił nieoczekiwany błąd</h2>
                <p className="text-muted-foreground text-sm mb-6">
                    Przepraszamy za niedogodności. Spróbuj ponownie lub wróć do panelu.
                </p>
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={reset}
                        className="px-4 py-2 bg-primary hover:brightness-110 text-white rounded-xl text-sm font-medium transition-colors"
                    >
                        Spróbuj ponownie
                    </button>
                    <Link
                        href="/dashboard"
                        className="px-4 py-2 bg-secondary hover:bg-secondary text-foreground rounded-xl text-sm font-medium transition-colors"
                    >
                        Panel główny
                    </Link>
                </div>
            </div>
        </div>
    );
}

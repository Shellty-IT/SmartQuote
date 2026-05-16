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
        <html lang="pl">
            <body className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
                <div className="max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        Wystąpił nieoczekiwany błąd
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm">
                        Przepraszamy za utrudnienia. Spróbuj odświeżyć stronę lub wróć do dashboardu.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={reset}
                            className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-medium transition-colors"
                        >
                            Spróbuj ponownie
                        </button>
                        <a
                            href="/dashboard"
                            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium transition-colors"
                        >
                            Wróć do dashboardu
                        </a>
                    </div>
                </div>
            </body>
        </html>
    );
}

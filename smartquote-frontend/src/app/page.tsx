// src/app/page.tsx
'use client';

import { useState, useEffect, useRef, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Image from 'next/image';
import { checkBackendHealth } from '@/lib/api';

type BackendStatus = 'checking' | 'waking' | 'ready' | 'error';

export default function LoginPage() {
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [backendStatus, setBackendStatus] = useState<BackendStatus>('checking');
    const [wakeAttempt, setWakeAttempt] = useState(0);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const wakeStartTimeRef = useRef(0);
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        let cancelled = false;
        wakeStartTimeRef.current = Date.now();

        const runCheck = async () => {
            const maxAttempts = 12;
            for (let i = 0; i < maxAttempts; i++) {
                const ok = await checkBackendHealth();
                if (cancelled) return;
                if (ok) {
                    setBackendStatus('ready');
                    return;
                }
                setWakeAttempt(i + 1);
                if (i === 0) {
                    setBackendStatus('waking');
                }
                if (i < maxAttempts - 1) {
                    await new Promise<void>(r => setTimeout(r, 5000));
                    if (cancelled) return;
                }
            }
            setBackendStatus('error');
        };

        void runCheck();

        return () => {
            cancelled = true;
        };
    }, [retryCount]);

    useEffect(() => {
        if (backendStatus !== 'waking' && backendStatus !== 'checking') return;

        const interval = setInterval(() => {
            setElapsedSeconds(
                Math.floor((Date.now() - wakeStartTimeRef.current) / 1000),
            );
        }, 1000);

        return () => clearInterval(interval);
    }, [backendStatus]);

    const handleRetry = () => {
        setBackendStatus('checking');
        setWakeAttempt(0);
        setElapsedSeconds(0);
        setRetryCount(c => c + 1);
    };

    const handleLogin = async () => {
        setError('');
        setIsLoading(true);

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError('Nieprawidłowy email lub hasło');
                setIsLoading(false);
                return;
            }

            if (result?.ok) {
                router.push('/dashboard');
            }
        } catch {
            setError('Wystąpił błąd podczas logowania. Spróbuj ponownie.');
            setIsLoading(false);
        }
    };

    const isFormDisabled =
        isLoading || backendStatus === 'checking' || backendStatus === 'waking';

    const statusConfig: Record<
        BackendStatus,
        { icon: ReactNode; text: string; color: string; bg: string }
    > = {
        checking: {
            icon: (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
            ),
            text: 'Sprawdzanie połączenia...',
            color: 'text-slate-600',
            bg: 'bg-slate-50 border-slate-200',
        },
        waking: {
            icon: (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
            ),
            text: `Budzenie serwera... (${elapsedSeconds}s)`,
            color: 'text-amber-700',
            bg: 'bg-amber-50 border-amber-200',
        },
        ready: {
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            ),
            text: 'Serwer gotowy',
            color: 'text-emerald-700',
            bg: 'bg-emerald-50 border-emerald-200',
        },
        error: {
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            text: 'Nie można połączyć z serwerem',
            color: 'text-red-700',
            bg: 'bg-red-50 border-red-200',
        },
    };

    const currentStatus = statusConfig[backendStatus];

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-cyan-50/30 to-blue-50 px-4">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-cyan-200 rounded-full opacity-15 blur-3xl animate-pulse" />
                <div
                    className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-200 rounded-full opacity-15 blur-3xl animate-pulse"
                    style={{ animationDelay: '2s' }}
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-cyan-100 to-blue-100 rounded-full opacity-10 blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-cyan-500/10 p-8 border border-white/50">
                    <div className="text-center mb-8">
                        <Image
                            src="/android-chrome-512x512.png"
                            alt="SmartQuote AI"
                            width={64}
                            height={64}
                            className="mx-auto mb-4"
                            priority
                        />
                        <h1 className="text-2xl font-bold text-slate-800">SmartQuote AI</h1>
                        <p className="text-slate-500 mt-2">Zaloguj się do swojego konta</p>
                    </div>

                    <div className={`mb-6 p-3 rounded-xl border flex items-center gap-3 transition-all duration-500 ${currentStatus.bg}`}>
                        <div className={currentStatus.color}>{currentStatus.icon}</div>
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${currentStatus.color}`}>{currentStatus.text}</p>
                            {backendStatus === 'waking' && (
                                <p className="text-xs text-amber-600 mt-0.5">
                                    Darmowy serwer wymaga rozruchu — to może potrwać do 60s
                                </p>
                            )}
                        </div>
                        {backendStatus === 'error' && (
                            <button
                                onClick={handleRetry}
                                className="text-xs font-medium text-red-600 hover:text-red-700 underline flex-shrink-0"
                            >
                                Ponów
                            </button>
                        )}
                    </div>

                    {backendStatus === 'waking' && (
                        <div className="mb-6">
                            <div className="h-1.5 bg-amber-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `${Math.min((wakeAttempt / 12) * 100, 95)}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-red-700 text-sm">{error}</span>
                        </div>
                    )}

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            void handleLogin();
                        }}
                        className="space-y-5"
                    >
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                                Adres email
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                    </svg>
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    disabled={isFormDisabled}
                                    className="block w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl
                                    focus:ring-2 focus:ring-cyan-500 focus:border-transparent
                                    disabled:bg-slate-50 disabled:text-slate-400
                                    placeholder-slate-400 text-slate-800 transition-all duration-200"
                                    placeholder="jan@firma.pl"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                                Hasło
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    disabled={isFormDisabled}
                                    className="block w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl
                                    focus:ring-2 focus:ring-cyan-500 focus:border-transparent
                                    disabled:bg-slate-50 disabled:text-slate-400
                                    placeholder-slate-400 text-slate-800 transition-all duration-200"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isFormDisabled}
                            className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600
                            text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/30
                            hover:from-cyan-600 hover:to-blue-700
                            focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2
                            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-cyan-500 disabled:hover:to-blue-600
                            transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {isLoading ? (
                                <span className="inline-flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor"
                                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Logowanie...
                                </span>
                            ) : backendStatus !== 'ready' ? (
                                'Oczekiwanie na serwer...'
                            ) : (
                                'Zaloguj się'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-slate-500">
                            Nie masz konta?{' '}
                            <a href="/register" className="font-medium text-cyan-600 hover:text-cyan-700 transition-colors">
                                Zarejestruj się
                            </a>
                        </p>
                    </div>
                </div>

                <p className="text-center text-xs text-slate-400 mt-6">© 2025 SmartQuote AI. Wszelkie prawa zastrzeżone.</p>
            </div>
        </div>
    );
}
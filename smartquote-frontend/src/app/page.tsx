// src/app/page.tsx
'use client';

import { useState, useEffect, useRef, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { Mail, Lock, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { checkBackendHealth } from '@/lib/api';
import { cn } from '@/lib/utils';

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
                if (ok) { setBackendStatus('ready'); return; }
                setWakeAttempt(i + 1);
                if (i === 0) setBackendStatus('waking');
                if (i < maxAttempts - 1) {
                    await new Promise<void>(r => setTimeout(r, 5000));
                    if (cancelled) return;
                }
            }
            setBackendStatus('error');
        };

        void runCheck();
        return () => { cancelled = true; };
    }, [retryCount]);

    useEffect(() => {
        if (backendStatus !== 'waking' && backendStatus !== 'checking') return;
        const interval = setInterval(() => {
            setElapsedSeconds(Math.floor((Date.now() - wakeStartTimeRef.current) / 1000));
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
            const result = await signIn('credentials', { email, password, redirect: false });
            if (result?.error) { setError('Nieprawidłowy adres email lub hasło'); setIsLoading(false); return; }
            if (result?.ok) router.push('/dashboard');
        } catch {
            setError('Wystąpił błąd podczas logowania. Spróbuj ponownie.');
            setIsLoading(false);
        }
    };

    const isFormDisabled = isLoading || backendStatus === 'checking' || backendStatus === 'waking';

    const statusBanner: Record<BackendStatus, { icon: ReactNode; text: string; cls: string }> = {
        checking: { icon: <Loader2 className="h-4 w-4 animate-spin" />, text: 'Sprawdzanie połączenia...', cls: 'bg-primary/10 text-primary border-primary/20' },
        waking: { icon: <Loader2 className="h-4 w-4 animate-spin" />, text: `Budzenie serwera… (${elapsedSeconds}s)`, cls: 'bg-primary/10 text-primary border-primary/20' },
        ready: { icon: <CheckCircle2 className="h-4 w-4" />, text: 'Serwer gotowy', cls: 'bg-status-accepted/10 text-status-accepted border-status-accepted/20' },
        error: { icon: <AlertCircle className="h-4 w-4" />, text: 'Brak połączenia z serwerem', cls: 'bg-destructive/10 text-destructive border-destructive/20' },
    };

    const banner = statusBanner[backendStatus];

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
            {/* Mesh background */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-mesh opacity-60" />

            <div className="relative w-full max-w-md">
                {/* Card */}
                <div className="rounded-2xl border border-border bg-card p-8 shadow-elevated">
                    {/* Logo + brand */}
                    <div className="mb-8 text-center">
                        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center overflow-hidden rounded-2xl bg-gradient-primary shadow-glow ring-1 ring-white/20">
                            <Image src="/logo.svg" alt="SmartQuote" width={40} height={40} className="object-contain" priority />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">SmartQuote</h1>
                        <p className="mt-1 text-sm text-muted-foreground">Zaloguj się do panelu CRM</p>
                    </div>

                    {/* Backend status banner */}
                    <div className={cn('mb-6 flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all', banner.cls)}>
                        {banner.icon}
                        <span className="flex-1">{banner.text}</span>
                        {backendStatus === 'waking' && (
                            <span className="text-xs opacity-70">do 60s</span>
                        )}
                        {backendStatus === 'error' && (
                            <button onClick={handleRetry} className="shrink-0 text-xs underline opacity-80 hover:opacity-100">Ponów</button>
                        )}
                    </div>

                    {/* Wake progress */}
                    {backendStatus === 'waking' && (
                        <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-secondary">
                            <div
                                className="h-full rounded-full bg-gradient-primary transition-all duration-1000"
                                style={{ width: `${Math.min((wakeAttempt / 12) * 100, 95)}%` }}
                            />
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="mb-5 flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={(e) => { e.preventDefault(); void handleLogin(); }} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground">
                                Adres email
                            </label>
                            <div className="relative">
                                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    id="email" name="email" type="email" autoComplete="email" required
                                    value={email} onChange={e => setEmail(e.target.value)} disabled={isFormDisabled}
                                    placeholder="jan@firma.pl"
                                    className="h-11 w-full rounded-lg border border-border bg-card pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:opacity-50"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-foreground">
                                Hasło
                            </label>
                            <div className="relative">
                                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    id="password" name="password" type="password" autoComplete="current-password" required
                                    value={password} onChange={e => setPassword(e.target.value)} disabled={isFormDisabled}
                                    placeholder="••••••••"
                                    className="h-11 w-full rounded-lg border border-border bg-card pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:opacity-50"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isFormDisabled}
                            className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary text-sm font-semibold text-white shadow-glow ring-1 ring-white/15 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isLoading
                                ? <><Loader2 className="h-4 w-4 animate-spin" /> Logowanie…</>
                                : backendStatus !== 'ready'
                                    ? 'Oczekiwanie na serwer…'
                                    : 'Zaloguj się'
                            }
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-muted-foreground">
                        Nie masz konta?{' '}
                        <Link href="/register" className="font-semibold text-primary hover:underline">
                            Zarejestruj się
                        </Link>
                    </div>
                </div>

                <p className="mt-6 text-center text-xs text-muted-foreground">
                    © 2026 SmartQuote AI by{' '}
                    <a href="https://shellty-it.github.io/" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                        Shellty IT
                    </a>
                </p>
            </div>
        </div>
    );
}

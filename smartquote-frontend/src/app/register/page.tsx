// src/app/register/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface FormErrors {
    email?: string;
    password?: string;
    confirmPassword?: string;
    name?: string;
    general?: string;
}

export default function RegisterPage() {
    const router = useRouter();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        if (!formData.email) {
            newErrors.email = 'Email jest wymagany';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Nieprawidłowy format email';
        }

        if (!formData.password) {
            newErrors.password = 'Hasło jest wymagane';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Hasło musi mieć minimum 8 znaków';
        } else if (!/[A-Z]/.test(formData.password)) {
            newErrors.password = 'Hasło musi zawierać wielką literę';
        } else if (!/[a-z]/.test(formData.password)) {
            newErrors.password = 'Hasło musi zawierać małą literę';
        } else if (!/[0-9]/.test(formData.password)) {
            newErrors.password = 'Hasło musi zawierać cyfrę';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Hasła nie są identyczne';
        }

        if (formData.name && formData.name.length < 2) {
            newErrors.name = 'Imię musi mieć minimum 2 znaki';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (errors[name as keyof FormErrors]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrors({});

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

            const response = await fetch(`${backendUrl}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    name: formData.name || undefined,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.error?.code === 'USER_EXISTS') {
                    setErrors({ email: 'Użytkownik z tym adresem email już istnieje' });
                } else if (data.error?.details) {
                    const fieldErrors: FormErrors = {};
                    data.error.details.forEach((err: { field: string; message: string }) => {
                        fieldErrors[err.field as keyof FormErrors] = err.message;
                    });
                    setErrors(fieldErrors);
                } else {
                    setErrors({ general: data.error?.message || 'Błąd rejestracji' });
                }
                return;
            }

            setSuccess(true);

            setTimeout(() => {
                router.push('/?registered=true');
            }, 2000);

        } catch {

            setErrors({ general: 'Wystąpił błąd połączenia z serwerem' });
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
                <div className="bg-card border-border border rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-primary shadow-glow flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">Konto utworzone!</h2>
                    <p className="text-muted-foreground mb-4">Za chwilę zostaniesz przekierowany do logowania...</p>
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
            <div className="pointer-events-none absolute inset-0 bg-gradient-mesh opacity-60">
            </div>

            <div className="relative w-full max-w-md">
                <div className="rounded-2xl border border-border bg-card p-8 shadow-elevated">
                    <div className="text-center mb-8">
                        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center overflow-hidden rounded-2xl bg-gradient-primary shadow-glow ring-1 ring-white/20">
                            <svg
                                className="w-8 h-8 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                                />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-foreground">Utwórz konto</h1>
                        <p className="text-muted-foreground mt-2">Dołącz do SmartQuote AI</p>
                    </div>

                    {errors.general && (
                        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/25 rounded-lg flex items-center gap-3">
                            <svg
                                className="w-5 h-5 text-destructive flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            <span className="text-destructive text-sm">{errors.general}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-muted-foreground mb-2">
                                Imię i nazwisko <span className="text-muted-foreground">(opcjonalne)</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    autoComplete="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                    className={`block w-full pl-10 pr-4 py-3 border rounded-lg border-border bg-card text-foreground
                    focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30
                    disabled:opacity-50 transition-all duration-200
                    ${errors.name ? 'border-destructive bg-destructive/5' : ''}`}
                                    placeholder="Jan Kowalski"
                                />
                            </div>
                            {errors.name && (
                                <p className="mt-1 text-sm text-status-rejected">{errors.name}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-2">
                                Adres email <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                    </svg>
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                    className={`block w-full pl-10 pr-4 py-3 border rounded-lg border-border bg-card text-foreground
                    focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30
                    disabled:opacity-50 transition-all duration-200
                    ${errors.email ? 'border-destructive bg-destructive/5' : ''}`}
                                    placeholder="jan@firma.pl"
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-1 text-sm text-status-rejected">{errors.email}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-muted-foreground mb-2">
                                Hasło <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                    className={`block w-full pl-10 pr-4 py-3 border rounded-lg border-border bg-card text-foreground
                    focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30
                    disabled:opacity-50 transition-all duration-200
                    ${errors.password ? 'border-destructive bg-destructive/5' : ''}`}
                                    placeholder="Min. 8 znaków"
                                />
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-sm text-status-rejected">{errors.password}</p>
                            )}
                            <p className="mt-1 text-xs text-muted-foreground">
                                Min. 8 znaków, wielka i mała litera, cyfra
                            </p>
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-muted-foreground mb-2">
                                Potwierdź hasło <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                    className={`block w-full pl-10 pr-4 py-3 border rounded-lg border-border bg-card text-foreground
                    focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30
                    disabled:opacity-50 transition-all duration-200
                    ${errors.confirmPassword ? 'border-destructive bg-destructive/5' : ''}`}
                                    placeholder="Powtórz hasło"
                                />
                            </div>
                            {errors.confirmPassword && (
                                <p className="mt-1 text-sm text-status-rejected">{errors.confirmPassword}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 px-4 bg-gradient-to-r bg-gradient-primary
                text-white font-semibold rounded-lg shadow-lg shadow-cyan-500/30
                hover:from-cyan-600 hover:to-blue-700
                focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2
                disabled:opacity-70 disabled:cursor-not-allowed
                transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {isLoading ? (
                                <span className="inline-flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Tworzę konto...
                </span>
                            ) : (
                                'Utwórz konto'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-muted-foreground">
                            Masz już konto?{' '}
                            <Link
                                href="/"
                                className="font-medium text-primary hover:text-primary dark:hover:text-cyan-300 transition-colors"
                            >
                                Zaloguj się
                            </Link>
                        </p>
                    </div>
                </div>

                <p className="text-center text-xs text-muted-foreground mt-6">
                    Rejestrując się, akceptujesz{' '}
                    <a href="#" className="underline hover:text-foreground">Regulamin</a>
                    {' '}i{' '}
                    <a href="#" className="underline hover:text-foreground">Politykę Prywatności</a>
                </p>
            </div>
        </div>
    );
}
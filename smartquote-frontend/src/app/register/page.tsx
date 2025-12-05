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

        // Email
        if (!formData.email) {
            newErrors.email = 'Email jest wymagany';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Nieprawidłowy format email';
        }

        // Hasło
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

        // Potwierdzenie hasła
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Hasła nie są identyczne';
        }

        // Imię (opcjonalne, ale jeśli podane - min 2 znaki)
        if (formData.name && formData.name.length < 2) {
            newErrors.name = 'Imię musi mieć minimum 2 znaki';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Wyczyść błąd pola przy edycji
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
                    // Mapuj błędy walidacji z backendu
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

            // Sukces!
            setSuccess(true);

            // Przekieruj po 2 sekundach
            setTimeout(() => {
                router.push('/?registered=true');
            }, 2000);

        } catch (error) {
            console.error('Registration error:', error);
            setErrors({ general: 'Wystąpił błąd połączenia z serwerem' });
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-cyan-50 px-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Konto utworzone!</h2>
                    <p className="text-slate-500 mb-4">Za chwilę zostaniesz przekierowany do logowania...</p>
                    <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-cyan-50 px-4">
            {/* Decorative background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-200 rounded-full opacity-20 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full opacity-20 blur-3xl" />
            </div>

            {/* Register Card */}
            <div className="relative w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-xl shadow-cyan-500/10 p-8 border border-slate-100">
                    {/* Logo / Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl mb-4 shadow-lg shadow-cyan-500/30">
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
                        <h1 className="text-2xl font-bold text-slate-800">Utwórz konto</h1>
                        <p className="text-slate-500 mt-2">Dołącz do SmartQuote AI</p>
                    </div>

                    {/* General Error Message */}
                    {errors.general && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                            <svg
                                className="w-5 h-5 text-red-500 flex-shrink-0"
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
                            <span className="text-red-700 text-sm">{errors.general}</span>
                        </div>
                    )}

                    {/* Register Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Name Field */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                                Imię i nazwisko <span className="text-slate-400">(opcjonalne)</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                    className={`block w-full pl-10 pr-4 py-3 border rounded-lg
                                        focus:ring-2 focus:ring-cyan-500 focus:border-transparent
                                        disabled:bg-slate-50 disabled:text-slate-400
                                        placeholder-slate-400 text-slate-800 transition-all duration-200
                                        ${errors.name ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                                    placeholder="Jan Kowalski"
                                />
                            </div>
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                            )}
                        </div>

                        {/* Email Field */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                                Adres email <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                    className={`block w-full pl-10 pr-4 py-3 border rounded-lg
                                        focus:ring-2 focus:ring-cyan-500 focus:border-transparent
                                        disabled:bg-slate-50 disabled:text-slate-400
                                        placeholder-slate-400 text-slate-800 transition-all duration-200
                                        ${errors.email ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                                    placeholder="jan@firma.pl"
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                            )}
                        </div>

                        {/* Password Field */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                                Hasło <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                    className={`block w-full pl-10 pr-4 py-3 border rounded-lg
                                        focus:ring-2 focus:ring-cyan-500 focus:border-transparent
                                        disabled:bg-slate-50 disabled:text-slate-400
                                        placeholder-slate-400 text-slate-800 transition-all duration-200
                                        ${errors.password ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                                    placeholder="Min. 8 znaków"
                                />
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                            )}
                            <p className="mt-1 text-xs text-slate-400">
                                Min. 8 znaków, wielka i mała litera, cyfra
                            </p>
                        </div>

                        {/* Confirm Password Field */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                                Potwierdź hasło <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                    className={`block w-full pl-10 pr-4 py-3 border rounded-lg
                                        focus:ring-2 focus:ring-cyan-500 focus:border-transparent
                                        disabled:bg-slate-50 disabled:text-slate-400
                                        placeholder-slate-400 text-slate-800 transition-all duration-200
                                        ${errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                                    placeholder="Powtórz hasło"
                                />
                            </div>
                            {errors.confirmPassword && (
                                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600
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

                    {/* Footer */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-slate-500">
                            Masz już konto?{' '}
                            <Link
                                href="/"
                                className="font-medium text-cyan-600 hover:text-cyan-700 transition-colors"
                            >
                                Zaloguj się
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Bottom text */}
                <p className="text-center text-xs text-slate-400 mt-6">
                    Rejestrując się, akceptujesz{' '}
                    <a href="#" className="underline hover:text-slate-600">Regulamin</a>
                    {' '}i{' '}
                    <a href="#" className="underline hover:text-slate-600">Politykę Prywatności</a>
                </p>
            </div>
        </div>
    );
}
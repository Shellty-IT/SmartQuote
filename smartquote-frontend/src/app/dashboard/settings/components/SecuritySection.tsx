// src/app/dashboard/settings/components/SecuritySection.tsx
'use client';

import { useState } from 'react';
import { Card } from '@/components/ui';
import Button from '@/components/ui/Button';
import type { ChangePasswordInput } from '@/types';

interface Props {
    onChangePassword: (data: ChangePasswordInput) => Promise<void>;
}

export default function SecuritySection({ onChangePassword }: Props) {
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const validatePassword = (password: string): string[] => {
        const errors: string[] = [];
        if (password.length < 8) errors.push('Min. 8 znaków');
        if (!/[A-Z]/.test(password)) errors.push('Wielka litera');
        if (!/[a-z]/.test(password)) errors.push('Mała litera');
        if (!/[0-9]/.test(password)) errors.push('Cyfra');
        return errors;
    };

    const passwordErrors = validatePassword(formData.newPassword);
    const passwordsMatch = formData.newPassword === formData.confirmPassword;
    const canSubmit =
        formData.currentPassword &&
        formData.newPassword &&
        formData.confirmPassword &&
        passwordErrors.length === 0 &&
        passwordsMatch;

    const handleSubmit = async () => {
        if (!canSubmit) return;

        setIsSaving(true);
        setError(null);
        setSuccess(false);

        try {
            await onChangePassword({
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword,
            });
            setSuccess(true);
            setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setTimeout(() => setSuccess(false), 5000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Błąd zmiany hasła');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-themed">Zmiana hasła</h2>
                    <p className="text-sm text-themed-muted">Zaktualizuj hasło do konta</p>
                </div>
                {success && (
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Hasło zmienione
                    </div>
                )}
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3 text-red-700 dark:text-red-400">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-sm">{error}</p>
                </div>
            )}

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-themed-label mb-2">
                        Obecne hasło
                    </label>
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-themed-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <input
                            type={showCurrentPassword ? 'text' : 'password'}
                            value={formData.currentPassword}
                            onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                            className="w-full pl-10 pr-12 py-2.5 border rounded-lg input-themed focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                            placeholder="••••••••"
                        />
                        <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-themed-muted hover:text-themed"
                        >
                            {showCurrentPassword ? (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-themed-label mb-2">
                        Nowe hasło
                    </label>
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-themed-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <input
                            type={showNewPassword ? 'text' : 'password'}
                            value={formData.newPassword}
                            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                            className="w-full pl-10 pr-12 py-2.5 border rounded-lg input-themed focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                            placeholder="••••••••"
                        />
                        <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-themed-muted hover:text-themed"
                        >
                            {showNewPassword ? (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            )}
                        </button>
                    </div>
                    {formData.newPassword && (
                        <div className="mt-2 flex flex-wrap gap-2">
                            {['Min. 8 znaków', 'Wielka litera', 'Mała litera', 'Cyfra'].map((req) => (
                                <span
                                    key={req}
                                    className={`text-xs px-2 py-1 rounded-full ${
                                        passwordErrors.includes(req)
                                            ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                            : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                    }`}
                                >
                  {passwordErrors.includes(req) ? '✗' : '✓'} {req}
                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-themed-label mb-2">
                        Potwierdź nowe hasło
                    </label>
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-themed-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            className={`w-full pl-10 pr-12 py-2.5 border rounded-lg input-themed focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 ${
                                formData.confirmPassword && !passwordsMatch
                                    ? 'border-red-300 dark:border-red-700'
                                    : ''
                            }`}
                            placeholder="••••••••"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-themed-muted hover:text-themed"
                        >
                            {showConfirmPassword ? (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            )}
                        </button>
                    </div>
                    {formData.confirmPassword && !passwordsMatch && (
                        <p className="text-xs text-red-500 dark:text-red-400 mt-1">Hasła nie są identyczne</p>
                    )}
                </div>
            </div>

            <div className="flex justify-end mt-8 pt-6 border-t divider-themed">
                <Button onClick={handleSubmit} disabled={!canSubmit || isSaving}>
                    {isSaving ? (
                        <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                            Zmieniam hasło...
                        </>
                    ) : (
                        'Zmień hasło'
                    )}
                </Button>
            </div>
        </Card>
    );
}
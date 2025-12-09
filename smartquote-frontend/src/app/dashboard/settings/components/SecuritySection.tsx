// src/app/dashboard/settings/components/SecuritySection.tsx

'use client';

import { useState } from 'react';
import { Lock, Eye, EyeOff, Loader2, Check, AlertCircle } from 'lucide-react';
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
                    <h2 className="text-lg font-semibold text-slate-900">Zmiana hasła</h2>
                    <p className="text-sm text-slate-500">Zaktualizuj hasło do konta</p>
                </div>
                {success && (
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                        <Check className="w-4 h-4" />
                        Hasło zmienione
                    </div>
                )}
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm">{error}</p>
                </div>
            )}

            <div className="space-y-6">
                {/* Current Password */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Obecne hasło
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type={showCurrentPassword ? 'text' : 'password'}
                            value={formData.currentPassword}
                            onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                            className="w-full pl-10 pr-12 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                            placeholder="••••••••"
                        />
                        <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                            {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* New Password */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Nowe hasło
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type={showNewPassword ? 'text' : 'password'}
                            value={formData.newPassword}
                            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                            className="w-full pl-10 pr-12 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                            placeholder="••••••••"
                        />
                        <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                            {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                    {formData.newPassword && (
                        <div className="mt-2 flex flex-wrap gap-2">
                            {['Min. 8 znaków', 'Wielka litera', 'Mała litera', 'Cyfra'].map((req) => (
                                <span
                                    key={req}
                                    className={`text-xs px-2 py-1 rounded-full ${
                                        passwordErrors.includes(req)
                                            ? 'bg-red-100 text-red-600'
                                            : 'bg-green-100 text-green-600'
                                    }`}
                                >
                                    {passwordErrors.includes(req) ? '✗' : '✓'} {req}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Confirm Password */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Potwierdź nowe hasło
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            className={`w-full pl-10 pr-12 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 ${
                                formData.confirmPassword && !passwordsMatch
                                    ? 'border-red-300'
                                    : 'border-slate-200'
                            }`}
                            placeholder="••••••••"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                    {formData.confirmPassword && !passwordsMatch && (
                        <p className="text-xs text-red-500 mt-1">Hasła nie są identyczne</p>
                    )}
                </div>
            </div>

            <div className="flex justify-end mt-8 pt-6 border-t border-slate-100">
                <Button onClick={handleSubmit} disabled={!canSubmit || isSaving}>
                    {isSaving ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
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
// src/app/dashboard/settings/components/ProfileSection.tsx
'use client';

import { useState, useRef } from 'react';
import { Card } from '@/components/ui';
import Button from '@/components/ui/Button';
import { compressImage } from '@/lib/imageUtils';
import type { UserProfile, UpdateProfileInput } from '@/types';

interface Props {
    profile: UserProfile;
    onUpdate: (data: UpdateProfileInput) => Promise<UserProfile>;
}

export default function ProfileSection({ profile, onUpdate }: Props) {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [success, setSuccess] = useState(false);
    const [avatarError, setAvatarError] = useState('');
    const [currentAvatar, setCurrentAvatar] = useState(profile.avatar || '');
    const [formData, setFormData] = useState({
        name: profile.name || '',
        phone: profile.phone || '',
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSave = async () => {
        setIsSaving(true);
        setSuccess(false);
        try {
            await onUpdate(formData);
            setSuccess(true);
            setIsEditing(false);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error: unknown) {
            console.error('Failed to update profile:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            name: profile.name || '',
            phone: profile.phone || '',
        });
        setIsEditing(false);
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setAvatarError('');

        if (!file.type.startsWith('image/')) {
            setAvatarError('Wybierz plik graficzny (PNG, JPG, WEBP)');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            setAvatarError('Plik jest za duży (max 2MB)');
            return;
        }

        setIsUploadingAvatar(true);
        try {
            const base64 = await compressImage(file, 200, 200, 0.8);
            await onUpdate({ avatar: base64 });
            setCurrentAvatar(base64);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error: unknown) {
            console.error('Failed to process avatar:', error);
            setAvatarError('Nie udało się przetworzyć zdjęcia');
        } finally {
            setIsUploadingAvatar(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRemoveAvatar = async () => {
        setIsUploadingAvatar(true);
        try {
            await onUpdate({ avatar: '' });
            setCurrentAvatar('');
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error: unknown) {
            console.error('Failed to remove avatar:', error);
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    return (
        <Card>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-themed">Profil użytkownika</h2>
                    <p className="text-sm text-themed-muted">Twoje dane osobowe</p>
                </div>
                {success && (
                    <div className="flex items-center gap-2 text-emerald-500 text-sm">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Zapisano
                    </div>
                )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 pb-8 border-b divider-themed">
                <div className="relative group">
                    {currentAvatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={currentAvatar}
                            alt="Avatar użytkownika"
                            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                        />
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                            {profile.name?.charAt(0)?.toUpperCase() || profile.email.charAt(0).toUpperCase()}
                        </div>
                    )}

                    <button
                        onClick={handleAvatarClick}
                        disabled={isUploadingAvatar}
                        className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-600 hover:text-cyan-600 hover:scale-110 transition-all disabled:opacity-50"
                    >
                        {isUploadingAvatar ? (
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        )}
                    </button>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleAvatarChange}
                        className="hidden"
                    />
                </div>

                <div className="text-center sm:text-left">
                    <p className="font-medium text-themed">{profile.name || 'Użytkownik'}</p>
                    <p className="text-sm text-themed-muted">{profile.email}</p>
                    <p className="text-xs text-themed-muted mt-1">
                        Konto utworzone: {new Date(profile.createdAt).toLocaleDateString('pl-PL')}
                    </p>

                    <div className="flex items-center gap-2 mt-3">
                        <button
                            onClick={handleAvatarClick}
                            disabled={isUploadingAvatar}
                            className="text-xs font-medium text-cyan-600 hover:text-cyan-700 flex items-center gap-1 disabled:opacity-50"
                        >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            {currentAvatar ? 'Zmień zdjęcie' : 'Dodaj zdjęcie'}
                        </button>
                        {currentAvatar && (
                            <>
                                <span className="text-themed-muted">|</span>
                                <button
                                    onClick={handleRemoveAvatar}
                                    disabled={isUploadingAvatar}
                                    className="text-xs font-medium text-red-500 hover:text-red-600 flex items-center gap-1 disabled:opacity-50"
                                >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Usuń
                                </button>
                            </>
                        )}
                    </div>

                    {avatarError && (
                        <p className="text-xs text-red-500 mt-2">{avatarError}</p>
                    )}
                    <p className="text-xs text-themed-muted mt-1">PNG, JPG lub WEBP do 2MB</p>
                </div>
            </div>

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-themed-label mb-2">
                        Imię i nazwisko
                    </label>
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-themed-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => {
                                setFormData({ ...formData, name: e.target.value });
                                setIsEditing(true);
                            }}
                            className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none transition-colors"
                            placeholder="Jan Kowalski"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-themed-label mb-2">
                        Email
                    </label>
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-themed-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <input
                            type="email"
                            value={profile.email}
                            disabled
                            className="w-full pl-10 pr-4 py-2.5 border rounded-xl cursor-not-allowed"
                        />
                    </div>
                    <p className="text-xs text-themed-muted mt-1">Email nie może być zmieniony</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-themed-label mb-2">
                        Telefon
                    </label>
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-themed-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => {
                                setFormData({ ...formData, phone: e.target.value });
                                setIsEditing(true);
                            }}
                            className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none transition-colors"
                            placeholder="+48 123 456 789"
                        />
                    </div>
                </div>
            </div>

            {isEditing && (
                <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t divider-themed">
                    <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                        Anuluj
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? (
                            <>
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                </svg>
                                Zapisywanie...
                            </>
                        ) : (
                            'Zapisz zmiany'
                        )}
                    </Button>
                </div>
            )}
        </Card>
    );
}
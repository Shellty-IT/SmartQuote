// src/app/dashboard/settings/components/ProfileSection.tsx
'use client';

import { useState, useRef } from 'react';
import { User, Mail, Phone, Camera, Loader2, Check, Upload, X } from 'lucide-react';
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
                        <Check className="w-4 h-4" />
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
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Camera className="w-4 h-4" />
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
                            <Upload className="w-3 h-3" />
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
                                    <X className="w-3 h-3" />
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
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-themed-muted" />
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
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-themed-muted" />
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
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-themed-muted" />
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
                                <Loader2 className="w-4 h-4 animate-spin" />
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
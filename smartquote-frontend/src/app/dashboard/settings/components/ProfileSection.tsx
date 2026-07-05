// src/app/dashboard/settings/components/ProfileSection.tsx
'use client';

import { useState, useRef } from 'react';
import { signOut } from 'next-auth/react';

import Button from '@/components/ui/Button';
import ImageCropModal from '@/components/ui/ImageCropModal';
import { useTranslations } from '@/i18n';
import { settingsApi } from '@/lib/api';
import type { UserProfile, UpdateProfileInput } from '@/types';

interface Props {
    profile: UserProfile;
    onUpdate: (data: UpdateProfileInput) => Promise<UserProfile>;
}

export default function ProfileSection({ profile, onUpdate }: Props) {
    const tr = useTranslations('settings');
    const commonTr = useTranslations('common');
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

    const [deleteConfirm, setDeleteConfirm] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState('');
    const [cropFile, setCropFile] = useState<File | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSave = async () => {
        setIsSaving(true);
        setSuccess(false);
        try {
            await onUpdate(formData);
            setSuccess(true);
            setIsEditing(false);
            setTimeout(() => setSuccess(false), 3000);
        } catch {
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setFormData({ name: profile.name || '', phone: profile.phone || '' });
        setIsEditing(false);
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAvatarError('');
        if (!file.type.startsWith('image/')) { setAvatarError(tr.profile.avatarSelectFile); return; }
        if (file.size > 2 * 1024 * 1024) { setAvatarError(tr.profile.avatarTooBig); return; }
        setCropFile(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleCropConfirm = async (dataUrl: string) => {
        setCropFile(null);
        setIsUploadingAvatar(true);
        try {
            await onUpdate({ avatar: dataUrl });
            setCurrentAvatar(dataUrl);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch {
            setAvatarError(tr.profile.avatarProcessError);
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const handleRemoveAvatar = async () => {
        setIsUploadingAvatar(true);
        try {
            await onUpdate({ avatar: '' });
            setCurrentAvatar('');
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch {
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirm !== tr.account.deleteConfirmWord) return;
        setIsDeleting(true);
        setDeleteError('');
        try {
            await settingsApi.deleteAccount();
            await signOut({ callbackUrl: '/' });
        } catch {
            setDeleteError(commonTr.errorTitle);
            setIsDeleting(false);
        }
    };

    return (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">{tr.profile.title}</h2>
                    <p className="text-sm text-muted-foreground">{tr.profile.subtitle}</p>
                </div>
                {success && (
                    <div className="flex items-center gap-2 text-status-accepted text-sm">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {commonTr.saved}
                    </div>
                )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 pb-8 border-b border-border">
                <div className="relative group">
                    {currentAvatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={currentAvatar} alt={tr.profile.title} className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" />
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-gradient-primary flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                            {profile.name?.charAt(0)?.toUpperCase() || profile.email.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                        className="absolute bottom-0 right-0 w-8 h-8 bg-card rounded-full shadow-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:scale-110 transition-all disabled:opacity-50"
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
                    <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatarChange} className="hidden" />
                </div>

                <div className="text-center sm:text-left">
                    <p className="font-medium text-foreground">{profile.name || tr.profile.userFallback}</p>
                    <p className="text-sm text-muted-foreground">{profile.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        {tr.profile.accountCreated} {new Date(profile.createdAt).toLocaleDateString()}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploadingAvatar}
                            className="text-xs font-medium text-primary hover:text-primary flex items-center gap-1 disabled:opacity-50"
                        >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            {currentAvatar ? tr.profile.changePicture : tr.profile.addPicture}
                        </button>
                        {currentAvatar && (
                            <>
                                <span className="text-muted-foreground">|</span>
                                <button
                                    onClick={handleRemoveAvatar}
                                    disabled={isUploadingAvatar}
                                    className="text-xs font-medium text-destructive hover:text-destructive flex items-center gap-1 disabled:opacity-50"
                                >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    {commonTr.remove}
                                </button>
                            </>
                        )}
                    </div>
                    {avatarError && <p className="text-xs text-destructive mt-2">{avatarError}</p>}
                    <p className="text-xs text-muted-foreground mt-1">{tr.profile.avatarHint}</p>
                </div>
            </div>

            <div className="space-y-6">
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">{tr.profile.nameLabel}</label>
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => { setFormData({ ...formData, name: e.target.value }); setIsEditing(true); }}
                            className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none transition-colors"
                            placeholder={tr.profile.namePlaceholder}
                        />
                    </div>
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">{tr.profile.emailLabel}</label>
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <input type="email" value={profile.email} disabled className="w-full pl-10 pr-4 py-2.5 border rounded-xl cursor-not-allowed" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{tr.profile.emailReadonly}</p>
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">{tr.profile.phoneLabel}</label>
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => { setFormData({ ...formData, phone: e.target.value }); setIsEditing(true); }}
                            className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none transition-colors"
                            placeholder={tr.profile.phonePlaceholder}
                        />
                    </div>
                </div>
            </div>

            {isEditing && (
                <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-border">
                    <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                        {commonTr.cancel}
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? (
                            <>
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                </svg>
                                {commonTr.saving}
                            </>
                        ) : commonTr.saveChanges}
                    </Button>
                </div>
            )}

            {/* Danger zone */}
            <div className="mt-8 rounded-xl border border-destructive/30 bg-destructive/5 p-5">
                <div className="mb-1 flex items-center gap-2">
                    <svg className="h-4 w-4 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-sm font-semibold text-destructive">{tr.account.dangerZone}</span>
                </div>
                <h3 className="text-base font-semibold text-foreground">{tr.account.deleteTitle}</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">{tr.account.deleteSubtitle}</p>

                <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
                    {tr.account.deleteWarning}
                </div>

                <div className="mt-4 space-y-3">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                            {tr.account.deleteConfirmLabel}
                        </label>
                        <input
                            type="text"
                            value={deleteConfirm}
                            onChange={(e) => setDeleteConfirm(e.target.value)}
                            placeholder={tr.account.deleteConfirmPlaceholder}
                            disabled={isDeleting}
                            className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-destructive focus:outline-none focus:ring-2 focus:ring-destructive/20 disabled:opacity-50"
                        />
                    </div>
                    {deleteError && (
                        <p className="text-sm text-destructive">{deleteError}</p>
                    )}
                    <button
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirm !== tr.account.deleteConfirmWord || isDeleting}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-destructive bg-destructive px-4 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {isDeleting ? (
                            <>
                                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                </svg>
                                {tr.account.deleting}
                            </>
                        ) : tr.account.deleteBtn}
                    </button>
                </div>
            </div>

            {cropFile && (
                <ImageCropModal
                    file={cropFile}
                    title={tr.profile.changePicture}
                    aspect={1}
                    shape="circle"
                    outputWidth={300}
                    outputHeight={300}
                    onCancel={() => setCropFile(null)}
                    onConfirm={handleCropConfirm}
                />
            )}
        </div>
    );
}

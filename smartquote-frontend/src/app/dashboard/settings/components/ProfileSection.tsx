// src/app/dashboard/settings/components/ProfileSection.tsx

'use client';

import { useState } from 'react';
import { User, Mail, Phone, Camera, Loader2, Check } from 'lucide-react';
import { Card } from '@/components/ui';
import Button from '@/components/ui/Button';
import type { UserProfile, UpdateProfileInput } from '@/types';

interface Props {
    profile: UserProfile;
    onUpdate: (data: UpdateProfileInput) => Promise<UserProfile>;
}

export default function ProfileSection({ profile, onUpdate }: Props) {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        name: profile.name || '',
        phone: profile.phone || '',
    });

    const handleSave = async () => {
        setIsSaving(true);
        setSuccess(false);
        try {
            await onUpdate(formData);
            setSuccess(true);
            setIsEditing(false);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
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

    return (
        <Card>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">Profil użytkownika</h2>
                    <p className="text-sm text-slate-500">Twoje dane osobowe</p>
                </div>
                {success && (
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                        <Check className="w-4 h-4" />
                        Zapisano
                    </div>
                )}
            </div>

            {/* Avatar */}
            <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-100">
                <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-3xl font-bold">
                        {profile.name?.charAt(0)?.toUpperCase() || profile.email.charAt(0).toUpperCase()}
                    </div>
                    <button className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-600 hover:text-cyan-600 transition-colors">
                        <Camera className="w-4 h-4" />
                    </button>
                </div>
                <div>
                    <p className="font-medium text-slate-900">{profile.name || 'Użytkownik'}</p>
                    <p className="text-sm text-slate-500">{profile.email}</p>
                    <p className="text-xs text-slate-400 mt-1">
                        Konto utworzone: {new Date(profile.createdAt).toLocaleDateString('pl-PL')}
                    </p>
                </div>
            </div>

            {/* Form */}
            <div className="space-y-6">
                {/* Name */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Imię i nazwisko
                    </label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => {
                                setFormData({ ...formData, name: e.target.value });
                                setIsEditing(true);
                            }}
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                            placeholder="Jan Kowalski"
                        />
                    </div>
                </div>

                {/* Email (readonly) */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Email
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="email"
                            value={profile.email}
                            disabled
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
                        />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Email nie może być zmieniony</p>
                </div>

                {/* Phone */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Telefon
                    </label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => {
                                setFormData({ ...formData, phone: e.target.value });
                                setIsEditing(true);
                            }}
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                            placeholder="+48 123 456 789"
                        />
                    </div>
                </div>
            </div>

            {/* Actions */}
            {isEditing && (
                <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
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
// src/app/dashboard/settings/components/CompanySection.tsx
'use client';

import { useState, useRef } from 'react';
import { Card } from '@/components/ui';
import Button from '@/components/ui/Button';
import { compressImage } from '@/lib/imageUtils';
import type { CompanyInfo, UpdateCompanyInfoInput } from '@/types';

interface Props {
    company: CompanyInfo;
    onUpdate: (data: UpdateCompanyInfoInput) => Promise<CompanyInfo>;
}

const PRESET_COLORS = [
    '#0891b2',
    '#0ea5e9',
    '#3b82f6',
    '#6366f1',
    '#8b5cf6',
    '#a855f7',
    '#d946ef',
    '#ec4899',
    '#f43f5e',
    '#ef4444',
    '#f97316',
    '#eab308',
    '#84cc16',
    '#22c55e',
    '#10b981',
    '#14b8a6',
];

export default function CompanySection({ company, onUpdate }: Props) {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [success, setSuccess] = useState(false);
    const [logoError, setLogoError] = useState('');
    const [currentLogo, setCurrentLogo] = useState(company.logo || '');
    const [formData, setFormData] = useState<UpdateCompanyInfoInput>({
        name: company.name || '',
        nip: company.nip || '',
        regon: company.regon || '',
        address: company.address || '',
        city: company.city || '',
        postalCode: company.postalCode || '',
        country: company.country || 'Polska',
        phone: company.phone || '',
        email: company.email || '',
        website: company.website || '',
        bankName: company.bankName || '',
        bankAccount: company.bankAccount || '',
        defaultPaymentDays: company.defaultPaymentDays || 14,
        defaultTerms: company.defaultTerms || '',
        defaultNotes: company.defaultNotes || '',
        primaryColor: company.primaryColor || '',
    });

    const logoInputRef = useRef<HTMLInputElement>(null);
    const colorInputRef = useRef<HTMLInputElement>(null);

    const handleChange = (field: keyof UpdateCompanyInfoInput, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setIsEditing(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSuccess(false);
        try {
            await onUpdate(formData);
            setSuccess(true);
            setIsEditing(false);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error: unknown) {
            console.error('Failed to update company:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            name: company.name || '',
            nip: company.nip || '',
            regon: company.regon || '',
            address: company.address || '',
            city: company.city || '',
            postalCode: company.postalCode || '',
            country: company.country || 'Polska',
            phone: company.phone || '',
            email: company.email || '',
            website: company.website || '',
            bankName: company.bankName || '',
            bankAccount: company.bankAccount || '',
            defaultPaymentDays: company.defaultPaymentDays || 14,
            defaultTerms: company.defaultTerms || '',
            defaultNotes: company.defaultNotes || '',
            primaryColor: company.primaryColor || '',
        });
        setIsEditing(false);
    };

    const handleLogoClick = () => {
        logoInputRef.current?.click();
    };

    const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLogoError('');

        if (!file.type.startsWith('image/')) {
            setLogoError('Wybierz plik graficzny (PNG, JPG, WEBP)');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            setLogoError('Plik jest za duży (max 2MB)');
            return;
        }

        setIsUploadingLogo(true);
        try {
            const base64 = await compressImage(file, 400, 400, 0.85);
            await onUpdate({ logo: base64 });
            setCurrentLogo(base64);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error: unknown) {
            console.error('Failed to process logo:', error);
            setLogoError('Nie udało się przetworzyć logo');
        } finally {
            setIsUploadingLogo(false);
            if (logoInputRef.current) {
                logoInputRef.current.value = '';
            }
        }
    };

    const handleRemoveLogo = async () => {
        setIsUploadingLogo(true);
        try {
            await onUpdate({ logo: '' });
            setCurrentLogo('');
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error: unknown) {
            console.error('Failed to remove logo:', error);
        } finally {
            setIsUploadingLogo(false);
        }
    };

    const handlePresetColor = (color: string) => {
        handleChange('primaryColor', color);
    };

    const handleResetColor = () => {
        handleChange('primaryColor', '');
    };

    const activeColor = formData.primaryColor || '#0891b2';

    return (
        <div className="space-y-6">
            <Card>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-semibold text-themed">Dane firmy</h2>
                        <p className="text-sm text-themed-muted">Informacje wyświetlane na ofertach i umowach</p>
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
                    <div
                        onClick={handleLogoClick}
                        className={`w-28 h-28 rounded-2xl flex items-center justify-center border-2 border-dashed transition-all cursor-pointer group ${
                            currentLogo
                                ? 'border-cyan-300 bg-white'
                                : 'border-slate-300 hover:border-cyan-400'
                        }`}
                        style={{ backgroundColor: currentLogo ? '#ffffff' : 'var(--section-bg)' }}
                    >
                        {isUploadingLogo ? (
                            <svg className="w-8 h-8 text-cyan-500 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                        ) : currentLogo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={currentLogo} alt="Logo firmy" className="w-full h-full object-contain rounded-xl p-2" />
                        ) : (
                            <div className="text-center">
                                <svg className="w-8 h-8 text-slate-400 group-hover:text-cyan-500 mx-auto mb-1 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-xs text-slate-400 group-hover:text-cyan-500 transition-colors">Dodaj logo</span>
                            </div>
                        )}
                    </div>

                    <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        onChange={handleLogoChange}
                        className="hidden"
                    />

                    <div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={handleLogoClick} disabled={isUploadingLogo}>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                {currentLogo ? 'Zmień logo' : 'Wgraj logo'}
                            </Button>
                            {currentLogo && (
                                <button
                                    onClick={handleRemoveLogo}
                                    disabled={isUploadingLogo}
                                    className="text-xs font-medium text-red-500 hover:text-red-600 flex items-center gap-1 px-2 py-1 disabled:opacity-50"
                                >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Usuń
                                </button>
                            )}
                        </div>
                        {logoError && <p className="text-xs text-red-500 mt-2">{logoError}</p>}
                        <p className="text-xs text-themed-muted mt-2">PNG, JPG lub WEBP do 2MB. Logo widoczne na ofertach i PDF.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-themed-label mb-2">Nazwa firmy</label>
                        <div className="relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-themed-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <input
                                type="text"
                                value={formData.name || ''}
                                onChange={(e) => handleChange('name', e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none transition-colors"
                                placeholder="Nazwa Twojej firmy"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-themed-label mb-2">NIP</label>
                        <input
                            type="text"
                            value={formData.nip || ''}
                            onChange={(e) => handleChange('nip', e.target.value)}
                            className="w-full px-4 py-2.5 border rounded-xl focus:outline-none transition-colors"
                            placeholder="123-456-78-90"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-themed-label mb-2">REGON</label>
                        <input
                            type="text"
                            value={formData.regon || ''}
                            onChange={(e) => handleChange('regon', e.target.value)}
                            className="w-full px-4 py-2.5 border rounded-xl focus:outline-none transition-colors"
                            placeholder="123456789"
                        />
                    </div>
                </div>
            </Card>

            <Card>
                <div className="flex items-center gap-2 mb-6">
                    <svg className="w-5 h-5 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                    <div>
                        <h3 className="text-lg font-semibold text-themed">Kolor firmowy</h3>
                        <p className="text-sm text-themed-muted">Kolor widoczny na publicznej stronie oferty (przyciski, akcenty, linki)</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start gap-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => colorInputRef.current?.click()}
                            className="w-14 h-14 rounded-xl border-2 border-slate-200 dark:border-slate-700 cursor-pointer transition-all hover:scale-105 hover:shadow-lg flex-shrink-0"
                            style={{ backgroundColor: activeColor }}
                        />
                        <input
                            ref={colorInputRef}
                            type="color"
                            value={activeColor}
                            onChange={(e) => handleChange('primaryColor', e.target.value)}
                            className="sr-only"
                        />
                        <div>
                            <p className="text-sm font-mono text-themed">{activeColor.toUpperCase()}</p>
                            <p className="text-xs text-themed-muted">
                                {formData.primaryColor ? 'Kolor niestandardowy' : 'Domyślny (cyan)'}
                            </p>
                        </div>
                    </div>

                    <div className="flex-1">
                        <p className="text-xs text-themed-muted mb-2">Szybki wybór:</p>
                        <div className="flex flex-wrap gap-2">
                            {PRESET_COLORS.map((color) => (
                                <button
                                    key={color}
                                    onClick={() => handlePresetColor(color)}
                                    className={`w-8 h-8 rounded-lg transition-all hover:scale-110 ${
                                        formData.primaryColor === color
                                            ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-900'
                                            : ''
                                    }`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                        {formData.primaryColor && (
                            <button
                                onClick={handleResetColor}
                                className="text-xs text-themed-muted hover:text-red-500 mt-3 flex items-center gap-1 transition-colors"
                            >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Przywróć domyślny kolor
                            </button>
                        )}
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t divider-themed">
                    <p className="text-xs text-themed-muted mb-3">Podgląd:</p>
                    <div className="flex flex-wrap gap-3">
                        <button
                            className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors"
                            style={{ backgroundColor: activeColor }}
                        >
                            Akceptuję ofertę
                        </button>
                        <span
                            className="px-3 py-1.5 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: activeColor }}
                        >
                            Wariant A
                        </span>
                        <span
                            className="text-sm font-semibold"
                            style={{ color: activeColor }}
                        >
                            OFR/2025/001
                        </span>
                    </div>
                </div>
            </Card>

            <Card>
                <h3 className="text-lg font-semibold text-themed mb-6">Adres</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-themed-label mb-2">Ulica i numer</label>
                        <div className="relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-themed-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <input
                                type="text"
                                value={formData.address || ''}
                                onChange={(e) => handleChange('address', e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none transition-colors"
                                placeholder="ul. Przykładowa 123/45"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-themed-label mb-2">Kod pocztowy</label>
                        <input
                            type="text"
                            value={formData.postalCode || ''}
                            onChange={(e) => handleChange('postalCode', e.target.value)}
                            className="w-full px-4 py-2.5 border rounded-xl focus:outline-none transition-colors"
                            placeholder="00-000"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-themed-label mb-2">Miasto</label>
                        <input
                            type="text"
                            value={formData.city || ''}
                            onChange={(e) => handleChange('city', e.target.value)}
                            className="w-full px-4 py-2.5 border rounded-xl focus:outline-none transition-colors"
                            placeholder="Warszawa"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-themed-label mb-2">Kraj</label>
                        <input
                            type="text"
                            value={formData.country || ''}
                            onChange={(e) => handleChange('country', e.target.value)}
                            className="w-full px-4 py-2.5 border rounded-xl focus:outline-none transition-colors"
                            placeholder="Polska"
                        />
                    </div>
                </div>
            </Card>

            <Card>
                <h3 className="text-lg font-semibold text-themed mb-6">Kontakt</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-themed-label mb-2">Telefon</label>
                        <div className="relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-themed-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <input
                                type="tel"
                                value={formData.phone || ''}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none transition-colors"
                                placeholder="+48 123 456 789"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-themed-label mb-2">Email firmowy</label>
                        <div className="relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-themed-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <input
                                type="email"
                                value={formData.email || ''}
                                onChange={(e) => handleChange('email', e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none transition-colors"
                                placeholder="kontakt@firma.pl"
                            />
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-themed-label mb-2">Strona internetowa</label>
                        <div className="relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-themed-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                            </svg>
                            <input
                                type="url"
                                value={formData.website || ''}
                                onChange={(e) => handleChange('website', e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none transition-colors"
                                placeholder="https://www.firma.pl"
                            />
                        </div>
                    </div>
                </div>
            </Card>

            <Card>
                <h3 className="text-lg font-semibold text-themed mb-6">Dane bankowe</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-themed-label mb-2">Nazwa banku</label>
                        <div className="relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-themed-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                            <input
                                type="text"
                                value={formData.bankName || ''}
                                onChange={(e) => handleChange('bankName', e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none transition-colors"
                                placeholder="Bank PKO"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-themed-label mb-2">Numer konta</label>
                        <input
                            type="text"
                            value={formData.bankAccount || ''}
                            onChange={(e) => handleChange('bankAccount', e.target.value)}
                            className="w-full px-4 py-2.5 border rounded-xl focus:outline-none transition-colors"
                            placeholder="00 1234 5678 9012 3456 7890 1234"
                        />
                    </div>
                </div>
            </Card>

            <Card>
                <h3 className="text-lg font-semibold text-themed mb-6">Domyślne wartości dla dokumentów</h3>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-themed-label mb-2">
                            Domyślny termin płatności (dni)
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="365"
                            value={formData.defaultPaymentDays || 14}
                            onChange={(e) => handleChange('defaultPaymentDays', parseInt(e.target.value) || 14)}
                            className="w-32 px-4 py-2.5 border rounded-xl focus:outline-none transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-themed-label mb-2">Domyślne warunki</label>
                        <div className="relative">
                            <svg className="absolute left-3 top-3 w-5 h-5 text-themed-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <textarea
                                value={formData.defaultTerms || ''}
                                onChange={(e) => handleChange('defaultTerms', e.target.value)}
                                rows={4}
                                className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none resize-none transition-colors"
                                placeholder="Warunki wyświetlane na ofertach i umowach..."
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-themed-label mb-2">Domyślne uwagi</label>
                        <textarea
                            value={formData.defaultNotes || ''}
                            onChange={(e) => handleChange('defaultNotes', e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2.5 border rounded-xl focus:outline-none resize-none transition-colors"
                            placeholder="Dodatkowe uwagi..."
                        />
                    </div>
                </div>
            </Card>

            {isEditing && (
                <div className="flex items-center justify-end gap-3">
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
        </div>
    );
}
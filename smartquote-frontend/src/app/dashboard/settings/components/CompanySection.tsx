// src/app/dashboard/settings/components/CompanySection.tsx
'use client';

import { useState, useRef } from 'react';
import {
    Building2,
    MapPin,
    Phone,
    Mail,
    Globe,
    CreditCard,
    FileText,
    Loader2,
    Check,
    Upload,
    X,
    Image
} from 'lucide-react';
import { Card } from '@/components/ui';
import Button from '@/components/ui/Button';
import { compressImage } from '@/lib/imageUtils';
import type { CompanyInfo, UpdateCompanyInfoInput } from '@/types';

interface Props {
    company: CompanyInfo;
    onUpdate: (data: UpdateCompanyInfoInput) => Promise<CompanyInfo>;
}

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
    });

    const logoInputRef = useRef<HTMLInputElement>(null);

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
                            <Check className="w-4 h-4" />
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
                            <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                        ) : currentLogo ? (
                            <img src={currentLogo} alt="Logo firmy" className="w-full h-full object-contain rounded-xl p-2" />
                        ) : (
                            <div className="text-center">
                                <Image className="w-8 h-8 text-slate-400 group-hover:text-cyan-500 mx-auto mb-1 transition-colors" />
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
                                <Upload className="w-4 h-4" />
                                {currentLogo ? 'Zmień logo' : 'Wgraj logo'}
                            </Button>
                            {currentLogo && (
                                <button
                                    onClick={handleRemoveLogo}
                                    disabled={isUploadingLogo}
                                    className="text-xs font-medium text-red-500 hover:text-red-600 flex items-center gap-1 px-2 py-1 disabled:opacity-50"
                                >
                                    <X className="w-3 h-3" />
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
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-themed-muted" />
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
                <h3 className="text-lg font-semibold text-themed mb-6">Adres</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-themed-label mb-2">Ulica i numer</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-themed-muted" />
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
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-themed-muted" />
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
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-themed-muted" />
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
                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-themed-muted" />
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
                            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-themed-muted" />
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
                            <FileText className="absolute left-3 top-3 w-5 h-5 text-themed-muted" />
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
                                <Loader2 className="w-4 h-4 animate-spin" />
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
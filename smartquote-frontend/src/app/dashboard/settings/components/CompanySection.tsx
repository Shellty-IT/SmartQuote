// src/app/dashboard/settings/components/CompanySection.tsx

'use client';

import { useState } from 'react';
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
    Upload
} from 'lucide-react';
import { Card } from '@/components/ui';
import Button from '@/components/ui/Button';
import type { CompanyInfo, UpdateCompanyInfoInput } from '@/types';

interface Props {
    company: CompanyInfo;
    onUpdate: (data: UpdateCompanyInfoInput) => Promise<CompanyInfo>;
}

export default function CompanySection({ company, onUpdate }: Props) {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [success, setSuccess] = useState(false);
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
        } catch (error) {
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

    return (
        <div className="space-y-6">
            {/* Basic Info */}
            <Card>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Dane firmy</h2>
                        <p className="text-sm text-slate-500">Informacje wyświetlane na ofertach i umowach</p>
                    </div>
                    {success && (
                        <div className="flex items-center gap-2 text-green-600 text-sm">
                            <Check className="w-4 h-4" />
                            Zapisano
                        </div>
                    )}
                </div>

                {/* Logo */}
                <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-100">
                    <div className="w-24 h-24 rounded-xl bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-300">
                        {company.logo ? (
                            <img src={company.logo} alt="Logo" className="w-full h-full object-contain rounded-xl" />
                        ) : (
                            <Building2 className="w-10 h-10 text-slate-400" />
                        )}
                    </div>
                    <div>
                        <Button variant="outline" size="sm">
                            <Upload className="w-4 h-4" />
                            Wgraj logo
                        </Button>
                        <p className="text-xs text-slate-400 mt-2">PNG, JPG do 2MB</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Company Name */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Nazwa firmy
                        </label>
                        <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                value={formData.name || ''}
                                onChange={(e) => handleChange('name', e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                                placeholder="Nazwa Twojej firmy"
                            />
                        </div>
                    </div>

                    {/* NIP */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            NIP
                        </label>
                        <input
                            type="text"
                            value={formData.nip || ''}
                            onChange={(e) => handleChange('nip', e.target.value)}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                            placeholder="123-456-78-90"
                        />
                    </div>

                    {/* REGON */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            REGON
                        </label>
                        <input
                            type="text"
                            value={formData.regon || ''}
                            onChange={(e) => handleChange('regon', e.target.value)}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                            placeholder="123456789"
                        />
                    </div>
                </div>
            </Card>

            {/* Address */}
            <Card>
                <h3 className="text-lg font-semibold text-slate-900 mb-6">Adres</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Street Address */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Ulica i numer
                        </label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                value={formData.address || ''}
                                onChange={(e) => handleChange('address', e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                                placeholder="ul. Przykładowa 123/45"
                            />
                        </div>
                    </div>

                    {/* Postal Code */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Kod pocztowy
                        </label>
                        <input
                            type="text"
                            value={formData.postalCode || ''}
                            onChange={(e) => handleChange('postalCode', e.target.value)}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                            placeholder="00-000"
                        />
                    </div>

                    {/* City */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Miasto
                        </label>
                        <input
                            type="text"
                            value={formData.city || ''}
                            onChange={(e) => handleChange('city', e.target.value)}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                            placeholder="Warszawa"
                        />
                    </div>

                    {/* Country */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Kraj
                        </label>
                        <input
                            type="text"
                            value={formData.country || ''}
                            onChange={(e) => handleChange('country', e.target.value)}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                            placeholder="Polska"
                        />
                    </div>
                </div>
            </Card>

            {/* Contact */}
            <Card>
                <h3 className="text-lg font-semibold text-slate-900 mb-6">Kontakt</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Telefon
                        </label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="tel"
                                value={formData.phone || ''}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                                placeholder="+48 123 456 789"
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Email firmowy
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="email"
                                value={formData.email || ''}
                                onChange={(e) => handleChange('email', e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                                placeholder="kontakt@firma.pl"
                            />
                        </div>
                    </div>

                    {/* Website */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Strona internetowa
                        </label>
                        <div className="relative">
                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="url"
                                value={formData.website || ''}
                                onChange={(e) => handleChange('website', e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                                placeholder="https://www.firma.pl"
                            />
                        </div>
                    </div>
                </div>
            </Card>

            {/* Bank Account */}
            <Card>
                <h3 className="text-lg font-semibold text-slate-900 mb-6">Dane bankowe</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Bank Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Nazwa banku
                        </label>
                        <div className="relative">
                            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                value={formData.bankName || ''}
                                onChange={(e) => handleChange('bankName', e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                                placeholder="Bank PKO"
                            />
                        </div>
                    </div>

                    {/* Bank Account */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Numer konta
                        </label>
                        <input
                            type="text"
                            value={formData.bankAccount || ''}
                            onChange={(e) => handleChange('bankAccount', e.target.value)}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                            placeholder="00 1234 5678 9012 3456 7890 1234"
                        />
                    </div>
                </div>
            </Card>

            {/* Default Values */}
            <Card>
                <h3 className="text-lg font-semibold text-slate-900 mb-6">Domyślne wartości dla dokumentów</h3>

                <div className="space-y-6">
                    {/* Payment Days */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Domyślny termin płatności (dni)
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="365"
                            value={formData.defaultPaymentDays || 14}
                            onChange={(e) => handleChange('defaultPaymentDays', parseInt(e.target.value) || 14)}
                            className="w-32 px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                        />
                    </div>

                    {/* Default Terms */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Domyślne warunki
                        </label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                            <textarea
                                value={formData.defaultTerms || ''}
                                onChange={(e) => handleChange('defaultTerms', e.target.value)}
                                rows={4}
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 resize-none"
                                placeholder="Warunki wyświetlane na ofertach i umowach..."
                            />
                        </div>
                    </div>

                    {/* Default Notes */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Domyślne uwagi
                        </label>
                        <textarea
                            value={formData.defaultNotes || ''}
                            onChange={(e) => handleChange('defaultNotes', e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 resize-none"
                            placeholder="Dodatkowe uwagi..."
                        />
                    </div>
                </div>
            </Card>

            {/* Actions */}
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
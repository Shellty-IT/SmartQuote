'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { leadsApi } from '@/lib/api/leads.api';
import { ApiError, getApiFieldErrors } from '@/lib/api';
import { Button, Input, Textarea } from '@/components/ui';
import { useToast } from '@/contexts/ToastContext';
import { useTranslations } from '@/i18n';
import type { CreateLeadInput } from '@/types/lead.types';

const SOURCE_OPTIONS = ['LinkedIn', 'OLX', 'Polecenie', 'Strona www', 'Inne'];

export default function NewLeadPage() {
    const router = useRouter();
    const toast = useToast();
    const tr = useTranslations('leads');
    const commonTr = useTranslations('common');
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<CreateLeadInput & { source: string }>({
        name: '',
        company: '',
        email: '',
        phone: '',
        source: '',
        notes: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formData.name || formData.name.trim().length < 2) {
            newErrors.name = 'Imię / nazwa musi mieć minimum 2 znaki';
        }
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Nieprawidłowy format email';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setIsLoading(true);
        try {
            const payload: CreateLeadInput = {
                name: formData.name.trim(),
                ...(formData.company?.trim() ? { company: formData.company.trim() } : {}),
                ...(formData.email?.trim() ? { email: formData.email.trim() } : {}),
                ...(formData.phone?.trim() ? { phone: formData.phone.trim() } : {}),
                ...(formData.source?.trim() ? { source: formData.source.trim() } : {}),
                ...(formData.notes?.trim() ? { notes: formData.notes.trim() } : {}),
            };
            const res = await leadsApi.create(payload);
            if (res.data?.id) {
                router.push(`/dashboard/leads/${res.data.id}`);
            } else {
                router.push('/dashboard/leads');
            }
        } catch (err) {
            const fieldErrors = getApiFieldErrors(err);
            if (Object.keys(fieldErrors).length > 0) {
                setErrors(fieldErrors);
                toast.error(commonTr.errorTitle, Object.values(fieldErrors)[0]);
            } else {
                toast.error(commonTr.errorTitle, err instanceof ApiError ? err.message : 'Nie udało się utworzyć leadu');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
            <div className="mb-8">
                <button
                    onClick={() => router.push('/dashboard/leads')}
                    className="mb-4 flex items-center gap-2 text-muted-foreground hover:opacity-70"
                >
                    <ArrowLeft className="h-4 w-4" />
                    {tr.backToList}
                </button>
                <h1 className="text-2xl font-bold">{tr.newLead}</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                    <h2 className="mb-4 text-lg font-semibold">Dane podstawowe</h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <Input
                                label={tr.name + ' *'}
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                error={errors.name}
                                placeholder="np. Jan Kowalski"
                                required
                            />
                        </div>
                        <Input
                            label={tr.company}
                            name="company"
                            value={formData.company ?? ''}
                            onChange={handleChange}
                            placeholder="np. TechCorp sp. z o.o."
                        />
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">{tr.source}</label>
                            <select
                                name="source"
                                value={formData.source ?? ''}
                                onChange={handleChange}
                                className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
                            >
                                <option value="">{tr.sourcePlaceholder}</option>
                                {SOURCE_OPTIONS.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                    <h2 className="mb-4 text-lg font-semibold">Kontakt</h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Input
                            label={tr.email}
                            name="email"
                            type="email"
                            value={formData.email ?? ''}
                            onChange={handleChange}
                            error={errors.email}
                            placeholder="jan@firma.pl"
                        />
                        <Input
                            label={tr.phone}
                            name="phone"
                            value={formData.phone ?? ''}
                            onChange={handleChange}
                            placeholder="+48 123 456 789"
                        />
                    </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                    <h2 className="mb-4 text-lg font-semibold">{tr.notes}</h2>
                    <Textarea
                        name="notes"
                        value={formData.notes ?? ''}
                        onChange={handleChange}
                        placeholder="Dodatkowe notatki o leadzie..."
                        rows={4}
                    />
                </div>

                <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => router.push('/dashboard/leads')}>
                        {commonTr.cancel}
                    </Button>
                    <Button type="submit" isLoading={isLoading}>
                        {tr.newLead}
                    </Button>
                </div>
            </form>
        </div>
    );
}

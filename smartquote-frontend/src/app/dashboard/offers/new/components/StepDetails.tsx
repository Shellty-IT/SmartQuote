// src/app/dashboard/offers/new/components/StepDetails.tsx

import { Input } from '@/components/ui';
import type { OfferDetails } from '../types';

interface StepDetailsProps {
    details: OfferDetails;
    onUpdate: <K extends keyof OfferDetails>(field: K, value: OfferDetails[K]) => void;
}

export default function StepDetails({ details, onUpdate }: StepDetailsProps) {
    return (
        <div>
            <h2 className="text-lg font-semibold text-themed mb-4">Szczegóły oferty</h2>
            <div className="space-y-4">
                <Input
                    label="Tytuł oferty"
                    value={details.title}
                    onChange={(e) => onUpdate('title', e.target.value)}
                    placeholder="np. System CRM dla firmy X"
                    required
                />

                <div>
                    <label className="block text-sm font-medium text-themed mb-1">Opis</label>
                    <textarea
                        value={details.description}
                        onChange={(e) => onUpdate('description', e.target.value)}
                        placeholder="Krótki opis zakresu oferty..."
                        rows={4}
                        style={{ resize: 'vertical', minHeight: '100px' }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-themed text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30 placeholder:text-slate-400"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Ważna do"
                        type="date"
                        value={details.validUntil}
                        onChange={(e) => onUpdate('validUntil', e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                    />
                    <Input
                        label="Termin płatności (dni)"
                        type="number"
                        value={details.paymentDays}
                        onChange={(e) => onUpdate('paymentDays', parseInt(e.target.value) || 14)}
                        min={0}
                        max={365}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-themed mb-1">Warunki płatności</label>
                    <textarea
                        value={details.terms}
                        onChange={(e) => onUpdate('terms', e.target.value)}
                        rows={2}
                        style={{ resize: 'vertical', minHeight: '70px' }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-themed text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30 placeholder:text-slate-400"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-themed mb-1">Notatki wewnętrzne</label>
                    <textarea
                        value={details.notes}
                        onChange={(e) => onUpdate('notes', e.target.value)}
                        placeholder="Notatki widoczne tylko dla Ciebie..."
                        rows={2}
                        style={{ resize: 'vertical', minHeight: '70px' }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-themed text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30 placeholder:text-slate-400"
                    />
                </div>

                <div className="p-4 card-themed border rounded-xl">
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={details.requireAuditTrail}
                            onChange={(e) => onUpdate('requireAuditTrail', e.target.checked)}
                            className="mt-0.5 w-5 h-5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                        />
                        <div>
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-cyan-600 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                <span className="text-sm font-medium text-themed">
                                    Formalne potwierdzenie akceptacji
                                </span>
                            </div>
                            <p className="text-xs text-themed-muted mt-1">
                                Przy akceptacji zostanie zapisany adres IP, przeglądarka oraz wygenerowany
                                cyfrowy odcisk treści (SHA-256). Klient otrzyma email z potwierdzeniem i hashem.
                                PDF będzie zawierał certyfikat akceptacji.
                            </p>
                        </div>
                    </label>
                </div>
            </div>
        </div>
    );
}